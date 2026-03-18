const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response.utils');

/**
 * Middleware: checks express-validator result and returns 422 on failure
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
