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

export type PriceBook = Record<ServiceType, Record<SessionPackageId, number>>;

/** Partial prices saved by Super Admin. Missing packages keep the env / package default. */
export type SessionPriceOverrides = {
  photo?: Partial<Record<SessionPackageId, number>>;
  video?: Partial<Record<SessionPackageId, number>>;
};

const PACKAGE_IDS = SESSION_PACKAGES.map((p) => p.id);

let livePrices: PriceBook = {
  photo: { ...env.prices.photo },
  video: { ...env.prices.video },
};

export function getLivePrices(): PriceBook {
  return livePrices;
}

const validRupee = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 500_000;

/** Keeps only known package ids and whole-rupee amounts. */
export function sanitizeOverrides(raw: unknown): SessionPriceOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as SessionPriceOverrides;
  const pick = (bag: SessionPriceOverrides['photo']): SessionPriceOverrides['photo'] => {
    if (!bag || typeof bag !== 'object') return undefined;
    const out: Partial<Record<SessionPackageId, number>> = {};
    for (const id of PACKAGE_IDS) {
      const n = bag[id];
      if (validRupee(n)) out[id] = n;
    }
    return Object.keys(out).length ? out : undefined;
  };
  return { photo: pick(source.photo), video: pick(source.video) };
}

/** Env / package defaults, then Super Admin overrides on top. */
export function applyPriceOverrides(raw: unknown): SessionPriceOverrides {
  const clean = sanitizeOverrides(raw);
  const next: PriceBook = {
    photo: { ...env.prices.photo },
    video: { ...env.prices.video },
  };
  for (const service of ['photo', 'video'] as const) {
    const bag = clean[service];
    if (!bag) continue;
    for (const id of PACKAGE_IDS) {
      const n = bag[id];
      if (n != null) next[service][id] = n;
    }
  }
  livePrices = next;
  return clean;
}

function tiersFor(service: ServiceType): PricingTier[] {
  return SESSION_PACKAGES.map((pack) =>
    withTestMode({
      id: pack.id,
      label: pack.label,
      subtitle: pack[service].subtitle,
      total: livePrices[service][pack.id],
    })
  );
}

/** Current packages. Prices can change without a restart. */
export function getPricingTiers(): Record<ServiceType, PricingTier[]> {
  return { photo: tiersFor('photo'), video: tiersFor('video') };
}

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
  const tiers = getPricingTiers()[serviceType as ServiceType];
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
