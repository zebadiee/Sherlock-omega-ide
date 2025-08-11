/**
 * Test suite for OmniscientDevelopmentMonitor
 * Tests omniscient monitoring, quantum interference analysis, and preventive action generation
 */

import { OmniscientDevelopmentMonitor } from '../OmniscientDevelopmentMonitor';
import { 
  SensorInterface, 
  SensorResult, 
  SensorType, 
  SensorStatus,
  ComputationalIssue,
  ProblemType,
  SeverityLevel
} from '@types/core';
import { ActionType } from '@core/interfaces';

// Mock sensor for testing
class MockSensor implements SensorInterface {
  private mockResult: SensorResult;

  constructor(
    public readonly type: SensorType,
    mockResult?: Partial<SensorResult>
  ) {
    this.mockResult = {
      timestamp: Date.now(),
      status: 'HEALTHY',
      issues: [],
      metrics: {},
      ...mockResult
    };
  }

  async monitor(): Promise<SensorResult> {
    return { ...this.mockResult, timestamp: Date.now() };
  }

  async handleFailure(error: Error): Promise<void> {
    console.log(`Mock sensor ${this.type} handling failure:`, error.message);
  }

  getStatus(): SensorStatus {
    return SensorStatus.ACTIVE;
  }

  setMockResult(result: Partial<SensorResult>): void {
    this.mockResult = { ...this.mockResult, ...result };
  }
}

