import express from 'express';
import { MonitoringService } from '../services/MonitoringService';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationMiddleware } from '../middleware/validation';

const router = express.Router();
const monitoring = MonitoringService.getInstance();

// Get API analytics
router.get('/api', 
  ValidationMiddleware.validate([
    { field: 'startDate', required: false, type: 'string' },
    { field: 'endDate', required: false, type: 'string' },
  ]),
  asyncHandler(async (req, res) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    const analytics = monitoring.getAPIAnalytics({ start: startDate, end: endDate });

    res.json({
      success: true,
      data: {
        timeRange: { start: startDate, end: endDate },
        ...analytics,
      },
    });
  })
);

// Get AI usage analytics
router.get('/ai', 
  ValidationMiddleware.validate([
    { field: 'startDate', required: false, type: 'string' },
    { field: 'endDate', required: false, type: 'string' },
  ]),
  asyncHandler(async (req, res) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    const analytics = monitoring.getAIAnalytics({ start: startDate, end: endDate });

    res.json({
      success: true,
      data: {
        timeRange: { start: startDate, end: endDate },
        ...analytics,
      },
    });
  })
);

// Get user analytics
router.get('/users/:userId', 
  ValidationMiddleware.validate([
    { field: 'userId', required: true, type: 'string' },
    { field: 'startDate', required: false, type: 'string' },
    { field: 'endDate', required: false, type: 'string' },
  ]),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    const analytics = monitoring.getUserAnalytics(userId, { start: startDate, end: endDate });

    res.json({
      success: true,
      data: {
        userId,
        timeRange: { start: startDate, end: endDate },
        ...analytics,
      },
    });
  })
);

// Get cost analytics
router.get('/costs', 
  ValidationMiddleware.validate([
    { field: 'period', required: false, type: 'string' },
    { field: 'year', required: false, type: 'number' },
    { field: 'month', required: false, type: 'number' },
  ]),
  asyncHandler(async (req, res) => {
    const period = req.query.period as string || 'daily';
    const now = new Date();
    
    let costData;
    
    switch (period) {
      case 'daily':
        costData = {
          period: 'daily',
          date: now.toISOString().split('T')[0],
          cost: monitoring.getDailyCost(now),
        };
        break;
        
      case 'monthly':
        const year = req.query.year ? Number(req.query.year) : now.getFullYear();
        const month = req.query.month ? Number(req.query.month) : now.getMonth();
        costData = {
          period: 'monthly',
          year,
          month: month + 1, // Convert to 1-based month
          cost: monitoring.getMonthlyCost(year, month),
        };
        break;
        
      default:
        throw new Error('Invalid period. Use "daily" or "monthly"');
    }

    res.json({
      success: true,
      data: costData,
    });
  })
);

// Get user cost analytics
router.get('/costs/users/:userId', 
  ValidationMiddleware.validate([
    { field: 'userId', required: true, type: 'string' },
    { field: 'year', required: false, type: 'number' },
    { field: 'month', required: false, type: 'number' },
  ]),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth();
    
    const cost = monitoring.getUserMonthlyCost(userId, year, month);

    res.json({
      success: true,
      data: {
        userId,
        year,
        month: month + 1,
        cost,
      },
    });
  })
);

// Get system health metrics
router.get('/health', 
  asyncHandler(async (req, res) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const apiAnalytics = monitoring.getAPIAnalytics({ start: oneHourAgo, end: now });
    const aiAnalytics = monitoring.getAIAnalytics({ start: oneHourAgo, end: now });
    
    const health = {
      status: 'healthy',
      timestamp: now,
      metrics: {
        api: {
          requestsPerHour: apiAnalytics.totalRequests,
          successRate: apiAnalytics.successRate,
          averageResponseTime: apiAnalytics.averageResponseTime,
          errorRate: apiAnalytics.errorRate,
        },
        ai: {
          operationsPerHour: aiAnalytics.totalOperations,
          successRate: aiAnalytics.successRate,
          averageProcessingTime: aiAnalytics.averageProcessingTime,
          costPerHour: aiAnalytics.totalCost,
        },
        system: {
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        },
      },
    };

    // Determine overall health status
    if (apiAnalytics.errorRate > 0.1 || apiAnalytics.averageResponseTime > 5000) {
      health.status = 'degraded';
    }
    
    if (apiAnalytics.errorRate > 0.25 || apiAnalytics.averageResponseTime > 10000) {
      health.status = 'unhealthy';
    }

    res.json({
      success: true,
      data: health,
    });
  })
);

// Track user activity (for frontend to call)
router.post('/activity', 
  ValidationMiddleware.validate([
    { field: 'action', required: true, type: 'string' },
    { field: 'screen', required: true, type: 'string' },
    { field: 'sessionId', required: true, type: 'string' },
    { field: 'metadata', required: false },
  ]),
  asyncHandler(async (req, res) => {
    const { action, screen, sessionId, metadata } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          retryable: false,
        },
      });
    }

    monitoring.trackUserActivity(userId, action, screen, sessionId, metadata);

    res.json({
      success: true,
      data: {
        message: 'Activity tracked successfully',
      },
    });
  })
);

// Get dashboard data (combined analytics)
router.get('/dashboard', 
  asyncHandler(async (req, res) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      apiAnalytics24h,
      aiAnalytics24h,
      apiAnalytics7d,
      aiAnalytics7d,
    ] = await Promise.all([
      monitoring.getAPIAnalytics({ start: last24Hours, end: now }),
      monitoring.getAIAnalytics({ start: last24Hours, end: now }),
      monitoring.getAPIAnalytics({ start: last7Days, end: now }),
      monitoring.getAIAnalytics({ start: last7Days, end: now }),
    ]);

    const dashboard = {
      overview: {
        last24Hours: {
          apiRequests: apiAnalytics24h.totalRequests,
          aiOperations: aiAnalytics24h.totalOperations,
          totalCost: aiAnalytics24h.totalCost,
          successRate: (apiAnalytics24h.successRate + aiAnalytics24h.successRate) / 2,
        },
        last7Days: {
          apiRequests: apiAnalytics7d.totalRequests,
          aiOperations: aiAnalytics7d.totalOperations,
          totalCost: aiAnalytics7d.totalCost,
          successRate: (apiAnalytics7d.successRate + aiAnalytics7d.successRate) / 2,
        },
      },
      costs: {
        daily: monitoring.getDailyCost(now),
        monthly: monitoring.getMonthlyCost(now.getFullYear(), now.getMonth()),
      },
      performance: {
        averageResponseTime: apiAnalytics24h.averageResponseTime,
        averageProcessingTime: aiAnalytics24h.averageProcessingTime,
        errorRate: apiAnalytics24h.errorRate,
      },
      usage: {
        topEndpoints: apiAnalytics24h.topEndpoints,
        modelUsage: aiAnalytics24h.modelUsage,
        operationDistribution: aiAnalytics24h.operationDistribution,
      },
    };

    res.json({
      success: true,
      data: dashboard,
    });
  })
);

export default router;