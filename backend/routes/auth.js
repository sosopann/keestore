const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// Helper to verify Google reCAPTCHA
const verifyRecaptcha = async (token) => {
    if (!token) {
        console.log("reCAPTCHA Error: No token provided by the frontend.");
        return false;
    }
    try {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: secret,
                    response: token
                }
            }
        );
        
        console.log("Google reCAPTCHA Verification Response:", response.data);
        
        if (!response.data.success) {
            console.log("reCAPTCHA Failed details:", response.data['error-codes']);
        }
        
        return response.data.success;
    } catch (e) {
        console.error("reCAPTCHA Verification Exception:", e.message);
        return false;
    }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, ref, captchaToken } = req.body;
    
    // Verify CAPTCHA
    if (!await verifyRecaptcha(captchaToken)) {
        return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }

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
        
        if (user.emailVerificationCode !== code) {
            user.otpAttempts += 1;
            if (user.otpAttempts >= 3) {
                user.emailVerificationCode = undefined;
                await user.save();
                return res.status(400).json({ error: 'Too many failed attempts. Request a new code.' });
            }
            await user.save();
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        user.otpAttempts = 0;
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
    const { email, password, captchaToken } = req.body;

    // Verify CAPTCHA
    if (!await verifyRecaptcha(captchaToken)) {
        return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    // 🔒 Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const remaining = Math.round((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ error: `Account locked. Try again in ${remaining} minutes.` });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
            user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lockout
            user.loginAttempts = 0; // Reset counter for next cycle
        }
        await user.save();
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Reset attempts upon successful password match
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    if (!user.isEmailVerified) {
        // Enforce 2-min cooldown for verification email resends
        if (user.lastOtpSent && (Date.now() - user.lastOtpSent) < 2 * 60 * 1000) {
            return res.status(429).json({ error: 'Please wait 2 minutes before requesting a new code.' });
        }
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationCode = verificationCode;
        user.otpAttempts = 0; // Reset OTP attempts for new code
        user.lastOtpSent = Date.now();
        await user.save();
        
        await sendEmail({ email: user.email, subject: 'Verify your KeeStore Email', message: `<p>Your verification code is: <b>${verificationCode}</b></p>` }).catch(console.error);
        
        return res.json({ requiresEmailVerification: true, userId: user._id });
    }

    if (user.twoFactorEnabled) {
        // Check cooldown
        if (user.lastOtpSent && (Date.now() - user.lastOtpSent) < 2 * 60 * 1000) {
            return res.status(429).json({ error: 'Please wait 2 minutes between 2FA requests.' });
        }

        const twoFaCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = twoFaCode;
        user.twoFactorExpire = Date.now() + 10 * 60 * 1000;
        user.otpAttempts = 0; // Reset attempts
        user.lastOtpSent = Date.now();
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
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.twoFactorExpire < Date.now()) return res.status(400).json({ error: 'Code has expired' });

        if (user.twoFactorCode !== code) {
            user.otpAttempts += 1;
            if (user.otpAttempts >= 3) {
                user.twoFactorCode = undefined;
                await user.save();
                return res.status(400).json({ error: 'Too many failed attempts. Code invalidated.' });
            }
            await user.save();
            return res.status(400).json({ error: 'Invalid code' });
        }

        user.twoFactorCode = undefined;
        user.twoFactorExpire = undefined;
        user.otpAttempts = 0;
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
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Please provide an email' });

        const user = await User.findOne({ email });
        // Security best practice: don't reveal if user exists, but here the user wanted direct help
        if (!user) return res.status(404).json({ error: 'No user with that email' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const frontendUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await sendEmail({
            email: user.email,
            subject: 'KeeStore Password Reset Request',
            message: `<h1>Password Reset</h1><p>Click the link below to reset your password. Valid for 10 minutes:</p><a href="${resetUrl}" style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password Now</a>`
        });

        res.json({ success: true, message: 'Email sent successfully' });
    } catch(e) {
        console.error("Forgot Password Error:", e);
        res.status(500).json({ error: 'Server error while sending reset email.' });
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
