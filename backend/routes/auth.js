// backend/routes/auth.js

// --- THIS IS THE TEST ---
// We will look for this exact message in your backend logs.
console.log("Auth.js v3 is running. Auto-verify is active.");

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();
const saltRounds = 10;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// POST /api/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, passwordConfirm } = req.body;
        if (!email || !password || !passwordConfirm) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }
        if (password !== passwordConfirm) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                emailVerified: true,
            },
        });

        req.session.userId = newUser.id;
        
        res.status(201).json({ message: "Account created successfully. Redirecting..." });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "An error occurred during signup." });
    }
});

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (!user.emailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true }
            });
        }
        
        req.session.userId = user.id;
        res.status(200).json({ message: "Login successful" });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

// ... (rest of the file remains the same)

// GET /api/verify-email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect(`${FRONTEND_URL}/verification-failed.html`);
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpires: { gt: new Date() },
        },
    });

    if (!user) {
        return res.redirect(`${FRONTEND_URL}/verification-failed.html`);
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
        },
    });

    res.redirect(`${FRONTEND_URL}/verification-success.html`);
});

// POST /api/resend-verification
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.emailVerified) {
            return res.json({ message: "If an account with this email exists and requires verification, a new email has been sent." });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: verificationToken,
                verificationTokenExpires: new Date(Date.now() + 3600 * 1000),
            },
        });

        await sendVerificationEmail(user.email, verificationToken);
        res.json({ message: "A new verification email has been sent." });
    } catch (error) {
        console.error("Resend Error:", error);
        res.status(500).json({ message: "An error occurred." });
    }
});


// POST /api/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).json({ message: 'Could not log out due to a server error.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful.' });
    });
});

module.exports = router;