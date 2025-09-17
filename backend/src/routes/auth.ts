import { Router, Request, Response } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await AuthenticationService.registerUser({ email, password });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      const statusCode = result.error.code === 'USER_EXISTS' ? 409 : 400;
      res.status(statusCode).json(result);
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
 * POST /auth/login
 * Authenticate user login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
          retryable: false
        },
        timestamp: new Date()
      });
    }

    const result = await AuthenticationService.authenticateUser({ email, password });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      const statusCode = result.error.code === 'INVALID_CREDENTIALS' ? 401 : 400;
      res.status(statusCode).json(result);
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
 * GET /auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const user = await AuthenticationService.getUserById(req.user.userId);
    
    if (!user) {
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
      data: { user },
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

export default router;