const { hash } = require('bcrypt');
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
password: {type: String ,required:true,select:false},
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


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    this.password = await hash(this.password, 10);
  });
  


exports.User = mongoose.model('User',userSchema);
