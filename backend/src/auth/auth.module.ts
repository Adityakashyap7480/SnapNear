import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MailService } from './mail.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // One shared limiter, so signup and login attempts count together
    const authLimiter = rateLimit({
      windowMs: env.authRateLimit.windowMinutes * 60 * 1000,
      limit: env.authRateLimit.max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, message: 'Too many attempts, please try again in a few minutes' },
    });

    consumer
      .apply(authLimiter)
      .forRoutes(
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/google', method: RequestMethod.POST },
        { path: 'auth/check-email', method: RequestMethod.POST },
        { path: 'auth/forgot-password', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST }
      );
  }
}
