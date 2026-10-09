import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteComment, updateComment } from '../../store/slices/postsSlice';
import Avatar from '../common/Avatar';

export default function CommentList({
  postId,
  comments = [],
  postAuthorId,
  className = '',
}) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!comments || comments.length === 0) {
    return (
      <div className={`py-3 text-center text-xs text-gray-500 ${className}`}>
        No comments yet. Start the conversation!
      </div>
    );
  }

  const formatCommentDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleDelete = (commentId) => {
    if (!commentId || !postId) return;
    dispatch(deleteComment({ postId, commentId }));
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.content || comment.text || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim() || isSaving) return;
    try {
      setIsSaving(true);
      await dispatch(updateComment({ postId, commentId, content: editText.trim() })).unwrap();
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-2.5 pt-2 ${className}`}>
      {comments.map((comment) => {
        const commentAuthor = comment.user || {};
        const authorId = commentAuthor._id || commentAuthor;
        const currentUserId = user?._id;

        const isCommentAuthor = Boolean(
          currentUserId && authorId && currentUserId.toString() === authorId.toString()
        );
        const isPostAuthor = Boolean(
          currentUserId &&
            postAuthorId &&
            currentUserId.toString() === postAuthorId.toString()
        );
        const canDelete = isCommentAuthor || isPostAuthor;
        const isEditing = editingId === comment._id;

        const commentText = comment.content || comment.text || '';
        const commentDate = formatCommentDate(comment.createdAt);

        return (
          <div
            key={comment._id || Math.random().toString()}
            className="flex items-start space-x-2 text-xs group"
          >
            <Avatar
              src={commentAuthor.avatar}
              name={commentAuthor.name || 'Member'}
              size="xs"
              className="mt-0.5"
            />
            <div className="flex-1 bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-gray-900 leading-none">
                    {commentAuthor.name || 'ConnectHub Member'}
                  </span>
                  {commentAuthor.headline && (
                    <span className="text-[11px] text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">
                      &bull; {commentAuthor.headline}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  {commentDate && (
                    <span className="text-[11px] text-gray-400">{commentDate}</span>
                  )}
                  {isCommentAuthor && !isEditing && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(comment)}
                      className="text-gray-400 hover:text-brand-600 transition-colors p-0.5 rounded opacity-75 hover:opacity-100"
                      title="Edit comment"
                      aria-label="Edit comment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && !isEditing && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment._id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded opacity-75 hover:opacity-100"
                      title={isPostAuthor && !isCommentAuthor ? 'Moderate comment' : 'Delete comment'}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-1 space-y-1.5">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-brand-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2 py-0.5 text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(comment._id)}
                      disabled={isSaving || !editText.trim()}
                      className="px-2 py-0.5 text-[11px] bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {commentText}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
