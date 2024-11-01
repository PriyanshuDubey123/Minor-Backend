
const LiveCourses = require("../model/LiveCourses");
const { redis } = require("../utils/features");

exports.createCourse = async(req,res)=>{
  try{
    
    const course = new LiveCourses(req.body);
  

        const doc = await course.save();
        res.status(201).json(doc);
    }
     catch(err){
     res.status(400).json(err);
     }
}

exports.fetchAllCourses = async (req, res) => {
    try {
      let condition = {};
  
      if (!req.query.admin) {
        condition.deleted = { $ne: true };
      }
  
      if (req.query.userId) {
        condition.enrolledStudents = { $nin: [req.query.userId] };
      }
  
      if (req.query.category) {
        condition.category = req.query.category;
      }
  
      if (req.query.language) {
        condition.language = req.query.language;
      }
  
      let query = LiveCourses.find(condition).populate('creatorId');
      let totalCoursesQuery = LiveCourses.find(condition).populate('creatorId');
  
      if (req.query._sort && req.query._order) {
        const sort = { [req.query._sort]: req.query._order };
        query = query.sort(sort);
        totalCoursesQuery = totalCoursesQuery.sort(sort);
      }
  
      const totalDocs = await totalCoursesQuery.countDocuments().exec();
      console.log({ totalDocs });
  
      if (req.query._page && req.query._limit) {
        const pageSize = parseInt(req.query._limit);
        const page = parseInt(req.query._page);
  
        query = query.skip(pageSize * (page - 1)).limit(pageSize);
      }
  
      const doc = await query.exec();
      res.set('X-Total-Count', totalDocs);
      res.status(200).json(doc);
    } catch (err) {
      res.status(400).json(err);
    }
  };
  

exports.fetchCourseById = async(req,res)=>{
    const {id} = req.params;

    try{ 
        let course;
        course = await redis.get(`course-${id}`);
        if(course)
          course = JSON.parse(course);
        else{
         course = await LiveCourses.findById(id);
         redis.set(`course-${id}`,JSON.stringify(course));
         redis.expire(`course-${id}`, 30);
        }
        res.status(200).json(course);
    }
     catch(err){
     res.status(400).json(err);
     }
}

exports.updateCourse = async(req,res)=>{
    const {id} = req.params;

    try{    
        const course = await LiveCourses.findByIdAndUpdate(id,req.body,{new:true});
        res.status(200).json(course);
    }
     catch(err){
     res.status(400).json(err);
     }
}