const User = require('../models/User');
const Profile = require('../models/Profile');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'DuplicateField',
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Create an initial empty profile for the user
    await Profile.create({
      user: user._id,
      headline: '',
      summary: '',
      skills: [],
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Protected
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await Profile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      user,
      profile: profile || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demo 1-click login for test account
// @route   POST /api/auth/demo
// @access  Public
const demoLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_LOGIN !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Demo login is disabled in production environment.',
      });
    }

    const demoEmail = 'sarah.chen@techcorp.io';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: 'Sarah Chen',
        email: demoEmail,
        password: 'Password123!',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      });

      await Profile.create({
        user: user._id,
        headline: 'Staff Distributed Systems Engineer @ TechCorp | Cloud Architecture & Scalability',
        summary: 'Passionate engineering leader building resilient cloud-native networking platforms, distributed microservices, and high-throughput data pipelines.',
        location: 'San Francisco, CA',
        skills: ['Node.js', 'Next.js', 'React', 'MongoDB Atlas', 'Distributed Systems', 'System Design'],
        experience: [
          {
            title: 'Staff Distributed Systems Engineer',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            from: new Date('2022-01-01'),
            current: true,
            description: 'Leading architecture for cloud-native applications and global social graph systems.',
          },
        ],
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  demoLogin,
};
