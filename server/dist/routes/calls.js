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
router.post('/offer', auth_1.authenticate, async (req, res) => {
    try {
        const { channelId, calleeId, type, sdp } = req.body;
        if (!channelId || !calleeId || !type || !sdp) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
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
        const calleeMember = await database_1.default.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: calleeId,
                },
            },
        });
        if (!calleeMember) {
            return res.status(404).json({ success: false, error: 'Callee is not a member of this channel' });
        }
        const call = await database_1.default.call.create({
            data: {
                channelId,
                callerId: req.user.userId,
                calleeId,
                type,
                status: 'initiated',
            },
        });
        (0, websocket_1.broadcastToUser)(calleeId, {
            type: 'call_offer',
            payload: {
                callId: call.id,
                callerId: req.user.userId,
                calleeId,
                type,
                sdp,
            },
        }, (0, websocket_1.getClients)());
        res.json({
            success: true,
            data: {
                callId: call.id,
                callerId: req.user.userId,
                calleeId,
                type,
                sdp,
            },
        });
    }
    catch (error) {
        console.error('Call offer error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/answer', auth_1.authenticate, async (req, res) => {
    try {
        const { callId, sdp } = req.body;
        if (!callId || !sdp) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const call = await database_1.default.call.findUnique({
            where: { id: callId },
        });
        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }
        if (call.calleeId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'You are not the callee of this call' });
        }
        await database_1.default.call.update({
            where: { id: callId },
            data: { status: 'ongoing' },
        });
        (0, websocket_1.broadcastToUser)(call.callerId, {
            type: 'call_answer',
            payload: {
                callId,
                calleeId: req.user.userId,
                sdp,
            },
        }, (0, websocket_1.getClients)());
        res.json({
            success: true,
            data: {
                callId,
                calleeId: req.user.userId,
                sdp,
            },
        });
    }
    catch (error) {
        console.error('Call answer error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/ice', auth_1.authenticate, async (req, res) => {
    try {
        const { callId, candidate } = req.body;
        if (!callId || !candidate) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const call = await database_1.default.call.findUnique({
            where: { id: callId },
        });
        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }
        if (call.callerId !== req.user.userId && call.calleeId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'You are not a participant in this call' });
        }
        const targetUserId = req.user.userId === call.callerId ? call.calleeId : call.callerId;
        (0, websocket_1.broadcastToUser)(targetUserId, {
            type: 'call_ice_candidate',
            payload: {
                callId,
                candidate,
            },
        }, (0, websocket_1.getClients)());
        res.json({
            success: true,
            data: {
                callId,
                candidate,
            },
        });
    }
    catch (error) {
        console.error('ICE candidate error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/:callId/end', auth_1.authenticate, async (req, res) => {
    try {
        const { callId } = req.params;
        const call = await database_1.default.call.findUnique({
            where: { id: callId },
        });
        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }
        if (call.callerId !== req.user.userId && call.calleeId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'You are not a participant in this call' });
        }
        await database_1.default.call.update({
            where: { id: callId },
            data: {
                status: 'ended',
                endedAt: new Date(),
            },
        });
        const targetUserId = req.user.userId === call.callerId ? call.calleeId : call.callerId;
        (0, websocket_1.broadcastToUser)(targetUserId, {
            type: 'call_ended',
            payload: {
                callId,
            },
        }, (0, websocket_1.getClients)());
        res.json({ success: true, data: { message: 'Call ended successfully' } });
    }
    catch (error) {
        console.error('End call error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
