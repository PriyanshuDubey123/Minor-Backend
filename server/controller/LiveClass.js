const { LiveClass } = require("../model/LiveClass");


exports.getLiveClasses = async (req, res) => {
    try {
        const liveClasses = await LiveClass.find();

        return res.status(200).json({ liveClasses });
    }
    catch (err) {
        return res.status(400).json(err);
    }
}

exports.shareLiveClassUrl = async (req, res) => {
    try {
        const { liveUrl, title } = req.body;

        // Extract video ID from the URL
        const videoId = extractVideoId(liveUrl);
        if (!videoId) {
            return res.status(400).json({ message: "Invalid YouTube URL." });
        }

        // Fetch the thumbnail URL using the extracted video ID
        const thumbnailUrl = getThumbnailUrl(videoId);

        // Create the live class with the extracted data
        const liveClass = new LiveClass({
            url: videoId,
            title,
            thumbnailUrl,  // Add thumbnail URL to the live class document
        });

        await liveClass.save(); 

        return res.status(200).json({ message: "Live Class URL Shared Successfully", liveClass });
    }
    catch (err) {
        return res.status(400).json(err);
    }
};

// Function to extract video ID from YouTube URL
const extractVideoId = (url) => {
    // Updated regex to match live URLs with the feature query parameter
    const regex = /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Function to get the thumbnail URL from the video ID
const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};


exports.deleteLiveClassUrl = async (req, res) => {
    try {
       
        await LiveClass.deleteMany({});

        return res.status(200).json({message:"Live Class URL Deleted Successfully"});
    }
    catch (err) {
        return res.status(400).json(err);
    }
}
