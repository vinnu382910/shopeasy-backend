const express = require('express');
const router = express.Router();
const Wishlist = require('../Models/WishList');
const ensureAuthenticated = require("../Middlewares/Auth");

// Add to wishlist
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    
    const existingItem = await Wishlist.findOne({
      userId: req.user._id,
      productId
    });

    if (existingItem) {
      return res.status(400).json({ 
        success: false,
        message: 'Product already in wishlist' 
      });
    }

    const wishlistItem = await Wishlist.create({
      userId: req.user._id,
      productId
    });

    res.status(201).json({
      success: true,
      data: wishlistItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove from wishlist
router.delete('/:productId', ensureAuthenticated, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId: req.params.productId
    });

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's wishlist
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user._id })
      .populate('productId')
      .lean();

    res.json({
      success: true,
      count: wishlist.length,
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;