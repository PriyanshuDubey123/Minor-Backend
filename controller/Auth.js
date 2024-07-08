const { User } = require("../model/User");

exports.createUser = async (req, res) => {
    const { email, password, username, role  } = req.body;
    const profilePicture = req.file ? req.file.path : null; // Get the profile picture path from multer
  
    const user = new User({
        username,
        profilePicture,
      email,
      password,
      role,
    });
  
    try {
      const doc = await user.save();
      res.status(201).json(doc);
    } catch (err) {
        console.log(err);
      res.status(400).json(err);
    }
  };

exports.loginUser = async(req,res)=>{
    
    try{
        const user = await User.findOne({email: req.body.email}).exec();
        
        if(!user){
            res.status(401).json({message: 'no such user email'});
        }
         else if(user.password === req.body.password)
        res.status(201).json({id: user.id, email:user.email, name: user.name });
         else
         res.status(401).json({message:'Invalid Credentials'});
    }
     catch(err){
     res.status(400).json(err);
     }
}
