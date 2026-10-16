import { env } from '../config/env.js';
import { ACCOUNT_STATUS, type AccountStatus } from '../constants/roles.js';
import type { User } from '../repositories/users.repository.js';
import { ApiError } from './api-error.js';

const MESSAGES: Record<Exclude<AccountStatus, 'active'>, (email: string) => string> = {
  [ACCOUNT_STATUS.SUSPENDED]: (email) =>
    `Your SnapNear account has been temporarily suspended, so you can't log in right now. ` +
    `To get your account reviewed and restored, please email ${email} from your registered email address.`,
  [ACCOUNT_STATUS.BLOCKED]: (email) =>
    `Your SnapNear account has been blocked due to a violation of our Terms of Service. ` +
    `If you believe this is a mistake, please email ${email} from your registered email address.`,
};

export const isRestricted = (user: User | null) =>
  Boolean(user?.accountStatus) && user?.accountStatus !== ACCOUNT_STATUS.ACTIVE;

/** Everything the app needs to explain a restriction to the user. */
export function accountNotice(user: User) {
  const status = user.accountStatus as Exclude<AccountStatus, 'active'>;
  return {
    code: `ACCOUNT_${status.toUpperCase()}`,
    message: MESSAGES[status](env.supportEmail),
    account: {
      status,
      reason: user.statusReason || '',
      changedAt: user.statusChangedAt || null,
      supportEmail: env.supportEmail,
    },
  };
}

export function assertAccountActive(user: User) {
  if (!isRestricted(user)) return;
  const { message, ...extra } = accountNotice(user);
  throw ApiError.forbidden(message, extra);
}
