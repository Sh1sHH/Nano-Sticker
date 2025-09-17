export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if condition is not met
      if (!retryCondition(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw new RetryError(
          `Operation failed after ${maxAttempts} attempts`,
          attempt,
          lastError
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Specific retry conditions for different error types
export const retryConditions = {
  networkError: (error: any) => {
    return error.code === 'NETWORK_ERROR' || 
           error.message?.includes('network') ||
           error.message?.includes('timeout') ||
           error.status >= 500;
  },
  
  aiServiceError: (error: any) => {
    // Retry on server errors but not on client errors (4xx)
    return error.status >= 500 || 
           error.code === 'RATE_LIMITED' ||
           error.message?.includes('temporarily unavailable');
  },
  
  paymentError: (error: any) => {
    // Only retry on network/server errors, not payment validation errors
    return error.code === 'NETWORK_ERROR' || 
           error.status >= 500;
  },
};