import { renderHook, act } from '@testing-library/react-hooks';
import { useAnalytics, useScreenTracking, usePerformanceMonitoring } from '../useAnalytics';
import { AnalyticsService } from '../../services/analyticsService';

// Mock AnalyticsService
jest.mock('../../services/analyticsService');

describe('useAnalytics', () => {
  let mockAnalytics: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    mockAnalytics = {
      trackScreenView: jest.fn(),
      trackButtonPress: jest.fn(),
      trackFeatureUsage: jest.fn(),
      trackError: jest.fn(),
      trackStickerGeneration: jest.fn(),
      trackCreditPurchase: jest.fn(),
      trackSharingAction: jest.fn(),
      trackLoadTime: jest.fn(),
      trackAPIResponseTime: jest.fn(),
      trackImageProcessingTime: jest.fn(),
      getSessionSummary: jest.fn(),
      syncWithBackend: jest.fn(),
    } as any;

    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
  });

  it('provides screen tracking functions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackScreenView('home', { source: 'navigation' });
    });

    expect(mockAnalytics.trackScreenView).toHaveBeenCalledWith('home', { source: 'navigation' });
  });

  it('provides user interaction tracking functions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackButtonPress('generate', 'home', { style: 'cartoon' });
    });

    expect(mockAnalytics.trackButtonPress).toHaveBeenCalledWith('generate', 'home', { style: 'cartoon' });
  });

  it('provides feature usage tracking', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFeatureUsage('ai_generation', 'processing', { model: 'imagen-2' });
    });

    expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith('ai_generation', 'processing', { model: 'imagen-2' });
  });

  it('provides error tracking', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackError('Network timeout', 'processing', { endpoint: '/api/generate' });
    });

    expect(mockAnalytics.trackError).toHaveBeenCalledWith('Network timeout', 'processing', { endpoint: '/api/generate' });
  });

  it('provides business event tracking', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackStickerGeneration('cartoon', 2500, true);
      result.current.trackCreditPurchase(100, 'premium', true);
      result.current.trackSharingAction('whatsapp', 5);
    });

    expect(mockAnalytics.trackStickerGeneration).toHaveBeenCalledWith('cartoon', 2500, true);
    expect(mockAnalytics.trackCreditPurchase).toHaveBeenCalledWith(100, 'premium', true);
    expect(mockAnalytics.trackSharingAction).toHaveBeenCalledWith('whatsapp', 5);
  });

  it('provides performance tracking', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackLoadTime('home');
      result.current.trackAPIResponseTime('/api/generate', 150);
      result.current.trackImageProcessingTime('segmentation', 1500);
    });

    expect(mockAnalytics.trackLoadTime).toHaveBeenCalledWith('home', expect.any(Number));
    expect(mockAnalytics.trackAPIResponseTime).toHaveBeenCalledWith('/api/generate', 150);
    expect(mockAnalytics.trackImageProcessingTime).toHaveBeenCalledWith('segmentation', 1500);
  });

  it('provides data access functions', () => {
    const { result } = renderHook(() => useAnalytics());
    const mockSummary = { sessionId: 'test', screenViews: 5 };
    mockAnalytics.getSessionSummary.mockReturnValue(mockSummary as any);

    const summary = result.current.getSessionSummary();

    expect(summary).toBe(mockSummary);
    expect(mockAnalytics.getSessionSummary).toHaveBeenCalled();
  });

  it('provides backend sync function', async () => {
    const { result } = renderHook(() => useAnalytics());
    mockAnalytics.syncWithBackend.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.syncWithBackend();
    });

    expect(mockAnalytics.syncWithBackend).toHaveBeenCalled();
  });
});

describe('useScreenTracking', () => {
  let mockAnalytics: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    mockAnalytics = {
      trackScreenView: jest.fn(),
      trackLoadTime: jest.fn(),
    } as any;

    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
  });

  it('tracks screen view on mount', () => {
    renderHook(() => useScreenTracking('home', { source: 'navigation' }));

    expect(mockAnalytics.trackScreenView).toHaveBeenCalledWith('home', { source: 'navigation' });
  });

  it('tracks load time on unmount', () => {
    const { unmount } = renderHook(() => useScreenTracking('home'));

    unmount();

    expect(mockAnalytics.trackLoadTime).toHaveBeenCalledWith('home', expect.any(Number));
  });

  it('tracks new screen when screen name changes', () => {
    const { rerender } = renderHook(
      ({ screenName }) => useScreenTracking(screenName),
      { initialProps: { screenName: 'home' } }
    );

    expect(mockAnalytics.trackScreenView).toHaveBeenCalledWith('home', undefined);

    rerender({ screenName: 'processing' });

    expect(mockAnalytics.trackScreenView).toHaveBeenCalledWith('processing', undefined);
    expect(mockAnalytics.trackScreenView).toHaveBeenCalledTimes(2);
  });
});

describe('usePerformanceMonitoring', () => {
  let mockAnalytics: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    mockAnalytics = {
      trackPerformance: jest.fn(),
    } as any;

    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalytics);
  });

  it('measures async operations', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const asyncOperation = jest.fn().mockResolvedValue('success');

    const operationResult = await act(async () => {
      return await result.current.measureAsync(asyncOperation, 'test_operation', 'test_context');
    });

    expect(operationResult).toBe('success');
    expect(asyncOperation).toHaveBeenCalled();
    expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
      'test_operation',
      expect.any(Number),
      'test_context'
    );
  });

  it('measures async operations that throw errors', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const asyncOperation = jest.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      try {
        await result.current.measureAsync(asyncOperation, 'test_operation', 'test_context');
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    expect(asyncOperation).toHaveBeenCalled();
    expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
      'test_operation_error',
      expect.any(Number),
      'test_context'
    );
  });

  it('measures synchronous operations', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const syncOperation = jest.fn().mockReturnValue('success');

    const operationResult = act(() => {
      return result.current.measureSync(syncOperation, 'test_operation', 'test_context');
    });

    expect(operationResult).toBe('success');
    expect(syncOperation).toHaveBeenCalled();
    expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
      'test_operation',
      expect.any(Number),
      'test_context'
    );
  });

  it('measures synchronous operations that throw errors', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    const syncOperation = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    act(() => {
      try {
        result.current.measureSync(syncOperation, 'test_operation', 'test_context');
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    expect(syncOperation).toHaveBeenCalled();
    expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
      'test_operation_error',
      expect.any(Number),
      'test_context'
    );
  });

  it('provides direct performance tracking', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    act(() => {
      result.current.trackPerformance('custom_metric', 500, 'custom_context');
    });

    expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith('custom_metric', 500, 'custom_context');
  });
});