const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Protected
const createPost = async (req, res, next) => {
  try {
    const { content, image, mediaUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Post content is required',
      });
    }

    const post = await Post.create({
      user: req.user._id,
      content: content.trim(),
      image: image || mediaUrl || '',
      mediaUrl: mediaUrl || image || '',
    });

    await post.populate('user', 'name email avatar headline');

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { isDeleted: { $ne: true } };
    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('user', 'name email avatar headline')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: `Resource not found with invalid id: ${id}`,
      });
    }

    const post = await Post.findById(id).populate('user', 'name email avatar headline');

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft-delete post
// @route   DELETE /api/posts/:id
// @access  Protected
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    const post = await Post.findById(id);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Post not found',
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to delete this post',
      });
    }

    // Soft-delete: retain record for auditing/compliance, mark as deleted
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
    await Comment.deleteMany({ post: post._id });

    res.status(200).json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on post (atomic increment / decrement)
// @route   POST /api/posts/:id/like
// @access  Protected
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Post not found',
      });
    }

    const isLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    let updatedPost;

    if (isLiked) {
      // User already liked -> unlike (atomic $pull and $inc -1 only if user is present in likes)
      updatedPost = await Post.findOneAndUpdate(
        { _id: id, likes: req.user._id },
        {
          $pull: { likes: req.user._id },
          $inc: { likesCount: -1 },
        },
        { new: true }
      );
      if (!updatedPost) {
        updatedPost = await Post.findById(id);
      }
      if (updatedPost.likesCount < 0) {
        updatedPost.likesCount = 0;
        await updatedPost.save();
      }

      return res.status(200).json({
        success: true,
        isLiked: false,
        likesCount: updatedPost.likesCount,
        likes: updatedPost.likes,
      });
    } else {
      // User has not liked -> like (atomic $addToSet and $inc 1 only if user is NOT in likes)
      updatedPost = await Post.findOneAndUpdate(
        { _id: id, likes: { $ne: req.user._id } },
        {
          $addToSet: { likes: req.user._id },
          $inc: { likesCount: 1 },
        },
        { new: true }
      );
      if (!updatedPost) {
        updatedPost = await Post.findById(id);
      }

      return res.status(200).json({
        success: true,
        isLiked: true,
        likesCount: updatedPost.likesCount,
        likes: updatedPost.likes,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Protected
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, text } = req.body;
    const commentText = content || text;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Comment content is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Post not found',
      });
    }

    const comment = await Comment.create({
      post: id,
      user: req.user._id,
      content: commentText.trim(),
      text: commentText.trim(),
    });

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $inc: { commentsCount: 1 } },
      { new: true }
    );

    await comment.populate('user', 'name email avatar headline');

    res.status(201).json({
      success: true,
      comment,
      commentsCount: updatedPost.commentsCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for post
// @route   GET /api/posts/:id/comments
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    const comments = await Comment.find({ post: id })
      .populate('user', 'name email avatar headline')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Protected
const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid comment ID',
      });
    }

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Comment not found',
      });
    }

    // If id is specified in URL, verify that comment belongs to this post
    if (id && comment.post.toString() !== id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Comment does not belong to specified post',
      });
    }

    const post = await Post.findById(comment.post);

    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    const isPostAuthor = post && post.user.toString() === req.user._id.toString();

    // Allow either the comment author OR the post author to delete the comment
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to delete this comment',
      });
    }

    await Comment.findByIdAndDelete(commentId);

    // Accurately decrement parent post commentsCount and clamp to 0
    if (comment.post) {
      const updatedPost = await Post.findByIdAndUpdate(
        comment.post,
        { $inc: { commentsCount: -1 } },
        { new: true }
      );
      if (updatedPost && updatedPost.commentsCount < 0) {
        updatedPost.commentsCount = 0;
        await updatedPost.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/posts/:id/comment/:commentId or PUT /api/posts/comments/:commentId
// @access  Protected
const updateComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content, text } = req.body;
    const commentText = content || text;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Comment content is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid comment ID',
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Comment not found',
      });
    }

    // Only the comment author can edit
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to edit this comment',
      });
    }

    comment.content = commentText.trim();
    comment.text = commentText.trim();
    await comment.save();
    await comment.populate('user', 'name email avatar headline');

    res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post content / media (Own post only)
// @route   PUT /api/posts/:id
// @access  Protected
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, mediaUrl, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid post ID',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Post content cannot be empty',
      });
    }

    const post = await Post.findById(id);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Post not found',
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to edit this post',
      });
    }

    post.content = content.trim();
    if (mediaUrl !== undefined) post.mediaUrl = mediaUrl;
    if (image !== undefined) post.image = image;
    post.updatedAt = new Date();

    await post.save();
    await post.populate('user', 'name email avatar headline');

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  updateComment,
};
