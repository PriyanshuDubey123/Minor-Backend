

const jwt = require('jsonwebtoken');
const {Redis} = require('ioredis');


const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
 
  };


const sendToken = (res, user, code, message,loginObject) => {

   

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
console.log(token);

    if(loginObject){

      const role = loginObject.role;

      let cookieName = "access-token";

      if(role === "admin") cookieName = "admin-access-token"

        return res.status(code).cookie(cookieName, token, cookieOptions).json({
            success: true,
            user,
            message,
            ...loginObject
        });
    }
  
    return res.status(code).cookie("access-token", token, cookieOptions).json({
      success: true,
      user,
      message,
    });
  };

  const redis = new Redis(process.env.REDIS_URL);

module.exports = {
    sendToken,
    cookieOptions,
    redis
}