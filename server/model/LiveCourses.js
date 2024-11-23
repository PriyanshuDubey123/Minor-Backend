const mongoose = require('mongoose');

const LiveCourseSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  language: { type: String, required: true },

  category:
    { type: String, required: true },
  special: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  videos: [{
    title: {
      type: String,
    },
    videoUrls: [{
      resolution: { type: String },
      url: { type: String },
    }]
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deleted: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  underReview: {
    type: Boolean,
    default: false
  },
  modification: {
    type: String
  },
  modificationCount: {
    type: Number,
    default: 0
  },
  discountPercentage:{
    type:Number,
    default:0,
    min: 0, max: 100
  },
  ratings:[{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 }
  }],
  overAllRating: {
    type: Number,
    default: 0
  } 
}, { timestamps: true });

const LiveCourses = mongoose.model('LiveCourses', LiveCourseSchema);

module.exports = LiveCourses;
