const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Auto-generate ref code for legacy users
    if (!user.referralCode) {
        user.referralCode = user.username.toUpperCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000);
        await user.save();
    }

    res.json(user);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all users (Admin Only)
router.get('/', auth, async (req, res) => {
  try {
    const adminCheck = await User.findById(req.user._id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Wallet Balance (Admin Only)
router.put('/:id/wallet', auth, async (req, res) => {
  try {
    const adminCheck = await User.findById(req.user._id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const { balance } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    targetUser.walletBalance = Number(balance) || 0;
    await targetUser.save();
    
    res.json({ message: 'Balance updated', user: targetUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Role (Admin Only)
router.put('/:id/role', auth, async (req, res) => {
    try {
      const adminCheck = await User.findById(req.user._id);
      if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  
      const { role } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
  
      targetUser.role = role === 'admin' ? 'admin' : 'user';
      await targetUser.save();
      
      res.json({ message: 'Role updated', user: targetUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Delete User (Admin Only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const adminCheck = await User.findById(req.user._id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
