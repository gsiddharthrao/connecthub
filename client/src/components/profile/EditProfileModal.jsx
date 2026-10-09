import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Briefcase, Camera, Upload, Trash, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { updateMyProfile } from '../../store/slices/profileSlice';
import { updateAuthUser } from '../../store/slices/authSlice';
import { uploadMedia } from '../../services/mediaService';
import Button from '../common/Button';
import Input from '../common/Input';
import Avatar from '../common/Avatar';

export default function EditProfileModal({ isOpen, onClose, profile }) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const [formData, setFormData] = useState({
    avatar: '',
    headline: '',
    summary: '',
    location: '',
    website: '',
    skills: '',
    experience: [],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        avatar: profile.user?.avatar || profile.avatar || '',
        headline: profile.headline || '',
        summary: profile.summary || '',
        location: profile.location || '',
        website: profile.website || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        experience: Array.isArray(profile.experience)
          ? profile.experience.map((exp) => ({
              title: exp.title || '',
              company: exp.company || '',
              location: exp.location || '',
              from: exp.from ? new Date(exp.from).toISOString().slice(0, 10) : '',
              to: exp.to ? new Date(exp.to).toISOString().slice(0, 10) : '',
              current: Boolean(exp.current),
              description: exp.description || '',
            }))
          : [],
      });
      setPhotoError(null);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addExperienceField = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          from: '',
          to: '',
          current: false,
          description: '',
        },
      ],
    }));
  };

  const removeExperienceField = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be under 5MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoError(null);
      const res = await uploadMedia(file);
      if (res.url) {
        setFormData((prev) => ({ ...prev, avatar: res.url }));
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanedExperience = formData.experience
      .filter((exp) => exp.title.trim() && exp.company.trim())
      .map((exp) => ({
        ...exp,
        from: exp.from || undefined,
        to: exp.current ? undefined : exp.to || undefined,
      }));

    try {
      setIsSubmitting(true);
      await dispatch(
        updateMyProfile({
          avatar: formData.avatar,
          headline: formData.headline.trim(),
          summary: formData.summary.trim(),
          location: formData.location.trim(),
          website: formData.website.trim(),
          skills: skillsArray,
          experience: cleanedExperience,
        })
      ).unwrap();

      if (formData.avatar) {
        dispatch(updateAuthUser({ avatar: formData.avatar }));
      }
      onClose();
    } catch {
      // error handled in profile slice
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              Edit Professional Profile
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your photo, intro, bio, work history, and skills
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Profile Photo Section */}
          <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Profile Photo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar
                src={formData.avatar}
                name={profile?.user?.name || 'User'}
                size="xl"
                className="ring-2 ring-brand-500 shadow-sm"
              />

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    icon={
                      isUploadingPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-brand-600" />
                      )
                    }
                  >
                    {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </Button>

                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                      icon={<Trash className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="url"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="Or paste image URL (e.g. https://...)"
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                  />
                  <p className="text-[11px] text-gray-500">
                    Supports JPG, PNG, WEBP, GIF up to 5MB, or a direct image link.
                  </p>
                </div>

                {photoError && (
                  <p className="text-xs text-red-600 font-medium">{photoError}</p>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Professional Headline"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="e.g. Senior Full-Stack Engineer | Distributed Systems & Cloud"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. San Francisco Bay Area, CA"
            />

            <Input
              label="Website or Portfolio"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourportfolio.dev"
            />
          </div>

          <Input
            label="About Summary"
            name="summary"
            multiline
            rows={3}
            value={formData.summary}
            onChange={handleChange}
            placeholder="Write a brief overview of your background, industry experience, and professional goals."
          />

          <Input
            label="Skills & Competencies"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="React, Next.js, Node.js, Express, MongoDB, Tailwind CSS, TypeScript"
            helperText="Separate multiple skills with commas"
          />

          {/* Work Experience Section */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>Work Experience History</span>
              </h4>
              <button
                type="button"
                onClick={addExperienceField}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {formData.experience.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No experience items yet. Click &apos;Add Position&apos; above to record your employment history.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">
                        Position #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExperienceField(idx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Remove position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Job Title"
                        value={exp.title}
                        onChange={(e) =>
                          handleExperienceChange(idx, 'title', e.target.value)
                        }
                        placeholder="e.g. Lead Software Architect"
                        required
                      />
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(e) =>
                          handleExperienceChange(idx, 'company', e.target.value)
                        }
                        placeholder="e.g. TechCorp"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Start Date"
                        type="date"
                        value={exp.from}
                        onChange={(e) =>
                          handleExperienceChange(idx, 'from', e.target.value)
                        }
                      />
                      <Input
                        label="End Date"
                        type="date"
                        value={exp.to}
                        disabled={exp.current}
                        onChange={(e) =>
                          handleExperienceChange(idx, 'to', e.target.value)
                        }
                      />
                    </div>

                    <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          handleExperienceChange(idx, 'current', e.target.checked)
                        }
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>I currently work in this role</span>
                    </label>

                    <Input
                      label="Role Description"
                      multiline
                      rows={2}
                      value={exp.description}
                      onChange={(e) =>
                        handleExperienceChange(idx, 'description', e.target.value)
                      }
                      placeholder="Key achievements, technologies used, responsibilities..."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
