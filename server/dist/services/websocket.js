"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClients = getClients;
exports.setupWebSocket = setupWebSocket;
exports.broadcastToChannel = broadcastToChannel;
exports.broadcastToUser = broadcastToUser;
const ws_1 = require("ws");
const auth_1 = require("../utils/auth");
const database_1 = __importDefault(require("../utils/database"));
let clients = new Map();
function getClients() {
    return clients;
}
function setupWebSocket(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    clients = new Map();
    wss.on('connection', (ws, req) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(1008, 'No token provided');
            return;
        }
        try {
            const decoded = (0, auth_1.verifyToken)(token);
            ws.userId = decoded.userId;
            ws.username = decoded.username;
            clients.set(decoded.userId, ws);
            console.log(`WebSocket connected: ${decoded.username} (${decoded.userId})`);
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await handleMessage(ws, message, clients);
                }
                catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            ws.on('close', async () => {
                if (ws.userId) {
                    clients.delete(ws.userId);
                    await database_1.default.user.update({
                        where: { id: ws.userId },
                        data: { status: 'offline', lastSeen: new Date() },
                    });
                    broadcastPresenceUpdate(ws.userId, 'offline', clients);
                    console.log(`WebSocket disconnected: ${ws.username} (${ws.userId})`);
                }
            });
            broadcastPresenceUpdate(ws.userId, 'online', clients);
        }
        catch (error) {
            console.error('WebSocket authentication error:', error);
            ws.close(1008, 'Invalid token');
        }
    });
    return wss;
}
async function handleMessage(ws, message, clients) {
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
async function handleJoinChannel(ws, payload, clients) {
    const { channelId } = payload;
    if (!ws.userId)
        return;
    const members = await database_1.default.channelMember.findMany({
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
        if (clientWs && clientWs.readyState === ws_1.WebSocket.OPEN) {
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
async function handleLeaveChannel(ws, payload, clients) {
    const { channelId } = payload;
    if (!ws.userId || !ws.username)
        return;
    const members = await database_1.default.channelMember.findMany({
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
        if (clientWs && clientWs.readyState === ws_1.WebSocket.OPEN) {
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
async function handleTyping(ws, payload, clients) {
    const { channelId, isTyping } = payload;
    if (!ws.userId || !ws.username)
        return;
    const members = await database_1.default.channelMember.findMany({
        where: { channelId },
    });
    members.forEach(member => {
        if (member.userId !== ws.userId) {
            const clientWs = clients.get(member.userId);
            if (clientWs && clientWs.readyState === ws_1.WebSocket.OPEN) {
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
async function handlePresenceUpdate(ws, payload, clients) {
    const { status } = payload;
    if (!ws.userId)
        return;
    await database_1.default.user.update({
        where: { id: ws.userId },
        data: { status, lastSeen: new Date() },
    });
    broadcastPresenceUpdate(ws.userId, status, clients);
}
function broadcastPresenceUpdate(userId, status, clients) {
    clients.forEach((clientWs) => {
        if (clientWs.readyState === ws_1.WebSocket.OPEN && clientWs.userId !== userId) {
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
function broadcastToChannel(channelId, message, clients) {
    database_1.default.channelMember
        .findMany({ where: { channelId } })
        .then(members => {
        members.forEach(member => {
            const clientWs = clients.get(member.userId);
            if (clientWs && clientWs.readyState === ws_1.WebSocket.OPEN) {
                clientWs.send(JSON.stringify(message));
            }
        });
    });
}
function broadcastToUser(userId, message, clients) {
    const clientWs = clients.get(userId);
    if (clientWs && clientWs.readyState === ws_1.WebSocket.OPEN) {
        clientWs.send(JSON.stringify(message));
    }
}
