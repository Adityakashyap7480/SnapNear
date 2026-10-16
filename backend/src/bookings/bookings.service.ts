import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { AppUser } from '../auth/auth.guard.js';
import { ApiError } from '../common/api-error.js';
import { serializeBooking } from '../common/serializers.js';
import { newStartOtp, shootMinutesFor } from '../common/shoot-otp.js';
import type { CreateBookingInput } from '../common/validation.js';
import { env } from '../config/env.js';
import { BOOKING_EVENTS } from '../constants/events.js';
import { getQuote } from '../constants/pricing.js';
import { BOOKING_STATUS, type BookingStatus, PAYMENT_STATUS } from '../constants/roles.js';
import { DatabaseService } from '../database/database.service.js';
import { bookings } from '../database/schema.js';
import { PushService } from '../notifications/push.service.js';
import { PaymentsService, isPaymentDue } from '../payments/payments.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { BookingsRepository } from '../repositories/bookings.repository.js';

const OPEN_STATUSES: BookingStatus[] = [
  BOOKING_STATUS.SEARCHING,
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.SHOOTING,
];

const ownBooking = (id: string, client: AppUser) => and(eq(bookings.id, id), eq(bookings.clientId, client.doc.id));

@Injectable()
export class BookingsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly bookings: BookingsRepository,
    private readonly payments: PaymentsService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService
  ) {}

  async create(current: AppUser, data: CreateBookingInput) {
    const client = current.doc;

    const quote = getQuote(data.serviceType, data.durationId);
    if (!quote) throw ApiError.badRequest('Invalid service or duration');

    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    if (data.shootDate < todayIST) {
      throw ApiError.badRequest('Shoot date cannot be in the past');
    }

    const unpaid = await this.bookings.find(
      and(eq(bookings.clientId, client.id), eq(bookings.paymentStatus, PAYMENT_STATUS.DUE))
    );
    if (unpaid) {
      throw ApiError.conflict(
        `Please pay ₹${unpaid.total.toLocaleString('en-IN')} for your completed shoot ${unpaid.code} before booking a new one.`
      );
    }

    const openCount = await this.database.db.$count(
      bookings,
      and(eq(bookings.clientId, client.id), inArray(bookings.status, OPEN_STATUSES))
    );
    if (openCount >= env.maxActiveBookings) {
      throw ApiError.conflict(`You can have at most ${env.maxActiveBookings} active bookings at a time`);
    }

    const booking = await this.bookings.insert({
      code: await this.bookings.generateCode(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
      serviceType: quote.serviceType,
      serviceLabel: quote.serviceLabel,
      durationId: quote.durationId,
      durationLabel: quote.durationLabel,
      durationMinutes: shootMinutesFor(quote),
      occasion: data.occasion,
      shootDate: data.shootDate,
      timeSlot: data.timeSlot,
      address: data.address,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      notes: data.notes,
      total: quote.total,
      creatorPayout: quote.creatorPayout,
      platformFee: quote.platformFee,
    });

    this.realtime.notifyBookingChange(booking, BOOKING_EVENTS.CREATED);
    // Wake online partners even if SnapNear is in the background (WhatsApp-style banner + badge).
    void this.push.notifyNewShoot(booking);
    return { success: true, booking: serializeBooking(booking) };
  }

  async listMine(current: AppUser) {
    const list = await this.database.db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, current.doc.id))
      .orderBy(desc(bookings.createdAt))
      .limit(50);

    const synced = await Promise.all(
      list.map(async (b) => {
        // A partner who arrived before OTPs existed still needs one to start
        if (b.status === BOOKING_STATUS.ARRIVED && !b.startOtpCode) {
          return (await this.bookings.update(eq(bookings.id, b.id), newStartOtp())) || b;
        }
        // Catch QR / link payments that completed while nobody was watching
        if (!isPaymentDue(b) || (!b.paymentOrderId && !b.paymentLinkId)) return b;
        return this.payments.syncPaymentQuietly(b);
      })
    );

    const withPartners = await this.bookings.withCreators(synced);
    return { success: true, bookings: withPartners.map((b) => serializeBooking(b, { includeStartOtp: true })) };
  }

  /** Issues a fresh start OTP, e.g. after the partner typed the old one wrong too many times. */
  async refreshStartOtp(id: string, current: AppUser) {
    const booking = await this.bookings.update(
      and(ownBooking(id, current), eq(bookings.status, BOOKING_STATUS.ARRIVED)),
      newStartOtp()
    );

    if (!booking) throw ApiError.conflict('A new OTP is available only after your photographer arrives');
    return { success: true, booking: serializeBooking(await this.bookings.withCreator(booking), { includeStartOtp: true }) };
  }

  async cancel(id: string, current: AppUser) {
    const booking = await this.bookings.update(
      and(ownBooking(id, current), inArray(bookings.status, [BOOKING_STATUS.SEARCHING, BOOKING_STATUS.ASSIGNED])),
      { status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: 'client' }
    );

    if (!booking) {
      throw ApiError.conflict('This booking can no longer be cancelled');
    }

    const withPartner = await this.bookings.withCreator(booking);
    this.realtime.notifyBookingChange(withPartner, BOOKING_EVENTS.CANCELLED);
    return { success: true, booking: serializeBooking(withPartner) };
  }
}
