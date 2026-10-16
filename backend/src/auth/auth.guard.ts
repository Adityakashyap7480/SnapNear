import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiError } from '../common/api-error.js';
import { assertAccountActive } from '../common/account-status.js';
import { ROLES, type Role } from '../constants/roles.js';
import { type PublicUser, type User, UsersRepository, toPublicUser } from '../repositories/users.repository.js';
import { SUPER_ADMIN, type SuperAdminUser, superAdminProfile } from './super-admin.js';
import { type TokenPayload, verifyToken } from './token.js';

/** A logged-in customer or partner, with the full database row in `doc`. */
export type AppUser = PublicUser & { doc: User };
export type RequestUser = SuperAdminUser | AppUser;

type AuthedRequest = Request & { user?: RequestUser };

const ROLES_KEY = 'roles';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersRepository
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    req.user = await this.authenticate(req);

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(req.user.role)) throw ApiError.forbidden();
    return true;
  }

  private async authenticate(req: Request): Promise<RequestUser> {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized();

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Session expired, please log in again');
    }

    if (payload.role === ROLES.SUPER_ADMIN && payload.sub === SUPER_ADMIN.id) return superAdminProfile();

    const user = await this.users.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Account no longer exists');
    assertAccountActive(user);

    return { ...toPublicUser(user), doc: user };
  }
}

/** Requires a valid login; when roles are given, only those roles get in. */
export const Auth = (...roles: Role[]) => applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard));

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().user
);
