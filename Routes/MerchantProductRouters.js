const express = require("express");
const router = express.Router();

const { addProduct, updateProduct, deleteProduct, getMerchantProducts, getProductById } = require("../Controllers/MerchantProductController");
const verifyToken = require('../Middlewares/VerifyToken')
const verifyMerchant = require('../Middlewares/VerifyMerchant');
const validateProductInput = require('../Middlewares/ValidateProductInput')

// POST /api/products — Add a new product (only for verified merchants)
router.post("/additem", verifyToken, verifyMerchant, validateProductInput, addProduct);

// Update Product (only by the merchant who added it)
router.put("/update/:id", verifyToken, verifyMerchant, updateProduct);

// Delete Product (only by the merchant who added it)
router.delete("/delete/:id", verifyToken, verifyMerchant, deleteProduct);

router.get("/myproducts", verifyToken, verifyMerchant, getMerchantProducts);

router.get("/myproduct/:id", verifyToken, verifyMerchant, getProductById);

module.exports = router;
