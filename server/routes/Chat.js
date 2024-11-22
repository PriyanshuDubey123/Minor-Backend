const express = require('express');
const { getMessagesForChat, getChats, sendMessage, createChat, updateMessageReadStatus, markChatMessagesAsRead } = require('../controller/Chat');

const router = express.Router();

router
  .get('/getmessages/:chatId', getMessagesForChat)
  .get('/getuserchat/:userId', getChats)
  .post('/sendmessage', sendMessage)
  .post('/createchat', createChat)
  .put('/updatemessagereadstatus/:messageId', updateMessageReadStatus)
  .put('/markchatmessagesasread/:chatId/:participantId', markChatMessagesAsRead);

module.exports = router;
