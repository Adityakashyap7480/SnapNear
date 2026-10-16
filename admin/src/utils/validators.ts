const EMAIL = /^\S+@\S+\.\S+$/;

export const EMAIL_MESSAGE = 'Enter a valid email address';

export const isValidEmail = (value = '') => EMAIL.test(value.trim());
