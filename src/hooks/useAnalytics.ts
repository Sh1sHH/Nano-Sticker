import { useEffect, useRef } from 'react';
import { AnalyticsService } from '../services/analyticsService';

export const useAnalytics = () => {
  const analytics = AnalyticsService.getInstance();
  const screenStartTime = useRef<number>(Date.now());

  return {
    // Screen tracking
    trackScreenView: (screenName: string, metadata?: any) => {
      analytics.trackScreenView(screenName, metadata);
      screenStartTime.current = Date.now();
    },

    // User interaction tracking
    trackButtonPress: (buttonName: string, screenName: string, metadata?: any) => {
      analytics.trackButtonPress(buttonName, screenName, metadata);
    },

    trackFeatureUsage: (featureName: string, screenName: string, metadata?: any) => {
      analytics.trackFeatureUsage(featureName, screenName, metadata);
    },

    // Error tracking
    trackError: (error: string, screenName: string, metadata?: any) => {
      analytics.trackError(error, screenName, metadata);
    },

    // Business event tracking
    trackStickerGeneration: (style: string, processingTime: number, success: boolean) => {
      analytics.trackStickerGeneration(style, processingTime, success);
    },

    trackCreditPurchase: (amount: number, packageType: string, success: boolean) => {
      analytics.trackCreditPurchase(amount, packageType, success);
    },

    trackSharingAction: (platform: string, stickerCount: number) => {
      analytics.trackSharingAction(platform, stickerCount);
    },

    // Performance tracking
    trackLoadTime: (screenName: string) => {
      const loadTime = Date.now() - screenStartTime.current;
      analytics.trackLoadTime(screenName, loadTime);
    },

    trackAPIResponseTime: (endpoint: string, responseTime: number) => {
      analytics.trackAPIResponseTime(endpoint, responseTime);
    },

    trackImageProcessingTime: (operation: string, processingTime: number) => {
      analytics.trackImageProcessingTime(operation, processingTime);
    },

    // Data access
    getSessionSummary: () => analytics.getSessionSummary(),
    
    // Backend sync
    syncWithBackend: () => analytics.syncWithBackend(),
  };
};

// Hook for automatic screen tracking
export const useScreenTracking = (screenName: string, metadata?: any) => {
  const { trackScreenView, trackLoadTime } = useAnalytics();

  useEffect(() => {
    const startTime = Date.now();
    trackScreenView(screenName, metadata);

    return () => {
      const loadTime = Date.now() - startTime;
      trackLoadTime(screenName);
    };
  }, [screenName, trackScreenView, trackLoadTime]);
};

// Hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const analytics = AnalyticsService.getInstance();

  const measureAsync = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: string
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      analytics.trackPerformance(operationName, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      analytics.trackPerformance(`${operationName}_error`, duration, context);
      throw error;
    }
  };

  const measureSync = <T>(
    operation: () => T,
    operationName: string,
    context?: string
  ): T => {
    const startTime = Date.now();
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      analytics.trackPerformance(operationName, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      analytics.trackPerformance(`${operationName}_error`, duration, context);
      throw error;
    }
  };

  return {
    measureAsync,
    measureSync,
    trackPerformance: (metric: string, value: number, context?: string) => {
      analytics.trackPerformance(metric, value, context);
    },
  };
};