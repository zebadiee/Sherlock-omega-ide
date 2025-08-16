/**
 * Monitoring Service - Integrates PerformanceMonitor with Sherlock Ω core system
 * 
 * This service acts as the bridge between the PerformanceMonitor and the broader
 * Sherlock Ω architecture, providing system-wide performance insights and alerts.
 */

import { PerformanceMonitor, MetricType, PerformanceAlert } from './performance-monitor';
import { PlatformType, PerformanceState } from '../core/whispering-interfaces';
import { SensorInterface } from '../core/interfaces';
import { 
  SensorResult, 
  SensorStatus, 
  ComputationalIssue, 
  ProblemType, 
  SeverityLevel,
  ProblemContext,
  ProblemMetadata 
} from '../types/core';

export interface MonitoringConfig {
  enabled: boolean;
  platform: PlatformType;
  alertThresholds: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
  reportingInterval: number; // milliseconds
}

/**
 * System-wide monitoring service that integrates performance monitoring
 * with the Sherlock Ω self-healing architecture
 */
export class MonitoringService implements SensorInterface {
  public performanceMonitor: PerformanceMonitor; // Made public for testing
  private config: MonitoringConfig;
  private isRunning = false;
  private reportingInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.performanceMonitor = new PerformanceMonitor(config.platform, {
      enabled: config.enabled,
      alerting: true,
      thresholds: [
        {
          metric: 'response_time',
          warning: config.alertThresholds.responseTime,
          critical: config.alertThresholds.responseTime * 2,
          action: 'alert'
        },
        {
          metric: 'memory_usage',
          warning: config.alertThresholds.memoryUsage,
          critical: config.alertThresholds.memoryUsage * 1.2,
          action: 'alert'
        },
        {
          metric: 'error_rate',
          warning: config.alertThresholds.errorRate,
          critical: config.alertThresholds.errorRate * 2,
          action: 'throttle'
        }
      ]
    });
  }

  /**
   * Implements SensorInterface - monitors system performance
   */
  async monitor(): Promise<SensorResult> {
    const performanceState = this.getPerformanceState();
    const alerts = this.performanceMonitor.getAlerts();
    
    return {
      sensorId: 'monitoring-service',
      timestamp: new Date(),
      status: alerts.length > 0 ? SensorStatus.ERROR : SensorStatus.ACTIVE,
      data: {
        performance: performanceState,
        alerts: alerts,
        summary: this.performanceMonitor.getPerformanceSummary(),
        platform: this.config.platform,
        monitoringEnabled: this.config.enabled
      },
      issues: this.convertAlertsToIssues(alerts),
      confidence: this.calculateConfidence(performanceState, alerts)
    };
  }

  getType(): string {
    return 'MonitoringService';
  }

  isActive(): boolean {
    return this.isRunning;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start periodic reporting
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.reportingInterval);
    
    console.log(`MonitoringService started for ${this.config.platform}`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = undefined;
    }
    
    // Stop the PerformanceMonitor cleanup interval
    this.performanceMonitor.stopCleanupInterval();
    console.log('MonitoringService stopped');
  }

  /**
   * Records a performance metric through the integrated monitor
   */
  recordMetric(name: string, value: number, type: MetricType, context?: Record<string, unknown>): void {
    this.performanceMonitor.recordMetric(name, value, type, context);
  }

  /**
   * Times an async operation and records the metric
   */
  async timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    return this.performanceMonitor.timeAsync(name, operation);
  }

  /**
   * Gets current performance state for system integration
   */
  getPerformanceState(): PerformanceState {
    const summary = this.performanceMonitor.getPerformanceSummary();
    const alerts = this.performanceMonitor.getAlerts();
    
    // Check for different metric name variations
    const responseTimeMetric = summary.response_time || summary.test_metric || summary.async_test;
    const memoryMetric = summary.memory_usage;
    const cpuMetric = summary.cpu_usage;
    
    return {
      responseTime: responseTimeMetric?.average || 0,
      memoryUsage: memoryMetric?.average || 0,
      cpuUsage: cpuMetric?.average || 0,
      activeAlerts: alerts.length,
      healthScore: this.calculateHealthScore(summary, alerts)
    };
  }

  /**
   * Gets critical performance alerts that require immediate attention
   */
  getCriticalAlerts(): PerformanceAlert[] {
    return this.performanceMonitor.getAlerts()
      .filter(alert => alert.severity === 'critical');
  }

  /**
   * Exports performance data for analysis or debugging
   */
  exportPerformanceData(format: 'json' | 'csv' = 'json'): string {
    return this.performanceMonitor.exportMetrics(format);
  }

  /**
   * Resets all performance data (useful for testing or fresh starts)
   */
  reset(): void {
    this.performanceMonitor.reset();
  }

  /**
   * Updates monitoring configuration
   */
  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update performance monitor config
    this.performanceMonitor.updateConfig({
      enabled: this.config.enabled
    });
  }

  private calculateHealthScore(summary: any, alerts: PerformanceAlert[]): number {
    let score = 1.0;
    
    // Reduce score based on critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
    
    score -= (criticalAlerts * 0.3);
    score -= (warningAlerts * 0.1);
    
    // Factor in response time performance
    const avgResponseTime = summary.response_time?.average || 0;
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      score -= 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateConfidence(performance: PerformanceState, alerts: PerformanceAlert[]): number {
    // High confidence when system is healthy
    if (performance.healthScore > 0.8 && alerts.length === 0) {
      return 0.95;
    }
    
    // Medium confidence with minor issues
    if (performance.healthScore > 0.6) {
      return 0.75;
    }
    
    // Lower confidence with significant issues
    return 0.5;
  }

  private convertAlertsToIssues(alerts: PerformanceAlert[]): ComputationalIssue[] {
    return alerts.map(alert => ({
      id: alert.id,
      type: ProblemType.PERFORMANCE_ISSUE,
      severity: alert.severity === 'critical' ? SeverityLevel.CRITICAL : SeverityLevel.HIGH,
      context: {
        file: 'system',
        line: 0,
        column: 0,
        module: 'monitoring-service'
      } as ProblemContext,
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: alert.timestamp,
        detectedBy: 'monitoring-service',
        confidence: 0.9,
        relatedIssues: []
      } as ProblemMetadata
    }));
  }

  private async generatePerformanceReport(): Promise<void> {
    const state = this.getPerformanceState();
    const alerts = this.getCriticalAlerts();
    
    if (alerts.length > 0) {
      console.warn(`Performance Report: ${alerts.length} critical alerts detected`);
      console.warn(`Health Score: ${(state.healthScore * 100).toFixed(1)}%`);
    }
    
    // In a real implementation, this would integrate with the broader
    // Sherlock Ω system to trigger self-healing actions
  }
}