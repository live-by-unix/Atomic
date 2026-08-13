"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../utils/database"));
const auth_1 = require("../middleware/auth");
const websocket_1 = require("../services/websocket");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { channelId, content, type, voicemailId } = req.body;
        if (!channelId || !content) {
            return res.status(400).json({ success: false, error: 'Channel ID and content are required' });
        }
        const member = await database_1.default.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: req.user.userId,
                },
            },
        });
        if (!member) {
            return res.status(403).json({ success: false, error: 'Not a member of this channel' });
        }
        const message = await database_1.default.message.create({
            data: {
                channelId,
                userId: req.user.userId,
                content,
                type: type || 'text',
                voicemailId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        status: true,
                    },
                },
                voicemail: true,
            },
        });
        (0, websocket_1.broadcastToChannel)(channelId, {
            type: 'new_message',
            payload: message,
        }, (0, websocket_1.getClients)());
        res.json({ success: true, data: message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.put('/:messageId', auth_1.authenticate, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }
        const message = await database_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }
        if (message.userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Can only edit your own messages' });
        }
        const updatedMessage = await database_1.default.message.update({
            where: { id: messageId },
            data: {
                content,
                edited: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        status: true,
                    },
                },
                voicemail: true,
            },
        });
        (0, websocket_1.broadcastToChannel)(message.channelId, {
            type: 'message_edited',
            payload: updatedMessage,
        }, (0, websocket_1.getClients)());
        res.json({ success: true, data: updatedMessage });
    }
    catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.delete('/:messageId', auth_1.authenticate, async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await database_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }
        if (message.userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Can only delete your own messages' });
        }
        await database_1.default.message.delete({
            where: { id: messageId },
        });
        (0, websocket_1.broadcastToChannel)(message.channelId, {
            type: 'message_deleted',
            payload: { messageId },
        }, (0, websocket_1.getClients)());
        res.json({ success: true, data: { message: 'Message deleted successfully' } });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
