const { User } = require("../model/User");

exports.fetchUserById = async (req,res)=>{
const {id} = req.params;
    try{
         const user = await User.findById(id);
         
         res.status(200).json({id:user.id,name:'Priyanshu Dubey',email:user.email,role:user.role,imageUrl:'https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png'});
    }
    catch(err){
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