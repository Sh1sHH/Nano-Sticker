import { Request, Response, NextFunction } from 'express';
import { ErrorHandler, AppError, ErrorCode, errorMiddleware } from '../../middleware/errorHandler';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('creates AppError with correct properties', () => {
      const error = ErrorHandler.createError(
        'Test message',
        400,
        ErrorCode.VALIDATION_ERROR,
        true,
        { field: 'test' }
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('authentication errors', () => {
    it('creates unauthorized error', () => {
      const error = ErrorHandler.unauthorized();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
    });

    it('creates forbidden error', () => {
      const error = ErrorHandler.forbidden();
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.message).toBe('Access denied');
    });

    it('creates invalid token error', () => {
      const error = ErrorHandler.invalidToken();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
      expect(error.message).toBe('Invalid or expired token');
    });
  });

  describe('validation errors', () => {
    it('creates validation error with details', () => {
      const details = { errors: ['Field is required'] };
      const error = ErrorHandler.validationError('Validation failed', details);
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details).toEqual(details);
      expect(error.retryable).toBe(false);
    });

    it('creates invalid input error', () => {
      const error = ErrorHandler.invalidInput('Invalid email format', 'email');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('creates missing field error', () => {
      const error = ErrorHandler.missingField('username');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(error.message).toBe('Missing required field: username');
      expect(error.details).toEqual({ field: 'username' });
    });
  });

  describe('business logic errors', () => {
    it('creates insufficient credits error', () => {
      const error = ErrorHandler.insufficientCredits(10, 5);
      
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_CREDITS);
      expect(error.details).toEqual({ required: 10, available: 5 });
      expect(error.retryable).toBe(false);
    });

    it('creates quota exceeded error', () => {
      const error = ErrorHandler.quotaExceeded();
      
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(error.retryable).toBe(true);
    });
  });

  describe('external service errors', () => {
    it('creates AI service error', () => {
      const details = { model: 'imagen-2' };
      const error = ErrorHandler.aiServiceError('AI processing failed', details);
      
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
      expect(error.details).toEqual(details);
      expect(error.retryable).toBe(true);
    });

    it('creates payment service error', () => {
      const error = ErrorHandler.paymentServiceError('Payment gateway error');
      
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe(ErrorCode.PAYMENT_SERVICE_ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe('system errors', () => {
    it('creates database error', () => {
      const error = ErrorHandler.databaseError();
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('creates internal error', () => {
      const error = ErrorHandler.internalError();
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('creates service unavailable error', () => {
      const error = ErrorHandler.serviceUnavailable();
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(error.retryable).toBe(true);
    });
  });

  describe('file processing errors', () => {
    it('creates file too large error', () => {
      const error = ErrorHandler.fileTooLarge('10MB');
      
      expect(error.statusCode).toBe(413);
      expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(error.details).toEqual({ maxSize: '10MB' });
      expect(error.retryable).toBe(false);
    });

    it('creates unsupported format error', () => {
      const formats = ['jpg', 'png'];
      const error = ErrorHandler.unsupportedFormat(formats);
      
      expect(error.statusCode).toBe(415);
      expect(error.code).toBe(ErrorCode.UNSUPPORTED_FORMAT);
      expect(error.details).toEqual({ supportedFormats: formats });
      expect(error.retryable).toBe(false);
    });
  });

  describe('handleError', () => {
    it('returns AppError as-is', () => {
      const appError = ErrorHandler.validationError('Test error');
      const result = ErrorHandler.handleError(appError);
      
      expect(result).toBe(appError);
    });

    it('converts ValidationError to AppError', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const result = ErrorHandler.handleError(validationError);
      
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.statusCode).toBe(400);
    });

    it('converts CastError to AppError', () => {
      const castError = new Error('Cast failed');
      castError.name = 'CastError';
      
      const result = ErrorHandler.handleError(castError);
      
      expect(result.code).toBe(ErrorCode.INVALID_INPUT);
      expect(result.statusCode).toBe(400);
    });

    it('handles duplicate key errors', () => {
      const duplicateError = new Error('duplicate key error');
      
      const result = ErrorHandler.handleError(duplicateError);
      
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe('Resource already exists');
    });

    it('handles network errors', () => {
      const networkError = new Error('network timeout');
      
      const result = ErrorHandler.handleError(networkError);
      
      expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(result.statusCode).toBe(503);
      expect(result.retryable).toBe(true);
    });

    it('defaults to internal error', () => {
      const genericError = new Error('Something went wrong');
      
      const result = ErrorHandler.handleError(genericError);
      
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.statusCode).toBe(500);
    });
  });
});

describe('errorMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
      headers: { 'x-request-id': 'test-123' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles AppError correctly', () => {
    const appError = ErrorHandler.validationError('Test validation error', { field: 'email' });
    
    errorMiddleware(appError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test validation error',
        retryable: false,
        details: { field: 'email' },
      },
      timestamp: expect.any(Date),
      requestId: 'test-123',
    });
  });

  it('handles generic errors', () => {
    const genericError = new Error('Generic error');
    
    errorMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Generic error',
        retryable: true,
      },
      timestamp: expect.any(Date),
      requestId: 'test-123',
    });
  });

  it('logs error details', () => {
    const error = ErrorHandler.databaseError('Connection failed');
    
    errorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(console.error).toHaveBeenCalledWith('Error occurred:', expect.objectContaining({
      code: ErrorCode.DATABASE_ERROR,
      message: 'Connection failed',
      statusCode: 500,
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
    }));
  });

  it('includes request ID when present', () => {
    const error = ErrorHandler.internalError();
    
    errorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-123',
      })
    );
  });

  it('omits request ID when not present', () => {
    mockRequest.headers = {};
    const error = ErrorHandler.internalError();
    
    errorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.not.objectContaining({
        requestId: expect.anything(),
      })
    );
  });
});