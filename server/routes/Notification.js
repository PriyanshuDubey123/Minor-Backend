const express = require("express");
const { getAllNotificationsByUserId, postNotification, DeleteAllNotifications, updateNotification, DeleteNotificationById } = require("../controller/Notifications");
const router = express.Router();

router.get("/:id",getAllNotificationsByUserId);

router.post('/post',postNotification);

router.delete("/deleteAll/:userId",DeleteAllNotifications);

router.delete("/:id",DeleteNotificationById);

router.put('/markAllAsSeen/:id',updateNotification);

module.exports = router;