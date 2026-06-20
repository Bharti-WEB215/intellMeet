// server/server.ts — IntellMeet Backend (MongoDB + Redis)
import dotenv from 'dotenv';
dotenv.config(); // Must be FIRST — before any module reads process.env

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// ─── Infrastructure ───
import { connectDB, disconnectDB, getConnectionStatus } from './db/mongodb.js';
import { connectRedis, disconnectRedis, trackOnlineUser, removeOnlineUser, getRedisStatus } from './db/redis.js';
import { metricsMiddleware, metricsEndpoint, wsConnectionsGauge, activeMeetingsGauge } from './middleware/metrics.js';
import { verifyToken } from './middleware/jwt-auth.js';

// ─── Models (for Socket.IO persistence) ───
import { MeetingMessage } from './models/index.js';

// ─── Route imports ───
import authRoutes from './routes/auth.js';
import meetingsRoutes from './routes/meetings.js';
import tasksRoutes from './routes/tasks.js';
import documentsRoutes from './routes/documents.js';
import workspaceRoutes from './routes/workspace.js';
import notificationsRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import copilotRoutes from './routes/copilot.js';

// ─── Express + HTTP + Socket.IO setup ───
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(metricsMiddleware);

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/copilot', copilotRoutes);

// ─── Metrics endpoint (Prometheus) ───
app.get('/metrics', metricsEndpoint);

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongodb: getConnectionStatus(),
    redis: getRedisStatus(),
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ═══════════════════════════════════════════════════════════════
//  Socket.IO — WebRTC Signaling + Real-time Sync + Chat
// ═══════════════════════════════════════════════════════════════

// Track which rooms are active meetings (for metrics)
const activeRooms = new Set<string>();

io.on('connection', (socket) => {
  console.log('🔌 WS Client connected:', socket.id);
  wsConnectionsGauge.inc();

  // ── Join a general sync room ──
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // ── WebRTC: Join a call (mesh signaling) ──
  socket.on('join-call', ({ roomId, userId, name, avatar }: {
    roomId: string; userId: string; name: string; avatar: string;
  }) => {
    socket.join(roomId);

    // Track active meeting rooms
    if (!activeRooms.has(roomId)) {
      activeRooms.add(roomId);
      activeMeetingsGauge.set(activeRooms.size);
    }

    // Notify existing peers
    socket.to(roomId).emit('peer-joined', {
      socketId: socket.id,
      userId,
      name,
      avatar,
    });

    console.log(`🎥 Peer ${name} (${socket.id}) joined call ${roomId}`);
  });

  // ── WebRTC: Relay signaling payload (Offer / Answer / ICE) ──
  socket.on('send-signal', ({ to, signal }: { to: string; signal: any }) => {
    io.to(to).emit('receive-signal', {
      from: socket.id,
      signal,
    });
  });

  // ── Live transcript sync ──
  socket.on('new-transcript-segment', ({ roomId, speaker, text }: {
    roomId: string; speaker: string; text: string;
  }) => {
    io.to(roomId).emit('transcript-updated', {
      id: `tr-${Date.now()}`,
      speaker_name: speaker,
      text,
      timestamp: new Date(),
    });
  });

  // ── Kanban card sync ──
  socket.on('kanban-card-moved', ({ taskId, newStatus }: {
    taskId: string; newStatus: string;
  }) => {
    socket.broadcast.emit('kanban-card-updated', { taskId, newStatus });
  });

  // ── In-meeting chat message (persist to MongoDB + broadcast) ──
  socket.on('chat-message', async ({ meetingId, userId, userName, text }: {
    meetingId: string; userId: string; userName: string; text: string;
  }) => {
    try {
      const message = await MeetingMessage.create({
        meetingId,
        userId,
        userName,
        text,
      });

      // Broadcast to everyone in the meeting room (including sender)
      io.to(meetingId).emit('chat-message', {
        _id: message._id,
        meetingId,
        userId,
        userName,
        text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Failed to save chat message:', err);
      socket.emit('chat-error', { error: 'Failed to send message.' });
    }
  });

  // ── Online user tracking ──
  socket.on('user-online', async ({ userId }: { userId: string }) => {
    await trackOnlineUser(userId, socket.id);
    // Store userId on socket for cleanup on disconnect
    (socket as any).intellmeetUserId = userId;
    socket.broadcast.emit('user-status-changed', { userId, status: 'online' });
  });

  socket.on('user-offline', async ({ userId }: { userId: string }) => {
    await removeOnlineUser(userId);
    socket.broadcast.emit('user-status-changed', { userId, status: 'offline' });
  });

  // ── Disconnection handler ──
  socket.on('disconnect', async () => {
    console.log('🔌 WS Client disconnected:', socket.id);
    wsConnectionsGauge.dec();

    // Clean up online tracking
    const userId = (socket as any).intellmeetUserId;
    if (userId) {
      await removeOnlineUser(userId);
      socket.broadcast.emit('user-status-changed', { userId, status: 'offline' });
    }

    // Notify peers for WebRTC cleanup
    io.emit('peer-left', socket.id);

    // Check if any active meeting rooms are now empty
    for (const roomId of activeRooms) {
      const sockets = await io.in(roomId).fetchSockets();
      if (sockets.length === 0) {
        activeRooms.delete(roomId);
        activeMeetingsGauge.set(activeRooms.size);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  Startup
// ═══════════════════════════════════════════════════════════════
const startServer = async () => {
  await connectDB();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`🚀 IntellMeet Backend running on http://localhost:${PORT}`);
    console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
    console.log(`❤️  Health check at http://localhost:${PORT}/health`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// ═══════════════════════════════════════════════════════════════
//  Graceful Shutdown
// ═══════════════════════════════════════════════════════════════
const shutdown = async (signal: string) => {
  console.log(`\n⏳ ${signal} received — shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('🔒 HTTP server closed');
  });

  // Close database connections
  await disconnectDB();
  await disconnectRedis();

  console.log('👋 Goodbye!');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Export io for routes that need real-time push
export { io };
export default server;
