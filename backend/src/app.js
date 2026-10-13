import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { razorpayWebhook } from './controllers/payment.controller.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
// Signature verification needs the exact bytes Razorpay sent, so this must run before express.json()
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);
app.use(express.json({ limit: '100kb' }));
if (!env.isProduction) app.use(morgan('dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
