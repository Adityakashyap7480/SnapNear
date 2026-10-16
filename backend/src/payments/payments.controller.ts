import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { and, eq } from 'drizzle-orm';
import { type AppUser, Auth, CurrentUser } from '../auth/auth.guard.js';
import { ApiError } from '../common/api-error.js';
import { serializeBooking } from '../common/serializers.js';
import { type VerifyPaymentInput, verifyPaymentSchema } from '../common/validation.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { ROLES } from '../constants/roles.js';
import { type Booking, bookings } from '../database/schema.js';
import { BookingsRepository } from '../repositories/bookings.repository.js';
import { PaymentsService } from './payments.service.js';
import { type RazorpayPayment, RazorpayService, toPaise } from './razorpay.service.js';

const PAID_EVENTS = new Set(['payment.captured', 'order.paid', 'payment_link.paid']);

interface WebhookEvent {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPayment };
    payment_link?: { entity?: { notes?: Record<string, unknown> } };
    order?: { entity?: { notes?: Record<string, unknown> } };
  };
}

@Controller()
export class PaymentsController {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly payments: PaymentsService,
    private readonly razorpay: RazorpayService
  ) {}

  private async paymentResponse(booking: Booking) {
    return { success: true, booking: serializeBooking(await this.bookings.withCreator(booking)) };
  }

  private async clientBooking(id: string, user: AppUser) {
    const booking = await this.bookings.find(and(eq(bookings.id, id), eq(bookings.clientId, user.doc.id)));
    if (!booking) throw ApiError.notFound('Booking not found');
    return booking;
  }

  private async creatorBooking(id: string, user: AppUser) {
    const booking = await this.bookings.find(and(eq(bookings.id, id), eq(bookings.creatorId, user.doc.id)));
    if (!booking) throw ApiError.notFound('Job not found');
    return booking;
  }

  // ----- Customer -----

  @Post('bookings/:id/pay')
  @HttpCode(200)
  @Auth(ROLES.CLIENT)
  async startCheckout(@Param('id') id: string, @CurrentUser() user: AppUser) {
    const checkout = await this.payments.createCheckout(await this.clientBooking(id, user));
    return { success: true, checkout };
  }

  @Post('bookings/:id/pay/verify')
  @HttpCode(200)
  @Auth(ROLES.CLIENT)
  async confirmCheckout(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(verifyPaymentSchema)) body: VerifyPaymentInput
  ) {
    const paid = await this.payments.verifyCheckout(await this.clientBooking(id, user), body);
    return this.paymentResponse(paid);
  }

  @Get('bookings/:id/payment')
  @Auth(ROLES.CLIENT)
  async clientPaymentStatus(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.paymentResponse(await this.payments.syncPayment(await this.clientBooking(id, user)));
  }

  // ----- Partner -----

  @Post('creator/jobs/:id/collect')
  @HttpCode(200)
  @Auth(ROLES.CREATOR)
  async collectLink(@Param('id') id: string, @CurrentUser() user: AppUser) {
    const booking = await this.creatorBooking(id, user);
    const link = await this.payments.getCollectLink(booking);
    return { success: true, link: { url: link.url, amount: booking.total, code: booking.code } };
  }

  @Get('creator/jobs/:id/payment')
  @Auth(ROLES.CREATOR)
  async creatorPaymentStatus(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.paymentResponse(await this.payments.syncPayment(await this.creatorBooking(id, user)));
  }

  // ----- Razorpay webhook (raw body, see main.ts) -----

  @Post('payments/razorpay/webhook')
  @HttpCode(200)
  async razorpayWebhook(@Req() req: Request) {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    if (!this.razorpay.isWebhookSignatureValid(rawBody, req.get('x-razorpay-signature'))) {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as WebhookEvent;
    const payment = event.payload?.payment?.entity;
    if (!event.event || !PAID_EVENTS.has(event.event) || !payment || payment.status !== 'captured') {
      return { success: true, ignored: true };
    }

    const bookingId =
      event.payload?.payment_link?.entity?.notes?.bookingId ||
      event.payload?.order?.entity?.notes?.bookingId ||
      payment.notes?.bookingId;

    const booking =
      (typeof bookingId === 'string' && (await this.bookings.findById(bookingId))) ||
      (payment.order_id && (await this.bookings.find(eq(bookings.paymentOrderId, payment.order_id))));

    if (booking && booking.paymentStatus && payment.amount >= toPaise(booking.total)) {
      const via = payment.order_id && payment.order_id === booking.paymentOrderId ? 'app' : 'qr';
      await this.payments.finalizePayment(booking, payment, via);
    }
    return { success: true };
  }
}
