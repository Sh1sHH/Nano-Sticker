import { Request, Response, NextFunction } from 'express';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External service errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR = 'PAYMENT_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // File processing
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly retryable: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational: boolean = true,
    retryable: boolean = false,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.retryable = retryable;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: any;
  };
  timestamp: Date;
  requestId?: string;
}

export class ErrorHandler {
  public static createError(
    message: string,
    statusCode: number,
    code: ErrorCode,
    retryable: boolean = false,
    details?: any
  ): AppError {
    return new AppError(message, statusCode, code, true, retryable, details);
  }

  // Authentication errors
  public static unauthorized(message: string = 'Authentication required'): AppError {
    return this.createError(message, 401, ErrorCode.UNAUTHORIZED);
  }

  public static forbidden(message: string = 'Access denied'): AppError {
    return this.createError(message, 403, ErrorCode.FORBIDDEN);
  }

  public static invalidToken(message: string = 'Invalid or expired token'): AppError {
    return this.createError(message, 401, ErrorCode.INVALID_TOKEN);
  }

  // Validation errors
  public static validationError(message: string, details?: any): AppError {
    return this.createError(message, 400, ErrorCode.VALIDATION_ERROR, false, details);
  }

  public static invalidInput(message: string, field?: string): AppError {
    return this.createError(message, 400, ErrorCode.INVALID_INPUT, false, { field });
  }

  public static missingField(field: string): AppError {
    return this.createError(
      `Missing required field: ${field}`,
      400,
      ErrorCode.MISSING_REQUIRED_FIELD,
      false,
      { field }
    );
  }

  // Business logic errors
  public static insufficientCredits(required: number, available: number): AppError {
    return this.createError(
      'Insufficient credits for this operation',
      402,
      ErrorCode.INSUFFICIENT_CREDITS,
      false,
      { required, available }
    );
  }

  public static quotaExceeded(message: string = 'Service quota exceeded'): AppError {
    return this.createError(message, 429, ErrorCode.QUOTA_EXCEEDED, true);
  }

  // External service errors
  public static aiServiceError(message: string, details?: any): AppError {
    return this.createError(message, 502, ErrorCode.AI_SERVICE_ERROR, true, details);
  }

  public static paymentServiceError(message: string, details?: any): AppError {
    return this.createError(message, 502, ErrorCode.PAYMENT_SERVICE_ERROR, true, details);
  }

  // System errors
  public static databaseError(message: string = 'Database operation failed'): AppError {
    return this.createError(message, 500, ErrorCode.DATABASE_ERROR, true);
  }

  public static internalError(message: string = 'Internal server error'): AppError {
    return this.createError(message, 500, ErrorCode.INTERNAL_ERROR, true);
  }

  public static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return this.createError(message, 503, ErrorCode.SERVICE_UNAVAILABLE, true);
  }

  // File processing errors
  public static fileTooLarge(maxSize: string): AppError {
    return this.createError(
      `File size exceeds maximum allowed size of ${maxSize}`,
      413,
      ErrorCode.FILE_TOO_LARGE,
      false,
      { maxSize }
    );
  }

  public static unsupportedFormat(supportedFormats: string[]): AppError {
    return this.createError(
      'Unsupported file format',
      415,
      ErrorCode.UNSUPPORTED_FORMAT,
      false,
      { supportedFormats }
    );
  }

  public static handleError(error: Error): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return this.validationError(error.message);
    }

    if (error.name === 'CastError') {
      return this.invalidInput('Invalid data format');
    }

    if (error.message?.includes('duplicate key')) {
      return this.validationError('Resource already exists');
    }

    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      return this.createError(error.message, 503, ErrorCode.NETWORK_ERROR, true);
    }

    // Default to internal error
    return this.internalError(error.message);
  }
}

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const appError = ErrorHandler.handleError(error);
  
  // Log error details
  console.error('Error occurred:', {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    stack: appError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      retryable: appError.retryable,
      ...(appError.details && { details: appError.details }),
    },
    timestamp: new Date(),
    ...(req.headers['x-request-id'] && { requestId: req.headers['x-request-id'] as string }),
  };

  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};