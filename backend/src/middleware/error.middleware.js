const { errorResponse } = require('../utils/response.utils');

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, { statusCode: 400, message: 'Validation error', errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return errorResponse(res, { statusCode: 409, message });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, { statusCode: 400, message: 'Invalid ID format' });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, { statusCode, message });
};

module.exports = { notFound, errorHandler };
