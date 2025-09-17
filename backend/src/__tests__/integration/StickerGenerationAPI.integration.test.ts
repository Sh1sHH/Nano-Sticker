import request from 'supertest';
import { app } from '../../server';
import { CreditManagementService } from '../../services/CreditManagementService';
import { AuthenticationService } from '../../services/AuthenticationService';

// Mock external services
jest.mock('../../services/CreditManagementService');
jest.mock('../../services/AuthenticationService');

// Mock Google Vertex AI
jest.mock('@google-cloud/aiplatform', () => ({
  PredictionServiceClient: jest.fn().mockImplementation(() => ({
    predict: jest.fn(),
  })),
}));

describe('Sticker Generation API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock user
    userId = 'test-user-123';
    authToken = 'mock-jwt-token';

    // Mock authentication
    (AuthenticationService.prototype.verifyToken as jest.Mock).mockResolvedValue({
      userId,
      email: 'test@example.com',
    });

    // Mock credit management
    (CreditManagementService.prototype.checkUserCredits as jest.Mock).mockResolvedValue(5);
    (CreditManagementService.prototype.deductCredits as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /api/stickers/generate', () => {
    it('should successfully generate sticker with valid request', async () => {
      const mockImageData = Buffer.from('mock-image-data');
      const mockGeneratedImage = Buffer.from('mock-generated-sticker');

      // Mock Vertex AI response
      const mockPredictionClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      const mockPredict = jest.fn().mockResolvedValue([{
        predictions: [{
          bytesBase64Encoded: mockGeneratedImage.toString('base64'),
        }],
      }]);
      mockPredictionClient.mockImplementation(() => ({
        predict: mockPredict,
      }));

      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImageData, 'test-image.jpg')
        .field('style', 'cartoon')
        .field('emotions', JSON.stringify(['happy', 'excited']))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        stickers: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            imageUrl: expect.any(String),
            emotion: expect.any(String),
            style: 'cartoon',
          }),
        ]),
      });

      // Verify credit deduction
      expect(CreditManagementService.prototype.deductCredits).toHaveBeenCalledWith(userId, 1);
    });

    it('should reject request with insufficient credits', async () => {
      // Mock insufficient credits
      (CreditManagementService.prototype.checkUserCredits as jest.Mock).mockResolvedValue(0);

      const mockImageData = Buffer.from('mock-image-data');

      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImageData, 'test-image.jpg')
        .field('style', 'anime')
        .expect(402);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: expect.stringContaining('insufficient credits'),
        },
      });

      // Verify no credit deduction
      expect(CreditManagementService.prototype.deductCredits).not.toHaveBeenCalled();
    });

    it('should handle Vertex AI API errors gracefully', async () => {
      const mockImageData = Buffer.from('mock-image-data');

      // Mock Vertex AI error
      const mockPredictionClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      const mockPredict = jest.fn().mockRejectedValue(new Error('API quota exceeded'));
      mockPredictionClient.mockImplementation(() => ({
        predict: mockPredict,
      }));

      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImageData, 'test-image.jpg')
        .field('style', 'oil-painting')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: expect.stringContaining('Failed to generate sticker'),
          retryable: true,
        },
      });

      // Verify credits not deducted on failure
      expect(CreditManagementService.prototype.deductCredits).not.toHaveBeenCalled();
    });

    it('should validate image format and size', async () => {
      const oversizedImageData = Buffer.alloc(15 * 1024 * 1024); // 15MB

      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', oversizedImageData, 'large-image.jpg')
        .field('style', 'cartoon')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: expect.stringContaining('Image size exceeds limit'),
        },
      });
    });

    it('should handle content safety blocks', async () => {
      const mockImageData = Buffer.from('mock-inappropriate-image');

      // Mock safety block response
      const mockPredictionClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      const mockPredict = jest.fn().mockRejectedValue(
        new Error('Content blocked by safety filters')
      );
      mockPredictionClient.mockImplementation(() => ({
        predict: mockPredict,
      }));

      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', mockImageData, 'test-image.jpg')
        .field('style', 'realistic')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CONTENT_BLOCKED',
          message: expect.stringContaining('Content not suitable'),
          retryable: false,
        },
      });

      // Verify credits not deducted for safety blocks
      expect(CreditManagementService.prototype.deductCredits).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      const mockImageData = Buffer.from('mock-image-data');

      const response = await request(app)
        .post('/api/stickers/generate')
        .attach('image', mockImageData, 'test-image.jpg')
        .field('style', 'cartoon')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('Authentication required'),
        },
      });
    });
  });

  describe('GET /api/stickers/history', () => {
    it('should return user sticker history', async () => {
      // Mock database query (would be implemented with actual DB)
      const mockStickers = [
        {
          id: 'sticker-1',
          userId,
          style: 'cartoon',
          createdAt: new Date(),
          imageUrl: 'https://storage.googleapis.com/sticker-1.png',
        },
        {
          id: 'sticker-2',
          userId,
          style: 'anime',
          createdAt: new Date(),
          imageUrl: 'https://storage.googleapis.com/sticker-2.png',
        },
      ];

      const response = await request(app)
        .get('/api/stickers/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        stickers: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            style: expect.any(String),
            createdAt: expect.any(String),
            imageUrl: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/stickers/history')
        .query({ page: 2, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        stickers: expect.any(Array),
        pagination: {
          page: 2,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for sticker generation', async () => {
      const mockImageData = Buffer.from('mock-image-data');

      // Mock successful generation
      const mockPredictionClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      const mockPredict = jest.fn().mockResolvedValue([{
        predictions: [{
          bytesBase64Encoded: Buffer.from('mock-sticker').toString('base64'),
        }],
      }]);
      mockPredictionClient.mockImplementation(() => ({
        predict: mockPredict,
      }));

      // Make multiple rapid requests
      const requests = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/stickers/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', mockImageData, 'test-image.jpg')
          .field('style', 'cartoon')
      );

      const responses = await Promise.all(requests);

      // First 5 should succeed, 6th should be rate limited
      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(successfulResponses.length).toBeLessThanOrEqual(5);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body).toMatchObject({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: expect.stringContaining('Too many requests'),
          },
        });
      }
    });
  });
});