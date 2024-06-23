const { Course } = require("../model/Course")

exports.createCourse = async(req,res)=>{
    const course = new Course(req.body);
    try{
        const doc = await course.save();
        res.status(201).json(doc);
    }
     catch(err){
     res.status(400).json(err);
     }
}

exports.fetchAllCourses = async(req,res)=>{

    let condition = {};

    if(!req.query.admin){
   condition.deleted = {$ne:true};
    }

    let query = Course.find(condition);

    let totalCoursesQuery = Course.find(condition);

    if(req.query.category){
    query = query.find({category:req.query.category})
    totalCoursesQuery = totalCoursesQuery.find({category:req.query.category})
    }

    if(req.query.language){
    query = query.find({language:req.query.language})
    totalCoursesQuery = totalCoursesQuery.find({language:req.query.language})
    } 

    if(req.query._sort && req.query._order){
    query = query.sort({[req.query._sort]: req.query._order})
    totalCoursesQuery = totalCoursesQuery.sort({[req.query._sort]: req.query._order})
    }

    const totalDocs = await totalCoursesQuery.count().exec();
    console.log({totalDocs});

    if(req.query._page && req.query._limit){
      const pageSize = req.query._limit;
      const page = req.query._page;
     
      query = query.skip(pageSize*(page-1)).limit(pageSize);
    }

    try{
        const doc = await query.exec();
        res.set('X-Total-Count',totalDocs);
        res.status(200).json(doc);
    }
     catch(err){
     res.status(400).json(err);
     }

}

exports.fetchCourseById = async(req,res)=>{
    const {id} = req.params;

    try{    
        const course = await Course.findById(id);
        res.status(200).json(course);
    }
     catch(err){
     res.status(400).json(err);
     }
}

exports.updateCourse = async(req,res)=>{
    const {id} = req.params;

    try{    
        const course = await Course.findByIdAndUpdate(id,req.body,{new:true});
        res.status(200).json(course);
    }
     catch(err){
     res.status(400).json(err);
     }
}