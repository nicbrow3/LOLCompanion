import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables from project root FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import after dotenv is configured
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Setup API routes
setupRoutes(app);

// Setup WebSocket handlers
setupWebSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔑 Riot API Key: ${process.env.RIOT_API_KEY ? 'Configured' : 'Missing'}`);
});

export { io }; 