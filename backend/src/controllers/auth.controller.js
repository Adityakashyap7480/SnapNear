import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import superAdmin from '../config/superAdmin.js';
import { ROLES } from '../constants/roles.js';
import { notifyAdmins } from '../socket/index.js';
import { assertAccountActive } from '../utils/accountStatus.js';

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export const signup = asyncHandler(async (req, res) => {
  const { role, name, email, phone, password, city, services, experienceYears, gear, bio } = req.body;

  if (email === superAdmin.email) throw ApiError.conflict('This email is reserved');

  const existing = await User.exists({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    role,
    name,
    email,
    phone,
    password,
    city,
    creatorProfile:
      role === ROLES.CREATOR
        ? { services, experienceYears: experienceYears ?? 1, gear: gear || '', bio: bio || '', isOnline: false }
        : undefined,
  });

  notifyAdmins('user:new', { role: user.role, name: user.name });

  res.status(201).json({
    success: true,
    token: signToken({ id: user._id.toString(), role: user.role }),
    user: user.toPublicJSON(),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (email === superAdmin.email) {
    if (!safeEqual(password, superAdmin.password)) throw ApiError.unauthorized('Invalid email or password');
    const user = { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: ROLES.SUPER_ADMIN };
    return res.json({ success: true, token: signToken(user), user });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  assertAccountActive(user);

  user.lastLoginAt = new Date();
  await user.save();

  return res.json({
    success: true,
    token: signToken({ id: user._id.toString(), role: user.role }),
    user: user.toPublicJSON(),
  });
});

export const me = asyncHandler(async (req, res) => {
  const { doc, ...user } = req.user;
  res.json({ success: true, user });
});
