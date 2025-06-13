// backend/routes/account.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const isAuthenticated = require('../middleware/isAuthenticated');

const router = express.Router();
const prisma = new PrismaClient();

// All routes in this file will be protected
router.use(isAuthenticated);

// GET /api/account/
router.get('/', async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { email: true, openaiKey: true },
    });
    res.json(user);
});

// PUT /api/account/
router.put('/', async (req, res) => {
    const { openaiKey } = req.body;
    await prisma.user.update({
        where: { id: req.session.userId },
        data: { openaiKey: openaiKey },
    });
    res.json({ message: 'Account updated successfully.' });
});

// POST /api/account/test-key
router.post('/test-key', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API Key is required.' });
    }
    try {
        const openai = new OpenAI({ apiKey });
        await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say 'test'." }],
            max_tokens: 2,
        });
        res.json({ success: true, message: 'API Key is valid!' });
    } catch (error) {
        res.status(401).json({ success: false, message: 'API Key is invalid or expired.' });
    }
});

module.exports = router;