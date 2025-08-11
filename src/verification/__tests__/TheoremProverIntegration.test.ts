/**
 * Test suite for TheoremProverIntegration
 * Tests automated theorem prover integration and verification
 */

import { 
  TheoremProverManager, 
  CoqProver, 
  LeanProver, 
  BaseTheoremProver,
  TheoremProverConfig,
  VerificationSession,
  SessionState
} from '../TheoremProverIntegration';

import { FormalProofSystem, ExtendedFormalProof } from '../FormalProofSystem';
import { ProofSystem, LogicalFormula, FormulaType, InferenceRule } from '@types/core';

describe('TheoremProverIntegration', () => {
  let proofSystem: FormalProofSystem;
  let proverManager: TheoremProverManager;

  beforeEach(() => {
    proofSystem = new FormalProofSystem();
    proverManager = new TheoremProverManager();
  });

  describe('CoqProver', () => {
    let coqProver: CoqProver;
    let testProof: ExtendedFormalProof;

    beforeEach(() => {
      coqProver = new CoqProver();
      
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'P -> Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      testProof = proofSystem.createProof(premises, conclusion);
    });

    test('should have correct capabilities', () => {
      const capabilities = coqProver.getCapabilities();

      expect(capabilities.supportedLogics).toContain('propositional');
      expect(capabilities.supportedLogics).toContain('predicate');
      expect(capabilities.supportedLogics).toContain('higher-order');
      expect(capabilities.maxComplexity).toBe(1000);
      expect(capabilities.timeoutSeconds).toBe(30);
      expect(capabilities.supportsInteractive).toBe(true);
    });

    test('should translate proof to Coq syntax', async () => {
      const translation = await coqProver.translateProof(testProof);

      expect(translation).toContain('Require Import');
      expect(translation).toContain('Variable H0: P');
      expect(translation).toContain('Variable H1: P -> Q');
      expect(translation).toContain('Theorem');
      expect(translation).toContain('Proof.');
      expect(translation).toContain('Qed.');
    });

    test('should verify valid proof', async () => {
      const result = await coqProver.verify(testProof);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.verifiedBy).toContain(ProofSystem.COQ);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle verification failure', async () => {
      // Create a proof with contradiction
      const invalidPremises: LogicalFormula[] = [
        { expression: 'False', variables: [], type: FormulaType.PRECONDITION }
      ];
      const invalidConclusion: LogicalFormula = {
        expression: 'True',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const invalidProof = proofSystem.createProof(invalidPremises, invalidConclusion);
      const result = await coqProver.verify(invalidProof);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });  des
cribe('LeanProver', () => {
    let leanProver: LeanProver;
    let testProof: ExtendedFormalProof;

    beforeEach(() => {
      leanProver = new LeanProver();
      
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION },
        { expression: 'P → Q', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'Q',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      testProof = proofSystem.createProof(premises, conclusion);
    });

    test('should have correct capabilities', () => {
      const capabilities = leanProver.getCapabilities();

      expect(capabilities.supportedLogics).toContain('propositional');
      expect(capabilities.supportedLogics).toContain('predicate');
      expect(capabilities.supportedLogics).toContain('type-theory');
      expect(capabilities.maxComplexity).toBe(800);
      expect(capabilities.supportsInteractive).toBe(true);
    });

    test('should translate proof to Lean syntax', async () => {
      const translation = await leanProver.translateProof(testProof);

      expect(translation).toContain('import logic.basic');
      expect(translation).toContain('variable (h0 : P)');
      expect(translation).toContain('variable (h1 : P → Q)');
      expect(translation).toContain('theorem');
      expect(translation).toContain('begin');
      expect(translation).toContain('end');
    });

    test('should verify valid proof', async () => {
      const result = await leanProver.verify(testProof);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.verifiedBy).toContain(ProofSystem.LEAN);
    });
  });

  describe('TheoremProverManager', () => {
    test('should register and manage multiple provers', () => {
      const availableProvers = proverManager.getAvailableProvers();

      expect(availableProvers).toContain(ProofSystem.COQ);
      expect(availableProvers).toContain(ProofSystem.LEAN);
      expect(availableProvers.length).toBeGreaterThanOrEqual(2);
    });

    test('should verify proof with specific prover', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'P',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);
      const result = await proverManager.verifyWithProver(proof, ProofSystem.COQ);

      expect(result.isValid).toBe(true);
      expect(result.verifiedBy).toContain(ProofSystem.COQ);
    });

    test('should verify proof with consensus', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'P',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);
      const result = await proverManager.verifyWithConsensus(proof);

      expect(result.consensus).toBe(true);
      expect(result.results.size).toBeGreaterThan(1);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should handle prover not available error', async () => {
      const premises: LogicalFormula[] = [
        { expression: 'P', variables: [], type: FormulaType.PRECONDITION }
      ];
      const conclusion: LogicalFormula = {
        expression: 'P',
        variables: [],
        type: FormulaType.POSTCONDITION
      };

      const proof = proofSystem.createProof(premises, conclusion);

      await expect(
        proverManager.verifyWithProver(proof, ProofSystem.ISABELLE)
      ).rejects.toThrow('No prover available for ISABELLE');
    });

    test('should get prover capabilities', () => {
      const coqCapabilities = proverManager.getProverCapabilities(ProofSystem.COQ);
      const leanCapabilities = proverManager.getProverCapabilities(ProofSystem.LEAN);

      expect(coqCapabilities).toBeDefined();
      expect(coqCapabilities?.supportedLogics).toContain('propositional');
      
      expect(leanCapabilities).toBeDefined();
      expect(leanCapabilities?.supportedLogics).toContain('type-theory');
    });

    test('should set and get default prover', () => {
      expect(proverManager.getDefaultProver()).toBe(ProofSystem.COQ);

      proverManager.setDefaultProver(ProofSystem.LEAN);
      expect(proverManager.getDefaultProver()).toBe(ProofSystem.LEAN);
    });

    test('should throw error when setting invalid default prover', () => {
      expect(() => {
        proverManager.setDefaultProver(ProofSystem.ISABELLE);
      }).toThrow('Prover ISABELLE is not registered');
    });
  });
});