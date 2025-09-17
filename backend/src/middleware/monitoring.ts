import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/MonitoringService';

export interface MonitoringRequest extends Request {
  startTime?: number;
  requestId?: string;
}

export const requestTrackingMiddleware = (
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Override res.json to capture response size
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseSize = JSON.stringify(body).length;
    
    // Track the API usage
    const responseTime = Date.now() - (req.startTime || Date.now());
    const monitoring = MonitoringService.getInstance();
    
    monitoring.trackAPIUsage(
      req,
      res.statusCode,
      responseTime,
      res.statusCode >= 400 ? body?.error?.message : undefined
    );

    // Track response size as system metric
    monitoring.trackSystemMetric('response_size', responseSize, 'bytes', {
      endpoint: req.route?.path || req.path,
      method: req.method,
    });

    return originalJson.call(this, body);
  };

  next();
};

export const performanceMiddleware = (
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const monitoring = MonitoringService.getInstance();
    
    // Track performance metrics
    monitoring.trackSystemMetric('request_duration', duration, 'ms', {
      endpoint: req.route?.path || req.path,
      method: req.method,
      status_code: res.statusCode.toString(),
    });

    // Track memory usage
    const memUsage = process.memoryUsage();
    monitoring.trackSystemMetric('memory_usage', memUsage.heapUsed, 'bytes');
    monitoring.trackSystemMetric('memory_total', memUsage.heapTotal, 'bytes');
  });

  next();
};

export const rateLimitingMiddleware = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const monitoring = MonitoringService.getInstance();
    const identifier = (req as any).user?.id || req.ip;
    
    const requestCount = monitoring.getRequestCount(identifier, windowMs);
    
    if (requestCount >= maxRequests) {
      // Track rate limit violation
      monitoring.trackSystemMetric('rate_limit_violations', 1, 'count', {
        identifier,
        endpoint: req.route?.path || req.path,
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryable: true,
        },
        timestamp: new Date(),
      });
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount - 1));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

    next();
  };
};

export const costTrackingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add cost tracking helper to request
  (req as any).trackAICost = (
    model: string,
    operation: 'image_generation' | 'image_processing',
    processingTime: number,
    cost: number,
    success: boolean,
    metadata?: any
  ) => {
    const userId = (req as any).user?.id;
    if (userId) {
      const monitoring = MonitoringService.getInstance();
      monitoring.trackAIUsage(userId, model, operation, processingTime, cost, success, metadata);
    }
  };

  next();
};

export const userActivityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add user activity tracking helper to request
  (req as any).trackUserActivity = (
    action: string,
    screen: string,
    metadata?: any
  ) => {
    const userId = (req as any).user?.id;
    const sessionId = req.headers['x-session-id'] as string || 'unknown';
    
    if (userId) {
      const monitoring = MonitoringService.getInstance();
      monitoring.trackUserActivity(userId, action, screen, sessionId, metadata);
    }
  };

  next();
};