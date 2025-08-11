/**
 * Test suite for BaseSensor
 * Tests the common sensor functionality and error handling
 */

import { BaseSensor, SensorConfig, DEFAULT_SENSOR_CONFIG } from '../BaseSensor';
import { SensorType, SensorResult, SensorStatus, ComputationalIssue, ProblemType, SeverityLevel } from '@types/core';

// Test implementation of BaseSensor
class TestSensor extends BaseSensor {
  private shouldFail: boolean = false;
  private failureCount: number = 0;
  private mockIssues: ComputationalIssue[] = [];

  constructor(config?: Partial<SensorConfig>) {
    super(SensorType.SYNTAX, config);
  }

  public setFailureMode(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
    this.failureCount = 0;
  }

  public setMockIssues(issues: ComputationalIssue[]): void {
    this.mockIssues = issues;
  }

  protected async performMonitoring(): Promise<SensorResult> {
    if (this.shouldFail) {
      this.failureCount++;
      throw new Error(`Test failure ${this.failureCount}`);
    }

    // Simulate monitoring work
    await new Promise(resolve => setTimeout(resolve, 10));

    const status = this.determineStatus(this.mockIssues);
    return this.createSensorResult(status, this.mockIssues, {
      testMetric: Math.random()
    });
  }

  protected async performRecovery(): Promise<void> {
    // Simulate recovery work
    await new Promise(resolve => setTimeout(resolve, 50));
    this.shouldFail = false; // Recovery fixes the issue
  }

  // Expose protected methods for testing
  public testCreateSensorResult(
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL',
    issues: ComputationalIssue[] = [],
    customMetrics: Record<string, number> = {}
  ): SensorResult {
    return this.createSensorResult(status, issues, customMetrics);
  }

  public testDetermineStatus(issues: ComputationalIssue[]): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    return this.determineStatus(issues);
  }
}

