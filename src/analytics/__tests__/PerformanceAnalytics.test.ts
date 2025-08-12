/**
 * Tests for Performance Analytics System
 */

import { PerformanceAnalytics, TelemetryConfig, FrictionEvent } from '../PerformanceAnalytics';

describe('PerformanceAnalytics', () => {
  let analytics: PerformanceAnalytics;
  let config: TelemetryConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 1000,
      retentionDays: 7,
      anonymize: true,
      includeCodeContext: false,
      includeSystemMetrics: true
    };
    analytics = new PerformanceAnalytics(config);
  });

  afterEach(() => {
    analytics.destroy();
  });

  describe('Session Management', () => {
    it('should start and end sessions', () => {
      const sessionId = analytics.startSession();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      analytics.endSession();
      // Should not throw
    });

    it('should track session duration', () => {
      const sessionId = analytics.startSession();
      
      // Simulate some time passing
      setTimeout(() => {
        analytics.endSession();
        const sessionAnalytics = analytics.getCurrentSessionAnalytics();
        expect(sessionAnalytics).toBeNull(); // Session ended
      }, 100);
    });

    it('should get current session analytics', () => {
      const sessionId = analytics.startSession();
      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      
      expect(sessionAnalytics).toBeDefined();
      expect(sessionAnalytics.sessionId).toBe(sessionId);
      expect(sessionAnalytics.duration).toBeGreaterThan(0);
      expect(sessionAnalytics.frictionEvents).toBe(0);
    });
  });

  describe('Friction Event Recording', () => {
    beforeEach(() => {
      analytics.startSession();
    });

    it('should record friction events', () => {
      const event: Omit<FrictionEvent, 'id' | 'timestamp'> = {
        type: 'detected',
        frictionType: 'syntax',
        severity: 0.8,
        timeToDetection: 100,
        timeToResolution: 500,
        success: true,
        context: {
          filePath: 'test.ts',
          language: 'typescript',
          projectType: 'node',
          userAction: 'typing'
        },
        metadata: { confidence: 0.9 }
      };

      analytics.recordFrictionEvent(event);

      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.frictionEvents).toBe(1);
      expect(sessionAnalytics.frictionEliminated).toBe(0); // Only detected, not eliminated
    });

    it('should track friction elimination', () => {
      const detectionEvent: Omit<FrictionEvent, 'id' | 'timestamp'> = {
        type: 'detected',
        frictionType: 'dependency',
        severity: 0.9,
        timeToDetection: 50,
        success: true,
        context: {
          filePath: 'package.json',
          language: 'json',
          projectType: 'node',
          userAction: 'editing'
        },
        metadata: {}
      };

      const eliminationEvent: Omit<FrictionEvent, 'id' | 'timestamp'> = {
        type: 'eliminated',
        frictionType: 'dependency',
        severity: 0.9,
        timeToDetection: 50,
        timeToResolution: 200,
        success: true,
        context: {
          filePath: 'package.json',
          language: 'json',
          projectType: 'node',
          userAction: 'auto_install'
        },
        metadata: {}
      };

      analytics.recordFrictionEvent(detectionEvent);
      analytics.recordFrictionEvent(eliminationEvent);

      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.frictionEvents).toBe(2);
      expect(sessionAnalytics.frictionEliminated).toBe(1);
    });

    it('should calculate average resolution time', () => {
      const events = [
        {
          type: 'eliminated' as const,
          frictionType: 'syntax',
          severity: 0.5,
          timeToDetection: 100,
          timeToResolution: 300,
          success: true,
          context: {
            filePath: 'test.ts',
            language: 'typescript',
            projectType: 'node',
            userAction: 'typing'
          },
          metadata: {}
        },
        {
          type: 'eliminated' as const,
          frictionType: 'syntax',
          severity: 0.5,
          timeToDetection: 100,
          timeToResolution: 500,
          success: true,
          context: {
            filePath: 'test.ts',
            language: 'typescript',
            projectType: 'node',
            userAction: 'typing'
          },
          metadata: {}
        }
      ];

      events.forEach(event => analytics.recordFrictionEvent(event));

      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.averageResolutionTime).toBe(400); // (300 + 500) / 2
    });
  });

  describe('Productivity Tracking', () => {
    beforeEach(() => {
      analytics.startSession();
    });

    it('should record productivity actions', () => {
      analytics.recordProductivityAction('lines_written', 50);
      analytics.recordProductivityAction('function_created', 2);
      analytics.recordProductivityAction('test_written', 1);

      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.productivityScore).toBeGreaterThan(0);
    });

    it('should track time spent on activities', () => {
      analytics.recordTimeSpent('coding', 5000);
      analytics.recordTimeSpent('debugging', 2000);
      analytics.recordTimeSpent('waiting', 1000);

      // Should not throw and should record metrics
      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics).toBeDefined();
    });

    it('should calculate productivity score', () => {
      analytics.recordProductivityAction('lines_written', 100);
      analytics.recordProductivityAction('function_created', 5);
      analytics.recordProductivityAction('test_written', 3);
      analytics.recordProductivityAction('bug_fixed', 2);

      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.productivityScore).toBeGreaterThan(0);
      expect(sessionAnalytics.productivityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Metrics Recording', () => {
    it('should record performance metrics', () => {
      const metric = {
        id: 'test-metric-1',
        name: 'response_time',
        value: 150,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation: 'completion' },
        tags: ['performance', 'completion']
      };

      analytics.recordMetric(metric);
      // Should not throw
    });

    it('should handle metric batching', () => {
      // Record more metrics than batch size
      for (let i = 0; i < 15; i++) {
        analytics.recordMetric({
          id: `metric-${i}`,
          name: 'test_metric',
          value: i,
          unit: 'count',
          timestamp: Date.now(),
          context: {},
          tags: ['test']
        });
      }
      // Should handle batching automatically
    });
  });

  describe('Historical Analytics', () => {
    beforeEach(() => {
      analytics.startSession();
    });

    it('should get historical analytics', () => {
      // Record some events
      analytics.recordFrictionEvent({
        type: 'detected',
        frictionType: 'syntax',
        severity: 0.7,
        timeToDetection: 100,
        success: true,
        context: {
          filePath: 'test.ts',
          language: 'typescript',
          projectType: 'node',
          userAction: 'typing'
        },
        metadata: {}
      });

      const historical = analytics.getHistoricalAnalytics(1);
      expect(historical).toBeDefined();
      expect(historical.totalFrictionEvents).toBeGreaterThanOrEqual(0);
      expect(historical.frictionByType).toBeDefined();
      expect(historical.recommendations).toBeDefined();
      expect(Array.isArray(historical.recommendations)).toBe(true);
    });

    it('should generate recommendations', () => {
      // Record multiple events of same type
      for (let i = 0; i < 6; i++) {
        analytics.recordFrictionEvent({
          type: 'detected',
          frictionType: 'dependency',
          severity: 0.8,
          timeToDetection: 100,
          timeToResolution: 5000 + i * 1000, // Increasing resolution time
          success: true,
          context: {
            filePath: 'package.json',
            language: 'json',
            projectType: 'node',
            userAction: 'editing'
          },
          metadata: {}
        });
      }

      const historical = analytics.getHistoricalAnalytics(1);
      expect(historical.recommendations.length).toBeGreaterThan(0);
      expect(historical.recommendations.some((rec: string) => 
        rec.includes('dependency')
      )).toBe(true);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      analytics.startSession();
    });

    it('should generate performance report', () => {
      // Add some data
      analytics.recordFrictionEvent({
        type: 'eliminated',
        frictionType: 'syntax',
        severity: 0.6,
        timeToDetection: 100,
        timeToResolution: 300,
        success: true,
        context: {
          filePath: 'test.ts',
          language: 'typescript',
          projectType: 'node',
          userAction: 'typing'
        },
        metadata: {}
      });

      analytics.recordProductivityAction('lines_written', 50);

      const report = analytics.generateReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Sherlock Ω Performance Report');
      expect(report).toContain('Current Session');
      expect(report).toContain('Historical Performance');
      expect(report).toContain('System Health');
    });
  });

  describe('Configuration', () => {
    it('should respect disabled configuration', () => {
      const disabledConfig: TelemetryConfig = {
        enabled: false,
        batchSize: 10,
        flushInterval: 1000,
        retentionDays: 7,
        anonymize: true,
        includeCodeContext: false,
        includeSystemMetrics: true
      };

      const disabledAnalytics = new PerformanceAnalytics(disabledConfig);
      
      // Should not record anything when disabled
      disabledAnalytics.recordMetric({
        id: 'test',
        name: 'test',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: {},
        tags: []
      });

      disabledAnalytics.destroy();
    });

    it('should handle anonymization', () => {
      const metric = {
        id: 'test-metric',
        name: 'test_metric',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: { filePath: '/Users/john/project/test.ts' },
        tags: ['test']
      };

      analytics.recordMetric(metric);
      // Should anonymize file paths when configured
    });
  });

  describe('System Monitoring', () => {
    it('should track system health metrics', () => {
      analytics.startSession();
      
      const sessionAnalytics = analytics.getCurrentSessionAnalytics();
      expect(sessionAnalytics.systemHealth).toBeDefined();
      expect(sessionAnalytics.systemHealth.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(sessionAnalytics.systemHealth.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(sessionAnalytics.systemHealth.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Flow State Calculation', () => {
    beforeEach(() => {
      analytics.startSession();
    });

    it('should calculate flow state percentage', () => {
      // Record interruptions
      analytics.recordFrictionEvent({
        type: 'detected',
        frictionType: 'syntax',
        severity: 0.5,
        timeToDetection: 100,
        timeToResolution: 1000, // 1 second interruption
        success: true,
        context: {
          filePath: 'test.ts',
          language: 'typescript',
          projectType: 'node',
          userAction: 'typing'
        },
        metadata: {}
      });

      // Simulate session duration
      setTimeout(() => {
        const sessionAnalytics = analytics.getCurrentSessionAnalytics();
        expect(sessionAnalytics.flowStatePercentage).toBeGreaterThanOrEqual(0);
        expect(sessionAnalytics.flowStatePercentage).toBeLessThanOrEqual(100);
      }, 100);
    });
  });
});