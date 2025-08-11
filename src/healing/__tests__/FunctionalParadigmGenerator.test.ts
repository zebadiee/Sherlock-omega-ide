/**
 * Tests for FunctionalParadigmGenerator
 */

import { FunctionalParadigmGenerator, ConceptType, PurityLevel, ImmutabilityLevel } from '../FunctionalParadigmGenerator';
import { FixGenerationContext, CodingStyle, VerbosityLevel, RiskTolerance, OptimizationGoal } from '../ParadigmGenerator';
import { ComputationalIssue, ProblemType, SeverityLevel, ParadigmType, ProblemContext } from '../../types/core';

describe('FunctionalParadigmGenerator', () => {
  let generator: FunctionalParadigmGenerator;
  let mockContext: FixGenerationContext;

  beforeEach(() => {
    generator = new FunctionalParadigmGenerator();

    mockContext = {
      issue: {
        id: 'test-issue',
        type: ProblemType.SYNTAX_ERROR,
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
          detectedBy: 'SYNTAX' as any,
          confidence: 0.9,
          tags: []
        }
      } as ComputationalIssue,
      relatedIssues: [],
      codeContext: {
        sourceCode: 'let x = 1; x = 2;',
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
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          maintainabilityIndex: 80,
          technicalDebt: 0,
          testCoverage: 0,
          duplicatedLines: 0
        }
      },
      constraints: [],
      preferences: {
        paradigm: ParadigmType.FUNCTIONAL,
        style: CodingStyle.FUNCTIONAL,
        verbosity: VerbosityLevel.CONCISE,
        riskTolerance: RiskTolerance.CONSERVATIVE,
        optimizationGoals: [OptimizationGoal.READABILITY, OptimizationGoal.MAINTAINABILITY]
      },
      historicalData: []
    };
  });

  describe('Basic Functionality', () => {
    test('should be properly initialized', () => {
      expect(generator.paradigm).toBe(ParadigmType.FUNCTIONAL);
      expect(generator.supportedProblemTypes).toContain(ProblemType.SYNTAX_ERROR);
      expect(generator.capabilities.maxComplexity).toBe(150);
      expect(generator.capabilities.supportedLanguages).toContain('typescript');
    });

    test('should generate functional fixes', async () => {
      const result = await generator.generateFix(mockContext);

      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.analysisTime).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.alternatives).toBeDefined();
    });
  });

  describe('Immutability Transformations', () => {
    test('should transform let/var to const', async () => {
      mockContext.codeContext.sourceCode = 'let x = 1; let y = 2;';

      const result = await generator.generateFix(mockContext);

      expect(result.candidates.length).toBeGreaterThan(0);
      const fix = result.candidates[0];
      expect(fix.implementation.targetCode).toContain('const');
      expect(fix.implementation.targetCode).not.toContain('let');
    });

    test('should replace array mutations with immutable operations', async () => {
      mockContext.codeContext.sourceCode = 'const arr = [1, 2]; arr.push(3);';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).toContain('concat');
        expect(fix.implementation.targetCode).not.toContain('push');
      }
    });

    test('should handle array pop operations', async () => {
      mockContext.codeContext.sourceCode = 'const arr = [1, 2, 3]; arr.pop();';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).toContain('slice(0, -1)');
        expect(fix.implementation.targetCode).not.toContain('pop');
      }
    });
  });

  describe('Pure Function Transformations', () => {
    test('should extract side effects', async () => {
      mockContext.codeContext.sourceCode = 'function test() { console.log("hello"); return 42; }';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).not.toContain('console.log');
      }
    });

    test('should identify pure functions', async () => {
      mockContext.codeContext.sourceCode = 'function add(a, b) { return a + b; }';

      const result = await generator.generateFix(mockContext);

      // Pure functions should have high confidence
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Higher-Order Function Transformations', () => {
    test('should transform for loops to map operations', async () => {
      mockContext.codeContext.sourceCode = `
        const result = [];
        for (let i = 0; i < items.length; i++) {
          result.push(items[i] * 2);
        }
      `;

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.implementation.targetCode).toContain('map');
      }
    });

    test('should recognize existing functional operations', async () => {
      mockContext.codeContext.sourceCode = 'const doubled = items.map(x => x * 2);';

      const result = await generator.generateFix(mockContext);

      // Should have high functional score
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Validation', () => {
    test('should validate purity correctly', async () => {
      const pureCode = 'function add(a, b) { return a + b; }';
      const impureCode = 'function log(msg) { console.log(msg); return msg; }';

      mockContext.codeContext.sourceCode = pureCode;
      const pureResult = await generator.generateFix(mockContext);

      mockContext.codeContext.sourceCode = impureCode;
      const impureResult = await generator.generateFix(mockContext);

      expect(pureResult.confidence).toBeGreaterThan(impureResult.confidence);
    });

    test('should validate immutability correctly', async () => {
      const immutableCode = 'const x = 1; const y = x + 1;';
      const mutableCode = 'let x = 1; x = x + 1;';

      mockContext.codeContext.sourceCode = immutableCode;
      const immutableResult = await generator.generateFix(mockContext);

      mockContext.codeContext.sourceCode = mutableCode;
      const mutableResult = await generator.generateFix(mockContext);

      expect(immutableResult.confidence).toBeGreaterThan(mutableResult.confidence);
    });
  });

  describe('Pattern Recognition', () => {
    test('should identify immutability opportunities', async () => {
      mockContext.codeContext.sourceCode = 'let x = 1; let y = 2;';

      const result = await generator.generateFix(mockContext);

      expect(result.reasoning.appliedPatterns).toContain('immutable-variables');
    });

    test('should identify higher-order function opportunities', async () => {
      mockContext.codeContext.sourceCode = 'const doubled = items.map(x => x * 2);';

      const result = await generator.generateFix(mockContext);

      expect(result.reasoning.appliedPatterns).toContain('higher-order-functions');
    });

    test('should identify arrow function usage', async () => {
      mockContext.codeContext.sourceCode = 'const add = (a, b) => a + b;';

      const result = await generator.generateFix(mockContext);

      expect(result.reasoning.appliedPatterns).toContain('arrow-functions');
    });
  });

  describe('Risk Assessment', () => {
    test('should assess low risk for simple transformations', async () => {
      mockContext.codeContext.sourceCode = 'let x = 1;';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.metadata.riskLevel).toBe('LOW');
      }
    });

    test('should assess higher risk for semantic changes', async () => {
      mockContext.codeContext.sourceCode = 'function test() { console.log("side effect"); }';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(['MEDIUM', 'HIGH']).toContain(fix.metadata.riskLevel);
      }
    });
  });

  describe('Performance Impact', () => {
    test('should calculate performance impact for functional operations', async () => {
      mockContext.codeContext.sourceCode = 'const result = items.map(x => x * 2);';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.performance).toBeDefined();
        expect(typeof fix.estimatedImpact.performance).toBe('number');
      }
    });

    test('should favor readability and maintainability', async () => {
      mockContext.codeContext.sourceCode = 'const x = 1; const y = 2;';

      const result = await generator.generateFix(mockContext);

      if (result.candidates.length > 0) {
        const fix = result.candidates[0];
        expect(fix.estimatedImpact.readability).toBeGreaterThan(0.5);
        expect(fix.estimatedImpact.maintainability).toBeGreaterThan(0.5);
        expect(fix.estimatedImpact.testability).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Alternative Approaches', () => {
    test('should provide alternative paradigm suggestions', async () => {
      const result = await generator.generateFix(mockContext);

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);

      const imperativeAlternative = result.alternatives.find(
        alt => alt.paradigm === ParadigmType.IMPERATIVE
      );
      expect(imperativeAlternative).toBeDefined();
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

    test('should handle complex nested code', async () => {
      mockContext.codeContext.sourceCode = `
        function complex() {
          if (true) {
            if (true) {
              if (true) {
                let x = 1;
                return x;
              }
            }
          }
        }
      `;

      const result = await generator.generateFix(mockContext);

      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });

    test('should handle code with mixed paradigms', async () => {
      mockContext.codeContext.sourceCode = `
        class MyClass {
          constructor() {
            this.items = [];
          }
          
          addItem(item) {
            this.items.push(item);
          }
          
          getDoubled() {
            return this.items.map(x => x * 2);
          }
        }
      `;

      const result = await generator.generateFix(mockContext);

      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });
  });

  describe('Integration with Base Class', () => {
    test('should properly extend AbstractParadigmGenerator', () => {
      expect(generator).toBeInstanceOf(FunctionalParadigmGenerator);
      expect(typeof generator.generateFix).toBe('function');
      expect(typeof generator.validateFix).toBe('function');
      expect(typeof generator.estimateImpact).toBe('function');
    });

    test('should implement required abstract methods', async () => {
      const mockFix = {
        id: 'test-fix',
        paradigm: ParadigmType.FUNCTIONAL,
        implementation: {
          type: 'MODIFICATION' as any,
          sourceCode: 'let x = 1;',
          targetCode: 'const x = 1;',
          diff: { additions: [], deletions: [], modifications: [] },
          reversible: true
        },
        confidence: 0.9,
        estimatedImpact: {
          performance: 0.1,
          readability: 0.8,
          maintainability: 0.9,
          testability: 0.95,
          security: 0.7
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.FUNCTIONAL,
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
  });
});