/** Every page path in the app. */
export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  PRIVACY: '/privacy',
  DELETE_ACCOUNT: '/delete-account',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  BOOK: '/book',
  PARTNER: '/partner',
  OWNER: '/owner',
  PROFILE: '/profile',
  PROFILE_BOOKINGS: '/profile/bookings',
  /** Partner earnings & UPI payout settings (avoid the word "wallet" in the public URL). */
  PROFILE_WALLET: '/profile/earnings',
} as const);
