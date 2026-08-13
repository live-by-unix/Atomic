import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { verifyToken } from '../utils/auth';
import prisma from '../utils/database';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
}

let clients = new Map<string, AuthenticatedWebSocket>();

export function getClients() {
  return clients;
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  clients = new Map<string, AuthenticatedWebSocket>();
  
  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'No token provided');
      return;
    }
    
    try {
      const decoded = verifyToken(token);
      ws.userId = decoded.userId;
      ws.username = decoded.username;
      
      clients.set(decoded.userId, ws);
      
      console.log(`WebSocket connected: ${decoded.username} (${decoded.userId})`);
      
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await handleMessage(ws, message, clients);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', async () => {
        if (ws.userId) {
          clients.delete(ws.userId);
          
          await prisma.user.update({
            where: { id: ws.userId },
            data: { status: 'offline', lastSeen: new Date() },
          });
          
          broadcastPresenceUpdate(ws.userId, 'offline', clients);
          
          console.log(`WebSocket disconnected: ${ws.username} (${ws.userId})`);
        }
      });
      
      broadcastPresenceUpdate(ws.userId, 'online', clients);
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Invalid token');
    }
  });
  
  return wss;
}

async function handleMessage(
  ws: AuthenticatedWebSocket,
  message: any,
  clients: Map<string, AuthenticatedWebSocket>
) {
  const { type, payload } = message;
  
  switch (type) {
    case 'join_channel':
      await handleJoinChannel(ws, payload, clients);
      break;
    case 'leave_channel':
      await handleLeaveChannel(ws, payload, clients);
      break;
    case 'typing':
      await handleTyping(ws, payload, clients);
      break;
    case 'presence_update':
      await handlePresenceUpdate(ws, payload, clients);
      break;
    default:
      console.log('Unknown message type:', type);
  }
}

async function handleJoinChannel(
  ws: AuthenticatedWebSocket,
  payload: { channelId: string },
  clients: Map<string, AuthenticatedWebSocket>
) {
  const { channelId } = payload;
  
  if (!ws.userId) return;
  
  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          status: true,
        },
      },
    },
  });
  
  members.forEach(member => {
    const clientWs = clients.get(member.user.id);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'user_joined',
        payload: {
          channelId,
          user: member.user,
        },
      }));
    }
  });
}

async function handleLeaveChannel(
  ws: AuthenticatedWebSocket,
  payload: { channelId: string },
  clients: Map<string, AuthenticatedWebSocket>
) {
  const { channelId } = payload;
  
  if (!ws.userId || !ws.username) return;
  
  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          status: true,
        },
      },
    },
  });
  
  members.forEach(member => {
    const clientWs = clients.get(member.user.id);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'user_left',
        payload: {
          channelId,
          user: { id: ws.userId, username: ws.username },
        },
      }));
    }
  });
}

async function handleTyping(
  ws: AuthenticatedWebSocket,
  payload: { channelId: string; isTyping: boolean },
  clients: Map<string, AuthenticatedWebSocket>
) {
  const { channelId, isTyping } = payload;
  
  if (!ws.userId || !ws.username) return;
  
  const members = await prisma.channelMember.findMany({
    where: { channelId },
  });
  
  members.forEach(member => {
    if (member.userId !== ws.userId) {
      const clientWs = clients.get(member.userId);
      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'typing',
          payload: {
            channelId,
            userId: ws.userId,
            username: ws.username,
            isTyping,
          },
        }));
      }
    }
  });
}

async function handlePresenceUpdate(
  ws: AuthenticatedWebSocket,
  payload: { status: 'online' | 'idle' | 'offline' },
  clients: Map<string, AuthenticatedWebSocket>
) {
  const { status } = payload;
  
  if (!ws.userId) return;
  
  await prisma.user.update({
    where: { id: ws.userId },
    data: { status, lastSeen: new Date() },
  });
  
  broadcastPresenceUpdate(ws.userId, status, clients);
}

function broadcastPresenceUpdate(
  userId: string,
  status: 'online' | 'idle' | 'offline',
  clients: Map<string, AuthenticatedWebSocket>
) {
  clients.forEach((clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.userId !== userId) {
      clientWs.send(JSON.stringify({
        type: 'presence_update',
        payload: {
          userId,
          status,
        },
      }));
    }
  });
}

export function broadcastToChannel(
  channelId: string,
  message: any,
  clients: Map<string, AuthenticatedWebSocket>
) {
  prisma.channelMember
    .findMany({ where: { channelId } })
    .then(members => {
      members.forEach(member => {
        const clientWs = clients.get(member.userId);
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(message));
        }
      });
    });
}

export function broadcastToUser(
  userId: string,
  message: any,
  clients: Map<string, AuthenticatedWebSocket>
) {
  const clientWs = clients.get(userId);
  if (clientWs && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify(message));
  }
}