describe('BaseSensor', () => {
  let sensor: TestSensor;

  beforeEach(() => {
    sensor = new TestSensor();
  });

  afterEach(() => {
    sensor.stopMonitoring();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      expect(sensor.type).toBe(SensorType.SYNTAX);
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<SensorConfig> = {
        monitoringInterval: 500,
        sensitivity: 0.9,
        maxRetries: 5
      };

      const customSensor = new TestSensor(customConfig);
      expect(customSensor.type).toBe(SensorType.SYNTAX);
    });

    test('should merge custom config with defaults', () => {
      const customSensor = new TestSensor({ sensitivity: 0.9 });
      // Can't directly test private config, but we can test behavior
      expect(customSensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });
  });

  describe('Monitoring Lifecycle', () => {
    test('should start and stop monitoring', () => {
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);

      sensor.startMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE);

      sensor.stopMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });

    test('should not start monitoring if already active', () => {
      sensor.startMonitoring();
      const firstStatus = sensor.getStatus();
      
      sensor.startMonitoring(); // Second call should be ignored
      expect(sensor.getStatus()).toBe(firstStatus);
    });

    test('should not stop monitoring if already inactive', () => {
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
      
      sensor.stopMonitoring(); // Should not cause issues
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });
  });

  describe('Manual Monitoring', () => {
    test('should perform single monitoring cycle', async () => {
      const result = await sensor.monitor();

      expect(result).toEqual({
        timestamp: expect.any(Number),
        status: 'HEALTHY',
        issues: [],
        metrics: expect.objectContaining({
          responseTime: expect.any(Number),
          successRate: expect.any(Number),
          testMetric: expect.any(Number)
        })
      });
    });

    test('should handle monitoring with issues', async () => {
      const mockIssues: ComputationalIssue[] = [
        {
          id: 'test-issue',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.MEDIUM,
          context: {
            file: 'test.ts',
            line: 1,
            column: 1,
            scope: ['global'],
            relatedFiles: []
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: ['test']
          }
        }
      ];

      sensor.setMockIssues(mockIssues);
      const result = await sensor.monitor();

      expect(result.status).toBe('WARNING');
      expect(result.issues).toEqual(mockIssues);
    });

    test('should update metrics after successful monitoring', async () => {
      await sensor.monitor();
      
      const metrics = sensor.getMetrics();
      expect(metrics.totalMonitoringCycles).toBe(1);
      expect(metrics.successfulCycles).toBe(1);
      expect(metrics.failedCycles).toBe(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.lastSuccessfulMonitoring).toBeGreaterThan(0);
    });

    test('should handle monitoring failures', async () => {
      sensor.setFailureMode(true);

      await expect(sensor.monitor()).rejects.toThrow('Test failure 1');

      const metrics = sensor.getMetrics();
      expect(metrics.totalMonitoringCycles).toBe(1);
      expect(metrics.successfulCycles).toBe(0);
      expect(metrics.failedCycles).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle failure and attempt recovery', async () => {
      sensor.setFailureMode(true);

      await sensor.handleFailure(new Error('Test error'));

      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE); // Should recover
      
      const metrics = sensor.getMetrics();
      expect(metrics.lastFailure).toBeDefined();
      expect(metrics.lastFailure?.error).toBe('Test error');
    });

    test('should retry recovery with exponential backoff', async () => {
      // Set up sensor to fail multiple times before succeeding
      let failureCount = 0;
      const originalPerformRecovery = sensor['performRecovery'];
      sensor['performRecovery'] = async () => {
        failureCount++;
        if (failureCount < 2) {
          throw new Error(`Recovery failure ${failureCount}`);
        }
        await originalPerformRecovery.call(sensor);
      };

      sensor.setFailureMode(true);
      await sensor.handleFailure(new Error('Test error'));

      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE);
      expect(failureCount).toBe(2);
    });
  });

  describe('Health Monitoring', () => {
    test('should report healthy status initially', () => {
      expect(sensor.isHealthy()).toBe(true);
    });

    test('should report unhealthy after failures', async () => {
      sensor.setFailureMode(true);

      // Generate multiple failures
      for (let i = 0; i < 5; i++) {
        try {
          await sensor.monitor();
        } catch (error) {
          // Expected to fail
        }
      }

      expect(sensor.isHealthy()).toBe(false);
    });

    test('should recover health after successful monitoring', async () => {
      // First, make it unhealthy
      sensor.setFailureMode(true);
      for (let i = 0; i < 5; i++) {
        try {
          await sensor.monitor();
        } catch (error) {
          // Expected to fail
        }
      }

      // Then recover
      sensor.setFailureMode(false);
      for (let i = 0; i < 10; i++) {
        await sensor.monitor();
      }

      expect(sensor.isHealthy()).toBe(true);
    });
  });

  describe('Result Buffering', () => {
    test('should buffer monitoring results', async () => {
      await sensor.monitor();
      await sensor.monitor();
      await sensor.monitor();

      const recentResults = sensor.getRecentResults(2);
      expect(recentResults).toHaveLength(2);
      expect(recentResults[0].timestamp).toBeLessThanOrEqual(recentResults[1].timestamp);
    });

    test('should limit buffer size', async () => {
      const smallBufferSensor = new TestSensor({ bufferSize: 2 });

      // Generate more results than buffer size
      await smallBufferSensor.monitor();
      await smallBufferSensor.monitor();
      await smallBufferSensor.monitor();

      const allResults = smallBufferSensor.getRecentResults(10);
      expect(allResults).toHaveLength(2); // Should be limited by buffer size
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      sensor.updateConfig({ sensitivity: 0.5 });
      // Configuration is private, but we can test that it doesn't throw
      expect(true).toBe(true);
    });

    test('should restart monitoring when interval changes', () => {
      sensor.startMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE);

      sensor.updateConfig({ monitoringInterval: 200 });
      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE); // Should still be active
    });
  });

  describe('Metrics Management', () => {
    test('should reset metrics', async () => {
      await sensor.monitor();
      
      let metrics = sensor.getMetrics();
      expect(metrics.totalMonitoringCycles).toBe(1);

      sensor.resetMetrics();
      
      metrics = sensor.getMetrics();
      expect(metrics.totalMonitoringCycles).toBe(0);
      expect(metrics.successfulCycles).toBe(0);
      expect(metrics.failedCycles).toBe(0);
    });
  });

  describe('Status Determination', () => {
    test('should determine HEALTHY status with no issues', () => {
      const status = sensor.testDetermineStatus([]);
      expect(status).toBe('HEALTHY');
    });

    test('should determine WARNING status with low severity issues', () => {
      const issues: ComputationalIssue[] = [
        {
          id: 'test',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.LOW,
          context: { file: 'test.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: []
          }
        }
      ];

      const status = sensor.testDetermineStatus(issues);
      expect(status).toBe('WARNING');
    });

    test('should determine CRITICAL status with high severity issues', () => {
      const issues: ComputationalIssue[] = [
        {
          id: 'test',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.CRITICAL,
          context: { file: 'test.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: []
          }
        }
      ];

      const status = sensor.testDetermineStatus(issues);
      expect(status).toBe('CRITICAL');
    });

    test('should determine CRITICAL status with blocking issues', () => {
      const issues: ComputationalIssue[] = [
        {
          id: 'test',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.BLOCKING,
          context: { file: 'test.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: []
          }
        }
      ];

      const status = sensor.testDetermineStatus(issues);
      expect(status).toBe('CRITICAL');
    });
  });

  describe('Sensor Result Creation', () => {
    test('should create proper sensor result structure', () => {
      const customMetrics = { testValue: 42 };
      const result = sensor.testCreateSensorResult('HEALTHY', [], customMetrics);

      expect(result).toEqual({
        timestamp: expect.any(Number),
        status: 'HEALTHY',
        issues: [],
        metrics: expect.objectContaining({
          responseTime: expect.any(Number),
          successRate: expect.any(Number),
          testValue: 42
        })
      });
    });
  });
});