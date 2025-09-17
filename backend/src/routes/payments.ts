import express from 'express';
import { PaymentService, PurchaseReceipt } from '../services/PaymentService';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/payments/packages
 * Get available credit packages
 */
router.get('/packages', (req, res) => {
  try {
    const packages = PaymentService.getCreditPackages();
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get credit packages';
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PACKAGES_FAILED',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/payments/subscriptions
 * Get available subscription plans
 */
router.get('/subscriptions', (req, res) => {
  try {
    const plans = PaymentService.getSubscriptionPlans();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription plans';
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SUBSCRIPTIONS_FAILED',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/payments/purchase
 * Process credit package purchase
 */
router.post('/purchase', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { platform, receiptData, productId, transactionId } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!platform || !receiptData || !productId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: platform, receiptData, productId, transactionId',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    // Validate platform
    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLATFORM',
          message: 'Platform must be either "ios" or "android"',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const receipt: PurchaseReceipt = {
      platform: platform as 'ios' | 'android',
      receiptData,
      productId,
      transactionId,
      purchaseDate: new Date()
    };

    const result = await PaymentService.processCreditPurchase(userId, receipt);

    if (result.success) {
      res.json({
        success: true,
        data: {
          transactionId: result.transactionId,
          creditsAdded: result.creditsAdded,
          newBalance: result.newBalance
        }
      });
    } else {
      const statusCode = result.error?.retryable ? 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        timestamp: new Date()
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase processing failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'PURCHASE_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/payments/refund
 * Process refund request
 */
router.post('/refund', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { transactionId, reason } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: transactionId, reason',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await PaymentService.processRefund(userId, transactionId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: {
          transactionId: result.transactionId,
          creditsRefunded: Math.abs(result.creditsAdded || 0),
          newBalance: result.newBalance
        }
      });
    } else {
      const statusCode = result.error?.retryable ? 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        timestamp: new Date()
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund processing failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'REFUND_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/payments/history
 * Get user's purchase history
 */
router.get('/history', AuthMiddleware.authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const history = PaymentService.getUserPurchaseHistory(userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get purchase history';
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HISTORY_FAILED',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/payments/package/:id
 * Get specific credit package details
 */
router.get('/package/:id', (req, res) => {
  try {
    const { id } = req.params;
    const creditPackage = PaymentService.getCreditPackageById(id);

    if (!creditPackage) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Credit package not found',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: creditPackage
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get credit package';
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PACKAGE_FAILED',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/payments/subscription/:id
 * Get specific subscription plan details
 */
router.get('/subscription/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plan = PaymentService.getSubscriptionPlanById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription plan not found',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription plan';
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SUBSCRIPTION_FAILED',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

export default router;