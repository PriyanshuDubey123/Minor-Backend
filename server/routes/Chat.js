const express = require('express');
const { getMessagesForChat, getChats, sendMessage, createChat, updateMessageReadStatus } = require('../controller/Chat');

const router = express.Router();

router
  .get('/getmessages/:chatId', getMessagesForChat)
  .get('/getuserchat/:userId', getChats)
  .post('/sendmessage', sendMessage)
  .post('/createchat', createChat)
  .put('/updatemessagereadststus/:messageId', updateMessageReadStatus);

module.exports = router;
