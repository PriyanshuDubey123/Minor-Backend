const Creator = require('../model/CreatorModal');
const LiveCourses  = require ('../model/LiveCourses');
const { User } = require('../model/User');

exports.createCourse = async (req, res) => {
  try {

    const {id} = req.params;

    const {_id} = await Creator.findOne({userId:id});

    const { name, duration, description, priceOption, price, special, category, language } = req.body;

    const finalPrice = priceOption === 'free' ? 0 : price;
    const thumbnailUrl = req.file.path;

    const newCourse = new LiveCourses({
      creatorId:_id,
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

exports.getCourseByCourseId = async(req,res) => {
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
    const videoUrl = req.file.path; // Get the video URL from Cloudinary response
    const { title } = req.body; // Access the title from the request body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const course = await LiveCourses.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.videos.push({ title, videoUrl });

    await course.save();

    res.status(200).json({ message: 'Video uploaded successfully', video: { title, videoUrl } });
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
   

     await LiveCourses.findByIdAndUpdate(id,{underReview:true},{upsert:true});


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
    await course.save();
    await user.save();

    res.status(200).json({ message: 'Enrollment successful', course, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while enrolling in the course' });
  }
};