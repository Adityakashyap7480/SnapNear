import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { ApiError } from '../common/api-error.js';
import { assertAccountActive } from '../common/account-status.js';
import type {
  ForgotPasswordInput,
  GoogleAuthInput,
  LoginInput,
  RequestSignupOtpInput,
  ResendSignupOtpInput,
  ResetPasswordInput,
  SignupInput,
  UpdateMeInput,
  VerifySignupOtpInput,
} from '../common/validation.js';
import { env } from '../config/env.js';
import { ADMIN_EVENTS } from '../constants/events.js';
import { ROLES } from '../constants/roles.js';
import { signupOtps, users } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { type User, UsersRepository, toPublicUser } from '../repositories/users.repository.js';
import { verifyGoogleIdToken } from './google.js';
import { MailService } from './mail.service.js';
import { SUPER_ADMIN, superAdminProfile } from './super-admin.js';
import { signToken } from './token.js';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const SIGNUP_OTP_TTL_MS = 10 * 60 * 1000;
const SIGNUP_OTP_MAX_ATTEMPTS = 5;
const FORGOT_OK = {
  success: true as const,
  message: 'If that email is registered, we sent a 6-digit code.',
};

type PendingSignupPayload = Omit<SignupInput, 'password'> & { passwordHash: string };

const newSignupOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const sessionFor = (user: User) => ({
  success: true,
  token: signToken({ id: user.id, role: user.role }),
  user: toPublicUser(user),
});

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly realtime: RealtimeGateway,
    private readonly mail: MailService,
    private readonly database: DatabaseService
  ) {}

  /** Used by signup (Book a shoot + Partner) before opening Google. */
  async checkEmail(email: string) {
    if (email === SUPER_ADMIN.email) return { available: false };
    return { available: !(await this.users.emailExists(email)) };
  }

  async signup(input: SignupInput) {
    // Kept for API compatibility — app uses request/verify OTP instead.
    return this.createAccountFromSignup(input);
  }

  /** Step 1: validate profile, email OTP, wait for verify before creating the user. */
  async requestSignupOtp(input: RequestSignupOtpInput) {
    const { email, password, ...rest } = input;

    if (email === SUPER_ADMIN.email) throw ApiError.conflict('This email is reserved');
    if (await this.users.emailExists(email)) {
      throw ApiError.conflict('An account with this email already exists. Please log in.');
    }

    const otp = newSignupOtp();
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const payload: PendingSignupPayload = { ...rest, email, passwordHash };

    await this.database.db
      .insert(signupOtps)
      .values({
        email,
        otpHash: hashToken(otp),
        payload: JSON.stringify(payload),
        attempts: 0,
        expiresAt: new Date(Date.now() + SIGNUP_OTP_TTL_MS),
      })
      .onConflictDoUpdate({
        target: signupOtps.email,
        set: {
          otpHash: hashToken(otp),
          payload: JSON.stringify(payload),
          attempts: 0,
          expiresAt: new Date(Date.now() + SIGNUP_OTP_TTL_MS),
          createdAt: new Date(),
        },
      });

    let sent = false;
    try {
      const result = await this.mail.sendSignupOtp(email, otp);
      sent = result.sent;
    } catch {
      throw ApiError.badRequest('Could not send verification email. Please try again later.');
    }

    return {
      success: true as const,
      email,
      expiresInSeconds: Math.floor(SIGNUP_OTP_TTL_MS / 1000),
      message: sent ? 'We sent a 6-digit code to your email.' : 'Email not configured — use the code shown below (dev only).',
      // Only when SMTP is missing in non-production so phone testing still works
      ...(!sent && !env.isProduction ? { devOtp: otp } : {}),
    };
  }

  async resendSignupOtp({ email }: ResendSignupOtpInput) {
    const [row] = await this.database.db.select().from(signupOtps).where(eq(signupOtps.email, email)).limit(1);
    if (!row) throw ApiError.badRequest('Start signup again — no pending verification for this email.');
    if (await this.users.emailExists(email)) {
      throw ApiError.conflict('An account with this email already exists. Please log in.');
    }

    const otp = newSignupOtp();
    await this.database.db
      .update(signupOtps)
      .set({
        otpHash: hashToken(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + SIGNUP_OTP_TTL_MS),
        createdAt: new Date(),
      })
      .where(eq(signupOtps.email, email));

    let sent = false;
    try {
      const result = await this.mail.sendSignupOtp(email, otp);
      sent = result.sent;
    } catch {
      throw ApiError.badRequest('Could not send verification email. Please try again later.');
    }

    return {
      success: true as const,
      email,
      expiresInSeconds: Math.floor(SIGNUP_OTP_TTL_MS / 1000),
      message: sent ? 'We sent a new code to your email.' : 'Email not configured — use the code shown below (dev only).',
      ...(!sent && !env.isProduction ? { devOtp: otp } : {}),
    };
  }

  /** Step 2: correct OTP → create account → session (dashboard). */
  async verifySignupOtp({ email, otp }: VerifySignupOtpInput) {
    const [row] = await this.database.db.select().from(signupOtps).where(eq(signupOtps.email, email)).limit(1);
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw ApiError.badRequest('This code is invalid or has expired. Request a new one.');
    }
    if (row.attempts >= SIGNUP_OTP_MAX_ATTEMPTS) {
      throw ApiError.tooManyRequests('Too many wrong codes. Request a new one.');
    }

    if (row.otpHash !== hashToken(otp)) {
      await this.database.db
        .update(signupOtps)
        .set({ attempts: row.attempts + 1 })
        .where(eq(signupOtps.email, email));
      const left = SIGNUP_OTP_MAX_ATTEMPTS - row.attempts - 1;
      throw ApiError.badRequest(
        left > 0 ? `Wrong code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong codes. Request a new one.'
      );
    }

    if (await this.users.emailExists(email)) {
      await this.database.db.delete(signupOtps).where(eq(signupOtps.email, email));
      throw ApiError.conflict('An account with this email already exists. Please log in.');
    }

    let pending: PendingSignupPayload;
    try {
      pending = JSON.parse(row.payload) as PendingSignupPayload;
    } catch {
      throw ApiError.badRequest('Start signup again — your pending details were lost.');
    }

    const user = await this.users.create({
      role: pending.role,
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      city: pending.city || '',
      creatorProfile:
        pending.role === ROLES.CREATOR
          ? {
              services: pending.services ?? [],
              experienceYears: pending.experienceYears ?? 1,
              gear: pending.gear || '',
              bio: pending.bio || '',
              isOnline: false,
            }
          : null,
    });

    await this.database.db.delete(signupOtps).where(eq(signupOtps.email, email));
    this.realtime.notifyAdmins(ADMIN_EVENTS.USER_NEW, { role: user.role, name: user.name });
    return sessionFor(user);
  }

  private async createAccountFromSignup(input: SignupInput) {
    const { role, name, email, phone, password, city, services, experienceYears, gear, bio } = input;

    if (email === SUPER_ADMIN.email) throw ApiError.conflict('This email is reserved');
    if (await this.users.emailExists(email)) {
      throw ApiError.conflict('An account with this email already exists. Please log in.');
    }

    const user = await this.users.create({
      role,
      name,
      email,
      phone,
      password,
      city,
      creatorProfile:
        role === ROLES.CREATOR
          ? { services: services ?? [], experienceYears: experienceYears ?? 1, gear: gear || '', bio: bio || '', isOnline: false }
          : null,
    });

    this.realtime.notifyAdmins(ADMIN_EVENTS.USER_NEW, { role: user.role, name: user.name });
    return sessionFor(user);
  }

  async login({ email, password }: LoginInput) {
    if (email === SUPER_ADMIN.email) {
      if (!safeEqual(password, SUPER_ADMIN.password)) throw ApiError.unauthorized('Invalid email or password');
      const user = superAdminProfile();
      return { success: true, token: signToken(user), user };
    }

    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !(await this.users.comparePassword(user, password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    assertAccountActive(user);

    return sessionFor(await this.users.update(user, { lastLoginAt: new Date() }));
  }

  /**
   * Google Sign-In: verifies the ID token (email ownership), then logs in an existing
   * user or creates one when signup profile fields are included.
   */
  async google(input: GoogleAuthInput) {
    const google = await verifyGoogleIdToken(input.idToken);

    if (google.email === SUPER_ADMIN.email) {
      throw ApiError.forbidden('Owner account cannot use Google sign-in. Use email and password.');
    }

    const existing = await this.users.findByEmailWithPassword(google.email);
    if (existing) {
      // Signup flow always sends role/phone — never silently create a second account
      if (input.role || input.phone) {
        throw ApiError.conflict('An account with this email already exists. Please log in.');
      }
      assertAccountActive(existing);
      return sessionFor(await this.users.update(existing, { lastLoginAt: new Date() }));
    }

    // First-time Google user — need the rest of the SnapNear profile
    if (!input.role || !input.phone) {
      throw new ApiError(404, 'No SnapNear account for this Google email. Please complete signup.', undefined, {
        code: 'NEED_SIGNUP',
        email: google.email,
        name: google.name,
      });
    }

    const password = input.password || `Gg${crypto.randomBytes(24).toString('base64url')}1a`;
    const user = await this.users.create({
      role: input.role,
      name: (input.name || google.name).trim(),
      email: google.email,
      phone: input.phone,
      password,
      city: input.city || '',
      creatorProfile:
        input.role === ROLES.CREATOR
          ? {
              services: input.services ?? [],
              experienceYears: input.experienceYears ?? 1,
              gear: input.gear || '',
              bio: input.bio || '',
              isOnline: false,
            }
          : null,
    });

    this.realtime.notifyAdmins(ADMIN_EVENTS.USER_NEW, { role: user.role, name: user.name });
    return sessionFor(user);
  }

  async updateMe(user: User, input: UpdateMeInput) {
    const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
    if (!Object.keys(changes).length) return { success: true, user: toPublicUser(user) };
    const withLocation =
      changes.latitude !== undefined && changes.longitude !== undefined && changes.address !== undefined
        ? { ...changes, locationUpdatedAt: new Date() }
        : changes;
    const updated = await this.users.update(user, withLocation);
    return { success: true, user: toPublicUser(updated) };
  }

  async forgotPassword({ email }: ForgotPasswordInput) {
    const base = {
      ...FORGOT_OK,
      email,
      expiresInSeconds: Math.floor(RESET_OTP_TTL_MS / 1000),
    };

    if (email === SUPER_ADMIN.email) return base;

    const user = await this.users.findByEmailWithPassword(email);
    if (!user) return base;

    const otp = newSignupOtp();
    await this.users.update(user, {
      passwordResetTokenHash: hashToken(otp),
      passwordResetExpiresAt: new Date(Date.now() + RESET_OTP_TTL_MS),
    });

    let sent = false;
    try {
      const result = await this.mail.sendPasswordResetOtp(user.email, otp);
      sent = result.sent;
    } catch {
      throw ApiError.badRequest('Could not send reset email. Please try again later or contact support.');
    }

    return {
      ...base,
      message: sent ? FORGOT_OK.message : 'Email not configured — use the code shown below (dev only).',
      ...(!sent && !env.isProduction ? { devOtp: otp } : {}),
    };
  }

  async resetPassword({ email, otp, password }: ResetPasswordInput) {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw ApiError.badRequest('This code is invalid or has expired. Request a new one.');
    }

    if (user.passwordResetTokenHash !== hashToken(otp)) {
      throw ApiError.badRequest('Wrong code. Check your email and try again.');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    await this.database.db
      .update(users)
      .set({
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    return { success: true, message: 'Password updated. You can log in now.' };
  }
}
