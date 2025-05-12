const UserCart = require('../Models/UserCart');

/**
 * @desc    Add or update item in cart
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with cart item or error
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    let cartItem;
    if (req.existingItem) {
      // Update existing item quantity
      cartItem = await UserCart.findByIdAndUpdate(
        req.existingItem._id,
        { $inc: { quantity } },
        { new: true }
      ).populate('productId');
    } else {
      // Create new cart item
      cartItem = await UserCart.create({
        userId,
        productId,
        quantity,
        priceAtAddition: req.product.finalPrice
      });
      
      // Populate after creation
      cartItem = await UserCart.findById(cartItem._id).populate('productId');
    }

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's cart with calculated total
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with cart items and total
 */
/**
 * @desc    Get user's cart with detailed price calculations
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with cart items and price details
 */
const getCart = async (req, res) => {
  try {
    const cartItems = await UserCart.find({ userId: req.user._id })
      .populate({
        path: 'productId',
        select: 'title description price finalPrice imageUrl rating reviewsCount merchantId discount',
        populate: {
          path: 'merchantId',
          select: 'businessName merchantName address merchantPhoneNumber'
        }
      })
      .lean();

    // Calculate various price metrics
    const priceDetails = cartItems.reduce((acc, item) => {
      const actualPrice = item.productId.price * item.quantity;
      const finalPrice = item.productId.finalPrice * item.quantity;
      const discount = actualPrice - finalPrice;

      return {
        totalActualPrice: acc.totalActualPrice + actualPrice,
        totalFinalPrice: acc.totalFinalPrice + finalPrice,
        totalDiscount: acc.totalDiscount + discount,
        totalItems: acc.totalItems + item.quantity,
        items: [...acc.items, {
          ...item,
          actualPrice,
          finalPrice,
          discount
        }]
      };
    }, {
      totalActualPrice: 0,
      totalFinalPrice: 0,
      totalDiscount: 0,
      totalItems: 0,
      items: []
    });

    return res.status(200).json({
      success: true,
      count: cartItems.length,
      data: {
        items: priceDetails.items,
        summary: {
          totalActualPrice: priceDetails.totalActualPrice,
          totalFinalPrice: priceDetails.totalFinalPrice,
          totalDiscount: priceDetails.totalDiscount,
          totalItems: priceDetails.totalItems,
          // Default delivery charge (can be modified by client based on items count)
          deliveryCharge: priceDetails.items.length >= 3 ? 0 : 50,
          grandTotal: priceDetails.totalFinalPrice + (priceDetails.items.length >= 3 ? 0 : 50)
        }
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cart items',
      error: error.message
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with updated cart item or error
 */
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const updatedItem = await UserCart.findOneAndUpdate(
      { userId: req.user._id, productId },
      { quantity },
      { new: true }
    ).populate('productId');

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

/**
 * @desc    Remove item from cart
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with success message or error
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const deletedItem = await UserCart.findOneAndDelete({
      userId: req.user._id,
      productId
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

/**
 * @desc    Clear user's entire cart
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @returns {Object} - Response with success message or error
 */
const clearCart = async (req, res) => {
  try {
    await UserCart.deleteMany({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};