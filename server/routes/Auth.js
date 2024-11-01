const express = require('express');
const { createUser, loginUser, isAuthenticated, getMyProfile, signOut } = require('../controller/Auth');
const { profileImageUpload } = require('../utils/cloudinary');


const router = express.Router();



router.post('/signup', profileImageUpload.single('profilePicture'), createUser).
post('/login', loginUser).post('/signout',signOut)

router.use(isAuthenticated);


router.get('/profile', getMyProfile);

exports.router = router;