const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, index: true },
  brand: { type: String, index: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String, index: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { 
    type: Number,
    default: function() {
      return this.price - (this.price * (this.discount / 100));
    }
  },
  currency: { type: String, default: "INR" },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String, required: true },
  images: [{ type: String }], // Add multiple images support
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  tags: [{ type: String, index: true }],
  warranty: { type: String },
  returnPolicy: { type: String },
  deliveryCharge: { type: Number, default: 0 },
  deliveryTime: { type: String },
  specifications: { type: mongoose.Schema.Types.Mixed }, // For product specs
  isFeatured: { type: Boolean, default: false },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add indexes for better search performance
productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

// Pre-save hook to calculate final price
productSchema.pre('save', function(next) {
  if (this.isModified('price') || this.isModified('discount')) {
    this.finalPrice = this.price - (this.price * (this.discount / 100));
  }
  next();
});

productSchema.pre('save', function(next) {
  this.isFeatured = this.isFeatured !== undefined ? this.isFeatured : false;
  this.specifications = this.specifications || {};
  this.images = this.images || [];
  next();
});

module.exports = mongoose.model("Product", productSchema);