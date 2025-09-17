import { Request } from 'express';

export interface APIUsageMetric {
  id: string;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip: string;
  requestSize: number;
  responseSize: number;
  error?: string;
}

export interface AIUsageMetric {
  id: string;
  userId: string;
  model: string;
  operation: 'image_generation' | 'image_processing';
  inputTokens?: number;
  outputTokens?: number;
  processingTime: number;
  cost: number;
  success: boolean;
  timestamp: Date;
  metadata?: {
    imageSize?: { width: number; height: number };
    style?: string;
    retryCount?: number;
  };
}

export interface UserActivityMetric {
  id: string;
  userId: string;
  action: string;
  screen: string;
  timestamp: Date;
  sessionId: string;
  metadata?: any;
}

export interface SystemMetric {
  id: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private apiMetrics: APIUsageMetric[] = [];
  private aiMetrics: AIUsageMetric[] = [];
  private userMetrics: UserActivityMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private costThresholds = {
    daily: 100, // $100 per day
    monthly: 2000, // $2000 per month
    user: 50, // $50 per user per month
  };

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // API Usage Tracking
  public trackAPIUsage(req: Request, statusCode: number, responseTime: number, error?: string): void {
    const metric: APIUsageMetric = {
      id: this.generateId(),
      userId: (req as any).user?.id,
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode,
      responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      requestSize: this.getRequestSize(req),
      responseSize: 0, // Will be set by response middleware
      error,
    };

    this.apiMetrics.push(metric);
    this.checkAPIThresholds();
    
    // Log high-impact events
    if (statusCode >= 500 || responseTime > 5000) {
      console.warn('High-impact API event:', {
        endpoint: metric.endpoint,
        statusCode,
        responseTime,
        error,
      });
    }
  }

  // AI Usage Tracking
  public trackAIUsage(
    userId: string,
    model: string,
    operation: 'image_generation' | 'image_processing',
    processingTime: number,
    cost: number,
    success: boolean,
    metadata?: any
  ): void {
    const metric: AIUsageMetric = {
      id: this.generateId(),
      userId,
      model,
      operation,
      processingTime,
      cost,
      success,
      timestamp: new Date(),
      metadata,
    };

    this.aiMetrics.push(metric);
    this.checkCostThresholds(userId, cost);
    
    console.log('AI Usage tracked:', {
      userId,
      model,
      operation,
      cost: `$${cost.toFixed(4)}`,
      success,
      processingTime: `${processingTime}ms`,
    });
  }

  // User Activity Tracking
  public trackUserActivity(
    userId: string,
    action: string,
    screen: string,
    sessionId: string,
    metadata?: any
  ): void {
    const metric: UserActivityMetric = {
      id: this.generateId(),
      userId,
      action,
      screen,
      timestamp: new Date(),
      sessionId,
      metadata,
    };

    this.userMetrics.push(metric);
  }

