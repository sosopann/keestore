const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const userRoutes = require('./routes/users');
const couponRoutes = require('./routes/coupons');
const ticketRoutes = require('./routes/tickets');
const settingsRoutes = require('./routes/settings');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
const path = require('path');

// 🛡️ Security Middlewares
app.use(mongoSanitize()); // Prevent NoSQL Injection

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, // 5 attempts per 15 mins for sensitive routes
  message: { error: 'Too many login/register attempts. Please wait 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Middleware
app.use(cors({
  origin: ['https://keestore.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use JSON parser for all routes except Stripe Webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/orders/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // --- ADMIN ACCOUNT & MASSIVE DEMO SEEDER ---
    const Product = require('./models/Product');
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    // 1. Create Admin Account if it doesn't exist
    const adminExists = await User.findOne({ email: 'yassinkhaled193@gmail.com' });
    if (!adminExists) {
      console.log('Creating Root Admin account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Yassin980@', salt);
      await User.create({
         username: 'Admin',
         email: 'yassinkhaled193@gmail.com',
         password: hashedPassword,
         role: 'admin',
         isEmailVerified: true 
      });
      console.log('Admin account created: yassinkhaled193@gmail.com');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
