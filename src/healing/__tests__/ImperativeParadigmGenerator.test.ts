/**
 * Tests for ImperativeParadigmGenerator
 */

import { ImperativeParadigmGenerator, ImperativePattern } from '../ImperativeParadigmGenerator';
import { FixGenerationContext, CodingStyle, VerbosityLevel, RiskTolerance, OptimizationGoal } from '../ParadigmGenerator';
import { ComputationalIssue, ProblemType, SeverityLevel, ParadigmType, ProblemContext } from '../../types/core';

describe('ImperativeParadigmGenerator', () => {
  let generator: ImperativeParadigmGenerator;
  let mockContext: FixGenerationContext;

  beforeEach(() => {
    generator = new ImperativeParadigmGenerator();
    
    mockContext = {
      issue: {
        id: 'test-issue',
        type: ProblemType.PERFORMANCE_BOTTLENECK,
        severity: SeverityLevel.MEDIUM,
        context: {
          file: 'test.ts',
          line: 1,
          column: 1,
          scope: ['global'],
          relatedFiles: []
        } as ProblemContext,
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: 'PERFORMANCE' as any,
          confidence: 0.9,
          tags: []
        }
      } as ComputationalIssue,
      relatedIssues: [],
      codeContext: {
        sourceCode: 'for (let i = 0; i < 10; i++) { console.log(i); }',
        ast: null,
        symbols: {
          variables: new Map(),
          functions: new Map(),
          classes: new Map(),
          imports: new Map(),
          exports: new Map()
        },
        dependencies: {
          nodes: new Map(),
          edges: [],
          cycles: []
        },
        typeInformation: {
          typeMap: new Map(),
          typeConstraints: [],
          genericTypes: []
        },
        semanticModel: {
          controlFlow: {
            nodes: [],
            edges: [],
            entryPoint: 'main',
            exitPoints: []
          },
          dataFlow: {
            variables: new Map(),
            definitions: [],
            uses: []
          },
          callGraph: {
            functions: new Map(),
            calls: []
          },
          invariants: []
        },
        metrics: {
          linesOfCode: 1,
          cyclomaticComplexity: 2,
          cognitiveComplexity: 2,
          maintainabilityIndex: 70,
          technicalDebt: 0,
          testCoverage: 0,
          duplicatedLines: 0
        }
      },
      constraints: [],
      preferences: {
        paradigm: ParadigmType.IMPERATIVE,
        style: CodingStyle.PROCEDURAL,
        verbosity: VerbosityLevel.EXPLICIT,
        riskTolerance: RiskTolerance.MODERATE,
        optimizationGoals: [OptimizationGoal.PERFORMANCE, OptimizationGoal.READABILITY]
      },
      historicalData: []
    };
  });

  describe('Basic Functionality', () => {
    test('should be properly initialized', () => {
      expect(generator.paradigm).toBe(ParadigmType.IMPERATIVE);
      expect(generator.supportedProblemTypes).toContain(ProblemType.PERFORMANCE_BOTTLENECK);
      expect(generator.capabilities.maxComplexity).toBe(200);
      expect(generator.capabilities.supportedLanguages).toContain('typescript');
      expect(generator.capabilities.canOptimize).toBe(true);
    });

    test('should generate imperative fixes', async () => {
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.analysisTime).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.alternatives).toBeDefined();
    });
  });

  describe('Loop Optimizations', () => {
    test('should optimize simple for loops', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 3; i++) { result.push(i * 2); }';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.candidates.length).toBeGreaterThan(0);
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.performance).toBeGreaterThan(0.5);
      }
    });

    test('should identify loop unrolling opportunities', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 2; i++) { console.log(i); }';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning.appliedPatterns).toContain('explicit-loops');
    });

    test('should handle nested loops appropriately', async () => {
      mockContext.codeContext.sourceCode = `
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            matrix[i][j] = i * j;
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });

    test('should optimize while loops', async () => {
      mockContext.codeContext.sourceCode = 'let i = 0; while (i < 10) { console.log(i); i++; }';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('State Management Optimizations', () => {
    test('should optimize variable assignments', async () => {
      mockContext.codeContext.sourceCode = 'let x = 5; x = x + 1; let y = 10; y = y - 1;';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).toContain('++');
        expect(fix.implementation.targetCode).toContain('--');
      }
    });

    test('should handle compound assignments', async () => {
      mockContext.codeContext.sourceCode = 'let sum = 0; sum = sum + value; count = count + 1;';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).toContain('+=');
      }
    });

    test('should identify mutable state patterns', async () => {
      mockContext.codeContext.sourceCode = 'let counter = 0; let total = 0; counter++; total += counter;';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning.appliedPatterns).toContain('increment-operators');
    });
  });

  describe('Control Flow Optimizations', () => {
    test('should optimize nested if statements with early returns', async () => {
      mockContext.codeContext.sourceCode = `
        function validate(data) {
          if (data) {
            if (data.isValid) {
              return processData(data);
            }
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.readability).toBeGreaterThan(0.5);
      }
    });

    test('should identify early return opportunities', async () => {
      mockContext.codeContext.sourceCode = `
        if (condition1) {
          if (condition2) {
            if (condition3) {
              doSomething();
            }
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.reasoning.appliedPatterns).toContain('early-return');
    });

    test('should handle complex branching logic', async () => {
      mockContext.codeContext.sourceCode = `
        if (a > 0) {
          if (b > 0) {
            result = a + b;
          } else {
            result = a - b;
          }
        } else {
          result = 0;
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });
  });

  describe('Performance Analysis', () => {
    test('should prioritize performance improvements', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 1000; i++) { heavyOperation(i); }';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.performance).toBeGreaterThan(0.6);
      }
    });

    test('should calculate performance scores correctly', async () => {
      mockContext.codeContext.sourceCode = 'let sum = 0; for (let i = 0; i < 100; i++) { sum += i; }';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle performance bottlenecks', async () => {
      mockContext.issue.type = ProblemType.PERFORMANCE_BOTTLENECK;
      mockContext.codeContext.sourceCode = `
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            result += expensiveCalculation(data[i][j]);
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.candidates.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    test('should validate performance improvements', async () => {
      const mockFix = {
        id: 'test-fix',
        paradigm: ParadigmType.IMPERATIVE,
        implementation: {
          type: 'OPTIMIZATION' as any,
          sourceCode: 'for (let i = 0; i < 10; i++) { console.log(i); }',
          targetCode: 'for (let i = 0; i < 10; ++i) { console.log(i); }',
          diff: { additions: [], deletions: [], modifications: [] },
          reversible: true
        },
        confidence: 0.8,
        estimatedImpact: {
          performance: 0.7,
          readability: 0.6,
          maintainability: 0.5,
          testability: 0.4,
          security: 0.3
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.IMPERATIVE,
          estimatedTime: 100,
          riskLevel: 'LOW' as any
        }
      };

      const validation = await generator.validateFix(mockFix, mockContext);
      
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.5);
    });

    test('should validate control flow correctness', async () => {
      const mockFix = {
        id: 'test-fix',
        paradigm: ParadigmType.IMPERATIVE,
        implementation: {
          type: 'REFACTORING' as any,
          sourceCode: 'if (condition) { doSomething(); }',
          targetCode: 'if (!condition) return; doSomething();',
          diff: { additions: [], deletions: [], modifications: [] },
          reversible: true
        },
        confidence: 0.7,
        estimatedImpact: {
          performance: 0.3,
          readability: 0.8,
          maintainability: 0.7,
          testability: 0.6,
          security: 0.5
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.IMPERATIVE,
          estimatedTime: 80,
          riskLevel: 'LOW' as any
        }
      };

      const validation = await generator.validateFix(mockFix, mockContext);
      
      expect(validation.isValid).toBe(true);
    });

    test('should detect invalid control flow', async () => {
      const mockFix = {
        id: 'test-fix',
        paradigm: ParadigmType.IMPERATIVE,
        implementation: {
          type: 'MODIFICATION' as any,
          sourceCode: 'if (condition) { doSomething(); }',
          targetCode: 'if (condition { doSomething(); }', // Missing closing parenthesis
          diff: { additions: [], deletions: [], modifications: [] },
          reversible: true
        },
        confidence: 0.5,
        estimatedImpact: {
          performance: 0.2,
          readability: 0.3,
          maintainability: 0.3,
          testability: 0.3,
          security: 0.3
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.IMPERATIVE,
          estimatedTime: 60,
          riskLevel: 'HIGH' as any
        }
      };

      const validation = await generator.validateFix(mockFix, mockContext);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Recognition', () => {
    test('should identify explicit loop patterns', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < array.length; i++) { process(array[i]); }';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.reasoning.appliedPatterns).toContain('explicit-loops');
    });

    test('should identify compound assignment patterns', async () => {
      mockContext.codeContext.sourceCode = 'total += value; count -= 1;';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.reasoning.appliedPatterns).toContain('compound-assignment');
    });

    test('should identify increment operator patterns', async () => {
      mockContext.codeContext.sourceCode = 'counter++; index--;';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.reasoning.appliedPatterns).toContain('increment-operators');
    });
  });

  describe('Risk Assessment', () => {
    test('should assess low risk for simple optimizations', async () => {
      mockContext.codeContext.sourceCode = 'let x = x + 1;';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.metadata.riskLevel).toBe('LOW');
      }
    });

    test('should assess higher risk for complex optimizations', async () => {
      mockContext.codeContext.sourceCode = `
        for (let i = 0; i < 1000; i++) {
          for (let j = 0; j < 1000; j++) {
            complexOperation(i, j);
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result.reasoning.riskAssessment.overallRisk).toBeDefined();
    });
  });

  describe('Impact Calculation', () => {
    test('should favor performance in impact calculations', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 100; i++) { work(i); }';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.performance).toBeGreaterThan(0.6);
      }
    });

    test('should calculate realistic readability impact', async () => {
      mockContext.codeContext.sourceCode = 'if (a) { if (b) { if (c) { doWork(); } } }';
      
      const result = await generator.generateFix(mockContext);
      
      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.readability).toBeGreaterThan(0.4);
      }
    });
  });

  describe('Alternative Approaches', () => {
    test('should provide alternative paradigm suggestions', async () => {
      const result = await generator.generateFix(mockContext);
      
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
      
      const functionalAlternative = result.alternatives.find(
        alt => alt.paradigm === ParadigmType.FUNCTIONAL
      );
      expect(functionalAlternative).toBeDefined();
    });

    test('should include pros and cons for alternatives', async () => {
      const result = await generator.generateFix(mockContext);
      
      result.alternatives.forEach(alternative => {
        expect(alternative.pros).toBeDefined();
        expect(alternative.cons).toBeDefined();
        expect(alternative.pros.length).toBeGreaterThan(0);
        expect(alternative.cons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty code', async () => {
      mockContext.codeContext.sourceCode = '';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });

    test('should handle single line code', async () => {
      mockContext.codeContext.sourceCode = 'let x = 5;';
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should handle complex nested structures', async () => {
      mockContext.codeContext.sourceCode = `
        function complexFunction() {
          for (let i = 0; i < data.length; i++) {
            if (data[i].isValid) {
              while (data[i].hasMore) {
                if (data[i].process()) {
                  break;
                }
                data[i].next();
              }
            }
          }
        }
      `;
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });

    test('should handle syntax errors gracefully', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0 i < 10; i++) { console.log(i); }'; // Missing semicolon
      
      const result = await generator.generateFix(mockContext);
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });
  });

  describe('Integration with Base Class', () => {
    test('should properly extend AbstractParadigmGenerator', () => {
      expect(generator).toBeInstanceOf(ImperativeParadigmGenerator);
      expect(typeof generator.generateFix).toBe('function');
      expect(typeof generator.validateFix).toBe('function');
      expect(typeof generator.estimateImpact).toBe('function');
    });

    test('should implement required abstract methods', async () => {
      const mockFix = {
        id: 'test-fix',
        paradigm: ParadigmType.IMPERATIVE,
        implementation: {
          type: 'OPTIMIZATION' as any,
          sourceCode: 'let x = 1;',
          targetCode: 'let x = 1;',
          diff: { additions: [], deletions: [], modifications: [] },
          reversible: true
        },
        confidence: 0.8,
        estimatedImpact: {
          performance: 0.7,
          readability: 0.6,
          maintainability: 0.5,
          testability: 0.4,
          security: 0.3
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.IMPERATIVE,
          estimatedTime: 100,
          riskLevel: 'LOW' as any
        }
      };

      // Test validation
      const validation = await generator.validateFix(mockFix, mockContext);
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.confidence).toBeDefined();

      // Test impact estimation
      const impact = await generator.estimateImpact(mockFix, mockContext);
      expect(impact).toBeDefined();
      expect(impact.performance).toBeDefined();
      expect(impact.readability).toBeDefined();
      expect(impact.maintainability).toBeDefined();
      expect(impact.testability).toBeDefined();
      expect(impact.security).toBeDefined();
    });

    test('should handle learning from outcomes', async () => {
      const mockOutcome = {
        success: true,
        timeToApply: 100,
        sideEffects: [],
        qualityImprovement: {
          beforeMetrics: mockContext.codeContext.metrics,
          afterMetrics: mockContext.codeContext.metrics,
          improvement: 0.2
        },
        userSatisfaction: 4
      };

      await generator.learnFromOutcome(mockContext, mockOutcome);
      
      // Should not throw and should handle the learning process
      expect(true).toBe(true);
    });

    test('should calculate confidence for different issue types', () => {
      const performanceIssue = {
        ...mockContext.issue,
        type: ProblemType.PERFORMANCE_BOTTLENECK
      };
      
      const syntaxIssue = {
        ...mockContext.issue,
        type: ProblemType.SYNTAX_ERROR
      };
      
      const unknownIssue = {
        ...mockContext.issue,
        type: ProblemType.UNKNOWN
      };

      const performanceConfidence = generator.getConfidenceForIssue(performanceIssue);
      const syntaxConfidence = generator.getConfidenceForIssue(syntaxIssue);
      const unknownConfidence = generator.getConfidenceForIssue(unknownIssue);

      expect(performanceConfidence).toBeGreaterThan(0);
      expect(syntaxConfidence).toBeGreaterThan(0);
      expect(unknownConfidence).toBe(0); // Not supported
    });
  });
});