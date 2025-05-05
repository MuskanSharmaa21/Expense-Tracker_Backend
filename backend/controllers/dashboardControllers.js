const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types} = require("mongoose");

exports.getDashboardData = async(req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    // Fixed the matching to use userObjectId consistently
    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId }},
      { $group: { _id: null, total: { $sum: "$amount" }}}
    ]);
    console.log("totalIncome", totalIncome);
    
    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId }},
      { $group: { _id: null, total: { $sum: "$amount" }}}
    ]);
    console.log("totalExpense", totalExpense);
    
    // Income for the last 60 days
    const last60daysIncomes = await Income.find({
      userId: userObjectId,
      date: { $gte: new Date(Date.now() - 60*24*60*60*1000) },
    }).sort({ date: -1 });
    
    // Calculate the sum correctly
    const incomeLast60days = last60daysIncomes.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    
    // Get last 30 days EXPENSE transactions (fixed this)
    const last30daysTransactions = await Expense.find({  // Changed from Income to Expense
      userId: userObjectId,
      date: { $gte: new Date(Date.now() - 30*24*60*60*1000) },
    }).sort({ date: -1 });
    
    // Calculate sum of last 30 days expense
    const last30daysExpense = last30daysTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    
    // Get recent transactions (this looks like it should include both income and expense)
    const lastIncomeTransactions = await Income.find({ userId: userObjectId })
      .sort({ date: -1 })
      .limit(5);
      
    const lastExpenseTransactions = await Expense.find({ userId: userObjectId })
      .sort({ date: -1 })
      .limit(5);
    
    // Combine and sort them, properly labeling each type
    const lastTransactions = [
      ...lastIncomeTransactions.map(txn => ({
        ...txn.toObject(),
        type: "income"
      })),
      ...lastExpenseTransactions.map(txn => ({
        ...txn.toObject(),
        type: "expense"
      }))
    ].sort((a, b) => b.date - a.date).slice(0, 5); // Get only the 5 most recent
    
    // Keep the response structure the same as requested
    res.json({
      totalBalance:
        (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total || 0,
      last30daysExpense: {
        total: last30daysExpense,
        transactions: last30daysTransactions,  // Fixed variable name
      },
      last60daysIncome: {
        total: incomeLast60days,
        transactions: last60daysIncomes,
      },
      recentTransactions: lastTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
}