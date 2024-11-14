const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    isRead:{ type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);




const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
