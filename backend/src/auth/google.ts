import { OAuth2Client } from 'google-auth-library';
import { ApiError } from '../common/api-error.js';
import { env } from '../config/env.js';

const client = new OAuth2Client();

export interface GoogleIdentity {
  email: string;
  name: string;
  sub: string;
}

/** Verifies a Google ID token and returns the verified email + profile name. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (!env.googleClientIds.length) {
    throw ApiError.badRequest('Google sign-in is not configured on the server (GOOGLE_CLIENT_IDS)');
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientIds,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Google sign-in failed. Please try again.');
  }

  if (!payload?.email || !payload.email_verified) {
    throw ApiError.unauthorized('That Google account does not have a verified email');
  }

  return {
    email: payload.email.toLowerCase(),
    name: (payload.name || payload.email.split('@')[0] || 'SnapNear User').trim().slice(0, 80),
    sub: payload.sub,
  };
}
