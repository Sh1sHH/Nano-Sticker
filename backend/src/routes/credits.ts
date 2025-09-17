import { Router, Response } from 'express';
import { CreditManagementService } from '../services/CreditManagementService';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /credits/balance
 * Get current user's credit balance
 */
router.get('/balance', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const balance = await CreditManagementService.getUserBalance(req.user.userId);
    
    if (balance === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: { balance },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /credits/validate
 * Validate if user has sufficient credits for an operation
 */
router.post('/validate', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const { requiredCredits } = req.body;

    if (typeof requiredCredits !== 'number' || requiredCredits <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Required credits must be a positive number',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const validation = await CreditManagementService.validateUserCredits(req.user.userId, requiredCredits);

    res.status(200).json({
      success: true,
      data: validation,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /credits/deduct
 * Deduct credits from user account (for sticker generation)
 */
router.post('/deduct', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const { amount, description, relatedStickerIds } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DESCRIPTION',
          message: 'Description is required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await CreditManagementService.deductCredits(
      req.user.userId,
      amount,
      description,
      relatedStickerIds
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        },
        timestamp: new Date()
      });
    } else {
      const statusCode = result.error?.code === 'INSUFFICIENT_CREDITS' ? 402 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /credits/add
 * Add credits to user account (for purchases)
 */
router.post('/add', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const { amount, description } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DESCRIPTION',
          message: 'Description is required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await CreditManagementService.addCredits(
      req.user.userId,
      amount,
      description
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        },
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /credits/transactions
 * Get user's credit transaction history
 */
router.get('/transactions', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const transactions = CreditManagementService.getUserTransactions(req.user.userId);

    res.status(200).json({
      success: true,
      data: { transactions },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

/**
 * POST /credits/refund
 * Process refund for user
 */
router.post('/refund', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const { amount, description, relatedStickerIds } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DESCRIPTION',
          message: 'Description is required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await CreditManagementService.processRefund(
      req.user.userId,
      amount,
      description,
      relatedStickerIds
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        },
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        retryable: true
      },
      timestamp: new Date()
    });
  }
});

export default router;