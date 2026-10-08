import { z } from 'zod';
import { OCCASIONS, PRICING_TIERS, TIME_SLOTS } from '../constants/pricing.js';

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
    services: z.array(z.enum(['photo', 'video'])).optional(),
    experienceYears: z.coerce.number().min(0).max(50).optional(),
    gear: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.role !== 'creator' || (d.services && d.services.length > 0), {
    message: 'Select at least one service (Photo or Video)',
    path: ['services'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

const durationIds = [...new Set(Object.values(PRICING_TIERS).flat().map((t) => t.id))];

export const createBookingSchema = z.object({
  serviceType: z.enum(['photo', 'video']),
  durationId: z.enum(durationIds),
  occasion: z.enum(OCCASIONS, { message: 'Pick a shoot occasion' }),
  shootDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid shoot date'),
  timeSlot: z.enum(TIME_SLOTS, { message: 'Pick a time slot' }),
  address: z.string().trim().min(8, 'Enter your full doorstep address').max(250),
  contactName: z.string().trim().min(2, 'Enter contact name').max(80),
  contactPhone: phone,
  notes: z.string().trim().max(300).optional().default(''),
});

export const dutyStatusSchema = z.object({
  isOnline: z.boolean(),
});

export const updateCreatorProfileSchema = z.object({
  services: z.array(z.enum(['photo', 'video'])).min(1).optional(),
  experienceYears: z.coerce.number().min(0).max(50).optional(),
  gear: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(300).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'blocked'], { message: 'Choose a valid account status' }),
  reason: z.string().trim().max(300, 'Keep the reason under 300 characters').optional().default(''),
});

export const adminBookingQuerySchema = z.object({
  status: z
    .enum(['all', 'searching', 'assigned', 'arrived', 'shooting', 'completed', 'cancelled', 'active'])
    .optional()
    .default('all'),
  q: z.string().trim().max(80).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});
