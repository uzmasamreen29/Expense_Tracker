import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';

// @desc    Get all expenses for logged-in user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ user: req.user._id })
      .populate('category', 'name color icon')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this expense');
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spend analytics & category breakdown for the current month
// @route   GET /api/expenses/analytics
// @access  Private
export const getExpenseAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const breakdown = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: '$categoryDetails',
      },
      {
        $project: {
          _id: 1,
          name: '$categoryDetails.name',
          color: '$categoryDetails.color',
          icon: '$categoryDetails.icon',
          totalAmount: 1,
          count: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    const totalSpent = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
      totalSpent,
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get predictive insights & financial forecasting
// @route   GET /api/expenses/forecast
// @access  Private
export const getExpenseForecast = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Current month boundaries
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const totalDaysInMonth = endOfMonth.getDate();
    const dayOfMonth = Math.max(now.getDate(), 1);
    const remainingDays = Math.max(totalDaysInMonth - dayOfMonth, 0);

    // Fetch this month's expenses
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('category', 'name color');

    const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const monthlyBudget = Number(req.user.monthlyBudget) || 30000;

    // Run-rate arithmetic
    const dailyBurnRate = Math.round(totalSpent / dayOfMonth);
    const projectedSpend = Math.round(totalSpent + (dailyBurnRate * remainingDays));
    const projectedDifference = projectedSpend - monthlyBudget;
    const isProjectedOverbudget = projectedDifference > 0;

    // Daily safe limit for remainder of the month to stay on budget
    const safeDailyLimit = remainingDays > 0 
      ? Math.max(Math.round((monthlyBudget - totalSpent) / remainingDays), 0)
      : 0;

    // Category distribution & anomaly detection
    const categoryMap = {};
    expenses.forEach((item) => {
      const catName = item.category?.name || 'Uncategorized';
      categoryMap[catName] = (categoryMap[catName] || 0) + Number(item.amount);
    });

    const anomalies = [];
    Object.keys(categoryMap).forEach((name) => {
      const amount = categoryMap[name];
      const percentageOfTotal = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      
      // Anomaly trigger: Single category eating more than 35% of monthly budget
      if (percentageOfTotal >= 35 && totalSpent > 2000) {
        anomalies.push({
          category: name,
          amount,
          share: Math.round(percentageOfTotal),
          message: `${name} accounts for ${Math.round(percentageOfTotal)}% of your monthly spend. Consider capping discretionary outlays here.`
        });
      }
    });

    // Generate dynamic health status
    let healthStatus = 'STABLE';
    let advisory = 'Your spending pace is currently balanced with the monthly calendar.';

    if (totalSpent > monthlyBudget) {
      healthStatus = 'CRITICAL';
      advisory = `You have already breached your ₹${monthlyBudget.toLocaleString()} allocation. Cut non-essential expenditures immediately.`;
    } else if (isProjectedOverbudget) {
      healthStatus = 'WARNING';
      advisory = `At ₹${dailyBurnRate}/day, you will exceed your budget by ₹${projectedDifference.toLocaleString()} on day ${totalDaysInMonth}. Limit daily spend to ₹${safeDailyLimit}/day to stay safe.`;
    } else if (projectedSpend < monthlyBudget * 0.8) {
      healthStatus = 'EXCELLENT';
      advisory = `Strong financial discipline! You are projected to save ₹${(monthlyBudget - projectedSpend).toLocaleString()} by month-end.`;
    }

    res.json({
      metrics: {
        totalDaysInMonth,
        dayOfMonth,
        remainingDays,
        dailyBurnRate,
        projectedSpend,
        projectedDifference,
        isProjectedOverbudget,
        safeDailyLimit,
        monthlyBudget,
        totalSpent,
      },
      healthStatus,
      advisory,
      anomalies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { title, description, amount, category, paymentMethod, date } = req.body;

    // Ensure we capture either title or description, whichever was sent
    const expenseTitle = String(title ?? description ?? '').trim();
    const numericAmount = Number(amount);

    if (!expenseTitle) {
      return res.status(400).json({ message: 'Please provide an expense title' });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid expense amount' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Please select a valid category' });
    }

    const expense = await Expense.create({
      user: req.user._id,
      category,
      title: expenseTitle,
      description: expenseTitle,
      amount: numericAmount,
      paymentMethod: paymentMethod || 'UPI',
      date: date || new Date(),
    });

    // Populate category so frontend receives the complete object immediately
    await expense.populate('category', 'name color icon');

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const { title, description, amount, category, paymentMethod, date } = req.body;

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    const updatedTitle = String(title ?? description ?? expense.title).trim();

    if (!updatedTitle) {
      return res.status(400).json({ message: 'Please provide an expense title' });
    }

    expense.title = updatedTitle;
    expense.description = updatedTitle;
    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: 'Please provide a valid expense amount' });
      }
      expense.amount = numericAmount;
    }
    if (category) expense.category = category;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (date) expense.date = date;

    await expense.save();
    await expense.populate('category', 'name color icon');

    res.json(expense);
  } catch (error) {
    next(error);
  }
};