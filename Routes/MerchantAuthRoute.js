const express = require('express');
const router = express.Router();
const { merchantSignupValidation, merchantLoginValidation} = require('../Middlewares/MerchantValidation');
const { merchantSignup, merchantLogin } = require('../Controllers/MerchantController');

router.post('/signup', merchantSignupValidation, merchantSignup);
router.post('/login', merchantLoginValidation, merchantLogin);

module.exports = router;
