import { PlatformType } from '../core/whispering-interfaces';

/**
 * Performance metric types that can be tracked
 */
export enum MetricType {
  // Timing metrics
  RESPONSE_TIME = 'response_time',
  EXECUTION_TIME = 'execution_time',
  RENDER_TIME = 'render_time',
  
  // Resource metrics
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  STORAGE_USAGE = 'storage_usage',
  
  // Business metrics
  EVOLUTION_CYCLES = 'evolution_cycles',
  LEARNING_EVENTS = 'learning_events',
  WHISPER_DELIVERIES = 'whisper_deliveries',
  
  // Error metrics
  ERROR_RATE = 'error_rate',
  FAILURE_COUNT = 'failure_count',
  
  // User experience metrics
  INTERACTION_LATENCY = 'interaction_latency',
  SUGGESTION_QUALITY = 'suggestion_quality'
}

/**
 * Performance metric with metadata
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  platform: PlatformType;
  context: Record<string, unknown>;
  tags: string[];
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  action: 'log' | 'alert' | 'throttle' | 'disable';
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of metrics to collect
  retentionPeriod: number; // milliseconds
  thresholds: PerformanceThreshold[];
  alerting: boolean;
  exportMetrics: boolean;
}

/**
 * Performance alert when thresholds are exceeded
 */
export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: PerformanceThreshold;
  currentValue: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
  context: Record<string, unknown>;
}

