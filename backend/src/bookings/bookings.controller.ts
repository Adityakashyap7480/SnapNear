import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { type AppUser, Auth, CurrentUser } from '../auth/auth.guard.js';
import {
  type CancelBookingInput,
  type CreateBookingInput,
  type RateBookingInput,
  cancelBookingSchema,
  createBookingSchema,
  rateBookingSchema,
} from '../common/validation.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { ROLES } from '../constants/roles.js';
import { BookingsService } from './bookings.service.js';

/** Customer bookings. Payment endpoints for the same bookings live in PaymentsController. */
@Controller('bookings')
@Auth(ROLES.CLIENT)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: AppUser, @Body(new ZodPipe(createBookingSchema)) body: CreateBookingInput) {
    return this.bookings.create(user, body);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AppUser) {
    return this.bookings.listMine(user);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(cancelBookingSchema)) body: CancelBookingInput
  ) {
    return this.bookings.cancel(id, user, body);
  }

  @Post(':id/start-otp')
  @HttpCode(200)
  refreshStartOtp(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.bookings.refreshStartOtp(id, user);
  }

  /** After payment success — rate the photographer (updates their profile average). */
  @Post(':id/rate')
  @HttpCode(200)
  rate(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(rateBookingSchema)) body: RateBookingInput
  ) {
    return this.bookings.rate(id, user, body);
  }
}
