import express from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  getExpenseAnalytics,
  getExpenseForecast, // <-- Import here
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.get('/analytics', getExpenseAnalytics);
router.get('/forecast', getExpenseForecast); // <-- Add this route

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;