import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { type AppUser, Auth, CurrentUser } from '../auth/auth.guard.js';
import {
  type CancelBookingInput,
  type UpdateCreatorProfileInput,
  cancelBookingSchema,
  dutyStatusSchema,
  startShootSchema,
  updateCreatorProfileSchema,
} from '../common/validation.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { ROLES } from '../constants/roles.js';
import { CreatorService } from './creator.service.js';

/** Partner app API. Payment endpoints for partner jobs live in PaymentsController. */
@Controller('creator')
@Auth(ROLES.CREATOR)
export class CreatorController {
  constructor(private readonly creator: CreatorService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AppUser) {
    return this.creator.dashboard(user);
  }

  @Post('terms/accept')
  @HttpCode(200)
  acceptTerms(@CurrentUser() user: AppUser) {
    return this.creator.acceptTerms(user);
  }

  /** Partner requests a payout of their current Wallet balance. */
  @Post('payout-request')
  @HttpCode(201)
  requestPayout(@CurrentUser() user: AppUser) {
    return this.creator.requestPayout(user);
  }

  @Patch('status')
  setDutyStatus(@CurrentUser() user: AppUser, @Body(new ZodPipe(dutyStatusSchema)) body: { isOnline: boolean }) {
    return this.creator.setDutyStatus(user, body.isOnline);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(updateCreatorProfileSchema)) body: UpdateCreatorProfileInput
  ) {
    return this.creator.updateProfile(user, body);
  }

  @Post('requests/:id/accept')
  @HttpCode(200)
  acceptRequest(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.creator.acceptRequest(id, user);
  }

  @Post('requests/:id/decline')
  @HttpCode(200)
  declineRequest(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.creator.declineRequest(id, user);
  }

  @Patch('jobs/:id/advance')
  advanceJob(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.creator.advanceJob(id, user);
  }

  /** Cancel assigned/arrived job before OTP (reason required). */
  @Patch('jobs/:id/cancel')
  cancelJob(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(cancelBookingSchema)) body: CancelBookingInput
  ) {
    return this.creator.cancelJob(id, user, body);
  }

  @Post('jobs/:id/start')
  @HttpCode(200)
  startShoot(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body(new ZodPipe(startShootSchema)) body: { otp: string }
  ) {
    return this.creator.startShoot(id, user, body.otp);
  }
}
