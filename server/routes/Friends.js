const express = require('express');
const { getFriends, findFriends, acceptFriendRequestAndAddFriend, postFriendRequest, getFriendRequestsOfUser, rejectFriendRequestAndBlockFriend, blockFriend, removeFriend } = require('../controller/Friends');

const router = express.Router();

router.get('/get/:userId',getFriends);
router.get('/find/:userId',findFriends);
router.get('/get/friendrequests/:userId',getFriendRequestsOfUser);
router.post('/addfriend',acceptFriendRequestAndAddFriend);
router.post('/rejectfriendrequest',rejectFriendRequestAndBlockFriend);
router.post('/postfriendrequest',postFriendRequest);
router.post('/removefriend',removeFriend);

module.exports = router;
