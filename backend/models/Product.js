const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'General' },
  imageUrl: { type: String, default: '' },
  keys: [{ type: String }] // Array of digital keys (text, license, etc.)
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
