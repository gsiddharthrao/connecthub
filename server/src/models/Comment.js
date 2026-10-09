const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    text: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Keep content and text synchronized
commentSchema.pre('save', function (next) {
  if (this.content && !this.text) {
    this.text = this.content;
  } else if (this.text && !this.content) {
    this.content = this.text;
  }
  next();
});

commentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
