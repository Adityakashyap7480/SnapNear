import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { env } from '../config/env.js';

/** Socket.io on the API's own HTTP server, allowing the same origins as the REST API. */
export class SocketIoAdapter extends IoAdapter {
  override createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: env.clientOrigins, credentials: true },
    } as ServerOptions);
  }
}
