/**
 * Tests for Thought Completion Friction Detector
 */

import { ThoughtCompletionFrictionDetector, ThoughtCompletionFrictionPoint, DEFAULT_THOUGHT_COMPLETION_CONFIG } from '../ThoughtCompletionFrictionDetector';
import { ThoughtCompletion, CompletionType } from '../../intent/ThoughtCompletion';
import { IntegratedFrictionProtocol } from '../IntegratedFrictionProtocol';
import { FrictionType } from '../FrictionDetector';
import { SeverityLevel } from '../../types/core';

// Mock dependencies
jest.mock('../../intent/ThoughtCompletion');
jest.mock('../IntegratedFrictionProtocol');

describe('ThoughtCompletionFrictionDetector', () => {
  let detector: ThoughtCompletionFrictionDetector;
  let mockThoughtCompletion: jest.Mocked<ThoughtCompletion>;
  let mockFrictionProtocol: jest.Mocked<IntegratedFrictionProtocol>;

  beforeEach(() => {
    mockFrictionProtocol = new IntegratedFrictionProtocol() as jest.Mocked<IntegratedFrictionProtocol>;
    mockThoughtCompletion = new ThoughtCompletion(mockFrictionProtocol) as jest.Mocked<ThoughtCompletion>;
    
    // Mock the completeThought method
    mockThoughtCompletion.completeThought = jest.fn().mockResolvedValue({
      suggestions: [
        {
          id: 'test-suggestion-1',
          type: CompletionType.FUNCTION_SIGNATURE,
          content: 'function calculateSum(a: number, b: number): number {\n  // TODO: Implement\n}',
          description: 'Function signature for calculateSum',
          confidence: 0.8,
          intentAlignment: 0.9,
          priority: 1,
          metadata: {
            language: 'typescript',
            paradigm: 'functional',
            estimatedTime: 30,
            dependencies: [],
            relatedFiles: [],
            testCoverage: 0,
            complexity: 'low',
            riskLevel: 'low'
          }
        },
        {
          id: 'test-suggestion-2',
          type: CompletionType.TEST_CASE,
          content: 'describe("calculateSum", () => {\n  test("should add two numbers", () => {\n    expect(calculateSum(2, 3)).toBe(5);\n  });\n});',
          description: 'Test case for calculateSum',
          confidence: 0.75,
          intentAlignment: 0.85,
          priority: 2,
          metadata: {
            language: 'typescript',
            paradigm: 'testing',
            estimatedTime: 90,
            dependencies: ['jest'],
            relatedFiles: [],
            testCoverage: 1.0,
            complexity: 'medium',
            riskLevel: 'low'
          }
        }
      ],
      intentAlignment: 0.875,
      confidence: 0.775,
      executionTime: 150,
      metadata: {
        totalSuggestions: 2,
        highConfidenceSuggestions: 1,
        frictionPointsAddressed: 0,
        proactiveActions: []
      }
    });

    detector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(detector.getName()).toBe('ThoughtCompletionFrictionDetector');
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        ...DEFAULT_THOUGHT_COMPLETION_CONFIG,
        minimumConfidenceThreshold: 0.9,
        maxSuggestionsPerType: 1
      };

      const customDetector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion, customConfig);
      expect(customDetector.getName()).toBe('ThoughtCompletionFrictionDetector');
    });
  });

  describe('detect', () => {
    it('should detect friction points from thought completion suggestions', async () => {
      const context = {
        filePath: 'test.ts',
        content: 'function calculateSum(',
        cursorPosition: { line: 0, column: 20 },
        language: 'typescript'
      };

      const frictionPoints = await detector.detect(context);

      expect(mockThoughtCompletion.completeThought).toHaveBeenCalledWith({
        filePath: 'test.ts',
        content: 'function calculateSum(',
        cursorPosition: { line: 0, column: 20 },
        language: 'typescript',
        selectedText: undefined,
        projectContext: undefined
      });

      expect(frictionPoints).toHaveLength(2);
      
      const functionSigPoint = frictionPoints.find(fp => fp.completionType === CompletionType.FUNCTION_SIGNATURE);
      expect(functionSigPoint).toBeDefined();
      expect(functionSigPoint!.type).toBe(FrictionType.SYNTAX);
      expect(functionSigPoint!.suggestedCompletion).toContain('function calculateSum');
      expect(functionSigPoint!.intentAlignment).toBe(0.9);

      const testCasePoint = frictionPoints.find(fp => fp.completionType === CompletionType.TEST_CASE);
      expect(testCasePoint).toBeDefined();
      expect(testCasePoint!.type).toBe(FrictionType.PERFORMANCE);
      expect(testCasePoint!.suggestedCompletion).toContain('describe');
    });

    it('should filter suggestions based on confidence threshold', async () => {
      const customConfig = {
        ...DEFAULT_THOUGHT_COMPLETION_CONFIG,
        minimumConfidenceThreshold: 0.8 // This should filter out the test case (0.75)
      };

      const customDetector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion, customConfig);

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await customDetector.detect(context);

      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].completionType).toBe(CompletionType.FUNCTION_SIGNATURE);
    });

    it('should filter suggestions based on intent alignment threshold', async () => {
      const customConfig = {
        ...DEFAULT_THOUGHT_COMPLETION_CONFIG,
        minimumIntentAlignment: 0.9 // This should filter out the test case (0.85)
      };

      const customDetector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion, customConfig);

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await customDetector.detect(context);

      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].completionType).toBe(CompletionType.FUNCTION_SIGNATURE);
    });

    it('should limit suggestions per type', async () => {
      // Mock multiple suggestions of the same type
      mockThoughtCompletion.completeThought.mockResolvedValue({
        suggestions: [
          {
            id: 'func-1',
            type: CompletionType.FUNCTION_SIGNATURE,
            content: 'function test1() {}',
            description: 'Function 1',
            confidence: 0.9,
            intentAlignment: 0.8,
            priority: 1,
            metadata: {
              language: 'typescript',
              paradigm: 'functional',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          },
          {
            id: 'func-2',
            type: CompletionType.FUNCTION_SIGNATURE,
            content: 'function test2() {}',
            description: 'Function 2',
            confidence: 0.8,
            intentAlignment: 0.7,
            priority: 1,
            metadata: {
              language: 'typescript',
              paradigm: 'functional',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          },
          {
            id: 'func-3',
            type: CompletionType.FUNCTION_SIGNATURE,
            content: 'function test3() {}',
            description: 'Function 3',
            confidence: 0.7,
            intentAlignment: 0.6,
            priority: 1,
            metadata: {
              language: 'typescript',
              paradigm: 'functional',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          }
        ],
        intentAlignment: 0.7,
        confidence: 0.8,
        executionTime: 100,
        metadata: {
          totalSuggestions: 3,
          highConfidenceSuggestions: 2,
          frictionPointsAddressed: 0,
          proactiveActions: []
        }
      });

      const customConfig = {
        ...DEFAULT_THOUGHT_COMPLETION_CONFIG,
        maxSuggestionsPerType: 2
      };

      const customDetector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion, customConfig);

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await customDetector.detect(context);

      expect(frictionPoints).toHaveLength(2);
      // Should keep the highest confidence suggestions
      expect(frictionPoints[0].metadata?.confidence).toBe(0.9);
      expect(frictionPoints[1].metadata?.confidence).toBe(0.8);
    });

    it('should handle disabled proactive completion', async () => {
      const customConfig = {
        ...DEFAULT_THOUGHT_COMPLETION_CONFIG,
        enableProactiveCompletion: false
      };

      const customDetector = new ThoughtCompletionFrictionDetector(mockThoughtCompletion, customConfig);

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await customDetector.detect(context);

      expect(frictionPoints).toHaveLength(0);
      expect(mockThoughtCompletion.completeThought).not.toHaveBeenCalled();
    });

    it('should handle invalid context gracefully', async () => {
      const frictionPoints = await detector.detect(null);
      expect(frictionPoints).toHaveLength(0);

      const frictionPoints2 = await detector.detect('invalid');
      expect(frictionPoints2).toHaveLength(0);
    });

    it('should infer language from file path', async () => {
      const context = {
        filePath: 'test.py',
        content: 'def test():',
        cursorPosition: { line: 0, column: 11 }
      };

      await detector.detect(context);

      expect(mockThoughtCompletion.completeThought).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'python'
        })
      );
    });

    it('should handle thought completion errors gracefully', async () => {
      mockThoughtCompletion.completeThought.mockRejectedValue(new Error('Completion failed'));

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await detector.detect(context);

      expect(frictionPoints).toHaveLength(0);
    });
  });

  describe('eliminate', () => {
    it('should eliminate friction by applying completion', async () => {
      const frictionPoint: ThoughtCompletionFrictionPoint = {
        id: 'test-friction-1',
        type: FrictionType.SYNTAX,
        severity: SeverityLevel.HIGH,
        description: 'Proactive suggestion: Function signature',
        location: { 
          file: 'test.ts', 
          line: 0, 
          column: 20,
          scope: ['global'],
          context: 'function_declaration'
        },
        metadata: { 
          confidence: 0.8, 
          recurrence: 1,
          resolutionHistory: [],
          tags: ['completion', 'function']
        },
        timestamp: Date.now(),
        eliminated: false,
        completionType: CompletionType.FUNCTION_SIGNATURE,
        suggestedCompletion: 'function test() {}',
        intentAlignment: 0.9,
        estimatedImplementationTime: 30
      };

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(true);
      expect(result).toBe(true);
    });

    it('should handle elimination errors gracefully', async () => {
      const frictionPoint: ThoughtCompletionFrictionPoint = {
        id: 'test-friction-1',
        type: FrictionType.SYNTAX,
        severity: SeverityLevel.HIGH,
        description: 'Proactive suggestion: Function signature',
        location: { 
          file: 'test.ts', 
          line: 0, 
          column: 20,
          scope: ['global'],
          context: 'function_declaration'
        },
        metadata: { 
          confidence: 0.8,
          recurrence: 1,
          resolutionHistory: [],
          tags: ['completion']
        },
        timestamp: Date.now(),
        eliminated: false,
        completionType: CompletionType.FUNCTION_SIGNATURE,
        suggestedCompletion: 'function test() {}',
        intentAlignment: 0.9,
        estimatedImplementationTime: 30
      };

      // Mock console.error to avoid test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by making the elimination fail
      jest.spyOn(detector as any, 'simulateCompletionApplication').mockRejectedValue(new Error('Simulation failed'));

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(false);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getStats', () => {
    it('should return empty stats for new detector', () => {
      const stats = detector.getStats();

      expect(stats.totalDetected).toBe(0);
      expect(stats.totalEliminated).toBe(0);
      expect(stats.eliminationRate).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.averageIntentAlignment).toBe(0);
      expect(Object.keys(stats.completionTypeBreakdown)).toHaveLength(0);
    });

    it('should calculate stats after detection and elimination', async () => {
      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      // Detect friction points
      const frictionPoints = await detector.detect(context);
      
      // Eliminate one friction point
      if (frictionPoints.length > 0) {
        await detector.eliminate(frictionPoints[0]);
      }

      const stats = detector.getStats();

      expect(stats.totalDetected).toBe(2);
      expect(stats.totalEliminated).toBe(1);
      expect(stats.eliminationRate).toBe(0.5);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageIntentAlignment).toBeGreaterThan(0);
      expect(stats.completionTypeBreakdown[CompletionType.FUNCTION_SIGNATURE]).toBe(1);
      expect(stats.completionTypeBreakdown[CompletionType.TEST_CASE]).toBe(1);
    });
  });

  describe('completion type mapping', () => {
    it('should map completion types to appropriate friction types', async () => {
      const testCases = [
        { completionType: CompletionType.FUNCTION_SIGNATURE, expectedFrictionType: FrictionType.SYNTAX },
        { completionType: CompletionType.FUNCTION_IMPLEMENTATION, expectedFrictionType: FrictionType.SYNTAX },
        { completionType: CompletionType.TEST_CASE, expectedFrictionType: FrictionType.PERFORMANCE },
        { completionType: CompletionType.COMMENT, expectedFrictionType: FrictionType.CONFIGURATION },
        { completionType: CompletionType.IMPORT_STATEMENT, expectedFrictionType: FrictionType.DEPENDENCY },
        { completionType: CompletionType.TYPE_DEFINITION, expectedFrictionType: FrictionType.SYNTAX },
        { completionType: CompletionType.CLASS_DEFINITION, expectedFrictionType: FrictionType.ARCHITECTURAL },
        { completionType: CompletionType.INTERFACE_DEFINITION, expectedFrictionType: FrictionType.ARCHITECTURAL },
        { completionType: CompletionType.VARIABLE_DECLARATION, expectedFrictionType: FrictionType.SYNTAX },
        { completionType: CompletionType.ERROR_HANDLING, expectedFrictionType: FrictionType.CONNECTIVITY }
      ];

      for (const testCase of testCases) {
        mockThoughtCompletion.completeThought.mockResolvedValue({
          suggestions: [{
            id: 'test',
            type: testCase.completionType,
            content: 'test content',
            description: 'test description',
            confidence: 0.8,
            intentAlignment: 0.8,
            priority: 1,
            metadata: {
              language: 'typescript',
              paradigm: 'test',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          }],
          intentAlignment: 0.8,
          confidence: 0.8,
          executionTime: 100,
          metadata: {
            totalSuggestions: 1,
            highConfidenceSuggestions: 1,
            frictionPointsAddressed: 0,
            proactiveActions: []
          }
        });

        const context = {
          filePath: 'test.ts',
          content: 'test content',
          language: 'typescript'
        };

        const frictionPoints = await detector.detect(context);
        expect(frictionPoints).toHaveLength(1);
        expect(frictionPoints[0].type).toBe(testCase.expectedFrictionType);
      }
    });
  });

  describe('severity calculation', () => {
    it('should calculate higher severity for high confidence and intent alignment', async () => {
      mockThoughtCompletion.completeThought.mockResolvedValue({
        suggestions: [
          {
            id: 'high-quality',
            type: CompletionType.FUNCTION_SIGNATURE,
            content: 'function test() {}',
            description: 'High quality suggestion',
            confidence: 0.95,
            intentAlignment: 0.9,
            priority: 1,
            metadata: {
              language: 'typescript',
              paradigm: 'functional',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          },
          {
            id: 'low-quality',
            type: CompletionType.FUNCTION_SIGNATURE,
            content: 'function test() {}',
            description: 'Low quality suggestion',
            confidence: 0.5,
            intentAlignment: 0.4,
            priority: 5,
            metadata: {
              language: 'typescript',
              paradigm: 'functional',
              estimatedTime: 30,
              dependencies: [],
              relatedFiles: [],
              testCoverage: 0,
              complexity: 'low',
              riskLevel: 'low'
            }
          }
        ],
        intentAlignment: 0.65,
        confidence: 0.725,
        executionTime: 100,
        metadata: {
          totalSuggestions: 2,
          highConfidenceSuggestions: 1,
          frictionPointsAddressed: 0,
          proactiveActions: []
        }
      });

      const context = {
        filePath: 'test.ts',
        content: 'function test() {}',
        language: 'typescript'
      };

      const frictionPoints = await detector.detect(context);
      expect(frictionPoints).toHaveLength(2);

      const highQualityPoint = frictionPoints.find(fp => fp.id.includes('high-quality'));
      const lowQualityPoint = frictionPoints.find(fp => fp.id.includes('low-quality'));

      expect(highQualityPoint!.severity).toBeGreaterThan(lowQualityPoint!.severity);
    });
  });
});