import { MonitoringService } from '../../services/MonitoringService';
import { CreditManagementService } from '../../services/CreditManagementService';

// Mock external dependencies
jest.mock('@google-cloud/monitoring', () => ({
  MetricServiceClient: jest.fn().mockImplementation(() => ({
    createTimeSeries: jest.fn(),
    listTimeSeries: jest.fn(),
  })),
}));

jest.mock('../../services/CreditManagementService');

describe('Cost Monitoring Tests', () => {
  let monitoringService: MonitoringService;
  let creditService: CreditManagementService;

  beforeEach(() => {
    jest.clearAllMocks();
    monitoringService = new MonitoringService();
    creditService = new CreditManagementService();
  });

  describe('AI API Usage Tracking', () => {
    it('should track Vertex AI API calls and costs', async () => {
      const apiCallData = {
        userId: 'user-123',
        requestId: 'req-456',
        model: 'imagen-2',
        inputTokens: 100,
        outputTokens: 50,
        processingTime: 2500, // ms
        cost: 0.05, // USD
        timestamp: new Date(),
      };

      await monitoringService.trackAIAPIUsage(apiCallData);

      // Verify metrics were recorded
      const mockMetricClient = require('@google-cloud/monitoring').MetricServiceClient;
      const mockCreateTimeSeries = mockMetricClient.mock.results[0].value.createTimeSeries;
      
      expect(mockCreateTimeSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('projects/'),
          timeSeries: expect.arrayContaining([
            expect.objectContaining({
              metric: expect.objectContaining({
                type: 'custom.googleapis.com/ai_api_cost',
              }),
              points: expect.arrayContaining([
                expect.objectContaining({
                  value: { doubleValue: 0.05 },
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should aggregate daily API costs by user', async () => {
      const userId = 'user-123';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mock multiple API calls throughout the day
      const apiCalls = [
        { cost: 0.03, timestamp: new Date(today.getTime() + 1000 * 60 * 60 * 2) }, // 2 hours
        { cost: 0.05, timestamp: new Date(today.getTime() + 1000 * 60 * 60 * 6) }, // 6 hours
        { cost: 0.02, timestamp: new Date(today.getTime() + 1000 * 60 * 60 * 10) }, // 10 hours
      ];

      for (const call of apiCalls) {
        await monitoringService.trackAIAPIUsage({
          userId,
          requestId: `req-${Date.now()}`,
          model: 'imagen-2',
          inputTokens: 100,
          outputTokens: 50,
          processingTime: 2000,
          cost: call.cost,
          timestamp: call.timestamp,
        });
      }

      const dailyCost = await monitoringService.getDailyUserCost(userId, today);
      expect(dailyCost).toBe(0.10); // Sum of all costs
    });

    it('should alert when user exceeds daily cost threshold', async () => {
      const userId = 'high-usage-user';
      const highCostCall = {
        userId,
        requestId: 'expensive-req',
        model: 'imagen-2',
        inputTokens: 1000,
        outputTokens: 500,
        processingTime: 5000,
        cost: 2.50, // High cost
        timestamp: new Date(),
      };

      const alertSpy = jest.spyOn(monitoringService, 'sendCostAlert');
      alertSpy.mockImplementation(jest.fn());

      await monitoringService.trackAIAPIUsage(highCostCall);

      // Should trigger cost alert for high usage
      expect(alertSpy).toHaveBeenCalledWith({
        userId,
        dailyCost: expect.any(Number),
        threshold: expect.any(Number),
        alertType: 'DAILY_COST_EXCEEDED',
      });
    });

    it('should track API quota usage and limits', async () => {
      const quotaData = {
        service: 'vertex-ai',
        quotaType: 'requests_per_minute',
        used: 45,
        limit: 60,
        timestamp: new Date(),
      };

      await monitoringService.trackQuotaUsage(quotaData);

      // Verify quota metrics were recorded
      const mockMetricClient = require('@google-cloud/monitoring').MetricServiceClient;
      const mockCreateTimeSeries = mockMetricClient.mock.results[0].value.createTimeSeries;
      
      expect(mockCreateTimeSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          timeSeries: expect.arrayContaining([
            expect.objectContaining({
              metric: expect.objectContaining({
                type: 'custom.googleapis.com/api_quota_usage',
              }),
              points: expect.arrayContaining([
                expect.objectContaining({
                  value: { doubleValue: 45 },
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should predict monthly costs based on current usage', async () => {
      const userId = 'prediction-user';
      const currentDate = new Date();
      const dayOfMonth = currentDate.getDate();
      
      // Mock usage for current month
      const dailyUsage = Array.from({ length: dayOfMonth }, (_, i) => ({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1),
        cost: 0.15 + (Math.random() * 0.10), // $0.15-$0.25 per day
      }));

      // Mock the service to return historical data
      jest.spyOn(monitoringService, 'getMonthlyUserCosts')
        .mockResolvedValue(dailyUsage);

      const prediction = await monitoringService.predictMonthlyCost(userId);
      
      // Should predict based on current daily average
      const currentTotalCost = dailyUsage.reduce((sum, day) => sum + day.cost, 0);
      const dailyAverage = currentTotalCost / dayOfMonth;
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const expectedPrediction = dailyAverage * daysInMonth;

      expect(prediction.predictedMonthlyCost).toBeCloseTo(expectedPrediction, 2);
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Credit System Monitoring', () => {
    it('should track credit consumption patterns', async () => {
      const userId = 'pattern-user';
      const creditTransactions = [
        { type: 'consumption', amount: 1, feature: 'sticker_generation', timestamp: new Date() },
        { type: 'consumption', amount: 1, feature: 'sticker_generation', timestamp: new Date() },
        { type: 'purchase', amount: 10, feature: 'credit_pack', timestamp: new Date() },
        { type: 'consumption', amount: 2, feature: 'premium_style', timestamp: new Date() },
      ];

      for (const transaction of creditTransactions) {
        await monitoringService.trackCreditTransaction(userId, transaction);
      }

      const consumptionPattern = await monitoringService.getCreditConsumptionPattern(userId);
      
      expect(consumptionPattern).toMatchObject({
        totalConsumed: 4,
        totalPurchased: 10,
        averagePerGeneration: expect.any(Number),
        mostUsedFeature: 'sticker_generation',
      });
    });

    it('should identify users at risk of running out of credits', async () => {
      const lowCreditUsers = [
        { userId: 'user-1', credits: 2, dailyUsage: 3 },
        { userId: 'user-2', credits: 1, dailyUsage: 2 },
        { userId: 'user-3', credits: 10, dailyUsage: 1 }, // Not at risk
      ];

      // Mock credit service responses
      (CreditManagementService.prototype.getUserCredits as jest.Mock)
        .mockImplementation((userId) => {
          const user = lowCreditUsers.find(u => u.userId === userId);
          return Promise.resolve(user?.credits || 0);
        });

      jest.spyOn(monitoringService, 'getDailyUsageAverage')
        .mockImplementation((userId) => {
          const user = lowCreditUsers.find(u => u.userId === userId);
          return Promise.resolve(user?.dailyUsage || 0);
        });

      const atRiskUsers = await monitoringService.identifyLowCreditUsers();
      
      expect(atRiskUsers).toHaveLength(2);
      expect(atRiskUsers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1' }),
          expect.objectContaining({ userId: 'user-2' }),
        ])
      );
    });

    it('should calculate credit burn rate and runway', async () => {
      const userId = 'burnrate-user';
      const currentCredits = 25;
      const recentTransactions = [
        { amount: -2, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) }, // 1 day ago
        { amount: -1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) }, // 2 days ago
        { amount: -3, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) }, // 3 days ago
        { amount: -1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) }, // 4 days ago
      ];

      (CreditManagementService.prototype.getUserCredits as jest.Mock)
        .mockResolvedValue(currentCredits);

      jest.spyOn(monitoringService, 'getRecentCreditTransactions')
        .mockResolvedValue(recentTransactions);

      const burnAnalysis = await monitoringService.calculateCreditBurnRate(userId);
      
      expect(burnAnalysis).toMatchObject({
        dailyBurnRate: 1.75, // Average of 2+1+3+1 over 4 days
        daysRemaining: expect.any(Number),
        trend: expect.any(String),
      });

      // Should predict approximately 14 days remaining (25 / 1.75)
      expect(burnAnalysis.daysRemaining).toBeCloseTo(14, 0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track API response times and identify slow endpoints', async () => {
      const performanceData = [
        { endpoint: '/api/stickers/generate', responseTime: 3500, timestamp: new Date() },
        { endpoint: '/api/stickers/generate', responseTime: 2800, timestamp: new Date() },
        { endpoint: '/api/credits/balance', responseTime: 150, timestamp: new Date() },
        { endpoint: '/api/user/profile', responseTime: 200, timestamp: new Date() },
        { endpoint: '/api/stickers/generate', responseTime: 4200, timestamp: new Date() }, // Slow
      ];

      for (const data of performanceData) {
        await monitoringService.trackAPIPerformance(data);
      }

      const slowEndpoints = await monitoringService.identifySlowEndpoints(3000); // 3 second threshold
      
      expect(slowEndpoints).toContainEqual(
        expect.objectContaining({
          endpoint: '/api/stickers/generate',
          averageResponseTime: expect.any(Number),
          slowRequestCount: expect.any(Number),
        })
      );
    });

    it('should monitor system resource usage', async () => {
      const resourceMetrics = {
        cpuUsage: 75.5,
        memoryUsage: 82.3,
        diskUsage: 45.1,
        activeConnections: 150,
        timestamp: new Date(),
      };

      await monitoringService.trackSystemResources(resourceMetrics);

      // Verify system metrics were recorded
      const mockMetricClient = require('@google-cloud/monitoring').MetricServiceClient;
      const mockCreateTimeSeries = mockMetricClient.mock.results[0].value.createTimeSeries;
      
      expect(mockCreateTimeSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          timeSeries: expect.arrayContaining([
            expect.objectContaining({
              metric: expect.objectContaining({
                type: 'custom.googleapis.com/system_cpu_usage',
              }),
              points: expect.arrayContaining([
                expect.objectContaining({
                  value: { doubleValue: 75.5 },
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should generate cost optimization recommendations', async () => {
      const userId = 'optimization-user';
      
      // Mock high-cost usage pattern
      jest.spyOn(monitoringService, 'getUserUsagePattern')
        .mockResolvedValue({
          dailyGenerations: 15,
          averageCostPerGeneration: 0.08,
          preferredStyles: ['realistic', 'oil-painting'], // Expensive styles
          peakUsageHours: [14, 15, 16], // Afternoon peak
        });

      const recommendations = await monitoringService.generateCostOptimizationRecommendations(userId);
      
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'STYLE_OPTIMIZATION',
            description: expect.stringContaining('Consider using less expensive styles'),
            potentialSavings: expect.any(Number),
          }),
          expect.objectContaining({
            type: 'BATCH_PROCESSING',
            description: expect.stringContaining('Batch your requests'),
            potentialSavings: expect.any(Number),
          }),
        ])
      );
    });
  });

  describe('Alert System', () => {
    it('should send alerts when cost thresholds are exceeded', async () => {
      const alertData = {
        type: 'COST_THRESHOLD_EXCEEDED',
        userId: 'alert-user',
        currentCost: 15.50,
        threshold: 10.00,
        period: 'daily',
        timestamp: new Date(),
      };

      const emailSpy = jest.spyOn(monitoringService, 'sendEmailAlert');
      emailSpy.mockImplementation(jest.fn());

      await monitoringService.processAlert(alertData);

      expect(emailSpy).toHaveBeenCalledWith({
        to: expect.any(String),
        subject: expect.stringContaining('Cost Alert'),
        body: expect.stringContaining('$15.50'),
      });
    });

    it('should implement alert rate limiting to prevent spam', async () => {
      const userId = 'spam-user';
      const alertType = 'HIGH_USAGE_WARNING';

      // Send multiple alerts in quick succession
      const alerts = Array.from({ length: 5 }, () =>
        monitoringService.processAlert({
          type: alertType,
          userId,
          currentCost: 8.00,
          threshold: 5.00,
          period: 'daily',
          timestamp: new Date(),
        })
      );

      await Promise.all(alerts);

      // Should only send limited number of alerts (e.g., 1 per hour)
      const sentAlerts = await monitoringService.getRecentAlerts(userId, alertType);
      expect(sentAlerts.length).toBeLessThanOrEqual(2); // Rate limited
    });
  });
});