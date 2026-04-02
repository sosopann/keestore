const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, ref } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    let referredBy = null;
    if (ref) {
        const inviter = await User.findOne({ referralCode: ref });
        if (inviter) {
            referredBy = inviter._id;
            inviter.walletBalance += 5;
            await inviter.save();
        }
    }

    const referralCode = username.toUpperCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000);
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({ 
        username, email, password: hashedPassword, role, referralCode, referredBy,
        emailVerificationCode: verificationCode,
        isEmailVerified: false
    });
    
    await user.save();

    // Send Verification Email
    try {
        await sendEmail({
            email: user.email,
            subject: 'Verify your KeeStore Email',
            message: `<h1>Welcome to KeeStore!</h1><p>Your verification code is: <b style="font-size:24px; color: #3b82f6;">${verificationCode}</b></p>`
        });
    } catch(e) {
        console.error("Email could not be sent:", e);
    }

    res.status(201).json({ message: 'User registered. Check your email for verification code.', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.isEmailVerified) return res.status(400).json({ error: 'Already verified' });
        if (user.emailVerificationCode !== code) return res.status(400).json({ error: 'Invalid verification code' });

        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        await user.save();

        const token = jwt.sign({ _id: user._id, role: user.role, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, username: user.username, email: user.email });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    if (!user.isEmailVerified) {
        // Resend code just in case
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationCode = verificationCode;
        await user.save();
        await sendEmail({ email: user.email, subject: 'Verify your KeeStore Email', message: `<p>Your verification code is: <b>${verificationCode}</b></p>` }).catch(console.error);
        
        return res.json({ requiresEmailVerification: true, userId: user._id });
    }

    if (user.twoFactorEnabled) {
        // Generate 2FA code
        const twoFaCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = twoFaCode;
        user.twoFactorExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'KeeStore Login Authorization (2FA)',
            message: `<p>A login attempt was made. Your authorization code is: <b style="font-size:24px; color: #ef4444;">${twoFaCode}</b></p><p>Valid for 10 minutes.</p>`
        }).catch(console.error);

        return res.json({ requires2FA: true, userId: user._id });
    }

    const token = jwt.sign({ _id: user._id, role: user.role, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA
router.post('/verify-2fa', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await User.findById(userId);
        
        if (!user || user.twoFactorCode !== code) return res.status(400).json({ error: 'Invalid or expired code' });
        if (user.twoFactorExpire < Date.now()) return res.status(400).json({ error: 'Code has expired' });

        user.twoFactorCode = undefined;
        user.twoFactorExpire = undefined;
        await user.save();

        const token = jwt.sign({ _id: user._id, role: user.role, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, username: user.username, email: user.email });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Toggle 2FA
router.put('/toggle-2fa', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.twoFactorEnabled = !user.twoFactorEnabled;
        await user.save();
        res.json({ twoFactorEnabled: user.twoFactorEnabled });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'No user with that email' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await sendEmail({
            email: user.email,
            subject: 'KeeStore Password Reset Request',
            message: `<p>You are receiving this email because you requested the reset of a password. Please click the following link to complete the process:</p>
                      <a href="${resetUrl}">Reset Password Link</a>
                      <p>Or paste this into your browser: <br> ${resetUrl}</p>`
        });

        res.json({ message: 'Email sent successfully' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password has been reset. You can now login.' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
