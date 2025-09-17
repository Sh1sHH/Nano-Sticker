import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorMiddleware } from './middleware/errorHandler';
import { 
  requestTrackingMiddleware, 
  performanceMiddleware, 
  rateLimitingMiddleware,
  costTrackingMiddleware,
  userActivityMiddleware 
} from './middleware/monitoring';
import authRoutes from './routes/auth';
import creditRoutes from './routes/credits';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import analyticsRoutes from './routes/analytics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Monitoring middleware
app.use(requestTrackingMiddleware);
app.use(performanceMiddleware);
app.use(costTrackingMiddleware);
app.use(userActivityMiddleware);

// Rate limiting with monitoring
app.use(rateLimitingMiddleware());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      retryable: false
    },
    timestamp: new Date()
  });
});

// Global error handler
app.use(errorMiddleware);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`💳 Credits API: http://localhost:${PORT}/api/credits`);
    console.log(`💰 Payments API: http://localhost:${PORT}/api/payments`);
    console.log(`🔔 Subscriptions API: http://localhost:${PORT}/api/subscriptions`);
  });
}

export default app;