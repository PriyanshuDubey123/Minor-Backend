const express = require('express');
const { becomeCreator, fetchCourseByCreatorId } = require('../controller/CreatorController');

const router = express.Router();

router.post('/become-creator/:id',becomeCreator);
router.get('/get/creator/courses/:id', fetchCourseByCreatorId);

exports.router = router;