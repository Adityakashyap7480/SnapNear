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
  ResetPasswordInput,
  SignupInput,
  UpdateMeInput,
} from '../common/validation.js';
import { env } from '../config/env.js';
import { ADMIN_EVENTS } from '../constants/events.js';
import { ROLES } from '../constants/roles.js';
import { users } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { type User, UsersRepository, toPublicUser } from '../repositories/users.repository.js';
import { verifyGoogleIdToken } from './google.js';
import { MailService } from './mail.service.js';
import { SUPER_ADMIN, superAdminProfile } from './super-admin.js';
import { signToken } from './token.js';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const RESET_TTL_MS = 60 * 60 * 1000;
const FORGOT_OK = { success: true as const, message: 'If that email is registered, we sent a reset link.' };

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
    if (email === SUPER_ADMIN.email) return FORGOT_OK;

    const user = await this.users.findByEmailWithPassword(email);
    if (!user) return FORGOT_OK;

    const raw = crypto.randomBytes(32).toString('base64url');
    await this.users.update(user, {
      passwordResetTokenHash: hashToken(raw),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    });

    const resetUrl = `${env.appPublicUrl}/reset-password?token=${encodeURIComponent(raw)}`;
    try {
      await this.mail.sendPasswordReset(user.email, resetUrl);
    } catch {
      throw ApiError.badRequest('Could not send reset email. Please try again later or contact support.');
    }
    return FORGOT_OK;
  }

  async resetPassword({ token, password }: ResetPasswordInput) {
    const tokenHash = hashToken(token);
    const [row] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.passwordResetTokenHash, tokenHash))
      .limit(1);

    if (!row?.passwordResetExpiresAt || row.passwordResetExpiresAt.getTime() < Date.now()) {
      throw ApiError.badRequest('This reset link is invalid or has expired. Request a new one.');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    await this.database.db
      .update(users)
      .set({
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      })
      .where(eq(users.id, row.id));

    return { success: true, message: 'Password updated. You can log in now.' };
  }
}
