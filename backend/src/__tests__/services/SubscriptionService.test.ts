import { SubscriptionService, UserSubscription } from '../../services/SubscriptionService';
import { PaymentService } from '../../services/PaymentService';
import { AuthenticationService } from '../../services/AuthenticationService';
import { CreditManagementService } from '../../services/CreditManagementService';

describe('SubscriptionService', () => {
  let testUser: any;

  beforeEach(async () => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    CreditManagementService.clearAllTransactions();
    PaymentService.clearTransactionRecords();
    SubscriptionService.clearAllSubscriptions();

    // Create a test user
    const registerResult = await AuthenticationService.registerUser({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (registerResult.success) {
      testUser = registerResult.data.user;
    }
  });

  describe('createSubscription', () => {
    it('should create a monthly subscription successfully', async () => {
      const result = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.subscription!.userId).toBe(testUser.id);
      expect(result.subscription!.planId).toBe('premium_monthly');
      expect(result.subscription!.status).toBe('active');
      expect(result.subscription!.autoRenew).toBe(true);

      // Check that subscription end date is approximately 1 month from now
      const expectedEndDate = new Date();
      expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
      const actualEndDate = result.subscription!.endDate;
      const timeDiff = Math.abs(actualEndDate.getTime() - expectedEndDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });

    it('should create a yearly subscription successfully', async () => {
      const result = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_yearly',
        'payment_txn_123'
      );

      expect(result.success).toBe(true);
      expect(result.subscription!.planId).toBe('premium_yearly');

      // Check that subscription end date is approximately 1 year from now
      const expectedEndDate = new Date();
      expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);
      const actualEndDate = result.subscription!.endDate;
      const timeDiff = Math.abs(actualEndDate.getTime() - expectedEndDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });

    it('should reject invalid subscription plan', async () => {
      const result = await SubscriptionService.createSubscription(
        testUser.id,
        'invalid_plan',
        'payment_txn_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_PLAN',
        message: 'Invalid subscription plan',
        retryable: false
      });
    });

    it('should reject if user already has active subscription', async () => {
      // Create first subscription
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      // Try to create second subscription
      const result = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_yearly',
        'payment_txn_456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'EXISTING_SUBSCRIPTION',
        message: 'User already has an active subscription',
        retryable: false
      });
    });

    it('should grant initial monthly credits', async () => {
      const initialBalance = await CreditManagementService.getUserBalance(testUser.id);
      
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const newBalance = await CreditManagementService.getUserBalance(testUser.id);
      expect(newBalance).toBe(initialBalance! + 100); // 100 monthly credits
    });
  });

  describe('getUserActiveSubscription', () => {
    it('should return active subscription', async () => {
      // Create subscription
      const createResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const result = await SubscriptionService.getUserActiveSubscription(testUser.id);

      expect(result.valid).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.daysRemaining).toBeGreaterThan(25); // Should be close to 30 days
      expect(result.subscription!.id).toBe(createResult.subscription!.id);
    });

    it('should return invalid for user without subscription', async () => {
      const result = await SubscriptionService.getUserActiveSubscription(testUser.id);

      expect(result.valid).toBe(false);
      expect(result.error).toEqual({
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'No active subscription found',
        retryable: false
      });
    });

    it('should return canceled subscription if still within period', async () => {
      // Create and then cancel subscription
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      await SubscriptionService.cancelSubscription(testUser.id, 'User requested cancellation');

      const result = await SubscriptionService.getUserActiveSubscription(testUser.id);

      expect(result.valid).toBe(true);
      expect(result.subscription!.status).toBe('canceled');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      // Create subscription
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const result = await SubscriptionService.cancelSubscription(
        testUser.id,
        'User requested cancellation'
      );

      expect(result.success).toBe(true);
      expect(result.subscription!.status).toBe('canceled');
      expect(result.subscription!.autoRenew).toBe(false);
      expect(result.subscription!.canceledAt).toBeInstanceOf(Date);
      expect(result.subscription!.cancelReason).toBe('User requested cancellation');
    });

    it('should fail if no active subscription', async () => {
      const result = await SubscriptionService.cancelSubscription(
        testUser.id,
        'User requested cancellation'
      );

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'No active subscription found',
        retryable: false
      });
    });
  });

  describe('renewSubscription', () => {
    it('should renew monthly subscription', async () => {
      // Create subscription
      const createResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const originalEndDate = createResult.subscription!.endDate;

      // Renew subscription
      const renewResult = await SubscriptionService.renewSubscription(
        testUser.id,
        'payment_txn_456'
      );

      expect(renewResult.success).toBe(true);
      expect(renewResult.subscription!.status).toBe('active');
      expect(renewResult.subscription!.endDate.getTime()).toBeGreaterThan(originalEndDate.getTime());

      // Should grant additional credits
      const balance = await CreditManagementService.getUserBalance(testUser.id);
      expect(balance).toBe(210); // 10 initial + 100 creation + 100 renewal
    });

    it('should renew yearly subscription', async () => {
      // Create subscription
      const createResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_yearly',
        'payment_txn_123'
      );

      const originalEndDate = createResult.subscription!.endDate;

      // Renew subscription
      const renewResult = await SubscriptionService.renewSubscription(
        testUser.id,
        'payment_txn_456'
      );

      expect(renewResult.success).toBe(true);
      
      // Check that end date is extended by 1 year
      const expectedNewEndDate = new Date(originalEndDate);
      expectedNewEndDate.setFullYear(expectedNewEndDate.getFullYear() + 1);
      
      const timeDiff = Math.abs(renewResult.subscription!.endDate.getTime() - expectedNewEndDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });

    it('should fail if no subscription to renew', async () => {
      const result = await SubscriptionService.renewSubscription(
        testUser.id,
        'payment_txn_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'NO_SUBSCRIPTION_TO_RENEW',
        message: 'No subscription found to renew',
        retryable: false
      });
    });
  });

  describe('getUserSubscriptionBenefits', () => {
    it('should return free tier benefits for user without subscription', async () => {
      const benefits = await SubscriptionService.getUserSubscriptionBenefits(testUser.id);

      expect(benefits).toEqual({
        monthlyCredits: 0,
        priorityProcessing: false,
        exclusiveStyles: false,
        noAds: false,
        features: ['Basic sticker generation', 'Standard processing speed']
      });
    });

    it('should return premium benefits for subscribed user', async () => {
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const benefits = await SubscriptionService.getUserSubscriptionBenefits(testUser.id);

      expect(benefits).toEqual({
        monthlyCredits: 100,
        priorityProcessing: true,
        exclusiveStyles: true,
        noAds: true,
        features: [
          '100 credits per month',
          'Priority processing',
          'Exclusive styles',
          'No ads'
        ]
      });
    });
  });

  describe('userHasPremiumFeatures', () => {
    it('should return false for free user', async () => {
      const hasPremium = await SubscriptionService.userHasPremiumFeatures(testUser.id);
      expect(hasPremium).toBe(false);
    });

    it('should return true for premium user', async () => {
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const hasPremium = await SubscriptionService.userHasPremiumFeatures(testUser.id);
      expect(hasPremium).toBe(true);
    });

    it('should return true for canceled user still within period', async () => {
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      await SubscriptionService.cancelSubscription(testUser.id, 'User requested');

      const hasPremium = await SubscriptionService.userHasPremiumFeatures(testUser.id);
      expect(hasPremium).toBe(true); // Still has access until expiry
    });
  });

  describe('processExpiredSubscriptions', () => {
    it('should mark expired subscriptions as expired', async () => {
      // Create subscription
      const createResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      // Manually set end date to past
      const subscription = createResult.subscription!;
      subscription.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      // Process expired subscriptions
      await SubscriptionService.processExpiredSubscriptions();

      // Check that subscription is marked as expired
      const updatedSubscription = SubscriptionService.getSubscriptionById(subscription.id);
      expect(updatedSubscription!.status).toBe('expired');

      // Check that user no longer has premium features
      const hasPremium = await SubscriptionService.userHasPremiumFeatures(testUser.id);
      expect(hasPremium).toBe(false);
    });
  });

  describe('getUserSubscriptionHistory', () => {
    it('should return user subscription history', async () => {
      // Create first subscription
      const firstResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      // Manually expire the first subscription to allow creating a second one
      if (firstResult.subscription) {
        firstResult.subscription.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        firstResult.subscription.status = 'expired';
      }

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // Create second subscription
      await SubscriptionService.createSubscription(
        testUser.id,
        'premium_yearly',
        'payment_txn_456'
      );

      const history = SubscriptionService.getUserSubscriptionHistory(testUser.id);

      expect(history).toHaveLength(2);
      expect(history.every(sub => sub.userId === testUser.id)).toBe(true);
      
      // Should be sorted by start date (most recent first)
      expect(history[0].startDate.getTime()).toBeGreaterThanOrEqual(history[1].startDate.getTime());
    });

    it('should return empty array for user with no subscriptions', () => {
      const history = SubscriptionService.getUserSubscriptionHistory('non_existent_user');
      expect(history).toHaveLength(0);
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription by ID', async () => {
      const createResult = await SubscriptionService.createSubscription(
        testUser.id,
        'premium_monthly',
        'payment_txn_123'
      );

      const subscription = SubscriptionService.getSubscriptionById(createResult.subscription!.id);

      expect(subscription).toBeDefined();
      expect(subscription!.id).toBe(createResult.subscription!.id);
      expect(subscription!.userId).toBe(testUser.id);
    });

    it('should return null for non-existent subscription', () => {
      const subscription = SubscriptionService.getSubscriptionById('non_existent_id');
      expect(subscription).toBeNull();
    });
  });
});