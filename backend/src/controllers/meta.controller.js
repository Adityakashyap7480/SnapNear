import {
  CREATOR_SHARE,
  OCCASIONS,
  PLATFORM_SHARE,
  PRICING_TIERS,
  SERVICE_TYPES,
  TIME_SLOTS,
  getQuote,
} from '../constants/pricing.js';

export function getCatalog(_req, res) {
  const tiers = Object.fromEntries(
    Object.entries(PRICING_TIERS).map(([type, list]) => [
      type,
      list.map((t) => ({ ...t, ...getQuote(type, t.id) })),
    ])
  );

  res.json({
    success: true,
    catalog: {
      creatorShare: CREATOR_SHARE,
      platformShare: PLATFORM_SHARE,
      serviceTypes: Object.values(SERVICE_TYPES),
      tiers,
      occasions: OCCASIONS,
      timeSlots: TIME_SLOTS,
    },
  });
}
