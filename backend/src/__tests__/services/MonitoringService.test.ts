import { MonitoringService } from '../../services/MonitoringService';

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = MonitoringService.getInstance();
    // Clear any existing data
    (monitoring as any).apiMetrics = [];
    (monitoring as any).aiMetrics = [];
    (monitoring as any).userMetrics = [];
    (monitoring as any).systemMetrics = [];
  });

  describe('API Usage Tracking', () => {
    it('tracks API usage correctly', () => {
      const mockReq = {
        route: { path: '/api/test' },
        method: 'GET',
        user: { id: 'user123' },
        get: jest.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1',
        body: { test: 'data' },
        query: {},
        params: {},
        connection: { remoteAddress: '127.0.0.1' },
      } as any;

      monitoring.trackAPIUsage(mockReq, 200, 150);

      const metrics = (monitoring as any).apiMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        userId: 'user123',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        ip: '127.0.0.1',
      });
    });

    it('logs high-impact events', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockReq = {
        route: { path: '/api/test' },
        method: 'GET',
        get: jest.fn(),
        body: {},
        query: {},
        params: {},
        connection: { remoteAddress: '127.0.0.1' },
      } as any;

      monitoring.trackAPIUsage(mockReq, 500, 6000, 'Server error');

      expect(consoleSpy).toHaveBeenCalledWith('High-impact API event:', {
        endpoint: '/api/test',
        statusCode: 500,
        responseTime: 6000,
        error: 'Server error',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('AI Usage Tracking', () => {
    it('tracks AI usage correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoring.trackAIUsage(
        'user123',
        'imagen-2',
        'image_generation',
        2500,
        0.05,
        true,
        { style: 'cartoon' }
      );

      const metrics = (monitoring as any).aiMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        userId: 'user123',
        model: 'imagen-2',
        operation: 'image_generation',
        processingTime: 2500,
        cost: 0.05,
        success: true,
        metadata: { style: 'cartoon' },
      });

      expect(consoleSpy).toHaveBeenCalledWith('AI Usage tracked:', {
        userId: 'user123',
        model: 'imagen-2',
        operation: 'image_generation',
        cost: '$0.0500',
        success: true,
        processingTime: '2500ms',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User Activity Tracking', () => {
    it('tracks user activity correctly', () => {
      monitoring.trackUserActivity(
        'user123',
        'button_press',
        'home',
        'session456',
        { button: 'generate' }
      );

      const metrics = (monitoring as any).userMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        userId: 'user123',
        action: 'button_press',
        screen: 'home',
        sessionId: 'session456',
        metadata: { button: 'generate' },
      });
    });
  });

  describe('System Metrics', () => {
    it('tracks system metrics correctly', () => {
      monitoring.trackSystemMetric('memory_usage', 1024, 'MB', { service: 'api' });

      const metrics = (monitoring as any).systemMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'memory_usage',
        value: 1024,
        unit: 'MB',
        tags: { service: 'api' },
      });
    });
  });

  describe('Analytics', () => {
    beforeEach(() => {
      // Add sample data
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      (monitoring as any).apiMetrics = [
        {
          id: '1',
          endpoint: '/api/test',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
          timestamp: oneHourAgo,
        },
        {
          id: '2',
          endpoint: '/api/test',
          method: 'POST',
          statusCode: 400,
          responseTime: 200,
          timestamp: now,
        },
      ];

      (monitoring as any).aiMetrics = [
        {
          id: '1',
          userId: 'user123',
          model: 'imagen-2',
          operation: 'image_generation',
          cost: 0.05,
          success: true,
          processingTime: 2000,
          timestamp: oneHourAgo,
        },
        {
          id: '2',
          userId: 'user456',
          model: 'imagen-2',
          operation: 'image_processing',
          cost: 0.03,
          success: false,
          processingTime: 1500,
          timestamp: now,
        },
      ];
    });

    it('calculates API analytics correctly', () => {
      const timeRange = {
        start: new Date(Date.now() - 2 * 60 * 60 * 1000),
        end: new Date(),
      };

      const analytics = monitoring.getAPIAnalytics(timeRange);

      expect(analytics.totalRequests).toBe(2);
      expect(analytics.successRate).toBe(0.5); // 1 success out of 2
      expect(analytics.averageResponseTime).toBe(150); // (100 + 200) / 2
      expect(analytics.errorRate).toBe(0.5); // 1 error out of 2
    });

    it('calculates AI analytics correctly', () => {
      const timeRange = {
        start: new Date(Date.now() - 2 * 60 * 60 * 1000),
        end: new Date(),
      };

      const analytics = monitoring.getAIAnalytics(timeRange);

      expect(analytics.totalOperations).toBe(2);
      expect(analytics.totalCost).toBe(0.08); // 0.05 + 0.03
      expect(analytics.averageCost).toBe(0.04); // 0.08 / 2
      expect(analytics.successRate).toBe(0.5); // 1 success out of 2
      expect(analytics.averageProcessingTime).toBe(1750); // (2000 + 1500) / 2
    });
  });

  describe('Cost Monitoring', () => {
    beforeEach(() => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      (monitoring as any).aiMetrics = [
        {
          id: '1',
          userId: 'user123',
          cost: 0.05,
          timestamp: today,
        },
        {
          id: '2',
          userId: 'user123',
          cost: 0.03,
          timestamp: today,
        },
        {
          id: '3',
          userId: 'user456',
          cost: 0.02,
          timestamp: yesterday,
        },
      ];
    });

    it('calculates daily cost correctly', () => {
      const today = new Date();
      const dailyCost = monitoring.getDailyCost(today);
      expect(dailyCost).toBe(0.08); // 0.05 + 0.03 for today
    });

    it('calculates monthly cost correctly', () => {
      const now = new Date();
      const monthlyCost = monitoring.getMonthlyCost(now.getFullYear(), now.getMonth());
      expect(monthlyCost).toBe(0.10); // All costs for this month
    });

    it('calculates user monthly cost correctly', () => {
      const now = new Date();
      const userCost = monitoring.getUserMonthlyCost('user123', now.getFullYear(), now.getMonth());
      expect(userCost).toBe(0.08); // user123's costs for this month
    });
  });

  describe('Rate Limiting Support', () => {
    beforeEach(() => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      (monitoring as any).apiMetrics = [
        {
          id: '1',
          userId: 'user123',
          ip: '127.0.0.1',
          timestamp: fiveMinutesAgo,
        },
        {
          id: '2',
          userId: 'user123',
          ip: '127.0.0.1',
          timestamp: now,
        },
      ];
    });

    it('counts requests by user ID', () => {
      const count = monitoring.getRequestCount('user123', 10 * 60 * 1000); // 10 minutes
      expect(count).toBe(2);
    });

    it('counts requests by IP', () => {
      const count = monitoring.getRequestCount('127.0.0.1', 10 * 60 * 1000); // 10 minutes
      expect(count).toBe(2);
    });

    it('respects time window', () => {
      const count = monitoring.getRequestCount('user123', 2 * 60 * 1000); // 2 minutes
      expect(count).toBe(1); // Only the recent request
    });
  });

  describe('Alert System', () => {
    it('sends alert for high error rate', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Add metrics with high error rate
      const now = new Date();
      (monitoring as any).apiMetrics = Array.from({ length: 10 }, (_, i) => ({
        id: i.toString(),
        statusCode: i < 8 ? 500 : 200, // 80% error rate
        timestamp: now,
        endpoint: '/test',
        method: 'GET',
        responseTime: 100,
      }));

      // Trigger threshold check
      (monitoring as any).checkAPIThresholds();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT [HIGH_ERROR_RATE]')
      );

      consoleSpy.mockRestore();
    });

    it('sends alert for high response time', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Add metrics with high response time
      const now = new Date();
      (monitoring as any).apiMetrics = Array.from({ length: 5 }, (_, i) => ({
        id: i.toString(),
        statusCode: 200,
        responseTime: 4000, // 4 seconds
        timestamp: now,
        endpoint: '/test',
        method: 'GET',
      }));

      // Trigger threshold check
      (monitoring as any).checkAPIThresholds();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT [HIGH_RESPONSE_TIME]')
      );

      consoleSpy.mockRestore();
    });
  });
});