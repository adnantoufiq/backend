const express = require('express');
const { body, query } = require('express-validator');
const { createPost, getPosts, likePost, addComment } = require('../controllers/post.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

//  Create Post
router.post(
  '/',
  authenticate,
  [
    body('content')
      .trim()
      .notEmpty().withMessage('Post content is required')
      .isLength({ min: 1, max: 1000 }).withMessage('Post must be between 1 and 1000 characters'),
  ],
  validate,
  createPost
);

// Get All Posts (paginated, optional username filter)
router.get(
  '/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('username')
      .optional()
      .trim()
      .isLength({ max: 30 }).withMessage('Username filter too long'),
  ],
  validate,
  getPosts
);

//  Like / Unlike a Post 
router.post('/:id/like', authenticate, likePost);

//  Add Comment
router.post(
  '/:id/comment',
  authenticate,
  [
    body('text')
      .trim()
      .notEmpty().withMessage('Comment text is required')
      .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  ],
  validate,
  addComment
);

module.exports = router;
