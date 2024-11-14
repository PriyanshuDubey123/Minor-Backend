const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [{ _id: false, id: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  unreadMessagesCount:{ type: Number, default: 0 }, onlineStatus:{ type: Boolean}}],
  chatName:{type:String},
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
},{ timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
