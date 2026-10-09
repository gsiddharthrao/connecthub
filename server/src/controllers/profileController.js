const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Public
const getProfiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.skill) {
      query.skills = { $in: [new RegExp(req.query.skill, 'i')] };
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { headline: searchRegex },
        { summary: searchRegex },
        { location: searchRegex },
        { skills: searchRegex },
        ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const total = await Profile.countDocuments(query);
    const profiles = await Profile.find(query)
      .populate('user', 'name email avatar role')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      profiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Protected
const getMyProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email avatar role'
    );

    if (!profile) {
      // Create empty profile if not found
      profile = await Profile.create({
        user: req.user._id,
        headline: '',
        summary: '',
        skills: [],
      });
      profile = await profile.populate('user', 'name email avatar role');
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile by user ID or profile ID
// @route   GET /api/profiles/:id
// @access  Public
const getProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: `Resource not found with invalid id: ${id}`,
      });
    }

    const profile = await Profile.findOne({
      $or: [{ _id: id }, { user: id }],
    }).populate('user', 'name email avatar role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update user profile
// @route   PUT /api/profiles/me or POST /api/profiles
// @access  Protected
const upsertMyProfile = async (req, res, next) => {
  try {
    const {
      headline,
      summary,
      location,
      website,
      skills,
      experience,
      education,
      social,
      avatar,
      name,
    } = req.body;

    // Update user info if name or avatar passed
    if (avatar || name) {
      const userUpdates = {};
      if (avatar) userUpdates.avatar = avatar;
      if (name) userUpdates.name = name.trim();
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    const profileFields = {};
    if (headline !== undefined) profileFields.headline = headline;
    if (summary !== undefined) profileFields.summary = summary;
    if (location !== undefined) profileFields.location = location;
    if (website !== undefined) profileFields.website = website;

    if (skills !== undefined) {
      profileFields.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (experience !== undefined) profileFields.experience = experience;
    if (education !== undefined) profileFields.education = education;
    if (social !== undefined) profileFields.social = social;

    let profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email avatar role');

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profile and user
// @route   DELETE /api/profiles/me
// @access  Protected
const deleteMyProfile = async (req, res, next) => {
  try {
    await Profile.findOneAndDelete({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Profile and user account deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfiles,
  getMyProfile,
  getProfileById,
  upsertMyProfile,
  deleteMyProfile,
};
