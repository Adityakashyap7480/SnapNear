import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { assertAccountActive } from '../common/account-status.js';
import type { GoogleAuthInput, LoginInput, SignupInput } from '../common/validation.js';
import { ADMIN_EVENTS } from '../constants/events.js';
import { ROLES } from '../constants/roles.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { type User, UsersRepository, toPublicUser } from '../repositories/users.repository.js';
import { verifyGoogleIdToken } from './google.js';
import { SUPER_ADMIN, superAdminProfile } from './super-admin.js';
import { signToken } from './token.js';

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
    private readonly realtime: RealtimeGateway
  ) {}

  async signup(input: SignupInput) {
    const { role, name, email, phone, password, city, services, experienceYears, gear, bio } = input;

    if (email === SUPER_ADMIN.email) throw ApiError.conflict('This email is reserved');
    if (await this.users.emailExists(email)) throw ApiError.conflict('An account with this email already exists');

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
}
