const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  merchantName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // prevents duplicate accounts
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/, // Indian number validation
  },
  address: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 300,
  },
  businessName: {
    type: String,
    minlength: 3,
    maxlength: 100,
    default: null,
  },
  gstNumber: {
    type: String,
    match: /^[0-9A-Z]{15}$/,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Merchant', merchantSchema);
