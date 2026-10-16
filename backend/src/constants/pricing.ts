import { env } from '../config/env.js';
import type { ServiceType } from './roles.js';

export const PLATFORM_SHARE = env.platformFeePercent / 100;
export const CREATOR_SHARE = (100 - env.platformFeePercent) / 100;

export const SERVICE_LABELS: Record<ServiceType, { id: ServiceType; label: string }> = {
  photo: { id: 'photo', label: 'Photos Only' },
  video: { id: 'video', label: 'Video & Cinema' },
};

type DurationId = '1hr' | '2hr' | '4hr' | '1day';

export interface PricingTier {
  id: DurationId;
  label: string;
  subtitle: string;
  total: number;
}

// Testing only: SHOOT_TEST_MINUTES turns this package into an N-minute shoot (label, timer and all)
const TEST_TIER_ID: DurationId = '1hr';
const testMinutes = env.shootTestMinutes;

// Shoot length per package; the on-site timer counts down from this once the shoot starts
export const DURATION_MINUTES: Record<string, number> = {
  '1hr': 60,
  '2hr': 120,
  '4hr': 240,
  '1day': 480,
  ...(testMinutes ? { [TEST_TIER_ID]: testMinutes } : {}),
};

const withTestMode = (tier: PricingTier): PricingTier =>
  testMinutes && tier.id === TEST_TIER_ID
    ? { ...tier, label: `${testMinutes} Min${testMinutes === 1 ? '' : 's'}`, subtitle: 'Test shoot' }
    : tier;

const { photo, video } = env.prices;

const BASE_PRICING_TIERS: Record<ServiceType, PricingTier[]> = {
  photo: [
    { id: '1hr', label: '1 Hour', subtitle: 'Quick Solo / Insta', total: photo['1hr'] },
    { id: '2hr', label: '2 Hours', subtitle: 'Birthdays / Family', total: photo['2hr'] },
    { id: '4hr', label: '4 Hours', subtitle: 'Half Day Party', total: photo['4hr'] },
    { id: '1day', label: '1 Day', subtitle: 'Full Day Coverage (8 hrs)', total: photo['1day'] },
  ],
  video: [
    { id: '1hr', label: '1 Hour', subtitle: 'Reels & High-Def Video', total: video['1hr'] },
    { id: '2hr', label: '2 Hours', subtitle: 'Cinematic Coverage', total: video['2hr'] },
    { id: '4hr', label: '4 Hours', subtitle: 'Half Day Cinema', total: video['4hr'] },
    { id: '1day', label: '1 Day', subtitle: 'Full Day Cinematography (8 hrs)', total: video['1day'] },
  ],
};

export const PRICING_TIERS = Object.fromEntries(
  Object.entries(BASE_PRICING_TIERS).map(([type, tiers]) => [type, tiers.map(withTestMode)])
) as Record<ServiceType, PricingTier[]>;

export const OCCASIONS = [
  'Birthday Celebration',
  'Instagram / Fashion Shoot',
  'Baby & Maternity',
  'Family Portrait',
  'Society / Clubhouse Event',
  'Pre-Wedding / Couple',
  'Product / Business',
] as const;

export const TIME_SLOTS = [
  'Immediate / ASAP',
  'Morning (10:00 AM - 12:00 PM)',
  'Afternoon (02:00 PM - 04:00 PM)',
  'Golden Hour (04:30 PM - 06:30 PM)',
  'Night Party (07:00 PM - 10:00 PM)',
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Quote {
  serviceType: ServiceType;
  serviceLabel: string;
  durationId: string;
  durationLabel: string;
  durationMinutes: number;
  total: number;
  creatorPayout: number;
  platformFee: number;
}

export function getQuote(serviceType: string, durationId: string): Quote | null {
  const tiers = PRICING_TIERS[serviceType as ServiceType];
  if (!tiers) return null;
  const tier = tiers.find((t) => t.id === durationId);
  if (!tier) return null;

  const platformFee = round2(tier.total * PLATFORM_SHARE);
  return {
    serviceType: serviceType as ServiceType,
    serviceLabel: SERVICE_LABELS[serviceType as ServiceType].label,
    durationId: tier.id,
    durationLabel: tier.label,
    durationMinutes: DURATION_MINUTES[tier.id],
    total: tier.total,
    creatorPayout: round2(tier.total - platformFee),
    platformFee,
  };
}
