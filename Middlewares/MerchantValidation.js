const Joi = require("joi");

const allowedEmailDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

// Middleware: Merchant Signup Validation
const merchantSignupValidation = (req, res, next) => {
    const schema = Joi.object({
        merchantName: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Merchant name is required.',
                'string.min': 'Merchant name must be at least 3 characters long.',
                'string.max': 'Merchant name must be less than 100 characters.'
            }),

        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .custom((value, helpers) => {
                const domain = value.split('@')[1];
                if (!allowedEmailDomains.includes(domain)) {
                    return helpers.message(`Email domain must be one of: ${allowedEmailDomains.join(', ')}`);
                }
                return value;
            })
            .messages({
                'string.empty': 'Email is required.',
                'string.email': 'Please enter a valid email address.'
            }),

        password: Joi.string()
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};:\'",.<>/?]).{8,}$'))
            .required()
            .messages({
                'string.empty': 'Password is required.',
                'string.pattern.base': 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
            }),

        phoneNumber: Joi.string()
            .pattern(/^[6-9]\d{9}$/)
            .required()
            .messages({
                'string.empty': 'Phone number is required.',
                'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number.'
            }),

        address: Joi.string()
            .min(10)
            .max(300)
            .required()
            .messages({
                'string.empty': 'Address is required.',
                'string.min': 'Address must be at least 10 characters long.',
                'string.max': 'Address must be less than 300 characters.'
            }),
        
        businessName: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Business name is required.',
                'string.min': 'Business name must be at least 3 characters long.',
                'string.max': 'Business name must be less than 100 characters.'
            }),

        gstNumber: Joi.string()
            .pattern(/^[0-9A-Z]{15}$/)
            .allow('', null) // Accept empty string or null as valid (optional field)
            .optional()
            .messages({
                'string.pattern.base': 'GST number must be a valid 15-character alphanumeric string.'
            }),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            message: 'Validation failed',
            errors: errorMessages
        });
    }

    next();
};

// Middleware: Merchant Login Validation
const merchantLoginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                'string.empty': 'Email is required.',
                'string.email': 'Please enter a valid email address.'
            }),

        password: Joi.string()
            .min(4)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Password is required.',
                'string.min': 'Password must be at least 4 characters.',
                'string.max': 'Password must be less than 100 characters.'
            }),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            message: 'Validation failed',
            errors: errorMessages
        });
    }

    next();
};

module.exports = {
    merchantSignupValidation,
    merchantLoginValidation
};
