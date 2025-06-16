import { Server as SocketIOServer } from 'socket.io';

export function setupWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
    
    // Basic ping/pong for connection testing
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
} 