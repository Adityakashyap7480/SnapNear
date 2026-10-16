import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../constants/roles.js';

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken({ id, role }: { id: string; role: Role }) {
  return jwt.sign({ sub: id, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
