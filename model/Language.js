const mongoose = require('mongoose');

const {Schema} = mongoose;

const languageSchema = new Schema({
label: {type: String ,required:true, unique:true},
value: {type: String ,required:true, unique:true},

})

const virtual = languageSchema.virtual('id');
virtual.get(function(){
    return this._id;
})

languageSchema.set('toJSON',{
    virtuals:true,
    versionKey:false,
    transform: function(doc,ret){delete ret._id}
})


exports.Language = mongoose.model('Language',languageSchema);
