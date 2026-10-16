import {
  type OnGatewayConnection,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { isRestricted } from '../common/account-status.js';
import { verifyToken } from '../auth/token.js';
import { SOCKET_EVENTS, type BookingEvent } from '../constants/events.js';
import { ROLES } from '../constants/roles.js';
import type { BookingWithCreator } from '../repositories/bookings.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';

export const rooms = {
  user: (id: string) => `user:${id}`,
  creators: 'role:creators',
  admins: 'role:admins',
};

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() private server?: Server;

  constructor(private readonly users: UsersRepository) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const { token } = socket.handshake.auth || {};
        if (!token) return next(new Error('unauthorized'));
        const payload = verifyToken(token);
        if (payload.role !== ROLES.SUPER_ADMIN) {
          const user = await this.users.findById(payload.sub);
          if (!user || isRestricted(user)) return next(new Error('unauthorized'));
        }
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
        return next();
      } catch {
        return next(new Error('unauthorized'));
      }
    });
  }

  handleConnection(socket: Socket) {
    const { userId, role } = socket.data;
    socket.join(rooms.user(userId));
    if (role === ROLES.CREATOR) socket.join(rooms.creators);
    if (role === ROLES.SUPER_ADMIN) socket.join(rooms.admins);
  }

  private emit(room: string, event: string, payload: unknown) {
    this.server?.to(room).emit(event, payload);
  }

  /**
   * Notifies every party interested in a booking change.
   * Payloads are intentionally light: clients refetch what they need.
   */
  notifyBookingChange(booking: BookingWithCreator, event: BookingEvent) {
    const payload = {
      event,
      bookingId: booking.id,
      code: booking.code,
      status: booking.status,
      serviceType: booking.serviceType,
      total: booking.total,
      creatorPayout: booking.creatorPayout,
      occasion: booking.occasion,
      address: booking.address,
    };

    if (booking.clientId) this.emit(rooms.user(booking.clientId), SOCKET_EVENTS.BOOKING_UPDATE, payload);
    if (booking.creatorId) this.emit(rooms.user(booking.creatorId), SOCKET_EVENTS.BOOKING_UPDATE, payload);
    this.emit(rooms.creators, SOCKET_EVENTS.FEED_UPDATE, payload);
    this.emit(rooms.admins, SOCKET_EVENTS.ADMIN_UPDATE, {
      ...payload,
      clientName: booking.clientName || booking.contactName,
      creatorName: booking.creatorName || booking.creator?.name,
      startedAt: booking.startedAt,
      endsAt: booking.endsAt,
      durationMinutes: booking.durationMinutes,
    });
  }

  notifyAdmins(event: string, payload: Record<string, unknown> = {}) {
    this.emit(rooms.admins, SOCKET_EVENTS.ADMIN_UPDATE, { event, ...payload });
  }

  notifyUser(userId: string, event: string, payload: Record<string, unknown> = {}) {
    this.emit(rooms.user(userId), event, payload);
  }

  /** Tells every open session of a user why they were signed out, then drops those connections. */
  forceLogout(userId: string, notice: unknown) {
    const { server } = this;
    if (!server) return;
    const room = rooms.user(userId);
    server.to(room).emit(SOCKET_EVENTS.ACCOUNT_RESTRICTED, notice);
    setTimeout(() => server.in(room).disconnectSockets(true), 500);
  }
}
