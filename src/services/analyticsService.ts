import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserActivity {
  action: string;
  screen: string;
  timestamp: Date;
  metadata?: any;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  timestamp: Date;
  context?: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId?: string;
  private activities: UserActivity[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private apiBaseUrl: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.loadStoredData();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public clearUserId(): void {
    this.userId = undefined;
  }

  // User Activity Tracking
  public trackScreenView(screenName: string, metadata?: any): void {
    this.trackActivity('screen_view', screenName, metadata);
  }

  public trackButtonPress(buttonName: string, screenName: string, metadata?: any): void {
    this.trackActivity('button_press', screenName, { buttonName, ...metadata });
  }

  public trackFeatureUsage(featureName: string, screenName: string, metadata?: any): void {
    this.trackActivity('feature_usage', screenName, { featureName, ...metadata });
  }

  public trackError(error: string, screenName: string, metadata?: any): void {
    this.trackActivity('error', screenName, { error, ...metadata });
  }

  public trackStickerGeneration(style: string, processingTime: number, success: boolean): void {
    this.trackActivity('sticker_generation', 'processing', {
      style,
      processingTime,
      success,
    });
  }

  public trackCreditPurchase(amount: number, packageType: string, success: boolean): void {
    this.trackActivity('credit_purchase', 'credit_purchase', {
      amount,
      packageType,
      success,
    });
  }

  public trackSharingAction(platform: string, stickerCount: number): void {
    this.trackActivity('sharing', 'export', {
      platform,
      stickerCount,
    });
  }

  private trackActivity(action: string, screen: string, metadata?: any): void {
    const activity: UserActivity = {
      action,
      screen,
      timestamp: new Date(),
      metadata,
    };

    this.activities.push(activity);
    this.persistActivity(activity);

    // Send to backend if user is authenticated
    if (this.userId) {
      this.sendActivityToBackend(activity);
    }
  }

  // Performance Tracking
  public trackPerformance(metric: string, value: number, context?: string): void {
    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      timestamp: new Date(),
      context,
    };

    this.performanceMetrics.push(performanceMetric);
    this.persistPerformanceMetric(performanceMetric);
  }

  public trackLoadTime(screen: string, loadTime: number): void {
    this.trackPerformance('screen_load_time', loadTime, screen);
  }

  public trackAPIResponseTime(endpoint: string, responseTime: number): void {
    this.trackPerformance('api_response_time', responseTime, endpoint);
  }

  public trackImageProcessingTime(operation: string, processingTime: number): void {
    this.trackPerformance('image_processing_time', processingTime, operation);
  }

  public trackMemoryUsage(usage: number, context?: string): void {
    this.trackPerformance('memory_usage', usage, context);
  }

  // Analytics Data Retrieval
  public getLocalActivities(timeRange?: { start: Date; end: Date }): UserActivity[] {
    let filteredActivities = this.activities;

    if (timeRange) {
      filteredActivities = this.activities.filter(
        activity => activity.timestamp >= timeRange.start && activity.timestamp <= timeRange.end
      );
    }

    return filteredActivities;
  }

  public getLocalPerformanceMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetric[] {
    let filteredMetrics = this.performanceMetrics;

    if (timeRange) {
      filteredMetrics = this.performanceMetrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    return filteredMetrics;
  }

  public getSessionSummary(): {
    sessionId: string;
    duration: number;
    screenViews: number;
    buttonPresses: number;
    errors: number;
    averageLoadTime: number;
  } {
    const sessionActivities = this.activities.filter(
      activity => activity.timestamp >= this.getSessionStartTime()
    );

    const screenViews = sessionActivities.filter(a => a.action === 'screen_view').length;
    const buttonPresses = sessionActivities.filter(a => a.action === 'button_press').length;
    const errors = sessionActivities.filter(a => a.action === 'error').length;

    const loadTimes = this.performanceMetrics
      .filter(m => m.metric === 'screen_load_time')
      .map(m => m.value);
    
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.getSessionStartTime().getTime(),
      screenViews,
      buttonPresses,
      errors,
      averageLoadTime,
    };
  }

  // Backend Integration
  private async sendActivityToBackend(activity: UserActivity): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          action: activity.action,
          screen: activity.screen,
          sessionId: this.sessionId,
          metadata: activity.metadata,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send activity to backend:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending activity to backend:', error);
    }
  }

  public async syncWithBackend(): Promise<void> {
    if (!this.userId) {
      console.warn('Cannot sync with backend: user not authenticated');
      return;
    }

    // Send any pending activities
    const pendingActivities = await this.getPendingActivities();
    for (const activity of pendingActivities) {
      await this.sendActivityToBackend(activity);
    }

    // Clear pending activities after successful sync
    await this.clearPendingActivities();
  }

  // Data Persistence
  private async persistActivity(activity: UserActivity): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_activities');
      const activities = stored ? JSON.parse(stored) : [];
      activities.push(activity);
      
      // Keep only last 1000 activities to prevent storage bloat
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }
      
      await AsyncStorage.setItem('analytics_activities', JSON.stringify(activities));
    } catch (error) {
      console.warn('Failed to persist activity:', error);
    }
  }

  private async persistPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_performance');
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 500 metrics
      if (metrics.length > 500) {
        metrics.splice(0, metrics.length - 500);
      }
      
      await AsyncStorage.setItem('analytics_performance', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to persist performance metric:', error);
    }
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [activitiesData, performanceData] = await Promise.all([
        AsyncStorage.getItem('analytics_activities'),
        AsyncStorage.getItem('analytics_performance'),
      ]);

      if (activitiesData) {
        this.activities = JSON.parse(activitiesData).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
      }

      if (performanceData) {
        this.performanceMetrics = JSON.parse(performanceData).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load stored analytics data:', error);
    }
  }

  private async getPendingActivities(): Promise<UserActivity[]> {
    try {
      const stored = await AsyncStorage.getItem('analytics_pending');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get pending activities:', error);
      return [];
    }
  }

  private async clearPendingActivities(): Promise<void> {
    try {
      await AsyncStorage.removeItem('analytics_pending');
    } catch (error) {
      console.warn('Failed to clear pending activities:', error);
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  // Helper Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionStartTime(): Date {
    // For simplicity, using app start time as session start
    // In a real app, you might want to track actual session boundaries
    return new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago as fallback
  }

  // Cleanup
  public async clearLocalData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('analytics_activities'),
        AsyncStorage.removeItem('analytics_performance'),
        AsyncStorage.removeItem('analytics_pending'),
      ]);
      
      this.activities = [];
      this.performanceMetrics = [];
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }
}