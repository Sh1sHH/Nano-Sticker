import { withRetry, RetryError, retryConditions } from '../retryMechanism';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns result on successful operation', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(operation, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('throws RetryError after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(withRetry(operation, { maxAttempts: 2 })).rejects.toThrow(RetryError);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('respects retry condition', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Non-retryable error'));
    const retryCondition = jest.fn().mockReturnValue(false);
    
    await expect(withRetry(operation, { retryCondition })).rejects.toThrow('Non-retryable error');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
  });

  it('implements exponential backoff', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(operation, { baseDelay: 100, maxAttempts: 2 });
    const endTime = Date.now();
    
    // Should have waited at least 100ms for the retry
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
  });

  it('caps delay at maxDelay', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(operation, { 
      baseDelay: 1000, 
      maxDelay: 50, 
      maxAttempts: 2 
    });
    const endTime = Date.now();
    
    // Should have waited no more than maxDelay + some tolerance
    expect(endTime - startTime).toBeLessThan(200);
  });
});

describe('retryConditions', () => {
  describe('networkError', () => {
    it('returns true for network errors', () => {
      expect(retryConditions.networkError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(retryConditions.networkError({ message: 'network timeout' })).toBe(true);
      expect(retryConditions.networkError({ status: 500 })).toBe(true);
      expect(retryConditions.networkError({ status: 502 })).toBe(true);
    });

    it('returns false for client errors', () => {
      expect(retryConditions.networkError({ status: 400 })).toBe(false);
      expect(retryConditions.networkError({ status: 404 })).toBe(false);
      expect(retryConditions.networkError({ message: 'validation error' })).toBe(false);
    });
  });

  describe('aiServiceError', () => {
    it('returns true for retryable AI errors', () => {
      expect(retryConditions.aiServiceError({ status: 500 })).toBe(true);
      expect(retryConditions.aiServiceError({ code: 'RATE_LIMITED' })).toBe(true);
      expect(retryConditions.aiServiceError({ message: 'temporarily unavailable' })).toBe(true);
    });

    it('returns false for non-retryable AI errors', () => {
      expect(retryConditions.aiServiceError({ status: 400 })).toBe(false);
      expect(retryConditions.aiServiceError({ code: 'SAFETY_BLOCK' })).toBe(false);
    });
  });

  describe('paymentError', () => {
    it('returns true for network/server payment errors', () => {
      expect(retryConditions.paymentError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(retryConditions.paymentError({ status: 500 })).toBe(true);
    });

    it('returns false for payment validation errors', () => {
      expect(retryConditions.paymentError({ code: 'INSUFFICIENT_FUNDS' })).toBe(false);
      expect(retryConditions.paymentError({ status: 400 })).toBe(false);
    });
  });
});