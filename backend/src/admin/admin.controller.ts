import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Auth } from '../auth/auth.guard.js';
import {
  type AdminBookingQuery,
  type AdminListQuery,
  type MarkPayoutInput,
  type UpdateUserStatusInput,
  adminBookingQuerySchema,
  adminListQuerySchema,
  markPayoutSchema,
  updateUserStatusSchema,
} from '../common/validation.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { ROLES } from '../constants/roles.js';
import { AdminService } from './admin.service.js';
import { PayoutsService } from './payouts.service.js';

@Controller('admin')
@Auth(ROLES.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly payouts: PayoutsService
  ) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('bookings')
  listBookings(@Query(new ZodPipe(adminBookingQuerySchema)) query: AdminBookingQuery) {
    return this.admin.listBookings(query);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.admin.cancelBooking(id);
  }

  @Get('clients')
  listClients(@Query(new ZodPipe(adminListQuerySchema)) query: AdminListQuery) {
    return this.admin.listClients(query);
  }

  @Get('creators')
  listCreators(@Query(new ZodPipe(adminListQuerySchema)) query: AdminListQuery) {
    return this.admin.listCreators(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body(new ZodPipe(updateUserStatusSchema)) body: UpdateUserStatusInput) {
    return this.admin.updateUserStatus(id, body);
  }

  @Get('payouts')
  listPayouts() {
    return this.payouts.list();
  }

  @Post('payouts')
  @HttpCode(201)
  markPayoutPaid(@Body(new ZodPipe(markPayoutSchema)) body: MarkPayoutInput) {
    return this.payouts.markPaid(body);
  }
}
