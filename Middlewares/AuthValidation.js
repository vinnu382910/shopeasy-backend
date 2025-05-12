const Joi = require("joi");

const signupValidation = (req, res, next) => {
    const allowedEmailDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

    const schema = Joi.object({
        name: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Name is required.',
                'string.min': 'Name must be at least 3 characters long.',
                'string.max': 'Name must be less than 100 characters.'
            }),

        email: Joi.string()
            .email({ tlds: { allow: false } }) // Skip TLD check to allow common domains
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
                'string.pattern.base':
                    'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.'
            })
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

const loginValidation = (req, res, next) => {
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
    signupValidation,
    loginValidation
}