  // System Metrics
  public trackSystemMetric(
    metric: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const systemMetric: SystemMetric = {
      id: this.generateId(),
      metric,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.systemMetrics.push(systemMetric);
  }

  // Analytics and Reporting
  public getAPIAnalytics(timeRange: { start: Date; end: Date }) {
    const filteredMetrics = this.apiMetrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    return {
      totalRequests: filteredMetrics.length,
      successRate: this.calculateSuccessRate(filteredMetrics),
      averageResponseTime: this.calculateAverageResponseTime(filteredMetrics),
      errorRate: this.calculateErrorRate(filteredMetrics),
      topEndpoints: this.getTopEndpoints(filteredMetrics),
      statusCodeDistribution: this.getStatusCodeDistribution(filteredMetrics),
      hourlyDistribution: this.getHourlyDistribution(filteredMetrics),
    };
  }

  public getAIAnalytics(timeRange: { start: Date; end: Date }) {
    const filteredMetrics = this.aiMetrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    return {
      totalOperations: filteredMetrics.length,
      totalCost: filteredMetrics.reduce((sum, m) => sum + m.cost, 0),
      averageCost: filteredMetrics.length > 0 
        ? filteredMetrics.reduce((sum, m) => sum + m.cost, 0) / filteredMetrics.length 
        : 0,
      successRate: filteredMetrics.length > 0 
        ? filteredMetrics.filter(m => m.success).length / filteredMetrics.length 
        : 0,
      averageProcessingTime: filteredMetrics.length > 0
        ? filteredMetrics.reduce((sum, m) => sum + m.processingTime, 0) / filteredMetrics.length
        : 0,
      operationDistribution: this.getOperationDistribution(filteredMetrics),
      modelUsage: this.getModelUsage(filteredMetrics),
      costByUser: this.getCostByUser(filteredMetrics),
    };
  }

  public getUserAnalytics(userId: string, timeRange: { start: Date; end: Date }) {
    const userActivities = this.userMetrics.filter(
      m => m.userId === userId && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    const userAIUsage = this.aiMetrics.filter(
      m => m.userId === userId && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    return {
      totalActions: userActivities.length,
      uniqueSessions: new Set(userActivities.map(m => m.sessionId)).size,
      screenTime: this.calculateScreenTime(userActivities),
      aiOperations: userAIUsage.length,
      aiCost: userAIUsage.reduce((sum, m) => sum + m.cost, 0),
      mostUsedScreens: this.getMostUsedScreens(userActivities),
      actionDistribution: this.getActionDistribution(userActivities),
    };
  }

  // Cost Monitoring
  public getDailyCost(date: Date = new Date()): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.aiMetrics
      .filter(m => m.timestamp >= startOfDay && m.timestamp <= endOfDay)
      .reduce((sum, m) => sum + m.cost, 0);
  }

  public getMonthlyCost(year: number, month: number): number {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return this.aiMetrics
      .filter(m => m.timestamp >= startOfMonth && m.timestamp <= endOfMonth)
      .reduce((sum, m) => sum + m.cost, 0);
  }

  public getUserMonthlyCost(userId: string, year: number, month: number): number {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return this.aiMetrics
      .filter(m => 
        m.userId === userId && 
        m.timestamp >= startOfMonth && 
        m.timestamp <= endOfMonth
      )
      .reduce((sum, m) => sum + m.cost, 0);
  }

  // Rate Limiting Support
  public getRequestCount(identifier: string, timeWindow: number): number {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.apiMetrics.filter(m => 
      (m.userId === identifier || m.ip === identifier) && 
      m.timestamp >= cutoff
    ).length;
  }

  // Alert System
  private checkAPIThresholds(): void {
    const recentMetrics = this.apiMetrics.filter(
      m => m.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    const errorRate = this.calculateErrorRate(recentMetrics);
    if (errorRate > 0.1) { // 10% error rate
      this.sendAlert('HIGH_ERROR_RATE', `Error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    const avgResponseTime = this.calculateAverageResponseTime(recentMetrics);
    if (avgResponseTime > 3000) { // 3 seconds
      this.sendAlert('HIGH_RESPONSE_TIME', `Average response time: ${avgResponseTime}ms`);
    }
  }

  private checkCostThresholds(userId: string, cost: number): void {
    const dailyCost = this.getDailyCost();
    if (dailyCost > this.costThresholds.daily) {
      this.sendAlert('DAILY_COST_EXCEEDED', `Daily cost: $${dailyCost.toFixed(2)}`);
    }

    const now = new Date();
    const monthlyCost = this.getMonthlyCost(now.getFullYear(), now.getMonth());
    if (monthlyCost > this.costThresholds.monthly) {
      this.sendAlert('MONTHLY_COST_EXCEEDED', `Monthly cost: $${monthlyCost.toFixed(2)}`);
    }

    const userMonthlyCost = this.getUserMonthlyCost(userId, now.getFullYear(), now.getMonth());
    if (userMonthlyCost > this.costThresholds.user) {
      this.sendAlert('USER_COST_EXCEEDED', `User ${userId} monthly cost: $${userMonthlyCost.toFixed(2)}`);
    }
  }

  private sendAlert(type: string, message: string): void {
    console.warn(`ALERT [${type}]: ${message}`);
    // Here you would integrate with alerting services like:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - SMS alerts
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRequestSize(req: Request): number {
    return JSON.stringify(req.body || {}).length + 
           JSON.stringify(req.query || {}).length + 
           JSON.stringify(req.params || {}).length;
  }

  private calculateSuccessRate(metrics: APIUsageMetric[]): number {
    if (metrics.length === 0) return 0;
    const successCount = metrics.filter(m => m.statusCode < 400).length;
    return successCount / metrics.length;
  }

  private calculateAverageResponseTime(metrics: APIUsageMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  }

  private calculateErrorRate(metrics: APIUsageMetric[]): number {
    if (metrics.length === 0) return 0;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    return errorCount / metrics.length;
  }

  private getTopEndpoints(metrics: APIUsageMetric[]): Array<{ endpoint: string; count: number }> {
    const endpointCounts = metrics.reduce((acc, m) => {
      acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getStatusCodeDistribution(metrics: APIUsageMetric[]): Record<string, number> {
    return metrics.reduce((acc, m) => {
      const statusGroup = `${Math.floor(m.statusCode / 100)}xx`;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getHourlyDistribution(metrics: APIUsageMetric[]): Record<string, number> {
    return metrics.reduce((acc, m) => {
      const hour = m.timestamp.getHours().toString().padStart(2, '0');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getOperationDistribution(metrics: AIUsageMetric[]): Record<string, number> {
    return metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getModelUsage(metrics: AIUsageMetric[]): Record<string, number> {
    return metrics.reduce((acc, m) => {
      acc[m.model] = (acc[m.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getCostByUser(metrics: AIUsageMetric[]): Array<{ userId: string; cost: number }> {
    const userCosts = metrics.reduce((acc, m) => {
      acc[m.userId] = (acc[m.userId] || 0) + m.cost;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCosts)
      .map(([userId, cost]) => ({ userId, cost }))
      .sort((a, b) => b.cost - a.cost);
  }

  private calculateScreenTime(activities: UserActivityMetric[]): Record<string, number> {
    // Simplified screen time calculation
    return activities.reduce((acc, activity) => {
      acc[activity.screen] = (acc[activity.screen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getMostUsedScreens(activities: UserActivityMetric[]): Array<{ screen: string; count: number }> {
    const screenCounts = activities.reduce((acc, activity) => {
      acc[activity.screen] = (acc[activity.screen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(screenCounts)
      .map(([screen, count]) => ({ screen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getActionDistribution(activities: UserActivityMetric[]): Record<string, number> {
    return activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}