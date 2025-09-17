import { CreditTransaction, CreditTransactionModel, CreateTransactionData } from '../models/CreditTransaction';
import { AuthenticationService } from './AuthenticationService';

export interface CreditValidationResult {
  valid: boolean;
  currentBalance: number;
  message?: string;
}

export interface CreditOperationResult {
  success: boolean;
  transaction?: CreditTransaction;
  newBalance?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export class CreditManagementService {
  // In-memory storage for demo - replace with database in production
  private static transactions: CreditTransaction[] = [];

  /**
   * Check if user has sufficient credits for an operation
   */
  static async validateUserCredits(userId: string, requiredCredits: number): Promise<CreditValidationResult> {
    try {
      const user = await AuthenticationService.getUserById(userId);
      
      if (!user) {
        return {
          valid: false,
          currentBalance: 0,
          message: 'User not found'
        };
      }

      const currentBalance = user.credits;
      const hasEnoughCredits = currentBalance >= requiredCredits;

      return {
        valid: hasEnoughCredits,
        currentBalance,
        message: hasEnoughCredits 
          ? undefined 
          : `Insufficient credits. Required: ${requiredCredits}, Available: ${currentBalance}`
      };
    } catch (error) {
      return {
        valid: false,
        currentBalance: 0,
        message: 'Error validating credits'
      };
    }
  }

  /**
   * Deduct credits from user account (for sticker generation)
   */
  static async deductCredits(
    userId: string, 
    amount: number, 
    description: string,
    relatedStickerIds?: string[]
  ): Promise<CreditOperationResult> {
    try {
      // Validate transaction amount
      if (!CreditTransactionModel.validateTransactionAmount('consumption', amount)) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Invalid credit amount for deduction',
            retryable: false
          }
        };
      }

      // Check if user has sufficient credits
      const validation = await this.validateUserCredits(userId, amount);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: validation.message || 'Insufficient credits',
            retryable: false
          }
        };
      }

      // Create transaction record
      const transaction = CreditTransactionModel.createTransaction({
        userId,
        type: 'consumption',
        amount,
        description,
        relatedStickerIds
      });

      // Calculate new balance
      const balanceEffect = CreditTransactionModel.calculateBalanceEffect('consumption', amount);
      const newBalance = validation.currentBalance + balanceEffect;

      // Update user balance
      const updateSuccess = await AuthenticationService.updateUserCredits(userId, newBalance);
      if (!updateSuccess) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update user credits',
            retryable: true
          }
        };
      }

      // Store transaction
      this.transactions.push(transaction);

      return {
        success: true,
        transaction,
        newBalance
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credit deduction failed';
      return {
        success: false,
        error: {
          code: 'DEDUCTION_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Add credits to user account (for purchases)
   */
  static async addCredits(
    userId: string, 
    amount: number, 
    description: string
  ): Promise<CreditOperationResult> {
    try {
      // Validate transaction amount
      if (!CreditTransactionModel.validateTransactionAmount('purchase', amount)) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Invalid credit amount for purchase',
            retryable: false
          }
        };
      }

      // Get current user balance
      const user = await AuthenticationService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            retryable: false
          }
        };
      }

      // Create transaction record
      const transaction = CreditTransactionModel.createTransaction({
        userId,
        type: 'purchase',
        amount,
        description
      });

      // Calculate new balance
      const balanceEffect = CreditTransactionModel.calculateBalanceEffect('purchase', amount);
      const newBalance = user.credits + balanceEffect;

      // Update user balance
      const updateSuccess = await AuthenticationService.updateUserCredits(userId, newBalance);
      if (!updateSuccess) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update user credits',
            retryable: true
          }
        };
      }

      // Store transaction
      this.transactions.push(transaction);

      return {
        success: true,
        transaction,
        newBalance
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credit addition failed';
      return {
        success: false,
        error: {
          code: 'ADDITION_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Process refund (add credits back to user account)
   */
  static async processRefund(
    userId: string, 
    amount: number, 
    description: string,
    relatedStickerIds?: string[]
  ): Promise<CreditOperationResult> {
    try {
      // Validate transaction amount
      if (!CreditTransactionModel.validateTransactionAmount('refund', amount)) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Invalid credit amount for refund',
            retryable: false
          }
        };
      }

      // Get current user balance
      const user = await AuthenticationService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            retryable: false
          }
        };
      }

      // Create transaction record
      const transaction = CreditTransactionModel.createTransaction({
        userId,
        type: 'refund',
        amount,
        description,
        relatedStickerIds
      });

      // Calculate new balance
      const balanceEffect = CreditTransactionModel.calculateBalanceEffect('refund', amount);
      const newBalance = user.credits + balanceEffect;

      // Update user balance
      const updateSuccess = await AuthenticationService.updateUserCredits(userId, newBalance);
      if (!updateSuccess) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update user credits',
            retryable: true
          }
        };
      }

      // Store transaction
      this.transactions.push(transaction);

      return {
        success: true,
        transaction,
        newBalance
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund processing failed';
      return {
        success: false,
        error: {
          code: 'REFUND_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Get user's credit transaction history
   */
  static getUserTransactions(userId: string): CreditTransaction[] {
    return this.transactions
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first
  }

  /**
   * Get user's current credit balance
   */
  static async getUserBalance(userId: string): Promise<number | null> {
    const user = await AuthenticationService.getUserById(userId);
    return user ? user.credits : null;
  }

  /**
   * Get transaction by ID
   */
  static getTransactionById(transactionId: string): CreditTransaction | null {
    return this.transactions.find(transaction => transaction.id === transactionId) || null;
  }

  /**
   * Get all transactions (for admin/testing purposes)
   */
  static getAllTransactions(): CreditTransaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear all transactions (for testing purposes)
   */
  static clearAllTransactions(): void {
    this.transactions = [];
  }

  /**
   * Calculate total credits consumed by user
   */
  static getTotalCreditsConsumed(userId: string): number {
    return this.transactions
      .filter(transaction => transaction.userId === userId && transaction.type === 'consumption')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  /**
   * Calculate total credits purchased by user
   */
  static getTotalCreditsPurchased(userId: string): number {
    return this.transactions
      .filter(transaction => transaction.userId === userId && transaction.type === 'purchase')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }
}