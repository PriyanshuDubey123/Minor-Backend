const mongoose = require("mongoose");

const UserTransactionSchema = new mongoose.Schema(
    {
      userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      courseId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'LiveCourses',
        required: true,
      },
      order_id:{
        type:String
      },
      txnType: {
        type: String,
         default:'Course Payment',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
);
  
const UserTransaction = mongoose.model(
    "UserTransaction",
    UserTransactionSchema
);
  
module.exports = UserTransaction;