const mongoose = require('mongoose');

const {Schema} = mongoose;

const LiveClassSchema = new Schema({
url: {type: String ,required:true, unique:true},
title: {type: String},
thumbnailUrl: {type: String},
})


exports.LiveClass = mongoose.model('LiveClass',LiveClassSchema);