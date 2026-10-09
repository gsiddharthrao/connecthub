const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { generateResumePdf } = require('../utils/pdfGenerator');

// @desc    Export profile resume to downloadable PDF
// @route   GET /api/profiles/:id/pdf or GET /api/pdf/:id
// @access  Public
const exportProfilePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    let profile = null;

    if (id === 'me' && req.user) {
      profile = await Profile.findOne({ user: req.user._id }).populate(
        'user',
        'name email avatar headline'
      );
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      profile = await Profile.findOne({
        $or: [{ _id: id }, { user: id }],
      }).populate('user', 'name email avatar headline');

      // If no profile record found, check if user exists
      if (!profile) {
        const user = await User.findById(id).select('name email avatar headline');
        if (user) {
          profile = {
            user,
            headline: user.headline || '',
            summary: '',
            skills: [],
            experience: [],
            education: [],
          };
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: `Resource not found with invalid id: ${id}`,
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Profile not found',
      });
    }

    const user = profile.user || {};
    const safeName = (user.name || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}-resume.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateResumePdf(profile, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportProfilePdf,
};
