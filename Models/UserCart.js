// models/UserCart.js
const mongoose = require('mongoose');

const UserCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Optional: Price snapshot at time of adding
  priceAtAddition: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Compound index to prevent duplicate items
UserCartSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('UserCart', UserCartSchema);