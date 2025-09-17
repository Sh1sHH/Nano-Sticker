import { PaymentService, PurchaseReceipt, ValidationResult } from '../../services/PaymentService';
import { CreditManagementService } from '../../services/CreditManagementService';
import { AuthenticationService } from '../../services/AuthenticationService';

describe('PaymentService', () => {
  beforeEach(() => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    CreditManagementService.clearAllTransactions();
    PaymentService.clearTransactionRecords();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getCreditPackages', () => {
    it('should return available credit packages', () => {
      const packages = PaymentService.getCreditPackages();
      
      expect(packages).toHaveLength(5);
      expect(packages[0]).toEqual({
        id: 'credits_10',
        name: 'Starter Pack',
        credits: 10,
        price: 199,
        currency: 'USD'
      });
      expect(packages[1].popular).toBe(true);
    });
  });

  describe('getSubscriptionPlans', () => {
    it('should return available subscription plans', () => {
      const plans = PaymentService.getSubscriptionPlans();
      
      expect(plans).toHaveLength(2);
      expect(plans[0]).toEqual({
        id: 'premium_monthly',
        name: 'Premium Monthly',
        monthlyCredits: 100,
        price: 999,
        currency: 'USD',
        duration: 'monthly',
        features: [
          '100 credits per month',
          'Priority processing',
          'Exclusive styles',
          'No ads'
        ]
      });
    });
  });

  describe('getCreditPackageById', () => {
    it('should return correct package for valid ID', () => {
      const creditPackage = PaymentService.getCreditPackageById('credits_25');
      
      expect(creditPackage).toEqual({
        id: 'credits_25',
        name: 'Popular Pack',
        credits: 25,
        price: 399,
        currency: 'USD',
        popular: true
      });
    });

    it('should return null for invalid ID', () => {
      const creditPackage = PaymentService.getCreditPackageById('invalid_id');
      expect(creditPackage).toBeNull();
    });
  });

  describe('validateIOSPurchase', () => {
    it('should validate valid iOS purchase receipt', async () => {
      const result = await PaymentService.validateIOSPurchase('valid_receipt_data_123', 'credits_10');

      expect(result.valid).toBe(true);
      expect(result.productId).toBe('credits_10');
      expect(result.transactionId).toMatch(/^ios_/);
      expect(result.purchaseDate).toBeInstanceOf(Date);
    });

    it('should handle iOS validation failure', async () => {
      const result = await PaymentService.validateIOSPurchase('invalid_receipt', 'credits_10');

      expect(result.valid).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_RECEIPT',
        message: 'Invalid iOS purchase receipt',
        retryable: false
      });
    });

    it('should handle short receipt data', async () => {
      const result = await PaymentService.validateIOSPurchase('short', 'credits_10');

      expect(result.valid).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_RECEIPT',
        message: 'Invalid iOS purchase receipt',
        retryable: false
      });
    });
  });

  describe('validateAndroidPurchase', () => {
    it('should validate valid Android purchase receipt', async () => {
      const receiptData = JSON.stringify({
        packageName: 'com.example.app',
        purchaseToken: 'valid_token_123',
        orderId: 'order_456',
        purchaseTime: '1642248000000'
      });

      const result = await PaymentService.validateAndroidPurchase(receiptData, 'credits_10');

      expect(result.valid).toBe(true);
      expect(result.productId).toBe('credits_10');
      expect(result.transactionId).toBe('order_456');
      expect(result.purchaseDate).toBeInstanceOf(Date);
    });

    it('should handle Android validation failure with invalid token', async () => {
      const receiptData = JSON.stringify({
        packageName: 'com.example.app',
        purchaseToken: 'invalid_token'
      });

      const result = await PaymentService.validateAndroidPurchase(receiptData, 'credits_10');

      expect(result.valid).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_RECEIPT',
        message: 'Invalid Android purchase receipt',
        retryable: false
      });
    });

    it('should handle malformed receipt data', async () => {
      const result = await PaymentService.validateAndroidPurchase('invalid_json', 'credits_10');

      expect(result.valid).toBe(false);
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Unexpected token \'i\', "invalid_json" is not valid JSON',
        retryable: true
      });
    });

    it('should generate transaction ID when not provided', async () => {
      const receiptData = JSON.stringify({
        packageName: 'com.example.app',
        purchaseToken: 'valid_token_123',
        purchaseTime: '1642248000000'
      });

      const result = await PaymentService.validateAndroidPurchase(receiptData, 'credits_10');

      expect(result.valid).toBe(true);
      expect(result.transactionId).toMatch(/^android_/);
    });
  });

  describe('processCreditPurchase', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user
      const registerResult = await AuthenticationService.registerUser({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (registerResult.success) {
        testUser = registerResult.data.user;
      }
    });

    it('should process valid iOS credit purchase', async () => {
      // Mock successful iOS validation
      jest.spyOn(PaymentService, 'validateIOSPurchase').mockResolvedValue({
        valid: true,
        productId: 'credits_25',
        transactionId: 'ios_txn_123',
        purchaseDate: new Date()
      });

      const receipt: PurchaseReceipt = {
        platform: 'ios',
        receiptData: 'receipt_data',
        productId: 'credits_25',
        transactionId: 'ios_txn_123',
        purchaseDate: new Date()
      };

      const result = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(result.success).toBe(true);
      expect(result.creditsAdded).toBe(25);
      expect(result.transactionId).toBe('ios_txn_123');
      expect(result.newBalance).toBe(35); // 10 initial + 25 purchased
    });

    it('should process valid Android credit purchase', async () => {
      // Mock successful Android validation
      jest.spyOn(PaymentService, 'validateAndroidPurchase').mockResolvedValue({
        valid: true,
        productId: 'credits_50',
        transactionId: 'android_txn_456',
        purchaseDate: new Date()
      });

      const receipt: PurchaseReceipt = {
        platform: 'android',
        receiptData: JSON.stringify({
          packageName: 'com.example.app',
          purchaseToken: 'token_123'
        }),
        productId: 'credits_50',
        transactionId: 'android_txn_456',
        purchaseDate: new Date()
      };

      const result = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(result.success).toBe(true);
      expect(result.creditsAdded).toBe(50);
      expect(result.transactionId).toBe('android_txn_456');
      expect(result.newBalance).toBe(60); // 10 initial + 50 purchased
    });

    it('should reject unsupported platform', async () => {
      const receipt: PurchaseReceipt = {
        platform: 'web' as any,
        receiptData: 'receipt_data',
        productId: 'credits_25',
        transactionId: 'web_txn_123',
        purchaseDate: new Date()
      };

      const result = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'UNSUPPORTED_PLATFORM',
        message: 'Unsupported payment platform',
        retryable: false
      });
    });

    it('should reject invalid product ID', async () => {
      // Mock successful validation but invalid product
      jest.spyOn(PaymentService, 'validateIOSPurchase').mockResolvedValue({
        valid: true,
        productId: 'invalid_product',
        transactionId: 'ios_txn_123',
        purchaseDate: new Date()
      });

      const receipt: PurchaseReceipt = {
        platform: 'ios',
        receiptData: 'receipt_data',
        productId: 'invalid_product',
        transactionId: 'ios_txn_123',
        purchaseDate: new Date()
      };

      const result = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_PRODUCT',
        message: 'Invalid product ID',
        retryable: false
      });
    });

    it('should prevent duplicate transaction processing', async () => {
      // Mock successful validation
      jest.spyOn(PaymentService, 'validateIOSPurchase').mockResolvedValue({
        valid: true,
        productId: 'credits_25',
        transactionId: 'duplicate_txn_123',
        purchaseDate: new Date()
      });

      const receipt: PurchaseReceipt = {
        platform: 'ios',
        receiptData: 'receipt_data',
        productId: 'credits_25',
        transactionId: 'duplicate_txn_123',
        purchaseDate: new Date()
      };

      // Process the same transaction twice
      const firstResult = await PaymentService.processCreditPurchase(testUser.id, receipt);
      const secondResult = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toEqual({
        code: 'DUPLICATE_TRANSACTION',
        message: 'Transaction already processed',
        retryable: false
      });
    });

    it('should handle validation failure', async () => {
      // Mock failed validation
      jest.spyOn(PaymentService, 'validateIOSPurchase').mockResolvedValue({
        valid: false,
        error: {
          code: 'INVALID_RECEIPT',
          message: 'Invalid receipt',
          retryable: false
        }
      });

      const receipt: PurchaseReceipt = {
        platform: 'ios',
        receiptData: 'invalid_receipt',
        productId: 'credits_25',
        transactionId: 'ios_txn_123',
        purchaseDate: new Date()
      };

      const result = await PaymentService.processCreditPurchase(testUser.id, receipt);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_RECEIPT',
        message: 'Invalid receipt',
        retryable: false
      });
    });
  });

  describe('processRefund', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user with some credits
      const registerResult = await AuthenticationService.registerUser({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (registerResult.success) {
        testUser = registerResult.data.user;
        
        // Add some credits through a purchase
        await CreditManagementService.addCredits(testUser.id, 25, 'Test purchase');
      }
    });

    it('should process valid refund', async () => {
      // First, simulate a purchase transaction
      const transactionId = 'test_txn_123';
      await (PaymentService as any).storeTransactionRecord(transactionId, testUser.id, 'credits_25');

      const result = await PaymentService.processRefund(testUser.id, transactionId, 'User requested refund');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(transactionId);
      expect(result.creditsAdded).toBe(-25); // Negative because credits were deducted
      expect(result.newBalance).toBe(10); // 35 - 25 refund = 10
    });

    it('should reject refund for non-existent transaction', async () => {
      const result = await PaymentService.processRefund(testUser.id, 'non_existent_txn', 'Refund reason');

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'TRANSACTION_NOT_FOUND',
        message: 'Original transaction not found',
        retryable: false
      });
    });

    it('should reject refund when user has insufficient credits', async () => {
      // Create a transaction for more credits than user has
      const transactionId = 'test_txn_456';
      await (PaymentService as any).storeTransactionRecord(transactionId, testUser.id, 'credits_100');

      const result = await PaymentService.processRefund(testUser.id, transactionId, 'Refund reason');

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INSUFFICIENT_CREDITS_FOR_REFUND',
        message: 'User does not have enough credits for refund',
        retryable: false
      });
    });
  });

  describe('getUserPurchaseHistory', () => {
    it('should return user purchase history', async () => {
      const userId = 'test_user_123';
      
      // Add some transaction records with slight delay to ensure ordering
      await (PaymentService as any).storeTransactionRecord('txn_1', userId, 'credits_10');
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay
      await (PaymentService as any).storeTransactionRecord('txn_2', userId, 'credits_25');
      await (PaymentService as any).storeTransactionRecord('txn_3', 'other_user', 'credits_50');

      const history = PaymentService.getUserPurchaseHistory(userId);

      expect(history).toHaveLength(2);
      expect(history.every(record => record.userId === userId)).toBe(true);
      
      // Check that we have both transactions (order may vary)
      const transactionIds = history.map(record => record.transactionId);
      expect(transactionIds).toContain('txn_1');
      expect(transactionIds).toContain('txn_2');
    });

    it('should return empty array for user with no purchases', () => {
      const history = PaymentService.getUserPurchaseHistory('no_purchases_user');
      expect(history).toHaveLength(0);
    });
  });
});