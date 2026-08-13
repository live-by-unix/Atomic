"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const database_1 = __importDefault(require("../utils/database"));
const auth_2 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
router.post('/register', rateLimit_1.authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }
        if (username.length < 3) {
            return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }
        const existingUser = await database_1.default.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await database_1.default.user.create({
            data: {
                username,
                password: hashedPassword,
                status: 'offline',
            },
        });
        const token = (0, auth_1.generateToken)({ userId: user.id, username: user.username });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    createdAt: user.createdAt,
                    status: user.status,
                    lastSeen: user.lastSeen,
                },
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/login', rateLimit_1.authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }
        const user = await database_1.default.user.findUnique({
            where: { username },
        });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const isValid = await (0, auth_1.comparePassword)(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)({ userId: user.id, username: user.username });
        await database_1.default.user.update({
            where: { id: user.id },
            data: { status: 'online', lastSeen: new Date() },
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    createdAt: user.createdAt,
                    status: 'online',
                    lastSeen: user.lastSeen,
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/me', auth_2.authenticate, async (req, res) => {
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
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
