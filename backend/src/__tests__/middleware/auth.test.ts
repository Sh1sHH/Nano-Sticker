import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '../../middleware/auth';

describe('AuthMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      
      const token = AuthMiddleware.generateToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = AuthMiddleware.generateToken(userId, email);
      
      const payload = AuthMiddleware.verifyToken(token);
      
      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => AuthMiddleware.verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => AuthMiddleware.verifyToken(malformedToken)).toThrow('Invalid token');
    });
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = AuthMiddleware.generateToken(userId, email);
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      AuthMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(userId);
      expect(mockRequest.user?.email).toBe(email);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = AuthMiddleware.generateToken(userId, email);
      
      mockRequest.headers = {
        authorization: token
      };

      AuthMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      AuthMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header required',
          retryable: false
        },
        timestamp: expect.any(Date)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      AuthMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
          retryable: false
        },
        timestamp: expect.any(Date)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate middleware', () => {
    it('should authenticate valid token', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const token = AuthMiddleware.generateToken(userId, email);
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      AuthMiddleware.optionalAuthenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', () => {
      AuthMiddleware.optionalAuthenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      AuthMiddleware.optionalAuthenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});