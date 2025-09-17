import { CreditManagementService } from '../../services/CreditManagementService';
import { AuthenticationService } from '../../services/AuthenticationService';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('CreditManagementService', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    CreditManagementService.clearAllTransactions();

    // Create a test user
    const registerResult = await AuthenticationService.registerUser({
      email: 'test@example.com',
      password: 'testPassword123'
    });

    if (registerResult.success) {
      testUserId = registerResult.data.user.id;
    }
  });

  describe('validateUserCredits', () => {
    it('should validate sufficient credits', async () => {
      const result = await CreditManagementService.validateUserCredits(testUserId, 5);

      expect(result.valid).toBe(true);
      expect(result.currentBalance).toBe(10); // Initial free credits
      expect(result.message).toBeUndefined();
    });

    it('should reject insufficient credits', async () => {
      const result = await CreditManagementService.validateUserCredits(testUserId, 15);

      expect(result.valid).toBe(false);
      expect(result.currentBalance).toBe(10);
      expect(result.message).toBe('Insufficient credits. Required: 15, Available: 10');
    });

    it('should handle non-existent user', async () => {
      const result = await CreditManagementService.validateUserCredits('non-existent', 5);

      expect(result.valid).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.message).toBe('User not found');
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits successfully', async () => {
      const result = await CreditManagementService.deductCredits(
        testUserId, 
        3, 
        'Sticker generation',
        ['sticker1']
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.type).toBe('consumption');
      expect(result.transaction?.amount).toBe(3);
      expect(result.transaction?.description).toBe('Sticker generation');
      expect(result.transaction?.relatedStickerIds).toEqual(['sticker1']);
      expect(result.newBalance).toBe(7);

      // Verify user balance was updated
      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(7);
    });

    it('should reject deduction with insufficient credits', async () => {
      const result = await CreditManagementService.deductCredits(
        testUserId, 
        15, 
        'Sticker generation'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_CREDITS');
      expect(result.error?.message).toContain('Insufficient credits');
      expect(result.transaction).toBeUndefined();
      expect(result.newBalance).toBeUndefined();

      // Verify user balance was not changed
      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(10);
    });

    it('should reject invalid amount', async () => {
      const result = await CreditManagementService.deductCredits(
        testUserId, 
        -5, 
        'Invalid deduction'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
      expect(result.error?.message).toBe('Invalid credit amount for deduction');
    });

    it('should reject zero amount', async () => {
      const result = await CreditManagementService.deductCredits(
        testUserId, 
        0, 
        'Zero deduction'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
    });
  });

  describe('addCredits', () => {
    it('should add credits successfully', async () => {
      const result = await CreditManagementService.addCredits(
        testUserId, 
        20, 
        'Credit purchase'
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.type).toBe('purchase');
      expect(result.transaction?.amount).toBe(20);
      expect(result.transaction?.description).toBe('Credit purchase');
      expect(result.newBalance).toBe(30);

      // Verify user balance was updated
      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(30);
    });

    it('should reject invalid amount', async () => {
      const result = await CreditManagementService.addCredits(
        testUserId, 
        -10, 
        'Invalid purchase'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
      expect(result.error?.message).toBe('Invalid credit amount for purchase');
    });

    it('should reject zero amount', async () => {
      const result = await CreditManagementService.addCredits(
        testUserId, 
        0, 
        'Zero purchase'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
    });

    it('should handle non-existent user', async () => {
      const result = await CreditManagementService.addCredits(
        'non-existent', 
        10, 
        'Purchase'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      // First deduct some credits
      await CreditManagementService.deductCredits(testUserId, 5, 'Sticker generation', ['sticker1']);

      // Then process refund
      const result = await CreditManagementService.processRefund(
        testUserId, 
        3, 
        'Partial refund',
        ['sticker1']
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.type).toBe('refund');
      expect(result.transaction?.amount).toBe(3);
      expect(result.transaction?.description).toBe('Partial refund');
      expect(result.transaction?.relatedStickerIds).toEqual(['sticker1']);
      expect(result.newBalance).toBe(8); // 10 - 5 + 3

      // Verify user balance was updated
      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(8);
    });

    it('should reject invalid refund amount', async () => {
      const result = await CreditManagementService.processRefund(
        testUserId, 
        -5, 
        'Invalid refund'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_AMOUNT');
      expect(result.error?.message).toBe('Invalid credit amount for refund');
    });

    it('should handle non-existent user', async () => {
      const result = await CreditManagementService.processRefund(
        'non-existent', 
        5, 
        'Refund'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('getUserTransactions', () => {
    it('should return user transactions in chronological order', async () => {
      // Create multiple transactions with small delays to ensure different timestamps
      await CreditManagementService.addCredits(testUserId, 20, 'Purchase 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await CreditManagementService.deductCredits(testUserId, 5, 'Generation 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await CreditManagementService.processRefund(testUserId, 2, 'Refund 1');

      const transactions = CreditManagementService.getUserTransactions(testUserId);

      expect(transactions).toHaveLength(3);
      expect(transactions[0].description).toBe('Refund 1'); // Most recent first
      expect(transactions[1].description).toBe('Generation 1');
      expect(transactions[2].description).toBe('Purchase 1');
    });

    it('should return empty array for user with no transactions', async () => {
      const transactions = CreditManagementService.getUserTransactions(testUserId);
      expect(transactions).toHaveLength(0);
    });

    it('should only return transactions for specified user', async () => {
      // Create another user
      const registerResult = await AuthenticationService.registerUser({
        email: 'user2@example.com',
        password: 'password123'
      });

      if (registerResult.success) {
        const user2Id = registerResult.data.user.id;

        // Create transactions for both users
        await CreditManagementService.addCredits(testUserId, 10, 'User 1 purchase');
        await CreditManagementService.addCredits(user2Id, 15, 'User 2 purchase');

        const user1Transactions = CreditManagementService.getUserTransactions(testUserId);
        const user2Transactions = CreditManagementService.getUserTransactions(user2Id);

        expect(user1Transactions).toHaveLength(1);
        expect(user1Transactions[0].description).toBe('User 1 purchase');
        expect(user2Transactions).toHaveLength(1);
        expect(user2Transactions[0].description).toBe('User 2 purchase');
      }
    });
  });

  describe('getUserBalance', () => {
    it('should return current user balance', async () => {
      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(10);
    });

    it('should return null for non-existent user', async () => {
      const balance = await CreditManagementService.getUserBalance('non-existent');
      expect(balance).toBeNull();
    });

    it('should reflect balance changes', async () => {
      await CreditManagementService.addCredits(testUserId, 15, 'Purchase');
      await CreditManagementService.deductCredits(testUserId, 8, 'Generation');

      const balance = await CreditManagementService.getUserBalance(testUserId);
      expect(balance).toBe(17); // 10 + 15 - 8
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by ID', async () => {
      const result = await CreditManagementService.addCredits(testUserId, 10, 'Test purchase');
      
      if (result.success && result.transaction) {
        const transaction = CreditManagementService.getTransactionById(result.transaction.id);
        
        expect(transaction).toBeDefined();
        expect(transaction?.id).toBe(result.transaction.id);
        expect(transaction?.description).toBe('Test purchase');
      }
    });

    it('should return null for non-existent transaction', () => {
      const transaction = CreditManagementService.getTransactionById('non-existent');
      expect(transaction).toBeNull();
    });
  });

  describe('getTotalCreditsConsumed', () => {
    it('should calculate total credits consumed by user', async () => {
      await CreditManagementService.deductCredits(testUserId, 3, 'Generation 1');
      await CreditManagementService.deductCredits(testUserId, 5, 'Generation 2');
      await CreditManagementService.addCredits(testUserId, 10, 'Purchase'); // Should not count

      const totalConsumed = CreditManagementService.getTotalCreditsConsumed(testUserId);
      expect(totalConsumed).toBe(8);
    });

    it('should return 0 for user with no consumption', () => {
      const totalConsumed = CreditManagementService.getTotalCreditsConsumed(testUserId);
      expect(totalConsumed).toBe(0);
    });
  });

  describe('getTotalCreditsPurchased', () => {
    it('should calculate total credits purchased by user', async () => {
      await CreditManagementService.addCredits(testUserId, 20, 'Purchase 1');
      await CreditManagementService.addCredits(testUserId, 15, 'Purchase 2');
      await CreditManagementService.deductCredits(testUserId, 5, 'Generation'); // Should not count

      const totalPurchased = CreditManagementService.getTotalCreditsPurchased(testUserId);
      expect(totalPurchased).toBe(35);
    });

    it('should return 0 for user with no purchases', () => {
      const totalPurchased = CreditManagementService.getTotalCreditsPurchased(testUserId);
      expect(totalPurchased).toBe(0);
    });
  });
});