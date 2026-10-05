import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://expense-tracker-omega-beryl-59.vercel.app',
    /\.vercel\.app$/ // Allows preview and production Vercel subdomains
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);

// Error Handling Middlewares (Must be at the very bottom)
app.use(notFound);
app.use(errorHandler);

export default app;