const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/response.utils');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'No token provided. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, { statusCode: 401, message: 'Token has expired. Please log in again.' });
      }
      return errorResponse(res, { statusCode: 401, message: 'Invalid token. Please log in.' });
    }

    // Fetch user (excludes password by default)
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, { statusCode: 401, message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
