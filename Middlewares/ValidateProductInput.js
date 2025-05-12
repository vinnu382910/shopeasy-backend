const Joi = require('joi');

const productSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  brand: Joi.string().trim().max(50).optional(),
  category: Joi.string().trim().required(),
  subCategory: Joi.string().trim().required(),
  price: Joi.number().min(0.01).max(10000000).required(),
  discount: Joi.number().min(0).max(100).default(0),
  currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
  stock: Joi.number().integer().min(0).default(0),
  imageUrl: Joi.string().uri().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  rating: Joi.number().min(0).max(5).precision(1).default(0),
  reviewsCount: Joi.number().integer().min(0).default(0),
  tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
  warranty: Joi.string().max(100).required(),
  returnPolicy: Joi.string().max(200).required(),
  deliveryCharge: Joi.number().min(0).default(0),
  deliveryTime: Joi.string().max(50).required(),
  isFeatured: Joi.boolean().default(false),
  specifications: Joi.object().pattern(
    Joi.string().max(30), 
    Joi.string().max(100).allow('')
  ).default({}),
});

const validateProduct = (req, res, next) => {
  // Ensure body exists
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing" });
  }

  const { error } = productSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false
  });

  if (error) {
    console.log(error)
    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message.replace(/"/g, '')
    }));
    
    return res.status(422).json({
      message: "Validation failed",
      errors
    });
  }

  next();
};

module.exports = validateProduct;