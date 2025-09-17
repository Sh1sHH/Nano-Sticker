export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'consumption' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
  relatedStickerIds?: string[];
}

export interface CreateTransactionData {
  userId: string;
  type: 'purchase' | 'consumption' | 'refund';
  amount: number;
  description: string;
  relatedStickerIds?: string[];
}

export class CreditTransactionModel {
  /**
   * Create a new credit transaction
   */
  static createTransaction(data: CreateTransactionData): CreditTransaction {
    return {
      id: this.generateTransactionId(),
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      timestamp: new Date(),
      relatedStickerIds: data.relatedStickerIds
    };
  }

  /**
   * Validate transaction amount based on type
   */
  static validateTransactionAmount(type: CreditTransaction['type'], amount: number): boolean {
    switch (type) {
      case 'purchase':
      case 'refund':
        return amount > 0; // Positive amounts for purchases and refunds
      case 'consumption':
        return amount > 0; // Positive amount (will be subtracted from balance)
      default:
        return false;
    }
  }

  /**
   * Calculate the effect on user balance
   */
  static calculateBalanceEffect(type: CreditTransaction['type'], amount: number): number {
    switch (type) {
      case 'purchase':
      case 'refund':
        return amount; // Add to balance
      case 'consumption':
        return -amount; // Subtract from balance
      default:
        return 0;
    }
  }

  /**
   * Generate a unique transaction ID
   */
  private static generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}