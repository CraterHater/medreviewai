// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();
const saltRounds = 10;

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
            // If user exists and is verified, reject
            if (existingUser.emailVerified) {
                return res.status(409).json({ message: "An account with this email already exists." });
            }
            // If user is unverified and token is old, allow overwrite by deleting the old record
            const oneHourAgo = new Date(Date.now() - 3600 * 1000);
            if (existingUser.verificationTokenExpires < oneHourAgo) {
                await prisma.user.delete({ where: { email } });
            } else {
                return res.status(409).json({ message: "This email is already pending verification. Please check your inbox or wait an hour to try again." });
            }
        }

        const passwordHash = await bcrypt.hash(password, saltRounds);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                emailVerified: false,
                verificationToken: verificationToken,
                verificationTokenExpires: new Date(Date.now() + 3600 * 1000), // 1 hour from now
            },
        });

        await sendVerificationEmail(user.email, verificationToken);
        
        res.status(201).json({ message: "Account created! Please check your email to verify your account." });
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
            // Send a specific status and flag for the frontend to handle
            return res.status(403).json({ message: "Please verify your email address.", unverified: true });
        }
        
        req.session.userId = user.id;
        res.status(200).json({ message: "Login successful" });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

// GET /api/verify-email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/verification-failed.html');
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpires: { gt: new Date() }, // Check if token is not expired
        },
    });

    if (!user) {
        return res.redirect('/verification-failed.html');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
        },
    });

    res.redirect('/verification-success.html');
});

// POST /api/resend-verification
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        // Don't reveal if the user exists. And don't resend if already verified.
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
            // FIX: Return a JSON error instead of redirecting
            return res.status(500).json({ message: 'Could not log out due to a server error.' });
        }
        res.clearCookie('connect.sid');
        // FIX: Return a JSON success message instead of redirecting
        res.status(200).json({ message: 'Logout successful.' });
    });
});

module.exports = router;