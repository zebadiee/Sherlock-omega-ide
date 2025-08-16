import { MonitoringService, MonitoringConfig } from '../monitoring-service';
import { PlatformType } from '../../core/whispering-interfaces';
import { MetricType } from '../performance-monitor';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let config: MonitoringConfig;
  const services: MonitoringService[] = [];

  beforeEach(() => {
    config = {
      enabled: true,
      platform: PlatformType.WEB,
      alertThresholds: {
        responseTime: 1000,
        memoryUsage: 0.8,
        errorRate: 0.05
      },
      reportingInterval: 5000
    };
    
    service = new MonitoringService(config);
    services.push(service);
  });

  afterEach(async () => {
    // Clean up all services
    for (const svc of services) {
      await svc.stop();
      // Also stop the underlying PerformanceMonitor interval
      if (svc.performanceMonitor) {
        svc.performanceMonitor.stopCleanupInterval();
      }
    }
    services.length = 0;
  });

  describe('constructor', () => {
    it('should create service with valid configuration', () => {
      expect(service).toBeInstanceOf(MonitoringService);
      expect(service.getType()).toBe('MonitoringService');
      expect(service.isActive()).toBe(false);
    });
  });

  describe('lifecycle management', () => {
    it('should start and stop correctly', async () => {
      expect(service.isActive()).toBe(false);
      
      await service.start();
      expect(service.isActive()).toBe(true);
      
      await service.stop();
      expect(service.isActive()).toBe(false);
    });

    it('should handle multiple start/stop calls gracefully', async () => {
      await service.start();
      await service.start(); // Should not throw
      expect(service.isActive()).toBe(true);
      
      await service.stop();
      await service.stop(); // Should not throw
      expect(service.isActive()).toBe(false);
    });
  });

  describe('performance monitoring', () => {
    it('should record metrics correctly', () => {
      service.recordMetric('test_metric', 100, MetricType.RESPONSE_TIME);
      
      const state = service.getPerformanceState();
      expect(state.responseTime).toBe(100);
    });

    it('should time operations correctly', async () => {
      const result = await service.timeOperation('async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      });
      
      expect(result).toBe('success');
      
      const state = service.getPerformanceState();
      expect(state.responseTime).toBeGreaterThan(0);
    });

    it('should calculate health score correctly', () => {
      // Record good metrics
      service.recordMetric('response_time', 500, MetricType.RESPONSE_TIME);
      service.recordMetric('memory_usage', 0.5, MetricType.MEMORY_USAGE);
      
      const state = service.getPerformanceState();
      expect(state.healthScore).toBeGreaterThan(0.8);
    });

    it('should detect performance issues', () => {
      // Record bad metrics that should trigger alerts
      service.recordMetric('response_time', 2000, MetricType.RESPONSE_TIME);
      
      const alerts = service.getCriticalAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const state = service.getPerformanceState();
      expect(state.healthScore).toBeLessThan(0.8);
    });
  });

  describe('sensor interface implementation', () => {
    it('should implement monitor() correctly', async () => {
      service.recordMetric('test_sensor', 100, MetricType.RESPONSE_TIME);
      
      const result = await service.monitor();
      
      expect(result.sensorId).toBe('monitoring-service');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.data.performance).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.data.platform).toBe(PlatformType.WEB);
      expect(result.status).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should provide accurate confidence scores', async () => {
      // Test high confidence scenario
      service.recordMetric('response_time', 200, MetricType.RESPONSE_TIME);
      const goodResult = await service.monitor();
      expect(goodResult.confidence).toBeGreaterThan(0.8);
      
      // Test low confidence scenario
      service.recordMetric('response_time', 5000, MetricType.RESPONSE_TIME);
      const badResult = await service.monitor();
      expect(badResult.confidence).toBeLessThan(0.8);
    });
  });

  describe('configuration management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        enabled: false,
        alertThresholds: {
          responseTime: 2000,
          memoryUsage: 0.9,
          errorRate: 0.1
        }
      };
      
      service.updateConfig(newConfig);
      
      // Verify config was updated (we can't directly access private config,
      // but we can test behavior changes)
      service.recordMetric('response_time', 1500, MetricType.RESPONSE_TIME);
      // With new threshold of 2000, this shouldn't trigger critical alert
      const alerts = service.getCriticalAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe('data export', () => {
    it('should export performance data in JSON format', () => {
      service.recordMetric('export_test', 100, MetricType.RESPONSE_TIME);
      
      const jsonData = service.exportPerformanceData('json');
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      const parsed = JSON.parse(jsonData);
      expect(parsed.platform).toBe(PlatformType.WEB);
      expect(parsed.metrics).toBeDefined();
    });

    it('should export performance data in CSV format', () => {
      service.recordMetric('csv_test', 100, MetricType.RESPONSE_TIME);
      
      const csvData = service.exportPerformanceData('csv');
      expect(csvData).toContain('name,type,value,timestamp');
      expect(csvData).toContain('csv_test');
    });
  });

  describe('reset functionality', () => {
    it('should reset all performance data', () => {
      service.recordMetric('reset_test', 100, MetricType.RESPONSE_TIME);
      
      let state = service.getPerformanceState();
      expect(state.responseTime).toBe(100);
      
      service.reset();
      
      state = service.getPerformanceState();
      expect(state.responseTime).toBe(0);
      expect(service.getCriticalAlerts().length).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle high-load scenarios', async () => {
      // Simulate high load
      for (let i = 0; i < 100; i++) {
        service.recordMetric('load_test', Math.random() * 1000, MetricType.RESPONSE_TIME);
      }
      
      const result = await service.monitor();
      expect(result.data.summary.load_test.count).toBe(100);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should maintain performance under continuous monitoring', async () => {
      await service.start();
      
      // Record metrics continuously
      const interval = setInterval(() => {
        service.recordMetric('continuous_test', Math.random() * 500, MetricType.RESPONSE_TIME);
      }, 10);
      
      // Let it run for a short time
      await new Promise(resolve => setTimeout(resolve, 100));
      clearInterval(interval);
      
      const state = service.getPerformanceState();
      expect(state.healthScore).toBeGreaterThan(0.5);
      
      await service.stop();
    });
  });
});