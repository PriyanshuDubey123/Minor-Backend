const express = require('express');
const { createUser, loginUser } = require('../controller/Auth');
const { profileImageUpload } = require('../utils/cloudinary');


const router = express.Router();

router.post('/signup', profileImageUpload.single('profilePicture'), createUser).
post('/login', loginUser)

exports.router = router;