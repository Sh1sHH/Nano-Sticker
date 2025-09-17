import request from 'supertest';
import { performance } from 'perf_hooks';
import { app } from '../../server';

// Mock external services for load testing
jest.mock('../../services/CreditManagementService');
jest.mock('../../services/AuthenticationService');
jest.mock('@google-cloud/aiplatform');

describe('API Load Tests', () => {
  let authToken: string;

  beforeAll(() => {
    // Setup mock authentication
    authToken = 'load-test-token';
    
    jest.spyOn(require('../../middleware/auth'), 'authenticateToken')
      .mockImplementation((req, res, next) => {
        req.user = { userId: 'load-test-user', email: 'load@test.com' };
        next();
      });

    // Mock credit management
    const { CreditManagementService } = require('../../services/CreditManagementService');
    CreditManagementService.prototype.checkUserCredits = jest.fn().mockResolvedValue(100);
    CreditManagementService.prototype.deductCredits = jest.fn().mockResolvedValue(true);
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent authentication requests', async () => {
      const concurrentRequests = 50;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (10 seconds for 50 requests)
      expect(totalTime).toBeLessThan(10000);

      // Calculate average response time
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(200); // 200ms average
    });

    it('should handle concurrent credit check requests', async () => {
      const concurrentRequests = 30;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/credits/balance')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.credits).toBeDefined();
      });

      // Should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle concurrent sticker generation requests', async () => {
      // Mock AI service for load testing
      const mockPredictionClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      const mockPredict = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve([{
              predictions: [{
                bytesBase64Encoded: Buffer.from('mock-sticker').toString('base64'),
              }],
            }]);
          }, 100); // Simulate 100ms AI processing time
        })
      );
      mockPredictionClient.mockImplementation(() => ({
        predict: mockPredict,
      }));

      const concurrentRequests = 10; // Lower for AI requests
      const mockImageData = Buffer.from('mock-image-data');

      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/api/stickers/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', mockImageData, 'test-image.jpg')
          .field('style', 'cartoon')
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Most requests should succeed (some may be rate limited)
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(5);

      // Should complete within 15 seconds (accounting for AI processing)
      expect(totalTime).toBeLessThan(15000);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle large file uploads efficiently', async () => {
      const largeImageData = Buffer.alloc(8 * 1024 * 1024); // 8MB file
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/stickers/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeImageData, 'large-image.jpg')
        .field('style', 'anime');

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle large files (may reject due to size limits)
      expect([200, 400, 413]).toContain(response.status);

      // Should respond within reasonable time even for large files
      expect(processingTime).toBeLessThan(5000);
    });

    it('should maintain performance under sustained load', async () => {
      const batchSize = 20;
      const batches = 3;
      const responseTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchStartTime = performance.now();

        const requests = Array.from({ length: batchSize }, () =>
          request(app)
            .get('/api/credits/balance')
            .set('Authorization', `Bearer ${authToken}`)
        );

        await Promise.all(requests);

        const batchEndTime = performance.now();
        const batchTime = batchEndTime - batchStartTime;
        responseTimes.push(batchTime);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Response times should remain consistent (no significant degradation)
      const firstBatchTime = responseTimes[0];
      const lastBatchTime = responseTimes[responseTimes.length - 1];
      
      // Last batch shouldn't be more than 50% slower than first
      expect(lastBatchTime).toBeLessThan(firstBatchTime * 1.5);
    });
  });

  describe('Database Connection Handling', () => {
    it('should handle multiple database queries efficiently', async () => {
      const concurrentQueries = 25;
      
      const requests = Array.from({ length: concurrentQueries }, (_, i) =>
        request(app)
          .get(`/api/stickers/history?page=${i % 5 + 1}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All database queries should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });

    it('should handle database connection pool limits gracefully', async () => {
      // Simulate high database load
      const highLoadRequests = 100;
      
      const requests = Array.from({ length: highLoadRequests }, () =>
        request(app)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // Should not have any 500 errors due to connection pool exhaustion
      const serverErrors = responses.filter(r => r.status === 500);
      expect(serverErrors.length).toBe(0);

      // Most requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(highLoadRequests * 0.8);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without performance degradation', async () => {
      const rapidRequests = 60; // Exceed rate limit
      
      const requests = Array.from({ length: rapidRequests }, () =>
        request(app)
          .post('/api/stickers/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('test'), 'test.jpg')
          .field('style', 'cartoon')
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should have mix of successful and rate-limited responses
      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limiting should not cause significant delays
      expect(totalTime).toBeLessThan(10000);

      // Rate limited responses should be fast
      const avgResponseTime = totalTime / rapidRequests;
      expect(avgResponseTime).toBeLessThan(200);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under high load', async () => {
      // Mock some requests to fail
      const originalCheckCredits = require('../../services/CreditManagementService')
        .CreditManagementService.prototype.checkUserCredits;
      
      let callCount = 0;
      require('../../services/CreditManagementService')
        .CreditManagementService.prototype.checkUserCredits = jest.fn()
        .mockImplementation(() => {
          callCount++;
          if (callCount % 3 === 0) {
            throw new Error('Database connection error');
          }
          return Promise.resolve(10);
        });

      const requests = Array.from({ length: 30 }, () =>
        request(app)
          .get('/api/credits/balance')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // Should have mix of successful and error responses
      const successfulResponses = responses.filter(r => r.status === 200);
      const errorResponses = responses.filter(r => r.status === 500);
      
      expect(successfulResponses.length).toBeGreaterThan(15);
      expect(errorResponses.length).toBeGreaterThan(5);

      // Error responses should be properly formatted
      errorResponses.forEach(response => {
        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String),
          }),
        });
      });

      // Restore original implementation
      require('../../services/CreditManagementService')
        .CreditManagementService.prototype.checkUserCredits = originalCheckCredits;
    });
  });
});