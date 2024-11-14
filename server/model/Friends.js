const mongoose = require('mongoose');

const mutualCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, required: true },
  category: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  special: { type: String, required: true },
}, { _id: false });  

const friendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  username: { type: String, required: true },
  profilePicture: { type: String, default: null },
  email: { type: String, required: true },
  mutualCourses: [mutualCourseSchema],  
}, { _id: false });  

const friendRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  username: { type: String, required: true },
  profilePicture: { type: String, default: null },
  email: { type: String, required: true },
  mutualCourses: [mutualCourseSchema],  
});  


const friendsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  friends: [friendSchema],  
  friendRequests: [friendRequestSchema],
  blockedUsers: [friendRequestSchema],
}, {
  timestamps: true  
});

const Friends = mongoose.model('Friends', friendsSchema);

module.exports = Friends;
