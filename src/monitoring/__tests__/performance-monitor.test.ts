import { PerformanceMonitor, MetricType } from '../performance-monitor';
import { PlatformType } from '../../core/whispering-interfaces';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  const monitors: PerformanceMonitor[] = [];

  beforeEach(() => {
    monitor = new PerformanceMonitor(PlatformType.WEB);
    monitors.push(monitor);
  });

  afterEach(() => {
    // Clean up all monitor intervals to prevent Jest from hanging
    monitors.forEach(m => m.stopCleanupInterval());
    monitors.length = 0; // Clear the array
  });

  afterAll(() => {
    // Final safety net to clear any remaining timers
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create an instance with default configuration', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
      expect(monitor.getConfig().enabled).toBe(true);
      expect(monitor.getConfig().sampleRate).toBe(1.0);
    });

    it('should accept custom configuration', () => {
      const customMonitor = new PerformanceMonitor(PlatformType.WEB, {
        enabled: false,
        sampleRate: 0.5
      });
      monitors.push(customMonitor); // Track for cleanup
      
      expect(customMonitor.getConfig().enabled).toBe(false);
      expect(customMonitor.getConfig().sampleRate).toBe(0.5);
    });
  });

  describe('recordMetric', () => {
    it('should record metrics when enabled', () => {
      monitor.recordMetric('test_metric', 100, MetricType.RESPONSE_TIME);
      
      const metrics = monitor.getMetrics('test_metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].type).toBe(MetricType.RESPONSE_TIME);
    });

    it('should not record metrics when disabled', () => {
      monitor.updateConfig({ enabled: false });
      monitor.recordMetric('test_metric', 100, MetricType.RESPONSE_TIME);
      
      const metrics = monitor.getMetrics('test_metric');
      expect(metrics).toHaveLength(0);
    });

    it('should apply sampling when configured', () => {
      monitor.updateConfig({ sampleRate: 0.5 });
      
      // Record many metrics
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric('sampled_metric', i, MetricType.RESPONSE_TIME);
      }
      
      const metrics = monitor.getMetrics('sampled_metric');
      // Should have roughly half the metrics due to sampling
      expect(metrics.length).toBeLessThan(100);
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('timeAsync', () => {
    it('should time async operations successfully', async () => {
      const result = await monitor.timeAsync('async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      });
      
      expect(result).toBe('success');
      
      const metrics = monitor.getMetrics('async_test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe(MetricType.EXECUTION_TIME);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should handle async operation errors', async () => {
      const error = new Error('Test error');
      
      await expect(monitor.timeAsync('async_error', async () => {
        throw error;
      })).rejects.toThrow('Test error');
      
      const metrics = monitor.getMetrics('async_error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].context.error).toBe('Test error');
      expect(metrics[0].context.success).toBe(false);
    });
  });

  describe('timeSync', () => {
    it('should time sync operations successfully', () => {
      const result = monitor.timeSync('sync_test', () => {
        return 'success';
      });
      
      expect(result).toBe('success');
      
      const metrics = monitor.getMetrics('sync_test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe(MetricType.EXECUTION_TIME);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should handle sync operation errors', () => {
      const error = new Error('Test error');
      
      expect(() => monitor.timeSync('sync_error', () => {
        throw error;
      })).toThrow('Test error');
      
      const metrics = monitor.getMetrics('sync_error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].context.error).toBe('Test error');
      expect(metrics[0].context.success).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should calculate average correctly', () => {
      monitor.recordMetric('avg_test', 10, MetricType.RESPONSE_TIME);
      monitor.recordMetric('avg_test', 20, MetricType.RESPONSE_TIME);
      monitor.recordMetric('avg_test', 30, MetricType.RESPONSE_TIME);
      
      expect(monitor.getAverageMetric('avg_test')).toBe(20);
    });

    it('should calculate median correctly', () => {
      monitor.recordMetric('median_test', 10, MetricType.RESPONSE_TIME);
      monitor.recordMetric('median_test', 30, MetricType.RESPONSE_TIME);
      monitor.recordMetric('median_test', 20, MetricType.RESPONSE_TIME);
      
      expect(monitor.getMedianMetric('median_test')).toBe(20);
    });

    it('should calculate 95th percentile correctly', () => {
      for (let i = 1; i <= 100; i++) {
        monitor.recordMetric('p95_test', i, MetricType.RESPONSE_TIME);
      }
      
      expect(monitor.get95thPercentileMetric('p95_test')).toBe(95);
    });

    it('should return 0 for non-existent metrics', () => {
      expect(monitor.getAverageMetric('non_existent')).toBe(0);
      expect(monitor.getMedianMetric('non_existent')).toBe(0);
      expect(monitor.get95thPercentileMetric('non_existent')).toBe(0);
    });
  });

  describe('performance summary', () => {
    it('should generate performance summary', () => {
      monitor.recordMetric('summary_test', 10, MetricType.RESPONSE_TIME);
      monitor.recordMetric('summary_test', 20, MetricType.RESPONSE_TIME);
      
      const summary = monitor.getPerformanceSummary();
      expect(summary.summary_test).toBeDefined();
      expect(summary.summary_test.count).toBe(2);
      expect(summary.summary_test.average).toBe(15);
      expect(summary.summary_test.min).toBe(10);
      expect(summary.summary_test.max).toBe(20);
    });
  });

  describe('thresholds and alerts', () => {
    it('should generate alerts when thresholds are exceeded', () => {
      monitor.recordMetric('response_time', 2000, MetricType.RESPONSE_TIME); // Above warning threshold
      
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('response_time');
      expect(alerts[0].severity).toBe('warning');
    });

    it('should generate critical alerts for severe violations', () => {
      monitor.recordMetric('response_time', 6000, MetricType.RESPONSE_TIME); // Above critical threshold
      
      const alerts = monitor.getAlerts();
      const criticalAlert = alerts.find(a => a.severity === 'critical');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert!.metric).toBe('response_time');
    });
  });

  describe('export', () => {
    it('should export metrics in JSON format', () => {
      monitor.recordMetric('export_test', 100, MetricType.RESPONSE_TIME);
      
      const jsonExport = monitor.exportMetrics('json');
      const parsed = JSON.parse(jsonExport);
      
      expect(parsed.platform).toBe(PlatformType.WEB);
      expect(parsed.metrics.export_test).toBeDefined();
    });

    it('should export metrics in CSV format', () => {
      monitor.recordMetric('csv_test', 100, MetricType.RESPONSE_TIME);
      
      const csvExport = monitor.exportMetrics('csv');
      expect(csvExport).toContain('name,type,value,timestamp,platform,context,tags');
      expect(csvExport).toContain('csv_test');
    });
  });

  describe('cleanup', () => {
    it('should cleanup old metrics based on retention period', async () => {
      monitor.updateConfig({ retentionPeriod: 100 }); // 100ms retention
      
      monitor.recordMetric('cleanup_test', 100, MetricType.RESPONSE_TIME);
      
      // Verify metric was recorded
      expect(monitor.getMetrics('cleanup_test').length).toBe(1);
      
      // Wait for retention period to pass
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Force cleanup to run
      monitor.forceCleanup();
      
      const metrics = monitor.getMetrics('cleanup_test');
      expect(metrics.length).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all metrics and alerts', () => {
      monitor.recordMetric('reset_test', 100, MetricType.RESPONSE_TIME);
      monitor.recordMetric('response_time', 2000, MetricType.RESPONSE_TIME); // Trigger alert
      
      expect(monitor.getMetrics('reset_test').length).toBeGreaterThan(0);
      expect(monitor.getAlerts().length).toBeGreaterThan(0);
      
      monitor.reset();
      
      expect(monitor.getMetrics('reset_test').length).toBe(0);
      expect(monitor.getAlerts().length).toBe(0);
    });
  });
});
