import request from 'supertest';
import express from 'express';
import subscriptionsRouter from '../../routes/subscriptions';
import { AuthenticationService } from '../../services/AuthenticationService';
import { SubscriptionService } from '../../services/SubscriptionService';

// Mock the SubscriptionService
jest.mock('../../services/SubscriptionService');
const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>;

const app = express();
app.use(express.json());
app.use('/api/subscriptions', subscriptionsRouter);

describe('Subscription Routes', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    jest.clearAllMocks();

    // Create a test user
    const registerResult = await AuthenticationService.registerUser({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (registerResult.success) {
      testUser = registerResult.data.user;
      authToken = registerResult.data.token;
    }
  });

  describe('POST /api/subscriptions/create', () => {
    it('should create subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: testUser.id,
        planId: 'premium_monthly',
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true
      };

      mockSubscriptionService.createSubscription.mockResolvedValue({
        success: true,
        subscription: mockSubscription
      });

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'premium_monthly',
          paymentTransactionId: 'payment_123'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          subscription: expect.objectContaining({
            id: 'sub_123',
            userId: testUser.id,
            planId: 'premium_monthly',
            status: 'active'
          })
        }
      });

      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith(
        testUser.id,
        'premium_monthly',
        'payment_123'
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .send({
          planId: 'premium_monthly',
          paymentTransactionId: 'payment_123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'premium_monthly'
          // Missing paymentTransactionId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
      expect(response.body.error.message).toContain('paymentTransactionId');
    });

    it('should handle subscription creation failure', async () => {
      mockSubscriptionService.createSubscription.mockResolvedValue({
        success: false,
        error: {
          code: 'EXISTING_SUBSCRIPTION',
          message: 'User already has an active subscription',
          retryable: false
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'premium_monthly',
          paymentTransactionId: 'payment_123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXISTING_SUBSCRIPTION');
    });

    it('should handle retryable errors with 500 status', async () => {
      mockSubscriptionService.createSubscription.mockResolvedValue({
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: 'Database error',
          retryable: true
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'premium_monthly',
          paymentTransactionId: 'payment_123'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.retryable).toBe(true);
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('should cancel subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: testUser.id,
        planId: 'premium_monthly',
        status: 'canceled' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        canceledAt: new Date(),
        cancelReason: 'User requested cancellation'
      };

      mockSubscriptionService.cancelSubscription.mockResolvedValue({
        success: true,
        subscription: mockSubscription
      });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'User requested cancellation'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          subscription: expect.objectContaining({
            status: 'canceled',
            autoRenew: false,
            cancelReason: 'User requested cancellation'
          })
        }
      });

      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(
        testUser.id,
        'User requested cancellation'
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .send({
          reason: 'User requested cancellation'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
      expect(response.body.error.message).toContain('reason');
    });

    it('should handle cancellation failure', async () => {
      mockSubscriptionService.cancelSubscription.mockResolvedValue({
        success: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found',
          retryable: false
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'User requested cancellation'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
    });
  });

  describe('POST /api/subscriptions/renew', () => {
    it('should renew subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: testUser.id,
        planId: 'premium_monthly',
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Extended
        autoRenew: true
      };

      mockSubscriptionService.renewSubscription.mockResolvedValue({
        success: true,
        subscription: mockSubscription
      });

      const response = await request(app)
        .post('/api/subscriptions/renew')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentTransactionId: 'payment_456'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          subscription: expect.objectContaining({
            status: 'active'
          })
        }
      });

      expect(mockSubscriptionService.renewSubscription).toHaveBeenCalledWith(
        testUser.id,
        'payment_456'
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions/renew')
        .send({
          paymentTransactionId: 'payment_456'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/subscriptions/renew')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
      expect(response.body.error.message).toContain('paymentTransactionId');
    });
  });

  describe('GET /api/subscriptions/status', () => {
    it('should return subscription status for active user', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: testUser.id,
        planId: 'premium_monthly',
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true
      };

      const mockPlan = {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        monthlyCredits: 100,
        price: 999,
        currency: 'USD' as const,
        duration: 'monthly' as const,
        features: ['100 credits per month']
      };

      mockSubscriptionService.getUserActiveSubscription.mockResolvedValue({
        valid: true,
        subscription: mockSubscription,
        plan: mockPlan,
        daysRemaining: 30
      });

      const response = await request(app)
        .get('/api/subscriptions/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          hasActiveSubscription: true,
          subscription: expect.objectContaining({
            id: 'sub_123',
            status: 'active'
          }),
          plan: expect.objectContaining({
            id: 'premium_monthly',
            name: 'Premium Monthly'
          }),
          daysRemaining: 30
        }
      });
    });

    it('should return no subscription for free user', async () => {
      mockSubscriptionService.getUserActiveSubscription.mockResolvedValue({
        valid: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found',
          retryable: false
        }
      });

      const response = await request(app)
        .get('/api/subscriptions/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: null,
          plan: null,
          daysRemaining: 0
        }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions/benefits', () => {
    it('should return premium benefits for subscribed user', async () => {
      const mockBenefits = {
        monthlyCredits: 100,
        priorityProcessing: true,
        exclusiveStyles: true,
        noAds: true,
        features: ['100 credits per month', 'Priority processing']
      };

      mockSubscriptionService.getUserSubscriptionBenefits.mockResolvedValue(mockBenefits);

      const response = await request(app)
        .get('/api/subscriptions/benefits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockBenefits
      });

      expect(mockSubscriptionService.getUserSubscriptionBenefits).toHaveBeenCalledWith(testUser.id);
    });

    it('should return free benefits for non-subscribed user', async () => {
      const mockBenefits = {
        monthlyCredits: 0,
        priorityProcessing: false,
        exclusiveStyles: false,
        noAds: false,
        features: ['Basic sticker generation']
      };

      mockSubscriptionService.getUserSubscriptionBenefits.mockResolvedValue(mockBenefits);

      const response = await request(app)
        .get('/api/subscriptions/benefits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockBenefits
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/benefits')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions/history', () => {
    it('should return subscription history', async () => {
      const mockHistory = [
        {
          id: 'sub_123',
          userId: testUser.id,
          planId: 'premium_monthly',
          status: 'active' as const,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        }
      ];

      mockSubscriptionService.getUserSubscriptionHistory.mockReturnValue(mockHistory);

      const response = await request(app)
        .get('/api/subscriptions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('sub_123');

      expect(mockSubscriptionService.getUserSubscriptionHistory).toHaveBeenCalledWith(testUser.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions/features/:feature', () => {
    it('should check priority processing feature', async () => {
      mockSubscriptionService.userHasPremiumFeatures.mockResolvedValue(true);
      mockSubscriptionService.getUserSubscriptionBenefits.mockResolvedValue({
        monthlyCredits: 100,
        priorityProcessing: true,
        exclusiveStyles: true,
        noAds: true,
        features: ['100 credits per month']
      });

      const response = await request(app)
        .get('/api/subscriptions/features/priority-processing')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          hasFeature: true,
          isPremium: true,
          feature: 'priority-processing'
        }
      });
    });

    it('should check exclusive styles feature for free user', async () => {
      mockSubscriptionService.userHasPremiumFeatures.mockResolvedValue(false);
      mockSubscriptionService.getUserSubscriptionBenefits.mockResolvedValue({
        monthlyCredits: 0,
        priorityProcessing: false,
        exclusiveStyles: false,
        noAds: false,
        features: ['Basic sticker generation']
      });

      const response = await request(app)
        .get('/api/subscriptions/features/exclusive-styles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          hasFeature: false,
          isPremium: false,
          feature: 'exclusive-styles'
        }
      });
    });

    it('should default to premium status for unknown features', async () => {
      mockSubscriptionService.userHasPremiumFeatures.mockResolvedValue(true);
      mockSubscriptionService.getUserSubscriptionBenefits.mockResolvedValue({
        monthlyCredits: 100,
        priorityProcessing: true,
        exclusiveStyles: true,
        noAds: true,
        features: ['100 credits per month']
      });

      const response = await request(app)
        .get('/api/subscriptions/features/unknown-feature')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          hasFeature: true,
          isPremium: true,
          feature: 'unknown-feature'
        }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/features/priority-processing')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/subscriptions/process-expired', () => {
    it('should process expired subscriptions', async () => {
      mockSubscriptionService.processExpiredSubscriptions.mockResolvedValue();

      const response = await request(app)
        .post('/api/subscriptions/process-expired')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Expired subscriptions processed successfully'
        }
      });

      expect(mockSubscriptionService.processExpiredSubscriptions).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      mockSubscriptionService.processExpiredSubscriptions.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/subscriptions/process-expired')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROCESS_EXPIRED_ERROR');
    });
  });
});