import { Router } from 'express';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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
    
    const memberships = await prisma.channelMember.findMany({
      where: { userId: req.user!.userId },
      include: {
        channel: true,
      },
    });
    
    const channels = memberships.map(m => m.channel);
    
    const allMembers = await prisma.channelMember.findMany({
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
    
    const unreadCounts: Record<string, number> = {};
    for (const channel of channels) {
      const lastRead = await prisma.message.findFirst({
        where: {
          channelId: channel.id,
          userId: req.user!.userId,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      if (lastRead) {
        const count = await prisma.message.count({
          where: {
            channelId: channel.id,
            createdAt: { gt: lastRead.createdAt },
            userId: { not: req.user!.userId },
          },
        });
        unreadCounts[channel.id] = count;
      } else {
        const count = await prisma.message.count({
          where: {
            channelId: channel.id,
            userId: { not: req.user!.userId },
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
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
