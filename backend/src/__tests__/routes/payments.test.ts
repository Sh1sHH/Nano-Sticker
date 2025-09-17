import request from 'supertest';
import express from 'express';
import paymentsRouter from '../../routes/payments';
import { AuthenticationService } from '../../services/AuthenticationService';
import { PaymentService } from '../../services/PaymentService';
import { AuthMiddleware } from '../../middleware/auth';

// Mock the PaymentService
jest.mock('../../services/PaymentService');
const mockPaymentService = PaymentService as jest.Mocked<typeof PaymentService>;

const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payment Routes', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    PaymentService.clearTransactionRecords();
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

  describe('GET /api/payments/packages', () => {
    it('should return available credit packages', async () => {
      const mockPackages = [
        {
          id: 'credits_10',
          name: 'Starter Pack',
          credits: 10,
          price: 199,
          currency: 'USD' as const
        }
      ];

      mockPaymentService.getCreditPackages.mockReturnValue(mockPackages);

      const response = await request(app)
        .get('/api/payments/packages')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPackages
      });
      expect(mockPaymentService.getCreditPackages).toHaveBeenCalled();
    });

    it('should handle errors when getting packages', async () => {
      mockPaymentService.getCreditPackages.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/payments/packages')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GET_PACKAGES_FAILED');
      expect(response.body.error.message).toBe('Database error');
    });
  });

  describe('GET /api/payments/subscriptions', () => {
    it('should return available subscription plans', async () => {
      const mockPlans = [
        {
          id: 'premium_monthly',
          name: 'Premium Monthly',
          monthlyCredits: 100,
          price: 999,
          currency: 'USD' as const,
          duration: 'monthly' as const,
          features: ['100 credits per month']
        }
      ];

      mockPaymentService.getSubscriptionPlans.mockReturnValue(mockPlans);

      const response = await request(app)
        .get('/api/payments/subscriptions')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPlans
      });
      expect(mockPaymentService.getSubscriptionPlans).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/purchase', () => {
    it('should process valid credit purchase', async () => {
      const purchaseData = {
        platform: 'ios',
        receiptData: 'receipt_data_123',
        productId: 'credits_25',
        transactionId: 'txn_123'
      };

      mockPaymentService.processCreditPurchase.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
        creditsAdded: 25,
        newBalance: 35
      });

      const response = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          transactionId: 'txn_123',
          creditsAdded: 25,
          newBalance: 35
        }
      });

      expect(mockPaymentService.processCreditPurchase).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({
          platform: 'ios',
          receiptData: 'receipt_data_123',
          productId: 'credits_25',
          transactionId: 'txn_123'
        })
      );
    });

    it('should require authentication', async () => {
      const purchaseData = {
        platform: 'ios',
        receiptData: 'receipt_data_123',
        productId: 'credits_25',
        transactionId: 'txn_123'
      };

      const response = await request(app)
        .post('/api/payments/purchase')
        .send(purchaseData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        platform: 'ios',
        receiptData: 'receipt_data_123'
        // Missing productId and transactionId
      };

      const response = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
      expect(response.body.error.message).toContain('Missing required fields');
    });

    it('should validate platform', async () => {
      const invalidPlatformData = {
        platform: 'web',
        receiptData: 'receipt_data_123',
        productId: 'credits_25',
        transactionId: 'txn_123'
      };

      const response = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPlatformData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PLATFORM');
    });

    it('should handle purchase processing failure', async () => {
      const purchaseData = {
        platform: 'ios',
        receiptData: 'invalid_receipt',
        productId: 'credits_25',
        transactionId: 'txn_123'
      };

      mockPaymentService.processCreditPurchase.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_RECEIPT',
          message: 'Invalid purchase receipt',
          retryable: false
        }
      });

      const response = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RECEIPT');
    });

    it('should handle retryable errors with 500 status', async () => {
      const purchaseData = {
        platform: 'ios',
        receiptData: 'receipt_data_123',
        productId: 'credits_25',
        transactionId: 'txn_123'
      };

      mockPaymentService.processCreditPurchase.mockResolvedValue({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Temporary processing error',
          retryable: true
        }
      });

      const response = await request(app)
        .post('/api/payments/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.retryable).toBe(true);
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process valid refund request', async () => {
      const refundData = {
        transactionId: 'txn_123',
        reason: 'User requested refund'
      };

      mockPaymentService.processRefund.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
        creditsAdded: -25,
        newBalance: 10
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          transactionId: 'txn_123',
          creditsRefunded: 25,
          newBalance: 10
        }
      });

      expect(mockPaymentService.processRefund).toHaveBeenCalledWith(
        testUser.id,
        'txn_123',
        'User requested refund'
      );
    });

    it('should require authentication', async () => {
      const refundData = {
        transactionId: 'txn_123',
        reason: 'User requested refund'
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .send(refundData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        transactionId: 'txn_123'
        // Missing reason
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('should handle refund processing failure', async () => {
      const refundData = {
        transactionId: 'non_existent_txn',
        reason: 'User requested refund'
      };

      mockPaymentService.processRefund.mockResolvedValue({
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Original transaction not found',
          retryable: false
        }
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should return user purchase history', async () => {
      const mockHistory = [
        {
          transactionId: 'txn_123',
          userId: testUser.id,
          productId: 'credits_25',
          timestamp: new Date(),
          refunded: false
        }
      ];

      mockPaymentService.getUserPurchaseHistory.mockReturnValue(mockHistory);

      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].transactionId).toBe('txn_123');
      expect(response.body.data[0].userId).toBe(testUser.id);
      expect(response.body.data[0].productId).toBe('credits_25');

      expect(mockPaymentService.getUserPurchaseHistory).toHaveBeenCalledWith(testUser.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/package/:id', () => {
    it('should return specific credit package', async () => {
      const mockPackage = {
        id: 'credits_25',
        name: 'Popular Pack',
        credits: 25,
        price: 399,
        currency: 'USD' as const,
        popular: true
      };

      mockPaymentService.getCreditPackageById.mockReturnValue(mockPackage);

      const response = await request(app)
        .get('/api/payments/package/credits_25')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPackage
      });

      expect(mockPaymentService.getCreditPackageById).toHaveBeenCalledWith('credits_25');
    });

    it('should return 404 for non-existent package', async () => {
      mockPaymentService.getCreditPackageById.mockReturnValue(null);

      const response = await request(app)
        .get('/api/payments/package/invalid_id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PACKAGE_NOT_FOUND');
    });
  });

  describe('GET /api/payments/subscription/:id', () => {
    it('should return specific subscription plan', async () => {
      const mockPlan = {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        monthlyCredits: 100,
        price: 999,
        currency: 'USD' as const,
        duration: 'monthly' as const,
        features: ['100 credits per month']
      };

      mockPaymentService.getSubscriptionPlanById.mockReturnValue(mockPlan);

      const response = await request(app)
        .get('/api/payments/subscription/premium_monthly')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockPlan
      });

      expect(mockPaymentService.getSubscriptionPlanById).toHaveBeenCalledWith('premium_monthly');
    });

    it('should return 404 for non-existent subscription', async () => {
      mockPaymentService.getSubscriptionPlanById.mockReturnValue(null);

      const response = await request(app)
        .get('/api/payments/subscription/invalid_id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SUBSCRIPTION_NOT_FOUND');
    });
  });
});