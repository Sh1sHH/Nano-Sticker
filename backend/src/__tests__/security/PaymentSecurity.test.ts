import request from 'supertest';
import { app } from '../../server';
import { PaymentService } from '../../services/PaymentService';
import { CreditManagementService } from '../../services/CreditManagementService';

// Mock payment services
jest.mock('../../services/PaymentService');
jest.mock('../../services/CreditManagementService');

describe('Payment Security Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    userId = 'test-user-123';
    authToken = 'valid-jwt-token';

    // Mock authentication
    jest.spyOn(require('../../middleware/auth'), 'authenticateToken')
      .mockImplementation((req, res, next) => {
        req.user = { userId, email: 'test@example.com' };
        next();
      });
  });

  describe('Payment Validation', () => {
    it('should validate payment receipts from App Store', async () => {
      const mockReceipt = {
        receiptData: 'base64-encoded-receipt',
        productId: 'credits_pack_10',
        transactionId: 'appstore-transaction-123',
      };

      // Mock successful validation
      (PaymentService.prototype.validateAppleReceipt as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'credits_pack_10',
          transactionId: 'appstore-transaction-123',
          purchaseDate: new Date(),
        });

      (CreditManagementService.prototype.addCredits as jest.Mock)
        .mockResolvedValue(true);

      const response = await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: mockReceipt,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        creditsAdded: expect.any(Number),
      });

      expect(PaymentService.prototype.validateAppleReceipt).toHaveBeenCalledWith(
        mockReceipt.receiptData
      );
    });

    it('should reject invalid payment receipts', async () => {
      const invalidReceipt = {
        receiptData: 'invalid-receipt-data',
        productId: 'credits_pack_10',
        transactionId: 'fake-transaction',
      };

      // Mock validation failure
      (PaymentService.prototype.validateAppleReceipt as jest.Mock)
        .mockResolvedValue({
          valid: false,
          error: 'Receipt validation failed',
        });

      const response = await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: invalidReceipt,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_RECEIPT',
          message: expect.stringContaining('Receipt validation failed'),
        },
      });

      // Verify no credits were added
      expect(CreditManagementService.prototype.addCredits).not.toHaveBeenCalled();
    });

    it('should prevent duplicate transaction processing', async () => {
      const duplicateReceipt = {
        receiptData: 'valid-receipt-data',
        productId: 'credits_pack_5',
        transactionId: 'duplicate-transaction-123',
      };

      // Mock duplicate transaction detection
      (PaymentService.prototype.validateAppleReceipt as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'credits_pack_5',
          transactionId: 'duplicate-transaction-123',
          purchaseDate: new Date(),
        });

      (PaymentService.prototype.isTransactionProcessed as jest.Mock)
        .mockResolvedValue(true);

      const response = await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: duplicateReceipt,
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DUPLICATE_TRANSACTION',
          message: expect.stringContaining('already processed'),
        },
      });
    });

    it('should validate Google Play receipts securely', async () => {
      const googleReceipt = {
        purchaseToken: 'google-purchase-token',
        productId: 'credits_pack_20',
        packageName: 'com.aistickergenerator',
      };

      // Mock Google Play validation
      (PaymentService.prototype.validateGooglePlayReceipt as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'credits_pack_20',
          purchaseToken: 'google-purchase-token',
          purchaseState: 1, // Purchased
        });

      const response = await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'android',
          receipt: googleReceipt,
        })
        .expect(200);

      expect(PaymentService.prototype.validateGooglePlayReceipt).toHaveBeenCalledWith(
        googleReceipt.purchaseToken,
        googleReceipt.productId,
        googleReceipt.packageName
      );
    });
  });

  describe('Subscription Security', () => {
    it('should validate subscription status securely', async () => {
      const subscriptionReceipt = {
        receiptData: 'subscription-receipt',
        productId: 'premium_monthly',
      };

      // Mock subscription validation
      (PaymentService.prototype.validateSubscription as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'premium_monthly',
          expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          autoRenewing: true,
        });

      const response = await request(app)
        .post('/api/payments/validate-subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: subscriptionReceipt,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        subscription: {
          active: true,
          expiresAt: expect.any(String),
          autoRenewing: true,
        },
      });
    });

    it('should handle expired subscriptions', async () => {
      const expiredSubscriptionReceipt = {
        receiptData: 'expired-subscription-receipt',
        productId: 'premium_monthly',
      };

      // Mock expired subscription
      (PaymentService.prototype.validateSubscription as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'premium_monthly',
          expiresDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          autoRenewing: false,
        });

      const response = await request(app)
        .post('/api/payments/validate-subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: expiredSubscriptionReceipt,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        subscription: {
          active: false,
          expiresAt: expect.any(String),
          autoRenewing: false,
        },
      });
    });
  });

  describe('Financial Data Protection', () => {
    it('should not expose sensitive payment data', async () => {
      const paymentData = {
        receiptData: 'sensitive-receipt-data',
        productId: 'credits_pack_10',
      };

      (PaymentService.prototype.validateAppleReceipt as jest.Mock)
        .mockResolvedValue({
          valid: true,
          productId: 'credits_pack_10',
          transactionId: 'transaction-123',
        });

      const response = await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: paymentData,
        });

      // Should not expose receipt data or internal payment details
      expect(response.body.receiptData).toBeUndefined();
      expect(response.body.internalTransactionId).toBeUndefined();
      expect(response.body.paymentProcessorResponse).toBeUndefined();
    });

    it('should log payment attempts for audit trail', async () => {
      const paymentAttempt = {
        receiptData: 'audit-test-receipt',
        productId: 'credits_pack_5',
      };

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/payments/validate-purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'ios',
          receipt: paymentAttempt,
        });

      // Verify audit logging (implementation would use proper logging service)
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payment validation attempt'),
        expect.objectContaining({
          userId,
          productId: 'credits_pack_5',
          platform: 'ios',
        })
      );

      logSpy.mockRestore();
    });
  });

  describe('Refund Security', () => {
    it('should handle refund requests securely', async () => {
      const refundRequest = {
        transactionId: 'transaction-to-refund',
        reason: 'accidental_purchase',
      };

      // Mock refund processing
      (PaymentService.prototype.processRefund as jest.Mock)
        .mockResolvedValue({
          success: true,
          refundId: 'refund-123',
          amount: 4.99,
        });

      (CreditManagementService.prototype.deductCredits as jest.Mock)
        .mockResolvedValue(true);

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        refund: {
          id: 'refund-123',
          status: 'processed',
        },
      });

      // Verify credits were deducted
      expect(CreditManagementService.prototype.deductCredits).toHaveBeenCalled();
    });

    it('should prevent unauthorized refund requests', async () => {
      const unauthorizedRefund = {
        transactionId: 'someone-elses-transaction',
        reason: 'fraud_attempt',
      };

      // Mock transaction ownership check
      (PaymentService.prototype.verifyTransactionOwnership as jest.Mock)
        .mockResolvedValue(false);

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unauthorizedRefund)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_REFUND',
          message: expect.stringContaining('not authorized'),
        },
      });
    });
  });

  describe('Rate Limiting for Payments', () => {
    it('should rate limit payment validation requests', async () => {
      const paymentData = {
        receiptData: 'rate-limit-test-receipt',
        productId: 'credits_pack_10',
      };

      // Make multiple rapid payment requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/payments/validate-purchase')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            platform: 'ios',
            receipt: paymentData,
          })
      );

      const responses = await Promise.all(requests);

      // Should rate limit excessive payment validation attempts
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});