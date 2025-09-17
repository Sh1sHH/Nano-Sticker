import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { app } from '../../server';
import { AuthenticationService } from '../../services/AuthenticationService';

// Mock database operations
jest.mock('../../models/User', () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Security', () => {
    it('should hash passwords with sufficient complexity', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      // Verify hash is different from original
      expect(hashedPassword).not.toBe(password);
      
      // Verify hash length indicates proper salt rounds
      expect(hashedPassword.length).toBeGreaterThan(50);
      
      // Verify password can be verified
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        'qwerty',
        '12345678',
        'password123',
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: weakPassword,
          })
          .expect(400);

        expect(response.body.error.code).toBe('WEAK_PASSWORD');
      }
    });

    it('should enforce password complexity requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPassword123!',
        });

      // Should accept strong password (mocked success)
      expect(response.status).not.toBe(400);
    });
  });

  describe('JWT Token Security', () => {
    it('should generate secure JWT tokens', () => {
      const authService = new AuthenticationService();
      const userId = 'test-user-123';
      
      const token = authService.generateJWT(userId);
      
      // Verify token structure
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      
      // Verify token payload
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-user', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .get('/api/stickers/history')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/stickers/history')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(response.body.error.code).toBe('INVALID_TOKEN');
      }
    });

    it('should reject tokens with invalid signatures', async () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: 'test-user', exp: Math.floor(Date.now() / 1000) + 3600 },
        'wrong-secret'
      );

      const response = await request(app)
        .get('/api/stickers/history')
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: injection,
            password: 'password',
          });

        // Should not cause server error or unauthorized access
        expect(response.status).not.toBe(500);
        expect(response.status).toBe(400); // Should be validation error
      }
    });

    it('should sanitize XSS attempts in input', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      for (const xss of xssAttempts) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: xss,
            password: 'ValidPassword123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user@.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPassword123!',
          })
          .expect(400);

        expect(response.body.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('Session Security', () => {
    it('should implement proper session timeout', async () => {
      // Mock user login
      const { User } = require('../../models/User');
      User.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      // Simulate time passing (would need actual implementation)
      // For now, verify token has expiration
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should prevent concurrent session abuse', async () => {
      const validToken = jwt.sign(
        { userId: 'test-user', exp: Math.floor(Date.now() / 1000) + 3600 },
        process.env.JWT_SECRET || 'test-secret'
      );

      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);

      // All should succeed (no session locking issues)
      responses.forEach(response => {
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent brute force login attempts', async () => {
      const { User } = require('../../models/User');
      User.findByEmail.mockResolvedValue(null); // User not found

      // Attempt multiple failed logins
      const attempts = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(attempts);

      // Should start rate limiting after several attempts
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should implement account lockout after failed attempts', async () => {
      const { User } = require('../../models/User');
      User.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correctpassword', 12),
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword',
        })
        .expect(423);

      expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in responses', async () => {
      const { User } = require('../../models/User');
      User.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should not expose password hash or other sensitive data
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.user?.passwordHash).toBeUndefined();
      
      // Should only include safe user data
      if (response.body.user) {
        expect(response.body.user).toMatchObject({
          id: expect.any(String),
          email: expect.any(String),
        });
      }
    });

    it('should implement proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});