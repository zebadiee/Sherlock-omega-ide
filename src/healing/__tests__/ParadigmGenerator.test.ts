/**
 * Test suite for ParadigmGenerator framework
 * Tests paradigm generator interfaces and base classes
 */

import {
  AbstractParadigmGenerator,
  ParadigmGenerator,
  FixGenerationContext,
  FixGenerationResult,
  ValidationResult,
  CodeAnalysisContext,
  SymbolTable,
  FixConstraint,
  ConstraintType,
  FixPreferences,
  CodingStyle,
  VerbosityLevel,
  RiskTolerance,
  OptimizationGoal,
  HistoricalFixData,
  FixOutcome
} from '../ParadigmGenerator';

import {
  ComputationalIssue,
  FixCandidate,
  ParadigmType,
  ProblemType,
  SeverityLevel,
  SensorType,
  FormulaType,
  TransformationType,
  Impact
} from '@types/core';

// Test implementation of AbstractParadigmGenerator
class TestParadigmGenerator extends AbstractParadigmGenerator {
  public readonly paradigm = ParadigmType.FUNCTIONAL;
  public readonly supportedProblemTypes = [ProblemType.SYNTAX_ERROR, ProblemType.PERFORMANCE_BOTTLENECK];
  public readonly capabilities = {
    maxComplexity: 100,
    supportedLanguages: ['typescript', 'javascript'],
    requiresTypeInformation: true,
    canHandleAsync: true,
    canRefactor: true,
    canOptimize: true,
    estimatedAccuracy: 0.85
  };

  public async generateFix(context: FixGenerationContext): Promise<FixGenerationResult> {
    const mockFix: FixCandidate = {
      id: 'test-fix-1',
      paradigm: this.paradigm,
      implementation: {
        type: TransformationType.MODIFICATION,
        sourceCode: context.codeContext.sourceCode,
        targetCode: context.codeContext.sourceCode.replace('var ', 'const '),
        diff: {
          additions: ['const x = 1;'],
          deletions: ['var x = 1;'],
          modifications: []
        },
        reversible: true
      },
      confidence: 0.9,
      estimatedImpact: {
        performance: 0.1,
        readability: 0.8,
        maintainability: 0.7,
        testability: 0.6,
        security: 0.2
      },
      metadata: {
        generatedAt: Date.now(),
        generatedBy: this.paradigm,
        estimatedTime: 100,
        riskLevel: 'LOW' as any
      }
    };

    return {
      candidates: [mockFix],
      analysisTime: 50,
      confidence: 0.9,
      reasoning: {
        primaryStrategy: 'Immutability improvement',
        appliedPatterns: ['const-over-var'],
        consideredAlternatives: ['let-declaration'],
        riskAssessment: {
          overallRisk: 'LOW' as any,
          riskFactors: [],
          mitigationStrategies: []
        },
        tradeoffs: []
      },
      alternatives: []
    };
  }

  protected async validateParadigmSpecific(fix: FixCandidate, context: FixGenerationContext) {
    return {
      issues: [],
      confidence: 0.95
    };
  }

  protected async calculateParadigmSpecificImpact(fix: FixCandidate, context: FixGenerationContext): Promise<Impact> {
    return {
      performance: 0.1,
      readability: 0.8,
      maintainability: 0.7,
      testability: 0.6,
      security: 0.2
    };
  }

  protected extractPattern(context: FixGenerationContext): string {
    return 'const-declaration-pattern';
  }
}

