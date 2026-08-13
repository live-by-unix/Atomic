import { Router } from 'express';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';
import { broadcastToUser, getClients } from '../services/websocket';

const router = Router();

router.post('/offer', authenticate, async (req, res) => {
  try {
    const { channelId, calleeId, type, sdp } = req.body;
    
    if (!channelId || !calleeId || !type || !sdp) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: req.user!.userId,
        },
      },
    });
    
    if (!member) {
      return res.status(403).json({ success: false, error: 'Not a member of this channel' });
    }
    
    const calleeMember = await prisma.channelMember.findUnique({
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
    
    const call = await prisma.call.create({
      data: {
        channelId,
        callerId: req.user!.userId,
        calleeId,
        type,
        status: 'initiated',
      },
    });
    
    broadcastToUser(calleeId, {
      type: 'call_offer',
      payload: {
        callId: call.id,
        callerId: req.user!.userId,
        calleeId,
        type,
        sdp,
      },
    }, getClients());
    
    res.json({
      success: true,
      data: {
        callId: call.id,
        callerId: req.user!.userId,
        calleeId,
        type,
        sdp,
      },
    });
  } catch (error) {
    console.error('Call offer error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/answer', authenticate, async (req, res) => {
  try {
    const { callId, sdp } = req.body;
    
    if (!callId || !sdp) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });
    
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    
    if (call.calleeId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'You are not the callee of this call' });
    }
    
    await prisma.call.update({
      where: { id: callId },
      data: { status: 'ongoing' },
    });
    
    broadcastToUser(call.callerId, {
      type: 'call_answer',
      payload: {
        callId,
        calleeId: req.user!.userId,
        sdp,
      },
    }, getClients());
    
    res.json({
      success: true,
      data: {
        callId,
        calleeId: req.user!.userId,
        sdp,
      },
    });
  } catch (error) {
    console.error('Call answer error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/ice', authenticate, async (req, res) => {
  try {
    const { callId, candidate } = req.body;
    
    if (!callId || !candidate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });
    
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    
    if (call.callerId !== req.user!.userId && call.calleeId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'You are not a participant in this call' });
    }
    
    const targetUserId = req.user!.userId === call.callerId ? call.calleeId : call.callerId;
    
    broadcastToUser(targetUserId, {
      type: 'call_ice_candidate',
      payload: {
        callId,
        candidate,
      },
    }, getClients());
    
    res.json({
      success: true,
      data: {
        callId,
        candidate,
      },
    });
  } catch (error) {
    console.error('ICE candidate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:callId/end', authenticate, async (req, res) => {
  try {
    const { callId } = req.params;
    
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });
    
    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    
    if (call.callerId !== req.user!.userId && call.calleeId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'You are not a participant in this call' });
    }
    
    await prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });
    
    const targetUserId = req.user!.userId === call.callerId ? call.calleeId : call.callerId;
    
    broadcastToUser(targetUserId, {
      type: 'call_ended',
      payload: {
        callId,
      },
    }, getClients());
    
    res.json({ success: true, data: { message: 'Call ended successfully' } });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
