import ApiError from './ApiError.js';
import env from '../config/env.js';
import { ACCOUNT_STATUS } from '../constants/roles.js';

const MESSAGES = {
  [ACCOUNT_STATUS.SUSPENDED]: (email) =>
    `Your SnapNear account has been temporarily suspended, so you can't log in right now. ` +
    `To get your account reviewed and restored, please email ${email} from your registered email address.`,
  [ACCOUNT_STATUS.BLOCKED]: (email) =>
    `Your SnapNear account has been blocked due to a violation of our Terms of Service. ` +
    `If you believe this is a mistake, please email ${email} from your registered email address.`,
};

export const isRestricted = (user) => Boolean(user?.accountStatus) && user.accountStatus !== ACCOUNT_STATUS.ACTIVE;

/** Everything the app needs to explain a restriction to the user. */
export function accountNotice(user) {
  return {
    code: `ACCOUNT_${user.accountStatus.toUpperCase()}`,
    message: MESSAGES[user.accountStatus](env.supportEmail),
    account: {
      status: user.accountStatus,
      reason: user.statusReason || '',
      changedAt: user.statusChangedAt || null,
      supportEmail: env.supportEmail,
    },
  };
}

export function assertAccountActive(user) {
  if (!isRestricted(user)) return;
  const { message, ...extra } = accountNotice(user);
  throw ApiError.forbidden(message, extra);
}
