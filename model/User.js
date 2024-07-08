const mongoose = require('mongoose');

const {Schema} = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
    },
    profilePicture: {
        type: String,
    },
email: {type: String ,required:true, unique:true},
password: {type: String ,required:true},
role: {type: String ,required:true,default:'user'},
name: {type: String},
purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LiveCourses' }],
isCreator:{
    type:Boolean,
    default:false
},
})

const virtual = userSchema.virtual('id');
virtual.get(function(){
    return this._id;
})

userSchema.set('toJSON',{
    virtuals:true,
    versionKey:false,
    transform: function(doc,ret){delete ret._id}
})


exports.User = mongoose.model('User',userSchema);
