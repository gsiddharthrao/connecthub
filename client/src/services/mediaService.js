import api from './api';

/**
 * Upload an image media file to backend
 * Returns { success: true, url: string, filename: string, storage: 'cloudinary' | 'local' }
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<{ success: boolean, url: string, filename: string, storage: string }>}
 */
export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Construct URL for downloading profile resume PDF
 * @param {string} profileId - User ID or Profile ID
 * @returns {string}
 */
export const getPdfResumeUrl = (profileId) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return `${baseURL}/profiles/${profileId}/pdf`;
};

export default {
  uploadMedia,
  getPdfResumeUrl,
};
