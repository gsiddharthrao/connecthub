import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Share2,
  Clock,
  MoreHorizontal,
  Trash2,
  Check,
  Edit2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import LikeButton from './LikeButton';
import CommentList from './CommentList';
import AddCommentForm from './AddCommentForm';
import api from '../../services/api';
import { deletePost, updatePost } from '../../store/slices/postsSlice';

export default function PostCard({ post, className = '' }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [imgError, setImgError] = useState(false);

  if (!post) return null;

  const author = post.user || {};
  const isPostAuthor = Boolean(
    isAuthenticated &&
      user?._id &&
      author?._id &&
      user._id.toString() === author._id.toString()
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        const url = `${window.location.origin}/post/${post._id}`;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleDeletePost = async () => {
    if (!isPostAuthor || isDeleting) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this post?')) {
      return;
    }
    try {
      setIsDeleting(true);
      await dispatch(deletePost(post._id)).unwrap();
    } catch (err) {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setEditError('Content cannot be empty');
      return;
    }
    try {
      setIsSaving(true);
      setEditError(null);
      await dispatch(
        updatePost({
          postId: post._id,
          content: editContent.trim(),
        })
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      setEditError(typeof err === 'string' ? err : 'Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  const mediaSource = post.mediaUrl || post.image;
  const commentsCount = post.commentsCount ?? (post.comments ? post.comments.length : 0);

  return (
    <Card noPadding className={`shadow-sm overflow-hidden ${className}`}>
      {/* Post Header */}
      <div className="p-4 pb-2 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Link href={author._id ? `/profile/${author._id}` : '#'}>
            <Avatar
              src={author.avatar}
              name={author.name || 'Member'}
              size="md"
              className="hover:opacity-90 transition-opacity cursor-pointer"
            />
          </Link>
          <div>
            <Link
              href={author._id ? `/profile/${author._id}` : '#'}
              className="text-sm font-semibold text-gray-900 leading-tight hover:text-brand-600 transition-colors"
            >
              {author.name || 'ConnectHub Member'}
            </Link>
            <p className="text-xs text-gray-500 line-clamp-1">
              {author.headline || 'Professional'}
            </p>
            <div className="flex items-center text-[11px] text-gray-400 mt-0.5 space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {isPostAuthor && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditContent(post.content);
                setEditError(null);
              }}
              disabled={isDeleting || isSaving}
              className="text-gray-400 hover:text-brand-600 p-1 rounded transition-colors"
              title="Edit post"
              aria-label="Edit post"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={isDeleting || isSaving}
              className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
              title="Delete post"
              aria-label="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 py-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Edit your post..."
              disabled={isSaving}
            />
            {editError && (
              <p className="text-xs text-red-600 font-medium">{editError}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                  setEditError(null);
                }}
                disabled={isSaving}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 rounded border border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-3 py-1 text-xs text-white bg-brand-600 hover:bg-brand-700 rounded font-medium disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* Post Media */}
      {mediaSource && !imgError && (
        <div className="mt-2 bg-gray-900 flex items-center justify-center max-h-96 overflow-hidden">
          <img
            src={mediaSource}
            alt="Post attachment"
            className="w-full object-cover max-h-96"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Engagement Counter Strip */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <span>{post.likesCount || 0} Likes</span>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="hover:text-brand-600 transition-colors"
        >
          {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="px-2 py-1 flex items-center justify-around border-b border-gray-100 bg-white">
        {/* Interactive Like Button */}
        <LikeButton
          postId={post._id}
          likes={post.likes}
          likesCount={post.likesCount || 0}
        />

        {/* Comment Toggle Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            showComments
              ? 'text-brand-600 bg-brand-50 font-semibold'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          title="Share post link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-gray-500" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <div className="p-4 bg-gray-50/80 border-t border-gray-100 space-y-3">
          <AddCommentForm postId={post._id} />
          <CommentList
            postId={post._id}
            comments={post.comments || []}
            postAuthorId={author._id}
          />
        </div>
      )}
    </Card>
  );
}
