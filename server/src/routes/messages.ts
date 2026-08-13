import { Router } from 'express';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';
import { broadcastToChannel, getClients } from '../services/websocket';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { channelId, content, type, voicemailId } = req.body;
    
    if (!channelId || !content) {
      return res.status(400).json({ success: false, error: 'Channel ID and content are required' });
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
    
    const message = await prisma.message.create({
      data: {
        channelId,
        userId: req.user!.userId,
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
    
    broadcastToChannel(channelId, {
      type: 'new_message',
      payload: message,
    }, getClients());
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    if (message.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Can only edit your own messages' });
    }
    
    const updatedMessage = await prisma.message.update({
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
    
    broadcastToChannel(message.channelId, {
      type: 'message_edited',
      payload: updatedMessage,
    }, getClients());
    
    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    if (message.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Can only delete your own messages' });
    }
    
    await prisma.message.delete({
      where: { id: messageId },
    });
    
    broadcastToChannel(message.channelId, {
      type: 'message_deleted',
      payload: { messageId },
    }, getClients());
    
    res.json({ success: true, data: { message: 'Message deleted successfully' } });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
