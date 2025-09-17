import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import creditRoutes from '../../routes/credits';
import { AuthenticationService } from '../../services/AuthenticationService';
import { CreditManagementService } from '../../services/CreditManagementService';
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

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/credits', creditRoutes);

describe('Credit Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeEach(async () => {
    // Clear all data before each test
    AuthenticationService.clearAllUsers();
    CreditManagementService.clearAllTransactions();

    // Register and login to get auth token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'testPassword123'
      });

    authToken = registerResponse.body.data.token;
    testUserId = registerResponse.body.data.user.id;
  });

  describe('GET /credits/balance', () => {
    it('should return user credit balance', async () => {
      const response = await request(app)
        .get('/credits/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(10); // Initial free credits
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/credits/balance')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/credits/balance')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /credits/validate', () => {
    it('should validate sufficient credits', async () => {
      const response = await request(app)
        .post('/credits/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requiredCredits: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.currentBalance).toBe(10);
      expect(response.body.data.message).toBeUndefined();
    });

    it('should validate insufficient credits', async () => {
      const response = await request(app)
        .post('/credits/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requiredCredits: 15 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.currentBalance).toBe(10);
      expect(response.body.data.message).toContain('Insufficient credits');
    });

    it('should reject invalid required credits', async () => {
      const response = await request(app)
        .post('/credits/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requiredCredits: -5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });

    it('should reject missing required credits', async () => {
      const response = await request(app)
        .post('/credits/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });
  });

  describe('POST /credits/deduct', () => {
    it('should deduct credits successfully', async () => {
      const response = await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 3,
          description: 'Sticker generation',
          relatedStickerIds: ['sticker1']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('consumption');
      expect(response.body.data.transaction.amount).toBe(3);
      expect(response.body.data.transaction.description).toBe('Sticker generation');
      expect(response.body.data.newBalance).toBe(7);
    });

    it('should reject deduction with insufficient credits', async () => {
      const response = await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 15,
          description: 'Sticker generation'
        })
        .expect(402);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -5,
          description: 'Invalid deduction'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });

    it('should reject missing description', async () => {
      const response = await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_DESCRIPTION');
    });
  });

  describe('POST /credits/add', () => {
    it('should add credits successfully', async () => {
      const response = await request(app)
        .post('/credits/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 20,
          description: 'Credit purchase'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('purchase');
      expect(response.body.data.transaction.amount).toBe(20);
      expect(response.body.data.transaction.description).toBe('Credit purchase');
      expect(response.body.data.newBalance).toBe(30);
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/credits/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10,
          description: 'Invalid purchase'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });

    it('should reject missing description', async () => {
      const response = await request(app)
        .post('/credits/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_DESCRIPTION');
    });
  });

  describe('GET /credits/transactions', () => {
    it('should return user transaction history', async () => {
      // Create some transactions with small delays to ensure different timestamps
      await request(app)
        .post('/credits/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 20, description: 'Purchase' });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 5, description: 'Generation' });

      const response = await request(app)
        .get('/credits/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions[0].description).toBe('Generation'); // Most recent first
      expect(response.body.data.transactions[1].description).toBe('Purchase');
    });

    it('should return empty array for user with no transactions', async () => {
      const response = await request(app)
        .get('/credits/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/credits/transactions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /credits/refund', () => {
    it('should process refund successfully', async () => {
      // First deduct some credits
      await request(app)
        .post('/credits/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5,
          description: 'Sticker generation',
          relatedStickerIds: ['sticker1']
        });

      // Then process refund
      const response = await request(app)
        .post('/credits/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 3,
          description: 'Partial refund',
          relatedStickerIds: ['sticker1']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('refund');
      expect(response.body.data.transaction.amount).toBe(3);
      expect(response.body.data.transaction.description).toBe('Partial refund');
      expect(response.body.data.newBalance).toBe(8); // 10 - 5 + 3
    });

    it('should reject invalid refund amount', async () => {
      const response = await request(app)
        .post('/credits/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -5,
          description: 'Invalid refund'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AMOUNT');
    });

    it('should reject missing description', async () => {
      const response = await request(app)
        .post('/credits/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_DESCRIPTION');
    });
  });
});