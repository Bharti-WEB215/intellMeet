// services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    console.log('Socket.IO Client initialized connection to:', SOCKET_URL);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket.IO Client disconnected.');
  }
};
