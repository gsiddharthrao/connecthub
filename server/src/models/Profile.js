const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Job title is required'], trim: true },
  company: { type: String, required: [true, 'Company name is required'], trim: true },
  location: { type: String, trim: true, default: '' },
  from: { type: Date, required: [true, 'Start date is required'] },
  to: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, default: '' },
});

const educationSchema = new mongoose.Schema({
  school: { type: String, required: [true, 'School/University is required'], trim: true },
  degree: { type: String, trim: true, default: '' },
  fieldOfStudy: { type: String, trim: true, default: '' },
  from: { type: Date },
  to: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, default: '' },
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, maxlength: 140, default: '' },
    summary: { type: String, trim: true, maxlength: 3000, default: '' },
    location: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],
    social: {
      linkedin: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

profileSchema.index({ skills: 1 });
profileSchema.index({ headline: 'text', summary: 'text', location: 'text' });

module.exports = mongoose.model('Profile', profileSchema);
