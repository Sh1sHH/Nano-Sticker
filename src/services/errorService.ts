export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  AI_PROCESSING = 'AI_PROCESSING',
  PAYMENT = 'PAYMENT',
  FILE_PROCESSING = 'FILE_PROCESSING',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: any;
  timestamp: Date;
}

export class ErrorService {
  static createError(
    type: ErrorType,
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    details?: any
  ): AppError {
    return {
      type,
      code,
      message,
      userMessage,
      retryable,
      details,
      timestamp: new Date(),
    };
  }

  static handleNetworkError(error: any): AppError {
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.createError(
        ErrorType.NETWORK,
        'NO_CONNECTION',
        'Network connection failed',
        'Please check your internet connection and try again.',
        true
      );
    }

    if (error.status >= 500) {
      return this.createError(
        ErrorType.NETWORK,
        'SERVER_ERROR',
        `Server error: ${error.status}`,
        'Our servers are experiencing issues. Please try again in a moment.',
        true
      );
    }

    if (error.status === 429) {
      return this.createError(
        ErrorType.NETWORK,
        'RATE_LIMITED',
        'Too many requests',
        'You\'re making requests too quickly. Please wait a moment and try again.',
        true
      );
    }

    return this.createError(
      ErrorType.NETWORK,
      'REQUEST_FAILED',
      `Request failed: ${error.message}`,
      'Something went wrong with your request. Please try again.',
      true
    );
  }

  static handleAIProcessingError(error: any): AppError {
    if (error.code === 'SAFETY_BLOCK') {
      return this.createError(
        ErrorType.AI_PROCESSING,
        'CONTENT_BLOCKED',
        'Content blocked by safety filters',
        'Your image couldn\'t be processed due to content guidelines. Please try a different photo.',
        false
      );
    }

    if (error.code === 'QUOTA_EXCEEDED') {
      return this.createError(
        ErrorType.AI_PROCESSING,
        'QUOTA_EXCEEDED',
        'AI service quota exceeded',
        'We\'ve reached our processing limit. Please try again later.',
        true
      );
    }

    if (error.code === 'MODEL_UNAVAILABLE') {
      return this.createError(
        ErrorType.AI_PROCESSING,
        'SERVICE_UNAVAILABLE',
        'AI model temporarily unavailable',
        'The AI service is temporarily unavailable. Please try again in a few minutes.',
        true
      );
    }

    return this.createError(
      ErrorType.AI_PROCESSING,
      'PROCESSING_FAILED',
      `AI processing failed: ${error.message}`,
      'We couldn\'t process your image. Please try again or contact support if the problem persists.',
      true
    );
  }

  static handlePaymentError(error: any): AppError {
    if (error.code === 'PAYMENT_CANCELLED') {
      return this.createError(
        ErrorType.PAYMENT,
        'CANCELLED',
        'Payment cancelled by user',
        'Payment was cancelled. You can try again when ready.',
        false
      );
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return this.createError(
        ErrorType.PAYMENT,
        'INSUFFICIENT_FUNDS',
        'Insufficient funds',
        'Your payment method doesn\'t have sufficient funds. Please try a different payment method.',
        false
      );
    }

    if (error.code === 'PAYMENT_FAILED') {
      return this.createError(
        ErrorType.PAYMENT,
        'FAILED',
        'Payment processing failed',
        'Your payment couldn\'t be processed. Please check your payment details and try again.',
        true
      );
    }

    return this.createError(
      ErrorType.PAYMENT,
      'UNKNOWN_ERROR',
      `Payment error: ${error.message}`,
      'There was an issue processing your payment. Please try again or contact support.',
      true
    );
  }

  static handleFileProcessingError(error: any): AppError {
    if (error.code === 'FILE_TOO_LARGE') {
      return this.createError(
        ErrorType.FILE_PROCESSING,
        'FILE_TOO_LARGE',
        'File size exceeds limit',
        'Your image is too large. Please choose a smaller image or compress it.',
        false
      );
    }

    if (error.code === 'UNSUPPORTED_FORMAT') {
      return this.createError(
        ErrorType.FILE_PROCESSING,
        'UNSUPPORTED_FORMAT',
        'Unsupported file format',
        'This file format isn\'t supported. Please use JPG, PNG, or HEIC images.',
        false
      );
    }

    if (error.code === 'CORRUPTED_FILE') {
      return this.createError(
        ErrorType.FILE_PROCESSING,
        'CORRUPTED_FILE',
        'File appears to be corrupted',
        'This image file appears to be damaged. Please try a different image.',
        false
      );
    }

    return this.createError(
      ErrorType.FILE_PROCESSING,
      'PROCESSING_FAILED',
      `File processing failed: ${error.message}`,
      'We couldn\'t process your image. Please try a different image.',
      false
    );
  }

  static handleAuthenticationError(error: any): AppError {
    if (error.status === 401) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'UNAUTHORIZED',
        'Authentication failed',
        'Your session has expired. Please log in again.',
        false
      );
    }

    if (error.status === 403) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        'FORBIDDEN',
        'Access denied',
        'You don\'t have permission to perform this action.',
        false
      );
    }

    return this.createError(
      ErrorType.AUTHENTICATION,
      'AUTH_ERROR',
      `Authentication error: ${error.message}`,
      'There was an issue with your authentication. Please try logging in again.',
      false
    );
  }

  static handleInsufficientCreditsError(): AppError {
    return this.createError(
      ErrorType.INSUFFICIENT_CREDITS,
      'NO_CREDITS',
      'Insufficient credits',
      'You don\'t have enough credits to create a sticker. Purchase more credits to continue.',
      false
    );
  }

  static handleGenericError(error: any): AppError {
    return this.createError(
      ErrorType.UNKNOWN,
      'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred',
      'Something unexpected happened. Please try again or contact support if the problem persists.',
      true
    );
  }

  static categorizeError(error: any): AppError {
    // Network and HTTP errors
    if (error.status || error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return this.handleNetworkError(error);
    }

    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return this.handleAuthenticationError(error);
    }

    // AI processing errors
    if (error.code?.includes('AI_') || error.code?.includes('SAFETY_') || error.code?.includes('MODEL_')) {
      return this.handleAIProcessingError(error);
    }

    // Payment errors
    if (error.code?.includes('PAYMENT_') || error.code?.includes('BILLING_')) {
      return this.handlePaymentError(error);
    }

    // File processing errors
    if (error.code?.includes('FILE_') || error.code?.includes('IMAGE_')) {
      return this.handleFileProcessingError(error);
    }

    // Credits errors
    if (error.code === 'INSUFFICIENT_CREDITS') {
      return this.handleInsufficientCreditsError();
    }

    // Generic error
    return this.handleGenericError(error);
  }

  static logError(error: AppError, context?: string): void {
    console.error(`[${error.type}] ${error.code}:`, {
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      context,
      details: error.details,
      timestamp: error.timestamp,
    });
  }
}