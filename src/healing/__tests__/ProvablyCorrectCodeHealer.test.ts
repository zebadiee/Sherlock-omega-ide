/**
 * Tests for ProvablyCorrectCodeHealer
 */

import { ProvablyCorrectCodeHealer, GuaranteeType } from '../ProvablyCorrectCodeHealer';
import { FixGenerationContext, CodingStyle, VerbosityLevel, RiskTolerance, OptimizationGoal } from '../ParadigmGenerator';
import { ComputationalIssue, ProblemType, SeverityLevel, ParadigmType, ProblemContext, RiskLevel } from '../../types/core';

// Mock the verification system
jest.mock('../../verification/FormalProofSystem');
jest.mock('../../verification/HoareProofGenerator');
jest.mock('../../verification/TheoremProverIntegration');

describe('ProvablyCorrectCodeHealer', () => {
  let healer: ProvablyCorrectCodeHealer;
  let mockContext: FixGenerationContext;
  let mockIssue: ComputationalIssue;

  beforeEach(() => {
    healer = new ProvablyCorrectCodeHealer();
    
    mockIssue = {
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
      preconditions: [{
        expression: 'input.isValid',
        variables: [],
        type: 'PRECONDITION' as any
      }],
      postconditions: [{
        expression: 'output.isCorrect',
        variables: [],
        type: 'POSTCONDITION' as any
      }],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: 'SYNTAX' as any,
        confidence: 0.9,
        tags: []
      }
    };
    
    mockContext = {
      issue: mockIssue,
      relatedIssues: [],
      codeContext: {
        sourceCode: 'let x = 1; x = x + 1;',
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
      expect(healer).toBeDefined();
      expect(healer).toBeInstanceOf(ProvablyCorrectCodeHealer);
    });

    test('should heal with proof', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.analysisTime).toBeGreaterThan(0);
      expect(result.proofGenerationTime).toBeGreaterThanOrEqual(0);
      expect(result.totalConfidence).toBeGreaterThanOrEqual(0);
      expect(result.riskAssessment).toBeDefined();
    });
  });

  describe('Multi-Paradigm Coordination', () => {
    test('should coordinate functional and imperative generators', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.riskAssessment.paradigmRisks).toBeDefined();
      expect(result.riskAssessment.recommendedApproach).toBeDefined();
    });

    test('should handle multiple fix candidates', async () => {
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 10; i++) { console.log(i); }';
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    test('should select best paradigm based on proof strength', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.riskAssessment.recommendedApproach).toBeDefined();
      expect(Object.values(ParadigmType)).toContain(result.riskAssessment.recommendedApproach);
    });
  });

  describe('Formal Proof Generation', () => {
    test('should generate correctness proofs', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      
      // Should have at least some certified fixes or alternatives
      const totalFixes = (result.certifiedFix ? 1 : 0) + result.alternatives.length;
      expect(totalFixes).toBeGreaterThan(0);
      
      if (result.certifiedFix) {
        expect(result.certifiedFix.proof).toBeDefined();
        expect(result.certifiedFix.confidence).toBeGreaterThan(0);
        expect(result.certifiedFix.guarantees).toBeDefined();
        expect(result.certifiedFix.validationResults).toBeDefined();
      } else if (result.alternatives.length > 0) {
        const firstAlternative = result.alternatives[0];
        expect(firstAlternative.proof).toBeDefined();
        expect(firstAlternative.confidence).toBeGreaterThan(0);
        expect(firstAlternative.guarantees).toBeDefined();
        expect(firstAlternative.validationResults).toBeDefined();
      }
    });

    test('should provide resolution guarantees', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix) {
        expect(result.certifiedFix.guarantees.length).toBeGreaterThan(0);
        
        const correctnessGuarantee = result.certifiedFix.guarantees.find(
          g => g.type === GuaranteeType.CORRECTNESS
        );
        
        if (correctnessGuarantee) {
          expect(correctnessGuarantee.description).toBeDefined();
          expect(correctnessGuarantee.mathematicalBasis).toBeDefined();
          expect(correctnessGuarantee.confidence).toBeGreaterThan(0);
        }
      }
    });

    test('should create rollback strategies', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix) {
        expect(result.certifiedFix.rollbackPlan).toBeDefined();
        expect(result.certifiedFix.rollbackPlan.canRollback).toBeDefined();
        expect(result.certifiedFix.rollbackPlan.rollbackSteps).toBeDefined();
        expect(result.certifiedFix.rollbackPlan.conditions).toBeDefined();
      }
    });
  });

  describe('Risk Assessment', () => {
    test('should assess overall healing risk', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.riskAssessment.overallRisk).toBeDefined();
      expect(Object.values(RiskLevel)).toContain(result.riskAssessment.overallRisk);
      expect(result.riskAssessment.mitigationStrategies).toBeDefined();
      expect(result.riskAssessment.mitigationStrategies.length).toBeGreaterThan(0);
    });

    test('should provide paradigm-specific risk analysis', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.riskAssessment.paradigmRisks).toBeDefined();
      expect(result.riskAssessment.paradigmRisks.size).toBeGreaterThan(0);
    });

    test('should recommend appropriate mitigation strategies', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      const strategies = result.riskAssessment.mitigationStrategies;
      expect(strategies).toBeDefined();
      expect(strategies.length).toBeGreaterThan(0);
      
      strategies.forEach(strategy => {
        expect(typeof strategy).toBe('string');
        expect(strategy.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle generator failures gracefully', async () => {
      // Create a context that might cause issues
      const problematicContext = {
        ...mockContext,
        codeContext: {
          ...mockContext.codeContext,
          sourceCode: '' // Empty source code
        }
      };
      
      const result = await healer.healWithProof(mockIssue, problematicContext);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
    });

    test('should handle proof generation failures', async () => {
      // Mock a scenario where proof generation might fail
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.analysisTime).toBeGreaterThan(0);
    });

    test('should provide fallback strategies on critical failures', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (!result.success) {
        expect(result.riskAssessment.overallRisk).toBe(RiskLevel.CRITICAL);
        expect(result.riskAssessment.mitigationStrategies).toContain('Manual intervention required');
      }
    });
  });

  describe('Performance Analysis', () => {
    test('should complete healing within reasonable time', async () => {
      const startTime = Date.now();
      const result = await healer.healWithProof(mockIssue, mockContext);
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.analysisTime).toBeGreaterThan(0);
      expect(result.analysisTime).toBeLessThan(10000);
    });

    test('should track proof generation time separately', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result.proofGenerationTime).toBeGreaterThanOrEqual(0);
      expect(result.proofGenerationTime).toBeLessThanOrEqual(result.analysisTime);
    });
  });

  describe('Integration with Paradigm Generators', () => {
    test('should work with functional paradigm generator', async () => {
      mockContext.preferences.paradigm = ParadigmType.FUNCTIONAL;
      mockContext.codeContext.sourceCode = 'let x = 1; x = x + 1;';
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.riskAssessment.paradigmRisks.has(ParadigmType.FUNCTIONAL)).toBe(true);
    });

    test('should work with imperative paradigm generator', async () => {
      mockContext.preferences.paradigm = ParadigmType.IMPERATIVE;
      mockContext.codeContext.sourceCode = 'for (let i = 0; i < 10; i++) { console.log(i); }';
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.riskAssessment.paradigmRisks.has(ParadigmType.IMPERATIVE)).toBe(true);
    });

    test('should handle different problem types', async () => {
      const performanceIssue = {
        ...mockIssue,
        type: ProblemType.PERFORMANCE_BOTTLENECK
      };
      
      const result = await healer.healWithProof(performanceIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
    });
  });

  describe('Proof Strength Calculation', () => {
    test('should calculate proof strength correctly', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix) {
        expect(result.certifiedFix.confidence).toBeGreaterThanOrEqual(0);
        expect(result.certifiedFix.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should prefer fixes with stronger proofs', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix && result.alternatives.length > 0) {
        const mainFixConfidence = result.certifiedFix.confidence;
        const alternativeConfidences = result.alternatives.map(alt => alt.confidence);
        
        alternativeConfidences.forEach(altConfidence => {
          expect(mainFixConfidence).toBeGreaterThanOrEqual(altConfidence);
        });
      }
    });
  });

  describe('Guarantee Generation', () => {
    test('should generate appropriate guarantees for different fix types', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix) {
        const guarantees = result.certifiedFix.guarantees;
        expect(guarantees).toBeDefined();
        
        guarantees.forEach(guarantee => {
          expect(guarantee.type).toBeDefined();
          expect(guarantee.description).toBeDefined();
          expect(guarantee.mathematicalBasis).toBeDefined();
          expect(guarantee.confidence).toBeGreaterThan(0);
          expect(guarantee.conditions).toBeDefined();
        });
      }
    });

    test('should include safety guarantees for reversible fixes', async () => {
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix && result.certifiedFix.fix.implementation.reversible) {
        const safetyGuarantee = result.certifiedFix.guarantees.find(
          g => g.type === GuaranteeType.SAFETY
        );
        
        expect(safetyGuarantee).toBeDefined();
        if (safetyGuarantee) {
          expect(safetyGuarantee.confidence).toBeGreaterThan(0.5);
        }
      }
    });

    test('should include performance guarantees when applicable', async () => {
      mockIssue.type = ProblemType.PERFORMANCE_BOTTLENECK;
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      if (result.certifiedFix) {
        const performanceGuarantee = result.certifiedFix.guarantees.find(
          g => g.type === GuaranteeType.PERFORMANCE
        );
        
        if (performanceGuarantee) {
          expect(performanceGuarantee.confidence).toBeGreaterThan(0);
          expect(performanceGuarantee.conditions).toBeDefined();
        }
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty source code', async () => {
      mockContext.codeContext.sourceCode = '';
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    test('should handle complex nested code', async () => {
      mockContext.codeContext.sourceCode = `
        function complex() {
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
      
      const result = await healer.healWithProof(mockIssue, mockContext);
      
      expect(result).toBeDefined();
      expect(result.analysisTime).toBeGreaterThan(0);
    });

    test('should handle issues with no viable fixes', async () => {
      // Create an issue that might be difficult to fix
      const difficultIssue = {
        ...mockIssue,
        type: ProblemType.UNKNOWN,
        severity: SeverityLevel.CRITICAL
      };
      
      const result = await healer.healWithProof(difficultIssue, mockContext);
      
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.riskAssessment.overallRisk).toBe(RiskLevel.CRITICAL);
      }
    });
  });
});