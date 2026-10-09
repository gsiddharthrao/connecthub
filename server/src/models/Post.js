const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Keep image and mediaUrl synchronized
postSchema.pre('save', function (next) {
  if (this.mediaUrl && !this.image) {
    this.image = this.mediaUrl;
  } else if (this.image && !this.mediaUrl) {
    this.mediaUrl = this.image;
  }
  next();
});

postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
