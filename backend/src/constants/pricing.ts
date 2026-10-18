import { env } from '../config/env.js';
import type { ServiceType } from './roles.js';
import {
  DEFAULT_DURATION_MINUTES,
  SESSION_PACKAGES,
  type SessionPackageId,
} from './session-packages.js';

export const PLATFORM_SHARE = env.platformFeePercent / 100;
export const CREATOR_SHARE = (100 - env.platformFeePercent) / 100;

export const SERVICE_LABELS: Record<ServiceType, { id: ServiceType; label: string }> = {
  photo: { id: 'photo', label: 'Photos Only' },
  video: { id: 'video', label: 'Video & Cinema' },
};

export type DurationId = SessionPackageId;

export interface PricingTier {
  id: DurationId;
  label: string;
  subtitle: string;
  total: number;
}

// Testing only: SHOOT_TEST_MINUTES turns the 1 Hour package into an N-minute shoot
const TEST_TIER_ID: DurationId = '1hr';
const testMinutes = env.shootTestMinutes;

/** Shoot length per package; on-site timer counts down from this once the shoot starts. */
export const DURATION_MINUTES: Record<string, number> = {
  ...DEFAULT_DURATION_MINUTES,
  ...(testMinutes ? { [TEST_TIER_ID]: testMinutes } : {}),
};

const withTestMode = (tier: PricingTier): PricingTier =>
  testMinutes && tier.id === TEST_TIER_ID
    ? { ...tier, label: `${testMinutes} Min${testMinutes === 1 ? '' : 's'}`, subtitle: 'Test shoot' }
    : tier;

const { photo, video } = env.prices;

/** Built from SESSION_PACKAGES + live prices (env override or package defaults). */
const BASE_PRICING_TIERS: Record<ServiceType, PricingTier[]> = {
  photo: SESSION_PACKAGES.map((p) => ({
    id: p.id,
    label: p.label,
    subtitle: p.photo.subtitle,
    total: photo[p.id],
  })),
  video: SESSION_PACKAGES.map((p) => ({
    id: p.id,
    label: p.label,
    subtitle: p.video.subtitle,
    total: video[p.id],
  })),
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
  'Product / Business',
  'Car Shoot',
  'Pooja Shoot',
  'Vlog Shoot',
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
