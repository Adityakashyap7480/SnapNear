import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

type ErrorLike = Error & {
  statusCode?: number;
  details?: unknown;
  extra?: Record<string, unknown>;
  code?: string;
  constraint?: string;
  cause?: unknown;
};

const DUPLICATE_MESSAGES: Record<string, string> = {
  users_email_unique: 'An account with this email already exists',
  bookings_one_active_job_per_creator:
    "You're already booked in this time slot, so you can't accept this shoot.",
};

/** Every error leaves the API as `{ success: false, message, details?, ...extra }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) return;

    const err = (exception instanceof Error ? exception : new Error(String(exception))) as ErrorLike;
    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      // The app throws ApiError; Nest's own 404 only means no route matched
      status = exception.getStatus();
      message =
        status === HttpStatus.NOT_FOUND ? `Route not found: ${req.method} ${req.originalUrl}` : exception.message;
    } else {
      status = err.statusCode || 500;
      message = err.message || 'Something went wrong';
    }

    // Drizzle wraps the PostgreSQL error (with its SQL text) in `cause`
    const pgError = ((err.cause as ErrorLike | undefined)?.code ? err.cause : err) as ErrorLike;
    if (pgError.code === '23505') {
      status = 409;
      message = (pgError.constraint && DUPLICATE_MESSAGES[pgError.constraint]) || 'This record already exists';
    } else if (pgError.code === '22P02' || pgError.code === '22001') {
      status = 400;
      message = 'Invalid value';
    } else if (status >= 500 && !err.statusCode && env.isProduction) {
      message = 'Something went wrong';
    }

    if (status >= 500) console.error('[error]', err);

    res.status(status).json({
      success: false,
      message,
      details: err.details,
      ...(err.extra || {}),
      ...(env.isProduction || status < 500 ? {} : { stack: err.stack }),
    });
  }
}
