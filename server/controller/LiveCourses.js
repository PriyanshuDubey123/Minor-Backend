const Creator = require('../model/CreatorModal');
const LiveCourses = require('../model/LiveCourses');
const { User } = require('../model/User');
const { Queue } = require('bullmq');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../utils/cloudinary');
const individualCreatorAnalytics = require('../model/IndividualCreatorAnalytics');
const UserTransaction = require('../model/UserTransaction');


const videoQueue = new Queue('video transcoding', {
  connection: {
    host: 'redis',
    port: 6379,
  },
});

const generateOrderId = ()=>{
  return Math.random().toString(16).substring(2, 14);
}

exports.createCourse = async (req, res) => {
  try {

    const { id } = req.params;

    const { _id } = await Creator.findOne({ userId: id });

    const { name, duration, description, priceOption, price, special, category, language } = req.body;

    const finalPrice = priceOption === 'free' ? 0 : price;
    const thumbnailUrl = req.file.path;

    const newCourse = new LiveCourses({
      creatorId: _id,
      userId: id,
      name,
      duration,
      description,
      price: finalPrice,
      special,
      category,
      language,
      thumbnailUrl,
    });

    await newCourse.save();

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCourseByCourseId = async (req, res) => {
  try {
    const course = await LiveCourses.findById(req.params.id).populate('creatorId');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


exports.uploadVideos = async (req, res) => {
  try {

    // const videoUrl = req.file.path; // Get the video URL from Cloudinary response
    const { title } = req.body; // Access the title from the request body
    const publicId = req.file.filename;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const course = await LiveCourses.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }


    await videoQueue.add('transcode', {
      public_id: publicId,
      courseId: course._id,
      title: title,
    });

    // await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });

    return res.status(200).json({ message: 'Video uploaded and queued for transcoding.' });

  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;

    const course = await LiveCourses.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const videoIndex = course.videos.findIndex((video) => video._id.toString() === videoId);

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    course.videos.splice(videoIndex, 1);

    await course.save();

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

exports.Reviews = async (req, res) => {
  try {
    const { id } = req.params;


    await LiveCourses.findByIdAndUpdate(id, { underReview: true }, { upsert: true });


    res.status(200).json({ message: 'This Course is under Review' });
  } catch (error) {
    console.error('Error adding this in review:', error);
    res.status(500).json({ error: 'Failed to add this in review' });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    // Find the course by ID
    const course = await LiveCourses.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is already enrolled in the course
    if (course.enrolledStudents.includes(userId)) {
      return res.status(400).json({ error: 'User already enrolled in this course' });
    }

    // Add user to the course's enrolledStudents array
    course.enrolledStudents.push(userId);

    // Add course to the user's purchasedCourses array
    user.purchasedCourses.push(courseId);

    // Save the updated course and user

    const orderId = generateOrderId();


    const userTransaction = new UserTransaction({
      userId: userId,
      courseId: courseId,
      order_id: orderId,
      amount: 0,
      currency: "NA"
    });



    let creatorAnalytics = await individualCreatorAnalytics.findOne({ creatorId: course.creatorId });
                    
                    const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
                    
                    if (creatorAnalytics) {
                        // Document exists, update it
                        creatorAnalytics.totalSales += 1;
                        creatorAnalytics.totalRevenue += 0;
                    
                        creatorAnalytics.transactions.push({
                            userId: userId,
                            order_id: orderId,
                            amount: 0,
                            currency: "NA"
                        });
                    
                        // Check if there's an entry for the current date in dateWiseAnalytics
                        const dateEntry = creatorAnalytics.dateWiseAnalytics.find(entry => 
                            new Date(entry.date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) === currentDate
                        );
                    
                        if (dateEntry) {
                            // Entry exists, increment totalSales and totalRevenue
                            dateEntry.totalSales += 1;
                            dateEntry.totalRevenue += 0;
                        } else {
                            // Entry does not exist, add a new entry
                            creatorAnalytics.dateWiseAnalytics.push({
                                date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
                                totalSales: 1,
                                totalRevenue: 0
                            });
                        }
                    
                        await creatorAnalytics.save();
                    } else {
                        // Document does not exist, create a new one
                        creatorAnalytics = new individualCreatorAnalytics({
                            creatorId: course.creatorId,
                            totalSales: 1,
                            totalRevenue: 0,
                            transactions: [{
                                userId: userId,
                                order_id: orderId,
                                amount: 0,
                                currency: "NA"
                            }],
                            dateWiseAnalytics: [{
                                date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
                                totalSales: 1,
                                totalRevenue: 0
                            }]
                        });
                    
                        await creatorAnalytics.save();
                    }
                    
    await userTransaction.save();
    await course.save();
    await user.save();

    res.status(200).json({ message: 'Enrollment successful', course, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while enrolling in the course' });
  }
};



exports.modifyCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await LiveCourses.findById(id);

    if (course.modificationCount === 3) {
      await LiveCourses.findByIdAndDelete(id);
    }
    else
      await LiveCourses.findByIdAndUpdate(id, { underReview: false, modification: "Admin Disapproved your course please read the courses policies and retry", $inc: { modificationCount: 1 } });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await LiveCourses.findByIdAndUpdate(id, { underReview: false, isPublished: true, modification: null, modificationCount: 0 })

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course published successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.AddTrancodedVideos = async (req, res) => {
  try {

    const { title, videoUrls, id } = req.body;

    const course = await LiveCourses.findById(id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Add video URLs to the videos array
    course.videos.push({
      title: title,
      videoUrls: [
        { resolution: 'master', url: videoUrls['master'] },
        { resolution: '360p', url: videoUrls['360p'] },
        { resolution: '480p', url: videoUrls['480p'] },
        { resolution: '720p', url: videoUrls['720p'] },
      ],
    });
    await course.save(); // Save the course with new video URLs

    console.log('Video URLs saved to course:', id);

    res.status(200).json({ message: 'Video URLs added successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};