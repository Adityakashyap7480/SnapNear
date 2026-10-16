import { Injectable, Logger } from '@nestjs/common';
import { and, arrayContains, eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { ROLES, type ServiceType } from '../constants/roles.js';
import { DatabaseService } from '../database/database.service.js';
import { creatorProfiles, deviceTokens, users } from '../database/schema.js';
import type { Booking } from '../database/schema.js';

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
};

@Injectable()
export class PushService {
  private readonly log = new Logger(PushService.name);

  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.db;
  }

  async registerToken(userId: string, token: string, platform: string) {
    const clean = token.trim();
    if (!clean) return;
    await this.db
      .insert(deviceTokens)
      .values({ userId, token: clean, platform: platform || 'unknown' })
      .onConflictDoUpdate({
        target: deviceTokens.token,
        set: { userId, platform: platform || 'unknown', updatedAt: new Date() },
      });
  }

  async unregisterToken(userId: string, token?: string) {
    if (token?.trim()) {
      await this.db.delete(deviceTokens).where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token.trim())));
      return;
    }
    await this.db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));
  }

  /** Online partners who offer this service type (same pool as the live feed). */
  async tokensForOnlineCreators(serviceType: ServiceType): Promise<string[]> {
    const rows = await this.db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .innerJoin(users, eq(users.id, deviceTokens.userId))
      .innerJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(
        and(
          eq(users.role, ROLES.CREATOR),
          eq(creatorProfiles.isOnline, true),
          arrayContains(creatorProfiles.services, [serviceType])
        )
      );
    return [...new Set(rows.map((r) => r.token).filter(Boolean))];
  }

  async tokensForUser(userId: string): Promise<string[]> {
    const rows = await this.db.select({ token: deviceTokens.token }).from(deviceTokens).where(eq(deviceTokens.userId, userId));
    return rows.map((r) => r.token).filter(Boolean);
  }

  async notifyNewShoot(booking: Booking) {
    const tokens = await this.tokensForOnlineCreators(booking.serviceType);
    if (!tokens.length) return;
    await this.send(
      tokens.map((to) => ({
        to,
        title: 'New SnapNear shoot',
        body: `${booking.occasion} • ${booking.serviceLabel} • ₹${Math.round(booking.creatorPayout)} for you`,
        data: { type: 'shoot_request', bookingId: booking.id, code: booking.code },
        sound: 'default',
        badge: 1,
        channelId: 'shoots',
        priority: 'high',
      }))
    );
  }

  async notifyShootAccepted(booking: Booking) {
    if (!booking.clientId) return;
    const tokens = await this.tokensForUser(booking.clientId);
    if (!tokens.length) return;
    const partner = booking.creatorName || 'A photographer';
    await this.send(
      tokens.map((to) => ({
        to,
        title: 'Photographer accepted!',
        body: `${partner} accepted your ${booking.occasion} shoot (${booking.code})`,
        data: { type: 'shoot_accepted', bookingId: booking.id, code: booking.code },
        sound: 'default',
        badge: 1,
        channelId: 'shoots',
        priority: 'high',
      }))
    );
  }

  private async send(messages: PushMessage[]) {
    if (!messages.length) return;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };
      if (env.expoAccessToken) headers.Authorization = `Bearer ${env.expoAccessToken}`;

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.log.warn(`Expo push HTTP ${res.status}: ${text.slice(0, 200)}`);
        return;
      }
      const body = (await res.json().catch(() => null)) as { data?: Array<{ status?: string; message?: string }> } | null;
      const tickets = body?.data || [];
      for (const ticket of tickets) {
        if (ticket.status === 'error') this.log.warn(`Expo push ticket error: ${ticket.message || 'unknown'}`);
      }
    } catch (err) {
      this.log.warn(`Expo push failed: ${(err as Error).message}`);
    }
  }
}
