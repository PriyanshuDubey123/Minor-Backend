const express = require('express');
const { fetchUserById, updateUser, getPurchasedCourses, fetchTransactions, getUserProfile, updateUserProfile } = require('../controller/User');
const { imageUpload } = require('../utils/cloudinary');

const router = express.Router();

router.get('/:id',fetchUserById)
.patch('/:id',updateUser)
.get('/purchased-courses/:id',getPurchasedCourses)
.get('/transactions/:id',fetchTransactions)
.get('/profile/:id', getUserProfile)
.put('/update/profile/:id',imageUpload.single('profilePicture'), updateUserProfile)

exports.router = router;