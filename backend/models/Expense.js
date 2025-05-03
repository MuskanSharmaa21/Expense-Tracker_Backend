const mongoose = require("mongoose");
const ExpenseSchema = new mongoose.Schema({
  userId : {type:mongoose.Schema.Types.ObjectId , ref:"User" , required:true},
  icon:{type:String},
  category: { type:String , req:true},
  amount: { type:Number , req:true },
  date: { type:Date , default:Date.now() },
}, {timestamps:true});

module.exports = mongoose.model("Expense", ExpenseSchema);