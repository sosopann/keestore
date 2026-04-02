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

const app = express();
const path = require('path');

// Middleware
app.use(cors());

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
         isEmailVerified: true // Pre-verified so it bypasses code
      });
      console.log('Admin account created: yassinkhaled193@gmail.com');
    }

    const count = await Product.countDocuments();
    if (count === 0) {
       console.log('Database empty, seeding 1000 mock products... This might take a few seconds.');
       const dummyProducts = [];
       
       // Premium items
       dummyProducts.push({
           title: "FiveM Server License Tier 1",
           description: "Premium access to custom server scripts and resources for 1 month.",
           price: 15.00,
           imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
           keys: ["KEY-FIVEM-1234", "KEY-FIVEM-5678"]
       },
       {
           title: "Exclusive Gang Script Bundle",
           description: "Complete gang management system including inventory and boss menu.",
           price: 45.00,
           imageUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80",
           keys: ["KEY-GANG-999"]
       });

       // Auto-generate the rest to reach ~1000
       for(let i = 3; i <= 1000; i++) {
          dummyProducts.push({
             title: `Gaming Asset Pack v${i}`,
             description: `Automatically generated description for premium digital product number ${i}. High quality guaranteed.`,
             price: Math.floor(Math.random() * 100) + 5,
             imageUrl: `https://picsum.photos/seed/${i * 100}/800/600`, // Random consistent images
             keys: [`KEY-${i}-ABC`, `KEY-${i}-XYZ`]
          });
       }

       // Insert in chunks to avoid overwhelming memory if needed, but 1000 documents in mongodb is extremely fast.
       await Product.insertMany(dummyProducts);
       console.log('Successfully seeded 1000 products!');
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
