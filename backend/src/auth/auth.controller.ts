import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ZodPipe } from '../common/zod.pipe.js';
import {
  type CheckEmailInput,
  type ClearPushTokenInput,
  type ForgotPasswordInput,
  type GoogleAuthInput,
  type LoginInput,
  type PushTokenInput,
  type RequestSignupOtpInput,
  type ResendSignupOtpInput,
  type ResetPasswordInput,
  type SignupInput,
  type UpdateMeInput,
  type VerifySignupOtpInput,
  checkEmailSchema,
  clearPushTokenSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  pushTokenSchema,
  requestSignupOtpSchema,
  resendSignupOtpSchema,
  resetPasswordSchema,
  signupSchema,
  updateMeSchema,
  verifySignupOtpSchema,
} from '../common/validation.js';
import { PushService } from '../notifications/push.service.js';
import { ROLES } from '../constants/roles.js';
import { Auth, CurrentUser, type AppUser, type RequestUser } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly push: PushService
  ) {}

  @Post('signup')
  @HttpCode(201)
  signup(@Body(new ZodPipe(signupSchema)) body: SignupInput) {
    return this.auth.signup(body);
  }

  /** Send a 6-digit email OTP; account is created only after verify. */
  @Post('signup/request-otp')
  @HttpCode(200)
  requestSignupOtp(@Body(new ZodPipe(requestSignupOtpSchema)) body: RequestSignupOtpInput) {
    return this.auth.requestSignupOtp(body);
  }

  @Post('signup/resend-otp')
  @HttpCode(200)
  resendSignupOtp(@Body(new ZodPipe(resendSignupOtpSchema)) body: ResendSignupOtpInput) {
    return this.auth.resendSignupOtp(body);
  }

  @Post('signup/verify-otp')
  @HttpCode(201)
  verifySignupOtp(@Body(new ZodPipe(verifySignupOtpSchema)) body: VerifySignupOtpInput) {
    return this.auth.verifySignupOtp(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  /** True when this email can be used for a new SnapNear account. */
  @Post('check-email')
  @HttpCode(200)
  checkEmail(@Body(new ZodPipe(checkEmailSchema)) body: CheckEmailInput) {
    return this.auth.checkEmail(body.email);
  }

  /** Verify Google ID token, then log in or create the SnapNear account. */
  @Post('google')
  @HttpCode(200)
  google(@Body(new ZodPipe(googleAuthSchema)) body: GoogleAuthInput) {
    return this.auth.google(body);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body(new ZodPipe(forgotPasswordSchema)) body: ForgotPasswordInput) {
    return this.auth.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body(new ZodPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    return this.auth.resetPassword(body);
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() current: RequestUser) {
    const { doc: _doc, ...user } = current as RequestUser & { doc?: unknown };
    return { success: true, user };
  }

  @Patch('me')
  @Auth(ROLES.CLIENT, ROLES.CREATOR)
  updateMe(@CurrentUser() current: AppUser, @Body(new ZodPipe(updateMeSchema)) body: UpdateMeInput) {
    return this.auth.updateMe(current.doc, body);
  }

  /** Register this device for background shoot alerts (Android/iOS badge + banner). */
  @Post('push-token')
  @Auth(ROLES.CLIENT, ROLES.CREATOR)
  @HttpCode(200)
  async registerPush(@CurrentUser() current: AppUser, @Body(new ZodPipe(pushTokenSchema)) body: PushTokenInput) {
    await this.push.registerToken(current.doc.id, body.token, body.platform);
    return { success: true };
  }

  @Post('push-token/clear')
  @Auth(ROLES.CLIENT, ROLES.CREATOR)
  @HttpCode(200)
  async clearPush(@CurrentUser() current: AppUser, @Body(new ZodPipe(clearPushTokenSchema)) body: ClearPushTokenInput) {
    await this.push.unregisterToken(current.doc.id, body.token);
    return { success: true };
  }
}