/**
 * Comprehensive performance monitoring system for Sherlock Omega IDE
 * 
 * Tracks various metrics including:
 * - Response times and execution performance
 * - Resource usage (memory, CPU, storage)
 * - Business metrics (evolution cycles, learning events)
 * - Error rates and failure counts
 * - User experience metrics
 * 
 * Features:
 * - Configurable thresholds with alerts
 * - Metric aggregation and statistics
 * - Platform-specific optimizations
 * - Export capabilities for analysis
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor(PlatformType.WEB);
 * 
 * // Track a timing metric
 * monitor.recordMetric('api_call', 150, MetricType.RESPONSE_TIME);
 * 
 * // Get performance statistics
 * const avgResponseTime = monitor.getAverageMetric('api_call');
 * 
 * // Check for performance issues
 * const alerts = monitor.checkThresholds();
 * ```
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private config: PerformanceConfig;
  private platform: PlatformType;
  private alerts: PerformanceAlert[] = [];
  private startTime: Date;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(platform: PlatformType, config?: Partial<PerformanceConfig>) {
    this.platform = platform;
    this.startTime = new Date();
    
    this.config = {
      enabled: true,
      sampleRate: 1.0, // Collect all metrics by default
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      thresholds: this.getDefaultThresholds(),
      alerting: true,
      exportMetrics: false,
      ...config
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Records a performance metric
   * @param name - Metric name identifier
   * @param value - Metric value
   * @param type - Type of metric
   * @param context - Additional context data
   * @param tags - Tags for categorization
   */
  recordMetric(
    name: string, 
    value: number, 
    type: MetricType,
    context: Record<string, unknown> = {},
    tags: string[] = []
  ): void {
    if (!this.config.enabled) return;
    
    // Apply sampling if configured
    if (Math.random() > this.config.sampleRate) return;

    const metric: PerformanceMetric = {
      name,
      type,
      value,
      timestamp: new Date(),
      platform: this.platform,
      context,
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);

    // Check thresholds and generate alerts
    if (this.config.alerting) {
      this.checkThreshold(name, value);
    }

    // Cleanup old metrics if retention period exceeded
    this.cleanupOldMetrics(name);
  }

  /**
   * Records a timing metric with automatic start/stop
   * @param name - Metric name
   * @param fn - Function to time
   * @param context - Additional context
   * @returns The result of the function
   */
  async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, MetricType.EXECUTION_TIME, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, MetricType.EXECUTION_TIME, {
        ...context,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
      throw error;
    }
  }

  /**
   * Records a synchronous timing metric
   * @param name - Metric name
   * @param fn - Function to time
   * @param context - Additional context
   * @returns The result of the function
   */
  timeSync<T>(
    name: string, 
    fn: () => T,
    context: Record<string, unknown> = {}
  ): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, MetricType.EXECUTION_TIME, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, MetricType.EXECUTION_TIME, {
        ...context,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
      throw error;
    }
  }

  /**
   * Gets all metrics for a specific name
   * @param name - Metric name
   * @returns Array of metrics or empty array if none found
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Gets the average value for a metric
   * @param name - Metric name
   * @returns Average value or 0 if no metrics found
   */
  getAverageMetric(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, metric) => acc + metric.value, 0);
    return sum / values.length;
  }

  /**
   * Gets the median value for a metric
   * @param name - Metric name
   * @returns Median value or 0 if no metrics found
   */
  getMedianMetric(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    
    const sortedValues = values.map(m => m.value).sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    }
    return sortedValues[mid];
  }

  /**
   * Gets the 95th percentile for a metric
   * @param name - Metric name
   * @returns 95th percentile value or 0 if no metrics found
   */
  get95thPercentileMetric(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    
    const sortedValues = values.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil(sortedValues.length * 0.95) - 1;
    return sortedValues[index] || 0;
  }

  /**
   * Gets performance summary for all metrics
   * @returns Summary object with statistics
   */
  getPerformanceSummary(): Record<string, {
    count: number;
    average: number;
    median: number;
    p95: number;
    min: number;
    max: number;
    lastValue: number;
  }> {
    const summary: Record<string, any> = {};
    
    for (const [name, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      
      const values = metrics.map(m => m.value);
      const sortedValues = values.sort((a, b) => a - b);
      
      summary[name] = {
        count: metrics.length,
        average: this.getAverageMetric(name),
        median: this.getMedianMetric(name),
        p95: this.get95thPercentileMetric(name),
        min: sortedValues[0],
        max: sortedValues[sortedValues.length - 1],
        lastValue: metrics[metrics.length - 1].value
      };
    }
    
    return summary;
  }

  /**
   * Gets all active performance alerts
   * @returns Array of current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clears all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Exports metrics for external analysis
   * @param format - Export format
   * @returns Exported data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    
    return JSON.stringify({
      platform: this.platform,
      startTime: this.startTime,
      endTime: new Date(),
      metrics: Object.fromEntries(this.metrics),
      summary: this.getPerformanceSummary(),
      alerts: this.alerts
    }, null, 2);
  }

  /**
   * Resets all metrics and alerts
   */
  reset(): void {
    this.metrics.clear();
    this.alerts = [];
    this.startTime = new Date();
  }

  /**
   * Updates the monitoring configuration
   * @param updates - Partial configuration updates
   */
  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Gets the current configuration
   * @returns Current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Forces cleanup of old metrics (primarily for testing)
   */
  forceCleanup(): void {
    for (const [name] of this.metrics) {
      this.cleanupOldMetrics(name);
    }
  }

  /**
   * Stops the cleanup interval (for testing cleanup)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  private getDefaultThresholds(): PerformanceThreshold[] {
    return [
      {
        metric: 'response_time',
        warning: 1000, // 1 second
        critical: 5000, // 5 seconds
        action: 'log'
      },
      {
        metric: 'memory_usage',
        warning: 0.8, // 80%
        critical: 0.95, // 95%
        action: 'alert'
      },
      {
        metric: 'error_rate',
        warning: 0.05, // 5%
        critical: 0.1, // 10%
        action: 'throttle'
      }
    ];
  }

  private checkThreshold(metricName: string, value: number): void {
    const threshold = this.config.thresholds.find(t => t.metric === metricName);
    if (!threshold) return;

    let severity: 'warning' | 'critical' | null = null;
    
    if (value >= threshold.critical) {
      severity = 'critical';
    } else if (value >= threshold.warning) {
      severity = 'warning';
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: `${metricName}_${Date.now()}`,
        metric: metricName,
        threshold,
        currentValue: value,
        timestamp: new Date(),
        severity,
        context: { platform: this.platform }
      };

      this.alerts.push(alert);
      
      // Log the alert
      console.warn(`Performance ${severity}: ${metricName} = ${value} (threshold: ${threshold[severity]})`);
    }
  }

  private cleanupOldMetrics(metricName: string): void {
    const metrics = this.metrics.get(metricName);
    if (!metrics) return;

    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (filtered.length !== metrics.length) {
      this.metrics.set(metricName, filtered);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      for (const [name] of this.metrics) {
        this.cleanupOldMetrics(name);
      }
    }, 60000); // Clean up every minute
  }

  private exportToCSV(): string {
    const headers = ['name', 'type', 'value', 'timestamp', 'platform', 'context', 'tags'];
    const rows = [headers.join(',')];
    
    for (const metrics of this.metrics.values()) {
      for (const metric of metrics) {
        const row = [
          metric.name,
          metric.type,
          metric.value,
          metric.timestamp.toISOString(),
          metric.platform,
          JSON.stringify(metric.context),
          metric.tags.join(';')
        ].map(field => `"${field}"`).join(',');
        
        rows.push(row);
      }
    }
    
    return rows.join('\n');
  }
}
