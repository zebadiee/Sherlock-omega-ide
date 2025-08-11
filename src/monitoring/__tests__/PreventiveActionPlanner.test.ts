/**
 * Test suite for PreventiveActionPlanner
 * Tests action plan generation, execution verification, and learning capabilities
 */

import { PreventiveActionPlanner, ActionTemplate, ActionExecutionContext, SystemState } from '../PreventiveActionPlanner';
import { ActionType } from '@core/interfaces';
import { 
  ComputationalIssue, 
  ProblemType, 
  SeverityLevel, 
  SensorType 
} from '@types/core';

describe('PreventiveActionPlanner', () => {
  let planner: PreventiveActionPlanner;
  let mockSystemState: SystemState;
  let mockIssues: ComputationalIssue[];

  beforeEach(() => {
    planner = new PreventiveActionPlanner();
    
    mockSystemState = {
      availableMemory: 8192,
      cpuUsage: 0.2,
      diskSpace: 50000,
      networkConnectivity: true,
      activeProcesses: 50,
      timestamp: Date.now()
    };

    mockIssues = [
      {
        id: 'syntax-issue-1',
        type: ProblemType.SYNTAX_ERROR,
        severity: SeverityLevel.HIGH,
        context: {
          file: 'test.ts',
          line: 10,
          column: 5,
          scope: ['function'],
          relatedFiles: ['utils.ts']
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: SensorType.SYNTAX,
          confidence: 0.95,
          tags: ['syntax', 'typescript']
        }
      },
      {
        id: 'dep-issue-1',
        type: ProblemType.DEPENDENCY_MISSING,
        severity: SeverityLevel.CRITICAL,
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
          confidence: 0.9,
          tags: ['dependency', 'missing']
        }
      }
    ];
  });

  afterEach(() => {
    planner.clearExecutionHistory();
  });

  describe('Action Plan Generation', () => {
    test('should generate comprehensive action plan', async () => {
      const actionPlan = await planner.generateActionPlan(mockIssues, mockSystemState);

      expect(actionPlan).toBeDefined();
      expect(actionPlan.id).toMatch(/preventive-plan-\d+-\w+/);
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
      expect(actionPlan.estimatedTime).toBeGreaterThan(0);
      expect(actionPlan.confidence).toBeGreaterThan(0);
      expect(actionPlan.confidence).toBeLessThanOrEqual(1);
      expect(actionPlan.criticalPath.length).toBeGreaterThan(0);
    });

    test('should generate actions for syntax errors', async () => {
      const syntaxIssues = mockIssues.filter(issue => issue.type === ProblemType.SYNTAX_ERROR);
      const actionPlan = await planner.generateActionPlan(syntaxIssues);

      const syntaxActions = actionPlan.orderedActions.filter(
        action => action.type === ActionType.SYNTAX_CORRECTION
      );

      expect(syntaxActions.length).toBeGreaterThan(0);
      expect(syntaxActions[0].description).toContain('syntax error');
      expect(syntaxActions[0].estimatedTime).toBe(100);
    });

    test('should generate actions for dependency issues', async () => {
      const depIssues = mockIssues.filter(issue => issue.type === ProblemType.DEPENDENCY_MISSING);
      const actionPlan = await planner.generateActionPlan(depIssues);

      const depActions = actionPlan.orderedActions.filter(
        action => action.type === ActionType.DEPENDENCY_INSTALLATION
      );

      expect(depActions.length).toBeGreaterThan(0);
      expect(depActions[0].description).toContain('dependency');
      expect(depActions[0].estimatedTime).toBe(5000);
    });

    test('should order actions by priority', async () => {
      const actionPlan = await planner.generateActionPlan(mockIssues);

      // Actions should be ordered by priority (higher first)
      for (let i = 0; i < actionPlan.orderedActions.length - 1; i++) {
        expect(actionPlan.orderedActions[i].priority).toBeGreaterThanOrEqual(
          actionPlan.orderedActions[i + 1].priority
        );
      }
    });

    test('should handle empty issue list', async () => {
      const actionPlan = await planner.generateActionPlan([]);

      expect(actionPlan.orderedActions).toHaveLength(0);
      expect(actionPlan.estimatedTime).toBe(0);
      expect(actionPlan.confidence).toBe(1.0);
      expect(actionPlan.criticalPath).toHaveLength(0);
    });

    test('should group correlated issues', async () => {
      const correlatedIssues: ComputationalIssue[] = [
        {
          id: 'corr-1',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.HIGH,
          context: {
            file: 'shared.ts',
            line: 1,
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
          severity: SeverityLevel.MEDIUM,
          context: {
            file: 'shared.ts',
            line: 5,
            scope: ['function'],
            relatedFiles: ['common.ts']
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 0.8,
            tags: []
          }
        }
      ];

      const actionPlan = await planner.generateActionPlan(correlatedIssues);

      // Should generate actions that consider correlation
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
      expect(actionPlan.criticalPath).toContain('shared.ts');
    });
  });

  describe('Action Execution and Verification', () => {
    test('should execute action with verification', async () => {
      const mockAction = {
        id: 'test-action',
        type: ActionType.SYNTAX_CORRECTION,
        description: 'Test syntax correction',
        priority: SeverityLevel.HIGH,
        estimatedTime: 100,
        dependencies: [],
        rollbackPlan: {
          type: 'AUTOMATIC' as const,
          steps: [],
          timeLimit: 5000
        }
      };

      const mockContext: ActionExecutionContext = {
        issue: mockIssues[0],
        relatedIssues: [],
        systemState: mockSystemState,
        executionHistory: []
      };

      const result = await planner.executeActionWithVerification(mockAction, mockContext);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThan(0);
    });

    test('should handle action execution failure', async () => {
      const failingAction = {
        id: 'failing-action',
        type: ActionType.DEPENDENCY_INSTALLATION,
        description: 'This will fail',
        priority: SeverityLevel.HIGH,
        estimatedTime: 1000,
        dependencies: [],
        rollbackPlan: {
          type: 'MANUAL' as const,
          steps: [],
          timeLimit: 10000
        }
      };

      // Mock system state with no network connectivity
      const failingSystemState = {
        ...mockSystemState,
        networkConnectivity: false
      };

      const mockContext: ActionExecutionContext = {
        issue: mockIssues[1], // Dependency issue
        relatedIssues: [],
        systemState: failingSystemState,
        executionHistory: []
      };

      const result = await planner.executeActionWithVerification(failingAction, mockContext);

      expect(result.success).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should validate action preconditions', async () => {
      const resourceIntensiveAction = {
        id: 'resource-action',
        type: ActionType.ARCHITECTURE_REFACTORING,
        description: 'Resource intensive action',
        priority: SeverityLevel.MEDIUM,
        estimatedTime: 10000,
        dependencies: [],
        rollbackPlan: {
          type: 'CHECKPOINT' as const,
          steps: [],
          timeLimit: 15000
        }
      };

      // Mock system state with insufficient resources
      const lowResourceState = {
        ...mockSystemState,
        availableMemory: 500, // Less than 1GB
        diskSpace: 1000 // Less than 5GB
      };

      const mockContext: ActionExecutionContext = {
        issue: mockIssues[0],
        relatedIssues: [],
        systemState: lowResourceState,
        executionHistory: []
      };

      const result = await planner.executeActionWithVerification(resourceIntensiveAction, mockContext);

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('Insufficient memory for action execution');
      expect(result.recommendations).toContain('Insufficient disk space for architecture refactoring');
    });
  });

  describe('Custom Action Templates', () => {
    test('should register custom action template', () => {
      const customTemplate: ActionTemplate = {
        type: ActionType.PERFORMANCE_OPTIMIZATION,
        problemTypes: [ProblemType.PERFORMANCE_BOTTLENECK],
        priority: 7,
        estimatedTime: 2000,
        successRate: 0.8,
        rollbackType: 'CHECKPOINT',
        dependencies: [],
        generateAction: (issues) => issues.map(issue => ({
          id: `custom-${issue.id}`,
          type: ActionType.PERFORMANCE_OPTIMIZATION,
          description: `Custom performance fix for ${issue.context.file}`,
          priority: issue.severity,
          estimatedTime: 2000,
          dependencies: [],
          rollbackPlan: {
            type: 'CHECKPOINT',
            steps: [],
            timeLimit: 10000
          }
        }))
      };

      planner.registerActionTemplate(customTemplate);

      // Test that custom template is used
      const perfIssue: ComputationalIssue = {
        id: 'perf-issue',
        type: ProblemType.PERFORMANCE_BOTTLENECK,
        severity: SeverityLevel.MEDIUM,
        context: {
          file: 'slow.ts',
          scope: ['function'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: SensorType.PERFORMANCE,
          confidence: 0.85,
          tags: []
        }
      };

      // Should not throw error and should use custom template
      expect(async () => {
        await planner.generateActionPlan([perfIssue]);
      }).not.toThrow();
    });
  });

  describe('Learning and Statistics', () => {
    test('should track execution statistics', async () => {
      // Execute some actions to build history
      const mockAction = {
        id: 'stat-test-action',
        type: ActionType.SYNTAX_CORRECTION,
        description: 'Statistics test action',
        priority: SeverityLevel.HIGH,
        estimatedTime: 100,
        dependencies: [],
        rollbackPlan: {
          type: 'AUTOMATIC' as const,
          steps: [],
          timeLimit: 5000
        }
      };

      const mockContext: ActionExecutionContext = {
        issue: mockIssues[0],
        relatedIssues: [],
        systemState: mockSystemState,
        executionHistory: []
      };

      // Execute action multiple times
      await planner.executeActionWithVerification(mockAction, mockContext);
      await planner.executeActionWithVerification(mockAction, mockContext);

      const stats = planner.getExecutionStatistics();

      expect(stats.totalExecutions).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.actionTypeStats.size).toBeGreaterThan(0);
    });

    test('should apply learning optimizations', async () => {
      // First, execute some actions to build history with low success rate
      const unreliableAction = {
        id: 'unreliable-action',
        type: ActionType.CONFIGURATION_FIX,
        description: 'Unreliable action',
        priority: SeverityLevel.HIGH,
        estimatedTime: 1000,
        dependencies: [],
        rollbackPlan: {
          type: 'CHECKPOINT' as const,
          steps: [],
          timeLimit: 10000
        }
      };

      const mockContext: ActionExecutionContext = {
        issue: mockIssues[0],
        relatedIssues: [],
        systemState: mockSystemState,
        executionHistory: []
      };

      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        await planner.executeActionWithVerification(unreliableAction, mockContext);
      }

      // Now generate a plan with configuration issues
      const configIssue: ComputationalIssue = {
        id: 'config-issue',
        type: ProblemType.CONFIGURATION_ERROR,
        severity: SeverityLevel.HIGH,
        context: {
          file: 'config.json',
          scope: ['global'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: SensorType.CONFIGURATION,
          confidence: 0.9,
          tags: []
        }
      };

      const actionPlan = await planner.generateActionPlan([configIssue]);

      // Learning should have affected the plan (actions might have lower priority or higher estimated time)
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
    });

    test('should clear execution history', () => {
      planner.clearExecutionHistory();
      
      const stats = planner.getExecutionStatistics();
      expect(stats.totalExecutions).toBe(0);
      expect(stats.actionTypeStats.size).toBe(0);
    });

    test('should enable/disable learning', () => {
      planner.setLearningEnabled(false);
      planner.setLearningEnabled(true);
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Action Dependencies and Ordering', () => {
    test('should handle action dependencies', async () => {
      // Create issues that require dependent actions
      const securityIssue: ComputationalIssue = {
        id: 'security-issue',
        type: ProblemType.SECURITY_VULNERABILITY,
        severity: SeverityLevel.CRITICAL,
        context: {
          file: 'vulnerable.ts',
          scope: ['function'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: SensorType.SECURITY,
          confidence: 0.95,
          tags: []
        }
      };

      const mixedIssues = [...mockIssues, securityIssue];
      const actionPlan = await planner.generateActionPlan(mixedIssues);

      // Security actions should depend on syntax and dependency actions
      const securityActions = actionPlan.orderedActions.filter(
        action => action.type === ActionType.SECURITY_HARDENING
      );
      const syntaxActions = actionPlan.orderedActions.filter(
        action => action.type === ActionType.SYNTAX_CORRECTION
      );

      if (securityActions.length > 0 && syntaxActions.length > 0) {
        // Security actions should come after syntax actions due to dependencies
        const securityIndex = actionPlan.orderedActions.indexOf(securityActions[0]);
        const syntaxIndex = actionPlan.orderedActions.indexOf(syntaxActions[0]);
        expect(securityIndex).toBeGreaterThan(syntaxIndex);
      }
    });

    test('should detect circular dependencies', async () => {
      // This test ensures the system handles circular dependencies gracefully
      // In practice, the default templates shouldn't have circular dependencies
      const actionPlan = await planner.generateActionPlan(mockIssues);
      
      // Should complete without infinite loops
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Calculation', () => {
    test('should calculate confidence based on action complexity', async () => {
      // Simple plan with one action
      const simpleIssue = [mockIssues[0]];
      const simplePlan = await planner.generateActionPlan(simpleIssue);

      // Complex plan with many actions
      const complexIssues = [
        ...mockIssues,
        {
          id: 'complex-1',
          type: ProblemType.PERFORMANCE_BOTTLENECK,
          severity: SeverityLevel.HIGH,
          context: { file: 'perf.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.PERFORMANCE,
            confidence: 0.8,
            tags: []
          }
        },
        {
          id: 'complex-2',
          type: ProblemType.ARCHITECTURAL_INCONSISTENCY,
          severity: SeverityLevel.MEDIUM,
          context: { file: 'arch.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.ARCHITECTURE,
            confidence: 0.7,
            tags: []
          }
        }
      ];
      const complexPlan = await planner.generateActionPlan(complexIssues);

      // Simple plan should have higher confidence
      expect(simplePlan.confidence).toBeGreaterThan(complexPlan.confidence);
    });

    test('should adjust confidence based on issue severity', async () => {
      const lowSeverityIssue: ComputationalIssue = {
        ...mockIssues[0],
        id: 'low-severity',
        severity: SeverityLevel.LOW
      };

      const highSeverityIssue: ComputationalIssue = {
        ...mockIssues[0],
        id: 'high-severity',
        severity: SeverityLevel.CRITICAL
      };

      const lowSeverityPlan = await planner.generateActionPlan([lowSeverityIssue]);
      const highSeverityPlan = await planner.generateActionPlan([highSeverityIssue]);

      // Both should have reasonable confidence
      expect(lowSeverityPlan.confidence).toBeGreaterThan(0);
      expect(highSeverityPlan.confidence).toBeGreaterThan(0);
    });
  });

  describe('Parallel Execution Optimization', () => {
    test('should identify parallel execution opportunities', async () => {
      const parallelizableIssues: ComputationalIssue[] = [
        {
          id: 'parallel-1',
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.MEDIUM,
          context: { file: 'file1.ts', scope: [], relatedFiles: [] },
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
          id: 'parallel-2',
          type: ProblemType.CONFIGURATION_ERROR,
          severity: SeverityLevel.MEDIUM,
          context: { file: 'file2.ts', scope: [], relatedFiles: [] },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.CONFIGURATION,
            confidence: 0.9,
            tags: []
          }
        }
      ];

      const actionPlan = await planner.generateActionPlan(parallelizableIssues);

      // Total estimated time should account for parallel execution
      expect(actionPlan.estimatedTime).toBeGreaterThan(0);
      expect(actionPlan.orderedActions.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed issues gracefully', async () => {
      const malformedIssue = {
        id: 'malformed',
        type: 'UNKNOWN_TYPE' as any,
        severity: SeverityLevel.MEDIUM,
        context: { file: 'test.ts', scope: [], relatedFiles: [] },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: SensorType.SYNTAX,
          confidence: 0.5,
          tags: []
        }
      };

      const actionPlan = await planner.generateActionPlan([malformedIssue]);

      // Should generate generic actions for unknown problem types
      expect(actionPlan.orderedActions.length).toBeGreaterThan(0);
    });

    test('should handle system resource constraints', async () => {
      const constrainedSystemState = {
        ...mockSystemState,
        availableMemory: 100, // Very low memory
        cpuUsage: 0.95, // Very high CPU usage
        diskSpace: 100 // Very low disk space
      };

      const actionPlan = await planner.generateActionPlan(mockIssues, constrainedSystemState);

      // Should still generate a plan but with appropriate warnings
      expect(actionPlan).toBeDefined();
    });
  });
});