describe('ParadigmGenerator Framework', () => {
  let generator: TestParadigmGenerator;
  let mockContext: FixGenerationContext;

  beforeEach(() => {
    generator = new TestParadigmGenerator();

    const mockIssue: ComputationalIssue = {
      id: 'test-issue',
      type: ProblemType.SYNTAX_ERROR,
      severity: SeverityLevel.MEDIUM,
      context: {
        file: 'test.ts',
        line: 1,
        column: 1,
        scope: ['function'],
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
    };

    const mockSymbolTable: SymbolTable = {
      variables: new Map([
        ['x', {
          name: 'x',
          type: 'number',
          scope: 'function',
          isConstant: false,
          isUsed: true,
          declarationLine: 1,
          usageLines: [2, 3]
        }]
      ]),
      functions: new Map(),
      classes: new Map(),
      imports: new Map(),
      exports: new Map()
    };

    const mockCodeContext: CodeAnalysisContext = {
      sourceCode: 'var x = 1; console.log(x);',
      ast: {},
      symbols: mockSymbolTable,
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
          entryPoint: 'start',
          exitPoints: ['end']
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
        linesOfCode: 2,
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        maintainabilityIndex: 80,
        technicalDebt: 0,
        testCoverage: 0,
        duplicatedLines: 0
      }
    };

    mockContext = {
      issue: mockIssue,
      relatedIssues: [],
      codeContext: mockCodeContext,
      constraints: [],
      preferences: {
        paradigm: ParadigmType.FUNCTIONAL,
        style: CodingStyle.FUNCTIONAL,
        verbosity: VerbosityLevel.CONCISE,
        riskTolerance: RiskTolerance.MODERATE,
        optimizationGoals: [OptimizationGoal.READABILITY]
      },
      historicalData: []
    };
  });

  describe('AbstractParadigmGenerator', () => {
    test('should have correct paradigm and capabilities', () => {
      expect(generator.paradigm).toBe(ParadigmType.FUNCTIONAL);
      expect(generator.supportedProblemTypes).toContain(ProblemType.SYNTAX_ERROR);
      expect(generator.capabilities.maxComplexity).toBe(100);
      expect(generator.capabilities.supportedLanguages).toContain('typescript');
    });

    test('should generate fix candidates', async () => {
      const result = await generator.generateFix(mockContext);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].paradigm).toBe(ParadigmType.FUNCTIONAL);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.analysisTime).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });

    test('should validate fix candidates', async () => {
      const result = await generator.generateFix(mockContext);
      const fix = result.candidates[0];
      
      const validation = await generator.validateFix(fix, mockContext);

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.8);
      expect(validation.issues).toBeInstanceOf(Array);
      expect(validation.suggestions).toBeInstanceOf(Array);
    });

    test('should estimate impact of fixes', async () => {
      const result = await generator.generateFix(mockContext);
      const fix = result.candidates[0];
      
      const impact = await generator.estimateImpact(fix, mockContext);

      expect(impact.performance).toBeGreaterThanOrEqual(-1);
      expect(impact.performance).toBeLessThanOrEqual(1);
      expect(impact.readability).toBeGreaterThanOrEqual(-1);
      expect(impact.readability).toBeLessThanOrEqual(1);
      expect(impact.maintainability).toBeGreaterThanOrEqual(-1);
      expect(impact.maintainability).toBeLessThanOrEqual(1);
    });

    test('should learn from fix outcomes', async () => {
      const outcome: FixOutcome = {
        success: true,
        timeToApply: 100,
        sideEffects: [],
        qualityImprovement: {
          beforeMetrics: mockContext.codeContext.metrics,
          afterMetrics: {
            ...mockContext.codeContext.metrics,
            maintainabilityIndex: 85
          },
          improvement: 0.1
        },
        userSatisfaction: 4
      };

      await generator.learnFromOutcome(mockContext, outcome);

      // Learning should not throw errors
      expect(true).toBe(true);
    });

    test('should calculate confidence for different issue types', () => {
      const supportedIssue: ComputationalIssue = {
        ...mockContext.issue,
        type: ProblemType.SYNTAX_ERROR
      };

      const unsupportedIssue: ComputationalIssue = {
        ...mockContext.issue,
        type: ProblemType.SECURITY_VULNERABILITY
      };

      const supportedConfidence = generator.getConfidenceForIssue(supportedIssue);
      const unsupportedConfidence = generator.getConfidenceForIssue(unsupportedIssue);

      expect(supportedConfidence).toBeGreaterThan(0);
      expect(unsupportedConfidence).toBe(0);
    });
  });

  describe('Fix Generation Context', () => {
    test('should contain all necessary information', () => {
      expect(mockContext.issue).toBeDefined();
      expect(mockContext.codeContext).toBeDefined();
      expect(mockContext.constraints).toBeInstanceOf(Array);
      expect(mockContext.preferences).toBeDefined();
      expect(mockContext.historicalData).toBeInstanceOf(Array);
    });

    test('should have valid code analysis context', () => {
      const codeContext = mockContext.codeContext;
      
      expect(codeContext.sourceCode).toBeDefined();
      expect(codeContext.symbols).toBeDefined();
      expect(codeContext.dependencies).toBeDefined();
      expect(codeContext.typeInformation).toBeDefined();
      expect(codeContext.semanticModel).toBeDefined();
      expect(codeContext.metrics).toBeDefined();
    });

    test('should have valid symbol table', () => {
      const symbols = mockContext.codeContext.symbols;
      
      expect(symbols.variables).toBeInstanceOf(Map);
      expect(symbols.functions).toBeInstanceOf(Map);
      expect(symbols.classes).toBeInstanceOf(Map);
      expect(symbols.imports).toBeInstanceOf(Map);
      expect(symbols.exports).toBeInstanceOf(Map);

      const variable = symbols.variables.get('x');
      expect(variable).toBeDefined();
      expect(variable?.name).toBe('x');
      expect(variable?.type).toBe('number');
    });
  });

  describe('Fix Constraints and Preferences', () => {
    test('should handle fix constraints', () => {
      const constraint: FixConstraint = {
        type: ConstraintType.PRESERVE_SEMANTICS,
        value: true,
        priority: 10,
        isHard: true
      };

      mockContext.constraints.push(constraint);

      expect(mockContext.constraints).toHaveLength(1);
      expect(mockContext.constraints[0].type).toBe(ConstraintType.PRESERVE_SEMANTICS);
      expect(mockContext.constraints[0].isHard).toBe(true);
    });

    test('should handle fix preferences', () => {
      const preferences = mockContext.preferences;

      expect(preferences.paradigm).toBe(ParadigmType.FUNCTIONAL);
      expect(preferences.style).toBe(CodingStyle.FUNCTIONAL);
      expect(preferences.verbosity).toBe(VerbosityLevel.CONCISE);
      expect(preferences.riskTolerance).toBe(RiskTolerance.MODERATE);
      expect(preferences.optimizationGoals).toContain(OptimizationGoal.READABILITY);
    });
  });

  describe('Validation and Impact Assessment', () => {
    test('should perform syntax validation', async () => {
      const result = await generator.generateFix(mockContext);
      const fix = result.candidates[0];
      
      // Test with code that has potential issues
      fix.implementation.targetCode = 'const x = undefined; console.log(x);';
      
      const validation = await generator.validateFix(fix, mockContext);

      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0].type).toBe('syntax');
      expect(validation.confidence).toBeLessThan(1.0);
    });

    test('should combine impact scores correctly', () => {
      const baseScore = 0.5;
      const specificScore = 0.8;
      
      const combined = (generator as any).combineImpactScores(baseScore, specificScore);

      expect(combined).toBeCloseTo(0.68, 2); // 0.5 * 0.4 + 0.8 * 0.6
    });

    test('should generate validation suggestions', () => {
      const issues = [
        {
          type: 'syntax' as const,
          severity: SeverityLevel.MEDIUM,
          message: 'Test issue',
          suggestedFix: 'Fix suggestion 1'
        },
        {
          type: 'semantic' as const,
          severity: SeverityLevel.LOW,
          message: 'Another issue',
          suggestedFix: 'Fix suggestion 2'
        }
      ];

      const suggestions = (generator as any).generateValidationSuggestions(issues);

      expect(suggestions).toHaveLength(2);
      expect(suggestions).toContain('Fix suggestion 1');
      expect(suggestions).toContain('Fix suggestion 2');
    });
  });

  describe('Learning and Pattern Management', () => {
    test('should update pattern library from successful outcomes', async () => {
      const successfulOutcome: FixOutcome = {
        success: true,
        timeToApply: 50,
        sideEffects: [],
        qualityImprovement: {
          beforeMetrics: mockContext.codeContext.metrics,
          afterMetrics: {
            ...mockContext.codeContext.metrics,
            maintainabilityIndex: 90
          },
          improvement: 0.2
        },
        userSatisfaction: 5
      };

      const initialPatternCount = (generator as any).patternLibrary.length;
      
      await generator.learnFromOutcome(mockContext, successfulOutcome);

      const finalPatternCount = (generator as any).patternLibrary.length;
      expect(finalPatternCount).toBeGreaterThan(initialPatternCount);
    });

    test('should not update pattern library from failed outcomes', async () => {
      const failedOutcome: FixOutcome = {
        success: false,
        timeToApply: 200,
        sideEffects: [
          {
            type: 'performance',
            impact: -0.5,
            description: 'Performance degradation'
          }
        ],
        qualityImprovement: {
          beforeMetrics: mockContext.codeContext.metrics,
          afterMetrics: {
            ...mockContext.codeContext.metrics,
            maintainabilityIndex: 70
          },
          improvement: -0.1
        },
        userSatisfaction: 1
      };

      const initialPatternCount = (generator as any).patternLibrary.length;
      
      await generator.learnFromOutcome(mockContext, failedOutcome);

      const finalPatternCount = (generator as any).patternLibrary.length;
      expect(finalPatternCount).toBe(initialPatternCount);
    });

    test('should adjust confidence based on historical data', async () => {
      const initialConfidence = generator.getConfidenceForIssue(mockContext.issue);

      // Add successful historical data
      const successfulOutcome: FixOutcome = {
        success: true,
        timeToApply: 50,
        sideEffects: [],
        qualityImprovement: {
          beforeMetrics: mockContext.codeContext.metrics,
          afterMetrics: mockContext.codeContext.metrics,
          improvement: 0.1
        },
        userSatisfaction: 4
      };

      await generator.learnFromOutcome(mockContext, successfulOutcome);

      const updatedConfidence = generator.getConfidenceForIssue(mockContext.issue);
      expect(updatedConfidence).toBeGreaterThanOrEqual(initialConfidence);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid fix candidates gracefully', async () => {
      const invalidFix: FixCandidate = {
        id: 'invalid-fix',
        paradigm: ParadigmType.FUNCTIONAL,
        implementation: {
          type: TransformationType.MODIFICATION,
          sourceCode: 'valid code',
          targetCode: 'invalid code with syntax errors {{{',
          diff: {
            additions: [],
            deletions: [],
            modifications: []
          },
          reversible: false
        },
        confidence: 0.1,
        estimatedImpact: {
          performance: -1,
          readability: -1,
          maintainability: -1,
          testability: -1,
          security: -1
        },
        metadata: {
          generatedAt: Date.now(),
          generatedBy: ParadigmType.FUNCTIONAL,
          estimatedTime: 1000,
          riskLevel: 'CRITICAL' as any
        }
      };

      const validation = await generator.validateFix(invalidFix, mockContext);

      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBeLessThan(0.5);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    test('should handle empty code context', async () => {
      const emptyContext: FixGenerationContext = {
        ...mockContext,
        codeContext: {
          ...mockContext.codeContext,
          sourceCode: '',
          symbols: {
            variables: new Map(),
            functions: new Map(),
            classes: new Map(),
            imports: new Map(),
            exports: new Map()
          }
        }
      };

      const result = await generator.generateFix(emptyContext);

      expect(result.candidates).toHaveLength(1);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});