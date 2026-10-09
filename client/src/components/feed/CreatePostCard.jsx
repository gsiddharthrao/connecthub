import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Send, Sparkles, Upload, X, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPost } from '../../store/slices/postsSlice';
import { uploadMedia } from '../../services/mediaService';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function CreatePostCard({ onPostCreated, className = '' }) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef(null);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { creating } = useAppSelector((state) => state.posts);

  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  if (!isAuthenticated) {
    return (
      <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-center py-6 shadow-sm ${className}`}>
        <Sparkles className="w-8 h-8 text-brand-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-gray-900">
          Connect with professionals worldwide
        </h3>
        <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 mb-4">
          Join ConnectHub to share updates, publish articles, and exchange opportunities with industry peers.
        </p>
        <div className="flex justify-center space-x-3">
          <Link href="/login">
            <Button variant="primary" size="sm">
              Sign In to Post
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || creating) return;

    try {
      await dispatch(
        createPost({
          content: content.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
        })
      ).unwrap();

      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      setUploadError(null);
      if (onPostCreated) onPostCreated();
    } catch {
      // error tracked in store
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSvg = file.type === 'image/svg+xml' || (file.name || '').toLowerCase().endsWith('.svg');
    if (isSvg) {
      setUploadError('SVG uploads are rejected for security reasons. Please upload JPG, PNG, WEBP, or GIF.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Only raster image files (JPEG, PNG, WEBP, GIF) are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploadingMedia(true);
      setUploadError(null);
      const res = await uploadMedia(file);
      if (res.url) {
        setMediaUrl(res.url);
      }
    } catch (err) {
      setUploadError('Failed to upload image. Please try again or paste image URL.');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
          <div className="flex-1">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start a post, share career milestones or insights..."
              className="w-full p-2.5 text-sm bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-all"
            />

            {/* Media Upload / URL Input Drawer */}
            {showMediaInput && (
              <div className="mt-2 space-y-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://...)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {isUploadingMedia ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-brand-600" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                )}

                {/* Media Preview Thumbnail */}
                {mediaUrl && (
                  <div className="relative inline-block mt-1">
                    <img
                      src={mediaUrl}
                      alt="Upload preview"
                      className="h-20 w-auto max-w-xs object-cover rounded border border-gray-200 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrl('')}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMediaInput(!showMediaInput)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              showMediaInput || mediaUrl
                ? 'bg-brand-50 text-brand-600'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span>{showMediaInput ? 'Hide Media' : mediaUrl ? 'Media Attached' : 'Add Image / Media'}</span>
          </button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={creating}
            disabled={!content.trim() || creating || isUploadingMedia}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
