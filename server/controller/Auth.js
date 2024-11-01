const { compare } = require("bcrypt");
const { User } = require("../model/User");
const { sendToken, cookieOptions } = require("../utils/features");
const { TryCatch } = require("../middlewares/error");
const { ErrorHandler } = require("../utils/utility");
const jwt = require('jsonwebtoken');


exports.createUser = async (req, res) => {

  try{

    const { email, password, username, role  } = req.body;
    const profilePicture = req.file ? req.file.path : null; // Get the profile picture path from multer


    const findUser = await User.findOne({email}); 

    if(findUser){
       return res.status(400).json({message: 'Email already exists'});
    }
  
    const user = new User({
        username,
        profilePicture,
      email,
      password,
      role,
    });
  
      const doc = await user.save();
      
     sendToken(res, user, 201,"User created successfully",{id: user.id, email:user.email, name: user.username });

    } catch (err) {
        console.log(err);
      res.status(400).json(err);
    }
  };

exports.loginUser = TryCatch(async(req,res,next)=>{
    
        const user = await User.findOne({email: req.body.email}).select("+password");
        
        if (!user) return next(new ErrorHandler("User not found", 404));

        const isMatch = await compare(req.body.password,user.password);

        console.log()

          if(isMatch){
            if(user.role === "admin" && req.body.admin){
              sendToken(res, user, 201, `Welcome back, ${user.username}`,{id: user.id, email:user.email, name: user.username,role:"admin" });
            }
            else if(user.role === "admin"){
              return next(new ErrorHandler("Invalid Credentials", 401));
            }
            else
           sendToken(res, user, 201, `Welcome back, ${user.username}`,{id: user.id, email:user.email, name: user.username });
          }
         else{
            return next(new ErrorHandler("Invalid Credentials", 401));
         }
  
})




exports.isAuthenticated = TryCatch((req, res, next) => {
  const token = req.cookies["access-token"];
  const adminToken = req.cookies["admin-access-token"];


  console.log(adminToken)

  if (!token && !adminToken)
    return res.status(401).json({ message: "Please login to access this resource" });

   if(token){
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decodedData._id;
}
 if(adminToken){
  const decodedData = jwt.verify(adminToken, process.env.JWT_SECRET);
  req.admin = decodedData._id;
  }

  next();
});


exports.getMyProfile = TryCatch(async (req, res, next) => {


  if(req.admin && req.user){

  const user = await User.findById(req.user);

  const admin = await User.findById(req.admin);

  if (!user && !admin) return next(new ErrorHandler("User not found", 404));

  console.log(admin);

  res.status(200).json({
    success: true,
    userId: user.id,
    adminId:admin.id,
    userEmail:user.email,
    adminEmail:admin.email,
    username: user.username,
    adminName:admin.username,
    role: user.role
  });
}
else if(req.user){

  const user = await User.findById(req.user);

  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    userId: user.id,
    userEmail:user.email,
    username: user.username,
    role: user.role
  });
}
else{

  const admin = await User.findById(req.admin);

  if (!admin) return next(new ErrorHandler("User not found", 404));

  console.log(admin);

  res.status(200).json({
    success: true,
    adminId:admin.id,
    adminEmail:admin.email,
    adminName:admin.username,
    role: admin.role
  });
}
});


exports.signOut = TryCatch(async(req,res)=>{
  

  if(req.body.role === "admin"){

    return res
    .status(200)
    .cookie("admin-access-token", "", {  maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
  }
  else{

  return res
  .status(200)
  .cookie("access-token", "", {  maxAge: 0 })
  .json({
    success: true,
    message: "Logged out successfully",
  });
}

})