/** Every page path in the app. */
export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  BOOK: '/book',
  PARTNER: '/partner',
  OWNER: '/owner',
  PROFILE: '/profile',
  PROFILE_BOOKINGS: '/profile/bookings',
  PROFILE_WALLET: '/profile/wallet',
} as const);
