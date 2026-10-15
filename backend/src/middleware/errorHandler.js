import env from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

const DUPLICATE_MESSAGES = {
  users_email_unique: 'An account with this email already exists',
  bookings_one_active_job_per_creator: 'Finish your current shoot before accepting a new one',
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Drizzle wraps the PostgreSQL error (with its SQL text) in `cause`
  const pgError = err.cause?.code ? err.cause : err;
  if (pgError.code === '23505') {
    status = 409;
    message = DUPLICATE_MESSAGES[pgError.constraint] || 'This record already exists';
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
