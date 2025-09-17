import { ErrorService, ErrorType } from '../errorService';

describe('ErrorService', () => {
  describe('createError', () => {
    it('creates error with all properties', () => {
      const error = ErrorService.createError(
        ErrorType.NETWORK,
        'TEST_ERROR',
        'Test message',
        'User message',
        true,
        { extra: 'data' }
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.userMessage).toBe('User message');
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('handleNetworkError', () => {
    it('handles network connection errors', () => {
      const error = ErrorService.handleNetworkError({ code: 'NETWORK_ERROR' });
      
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.code).toBe('NO_CONNECTION');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('internet connection');
    });

    it('handles server errors', () => {
      const error = ErrorService.handleNetworkError({ status: 500 });
      
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('servers are experiencing issues');
    });

    it('handles rate limiting', () => {
      const error = ErrorService.handleNetworkError({ status: 429 });
      
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('too quickly');
    });
  });

  describe('handleAIProcessingError', () => {
    it('handles safety blocks', () => {
      const error = ErrorService.handleAIProcessingError({ code: 'SAFETY_BLOCK' });
      
      expect(error.type).toBe(ErrorType.AI_PROCESSING);
      expect(error.code).toBe('CONTENT_BLOCKED');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('content guidelines');
    });

    it('handles quota exceeded', () => {
      const error = ErrorService.handleAIProcessingError({ code: 'QUOTA_EXCEEDED' });
      
      expect(error.type).toBe(ErrorType.AI_PROCESSING);
      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('processing limit');
    });

    it('handles model unavailable', () => {
      const error = ErrorService.handleAIProcessingError({ code: 'MODEL_UNAVAILABLE' });
      
      expect(error.type).toBe(ErrorType.AI_PROCESSING);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('temporarily unavailable');
    });
  });

  describe('handlePaymentError', () => {
    it('handles payment cancellation', () => {
      const error = ErrorService.handlePaymentError({ code: 'PAYMENT_CANCELLED' });
      
      expect(error.type).toBe(ErrorType.PAYMENT);
      expect(error.code).toBe('CANCELLED');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('cancelled');
    });

    it('handles insufficient funds', () => {
      const error = ErrorService.handlePaymentError({ code: 'INSUFFICIENT_FUNDS' });
      
      expect(error.type).toBe(ErrorType.PAYMENT);
      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('sufficient funds');
    });

    it('handles payment failures', () => {
      const error = ErrorService.handlePaymentError({ code: 'PAYMENT_FAILED' });
      
      expect(error.type).toBe(ErrorType.PAYMENT);
      expect(error.code).toBe('FAILED');
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('couldn\'t be processed');
    });
  });

  describe('handleFileProcessingError', () => {
    it('handles file too large', () => {
      const error = ErrorService.handleFileProcessingError({ code: 'FILE_TOO_LARGE' });
      
      expect(error.type).toBe(ErrorType.FILE_PROCESSING);
      expect(error.code).toBe('FILE_TOO_LARGE');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('too large');
    });

    it('handles unsupported format', () => {
      const error = ErrorService.handleFileProcessingError({ code: 'UNSUPPORTED_FORMAT' });
      
      expect(error.type).toBe(ErrorType.FILE_PROCESSING);
      expect(error.code).toBe('UNSUPPORTED_FORMAT');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('format isn\'t supported');
    });

    it('handles corrupted files', () => {
      const error = ErrorService.handleFileProcessingError({ code: 'CORRUPTED_FILE' });
      
      expect(error.type).toBe(ErrorType.FILE_PROCESSING);
      expect(error.code).toBe('CORRUPTED_FILE');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('damaged');
    });
  });

  describe('handleAuthenticationError', () => {
    it('handles unauthorized access', () => {
      const error = ErrorService.handleAuthenticationError({ status: 401 });
      
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('session has expired');
    });

    it('handles forbidden access', () => {
      const error = ErrorService.handleAuthenticationError({ status: 403 });
      
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('don\'t have permission');
    });
  });

  describe('categorizeError', () => {
    it('categorizes network errors', () => {
      const error = ErrorService.categorizeError({ status: 500 });
      expect(error.type).toBe(ErrorType.NETWORK);
    });

    it('categorizes authentication errors', () => {
      const error = ErrorService.categorizeError({ status: 401 });
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
    });

    it('categorizes AI processing errors', () => {
      const error = ErrorService.categorizeError({ code: 'AI_PROCESSING_FAILED' });
      expect(error.type).toBe(ErrorType.AI_PROCESSING);
    });

    it('categorizes payment errors', () => {
      const error = ErrorService.categorizeError({ code: 'PAYMENT_FAILED' });
      expect(error.type).toBe(ErrorType.PAYMENT);
    });

    it('categorizes file processing errors', () => {
      const error = ErrorService.categorizeError({ code: 'FILE_TOO_LARGE' });
      expect(error.type).toBe(ErrorType.FILE_PROCESSING);
    });

    it('categorizes credit errors', () => {
      const error = ErrorService.categorizeError({ code: 'INSUFFICIENT_CREDITS' });
      expect(error.type).toBe(ErrorType.INSUFFICIENT_CREDITS);
    });

    it('falls back to generic error', () => {
      const error = ErrorService.categorizeError({ message: 'Unknown error' });
      expect(error.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs error with context', () => {
      const error = ErrorService.createError(
        ErrorType.NETWORK,
        'TEST_ERROR',
        'Test message',
        'User message',
        true
      );

      ErrorService.logError(error, 'test context');

      expect(console.error).toHaveBeenCalledWith(
        '[NETWORK] TEST_ERROR:',
        expect.objectContaining({
          message: 'Test message',
          userMessage: 'User message',
          retryable: true,
          context: 'test context',
        })
      );
    });
  });
});