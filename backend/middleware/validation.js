const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
  }),

  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
    token: Joi.string().required().messages({
      'any.required': 'Invitation token is required'
    })
  }),

  product: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).allow('', null),
    price: Joi.number().positive().precision(2).required(),
    quantity: Joi.number().integer().min(0).required(),
    threshold: Joi.number().integer().min(0).default(10),
    sku: Joi.string().max(20).allow('', null)
  }),

  sale: Joi.object({
    productId: Joi.string().required(),
    quantitySold: Joi.number().integer().positive().required(),
    notes: Joi.string().max(200).allow('', null)
  }),

  invite: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('ADMIN', 'STAFF').default('STAFF')
  }),

  calendarEvent: Joi.object({
    title: Joi.string().min(2).max(100).required(),
    date: Joi.date().iso().required(),
    type: Joi.string().valid('MEETING', 'HARVEST', 'PLANTING', 'MAINTENANCE', 'GENERAL').default('GENERAL'),
    description: Joi.string().max(500).allow('', null)
  }),

  project: Joi.object({
    title: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD').default('PLANNING'),
    startDate: Joi.date().iso().allow(null),
    endDate: Joi.date().iso().allow(null)
  }),

  task: Joi.object({
    title: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE').default('TODO'),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
    projectId: Joi.string().allow(null),
    assignedTo: Joi.string().allow(null),
    dueDate: Joi.date().iso().allow(null)
  })
};

module.exports = {
  validate,
  schemas
};
