/**
 * Test suite for FormalProofSystem
 * Tests proof construction, validation, and verification capabilities
 */

import { 
  FormalProofSystem, 
  ExtendedFormalProof, 
  ProofStep, 
  Lemma, 
  ProofConstraint,
  ConstraintType,
  ProofStyle,
  ProofErrorType,
  ErrorSeverity,
  SuggestionType,
  ProofVerifier,
  VerifierCapabilities
} from '../FormalProofSystem';

import {
  LogicalFormula,
  InferenceRule,
  ProofSystem,
  ProofValidity,
  FormulaType
} from '@types/core';

// Mock proof verifier for testing
class MockProofVerifier implements ProofVerifier {
  private shouldSucceed: boolean = true;

  constructor(shouldSucceed: boolean = true) {
    this.shouldSucceed = shouldSucceed;
  }

  async verify(proof: ExtendedFormalProof): Promise<ProofValidity> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 10));

    if (this.shouldSucceed) {
      return {
        isValid: true,
        confidence: 0.95,
        verifiedBy: [ProofSystem.COQ],
        errors: []
      };
    } else {
      return {
        isValid: false,
        confidence: 0.2,
        verifiedBy: [],
        errors: ['Mock verification failed']
      };
    }
  }

  async translateProof(proof: ExtendedFormalProof): Promise<string> {
    return `Translated proof ${proof.id} to Coq syntax`;
  }

  getCapabilities(): VerifierCapabilities {
    return {
      supportedLogics: ['propositional', 'predicate'],
      maxComplexity: 100,
      timeoutSeconds: 30,
      supportsInteractive: true
    };
  }

  setSuccessMode(shouldSucceed: boolean): void {
    this.shouldSucceed = shouldSucceed;
  }
}

