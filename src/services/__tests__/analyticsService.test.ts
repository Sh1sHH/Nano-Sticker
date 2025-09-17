import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from '../analyticsService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = AnalyticsService.getInstance();
    (analytics as any).activities = [];
    (analytics as any).performanceMetrics = [];
  });

  describe('User Activity Tracking', () => {
    it('tracks screen views', () => {
      analytics.trackScreenView('home', { source: 'navigation' });

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'screen_view',
        screen: 'home',
        metadata: { source: 'navigation' },
      });
    });

    it('tracks button presses', () => {
      analytics.trackButtonPress('generate', 'home', { style: 'cartoon' });

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'button_press',
        screen: 'home',
        metadata: { buttonName: 'generate', style: 'cartoon' },
      });
    });

    it('tracks feature usage', () => {
      analytics.trackFeatureUsage('ai_generation', 'processing', { model: 'imagen-2' });

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'feature_usage',
        screen: 'processing',
        metadata: { featureName: 'ai_generation', model: 'imagen-2' },
      });
    });

    it('tracks errors', () => {
      analytics.trackError('Network timeout', 'processing', { endpoint: '/api/generate' });

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'error',
        screen: 'processing',
        metadata: { error: 'Network timeout', endpoint: '/api/generate' },
      });
    });

    it('tracks sticker generation', () => {
      analytics.trackStickerGeneration('cartoon', 2500, true);

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'sticker_generation',
        screen: 'processing',
        metadata: { style: 'cartoon', processingTime: 2500, success: true },
      });
    });

    it('tracks credit purchases', () => {
      analytics.trackCreditPurchase(100, 'premium', true);

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'credit_purchase',
        screen: 'credit_purchase',
        metadata: { amount: 100, packageType: 'premium', success: true },
      });
    });

    it('tracks sharing actions', () => {
      analytics.trackSharingAction('whatsapp', 5);

      const activities = (analytics as any).activities;
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        action: 'sharing',
        screen: 'export',
        metadata: { platform: 'whatsapp', stickerCount: 5 },
      });
    });
  });

  describe('Performance Tracking', () => {
    it('tracks performance metrics', () => {
      analytics.trackPerformance('api_response_time', 150, '/api/generate');

      const metrics = (analytics as any).performanceMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'api_response_time',
        value: 150,
        context: '/api/generate',
      });
    });

    it('tracks load times', () => {
      analytics.trackLoadTime('home', 800);

      const metrics = (analytics as any).performanceMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'screen_load_time',
        value: 800,
        context: 'home',
      });
    });

    it('tracks API response times', () => {
      analytics.trackAPIResponseTime('/api/credits', 200);

      const metrics = (analytics as any).performanceMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'api_response_time',
        value: 200,
        context: '/api/credits',
      });
    });

    it('tracks image processing times', () => {
      analytics.trackImageProcessingTime('segmentation', 1500);

      const metrics = (analytics as any).performanceMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'image_processing_time',
        value: 1500,
        context: 'segmentation',
      });
    });

    it('tracks memory usage', () => {
      analytics.trackMemoryUsage(512, 'image_processing');

      const metrics = (analytics as any).performanceMetrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        metric: 'memory_usage',
        value: 512,
        context: 'image_processing',
      });
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      (analytics as any).activities = [
        { action: 'screen_view', screen: 'home', timestamp: twoHoursAgo },
        { action: 'button_press', screen: 'home', timestamp: oneHourAgo },
        { action: 'screen_view', screen: 'processing', timestamp: now },
      ];

      (analytics as any).performanceMetrics = [
        { metric: 'load_time', value: 800, timestamp: twoHoursAgo },
        { metric: 'api_time', value: 150, timestamp: oneHourAgo },
        { metric: 'load_time', value: 600, timestamp: now },
      ];
    });

    it('gets all local activities when no time range specified', () => {
      const activities = analytics.getLocalActivities();
      expect(activities).toHaveLength(3);
    });

    it('filters activities by time range', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const now = new Date();
      
      const activities = analytics.getLocalActivities({ start: oneHourAgo, end: now });
      expect(activities).toHaveLength(2); // Should exclude the 2-hour-old activity
    });

    it('gets all performance metrics when no time range specified', () => {
      const metrics = analytics.getLocalPerformanceMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('filters performance metrics by time range', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const now = new Date();
      
      const metrics = analytics.getLocalPerformanceMetrics({ start: oneHourAgo, end: now });
      expect(metrics).toHaveLength(2);
    });
  });

  describe('Session Summary', () => {
    beforeEach(() => {
      const now = new Date();
      (analytics as any).activities = [
        { action: 'screen_view', screen: 'home', timestamp: now },
        { action: 'screen_view', screen: 'processing', timestamp: now },
        { action: 'button_press', screen: 'home', timestamp: now },
        { action: 'button_press', screen: 'processing', timestamp: now },
        { action: 'error', screen: 'processing', timestamp: now },
      ];

      (analytics as any).performanceMetrics = [
        { metric: 'screen_load_time', value: 800, timestamp: now },
        { metric: 'screen_load_time', value: 600, timestamp: now },
        { metric: 'api_response_time', value: 150, timestamp: now },
      ];
    });

    it('calculates session summary correctly', () => {
      const summary = analytics.getSessionSummary();

      expect(summary.screenViews).toBe(2);
      expect(summary.buttonPresses).toBe(2);
      expect(summary.errors).toBe(1);
      expect(summary.averageLoadTime).toBe(700); // (800 + 600) / 2
      expect(summary.sessionId).toBeDefined();
      expect(summary.duration).toBeGreaterThan(0);
    });
  });

  describe('Backend Integration', () => {
    beforeEach(() => {
      analytics.setUserId('user123');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    });

    it('sends activity to backend when user is authenticated', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      analytics.trackScreenView('home');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/activity'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: expect.stringContaining('"action":"screen_view"'),
        })
      );
    });

    it('handles backend errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      });

      analytics.trackScreenView('home');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send activity to backend:',
        'Server Error'
      );

      consoleSpy.mockRestore();
    });

    it('handles network errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      analytics.trackScreenView('home');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending activity to backend:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('persists activities to AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      analytics.trackScreenView('home');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics_activities',
        expect.stringContaining('"action":"screen_view"')
      );
    });

    it('persists performance metrics to AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      analytics.trackPerformance('test_metric', 100);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics_performance',
        expect.stringContaining('"metric":"test_metric"')
      );
    });

    it('limits stored activities to prevent storage bloat', async () => {
      const existingActivities = Array.from({ length: 1000 }, (_, i) => ({
        action: 'test',
        screen: 'test',
        timestamp: new Date(),
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingActivities));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      analytics.trackScreenView('home');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData).toHaveLength(1000); // Should maintain limit
    });
  });

  describe('Data Cleanup', () => {
    it('clears local data', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await analytics.clearLocalData();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('analytics_activities');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('analytics_performance');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('analytics_pending');

      expect((analytics as any).activities).toHaveLength(0);
      expect((analytics as any).performanceMetrics).toHaveLength(0);
    });
  });
});