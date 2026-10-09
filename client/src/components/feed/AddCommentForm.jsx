import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addComment } from '../../store/slices/postsSlice';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function AddCommentForm({ postId, onCommentAdded, className = '' }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center ${className}`}>
        Please sign in to join the conversation.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await dispatch(addComment({ postId, content: content.trim() })).unwrap();
      setContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      // error handled in slice
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center space-x-2 pt-2 ${className}`}
    >
      <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" />
      <div className="flex-1 relative flex items-center">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a constructive comment..."
          className="w-full px-3.5 py-1.5 text-xs bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 pr-10 shadow-2xs"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="primary"
        disabled={!content.trim() || isSubmitting}
        isLoading={isSubmitting}
        className="rounded-full px-3 py-1.5 text-xs"
        icon={<Send className="w-3 h-3" />}
      >
        Post
      </Button>
    </form>
  );
}
