const express = require('express');
const { body } = require('express-validator');
const { signup, login, updateFcmToken, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// ── Signup ────────────────────────────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// ── Get current user profile ──────────────────────────────────────────────────
router.get('/me', authenticate, getMe);

// ── Update FCM Token ──────────────────────────────────────────────────────────
router.put(
  '/fcm-token',
  authenticate,
  [
    body('fcmToken')
      .notEmpty().withMessage('FCM token is required')
      .isString().withMessage('FCM token must be a string'),
  ],
  validate,
  updateFcmToken
);

module.exports = router;
