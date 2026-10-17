import { z } from 'zod';
import { env } from '../config/env.js';
import { OCCASIONS, PRICING_TIERS, TIME_SLOTS } from '../constants/pricing.js';
import { SERVICE_TYPES } from '../constants/roles.js';

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const signupSchema = z
  .object({
    role: z.enum(['client', 'creator'], { message: 'Choose Customer or Partner' }),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email,
    phone,
    password,
    city: z.string().trim().max(80).optional().default(''),
    services: z.array(z.enum(SERVICE_TYPES)).optional(),
    experienceYears: z.coerce.number().int().min(0).max(50).optional(),
    gear: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.role !== 'creator' || (d.services && d.services.length > 0), {
    message: 'Select at least one service (Photo or Video)',
    path: ['services'],
  });
export type SignupInput = z.output<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.output<typeof loginSchema>;

export const pushTokenSchema = z.object({
  token: z.string().trim().min(20, 'Invalid push token').max(200),
  platform: z.enum(['android', 'ios', 'web', 'unknown']).optional().default('unknown'),
});
export type PushTokenInput = z.output<typeof pushTokenSchema>;

export const clearPushTokenSchema = z.object({
  token: z.string().trim().min(20).max(200).optional(),
});
export type ClearPushTokenInput = z.output<typeof clearPushTokenSchema>;

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
    phone: phone.optional(),
    city: z.string().trim().max(80).optional(),
    /** GPS reverse-geocode label — partners use this as their current base. */
    address: z.string().trim().min(8, 'Current location address is required').max(250).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
  })
  .superRefine((d, ctx) => {
    const hasLat = d.latitude !== undefined;
    const hasLng = d.longitude !== undefined;
    const hasAddr = d.address !== undefined;
    if (hasLat || hasLng || hasAddr) {
      if (!hasLat || !hasLng || !hasAddr) {
        ctx.addIssue({ code: 'custom', message: 'Share a complete current location (address + GPS)', path: ['address'] });
      }
    }
  });
export type UpdateMeInput = z.output<typeof updateMeSchema>;

/** Google ID token login, or first-time signup with the remaining profile fields. */
export const googleAuthSchema = z
  .object({
    idToken: z.string().trim().min(20, 'Google sign-in failed. Try again.'),
    // Present only when creating a new account
    role: z.enum(['client', 'creator']).optional(),
    name: z.string().trim().min(2).max(80).optional(),
    phone: phone.optional(),
    password: password.optional(),
    city: z.string().trim().max(80).optional().default(''),
    services: z.array(z.enum(SERVICE_TYPES)).optional(),
    experienceYears: z.coerce.number().int().min(0).max(50).optional(),
    gear: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.role !== 'creator' || (d.services && d.services.length > 0), {
    message: 'Select at least one service (Photo or Video)',
    path: ['services'],
  });
export type GoogleAuthInput = z.output<typeof googleAuthSchema>;

export const checkEmailSchema = z.object({ email });
export type CheckEmailInput = z.output<typeof checkEmailSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.output<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, 'Invalid or expired reset link'),
  password,
});
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>;

const durationIds = [...new Set(Object.values(PRICING_TIERS).flat().map((t) => t.id))];

export const createBookingSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  durationId: z.enum(durationIds),
  occasion: z.enum(OCCASIONS, { message: 'Pick a shoot occasion' }),
  shootDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid shoot date'),
  timeSlot: z.enum(TIME_SLOTS, { message: 'Pick a time slot' }),
  address: z.string().trim().min(8, 'Share your current location so we can fill the address').max(250),
  latitude,
  longitude,
  contactName: z.string().trim().min(2, 'Enter contact name').max(80),
  contactPhone: phone,
  notes: z.string().trim().max(300).optional().default(''),
});
export type CreateBookingInput = z.output<typeof createBookingSchema>;

export const dutyStatusSchema = z.object({
  isOnline: z.boolean(),
});

export const updateCreatorProfileSchema = z.object({
  services: z.array(z.enum(SERVICE_TYPES)).min(1).optional(),
  experienceYears: z.coerce.number().int().min(0).max(50).optional(),
  gear: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(300).optional(),
  upiId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{2,256}@[a-z][a-z0-9.]{1,63}$/, 'Enter a valid UPI ID, e.g. name@okaxis')
    .optional(),
});
export type UpdateCreatorProfileInput = z.output<typeof updateCreatorProfileSchema>;

const otpLength = env.startOtp.length;
export const startShootSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${otpLength}}$`), `Enter the ${otpLength}-digit OTP from the customer`),
});

const razorpayId = (prefix: string, label: string) =>
  z.string().trim().regex(new RegExp(`^${prefix}_[A-Za-z0-9]{6,40}$`), `Invalid ${label}`);

export const verifyPaymentSchema = z.object({
  orderId: razorpayId('order', 'order id'),
  paymentId: razorpayId('pay', 'payment id'),
  signature: z.string().trim().regex(/^[a-f0-9]{64}$/, 'Invalid payment signature'),
});
export type VerifyPaymentInput = z.output<typeof verifyPaymentSchema>;

export const markPayoutSchema = z.object({
  creatorId: z.string().trim().min(1, 'Invalid partner').max(64, 'Invalid partner'),
  reference: z.string().trim().max(80, 'Keep the reference under 80 characters').optional().default(''),
  note: z.string().trim().max(200, 'Keep the note under 200 characters').optional().default(''),
});
export type MarkPayoutInput = z.output<typeof markPayoutSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'blocked'], { message: 'Choose a valid account status' }),
  reason: z.string().trim().max(300, 'Keep the reason under 300 characters').optional().default(''),
});
export type UpdateUserStatusInput = z.output<typeof updateUserStatusSchema>;

export const adminBookingQuerySchema = z.object({
  status: z
    .enum(['all', 'searching', 'assigned', 'arrived', 'shooting', 'completed', 'cancelled', 'active', 'unpaid'])
    .optional()
    .default('all'),
  q: z.string().trim().max(80).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type AdminBookingQuery = z.output<typeof adminBookingQuerySchema>;
