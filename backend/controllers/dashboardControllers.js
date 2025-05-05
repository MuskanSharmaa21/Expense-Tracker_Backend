const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types} = require("mongoose");

exports.getDashboardData = async(req ,res) =>{
  try{
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    const totalIncome = await Income.aggregate([
      { $match:{userId, userObjectId}},
      { $group : {_id:null , total: {$sum: "$amount"}}}
    ]);
    console.log("totalIncome",{totalIncome, userId: isValidObjectId (userId)});
    const totalExpense = await Expense.aggregate([
      { $match: {userId, userObjectId}},
      { $group : {_id: null, total: { $sum:"$amount"}}}
    ]);

    const last60days = await Income.find ({
      userId,
      date: {$gte : new Date (Date.now() - 60*24*60*60*1000)},
    }).sort ({date :-1});
  
  const incomeLast60days = last60days.reduce(
    (sum,transaction) => sum+transaction.amount,
    0
  );
  const last30daysTransaction = await Income.find({
    userId ,
    date: {$gte : new Date(Date.now() - 30*24*60*60*1000)},
  }).sort ({date :-1});
  const last30daysExpense = last30daysTransaction.reduce(
    (sum,transaction) => sum+transaction.amount,
    0
  );
  const lastTransactions = [
    ...(await Income.find({userId}).sort({date:-1}).limit(5)).map(
      (txn) =>({
        ...txn.toObject(),
        type :"expense",
      })
    ),
  ].sort((a,b) => b.date - a.date)
  res.json({
    totalBalance:
    (totalIncome[0]?.total || 0 ) - (totalExpense[0]?.total ||0),
    totalIncome : totalIncome[0]?.total || 0 ,
    totalExpense : totalExpense[0]?.total ||0,
    last30daysExpense : {
      total : last30daysExpense,
      transactions : last30daysTransaction,
    },
    last60daysExpense : {
      total : last60days,
      transactions : incomeLast60days,
    },
    recentTransactions : lastTransactions,
  });
}
catch (error){
  res.status(500).json({message: `Server Error: ${error.message}`});
}
}