import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ZodPipe } from '../common/zod.pipe.js';
import {
  type ClearPushTokenInput,
  type GoogleAuthInput,
  type LoginInput,
  type PushTokenInput,
  type SignupInput,
  type UpdateMeInput,
  clearPushTokenSchema,
  googleAuthSchema,
  loginSchema,
  pushTokenSchema,
  signupSchema,
  updateMeSchema,
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

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  /** Verify Google ID token, then log in or create the SnapNear account. */
  @Post('google')
  @HttpCode(200)
  google(@Body(new ZodPipe(googleAuthSchema)) body: GoogleAuthInput) {
    return this.auth.google(body);
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
