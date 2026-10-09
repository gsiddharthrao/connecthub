import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleLikePost } from '../../store/slices/postsSlice';

export default function LikeButton({
  postId,
  likes = [],
  likesCount = 0,
  className = '',
}) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const isLiked = Boolean(
    isAuthenticated &&
      user &&
      Array.isArray(likes) &&
      likes.some((like) => {
        const id = typeof like === 'object' && like !== null ? like._id : like;
        return id && user._id && id.toString() === user._id.toString();
      })
  );

  const handleToggle = (e) => {
    e.preventDefault();
    if (!isAuthenticated || !postId) return;
    dispatch(toggleLikePost(postId));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!isAuthenticated}
      title={
        !isAuthenticated
          ? 'Sign in to like this post'
          : isLiked
          ? 'Unlike post'
          : 'Like post'
      }
      aria-label={isLiked ? 'Unlike post' : 'Like post'}
      className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
        isLiked
          ? 'text-brand-600 bg-brand-50 hover:bg-brand-100 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${className}`}
    >
      <ThumbsUp
        className={`w-4 h-4 transition-transform duration-150 ${
          isLiked ? 'fill-current text-brand-600 scale-105' : 'text-gray-500'
        }`}
      />
      <span>{likesCount > 0 ? `${likesCount} ${likesCount === 1 ? 'Like' : 'Likes'}` : 'Like'}</span>
    </button>
  );
}
