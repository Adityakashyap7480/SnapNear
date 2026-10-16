import { Controller, Get } from '@nestjs/common';
import { env } from '../config/env.js';
import {
  CREATOR_SHARE,
  OCCASIONS,
  PLATFORM_SHARE,
  PRICING_TIERS,
  SERVICE_LABELS,
  TIME_SLOTS,
  getQuote,
} from '../constants/pricing.js';

@Controller()
export class CatalogController {
  @Get('health')
  health() {
    return { success: true, status: 'ok', time: new Date().toISOString() };
  }

  /** Public prices and booking options the apps render, so they never hardcode them. */
  @Get('catalog')
  catalog() {
    const tiers = Object.fromEntries(
      Object.entries(PRICING_TIERS).map(([type, list]) => [
        type,
        list.map((t) => ({ ...t, ...getQuote(type, t.id) })),
      ])
    );

    return {
      success: true,
      catalog: {
        creatorShare: CREATOR_SHARE,
        platformShare: PLATFORM_SHARE,
        serviceTypes: Object.values(SERVICE_LABELS),
        tiers,
        occasions: OCCASIONS,
        timeSlots: TIME_SLOTS,
        startOtpLength: env.startOtp.length,
        payoutHoldDays: env.payoutHoldDays,
        supportEmail: env.supportEmail,
      },
    };
  }
}
