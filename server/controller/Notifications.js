const { Notification } = require("../model/Notification");

exports.postNotification = async (req, res) => {

  
    try {
      const { userSocketMap } = req;
      const {io} = req;
      console.log(userSocketMap);
      const {userID,data} = req.body;
      const socketId = userSocketMap[userID];
      
       console.log(data);
      
      const response = await Notification.updateOne({ userId: userID }, { $push: { notifications: data } }, { upsert: true })

      const notification = await Notification.findOne({ userId: userID });
  
      if (socketId && notification && notification?.notifications.length > 0) {
        io.to(socketId).emit('notification', notification.notifications[notification.notifications.length-1]);
      }
  
      return res.status(200).send(response);
  
    }
    catch (error) {
      console.log(error)
      return res.status(500).json({ message: "No Notifications can be posted"});
    }
  }
  
  exports.getAllNotificationsByUserId = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
  
      const response = await Notification.find({ userId: id });
      console.log(response);  
      return res.status(200).send(response[0]?.notifications);
    }
    catch (error) {
      return res.status(500).json({ message: "Unable to fetch notification." });
    }
  
  }
  
  
  exports.DeleteAllNotifications = async (req, res) => {
    try {
       
     const {userId} = req.params;
  
       await Notification.deleteOne({userId});
      return res.status(200).json({ message: "All notifications deleted" });
    }
    catch (error) {
      return res.status(500).json({ message: "Unable to delete notification." });
    }
  
  }
  exports.DeleteNotificationById = async (req, res) => {
    try {
      const { id } = req.params; // This is the notification _id
  
      // Find the document and pull the notification by its _id
      await Notification.updateOne(
        { "notifications._id": id }, // Find the document containing the notification
        { $pull: { notifications: { _id: id } } } // Remove the notification with the matching _id
      );
  
      return res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ message: "Unable to delete notification." });
    }
  };
  
  exports.updateNotification = async (req, res) => {
    const { id } = req.params;
    try {
      // Update all notifications' 'status' field to 'seen' for the specified userId
      await Notification.updateOne(
        { userId: id },
        { $set: { "notifications.$[].status": "seen" } } // The $[] operator updates all array elements
      );
  
      return res.status(200).json({ message: "All notifications updated" });
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  