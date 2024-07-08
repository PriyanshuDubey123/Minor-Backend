const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    email: String,
    bio: String,
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
}, {
    timestamps: true
});

const Creator = mongoose.model('Creator', creatorSchema);

module.exports = Creator;