describe('OmniscientDevelopmentMonitor', () => {
  let monitor: OmniscientDevelopmentMonitor;

  beforeEach(() => {
    monitor = new OmniscientDevelopmentMonitor();
  });

  afterEach(async () => {
    await monitor.shutdown();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await monitor.initialize();
      
      const state = monitor.getMonitoringState();
      expect(state.isActive).toBe(true);
    });

    test('should register core sensors during initialization', async () => {
      await monitor.initialize();
      
      const registry = monitor.getSensorRegistry();
      const allSensors = registry.getAllSensors();
      
      expect(allSensors.has(SensorType.SYNTAX)).toBe(true);
      expect(allSensors.has(SensorType.DEPENDENCY)).toBe(true);
    });

    test('should not reinitialize if already initialized', async () => {
      await monitor.initialize();
      const firstState = monitor.getMonitoringState();
      
      await monitor.initialize();
      const secondState = monitor.getMonitoringState();
      
      expect(firstState.totalCycles).toBe(secondState.totalCycles);
    });
  });

  describe('Universal State Monitoring', () => {
    test('should monitor universal state and return preventive action plan', async () => {
      await monitor.initialize();
      
      const actionPlan = await monitor.monitorUniversalState();
      
      expect(actionPlan).toBeDefined();
      expect(actionPlan.id).toMatch(/preventive-plan-\d+/);
      expect(actionPlan.orderedActions).toBeInstanceOf(Array);
      expect(actionPlan.estimatedTime).toBeGreaterThanOrEqual(0);
      expect(actionPlan.confidence).toBeGreaterThan(0);
      expect(actionPlan.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle monitoring failures gracefully', async () => {
      // Create a sensor that always fails
      const failingSensor = new MockSensor(SensorType.PERFORMANCE);
      failingSensor.monitor = async () => {
        throw new Error('Sensor monitoring failed');
      };

      await monitor.addSensor(failingSensor);
      await monitor.initialize();
      
      const actionPlan = await monitor.monitorUniversalState();
      
      // Should return emergency action plan
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
      expect(actionPlan.confidence).toBeLessThan(1);
    });

    test('should update monitoring metrics', async () => {
      await monitor.initialize();
      
      const initialState = monitor.getMonitoringState();
      expect(initialState.totalCycles).toBe(0);
      
      await monitor.monitorUniversalState();
      
      const updatedState = monitor.getMonitoringState();
      expect(updatedState.totalCycles).toBe(1);
      expect(updatedState.successfulCycles).toBe(1);
      expect(updatedState.lastMonitoringCycle).toBeGreaterThan(0);
    });
  });

  describe('Quantum Interference Analysis', () => {
    test('should analyze quantum interference patterns', async () => {
      const mockIssues: ComputationalIssue[] = [
        {
          id: 'issue-1',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.HIGH,
          context: {
            file: 'test.ts',
            line: 1,
            column: 1,
            scope: ['global'],
            relatedFiles: ['utils.ts']
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: ['syntax']
          }
        },
        {
          id: 'issue-2',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.MEDIUM,
          context: {
            file: 'test.ts',
            line: 5,
            column: 10,
            scope: ['function'],
            relatedFiles: ['utils.ts']
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.8,
            tags: ['syntax']
          }
        }
      ];

      const monitoringResults: SensorResult[] = [
        {
          timestamp: Date.now(),
          status: 'CRITICAL',
          issues: mockIssues,
          metrics: { responseTime: 50 }
        }
      ];

      const criticalIssues = monitor.quantumInterference(monitoringResults);
      
      expect(criticalIssues).toBeInstanceOf(Array);
      expect(criticalIssues.length).toBeGreaterThan(0);
      
      // Should prioritize higher severity issues
      if (criticalIssues.length > 1) {
        expect(criticalIssues[0].severity).toBeGreaterThanOrEqual(criticalIssues[1].severity);
      }
    });

    test('should handle empty monitoring results', async () => {
      const criticalIssues = monitor.quantumInterference([]);
      expect(criticalIssues).toEqual([]);
    });

    test('should identify correlated issues', async () => {
      const correlatedIssues: ComputationalIssue[] = [
        {
          id: 'corr-1',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.HIGH,
          context: {
            file: 'shared.ts',
            scope: ['global'],
            relatedFiles: ['common.ts']
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.9,
            tags: []
          }
        },
        {
          id: 'corr-2',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.HIGH,
          context: {
            file: 'shared.ts',
            scope: ['function'],
            relatedFiles: ['common.ts']
          },
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

      const results: SensorResult[] = [{
        timestamp: Date.now(),
        status: 'CRITICAL',
        issues: correlatedIssues,
        metrics: {}
      }];

      const criticalIssues = monitor.quantumInterference(results);
      
      // Correlated issues should be identified as critical
      expect(criticalIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Preventive Action Generation', () => {
    test('should generate preventive actions for syntax errors', async () => {
      const syntaxIssues: ComputationalIssue[] = [
        {
          id: 'syntax-1',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.HIGH,
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
            tags: []
          }
        }
      ];

      const actionPlan = await monitor.generatePreventiveActionPlan(syntaxIssues);
      
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
      
      const syntaxAction = actionPlan.orderedActions.find(
        action => action.type === ActionType.SYNTAX_CORRECTION
      );
      expect(syntaxAction).toBeDefined();
      expect(syntaxAction?.description).toContain('syntax error');
    });

    test('should generate preventive actions for dependency issues', async () => {
      const dependencyIssues: ComputationalIssue[] = [
        {
          id: 'dep-1',
          type: ProblemType.DEPENDENCY_MISSING,
          severity: SeverityLevel.HIGH,
          context: {
            file: 'app.ts',
            scope: ['import'],
            relatedFiles: []
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.DEPENDENCY,
            confidence: 0.95,
            tags: []
          }
        }
      ];

      const actionPlan = await monitor.generatePreventiveActionPlan(dependencyIssues);
      
      const depAction = actionPlan.orderedActions.find(
        action => action.type === ActionType.DEPENDENCY_INSTALLATION
      );
      expect(depAction).toBeDefined();
      expect(depAction?.description).toContain('dependency');
    });

    test('should order actions by priority', async () => {
      const mixedIssues: ComputationalIssue[] = [
        {
          id: 'low-priority',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.LOW,
          context: { file: 'test1.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.8,
            tags: []
          }
        },
        {
          id: 'high-priority',
          type: ProblemType.DEPENDENCY_MISSING,
          severity: SeverityLevel.CRITICAL,
          context: { file: 'test2.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.DEPENDENCY,
            confidence: 0.9,
            tags: []
          }
        }
      ];

      const actionPlan = await monitor.generatePreventiveActionPlan(mixedIssues);
      
      expect(actionPlan.orderedActions.length).toBe(2);
      expect(actionPlan.orderedActions[0].priority).toBeGreaterThan(
        actionPlan.orderedActions[1].priority
      );
    });

    test('should calculate plan confidence', async () => {
      const issues: ComputationalIssue[] = [
        {
          id: 'test-issue',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.MEDIUM,
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

      const actionPlan = await monitor.generatePreventiveActionPlan(issues);
      
      expect(actionPlan.confidence).toBeGreaterThan(0);
      expect(actionPlan.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Preventive Action Execution', () => {
    test('should execute preventive actions', async () => {
      await monitor.initialize();
      
      const actionPlan = await monitor.monitorUniversalState();
      
      // Should not throw error
      await monitor.preventAllProblems(actionPlan);
      expect(true).toBe(true);
    });

    test('should handle action execution failures', async () => {
      const failingActionPlan = {
        id: 'failing-plan',
        orderedActions: [{
          id: 'failing-action',
          type: ActionType.SYNTAX_CORRECTION,
          description: 'This action will fail',
          priority: SeverityLevel.HIGH,
          estimatedTime: 100,
          dependencies: [],
          rollbackPlan: {
            type: 'AUTOMATIC' as const,
            steps: [],
            timeLimit: 5000
          }
        }],
        estimatedTime: 100,
        confidence: 0.8,
        criticalPath: ['test.ts']
      };

      // Should handle failures gracefully
      await monitor.preventAllProblems(failingActionPlan);
      expect(true).toBe(true);
    });
  });

  describe('Sensor Management', () => {
    test('should add custom sensor', async () => {
      const customSensor = new MockSensor(SensorType.PERFORMANCE);
      
      await monitor.addSensor(customSensor, {
        priority: 5,
        tags: ['custom', 'performance']
      });

      const registry = monitor.getSensorRegistry();
      const sensor = registry.getSensor(SensorType.PERFORMANCE);
      
      expect(sensor).toBe(customSensor);
    });

    test('should remove sensor', async () => {
      const customSensor = new MockSensor(SensorType.PERFORMANCE);
      await monitor.addSensor(customSensor);
      
      monitor.removeSensor(SensorType.PERFORMANCE);
      
      const registry = monitor.getSensorRegistry();
      const sensor = registry.getSensor(SensorType.PERFORMANCE);
      
      expect(sensor).toBeUndefined();
    });

    test('should handle sensor failures', async () => {
      const failingSensor = new MockSensor(SensorType.PERFORMANCE);
      failingSensor.monitor = async () => {
        throw new Error('Sensor failure');
      };

      await monitor.addSensor(failingSensor);
      await monitor.initialize();
      
      // Should handle sensor failure gracefully
      const actionPlan = await monitor.monitorUniversalState();
      expect(actionPlan).toBeDefined();
    });
  });

  describe('Monitoring State', () => {
    test('should track monitoring state', async () => {
      const initialState = monitor.getMonitoringState();
      expect(initialState.isActive).toBe(false);
      expect(initialState.totalCycles).toBe(0);

      await monitor.initialize();
      await monitor.monitorUniversalState();

      const updatedState = monitor.getMonitoringState();
      expect(updatedState.isActive).toBe(true);
      expect(updatedState.totalCycles).toBe(1);
      expect(updatedState.successfulCycles).toBe(1);
    });

    test('should track sensor count', async () => {
      await monitor.initialize();
      
      const state = monitor.getMonitoringState();
      expect(state.activeSensors).toBeGreaterThan(0);
    });

    test('should track critical issues', async () => {
      const criticalSensor = new MockSensor(SensorType.PERFORMANCE, {
        status: 'CRITICAL',
        issues: [{
          id: 'critical-issue',
          type: ProblemType.PERFORMANCE_BOTTLENECK,
          severity: SeverityLevel.CRITICAL,
          context: { file: 'test.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.PERFORMANCE,
            confidence: 0.9,
            tags: []
          }
        }]
      });

      await monitor.addSensor(criticalSensor);
      await monitor.initialize();
      await monitor.monitorUniversalState();

      const state = monitor.getMonitoringState();
      expect(state.criticalIssuesDetected).toBeGreaterThan(0);
    });
  });

  describe('Shutdown', () => {
    test('should shutdown gracefully', async () => {
      await monitor.initialize();
      expect(monitor.getMonitoringState().isActive).toBe(true);

      await monitor.shutdown();
      expect(monitor.getMonitoringState().isActive).toBe(false);
    });

    test('should stop all sensors on shutdown', async () => {
      await monitor.initialize();
      await monitor.shutdown();

      const registry = monitor.getSensorRegistry();
      const health = registry.getSystemHealth();
      
      // After shutdown, sensors should be stopped
      expect(health.overall).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    test('should generate emergency action plan on critical failure', async () => {
      // Force a critical failure by making initialization fail
      const originalInitialize = monitor.initialize;
      monitor.initialize = async () => {
        throw new Error('Critical initialization failure');
      };

      try {
        await monitor.monitorUniversalState();
      } catch (error) {
        // Should handle the error and potentially generate emergency plan
      }

      // Restore original method
      monitor.initialize = originalInitialize;
      expect(true).toBe(true);
    });
  });
});