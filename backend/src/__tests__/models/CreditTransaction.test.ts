import { CreditTransactionModel } from '../../models/CreditTransaction';

describe('CreditTransactionModel', () => {
  describe('createTransaction', () => {
    it('should create transaction with all required fields', () => {
      const data = {
        userId: 'user123',
        type: 'consumption' as const,
        amount: 5,
        description: 'Sticker generation',
        relatedStickerIds: ['sticker1', 'sticker2']
      };

      const transaction = CreditTransactionModel.createTransaction(data);

      expect(transaction.id).toBeDefined();
      expect(transaction.id).toMatch(/^txn_\d+_[a-z0-9]+$/);
      expect(transaction.userId).toBe('user123');
      expect(transaction.type).toBe('consumption');
      expect(transaction.amount).toBe(5);
      expect(transaction.description).toBe('Sticker generation');
      expect(transaction.timestamp).toBeInstanceOf(Date);
      expect(transaction.relatedStickerIds).toEqual(['sticker1', 'sticker2']);
    });

    it('should create transaction without optional fields', () => {
      const data = {
        userId: 'user123',
        type: 'purchase' as const,
        amount: 10,
        description: 'Credit purchase'
      };

      const transaction = CreditTransactionModel.createTransaction(data);

      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBe('user123');
      expect(transaction.type).toBe('purchase');
      expect(transaction.amount).toBe(10);
      expect(transaction.description).toBe('Credit purchase');
      expect(transaction.relatedStickerIds).toBeUndefined();
    });

    it('should generate unique transaction IDs', () => {
      const data = {
        userId: 'user123',
        type: 'consumption' as const,
        amount: 1,
        description: 'Test'
      };

      const transaction1 = CreditTransactionModel.createTransaction(data);
      const transaction2 = CreditTransactionModel.createTransaction(data);

      expect(transaction1.id).not.toBe(transaction2.id);
    });
  });

  describe('validateTransactionAmount', () => {
    it('should validate positive amounts for purchase', () => {
      expect(CreditTransactionModel.validateTransactionAmount('purchase', 10)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('purchase', 0.1)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('purchase', 0)).toBe(false);
      expect(CreditTransactionModel.validateTransactionAmount('purchase', -5)).toBe(false);
    });

    it('should validate positive amounts for consumption', () => {
      expect(CreditTransactionModel.validateTransactionAmount('consumption', 5)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('consumption', 0.5)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('consumption', 0)).toBe(false);
      expect(CreditTransactionModel.validateTransactionAmount('consumption', -1)).toBe(false);
    });

    it('should validate positive amounts for refund', () => {
      expect(CreditTransactionModel.validateTransactionAmount('refund', 3)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('refund', 0.1)).toBe(true);
      expect(CreditTransactionModel.validateTransactionAmount('refund', 0)).toBe(false);
      expect(CreditTransactionModel.validateTransactionAmount('refund', -2)).toBe(false);
    });
  });

  describe('calculateBalanceEffect', () => {
    it('should return positive effect for purchase', () => {
      expect(CreditTransactionModel.calculateBalanceEffect('purchase', 10)).toBe(10);
      expect(CreditTransactionModel.calculateBalanceEffect('purchase', 5.5)).toBe(5.5);
    });

    it('should return negative effect for consumption', () => {
      expect(CreditTransactionModel.calculateBalanceEffect('consumption', 5)).toBe(-5);
      expect(CreditTransactionModel.calculateBalanceEffect('consumption', 2.5)).toBe(-2.5);
    });

    it('should return positive effect for refund', () => {
      expect(CreditTransactionModel.calculateBalanceEffect('refund', 3)).toBe(3);
      expect(CreditTransactionModel.calculateBalanceEffect('refund', 1.5)).toBe(1.5);
    });
  });
});