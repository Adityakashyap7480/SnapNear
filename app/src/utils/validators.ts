// Keep in sync with backend/src/common/validation.ts
export const PATTERNS = Object.freeze({
  EMAIL: /^\S+@\S+\.\S+$/,
  PHONE: /^[6-9]\d{9}$/,
  UPI_ID: /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.]{1,63}$/,
});

export const MESSAGES = Object.freeze({
  EMAIL: 'Enter a valid email address',
  PHONE: 'Enter a valid 10-digit mobile number',
  UPI_ID: 'Enter a valid UPI ID, e.g. name@okaxis',
});

export const isValidEmail = (value = '') => PATTERNS.EMAIL.test(value.trim());
export const isValidPhone = (value = '') => PATTERNS.PHONE.test(value.trim());
export const isValidUpiId = (value = '') => PATTERNS.UPI_ID.test(value.trim().toLowerCase());
