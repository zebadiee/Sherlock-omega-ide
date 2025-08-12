/**
 * Tests for Thought Completion System
 */

import { ThoughtCompletion, CompletionType, CompletionContext, CompletionSuggestion } from '../ThoughtCompletion';
import { IntegratedFrictionProtocol } from '../../friction/IntegratedFrictionProtocol';
import { DeveloperIntent, GoalType } from '../../types/core';

// Mock the IntegratedFrictionProtocol
jest.mock('../../friction/IntegratedFrictionProtocol');

describe('ThoughtCompletion', () => {
  let thoughtCompletion: ThoughtCompletion;
  let mockFrictionProtocol: jest.Mocked<IntegratedFrictionProtocol>;

  beforeEach(() => {
    mockFrictionProtocol = new IntegratedFrictionProtocol() as jest.Mocked<IntegratedFrictionProtocol>;
    mockFrictionProtocol.runIntegratedDetection = jest.fn().mockResolvedValue({
      actionableItems: [],
      uiMetadata: {
        totalActions: 0,
        autoExecutableActions: 0,
        highPriorityActions: 0,
        estimatedTotalTime: 0,
        lastUpdated: Date.now(),
        categories: { syntax: 0, dependencies: 0, performance: 0, architecture: 0 }
      }
    });

    thoughtCompletion = new ThoughtCompletion(mockFrictionProtocol);
  });

  describe('completeThought', () => {
    it('should generate completion suggestions for function context', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'function calculateSum(',
        cursorPosition: { line: 0, column: 20 },
        language: 'typescript'
      };

      const result = await thoughtCompletion.completeThought(context);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.intentAlignment).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should generate suggestions with high intent alignment for testing context', async () => {
      const context: CompletionContext = {
        filePath: 'test.spec.ts',
        content: 'describe("Calculator", () => {\n  test("should calculate sum", () => {\n    ',
        cursorPosition: { line: 2, column: 4 },
        language: 'typescript',
        projectContext: {
          dependencies: ['jest'],
          testFramework: 'jest'
        }
      };

      const intent: DeveloperIntent = {
        primaryGoal: { 
          type: GoalType.TESTING, 
          description: 'Writing unit tests', 
          priority: 1,
          measurable: true,
          criteria: ['100% test coverage', 'All tests pass']
        },
        subGoals: [],
        constraints: [{ 
          type: 'FRAMEWORK' as any, 
          description: 'Use Jest framework', 
          mandatory: true, 
          weight: 1.0 
        }],
        preferences: [{ 
          category: 'TESTING' as any, 
          value: 'jest', 
          strength: 0.9, 
          learned: false 
        }],
        confidence: 0.9,
        contextualFactors: []
      };

      const result = await thoughtCompletion.completeThought(context, intent);

      expect(result.suggestions).toBeDefined();
      expect(result.intentAlignment).toBeGreaterThan(0.7);
      
      const testSuggestions = result.suggestions.filter(s => s.type === CompletionType.TEST_CASE);
      expect(testSuggestions.length).toBeGreaterThan(0);
    });

    it('should handle empty context gracefully', async () => {
      const context: CompletionContext = {
        filePath: 'empty.ts',
        content: '',
        cursorPosition: { line: 0, column: 0 },
        language: 'typescript'
      };

      const result = await thoughtCompletion.completeThought(context);

      expect(result.suggestions).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.intentAlignment).toBeGreaterThanOrEqual(0);
    });

    it('should integrate with friction protocol for proactive suggestions', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'import _ from "lodash";\nfunction test() {}',
        cursorPosition: { line: 1, column: 18 },
        language: 'typescript'
      };

      mockFrictionProtocol.runIntegratedDetection.mockResolvedValue({
        totalFriction: 1,
        eliminatedFriction: 0,
        failedElimination: 0,
        detectorResults: [{
          detectorName: 'DependencyFrictionDetector',
          frictionDetected: 1,
          frictionEliminated: 0,
          frictionFailed: 0,
          executionTime: 50,
          errors: []
        }],
        executionTime: 100,
        actionableItems: [{
          id: 'install-lodash',
          type: 'install',
          title: 'Install lodash',
          description: 'Missing dependency: lodash',
          severity: 'high',
          autoExecutable: true,
          metadata: {
            frictionType: 'dependency',
            confidence: 0.9,
            estimatedTime: 30
          }
        }],
        uiMetadata: {
          totalActions: 1,
          autoExecutableActions: 1,
          highPriorityActions: 1,
          estimatedTotalTime: 30,
          lastUpdated: Date.now(),
          categories: { syntax: 0, dependencies: 1, performance: 0, architecture: 0 }
        }
      });

      const result = await thoughtCompletion.completeThought(context);

      expect(mockFrictionProtocol.runIntegratedDetection).toHaveBeenCalledWith({
        filePath: 'test.ts',
        content: 'import _ from "lodash";\nfunction test() {}',
        language: 'typescript',
        checkPackageJson: true
      });

      expect(result.metadata.proactiveActions).toHaveLength(1);
      expect(result.metadata.frictionPointsAddressed).toBe(1);
    });
  });

  describe('generateSpecificCompletion', () => {
    it('should generate function signatures', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'function calculateSum',
        cursorPosition: { line: 0, column: 20 },
        language: 'typescript'
      };

      const suggestions = await thoughtCompletion.generateSpecificCompletion(
        CompletionType.FUNCTION_SIGNATURE,
        context
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(CompletionType.FUNCTION_SIGNATURE);
      expect(suggestions[0].content).toContain('function');
    });

    it('should generate test cases for functions', async () => {
      const context: CompletionContext = {
        filePath: 'calculator.ts',
        content: 'function add(a: number, b: number): number {\n  return a + b;\n}',
        cursorPosition: { line: 2, column: 1 },
        language: 'typescript',
        projectContext: {
          testFramework: 'jest',
          dependencies: ['jest']
        }
      };

      const intent: DeveloperIntent = {
        primaryGoal: { 
          type: GoalType.TESTING, 
          description: 'Writing tests', 
          priority: 1,
          measurable: true,
          criteria: ['Test coverage > 80%']
        },
        subGoals: [],
        constraints: [],
        preferences: [],
        confidence: 0.8,
        contextualFactors: []
      };

      const suggestions = await thoughtCompletion.generateSpecificCompletion(
        CompletionType.TEST_CASE,
        context,
        intent
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(CompletionType.TEST_CASE);
      expect(suggestions[0].content).toContain('test');
      expect(suggestions[0].content).toContain('add');
    });

    it('should generate comments for undocumented functions', async () => {
      const context: CompletionContext = {
        filePath: 'utils.ts',
        content: 'function processData(data: any[]) {\n  return data.filter(item => item.valid);\n}',
        cursorPosition: { line: 0, column: 0 },
        language: 'typescript'
      };

      const suggestions = await thoughtCompletion.generateSpecificCompletion(
        CompletionType.COMMENT,
        context
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(CompletionType.COMMENT);
      expect(suggestions[0].content).toContain('/**');
      expect(suggestions[0].content).toContain('processData');
    });

    it('should generate import statements for missing dependencies', async () => {
      const context: CompletionContext = {
        filePath: 'app.ts',
        content: 'const data = _.map([1, 2, 3], x => x * 2);',
        cursorPosition: { line: 0, column: 0 },
        language: 'typescript'
      };

      const suggestions = await thoughtCompletion.generateSpecificCompletion(
        CompletionType.IMPORT_STATEMENT,
        context
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(CompletionType.IMPORT_STATEMENT);
      expect(suggestions[0].content).toContain('import');
      expect(suggestions[0].content).toContain('lodash');
    });

    it('should generate type definitions for TypeScript', async () => {
      const context: CompletionContext = {
        filePath: 'types.ts',
        content: 'let userData = { name: "John", age: 30 };',
        cursorPosition: { line: 0, column: 0 },
        language: 'typescript'
      };

      const suggestions = await thoughtCompletion.generateSpecificCompletion(
        CompletionType.TYPE_DEFINITION,
        context
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe(CompletionType.TYPE_DEFINITION);
      expect(suggestions[0].content).toContain('userData');
    });
  });

  describe('getCompletionStats', () => {
    it('should return empty stats for new instance', () => {
      const stats = thoughtCompletion.getCompletionStats();

      expect(stats.totalCompletions).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.averageIntentAlignment).toBe(0);
      expect(stats.mostUsedTypes).toEqual([]);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate stats after completions', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'function test() {}',
        cursorPosition: { line: 0, column: 18 },
        language: 'typescript'
      };

      // Generate some completions
      await thoughtCompletion.completeThought(context);
      await thoughtCompletion.completeThought(context);

      const stats = thoughtCompletion.getCompletionStats();

      expect(stats.totalCompletions).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageIntentAlignment).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('intent inference', () => {
    it('should infer testing intent from test file context', async () => {
      const context: CompletionContext = {
        filePath: 'calculator.test.ts',
        content: 'describe("Calculator", () => {\n  test("should add numbers", () => {',
        cursorPosition: { line: 1, column: 35 },
        language: 'typescript'
      };

      const result = await thoughtCompletion.completeThought(context);

      // Should have high intent alignment for testing-related suggestions
      const testSuggestions = result.suggestions.filter(s => 
        s.type === CompletionType.TEST_CASE || s.description.includes('test')
      );
      
      if (testSuggestions.length > 0) {
        expect(testSuggestions[0].intentAlignment).toBeGreaterThan(0.7);
      }
    });

    it('should infer refactoring intent from refactor context', async () => {
      const context: CompletionContext = {
        filePath: 'refactor-utils.ts',
        content: 'function refactorLegacyCode() {\n  // TODO: refactor this',
        cursorPosition: { line: 1, column: 20 },
        language: 'typescript'
      };

      const result = await thoughtCompletion.completeThought(context);

      // Should generate implementation suggestions for refactoring
      const implSuggestions = result.suggestions.filter(s => 
        s.type === CompletionType.FUNCTION_IMPLEMENTATION
      );
      
      expect(implSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('performance optimization', () => {
    it('should complete thoughts within reasonable time', async () => {
      const context: CompletionContext = {
        filePath: 'large-file.ts',
        content: 'function test() {}\n'.repeat(100),
        cursorPosition: { line: 50, column: 0 },
        language: 'typescript'
      };

      const startTime = Date.now();
      const result = await thoughtCompletion.completeThought(context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.executionTime).toBeLessThan(5000);
    });

    it('should handle concurrent completion requests', async () => {
      const context: CompletionContext = {
        filePath: 'concurrent.ts',
        content: 'function test() {}',
        cursorPosition: { line: 0, column: 18 },
        language: 'typescript'
      };

      const promises = Array(5).fill(null).map(() => 
        thoughtCompletion.completeThought(context)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.suggestions).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle malformed content gracefully', async () => {
      const context: CompletionContext = {
        filePath: 'malformed.ts',
        content: 'function test( { invalid syntax here',
        cursorPosition: { line: 0, column: 30 },
        language: 'typescript'
      };

      const result = await thoughtCompletion.completeThought(context);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle friction protocol errors gracefully', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'function test() {}',
        cursorPosition: { line: 0, column: 18 },
        language: 'typescript'
      };

      mockFrictionProtocol.runIntegratedDetection.mockRejectedValue(
        new Error('Friction protocol error')
      );

      const result = await thoughtCompletion.completeThought(context);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.metadata.proactiveActions).toHaveLength(0);
      expect(result.metadata.frictionPointsAddressed).toBe(0);
    });
  });

  describe('suggestion ranking', () => {
    it('should rank suggestions by intent alignment and confidence', async () => {
      const context: CompletionContext = {
        filePath: 'test.ts',
        content: 'function calculateSum(a: number, b: number) {\n  // TODO: implement',
        cursorPosition: { line: 1, column: 20 },
        language: 'typescript'
      };

      const intent: DeveloperIntent = {
        primaryGoal: { 
          type: GoalType.IMPLEMENTATION, 
          description: 'Implementing function', 
          priority: 1,
          measurable: true,
          criteria: ['Function works correctly', 'Passes all tests']
        },
        subGoals: [{ 
          type: GoalType.TESTING, 
          description: 'Adding tests', 
          priority: 2,
          measurable: true,
          criteria: ['Test coverage > 90%']
        }],
        constraints: [],
        preferences: [],
        confidence: 0.8,
        contextualFactors: []
      };

      const result = await thoughtCompletion.completeThought(context, intent);

      if (result.suggestions.length > 1) {
        // Suggestions should be ranked by intent alignment and confidence
        for (let i = 0; i < result.suggestions.length - 1; i++) {
          const current = result.suggestions[i];
          const next = result.suggestions[i + 1];
          
          // Current should have higher or equal intent alignment
          expect(current.intentAlignment).toBeGreaterThanOrEqual(next.intentAlignment - 0.1);
        }
      }
    });
  });

  describe('caching and learning', () => {
    it('should cache completion results for similar contexts', async () => {
      const context: CompletionContext = {
        filePath: 'cache-test.ts',
        content: 'function test() {}',
        cursorPosition: { line: 0, column: 18 },
        language: 'typescript'
      };

      // First completion
      const result1 = await thoughtCompletion.completeThought(context);
      
      // Second completion with same context
      const result2 = await thoughtCompletion.completeThought(context);

      // Should have similar results (caching effect)
      expect(result1.suggestions.length).toBe(result2.suggestions.length);
    });

    it('should maintain completion history for stats', async () => {
      const contexts = [
        {
          filePath: 'test1.ts',
          content: 'function test1() {}',
          cursorPosition: { line: 0, column: 19 },
          language: 'typescript'
        },
        {
          filePath: 'test2.ts',
          content: 'function test2() {}',
          cursorPosition: { line: 0, column: 19 },
          language: 'typescript'
        }
      ];

      for (const context of contexts) {
        await thoughtCompletion.completeThought(context);
      }

      const stats = thoughtCompletion.getCompletionStats();
      expect(stats.totalCompletions).toBeGreaterThan(0);
    });
  });
});