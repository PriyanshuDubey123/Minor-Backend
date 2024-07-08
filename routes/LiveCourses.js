const express = require('express');
const { createCourse, getCourseByCourseId, uploadVideos, deleteVideo, Reviews, enrollCourse } = require('../controller/LiveCourses');
const { imageUpload, videoUpload } = require('../utils/cloudinary');
// Import the configurations

const router = express.Router();

// Routes
router.post('/upload/:id', imageUpload.single('thumbnail'), createCourse);
router.get('/getcourse/:id', getCourseByCourseId);
router.post('/upload/videos/:id', videoUpload.single('video'), uploadVideos);
router.delete('/deletevideo/:courseId/:videoId', deleteVideo);
router.put('/review/:id', Reviews);
router.post('/enroll/:courseId/:userId', enrollCourse);

module.exports = router;
