"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../utils/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const memberships = await database_1.default.channelMember.findMany({
            where: { userId: req.user.userId },
            include: {
                channel: true,
            },
        });
        const channels = memberships.map(m => m.channel);
        res.json({ success: true, data: channels });
    }
    catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'Channel name is required' });
        }
        if (name.length < 3) {
            return res.status(400).json({ success: false, error: 'Channel name must be at least 3 characters' });
        }
        const channel = await database_1.default.channel.create({
            data: {
                name,
                description,
                isPrivate: isPrivate || false,
                createdBy: req.user.userId,
            },
        });
        await database_1.default.channelMember.create({
            data: {
                channelId: channel.id,
                userId: req.user.userId,
                role: 'admin',
            },
        });
        res.json({ success: true, data: channel });
    }
    catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/:channelId/join', auth_1.authenticate, async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await database_1.default.channel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }
        const existingMember = await database_1.default.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: req.user.userId,
                },
            },
        });
        if (existingMember) {
            return res.status(400).json({ success: false, error: 'Already a member of this channel' });
        }
        await database_1.default.channelMember.create({
            data: {
                channelId,
                userId: req.user.userId,
                role: 'member',
            },
        });
        res.json({ success: true, data: { message: 'Joined channel successfully' } });
    }
    catch (error) {
        console.error('Join channel error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/:channelId/leave', auth_1.authenticate, async (req, res) => {
    try {
        const { channelId } = req.params;
        await database_1.default.channelMember.deleteMany({
            where: {
                channelId,
                userId: req.user.userId,
            },
        });
        res.json({ success: true, data: { message: 'Left channel successfully' } });
    }
    catch (error) {
        console.error('Leave channel error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/:channelId/messages', auth_1.authenticate, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50, before } = req.query;
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
        const messages = await database_1.default.message.findMany({
            where: {
                channelId,
                ...(before && { createdAt: { lt: new Date(before) } }),
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
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
        res.json({ success: true, data: messages.reverse() });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
