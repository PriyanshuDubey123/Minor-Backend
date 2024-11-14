const Friends = require("../model/Friends");
const LiveCourses = require("../model/LiveCourses");
const { User } = require("../model/User");

exports.findFriends = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user based on the userId and get their purchased courses
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the list of course IDs the user has purchased
        const purchasedCourseIds = user.purchasedCourses.map(course => course._id.toString());

        // Use a Map to ensure unique users and allow easy updates
        let friendsMap = new Map();

        // Loop through each purchased course to find enrolled users
        for (const courseId of purchasedCourseIds) {
            const courseData = await LiveCourses.findById(courseId)
                .populate({
                    path: 'enrolledStudents',
                    select: '_id username profilePicture email',
                });

            if (!courseData) continue; // Skip if course data is not found

            const enrolledUsers = courseData.enrolledStudents;

            // Process each enrolled student
            for (const student of enrolledUsers) {

                const friendsOfStudent = await Friends.findOne({ userId: student._id });

                const friendsOfUser = await Friends.findOne({ userId: userId });

                if (student._id.toString() === userId.toString()) continue;

                if (friendsMap.has(student._id.toString())) {
                    // Add the current course to the mutualCourses if not already added
                    const existingFriend = friendsMap.get(student._id.toString());
                    existingFriend.mutualCourses.push({
                        name: courseData.name,
                        description: courseData.description,
                        language: courseData.language,
                        category: courseData.category,
                        thumbnailUrl: courseData.thumbnailUrl,
                        special: courseData.special
                    });
                } else {
                    // Add a new entry to the map for this student
                    const friendStatus = friendsOfStudent?.friends.findIndex((f) => f.email === user.email);
                    const friendRequestStatus = friendsOfStudent?.friendRequests.findIndex((f) => f.email === user.email);
                    const blockRequestStatus = friendsOfStudent?.blockedUsers.findIndex((f) => f.email === user.email)
                    const userFriendRequestStatus = friendsOfUser?.friendRequests.findIndex((f) => f.email === student.email)
                    // Skip if already a friend
                    if (friendsOfStudent && (friendStatus !== -1 || blockRequestStatus !== -1)) continue;
                    else if (friendsOfUser && userFriendRequestStatus !== -1) continue;

                    friendsMap.set(student._id.toString(), {
                        userId: student._id,
                        username: student.username,
                        profilePicture: student.profilePicture,
                        email: student.email,
                        status: (friendsOfStudent && friendRequestStatus !== -1) ? "Request Sent" : "Add Friend",
                        mutualCourses: [{
                            name: courseData.name,
                            description: courseData.description,
                            language: courseData.language,
                            category: courseData.category,
                            thumbnailUrl: courseData.thumbnailUrl,
                            special: courseData.special
                        }]
                    });
                }

            }
        }

        // Convert the map to an array
        const friends = Array.from(friendsMap.values());

        return res.status(200).json(friends);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getFriends = async (req, res) => {
    try {

        const userId = req.params.userId;

        const data = await Friends.findOne({ userId: userId });

        if (!data) {
            return res.status(200).json({ friends: [] })
        }


        const friends = data.friends;

        return res.status(200).json(friends);

    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

exports.acceptFriendRequestAndAddFriend = async (req, res) => {
    try {
        const { user, friend } = req.body;

        // Find the Friends document for the user
        const userFriends = await Friends.findOne({ userId: user.id });

        const friendFriends = await Friends.findOne({ userId: friend.userId });

        if (!userFriends) {
            return res.status(404).json({ message: "Friends data not found for the user" });
        }

        // Check if the friend request exists
        const friendRequestIndex = userFriends.friendRequests.findIndex(
            (req) => req._id.toString() === friend._id.toString()
        );
        console.log(friend)
        if (friendRequestIndex === -1) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Add to friends array and remove from friendRequests
        const isAlreadyFriend = userFriends.friends.some((f) => f.email === friend.email);
        if (isAlreadyFriend) {
            userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request
            return res.status(400).json({ message: "This friend is already in your list." });
        }
        const isAlreadyBlocked = userFriends.blockedUsers.some((f) => f.email === friend.email);
        if (isAlreadyBlocked) {
            userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request
            return res.status(400).json({ message: "This friend is already blocked" });
        }

        userFriends.friends.push(friend); // Add friend to the friends list
        userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request

        if (friendFriends) {
            friendFriends.friends.push({
                userId: user.id, username: user.name, profilePicture: user.imageUrl, email: user.email, mutualCourses: friend.mutualCourses
            })
            await friendFriends.save();
        }
        else{
            const newFriend = new Friends({
                userId: friend.userId,
                friends: [{
                    userId: user.id, username: user.name, profilePicture: user.imageUrl, email: user.email, mutualCourses: friend.mutualCourses
                }]
            });
            await newFriend.save();
        }

        await userFriends.save();
        return res.status(200).json({ message: "Friend request accepted and friend added successfully" });
    } catch (err) {
        console.error("Error accepting friend request:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
};

exports.postFriendRequest = async (req, res) => {
    try {
        const { userId, friend } = req.body;

        // Find the friend's data for the user
        const existingFriendList = await Friends.findOne({ userId: userId });

        // If no friend list exists for this user, create one
        if (!existingFriendList) {
            const newFriend = new Friends({
                userId: userId,
                friendRequests: [friend], // Add the new friend to the list
            });

            await newFriend.save();
            return res.status(200).json({ message: "Friend request sent successfully" });
        }

        // Check if the friend already exists in the list
        const isFriendAlready = existingFriendList.friends.some(f => f.email === friend.email);
        const isFriendRequestAlreadySent = existingFriendList.friendRequests.some(f => f.email === friend.email);
        if (isFriendAlready || isFriendRequestAlreadySent) {
            return res.status(400).json({ message: "This friend request is already in your list." });
        }

        // Add the new friend to the existing friend's array
        existingFriendList.friendRequests.push(friend);
        await existingFriendList.save();
        return res.status(200).json({ message: "Friend request sent successfully" });

    } catch (err) {
        console.error("Error sending friend request:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
};

exports.getFriendRequestsOfUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const data = await Friends.findOne({ userId: userId });

        if (!data) {
            return res.status(200).json({ friendRequests: [] })
        }


        const friendRequests = data.friendRequests;

        return res.status(200).json(friendRequests);

    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
}



exports.rejectFriendRequestAndBlockFriend = async (req, res) => {
    try {
        const { user, friend } = req.body;

        // Find the Friends document for the user
        const userFriends = await Friends.findOne({ userId: user.id });

        const friendFriends = await Friends.findOne({ userId: friend.userId });

        if (!userFriends) {
            return res.status(404).json({ message: "Friends data not found for the user" });
        }

        // Check if the friend request exists
        const friendRequestIndex = userFriends.friendRequests.findIndex(
            (req) => req._id.toString() === friend._id.toString()
        );
        console.log(friend)
        if (friendRequestIndex === -1) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Add to blockedUsers array and remove from friendRequests
        const isAlreadyFriend = userFriends.friends.some((f) => f.email === friend.email);
        if (isAlreadyFriend) {
            userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request
            return res.status(400).json({ message: "This friend is already in your list." });
        }
        const isAlreadyBlocked = userFriends.blockedUsers.some((f) => f.email === friend.email);
        if (isAlreadyBlocked) {
            userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request
            return res.status(400).json({ message: "This friend is already blocked" });
        }

        userFriends.blockedUsers.push(friend); // Add friend to the friends list
        userFriends.friendRequests.splice(friendRequestIndex, 1); // Remove the friend request

        if (friendFriends) {
            friendFriends.blockedUsers.push({
                userId: user.id, username: user.name, profilePicture: user.imageUrl, email: user.email, mutualCourses: friend.mutualCourses
            })
            await friendFriends.save();
        }
        else{
            const newBlockedFriend = new Friends({
                userId: friend.userId,
                blockedUsers: [{
                    userId: user.id, username: user.name, profilePicture: user.imageUrl, email: user.email, mutualCourses: friend.mutualCourses
                }]
            });
            await newBlockedFriend.save();
        }

        await userFriends.save();
        return res.status(200).json({ message: "Friend request accepted and friend added successfully" });
    } catch (err) {
        console.error("Error accepting friend request:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
};