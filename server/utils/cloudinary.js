const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Storage configuration for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const imageUpload = multer({ storage: imageStorage });

const profileImageUpload = multer({ storage: profileImageStorage });

// Storage configuration for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'temporary-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'avi', 'mkv'],
  },
});

const videoUpload = multer({ storage: videoStorage });

module.exports = {
  cloudinary,
  imageUpload,
  videoUpload,
  profileImageUpload
};
