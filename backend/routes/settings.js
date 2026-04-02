const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');

const fs = require('fs');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      const dir = path.join(__dirname, '../../frontend/public');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
  },
  filename: function(req, file, cb) {
      cb(null, 'logo.png'); // Always overwrite logo.png
  }
});
const upload = multer({ storage });

router.post('/logo', auth, upload.single('logo'), async (req, res) => {
    try {
        const User = require('../models/User');
        const u = await User.findById(req.user._id);
        if(!u || u.role !== 'admin') return res.status(403).json({error: 'Forbidden'});

        res.json({ success: true, message: 'Logo successfully updated. Refresh the page to see changes.' });
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
