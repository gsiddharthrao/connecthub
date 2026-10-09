const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/postController');
const protect = require('../middleware/auth');

router.route('/')
  .get(getPosts)
  .post(protect, createPost);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Like toggle (POST and PUT)
router.post('/:id/like', protect, toggleLike);
router.put('/:id/like', protect, toggleLike);

// Comment routes
router.route('/:id/comment')
  .post(protect, addComment);

router.route('/:id/comments')
  .get(getComments);

// Comment edit and delete routes (supporting nested and direct paths)
router.put('/:id/comment/:commentId', protect, updateComment);
router.put('/comments/:commentId', protect, updateComment);
router.delete('/:id/comment/:commentId', protect, deleteComment);
router.delete('/comments/:commentId', protect, deleteComment);

module.exports = router;
