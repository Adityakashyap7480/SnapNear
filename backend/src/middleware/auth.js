import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import { findUserById, toPublicUser } from '../models/users.js';
import superAdmin from '../config/superAdmin.js';
import { ROLES } from '../constants/roles.js';
import { assertAccountActive } from '../utils/accountStatus.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  if (payload.role === ROLES.SUPER_ADMIN && payload.sub === superAdmin.id) {
    req.user = { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: ROLES.SUPER_ADMIN };
    return next();
  }

  const user = await findUserById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  assertAccountActive(user);

  req.user = { ...toPublicUser(user), doc: user };
  return next();
});

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    return next();
  };