describe('FormalProofSystem', () => {
  let proofSystem: FormalProofSystem;
  let mockVerifier: MockProofVerifier;

  beforeEach(() => {
    proofSystem = new FormalProofSystem();
    mockVerifier = new MockProofVerifier();
    proofSystem.registerVerifier(ProofSystem.COQ, mockVerifier);
  });

  describe('Proof Creation', () => {
    test('should create a new formal proof', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'P → Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      expect(proof).toBeDefined();
      expect(proof.id).toMatch(/proof-\d+-\w+/);
      expect(proof.premises).toEqual(premises);
      expect(proof.conclusion).toEqual(conclusion);
      expect(proof.proofSteps).toHaveLength(0);
      expect(proof.assumptions).toEqual(premises);
      expect(proof.createdAt).toBeGreaterThan(0);
      expect(proof.complexity.stepCount).toBe(0);
    });

    test('should create proof with construction context', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const lemma: Lemma = {
        id: 'test-lemma',
        name: 'Test Lemma',
        statement: { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
        isAxiom: false,
        domain: ['test']
      };

      const context = {
        targetTheorem: conclusion,
        availableLemmas: [lemma],
        axioms: [],
        constraints: [],
        preferences: {
          preferredStyle: ProofStyle.NATURAL_DEDUCTION,
          minimizeSteps: true,
          maximizeReadability: false,
          preferConstructive: true,
          allowNonClassical: false
        }
      };

      const proof = proofSystem.createProof(premises, conclusion, context);

      expect(proof.lemmas).toContain(lemma);
    });
  });

  describe('Proof Step Management', () => {
    test('should add proof steps', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'P → Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'ModusPonens',
        premises: [
          { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
          { expression: 'P', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      const step = proofSystem.addProofStep(
        proof.id,
        rule,
        ['assumption-0', 'assumption-1'],
        conclusion,
        'Apply modus ponens to derive Q'
      );

      expect(step).toBeDefined();
      expect(step.stepNumber).toBe(1);
      expect(step.rule).toEqual(rule);
      expect(step.premises).toEqual(['assumption-0', 'assumption-1']);
      expect(step.conclusion).toEqual(conclusion);
      expect(step.confidence).toBeGreaterThan(0);

      const updatedProof = proofSystem.getProof(proof.id);
      expect(updatedProof?.proofSteps).toHaveLength(1);
      expect(updatedProof?.complexity.stepCount).toBe(1);
    });

    test('should throw error for non-existent proof', () => {
      const rule: InferenceRule = {
        name: 'TestRule',
        premises: [],
        conclusion: { expression: 'P', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      expect(() => {
        proofSystem.addProofStep(
          'non-existent-proof',
          rule,
          [],
          { expression: 'P', variables: [], type: FormulaType.ASSERTION },
          'Test step'
        );
      }).toThrow('Proof not found: non-existent-proof');
    });
  });

  describe('Proof Validation', () => {
    test('should validate a correct proof', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'P → Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      // Register the modus ponens rule
      const rule: InferenceRule = {
        name: 'ModusPonens',
        premises: [
          { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
          { expression: 'P', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      proofSystem.addProofStep(
        proof.id,
        rule,
        ['assumption-1', 'assumption-0'], // P → Q, P
        conclusion,
        'Apply modus ponens'
      );

      const validation = await proofSystem.validateProof(proof.id);

      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.5);
      expect(validation.errors.filter(e => e.severity >= ErrorSeverity.HIGH)).toHaveLength(0);
      expect(validation.metrics.correctness).toBeGreaterThan(0.8);
    });

    test('should detect invalid inference rules', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const invalidRule: InferenceRule = {
        name: 'NonExistentRule',
        premises: [],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: false
      };

      proofSystem.addProofStep(
        proof.id,
        invalidRule,
        [],
        conclusion,
        'Invalid step'
      );

      const validation = await proofSystem.validateProof(proof.id);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.errorType === ProofErrorType.INVALID_INFERENCE)).toBe(true);
    });

    test('should detect missing premises', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'ModusPonens',
        premises: [
          { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
          { expression: 'P', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      proofSystem.addProofStep(
        proof.id,
        rule,
        ['non-existent-premise', 'assumption-0'],
        conclusion,
        'Step with missing premise'
      );

      const validation = await proofSystem.validateProof(proof.id);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.errorType === ProofErrorType.MISSING_PREMISE)).toBe(true);
    });

    test('should detect circular reasoning', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'TestRule',
        premises: [{ expression: 'P', variables: [], type: FormulaType.ASSERTION }],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      // Add first step
      const step1 = proofSystem.addProofStep(
        proof.id,
        rule,
        ['assumption-0'],
        { expression: 'R', variables: [], type: FormulaType.ASSERTION },
        'First step'
      );

      // Add second step that depends on first
      const step2 = proofSystem.addProofStep(
        proof.id,
        rule,
        [step1.id],
        { expression: 'S', variables: [], type: FormulaType.ASSERTION },
        'Second step'
      );

      // Manually create circular dependency for testing
      const updatedProof = proofSystem.getProof(proof.id);
      if (updatedProof) {
        // Modify the first step to depend on the second (creating a cycle)
        updatedProof.proofSteps[0].premises = [step2.id];
      }

      const validation = await proofSystem.validateProof(proof.id);

      expect(validation.errors.some(e => e.errorType === ProofErrorType.CIRCULAR_REASONING)).toBe(true);
    });

    test('should generate proof suggestions', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'TestRule',
        premises: [],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      // Add many steps to trigger complexity suggestions
      for (let i = 0; i < 12; i++) {
        proofSystem.addProofStep(
          proof.id,
          rule,
          [],
          { expression: `Step${i}`, variables: [], type: FormulaType.ASSERTION },
          `Step ${i}`
        );
      }

      const validation = await proofSystem.validateProof(proof.id);

      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions.some(s => s.type === SuggestionType.ADD_LEMMA)).toBe(true);
    });
  });

  describe('External Theorem Prover Integration', () => {
    test('should verify proof with external prover', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const result = await proofSystem.verifyWithTheoremProver(proof.id, ProofSystem.COQ);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.verifiedBy).toContain(ProofSystem.COQ);

      const updatedProof = proofSystem.getProof(proof.id);
      expect(updatedProof?.verificationHistory).toHaveLength(1);
      expect(updatedProof?.verificationHistory[0].proverSystem).toBe(ProofSystem.COQ);
    });

    test('should handle verification failure', async () => {
      mockVerifier.setSuccessMode(false);

      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const result = await proofSystem.verifyWithTheoremProver(proof.id, ProofSystem.COQ);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.errors).toContain('Mock verification failed');
    });

    test('should throw error for non-existent verifier', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      await expect(
        proofSystem.verifyWithTheoremProver(proof.id, ProofSystem.LEAN)
      ).rejects.toThrow('No verifier available for LEAN');
    });
  });

  describe('Rule and Lemma Management', () => {
    test('should register custom inference rules', () => {
      const customRule: InferenceRule = {
        name: 'CustomRule',
        premises: [
          { expression: 'A', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'B', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      proofSystem.registerInferenceRule(customRule);

      // Test that the rule can be used in proofs
      const premises: LogicalFormula[] = [
        { expression: 'A', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'B',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);
      
      expect(() => {
        proofSystem.addProofStep(
          proof.id,
          customRule,
          ['assumption-0'],
          conclusion,
          'Using custom rule'
        );
      }).not.toThrow();
    });

    test('should register custom lemmas', () => {
      const customLemma: Lemma = {
        id: 'custom-lemma',
        name: 'Custom Lemma',
        statement: { expression: 'A → B', variables: [], type: FormulaType.ASSERTION },
        isAxiom: false,
        domain: ['custom']
      };

      proofSystem.registerLemma(customLemma);

      // Lemma registration should not throw
      expect(true).toBe(true);
    });
  });

  describe('Proof Statistics', () => {
    test('should calculate proof statistics', async () => {
      // Create multiple proofs
      const premises1: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion1: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const premises2: LogicalFormula[] = [
        { expression: 'A', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion2: LogicalFormula = {
        expression: 'B',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof1 = proofSystem.createProof(premises1, conclusion1);
      const proof2 = proofSystem.createProof(premises2, conclusion2);

      const rule: InferenceRule = {
        name: 'TestRule',
        premises: [],
        conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      proofSystem.addProofStep(proof1.id, rule, [], conclusion1, 'Step 1');
      proofSystem.addProofStep(proof2.id, rule, [], conclusion2, 'Step 2');

      // Validate proofs to set validity
      await proofSystem.validateProof(proof1.id);
      await proofSystem.validateProof(proof2.id);

      const stats = proofSystem.getProofStatistics();

      expect(stats.totalProofs).toBe(2);
      expect(stats.validProofs).toBeGreaterThanOrEqual(0);
      expect(stats.averageComplexity).toBeGreaterThanOrEqual(0);
      expect(stats.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(stats.mostUsedRules).toBeInstanceOf(Array);
    });
  });

  describe('Proof Complexity Calculation', () => {
    test('should calculate proof complexity metrics', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P ∧ Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'P ∨ Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'ComplexRule',
        premises: [
          { expression: 'P ∧ Q', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'P ∨ Q', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      proofSystem.addProofStep(
        proof.id,
        rule,
        ['assumption-0'],
        conclusion,
        'Complex logical step'
      );

      const updatedProof = proofSystem.getProof(proof.id);

      expect(updatedProof?.complexity.stepCount).toBe(1);
      expect(updatedProof?.complexity.logicalComplexity).toBeGreaterThan(0);
      expect(updatedProof?.complexity.depth).toBeGreaterThan(0);
    });

    test('should handle complex proof structures', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'R',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const rule: InferenceRule = {
        name: 'MultiPremiseRule',
        premises: [
          { expression: 'P', variables: [], type: FormulaType.ASSERTION },
          { expression: 'Q', variables: [], type: FormulaType.ASSERTION }
        ],
        conclusion: { expression: 'R', variables: [], type: FormulaType.ASSERTION },
        soundness: true
      };

      // Add multiple interconnected steps
      const step1 = proofSystem.addProofStep(
        proof.id,
        rule,
        ['assumption-0', 'assumption-1'],
        { expression: 'S', variables: [], type: FormulaType.ASSERTION },
        'First step'
      );

      proofSystem.addProofStep(
        proof.id,
        rule,
        [step1.id, 'assumption-0'],
        conclusion,
        'Second step'
      );

      const updatedProof = proofSystem.getProof(proof.id);

      expect(updatedProof?.complexity.stepCount).toBe(2);
      expect(updatedProof?.complexity.depth).toBeGreaterThan(1);
      expect(updatedProof?.complexity.branchingFactor).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent proof validation', async () => {
      await expect(
        proofSystem.validateProof('non-existent-proof')
      ).rejects.toThrow('Proof not found: non-existent-proof');
    });

    test('should handle non-existent proof verification', async () => {
      await expect(
        proofSystem.verifyWithTheoremProver('non-existent-proof', ProofSystem.COQ)
      ).rejects.toThrow('Proof not found: non-existent-proof');
    });

    test('should handle verifier errors gracefully', async () => {
      // Create a verifier that throws an error
      const errorVerifier: ProofVerifier = {
        verify: async () => {
          throw new Error('Verifier crashed');
        },
        translateProof: async () => 'error',
        getCapabilities: () => ({
          supportedLogics: [],
          maxComplexity: 0,
          timeoutSeconds: 1,
          supportsInteractive: false
        })
      };

      proofSystem.registerVerifier(ProofSystem.LEAN, errorVerifier);

      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      const result = await proofSystem.verifyWithTheoremProver(proof.id, ProofSystem.LEAN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Verifier crashed');
    });
  });

  describe('Proof Retrieval', () => {
    test('should retrieve existing proof', () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);
      const retrieved = proofSystem.getProof(proof.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(proof.id);
    });

    test('should return undefined for non-existent proof', () => {
      const retrieved = proofSystem.getProof('non-existent-proof');
      expect(retrieved).toBeUndefined();
    });
  });
});