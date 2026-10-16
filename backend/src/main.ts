import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { env } from './config/env.js';
import { SocketIoAdapter } from './realtime/socket-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: ['error', 'warn'],
  });

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins, credentials: true, exposedHeaders: ['X-Server-Time'] }));
  // Lets clients line shoot countdowns up with the server clock instead of the phone's
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set('X-Server-Time', String(Date.now()));
    next();
  });
  // Signature verification needs the exact bytes Razorpay sent, so this must run before express.json()
  app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: '100kb' }));

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  await app.listen(env.port);
}

bootstrap().catch((err: Error) => {
  console.error('[startup] Failed to start server:', err.message);
  process.exit(1);
});
