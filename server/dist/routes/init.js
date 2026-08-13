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
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                status: true,
                lastSeen: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const memberships = await database_1.default.channelMember.findMany({
            where: { userId: req.user.userId },
            include: {
                channel: true,
            },
        });
        const channels = memberships.map(m => m.channel);
        const allMembers = await database_1.default.channelMember.findMany({
            where: {
                channelId: { in: channels.map(c => c.id) },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        status: true,
                        lastSeen: true,
                    },
                },
            },
        });
        const usersMap = new Map();
        allMembers.forEach(member => {
            usersMap.set(member.user.id, member.user);
        });
        const users = Array.from(usersMap.values());
        const unreadCounts = {};
        for (const channel of channels) {
            const lastRead = await database_1.default.message.findFirst({
                where: {
                    channelId: channel.id,
                    userId: req.user.userId,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (lastRead) {
                const count = await database_1.default.message.count({
                    where: {
                        channelId: channel.id,
                        createdAt: { gt: lastRead.createdAt },
                        userId: { not: req.user.userId },
                    },
                });
                unreadCounts[channel.id] = count;
            }
            else {
                const count = await database_1.default.message.count({
                    where: {
                        channelId: channel.id,
                        userId: { not: req.user.userId },
                    },
                });
                unreadCounts[channel.id] = count;
            }
        }
        res.json({
            success: true,
            data: {
                user,
                channels,
                unreadCounts,
                users,
            },
        });
    }
    catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
