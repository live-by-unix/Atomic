import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './middleware/logger';
import { apiLimiter } from './middleware/rateLimit';
import { setupWebSocket, getClients } from './services/websocket';
import authRoutes from './routes/auth';
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import voicemailRoutes from './routes/voicemail';
import callRoutes from './routes/calls';
import initRoutes from './routes/init';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(logger);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/voicemail', voicemailRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/init', initRoutes);



app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});

export { app, server };
