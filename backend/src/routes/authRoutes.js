import express from 'express';
import { register, login, updateBudget } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/budget', protect, updateBudget); // <-- ADD THIS LINE

export default router;