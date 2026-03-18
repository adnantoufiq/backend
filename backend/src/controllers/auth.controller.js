const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');

/**
 * POST /api/auth/signup
 * Register a new user
 */
const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check for existing email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return errorResponse(res, { statusCode: 409, message: `This ${field} is already registered` });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    return successResponse(res, {
      statusCode: 201,
      message: 'Account created successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate an existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select password explicitly (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, { statusCode: 401, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, { statusCode: 401, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    // Return user without password
    const userObj = user.toJSON();

    return successResponse(res, {
      statusCode: 200,
      message: 'Logged in successfully',
      data: { user: userObj, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/fcm-token
 * Save or update user's FCM token for push notifications
 */
const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(req.user._id, { fcmToken });

    return successResponse(res, { message: 'FCM token updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user profile
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, { data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, updateFcmToken, getMe };
