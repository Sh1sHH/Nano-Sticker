import { AuthenticationService } from './AuthenticationService';
import { CreditManagementService } from './CreditManagementService';
import { PaymentService, SubscriptionPlan } from './PaymentService';

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  canceledAt?: Date;
  cancelReason?: string;
}

export interface SubscriptionValidationResult {
  valid: boolean;
  subscription?: UserSubscription;
  plan?: SubscriptionPlan;
  daysRemaining?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface SubscriptionOperationResult {
  success: boolean;
  subscription?: UserSubscription;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface SubscriptionBenefits {
  monthlyCredits: number;
  priorityProcessing: boolean;
  exclusiveStyles: boolean;
  noAds: boolean;
  features: string[];
}

export class SubscriptionService {
  // In-memory storage for demo - replace with database in production
  private static subscriptions: UserSubscription[] = [];

  /**
   * Create a new subscription for a user
   */
  static async createSubscription(
    userId: string,
    planId: string,
    paymentTransactionId: string
  ): Promise<SubscriptionOperationResult> {
    try {
      // Validate the subscription plan
      const plan = PaymentService.getSubscriptionPlanById(planId);
      if (!plan) {
        return {
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Invalid subscription plan',
            retryable: false
          }
        };
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.getUserActiveSubscription(userId);
      if (existingSubscription.valid) {
        return {
          success: false,
          error: {
            code: 'EXISTING_SUBSCRIPTION',
            message: 'User already has an active subscription',
            retryable: false
          }
        };
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.duration === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.duration === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Create subscription record
      const subscription: UserSubscription = {
        id: this.generateSubscriptionId(),
        userId,
        planId,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        lastPaymentDate: startDate,
        nextPaymentDate: new Date(endDate)
      };

      // Update user subscription status
      const user = await AuthenticationService.getUserById(userId);
      if (user) {
        await this.updateUserSubscriptionStatus(userId, 'premium', endDate);
      }

      // Grant initial monthly credits
      await CreditManagementService.addCredits(
        userId,
        plan.monthlyCredits,
        `Subscription credits: ${plan.name}`
      );

      // Store subscription
      this.subscriptions.push(subscription);

      return {
        success: true,
        subscription
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription creation failed';
      return {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Cancel a user's subscription
   */
  static async cancelSubscription(
    userId: string,
    reason: string
  ): Promise<SubscriptionOperationResult> {
    try {
      const subscriptionResult = await this.getUserActiveSubscription(userId);
      if (!subscriptionResult.valid || !subscriptionResult.subscription) {
        return {
          success: false,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found',
            retryable: false
          }
        };
      }

      const subscription = subscriptionResult.subscription;
      
      // Update subscription status
      subscription.status = 'canceled';
      subscription.autoRenew = false;
      subscription.canceledAt = new Date();
      subscription.cancelReason = reason;

      // Note: We don't immediately revoke premium status - let it expire naturally
      // This allows users to continue using premium features until the end of their billing period

      return {
        success: true,
        subscription
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription cancellation failed';
      return {
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Renew a subscription (called by payment processing)
   */
  static async renewSubscription(
    userId: string,
    paymentTransactionId: string
  ): Promise<SubscriptionOperationResult> {
    try {
      const subscriptionResult = await this.getUserActiveSubscription(userId);
      if (!subscriptionResult.valid || !subscriptionResult.subscription) {
        return {
          success: false,
          error: {
            code: 'NO_SUBSCRIPTION_TO_RENEW',
            message: 'No subscription found to renew',
            retryable: false
          }
        };
      }

      const subscription = subscriptionResult.subscription;
      const plan = PaymentService.getSubscriptionPlanById(subscription.planId);
      
      if (!plan) {
        return {
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Subscription plan no longer exists',
            retryable: false
          }
        };
      }

      // Extend subscription period
      const currentEndDate = subscription.endDate;
      const newEndDate = new Date(currentEndDate);
      
      if (plan.duration === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (plan.duration === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Update subscription
      subscription.endDate = newEndDate;
      subscription.lastPaymentDate = new Date();
      subscription.nextPaymentDate = new Date(newEndDate);
      subscription.status = 'active';

      // Update user subscription status
      await this.updateUserSubscriptionStatus(userId, 'premium', newEndDate);

      // Grant monthly credits
      await CreditManagementService.addCredits(
        userId,
        plan.monthlyCredits,
        `Subscription renewal credits: ${plan.name}`
      );

      return {
        success: true,
        subscription
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription renewal failed';
      return {
        success: false,
        error: {
          code: 'RENEWAL_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Get user's active subscription
   */
  static async getUserActiveSubscription(userId: string): Promise<SubscriptionValidationResult> {
    try {
      const subscription = this.subscriptions.find(
        sub => sub.userId === userId && 
               (sub.status === 'active' || sub.status === 'canceled') &&
               sub.endDate > new Date()
      );

      if (!subscription) {
        return {
          valid: false,
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'No active subscription found',
            retryable: false
          }
        };
      }

      const plan = PaymentService.getSubscriptionPlanById(subscription.planId);
      if (!plan) {
        return {
          valid: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Subscription plan no longer exists',
            retryable: false
          }
        };
      }

      const daysRemaining = Math.ceil(
        (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        valid: true,
        subscription,
        plan,
        daysRemaining
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription validation failed';
      return {
        valid: false,
        error: {
          code: 'VALIDATION_FAILED',
          message,
          retryable: true
        }
      };
    }
  }

  /**
   * Get subscription benefits for a user
   */
  static async getUserSubscriptionBenefits(userId: string): Promise<SubscriptionBenefits> {
    const subscriptionResult = await this.getUserActiveSubscription(userId);
    
    if (!subscriptionResult.valid || !subscriptionResult.plan) {
      // Free tier benefits
      return {
        monthlyCredits: 0,
        priorityProcessing: false,
        exclusiveStyles: false,
        noAds: false,
        features: ['Basic sticker generation', 'Standard processing speed']
      };
    }

    // Premium benefits
    return {
      monthlyCredits: subscriptionResult.plan.monthlyCredits,
      priorityProcessing: true,
      exclusiveStyles: true,
      noAds: true,
      features: subscriptionResult.plan.features
    };
  }

  /**
   * Check if user has premium features
   */
  static async userHasPremiumFeatures(userId: string): Promise<boolean> {
    const subscriptionResult = await this.getUserActiveSubscription(userId);
    return subscriptionResult.valid;
  }

  /**
   * Process expired subscriptions (should be called by a cron job)
   */
  static async processExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    const expiredSubscriptions = this.subscriptions.filter(
      sub => sub.status === 'active' && sub.endDate <= now
    );

    for (const subscription of expiredSubscriptions) {
      // Mark subscription as expired
      subscription.status = 'expired';

      // Update user subscription status to free
      await this.updateUserSubscriptionStatus(subscription.userId, 'free');
    }
  }

  /**
   * Get all user subscriptions (including expired)
   */
  static getUserSubscriptionHistory(userId: string): UserSubscription[] {
    return this.subscriptions
      .filter(sub => sub.userId === userId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  /**
   * Get subscription by ID
   */
  static getSubscriptionById(subscriptionId: string): UserSubscription | null {
    return this.subscriptions.find(sub => sub.id === subscriptionId) || null;
  }

  // Private helper methods
  private static generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async updateUserSubscriptionStatus(
    userId: string, 
    status: 'free' | 'premium', 
    expiry?: Date
  ): Promise<void> {
    // This would update the user record in the database
    // For now, we'll use the AuthenticationService's in-memory storage
    const users = (AuthenticationService as any).users;
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].subscriptionStatus = status;
      if (expiry) {
        users[userIndex].subscriptionExpiry = expiry;
      }
    }
  }

  /**
   * Clear all subscriptions (for testing)
   */
  static clearAllSubscriptions(): void {
    this.subscriptions = [];
  }

  /**
   * Get all subscriptions (for admin/testing)
   */
  static getAllSubscriptions(): UserSubscription[] {
    return [...this.subscriptions];
  }
}