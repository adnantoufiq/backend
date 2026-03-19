const Post = require('../models/post.model');
const User = require('../models/user.model');
const { sendPushNotification } = require('../config/firebase');
const { successResponse, errorResponse } = require('../utils/response.utils');

const clearInvalidAuthorTokenIfNeeded = async (authorId, result) => {
  if (!result || result.ok || result.skipped) return;

  if (result.reason === 'invalid-token' || result.reason === 'sender-id-mismatch') {
    await User.findByIdAndUpdate(authorId, { fcmToken: null });
    console.log(`🧹 Cleared stale FCM token for user ${authorId}`);
  }
};

// populate post fields 
const populatePost = (query) =>
  query
    .populate('author', 'username')
    .populate('comments.user', 'username');

// Create Post 

const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    const post = await Post.create({ author: req.user._id, content });
    const populated = await populatePost(Post.findById(post._id));

    return successResponse(res, {
      statusCode: 201,
      message: 'Post created successfully',
      data: { post: populated },
    });
  } catch (error) {
    next(error);
  }
};

// Get All Posts (paginated) 

const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.username) {
      const userToFilter = await User.findOne({
        username: { $regex: new RegExp(`^${req.query.username}$`, 'i') },
      });
      if (userToFilter) {
        filter.author = userToFilter._id;
      } else {
        // Username not found → return empty results
        return successResponse(res, {
          data: {
            posts: [],
            pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          },
        });
      }
    }

    const [posts, total] = await Promise.all([
      populatePost(Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Post.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Add isLiked flag if user is authenticated
    const postsWithMeta = posts.map((post) => {
      const postObj = post.toObject({ virtuals: true });
      postObj.isLiked = req.user
        ? post.likes.some((id) => id.toString() === req.user._id.toString())
        : false;
      return postObj;
    });

    return successResponse(res, {
      data: {
        posts: postsWithMeta,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Like / Unlike Post

const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username fcmToken');
    if (!post) {
      return errorResponse(res, { statusCode: 404, message: 'Post not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return successResponse(res, {
        message: 'Post unliked',
        data: { liked: false, likesCount: post.likes.length },
      });
    } else {
      // Like
      post.likes.push(userId);
      await post.save();

      // Send FCM notification to post author (skip self-likes)
      if (post.author._id.toString() !== userId.toString() && post.author.fcmToken) {
        const notificationResult = await sendPushNotification({
          fcmToken: post.author.fcmToken,
          title: '❤️ New Like',
          body: `${req.user.username} liked your post`,
          data: { postId: post._id.toString(), type: 'like' },
        });

        await clearInvalidAuthorTokenIfNeeded(post.author._id, notificationResult);
      }

      return successResponse(res, {
        message: 'Post liked',
        data: { liked: true, likesCount: post.likes.length },
      });
    }
  } catch (error) {
    next(error);
  }
};

//  Add Comment 

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id).populate('author', 'username fcmToken');
    if (!post) {
      return errorResponse(res, { statusCode: 404, message: 'Post not found' });
    }

    const comment = { user: req.user._id, text };
    post.comments.push(comment);
    await post.save();

    // Return the newly added comment (last item)
    const newComment = post.comments[post.comments.length - 1];

    // Populate comment user info
    await post.populate('comments.user', 'username');
    const populatedComment = post.comments.id(newComment._id);

    // Send FCM notification to post author (skip self-comments)
    if (post.author._id.toString() !== req.user._id.toString() && post.author.fcmToken) {
      const notificationResult = await sendPushNotification({
        fcmToken: post.author.fcmToken,
        title: '💬 New Comment',
        body: `${req.user.username} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        data: { postId: post._id.toString(), type: 'comment' },
      });

      await clearInvalidAuthorTokenIfNeeded(post.author._id, notificationResult);
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Comment added successfully',
      data: { comment: populatedComment },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getPosts, likePost, addComment };
