import React, { useState, useRef } from 'react';
import { MapPin, Globe, Edit3, FileText, CheckCircle2, Camera, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { updateMyProfile } from '../../store/slices/profileSlice';
import { updateAuthUser } from '../../store/slices/authSlice';
import { uploadMedia } from '../../services/mediaService';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onEditClick,
  className = '',
}) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  if (!profile) return null;

  const profileUser = profile.user || profile || {};
  const name = profileUser.name || 'ConnectHub Member';
  const headline = profile.headline || profileUser.headline || 'Professional on ConnectHub';
  const location = profile.location || '';
  const website = profile.website || '';
  const connectionsCount = profile.connectionsCount ?? 0;
  const userId = profileUser._id || profile._id || 'me';

  const formattedWebsite = website.startsWith('http://') || website.startsWith('https://')
    ? website
    : `https://${website}`;

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be under 5MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setUploadError(null);
      const res = await uploadMedia(file);

      if (res.url) {
        await dispatch(updateMyProfile({ avatar: res.url })).unwrap();
        dispatch(updateAuthUser({ avatar: res.url }));
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card noPadding className={`shadow-sm overflow-hidden ${className}`}>
      {/* Banner */}
      <div className="h-40 sm:h-52 bg-gradient-to-r from-brand-800 via-brand-600 to-blue-600 relative">
        <div className="absolute right-4 top-4">
          <span className="bg-black/30 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
            <span>ConnectHub Verified</span>
          </span>
        </div>
      </div>

      {/* Profile Header Details */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
          {/* Avatar with Camera Upload Overlay */}
          <div className="relative group shrink-0 self-start sm:self-auto">
            <Avatar
              src={profileUser.avatar}
              name={name}
              size="2xl"
              className="ring-4 ring-white shadow-md bg-white"
            />

            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  id="header-avatar-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Change profile picture"
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center ring-2 ring-white transition-all transform hover:scale-110 active:scale-95 disabled:opacity-75 cursor-pointer z-10"
                  aria-label="Upload profile photo"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Profile
              </Button>
            )}

            {/* Export Resume PDF Button */}
            <a
              href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')}/profiles/${userId}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="secondary"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5 text-brand-600" />}
              >
                Export Resume (PDF)
              </Button>
            </a>
          </div>
        </div>

        {uploadError && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {uploadError}
          </div>
        )}

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {name}
          </h1>

          <p className="text-base text-gray-700 font-medium">
            {headline}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-1">
            {location && (
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{location}</span>
              </span>
            )}

            {website && (
              <a
                href={formattedWebsite}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-brand-600 hover:text-brand-700 hover:underline font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{website}</span>
              </a>
            )}

            <span className="text-gray-300">&bull;</span>
            <span className="font-semibold text-brand-600">
              {connectionsCount} {connectionsCount === 1 ? 'Connection' : 'Connections'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
