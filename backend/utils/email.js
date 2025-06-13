// backend/utils/email.js
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendVerificationEmail = async (to, token) => {
    // FIX: Use an environment variable for the URL to work in production
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const verificationUrl = `${backendUrl}/api/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Verify Your Email for MedReview AI',
        html: `
            <h1>Welcome to MedReview AI!</h1>
            <p>Thank you for signing up. Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">Verify My Email</a>
            <p>This link will expire in 1 hour.</p>
        `,
    };
    await transport.sendMail(mailOptions);
};