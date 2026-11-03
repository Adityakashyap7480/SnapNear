import { Injectable, type OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { UpdateSessionPricesInput } from '../common/validation.js';
import {
  SERVICE_LABELS,
  applyPriceOverrides,
  getLivePrices,
  sanitizeOverrides,
  type SessionPriceOverrides,
} from '../constants/pricing.js';
import { SESSION_PACKAGES } from '../constants/session-packages.js';
import { DatabaseService } from '../database/database.service.js';
import { appSettings } from '../database/schema.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';

const SETTINGS_KEY = 'session_prices';

export interface PackageRate {
  id: string;
  label: string;
  subtitle: string;
  price: number;
}

export interface ServiceRates {
  service: 'photo' | 'video';
  serviceLabel: string;
  packages: PackageRate[];
}

@Injectable()
export class PricingService implements OnModuleInit {
  constructor(
    private readonly database: DatabaseService,
    private readonly realtime: RealtimeGateway
  ) {}

  private get db() {
    return this.database.db;
  }

  async onModuleInit() {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.key, SETTINGS_KEY)).limit(1);
    applyPriceOverrides(row?.value);
  }

  /** Every session package the Super Admin can edit, for Photos and Video. */
  sessionRates(): { photo: ServiceRates; video: ServiceRates } {
    const prices = getLivePrices();
    const build = (service: 'photo' | 'video'): ServiceRates => ({
      service,
      serviceLabel: SERVICE_LABELS[service].label,
      packages: SESSION_PACKAGES.map((pack) => ({
        id: pack.id,
        label: pack.label,
        subtitle: pack[service].subtitle,
        price: prices[service][pack.id],
      })),
    });
    return { photo: build('photo'), video: build('video') };
  }

  async updateSessionPrices(input: UpdateSessionPricesInput) {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.key, SETTINGS_KEY)).limit(1);
    const current = sanitizeOverrides(row?.value);
    const next: SessionPriceOverrides = {
      photo: { ...current.photo, ...input.photo },
      video: { ...current.video, ...input.video },
    };
    await this.db
      .insert(appSettings)
      .values({ key: SETTINGS_KEY, value: next })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: next, updatedAt: new Date() },
      });
    applyPriceOverrides(next);
    this.realtime.notifyCatalogUpdated();
    return this.sessionRates();
  }
}
