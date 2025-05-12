// middleware/cartMiddleware.js
const Product = require('../Models/Product');
const UserCart = require('../Models/UserCart');

// Validate product exists before adding to cart
const validateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    req.product = product; // Attach product to request
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if item already exists in cart
const checkExistingCartItem = async (req, res, next) => {
  try {
    const existingItem = await UserCart.findOne({
      userId: req.user._id,
      productId: req.body.productId
    });
    req.existingItem = existingItem; // Attach to request
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    validateProduct,
    checkExistingCartItem
  };
  