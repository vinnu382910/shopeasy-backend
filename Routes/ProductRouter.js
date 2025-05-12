const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByCategoryAndSubcategory,
  searchProducts,
  getFeaturedProducts,
  getNewArrivals,
  getProductsByMerchant,
  getCategories
} = require('../Controllers/GetProductsController');
const ensureAuthenticated = require("../Middlewares/Auth");

// Product routes
router.get('/', ensureAuthenticated, getAllProducts);
router.get('/search', ensureAuthenticated, searchProducts);
router.get('/featured', ensureAuthenticated, getFeaturedProducts);
router.get('/new', ensureAuthenticated, getNewArrivals);
router.get('/category/:category', ensureAuthenticated, getProductsByCategory);
router.get('/category/:category/:subCategory', ensureAuthenticated, getProductsByCategoryAndSubcategory);
router.get('/merchant/:merchantId', ensureAuthenticated, getProductsByMerchant);
router.get('/:id', ensureAuthenticated, getProductById);
router.get('/categories', ensureAuthenticated, getCategories);

module.exports = router;