const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  deliveredKey: { type: String, required: true }, // The unique key assigned to this order
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  stripeSessionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
