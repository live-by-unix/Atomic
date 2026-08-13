import { Router } from 'express';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.channelMember.findMany({
      where: { userId: req.user!.userId },
      include: {
        channel: true,
      },
    });
    
    const channels = memberships.map(m => m.channel);
    
    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Channel name is required' });
    }
    
    if (name.length < 3) {
      return res.status(400).json({ success: false, error: 'Channel name must be at least 3 characters' });
    }
    
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false,
        createdBy: req.user!.userId,
      },
    });
    
    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: req.user!.userId,
        role: 'admin',
      },
    });
    
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:channelId/join', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: req.user!.userId,
        },
      },
    });
    
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'Already a member of this channel' });
    }
    
    await prisma.channelMember.create({
      data: {
        channelId,
        userId: req.user!.userId,
        role: 'member',
      },
    });
    
    res.json({ success: true, data: { message: 'Joined channel successfully' } });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:channelId/leave', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    await prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId: req.user!.userId,
      },
    });
    
    res.json({ success: true, data: { message: 'Left channel successfully' } });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:channelId/messages', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    
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
    
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { createdAt: { lt: new Date(before as string) } }),
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
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
