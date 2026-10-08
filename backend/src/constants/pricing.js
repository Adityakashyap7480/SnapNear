export const CREATOR_SHARE = 0.8;
export const PLATFORM_SHARE = 0.2;

export const SERVICE_TYPES = {
  photo: { id: 'photo', label: 'Photos Only' },
  video: { id: 'video', label: 'Video & Cinema' },
};

export const PRICING_TIERS = {
  photo: [
    { id: '1hr', label: '1 Hour', subtitle: 'Quick Solo / Insta', total: 500 },
    { id: '2hr', label: '2 Hours', subtitle: 'Birthdays / Family', total: 900 },
    { id: '4hr', label: '4 Hours', subtitle: 'Half Day Party', total: 1600 },
    { id: '1day', label: '1 Day', subtitle: 'Full Day Coverage', total: 3000 },
  ],
  video: [
    { id: '1hr', label: '1 Hour', subtitle: 'Reels & High-Def Video', total: 999 },
    { id: '2hr', label: '2 Hours', subtitle: 'Cinematic Coverage', total: 1500 },
    { id: '4hr', label: '4 Hours', subtitle: 'Half Day Cinema', total: 2500 },
    { id: '1day', label: '1 Day', subtitle: 'Full Day Cinematography', total: 5000 },
  ],
};

export const OCCASIONS = [
  'Birthday Celebration',
  'Instagram / Fashion Shoot',
  'Baby & Maternity',
  'Family Portrait',
  'Society / Clubhouse Event',
  'Pre-Wedding / Couple',
  'Product / Business',
];

export const TIME_SLOTS = [
  'Immediate / ASAP',
  'Morning (10:00 AM - 12:00 PM)',
  'Afternoon (02:00 PM - 04:00 PM)',
  'Golden Hour (04:30 PM - 06:30 PM)',
  'Night Party (07:00 PM - 10:00 PM)',
];

const round2 = (n) => Math.round(n * 100) / 100;

export function getQuote(serviceType, durationId) {
  const tiers = PRICING_TIERS[serviceType];
  if (!tiers) return null;
  const tier = tiers.find((t) => t.id === durationId);
  if (!tier) return null;

  const platformFee = round2(tier.total * PLATFORM_SHARE);
  return {
    serviceType,
    serviceLabel: SERVICE_TYPES[serviceType].label,
    durationId: tier.id,
    durationLabel: tier.label,
    total: tier.total,
    creatorPayout: round2(tier.total - platformFee),
    platformFee,
  };
}
