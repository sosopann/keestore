const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin ONLY routes
// Add a target product
router.post('/', auth, upload.single('image'), async (req, res) => { // Upload single image field
  try {
    const User = require('../models/User');
    const userRole = await User.findById(req.user._id);
    if (!userRole || userRole.role !== 'admin') {
       return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    
    // Check if req.file exists
    let finalizedImageUrl = req.body.imageUrl || '';
    if (req.file) {
       finalizedImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const priceNum = parseFloat(req.body.price);

    const product = new Product({
      title: req.body.title,
      description: req.body.description,
      price: isNaN(priceNum) ? 0 : priceNum,
      category: req.body.category || 'General',
      imageUrl: finalizedImageUrl
    });
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error("error posting product", error);
    res.status(500).json({ error: error.message });
  }
});

// Add keys to a product (Admin only)
router.post('/:id/keys', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // keys expected to be an array of strings
    if (Array.isArray(req.body.keys)) {
       product.keys = [...product.keys, ...req.body.keys];
       await product.save();
       res.json(product);
    } else {
       res.status(400).json({ error: 'Keys must be an array' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Product
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  try {
    const updateData = { ...req.body };
    if (req.file) {
       updateData.imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(product);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
