import { CreditManagementService, CreditOperationResult } from './CreditManagementService';
import { AuthenticationService } from './AuthenticationService';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents (USD)
  currency: 'USD';
  popular?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyCredits: number;
  price: number; // in cents (USD)
  currency: 'USD';
  duration: 'monthly' | 'yearly';
  features: string[];
}

export interface PurchaseReceipt {
  platform: 'ios' | 'android';
  receiptData: string;
  productId: string;
  transactionId: string;
  purchaseDate: Date;
}

export interface ValidationResult {
  valid: boolean;
  productId?: string;
  transactionId?: string;
  purchaseDate?: Date;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  creditsAdded?: number;
  newBalance?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export class PaymentService {
  // Available credit packages
  private static readonly CREDIT_PACKAGES: CreditPackage[] = [
    {
      id: 'credits_10',
      name: 'Starter Pack',
      credits: 10,
      price: 199, // $1.99
      currency: 'USD'
    },
    {
      id: 'credits_25',
      name: 'Popular Pack',
      credits: 25,
      price: 399, // $3.99
      currency: 'USD',
      popular: true
    },
    {
      id: 'credits_50',
      name: 'Value Pack',
      credits: 50,
      price: 699, // $6.99
      currency: 'USD'
    },
    {
      id: 'credits_100',
      name: 'Power Pack',
      credits: 100,
      price: 1199, // $11.99
      currency: 'USD'
    },
    {
      id: 'credits_250',
      name: 'Ultimate Pack',
      credits: 250,
      price: 2499, // $24.99
      currency: 'USD'
    }
  ];

  // Available subscription plans
  private static readonly SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      monthlyCredits: 100,
      price: 999, // $9.99/month
      currency: 'USD',
      duration: 'monthly',
      features: [
        '100 credits per month',
        'Priority processing',
        'Exclusive styles',
        'No ads'
      ]
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      monthlyCredits: 100,
      price: 9999, // $99.99/year (2 months free)
      currency: 'USD',
      duration: 'yearly',
      features: [
        '100 credits per month',
        'Priority processing',
        'Exclusive styles',
        'No ads',
        '2 months free'
      ]
    }
  ];

  /**
   * Get available credit packages
   */
  static getCreditPackages(): CreditPackage[] {
    return [...this.CREDIT_PACKAGES];
  }

  /**
   * Get available subscription plans
   */
  static getSubscriptionPlans(): SubscriptionPlan[] {
    return [...this.SUBSCRIPTION_PLANS];
  }

  /**
   * Get credit package by ID
   */
  static getCreditPackageById(packageId: string): CreditPackage | null {
    return this.CREDIT_PACKAGES.find(pkg => pkg.id === packageId) || null;
  }

  /**
   * Get subscription plan by ID
   */
  static getSubscriptionPlanById(planId: string): SubscriptionPlan | null {
    return this.SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Validate iOS App Store purchase receipt
   * Note: This is a mock implementation for demo purposes.
   * In production, use the official App Store Server API or a library like node-iap
   */
  static async validateIOSPurchase(receiptData: string, productId: string): Promise<ValidationResult> {
    try {
      // Mock validation logic - in production, integrate with App Store Server API
      if (receiptData === 'invalid_receipt' || receiptData.length < 10) {
        return {
          valid: false,
          error: {
            code: 'INVALID_RECEIPT',
            message: 'Invalid iOS purchase receipt',
            retryable: false
          }
        };
      }

      // Simulate successful validation
      return {
        valid: true,
        productId: productId,
        transactionId: `ios_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: new Date()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'iOS validation failed';
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Validate Google Play Store purchase receipt
   * Note: This is a mock implementation for demo purposes.
   * In production, use the Google Play Developer API or a validation library
   */
  static async validateAndroidPurchase(receiptData: string, productId: string): Promise<ValidationResult> {
    try {
      // Parse the receipt data (should contain purchase token and other details)
      const receiptObject = JSON.parse(receiptData);
      
      // Mock validation logic - in production, integrate with Google Play Developer API
      if (!receiptObject.purchaseToken || receiptObject.purchaseToken === 'invalid_token') {
        return {
          valid: false,
          error: {
            code: 'INVALID_RECEIPT',
            message: 'Invalid Android purchase receipt',
            retryable: false
          }
        };
      }

      // Simulate successful validation
      return {
        valid: true,
        productId: productId,
        transactionId: receiptObject.orderId || `android_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: new Date(parseInt(receiptObject.purchaseTime) || Date.now())
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Android validation failed';
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Process credit package purchase
   */
  static async processCreditPurchase(
    userId: string,
    receipt: PurchaseReceipt
  ): Promise<PaymentResult> {
    try {
      // Validate the purchase receipt
      let validationResult: ValidationResult;
      
      if (receipt.platform === 'ios') {
        validationResult = await this.validateIOSPurchase(receipt.receiptData, receipt.productId);
      } else if (receipt.platform === 'android') {
        validationResult = await this.validateAndroidPurchase(receipt.receiptData, receipt.productId);
      } else {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_PLATFORM',
            message: 'Unsupported payment platform',
            retryable: false
          }
        };
      }

      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error || {
            code: 'VALIDATION_FAILED',
            message: 'Purchase validation failed',
            retryable: false
          }
        };
      }

      // Get the credit package
      const creditPackage = this.getCreditPackageById(receipt.productId);
      if (!creditPackage) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRODUCT',
            message: 'Invalid product ID',
            retryable: false
          }
        };
      }

      // Check if transaction was already processed (prevent double spending)
      const existingTransaction = await this.checkTransactionExists(validationResult.transactionId!);
      if (existingTransaction) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_TRANSACTION',
            message: 'Transaction already processed',
            retryable: false
          }
        };
      }

      // Add credits to user account
      const creditResult = await CreditManagementService.addCredits(
        userId,
        creditPackage.credits,
        `Purchase: ${creditPackage.name} (${creditPackage.credits} credits)`
      );

      if (!creditResult.success) {
        return {
          success: false,
          error: creditResult.error || {
            code: 'CREDIT_ADD_FAILED',
            message: 'Failed to add credits',
            retryable: true
          }
        };
      }

      // Store transaction record for duplicate prevention
      await this.storeTransactionRecord(validationResult.transactionId!, userId, receipt.productId);

      return {
        success: true,
        transactionId: validationResult.transactionId,
        creditsAdded: creditPackage.credits,
        newBalance: creditResult.newBalance
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase processing failed';
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Process refund request
   */
  static async processRefund(
    userId: string,
    transactionId: string,
    reason: string
  ): Promise<PaymentResult> {
    try {
      // Get the original transaction
      const transactionRecord = await this.getTransactionRecord(transactionId);
      if (!transactionRecord) {
        return {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Original transaction not found',
            retryable: false
          }
        };
      }

      // Get the credit package to determine refund amount
      const creditPackage = this.getCreditPackageById(transactionRecord.productId);
      if (!creditPackage) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRODUCT',
            message: 'Invalid product ID in transaction',
            retryable: false
          }
        };
      }

      // Check if user has enough credits to refund (prevent negative balance abuse)
      const user = await AuthenticationService.getUserById(userId);
      if (!user || user.credits < creditPackage.credits) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS_FOR_REFUND',
            message: 'User does not have enough credits for refund',
            retryable: false
          }
        };
      }

      // Process the refund by deducting credits
      const refundResult = await CreditManagementService.deductCredits(
        userId,
        creditPackage.credits,
        `Refund: ${reason} (Transaction: ${transactionId})`
      );

      if (!refundResult.success) {
        return {
          success: false,
          error: refundResult.error || {
            code: 'REFUND_FAILED',
            message: 'Failed to process refund',
            retryable: true
          }
        };
      }

      // Mark transaction as refunded
      await this.markTransactionRefunded(transactionId);

      return {
        success: true,
        transactionId: transactionId,
        creditsAdded: -creditPackage.credits, // Negative because credits were deducted
        newBalance: refundResult.newBalance
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund processing failed';
      return {
        success: false,
        error: {
          code: 'REFUND_ERROR',
          message,
          retryable: true
        }
      };
    }
  }

  // Private helper methods for transaction tracking
  private static transactionRecords: Array<{
    transactionId: string;
    userId: string;
    productId: string;
    timestamp: Date;
    refunded: boolean;
  }> = [];

  private static async checkTransactionExists(transactionId: string): Promise<boolean> {
    return this.transactionRecords.some(record => record.transactionId === transactionId);
  }

  private static async storeTransactionRecord(
    transactionId: string,
    userId: string,
    productId: string
  ): Promise<void> {
    this.transactionRecords.push({
      transactionId,
      userId,
      productId,
      timestamp: new Date(),
      refunded: false
    });
  }

  private static async getTransactionRecord(transactionId: string) {
    return this.transactionRecords.find(record => record.transactionId === transactionId) || null;
  }

  private static async markTransactionRefunded(transactionId: string): Promise<void> {
    const record = this.transactionRecords.find(record => record.transactionId === transactionId);
    if (record) {
      record.refunded = true;
    }
  }

  /**
   * Get user's purchase history
   */
  static getUserPurchaseHistory(userId: string) {
    return this.transactionRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear all transaction records (for testing)
   */
  static clearTransactionRecords(): void {
    this.transactionRecords = [];
  }
}