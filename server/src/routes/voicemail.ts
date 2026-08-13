import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';
import { broadcastToChannel, getClients } from '../services/websocket';

const router = Router();

const uploadDir = path.join(__dirname, '../../voicemail');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

router.post('/', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }
    
    const { channelId, duration } = req.body;
    
    if (!channelId) {
      return res.status(400).json({ success: false, error: 'Channel ID is required' });
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
    
    const voicemail = await prisma.voicemail.create({
      data: {
        channelId,
        userId: req.user!.userId,
        filename: req.file.filename,
        duration: parseInt(duration) || 0,
        mimeType: req.file.mimetype,
      },
    });
    
    broadcastToChannel(channelId, {
      type: 'voicemail_created',
      payload: voicemail,
    }, getClients());
    
    res.json({ success: true, data: voicemail });
  } catch (error) {
    console.error('Upload voicemail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get voicemail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
