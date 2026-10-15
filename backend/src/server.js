import http from 'http';
import env from './config/env.js';
import app from './app.js';
import { connectDB } from './db/index.js';
import { initSocket } from './socket/index.js';

async function start() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`[api] SnapNear API running on http://localhost:${env.port}/api`);
  });
}

start().catch((err) => {
  console.error('[startup] Failed to start server:', err.message);
  process.exit(1);
});
