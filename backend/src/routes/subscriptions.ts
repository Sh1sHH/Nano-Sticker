import express from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/subscriptions/create
 * Create a new subscription for the authenticated user
 */
router.post('/create', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { planId, paymentTransactionId } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!planId || !paymentTransactionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: planId, paymentTransactionId',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await SubscriptionService.createSubscription(userId, planId, paymentTransactionId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          subscription: result.subscription
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
    const message = error instanceof Error ? error.message : 'Subscription creation failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel the user's active subscription
 */
router.post('/cancel', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required field: reason',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await SubscriptionService.cancelSubscription(userId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: {
          subscription: result.subscription
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
    const message = error instanceof Error ? error.message : 'Subscription cancellation failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCELLATION_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/subscriptions/renew
 * Renew the user's subscription (called after successful payment)
 */
router.post('/renew', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentTransactionId } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!paymentTransactionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required field: paymentTransactionId',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await SubscriptionService.renewSubscription(userId, paymentTransactionId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          subscription: result.subscription
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
    const message = error instanceof Error ? error.message : 'Subscription renewal failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'RENEWAL_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/subscriptions/status
 * Get the user's current subscription status
 */
router.get('/status', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const subscriptionResult = await SubscriptionService.getUserActiveSubscription(userId);

    res.json({
      success: true,
      data: {
        hasActiveSubscription: subscriptionResult.valid,
        subscription: subscriptionResult.subscription || null,
        plan: subscriptionResult.plan || null,
        daysRemaining: subscriptionResult.daysRemaining || 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription status';
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/subscriptions/benefits
 * Get the user's subscription benefits
 */
router.get('/benefits', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const benefits = await SubscriptionService.getUserSubscriptionBenefits(userId);

    res.json({
      success: true,
      data: benefits
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription benefits';
    res.status(500).json({
      success: false,
      error: {
        code: 'BENEFITS_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/subscriptions/history
 * Get the user's subscription history
 */
router.get('/history', AuthMiddleware.authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const history = SubscriptionService.getUserSubscriptionHistory(userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription history';
    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/subscriptions/features/:feature
 * Check if user has access to a specific premium feature
 */
router.get('/features/:feature', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { feature } = req.params;
    const userId = req.user!.userId;

    const hasPremium = await SubscriptionService.userHasPremiumFeatures(userId);
    const benefits = await SubscriptionService.getUserSubscriptionBenefits(userId);

    let hasFeature = false;
    
    switch (feature) {
      case 'priority-processing':
        hasFeature = benefits.priorityProcessing;
        break;
      case 'exclusive-styles':
        hasFeature = benefits.exclusiveStyles;
        break;
      case 'no-ads':
        hasFeature = benefits.noAds;
        break;
      case 'monthly-credits':
        hasFeature = benefits.monthlyCredits > 0;
        break;
      default:
        hasFeature = hasPremium;
    }

    res.json({
      success: true,
      data: {
        hasFeature,
        isPremium: hasPremium,
        feature: feature
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check feature access';
    res.status(500).json({
      success: false,
      error: {
        code: 'FEATURE_CHECK_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/subscriptions/process-expired
 * Process expired subscriptions (admin endpoint - should be called by cron job)
 */
router.post('/process-expired', async (req, res) => {
  try {
    // In production, this should be protected by admin authentication
    // For now, we'll allow it for testing purposes
    await SubscriptionService.processExpiredSubscriptions();

    res.json({
      success: true,
      data: {
        message: 'Expired subscriptions processed successfully'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process expired subscriptions';
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESS_EXPIRED_ERROR',
        message,
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

export default router;