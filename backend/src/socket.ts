import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserModel } from './models/User';
import { MessageModel } from './models/Message';

interface OnlineUser { id: string; name: string; role: string; }

const onlineUsers = new Map<string, OnlineUser>();

export function initSocket(httpServer: HttpServer, allowedOrigin: string): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: allowedOrigin, methods: ['GET', 'POST'] }
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('No token'));
    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error('Server misconfiguration'));
    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      const user = UserModel.findById(decoded.userId);
      if (!user) return next(new Error('User not found'));
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', socket => {
    const user = socket.data.user;
    onlineUsers.set(socket.id, { id: user.id, name: user.name, role: user.role });

    // Send chat history — always emit even if loading fails
    try {
      socket.emit('history', MessageModel.getLast(60));
    } catch (e) {
      console.error('\x1b[31m[chat] History load error:\x1b[0m', e);
      socket.emit('history', []);
    }

    // Broadcast updated online list to everyone
    io.emit('online', Array.from(onlineUsers.values()));
    console.log(`\x1b[36m[chat]\x1b[0m ${user.name} connected (${onlineUsers.size} online)`);

    socket.on('message', (content: unknown) => {
      if (typeof content !== 'string' || !content.trim()) return;
      try {
        const msg = MessageModel.create({ user_id: user.id, content: content.trim().substring(0, 1000) });
        if (!msg) return;
        io.emit('message', msg);
        console.log(`\x1b[36m[chat]\x1b[0m ${user.name}: ${msg.content.substring(0, 60)}`);
      } catch (e) {
        console.error('\x1b[31m[chat] Message save error:\x1b[0m', e);
      }
    });

    socket.on('typing', (isTyping: unknown) => {
      if (typeof isTyping !== 'boolean') return;
      socket.broadcast.emit('typing', { name: user.name, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('online', Array.from(onlineUsers.values()));
      console.log(`\x1b[36m[chat]\x1b[0m ${user.name} disconnected (${onlineUsers.size} online)`);
    });
  });

  return io;
}
