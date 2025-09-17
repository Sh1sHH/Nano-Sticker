import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export class AuthMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_EXPIRES_IN = '7d';

  /**
   * Generate JWT token for user
   */
  static generateToken(userId: string, email: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Express middleware to authenticate requests
   */
  static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization header required',
            retryable: false
          },
          timestamp: new Date()
        });
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      const payload = AuthMiddleware.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message,
          retryable: false
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  static optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : authHeader;
        
        const payload = AuthMiddleware.verifyToken(token);
        req.user = payload;
      }
      
      next();
    } catch (error) {
      // For optional auth, we continue without setting user
      next();
    }
  }
}