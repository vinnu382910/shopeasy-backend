const Product = require("../Models/Product");
const Merchant = require('../Models/merchantDb');
const imageService = require('../services/imageService');

const addProduct = async (req, res) => {
  let rollbackImages = [];
  
  try {
    // 1. Extract product data from request body
    const {
      title,
      description,
      brand,
      category,
      subCategory,
      price,
      discount,
      currency = "INR",
      stock = 0,
      imageUrl,
      images = [],
      rating = 0,
      reviewsCount = 0,
      tags = [],
      warranty,
      returnPolicy,
      deliveryCharge = 0,
      deliveryTime,
      specifications = {},
      isFeatured = false
    } = req.body;

    // Track images for potential rollback
    if (imageUrl) rollbackImages.push(imageUrl);
    if (images?.length) rollbackImages = [...rollbackImages, ...images];

    // 2. Get merchant ID from authenticated user
    if (!req.merchant || !req.merchant._id) {
      return res.status(401).json({
        success: false,
        message: "Merchant authentication required"
      });
    }
    const merchantId = req.merchant._id;

    // 3. Calculate prices
    const numericPrice = parseFloat(price) || 0;
    const numericDiscount = parseFloat(discount) || 0;
    const numericDeliveryCharge = parseFloat(deliveryCharge) || 0;
    
    const discountedPrice = numericDiscount > 0
      ? Math.round(numericPrice - (numericPrice * numericDiscount) / 100)
      : numericPrice;
      
    const finalPrice = discountedPrice + numericDeliveryCharge;

    // 4. Prepare and validate tags
    const processedTags = Array.isArray(tags)
      ? tags
          .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '')
          .filter(tag => tag)
          .map(tag => tag.length > 30 ? tag.substring(0, 30) : tag)
      : [];

    // 5. Create new product
    const newProduct = new Product({
      title: title?.trim() || '',
      description: description?.trim() || '',
      brand: brand?.trim(),
      category: category?.trim() || '',
      subCategory: subCategory?.trim() || '',
      price: numericPrice,
      discount: numericDiscount,
      finalPrice,
      currency,
      stock: parseInt(stock) || 0,
      imageUrl,
      images: Array.isArray(images) ? images : [],
      rating: parseFloat(rating) || 0,
      reviewsCount: parseInt(reviewsCount) || 0,
      tags: processedTags,
      warranty: warranty?.trim() || '',
      returnPolicy: returnPolicy?.trim() || '',
      deliveryCharge: numericDeliveryCharge,
      deliveryTime: deliveryTime?.trim() || '',
      specifications: typeof specifications === 'object' ? specifications : {},
      isFeatured: Boolean(isFeatured),
      merchantId
    });

    // 6. Save product to database
    const savedProduct = await newProduct.save();

    // 7. Update merchant's product count
    try {
      await Merchant.findByIdAndUpdate(
        merchantId,
        { $inc: { productCount: 1 } },
        { new: true }
      );
    } catch (updateError) {
      console.warn("Could not update merchant product count:", updateError);
    }

    // 8. Return success response
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: savedProduct
    });

  } catch (err) {
    console.error("Error adding product:", err);
    
    // Rollback uploaded images if product creation failed
    if (rollbackImages.length > 0) {
      try {
        await imageService.deleteMultiple(rollbackImages);
        console.log('Rollback: Deleted uploaded images');
      } catch (rollbackErr) {
        console.error('Error during image rollback:', rollbackErr);
      }
    }

    // Handle different error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid data format';
    }

    return res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const merchantId = req.merchant._id;
  let imagesToDelete = [];

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.merchantId.toString() !== merchantId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized: Cannot update this product" 
      });
    }

    const updates = req.body;

    // Handle image updates
    if (updates.imageUrl !== undefined || updates.images !== undefined) {
      // Track old images for deletion if they're being replaced
      if (updates.imageUrl && product.imageUrl && updates.imageUrl !== product.imageUrl) {
        imagesToDelete.push(product.imageUrl);
      }
      
      if (updates.images) {
        // Determine which old images are no longer in the new list
        const newImages = Array.isArray(updates.images) ? updates.images : [];
        const imagesToKeep = newImages.filter(img => product.images.includes(img));
        imagesToDelete = [...imagesToDelete, ...product.images.filter(img => !imagesToKeep.includes(img))];
      }
    }

    // Handle other fields
    if (updates.images !== undefined) {
      updates.images = Array.isArray(updates.images) ? updates.images : [];
    }
    
    if (updates.specifications !== undefined) {
      updates.specifications = typeof updates.specifications === 'object' 
        ? updates.specifications 
        : {};
    }
    
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = Boolean(updates.isFeatured);
    }

    // Recalculate finalPrice if price or discount changed
    if (updates.price !== undefined || updates.discount !== undefined) {
      const price = updates.price !== undefined ? updates.price : product.price;
      const discount = updates.discount !== undefined ? updates.discount : product.discount;
      updates.finalPrice = Math.round(price - (price * discount) / 100);
    }

    if (updates.tags) {
      updates.tags = Array.isArray(updates.tags)
        ? updates.tags.map((tag) => tag.trim().toLowerCase())
        : [];
    }

    // Trim string fields if present
    const stringFields = [
      'title', 'description', 'brand', 'category', 
      'subCategory', 'warranty', 'returnPolicy', 
      'deliveryTime'
    ];
    
    stringFields.forEach((field) => {
      if (updates[field]) updates[field] = updates[field].trim();
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );

    // Delete old images after successful update
    if (imagesToDelete.length > 0) {
      try {
        await imageService.deleteMultiple(imagesToDelete);
      } catch (deleteErr) {
        console.error('Error deleting old images:', deleteErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const merchantId = req.merchant._id;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    if (product.merchantId.toString() !== merchantId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized: Cannot delete this product" 
      });
    }

    // Delete associated images first
    try {
      const imagesToDelete = [];
      if (product.imageUrl) imagesToDelete.push(product.imageUrl);
      if (product.images?.length) imagesToDelete.push(...product.images);
      
      if (imagesToDelete.length > 0) {
        await imageService.deleteMultiple(imagesToDelete);
      }
    } catch (imageErr) {
      console.error("Error deleting product images:", imageErr);
      // Continue with product deletion even if image deletion fails
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    // Update merchant's product count
    try {
      await Merchant.findByIdAndUpdate(
        merchantId,
        { $inc: { productCount: -1 } },
        { new: true }
      );
    } catch (updateError) {
      console.warn("Could not update merchant product count:", updateError);
    }

    res.status(200).json({ 
      success: true,
      message: "Product and associated images deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    let statusCode = 500;
    let message = "Server error";

    if (err.name === "CastError") {
      statusCode = 400;
      message = "Invalid product ID format";
    }

    res.status(statusCode).json({ 
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get Merchant Products (with pagination)
const getMerchantProducts = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const merchant = await Merchant.findById(merchantId)
      .select('merchantName email phoneNumber address businessName gstNumber isVerified');
    
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found." });
    }

    const [products, total] = await Promise.all([
      Product.find({ merchantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments({ merchantId })
    ]);

    res.status(200).json({
      merchantInfo: {
        name: merchant.merchantName,
        email: merchant.email,
        isVerified: merchant.isVerified
      },
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (err) {
    console.error("Error fetching merchant products:", err);
    res.status(500).json({ 
      message: "Server error while fetching products",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get a specific product by ID (Only products added by the logged-in merchant)
const getProductById = async (req, res) => {
  const { id } = req.params;
  const merchantId = req.merchant._id;

  try {
    // Fetch the product by ID where the merchantId matches the authenticated merchant's ID
    const product = await Product.findOne({ _id: id, merchantId: merchantId });

    if (!product) {
      return res.status(404).json({ message: "Product not found or not belonging to the authenticated merchant." });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ message: "Server error while fetching product" });
  }
};

module.exports = { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getMerchantProducts, 
  getProductById 
};