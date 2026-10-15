import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import superAdmin from '../config/superAdmin.js';
import { ROLES } from '../constants/roles.js';
import { ADMIN_EVENTS } from '../constants/events.js';
import { notifyAdmins } from '../socket/index.js';
import { assertAccountActive } from '../utils/accountStatus.js';
import { comparePassword, createUser, emailExists, findUserByEmail, toPublicUser, updateUser } from '../models/users.js';

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const sessionFor = (user) => ({
  success: true,
  token: signToken({ id: user.id, role: user.role }),
  user: toPublicUser(user),
});

export const signup = asyncHandler(async (req, res) => {
  const { role, name, email, phone, password, city, services, experienceYears, gear, bio } = req.body;

  if (email === superAdmin.email) throw ApiError.conflict('This email is reserved');
  if (await emailExists(email)) throw ApiError.conflict('An account with this email already exists');

  const user = await createUser({
    role,
    name,
    email,
    phone,
    password,
    city,
    creatorProfile:
      role === ROLES.CREATOR
        ? { services, experienceYears: experienceYears ?? 1, gear: gear || '', bio: bio || '', isOnline: false }
        : null,
  });

  notifyAdmins(ADMIN_EVENTS.USER_NEW, { role: user.role, name: user.name });

  res.status(201).json(sessionFor(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (email === superAdmin.email) {
    if (!safeEqual(password, superAdmin.password)) throw ApiError.unauthorized('Invalid email or password');
    const user = { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: ROLES.SUPER_ADMIN };
    return res.json({ success: true, token: signToken(user), user });
  }

  const user = await findUserByEmail(email, { withPassword: true });
  if (!user || !(await comparePassword(user, password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  assertAccountActive(user);

  return res.json(sessionFor(await updateUser(user, { lastLoginAt: new Date() })));
});

export const me = asyncHandler(async (req, res) => {
  const { doc, ...user } = req.user;
  res.json({ success: true, user });
});
