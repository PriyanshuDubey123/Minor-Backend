const express = require('express');
const { createCourse, fetchAllCourses, fetchCourseById, updateCourse } = require('../controller/Course');

const router = express.Router();

router.post('/',createCourse).get('/',fetchAllCourses).get('/:id',fetchCourseById)
.patch('/:id',updateCourse);

exports.router = router;