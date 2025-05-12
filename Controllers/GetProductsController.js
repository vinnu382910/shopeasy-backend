const Product = require('../Models/Product');
const Merchant = require('../Models/merchantDb');
const UserCart = require('../Models/UserCart')
const WishList = require('../Models/WishList')
const mongoose = require('mongoose');

// Helper function for pagination
const paginateResults = async (query, req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 18;
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    query.skip(skip).limit(limit),
    Product.countDocuments(query.getFilter())
  ]);

  return {
    results,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Improved helper function to enrich products with merchant details
const enrichProductsWithMerchantDetails = async (products) => {
  if (!products || products.length === 0) return products;

  // Get all unique merchant IDs from products
  const merchantIds = [...new Set(
    products
      .map(p => p.merchantId?.toString())
      .filter(Boolean)
  )];
  
  if (merchantIds.length === 0) return products;

  const merchants = await Merchant.find({ 
    _id: { $in: merchantIds } 
  }).select('merchantName address businessName phoneNumber');

  const merchantMap = merchants.reduce((acc, merchant) => {
    acc[merchant._id.toString()] = {
      merchantName: merchant.merchantName,
      address: merchant.address,
      businessName: merchant.businessName,
      merchantPhoneNumber: merchant.phoneNumber
    };
    return acc;
  }, {});

  return products.map(product => {
    const productObj = product.toObject ? product.toObject() : product;
    return {
      ...productObj,
      merchantDetails: merchantMap[productObj.merchantId?.toString()] || null
    };
  });
};

// GET all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enhanced GET all products with better filtering and sorting
const getAllProducts = async (req, res) => {
  try {
    const { 
      minPrice = 0, 
      maxPrice = 100000000, 
      categories, 
      minRating, 
      sort, 
      featured,
      q,
      limit
    } = req.query;
    
    let query = Product.find();

    // Apply filters
    query = query.where('finalPrice').gte(Number(minPrice)).lte(Number(maxPrice));

    if (categories) {
      query = query.where('category').in(categories.split(','));
    }

    if (minRating) {
      query = query.where('rating').gte(Number(minRating));
    }

    if (featured === 'true') {
      query = query.where('isFeatured').equals(true);
    }

    if (q) {
      query = query.or([
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ]);
    }

    // Handle sorting
    if (sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    } else if (sort === 'featured') {
      query = query.sort({ isFeatured: -1 });
    } else if (sort === 'discount_desc') {
      return handleDiscountSorting(req, res);
    }

    // Execute query with pagination or custom limit
    let responseData;
    if (limit) {
      const results = await query.limit(Number(limit)).exec();
      const enrichedProducts = await enrichProductsWithMerchantDetails(results);
      responseData = { products: enrichedProducts };
    } else {
      const { results, pagination } = await paginateResults(query, req);
      const enrichedProducts = await enrichProductsWithMerchantDetails(results);
      responseData = { products: enrichedProducts, pagination };
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper for discount sorting
const handleDiscountSorting = async (req, res) => {
  try {
    const { categories, minPrice, maxPrice, minRating, featured, q, limit } = req.query;
    
    const aggregationPipeline = [
      {
        $addFields: {
          discountPercentage: {
            $multiply: [
              { $divide: [{ $subtract: ["$price", "$finalPrice"] }, "$price"] },
              100
            ]
          }
        }
      },
      { $sort: { discountPercentage: -1 } }
    ];

    // Apply filters
    const matchStage = {};
    if (categories) {
      matchStage.category = { $in: categories.split(',') };
    }
    if (minPrice || maxPrice) {
      matchStage.finalPrice = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    }
    if (minRating) {
      matchStage.rating = { $gte: Number(minRating) };
    }
    if (featured === 'true') {
      matchStage.isFeatured = true;
    }
    if (q) {
      matchStage.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      aggregationPipeline.unshift({ $match: matchStage });
    }

    if (limit) {
      aggregationPipeline.push({ $limit: Number(limit) });
    }

    const results = await Product.aggregate(aggregationPipeline);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts });
  } catch (err) {
    console.error('Error in discount sorting:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enhanced GET product by ID with improved recommendations
const getProductById = async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Product ID' });
  }

  try {
    // Get the main product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get similar and recommended products in parallel
    const [similarProducts, recommendedProducts] = await Promise.all([
      getSimilarProducts(product),
      getRecommendedProducts(product, token, req.user?.id)
    ]);

    // Enrich all products with merchant details
    const [enrichedProduct, enrichedSimilar, enrichedRecommended] = await Promise.all([
      enrichProductsWithMerchantDetails([product]),
      enrichProductsWithMerchantDetails(similarProducts),
      enrichProductsWithMerchantDetails(recommendedProducts)
    ]);

    // Ensure all products are unique and not the current product
    const uniqueSimilar = removeDuplicates(enrichedSimilar).filter(p => p._id.toString() !== id);
    const uniqueRecommended = removeDuplicates(enrichedRecommended).filter(p => p._id.toString() !== id);

    res.status(200).json({
      ...enrichedProduct[0],
      similarProducts: uniqueSimilar.slice(0, 10),
      productsYouMayLike: uniqueRecommended.slice(0, 10)
    });

  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Improved similar products logic
const getSimilarProducts = async (product) => {
  try {
    // First try to get by category and subcategory
    const similarByCategory = await Product.aggregate([
      {
        $match: {
          _id: { $ne: product._id },
          $or: [
            { category: product.category },
            { subCategory: product.subCategory }
          ]
        }
      },
      { $sample: { size: 10 } },
      { $limit: 10 }
    ]);

    // If not enough, try by brand
    if (similarByCategory.length < 5 && product.brand) {
      const similarByBrand = await Product.aggregate([
        {
          $match: {
            _id: { $ne: product._id },
            brand: product.brand
          }
        },
        { $limit: 10 - similarByCategory.length }
      ]);
      return [...similarByCategory, ...similarByBrand];
    }

    return similarByCategory;
  } catch (err) {
    console.error('Error getting similar products:', err);
    return [];
  }
};

// Enhanced recommended products logic
const getRecommendedProducts = async (product, token, userId) => {
  try {
    let recommendedProducts = [];
    
    // 1. Get from user's wishlist if available
    if (userId) {
      const wishlist = await WishList.findOne({ user: userId }).populate('items.productId');
      if (wishlist) {
        recommendedProducts = wishlist.items
          .map(item => item.productId)
          .filter(p => p.discount > 0 && p._id.toString() !== product._id.toString())
          .sort((a, b) => 
            ((b.price - b.finalPrice) / b.price) - ((a.price - a.finalPrice) / a.price)
          );
      }
    }

    // 2. Get high discount products if needed
    if (recommendedProducts.length < 10) {
      const needed = 10 - recommendedProducts.length;
      const excludeIds = [
        product._id,
        ...recommendedProducts.map(p => p._id)
      ];

      const highDiscountProducts = await Product.aggregate([
        {
          $match: {
            _id: { $nin: excludeIds },
            discount: { $gt: 0 }
          }
        },
        {
          $addFields: {
            discountPercentage: {
              $multiply: [
                { $divide: [{ $subtract: ["$price", "$finalPrice"] }, "$price"] },
                100
              ]
            }
          }
        },
        { $sort: { discountPercentage: -1 } },
        { $limit: needed }
      ]);

      recommendedProducts = [...recommendedProducts, ...highDiscountProducts];
    }

    // 3. Fallback to popular products if still needed
    if (recommendedProducts.length < 10) {
      const needed = 10 - recommendedProducts.length;
      const excludeIds = [
        product._id,
        ...recommendedProducts.map(p => p._id)
      ];

      const popularProducts = await Product.aggregate([
        {
          $match: {
            _id: { $nin: excludeIds },
            rating: { $gte: 4 }
          }
        },
        { $sort: { rating: -1, reviewsCount: -1 } },
        { $limit: needed }
      ]);

      recommendedProducts = [...recommendedProducts, ...popularProducts];
    }

    return recommendedProducts;
  } catch (err) {
    console.error('Error getting recommended products:', err);
    return [];
  }
};

// Helper function to remove duplicate products
const removeDuplicates = (products) => {
  const seen = new Set();
  return products.filter(product => {
    const id = product._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// GET products by category with improved sorting
const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    let query = Product.find({ category: new RegExp(category, 'i') });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    } else if (req.query.sort === 'discount_desc') {
      return res.status(400).json({ 
        message: 'Use /products endpoint with categories parameter for discount sorting' 
      });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts, pagination });
  } catch (err) {
    console.error('Error fetching products by category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET products by category and subcategory
const getProductsByCategoryAndSubcategory = async (req, res) => {
  const { category, subCategory } = req.params;
  
  try {
    let query = Product.find({ 
      category: new RegExp(category, 'i'),
      subCategory: new RegExp(subCategory, 'i')
    });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts, pagination });
  } catch (err) {
    console.error('Error fetching products by category and subcategory:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// SEARCH products with improved query handling
const searchProducts = async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    let query = Product.find({
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') }
      ]
    });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts, pagination });
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET featured products
const getFeaturedProducts = async (req, res) => {
  try {
    let query = Product.find({ isFeatured: true });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts, pagination });
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET new arrivals
const getNewArrivals = async (req, res) => {
  try {
    let query = Product.find().sort({ createdAt: -1 });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    const enrichedProducts = await enrichProductsWithMerchantDetails(results);
    res.status(200).json({ products: enrichedProducts, pagination });
  } catch (err) {
    console.error('Error fetching new arrivals:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET products by merchant
const getProductsByMerchant = async (req, res) => {
  const { merchantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(merchantId)) {
    return res.status(400).json({ message: 'Invalid Merchant ID' });
  }

  try {
    let query = Product.find({ merchantId });
    
    if (req.query.sort === 'price_asc') {
      query = query.sort({ finalPrice: 1 });
    } else if (req.query.sort === 'price_desc') {
      query = query.sort({ finalPrice: -1 });
    }
    
    const { results, pagination } = await paginateResults(query, req);
    
    const merchant = await Merchant.findById(merchantId)
      .select('merchantName address businessName');
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    const merchantDetails = {
      merchantName: merchant.merchantName,
      address: merchant.address,
      businessName: merchant.businessName
    };

    const productsWithMerchant = results.map(product => ({
      ...product.toObject(),
      merchantDetails
    }));

    res.status(200).json({ products: productsWithMerchant, pagination });
  } catch (err) {
    console.error('Error fetching merchant products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByCategoryAndSubcategory,
  searchProducts,
  getFeaturedProducts,
  getNewArrivals,
  getProductsByMerchant,
  getCategories
};