const mongoose = require('mongoose');

const LiveCourseSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator' },
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
      required: false,
    },
    videoUrl: {
      type: String,
      required: true,
    }
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deleted:{
    type:Boolean,
    default:false,
  },
  isPublished:{
    type:Boolean,
    default:false
  },
  underReview:{
   type:Boolean,
   default:false
  }
}, { timestamps: true });

const LiveCourses = mongoose.model('LiveCourses', LiveCourseSchema);

module.exports = LiveCourses;
