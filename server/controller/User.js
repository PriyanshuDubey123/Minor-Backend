const Creator = require("../model/CreatorModal");
const LiveCourses = require("../model/LiveCourses");
const { User } = require("../model/User");
const UserTransaction = require("../model/UserTransaction");
const { redis } = require("../utils/features");

exports.fetchUserById = async (req,res)=>{
const {id} = req.params;
    try{
         const user = await User.findById(id);
         
         res.status(200).json({id:user.id,name:user.username||'User',email:user.email,role:user.role,imageUrl:user.profilePicture||'https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png',creator:user.isCreator});
    }
    catch(err){
      console.log(err)
        res.status(400).json(err);
    }
}          


exports.updateUser = async(req,res)=>{
    const {id} = req.params;

    try{    
        const user = await User.findByIdAndUpdate(id,req.body,{new:true});
        res.status(200).json(user);
    }
     catch(err){
     res.status(400).json(err);
     }
}

exports.getPurchasedCourses = async(req,res) =>{
  try {


let user;

  user = await redis.get("UserPurchasedCourses "+req.params.id);
  if(user){
    user = JSON.parse(user);
  }
    else{
     user = await User.findById(req.params.id)
      .populate({
        path: 'purchasedCourses',
        populate: {
          path: 'creatorId',
          model: 'Creator'
        }
      });
      redis.set("UserPurchasedCourses "+req.params.id, JSON.stringify(user));
      redis.expire("UserPurchasedCourses "+req.params.id, 30);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(user);
    res.json(user.purchasedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


exports.fetchTransactions = async (req, res) => {
  try {
    let transactions;

    transactions = await redis.get("Transactions "+req.params.id);

    if(transactions){
      transactions = JSON.parse(transactions);
    }
     else{
       transactions = await UserTransaction.find({ userId: req.params.id }).populate('courseId');
       redis.set("Transactions "+req.params.id, JSON.stringify(transactions));
       redis.expire("Transactions "+req.params.id, 30);
     }
      res.json(transactions);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
  
    let data = {name:user.username,email:user.email,profilePicture:user.profilePicture,purchasedCourses:[]};

    for(const course of user.purchasedCourses){
      const courseData = await LiveCourses.findById(course);
      data.purchasedCourses.push({name:courseData.name,description:courseData.description,thumbnailUrl:courseData.thumbnailUrl});
    }

    if(user?.isCreator){
      const creator = await Creator.findOne({userId:req.params.id});

      data.isCreator = true;
      data.bio = creator.bio;
      data.instagram = creator.instagram;
      data.youtube = creator.youtube; 
      data.linkedin = creator.linkedin;
      data.twitter = creator.twitter; 
      
    }
    

    if (!user) {
      return res.status(404).json(data);
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserProfile = async(req,res)=>{
  const userId = req.params.id;
  const { name, email } = req.body;

  try {
    const updateData = {
      name,
      email,
    };

    // If there's a new profile picture, add it to the updateData
    if (req.file) {
      updateData.profilePicture = req.file.path; // Save the path to the uploaded file
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).send('Internal Server Error');
  }
}