const mongoose = require('mongoose');

// ── Comment Sub-Schema ────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// ── Post Schema ───────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [1, 'Post cannot be empty'],
      maxlength: [1000, 'Post cannot exceed 1000 characters'],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: like count
postSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

// Virtual: comment count
postSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

// Index for paginated feed (newest first)
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
