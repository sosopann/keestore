const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Create checkout session (Cart support for Stripe)
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { items } = req.body; // Expects layout: [ { productId, quantity } ]
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    let totalAmount = 0;
    const line_items = [];
    const productsToUpdate = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
      if (product.keys.length < item.quantity) return res.status(400).json({ error: `Not enough stock for ${product.title}` });
      
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: product.title, description: product.description },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });

      productsToUpdate.push({ product, quantity: item.quantity });
    }

    const order = new Order({
       user: req.user._id,
       status: 'pending',
       deliveredKey: 'Awaiting checkout...',
       product: productsToUpdate[0].product._id 
    });
    await order.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart?canceled=true`,
      metadata: { orderId: order._id.toString(), itemData: JSON.stringify(items) },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay with Wallet Route
router.post('/pay-wallet', auth, async (req, res) => {
  try {
    const { items, promoCode } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const User = require('../models/User');
    const Coupon = require('../models/Coupon');
    const user = await User.findById(req.user._id);

    let totalAmount = 0;
    let deliveredKeysArr = [];
    let productsToUpdate = [];

    for (let item of items) {
       const product = await Product.findById(item.productId);
       if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
       if (product.keys.length < item.quantity) return res.status(400).json({ error: `Not enough stock for ${product.title}` });
       totalAmount += (product.price * item.quantity);
       productsToUpdate.push({ product, quantity: item.quantity });
    }

    if (promoCode) {
        const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });
        if (coupon && (coupon.maxUses === 0 || coupon.currentUses < coupon.maxUses)) {
             totalAmount = totalAmount * (1 - (coupon.discountPercent / 100));
             coupon.currentUses += 1;
             await coupon.save();
        }
    } else {
        // Automatic 10% Referral Discount on First Order
        if (user.referredBy) {
             const Order = require('../models/Order');
             const existingOrdersCount = await Order.countDocuments({ user: user._id, status: 'success' });
             if (existingOrdersCount === 0) {
                  totalAmount = totalAmount * 0.90; // 10% off
             }
        }
    }

    if (user.walletBalance < totalAmount) {
       return res.status(400).json({ error: 'Insufficient Wallet Balance' });
    }

    // Deduct and fulfill
    user.walletBalance -= totalAmount;
    await user.save();

    for (let item of productsToUpdate) {
       for(let i=0; i<item.quantity; i++) {
           deliveredKeysArr.push(item.product.keys.shift());
       }
       await item.product.save();
    }

    // Record order
    const order = new Order({
       user: req.user._id,
       status: 'success',
       deliveredKey: deliveredKeysArr.join(', '),
       product: productsToUpdate[0].product._id 
    });
    await order.save();

    res.json({ success: true, order, balance: user.walletBalance });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Local dev verify-session bypass
router.post('/verify-session', auth, async (req, res) => {
  try {
     const { session_id, order_id } = req.body;
     if (!session_id || !order_id) return res.status(400).json({ error: 'Missing params' });

     const session = await stripe.checkout.sessions.retrieve(session_id);
     if (session.payment_status === 'paid') {
        const order = await Order.findById(order_id);
        if (order && order.status === 'pending') {
           const items = JSON.parse(session.metadata.itemData || "[]");
           let deliveredKeysArr = [];
           
           for (let item of items) {
               const product = await Product.findById(item.productId);
               if (product && product.keys.length >= item.quantity) {
                   for(let i=0; i<item.quantity; i++) {
                       deliveredKeysArr.push(product.keys.shift());
                   }
                   await product.save();
               }
           }
           
           order.status = 'success';
           order.deliveredKey = deliveredKeysArr.join(', ');
           await order.save();
           return res.json({ success: true, order });
        }
        return res.json({ success: true, message: 'Already processed' });
     }
     res.status(400).json({ error: 'Payment not completed' });
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook to fulfill the order
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = req.body; } catch (err) { return res.status(400).send(`Webhook Error`); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    try {
      const order = await Order.findById(orderId);
      if (order && order.status === 'pending') {
         const items = JSON.parse(session.metadata.itemData || "[]");
         let deliveredKeysArr = [];
         
         for (let item of items) {
             const product = await Product.findById(item.productId);
             if (product && product.keys.length >= item.quantity) {
                 for(let i=0; i<item.quantity; i++) {
                     deliveredKeysArr.push(product.keys.shift());
                 }
                 await product.save();
             }
         }
         
         order.status = 'success';
         order.deliveredKey = deliveredKeysArr.join(', ');
         await order.save();
      }
    } catch (e) { console.error(e); }
  }
  res.json({ received: true });
});

// Get user orders (Dashboard)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: 'success' })
      .populate('product', 'title imageUrl description price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: Get ALL Orders globally
router.get('/all', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const userRole = await User.findById(req.user._id);
    if (!userRole || userRole.role !== 'admin') {
       return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    const orders = await Order.find().populate('product', 'title price category').populate('user', 'username email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: Wipe single order
router.delete('/:id', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const userRole = await User.findById(req.user._id);
    if (!userRole || userRole.role !== 'admin') {
       return res.status(403).json({ error: 'Access denied' });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order wiped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: Wipe entirely all history
router.delete('/wipe/all', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const userRole = await User.findById(req.user._id);
    if (!userRole || userRole.role !== 'admin') {
       return res.status(403).json({ error: 'Access denied' });
    }
    await Order.deleteMany({});
    res.json({ message: 'All transaction history wiped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
