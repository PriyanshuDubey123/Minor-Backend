const Chat = require("../model/Chat");
const Message = require("../model/Message");

const getMessagesForChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username email profilePicture")
      .sort({ createdAt: 1 })

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages for chat:", error);
    return res.status(500).json({ error: "Failed to get messages for chat" });
  }
}

const getChats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch chats where the user is a participant
    const chats = await Chat.find({
      "participants.id": userId, // Match against the id field inside participants array
    })
      .populate("participants.id", "username email profilePicture _id") // Populate the id field within participants
      .populate("lastMessage");

    // Filter participants to exclude the current user and structure response properly
    const filteredChats = chats.map(chat => {
      const participants = chat.participants
        .filter(participant => participant.id._id.toString() !== userId.toString()) // Exclude current user
        .map(({ id, unreadMessagesCount, onlineStatus }) => ({
          _id: id._id,
          username: id.username,
          email: id.email,
          profilePicture: id.profilePicture,
          unreadMessagesCount,
          onlineStatus,
        }));

      return {
        _id: chat._id,
        chatName: chat.chatName || participants.map(p => p.username).join(", "),
        lastMessage: chat.lastMessage,
        participants,
        isBlocked: chat.isBlocked,  
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt,
      };
    });

    return res.status(200).json(filteredChats);
  } catch (error) {
    console.error("Error getting chats:", error);
    return res.status(500).json({ error: "Failed to get chats" });
  }
};



const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, messageContent } = req.body;

    // Ensure senderId and receiverId are provided
    if (!senderId || !receiverId || !messageContent) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    console.log(req.body);

    // Find or create chat
    let chat = await Chat.findOne({
      "participants.id": { $all: [senderId, receiverId] },
    });
    if (!chat) {
      // If the chat does not exist, create a new one
      chat = new Chat({
        participants: [
          { id: senderId, unreadMessagesCount: 1, onlineStatus: false },
          { id: receiverId, unreadMessagesCount: 0, onlineStatus: false }, // Increment unread for receiver
        ],
      });
      await chat.save();
    } else {
      // Increment unread message count for the receiver
      const sender = chat.participants.find((p) => p.id.toString() === senderId.toString());
      if (sender) {
        sender.unreadMessagesCount += 1;
      }
      await chat.save();
    }

    // Create the new message
    const message = new Message({
      sender: senderId,
      chat: chat._id,
      message: messageContent,
    });

    // Save the message
    await message.save();

    // Update the lastMessage reference in the chat
    chat.lastMessage = message._id;
    await chat.save();

    // Retrieve socket map and socket.io instance from req
    const { userSocketMap, io } = req;

    if (!userSocketMap || !io) {
      console.warn("userSocketMap or io is not defined in the request object");
    } else {
      const socketId = userSocketMap[receiverId.toString()];
      if (socketId) {
        console.log("Sending message to socket:", socketId);
        io.to(socketId).emit('messages', message);
      }
      else{
        console.log("Socket ID not found for receiver");
      
      }
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};



const createChat = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

        if(senderId.toString() === receiverId.toString()){
            return res.status(400).json({ error: "Sender and receiver cannot be the same" });
        }

        const findExistingChat = await Chat.findOne({
          "participants.id": { $all: [senderId, receiverId] },
        });

        if(findExistingChat){
            return res.status(200).json({ error: "Chat already exists" });
        }

        const chat = new Chat({
          participants: [
            { id: senderId, unreadMessagesCount: 0, onlineStatus: true },
            { id: receiverId, unreadMessagesCount: 0, onlineStatus: false }
          ],
        });
    await chat.save();
    return res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({ error: "Failed to create chat" });
  }
}



const updateMessageReadStatus = async (req, res) => {
  try {
    const { messageId } = req.params;

    const {receiverId} = req.body;

    const message = await Message.findByIdAndUpdate(messageId, { isRead: true },{new:true});

    console.log(receiverId,message.sender)
    const chat = await Chat.findOne({
      "participants.id": { $all: [message.sender, receiverId] },
    });
   console.log(chat)
    if(chat){
      const sender = chat.participants.find((p) => p.id.toString() === message.sender.toString());
      if (sender) {
        if(sender.unreadMessagesCount > 0)
        sender.unreadMessagesCount -= 1;
      }
      await chat.save();
    }

    const { userSocketMap } = req;
    const { io } = req;
    const socketId = userSocketMap[message.sender.toString()];

    console.log(userSocketMap)

    if (socketId) {
      console.log("Updating message to socket:", socketId);
      io.to(socketId).emit('updateMessages',message);
    }

    return res.status(200).json({ message: "Message read status updated successfully" });
  } catch (err) {
    console.error("Error updating message read status:", err);
    return res.status(500).json({ error: "Failed to update message read status" });
  }
}


const markChatMessagesAsRead = async(req,res) => {
  try{

  const {chatId,participantId} = req.params;
  const {userId,unreadMessagesCount} = req.body;

  await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );

  await Chat.updateOne(
    { _id: chatId, "participants.id": participantId },
    { $set: { "participants.$.unreadMessagesCount": 0 } }
  );


  const { userSocketMap } = req;
  const { io } = req;
  const socketId = userSocketMap[participantId.toString()];


  if (socketId) {
    console.log("Updating message to socket:", socketId);
    io.to(socketId).emit('updateMessages',{unreadMessagesCount,chat:chatId});
  }

  return res.status(200).json({ message: "Messages marked as read successfully" });

  }catch(err){
     return res.status(500).json({ error: "Failed to mark messages as read" });
  }
}

module.exports = { getMessagesForChat, getChats, sendMessage, createChat, updateMessageReadStatus, markChatMessagesAsRead };

