const { Worker } = require('bullmq');
const cloudinary = require('cloudinary').v2;
const transcodeVideo = require('./transcoder/transcode');
const fs = require('fs');
const path = require('path');
const { default: axios } = require('axios');



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Helper function to delete files from Cloudinary
async function deleteCloudinaryFile(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`Deleted file from Cloudinary with ID: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete file with ID ${publicId}:`, error);
  }
}

// Helper function to upload files to Cloudinary
async function uploadFileToCloudinary(filePath, folderPath) {
  try {
    const response = await cloudinary.uploader.upload(filePath, {
      folder: folderPath,
      resource_type: 'raw',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    console.log(`Uploaded file: ${path.basename(filePath)}, URL: ${response.secure_url}`);
    return response.secure_url;
  } catch (error) {
    console.error(`Failed to upload file ${filePath}:`, error);
    throw error;
  }
}

const worker = new Worker('video transcoding', async (job) => {
  const { public_id, courseId, title } = job.data;

  try {
    // Construct the video URL based on the public_id
    const videoUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/video/upload/${public_id}.mp4`;

    // Create a unique output directory for each job to prevent conflicts
    const outputDir = path.join(__dirname, `transcoded-videos/${courseId}_${title}_${job.id}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Transcode video using the provided function
    const m3u8Files = await transcodeVideo(videoUrl, outputDir, "https://res.cloudinary.com/dbk8upshv/raw/upload/v12345/transcoded-videos", courseId, title);

    // Prepare to upload all files in the output directory
    const uploadPromises = [];
    const videoUrls = {};
    const resolutions = ['360p', '480p', '720p'];

    // Upload m3u8 files and associated .ts files for each resolution
    resolutions.forEach((resolution, index) => {
      const m3u8File = m3u8Files[index];
      const resolutionFolder = `transcoded-videos/${courseId}/${title}/${resolution}`;

      uploadPromises.push(
        uploadFileToCloudinary(m3u8File, resolutionFolder).then((url) => {
          videoUrls[resolution] = url;
        })
      );

      const tsFiles = fs.readdirSync(path.dirname(m3u8File))
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(path.dirname(m3u8File), file));

      tsFiles.forEach(tsFile => {
        uploadPromises.push(uploadFileToCloudinary(tsFile, resolutionFolder));
      });
    });

    // Upload master .m3u8 file and .ts files separately
    const masterFolder = `transcoded-videos/${courseId}/${title}/master`;
    uploadPromises.push(uploadFileToCloudinary(m3u8Files[3], masterFolder).then((url) => {
      videoUrls['master'] = url;
    }));

    const masterTsFiles = fs.readdirSync(path.join(outputDir, 'master'))
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(outputDir, 'master', file));

    masterTsFiles.forEach(tsFile => {
      uploadPromises.push(uploadFileToCloudinary(tsFile, masterFolder));
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Save the video URLs to the Course schema
   
    const response = await axios.post("http://nodejs-app:8080/api/courses/add-transcoded-videos", {
      title: title,
      videoUrls: videoUrls,
      id:courseId
    });
    console.log('Video URLs saved successfully:', response.data);

    // Clean up local files after upload
    fs.rmSync(outputDir, { recursive: true, force: true });
    console.log(`Deleted local files and folders for course: ${courseId}`);

    // Clean up the video file from the temporary directory in Cloudinary
    await deleteCloudinaryFile(public_id);

    // Mark job as completed
    await job.moveToCompleted('completed', true);
  } catch (error) {
    console.error('Error in transcoding:', error);
    await job.moveToFailed({ message: error.message });
  }
}, {
  connection: {
    host: 'redis',
    port: 6379,
  },
  lockDuration: 600000, // Set lock duration to 10 minutes or more as needed
  lockRenewTime: 300000, // Renew lock every 5 minutes
  timeout: 1800000, // Set job timeout to 30 minutes or longer
});

module.exports = worker;
