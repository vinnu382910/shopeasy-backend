const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../Controllers/CartController');
const { validateProduct, checkExistingCartItem } = require('../Middlewares/CartMiddleware');
const ensureAuthenticated = require("../Middlewares/Auth");

// POST /api/usercart - Add item to cart
router.post('/', 
    ensureAuthenticated, 
  validateProduct, 
  checkExistingCartItem, 
  addToCart
);

// GET /api/usercart - Get user's cart
router.get('/', 
    ensureAuthenticated, 
  getCart
);

// PUT /api/usercart/:productId - Update cart item quantity
router.put('/:productId',
    ensureAuthenticated, 
  validateProduct, 
  updateCartItem
);

// DELETE /api/usercart/:productId - Remove item from cart
router.delete('/:productId', 
    ensureAuthenticated, 
  removeFromCart
);

// DELETE /api/usercart - Clear user's cart
router.delete('/', 
    ensureAuthenticated, 
  clearCart
);

module.exports = router;