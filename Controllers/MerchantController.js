const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Merchant = require('../Models/merchantDb'); // Make sure this path is correct
require('dotenv').config();

// Merchant Signup Controller
const merchantSignup = async (req, res) => {
  try {
    const { merchantName, email, password, phoneNumber, address, businessName, gstNumber } = req.body;

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(409).json({ message: 'Merchant with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create merchant
    const newMerchant = new Merchant({
      merchantName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      businessName,
      gstNumber
    });

    await newMerchant.save();

    res.status(201).json({ message: 'Merchant registered successfully.' });
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Merchant Login Controller
const merchantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find merchant
    const merchant = await Merchant.findOne({ email });
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found.' });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, merchant.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { merchantId: merchant._id, email: merchant.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      merchant: {
        id: merchant._id,
        name: merchant.merchantName,
        email: merchant.email,
        phoneNumber: merchant.phoneNumber,
        businessName: merchant.businessName
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  merchantSignup,
  merchantLogin
};
