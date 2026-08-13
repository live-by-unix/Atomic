"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../utils/database"));
const auth_1 = require("../middleware/auth");
const websocket_1 = require("../services/websocket");
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(__dirname, '../../voicemail');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    },
});
router.post('/', auth_1.authenticate, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file provided' });
        }
        const { channelId, duration } = req.body;
        if (!channelId) {
            return res.status(400).json({ success: false, error: 'Channel ID is required' });
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
        const voicemail = await database_1.default.voicemail.create({
            data: {
                channelId,
                userId: req.user.userId,
                filename: req.file.filename,
                duration: parseInt(duration) || 0,
                mimeType: req.file.mimetype,
            },
        });
        (0, websocket_1.broadcastToChannel)(channelId, {
            type: 'voicemail_created',
            payload: voicemail,
        }, (0, websocket_1.getClients)());
        res.json({ success: true, data: voicemail });
    }
    catch (error) {
        console.error('Upload voicemail error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/:filename', auth_1.authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Get voicemail error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
