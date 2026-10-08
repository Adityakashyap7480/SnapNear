import { Server } from 'socket.io';
import env from '../config/env.js';
import { verifyToken } from '../utils/token.js';
import { ROLES } from '../constants/roles.js';
import User from '../models/User.js';
import { isRestricted } from '../utils/accountStatus.js';

let io = null;

export const rooms = {
  user: (id) => `user:${id}`,
  creators: 'role:creators',
  admins: 'role:admins',
};

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyToken(token);
      if (payload.role !== ROLES.SUPER_ADMIN) {
        const user = await User.findById(payload.sub).select('accountStatus').lean();
        if (!user || isRestricted(user)) return next(new Error('unauthorized'));
      }
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;
    socket.join(rooms.user(userId));
    if (role === ROLES.CREATOR) socket.join(rooms.creators);
    if (role === ROLES.SUPER_ADMIN) socket.join(rooms.admins);
  });

  console.log('[socket] realtime layer ready');
  return io;
}

function emit(room, event, payload) {
  if (io) io.to(room).emit(event, payload);
}

/**
 * Notifies every party interested in a booking change.
 * Payloads are intentionally light: clients refetch what they need.
 */
export function notifyBookingChange(booking, event) {
  const payload = {
    event,
    bookingId: booking._id.toString(),
    code: booking.code,
    status: booking.status,
    serviceType: booking.serviceType,
    total: booking.total,
    creatorPayout: booking.creatorPayout,
    occasion: booking.occasion,
    address: booking.address,
  };

  const clientId = (booking.client?._id || booking.client)?.toString();
  const creatorId = (booking.creator?._id || booking.creator)?.toString();

  if (clientId) emit(rooms.user(clientId), 'booking:update', payload);
  if (creatorId) emit(rooms.user(creatorId), 'booking:update', payload);
  emit(rooms.creators, 'feed:update', payload);
  emit(rooms.admins, 'admin:update', payload);
}

export function notifyAdmins(event, payload = {}) {
  emit(rooms.admins, 'admin:update', { event, ...payload });
}

/** Tells every open session of a user why they were signed out, then drops those connections. */
export function forceLogout(userId, notice) {
  if (!io) return;
  const room = rooms.user(userId);
  io.to(room).emit('account:restricted', notice);
  setTimeout(() => io.in(room).disconnectSockets(true), 500);
}
