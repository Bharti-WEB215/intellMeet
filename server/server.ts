// server.ts
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { initDb, query } from './db/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import taskRoutes from './routes/tasks.js';
import documentRoutes from './routes/documents.js';
import workspaceRoutes from './routes/workspace.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Socket.IO signaling & synchronization coordination
io.on('connection', (socket) => {
  console.log('WS Client connected:', socket.id);

  // Join a standard sync channel
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined general room ${roomId}`);
  });

  // Signaling for WebRTC call mesh
  socket.on('join-call', ({ roomId, userId, name, avatar }) => {
    socket.join(roomId);
    
    // Tell others in the meeting room that a peer has connected
    socket.to(roomId).emit('peer-joined', {
      socketId: socket.id,
      userId,
      name,
      avatar
    });
    
    console.log(`Peer ${name} (${socket.id}) joined WebRTC call room ${roomId}`);
  });

  // Relay signaling payload (Offer / Answer / ICE Candidates) to specific client
  socket.on('send-signal', ({ to, signal }) => {
    io.to(to).emit('receive-signal', {
      from: socket.id,
      signal
    });
  });

  // Sync new live transcript
  socket.on('new-transcript-segment', ({ roomId, speaker, text }) => {
    io.to(roomId).emit('transcript-updated', {
      id: `tr-${Date.now()}`,
      speaker_name: speaker,
      text,
      timestamp: new Date()
    });
  });

  // Sync kanban positions
  socket.on('kanban-card-moved', ({ taskId, newStatus }) => {
    socket.broadcast.emit('kanban-card-updated', { taskId, newStatus });
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log('WS Client disconnected:', socket.id);
    io.emit('peer-left', socket.id);
  });
});

// Start server
const startServer = async () => {
  await initDb();
  server.listen(PORT, () => {
    console.log(`IntellMeet Backend Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
export default server;
