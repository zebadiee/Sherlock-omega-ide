/**
 * Formal Proof System for Sherlock Ω
 * Implements mathematical proof structures and verification interfaces
 */

import {
  FormalProof,
  LogicalFormula,
  InferenceRule,
  ProofSystem,
  ProofValidity,
  Variable,
  FormulaType
} from '../types/core';

// Forward declaration for ProofTranslation (defined in TheoremProverIntegration)
export interface ProofTranslation {
  originalProof: ExtendedFormalProof;
  translatedCode: string;
  targetSystem: ProofSystem;
  translationTime: number;
  warnings: string[];
  dependencies: string[];
}

/**
 * Extended proof structure with additional metadata
 */
export interface ExtendedFormalProof extends FormalProof {
  id: string;
  createdAt: number;
  proofSteps: ProofStep[];
  inferenceSteps?: ProofStep[]; // Alias for proofSteps for backward compatibility
  assumptions: LogicalFormula[];
  lemmas: Lemma[];
  complexity: ProofComplexity;
  verificationHistory: VerificationAttempt[];
}

/**
 * Individual proof step in a formal proof
 */
export interface ProofStep {
  id: string;
  stepNumber: number;
  rule: InferenceRule;
  premises: string[]; // References to previous steps or assumptions
  conclusion: LogicalFormula;
  justification: string;
  confidence: number;
}

/**
 * Lemma used in proof construction
 */
export interface Lemma {
  id: string;
  name: string;
  statement: LogicalFormula;
  proof?: ExtendedFormalProof;
  isAxiom: boolean;
  domain: string[];
}

/**
 * Proof complexity metrics
 */
export interface ProofComplexity {
  stepCount: number;
  depth: number;
  branchingFactor: number;
  cyclomaticComplexity: number;
  logicalComplexity: number;
}

/**
 * Verification attempt record
 */
export interface VerificationAttempt {
  timestamp: number;
  proverSystem: ProofSystem;
  result: ProofValidity;
  duration: number;
  resources: VerificationResources;
}

/**
 * Resources used during verification
 */
export interface VerificationResources {
  memoryUsed: number;
  cpuTime: number;
  theoremProverCalls: number;
  cacheHits: number;
}

/**
 * Proof construction context
 */
export interface ProofConstructionContext {
  targetTheorem: LogicalFormula;
  availableLemmas: Lemma[];
  axioms: LogicalFormula[];
  constraints: ProofConstraint[];
  preferences: ProofPreferences;
}

/**
 * Constraints on proof construction
 */
export interface ProofConstraint {
  type: ConstraintType;
  value: any;
  priority: number;
}

export enum ConstraintType {
  MAX_STEPS = 'MAX_STEPS',
  MAX_DEPTH = 'MAX_DEPTH',
  TIME_LIMIT = 'TIME_LIMIT',
  MEMORY_LIMIT = 'MEMORY_LIMIT',
  REQUIRED_LEMMAS = 'REQUIRED_LEMMAS',
  FORBIDDEN_RULES = 'FORBIDDEN_RULES'
}

/**
 * Preferences for proof construction
 */
export interface ProofPreferences {
  preferredStyle: ProofStyle;
  minimizeSteps: boolean;
  maximizeReadability: boolean;
  preferConstructive: boolean;
  allowNonClassical: boolean;
}

export enum ProofStyle {
  NATURAL_DEDUCTION = 'NATURAL_DEDUCTION',
  SEQUENT_CALCULUS = 'SEQUENT_CALCULUS',
  RESOLUTION = 'RESOLUTION',
  TABLEAU = 'TABLEAU',
  HILBERT_STYLE = 'HILBERT_STYLE'
}

/**
 * Proof validation result with detailed feedback
 */
export interface ProofValidationResult {
  isValid: boolean;
  confidence: number;
  errors: ProofError[];
  warnings: ProofWarning[];
  suggestions: ProofSuggestion[];
  metrics: ProofMetrics;
}

/**
 * Proof error information
 */
export interface ProofError {
  stepId: string;
  errorType: ProofErrorType;
  message: string;
  severity: ErrorSeverity;
  suggestedFix?: string;
}

export enum ProofErrorType {
  INVALID_INFERENCE = 'INVALID_INFERENCE',
  MISSING_PREMISE = 'MISSING_PREMISE',
  CIRCULAR_REASONING = 'CIRCULAR_REASONING',
  UNDEFINED_VARIABLE = 'UNDEFINED_VARIABLE',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  LOGICAL_INCONSISTENCY = 'LOGICAL_INCONSISTENCY'
}

export enum ErrorSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * Proof warning information
 */
export interface ProofWarning {
  stepId: string;
  warningType: ProofWarningType;
  message: string;
  recommendation?: string;
}

export enum ProofWarningType {
  INEFFICIENT_STEP = 'INEFFICIENT_STEP',
  REDUNDANT_PREMISE = 'REDUNDANT_PREMISE',
  COMPLEX_FORMULA = 'COMPLEX_FORMULA',
  UNUSUAL_INFERENCE = 'UNUSUAL_INFERENCE'
}

/**
 * Proof improvement suggestion
 */
export interface ProofSuggestion {
  type: SuggestionType;
  description: string;
  impact: ImpactLevel;
  implementation: () => Promise<ExtendedFormalProof>;
}

export enum SuggestionType {
  SIMPLIFY_STEP = 'SIMPLIFY_STEP',
  COMBINE_STEPS = 'COMBINE_STEPS',
  ADD_LEMMA = 'ADD_LEMMA',
  REORDER_STEPS = 'REORDER_STEPS',
  ALTERNATIVE_APPROACH = 'ALTERNATIVE_APPROACH'
}

export enum ImpactLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

/**
 * Proof quality metrics
 */
export interface ProofMetrics {
  correctness: number;
  completeness: number;
  elegance: number;
  readability: number;
  efficiency: number;
  robustness: number;
}

/**
 * Formal Proof System Manager
 * Manages proof construction, validation, and optimization
 */
export class FormalProofSystem {
  private proofCache: Map<string, ExtendedFormalProof> = new Map();
  private lemmaLibrary: Map<string, Lemma> = new Map();
  private inferenceRules: Map<string, InferenceRule> = new Map();
  private verificationProviders: Map<ProofSystem, ProofVerifier> = new Map();

  constructor() {
    this.initializeStandardRules();
    this.initializeStandardLemmas();
  }

  /**
   * Create a new formal proof
   */
  public createProof(
    premises: LogicalFormula[],
    conclusion: LogicalFormula,
    context?: ProofConstructionContext
  ): ExtendedFormalProof {
    const proofId = this.generateProofId();
    
    const proof: ExtendedFormalProof = {
      id: proofId,
      premises,
      inference: [],
      conclusion,
      proofSystem: ProofSystem.HOARE_LOGIC,
      validity: {
        isValid: false,
        confidence: 0,
        verifiedBy: [],
        errors: []
      },
      strength: 0,
      createdAt: Date.now(),
      proofSteps: [],
      inferenceSteps: [], // Initialize as alias for proofSteps
      assumptions: premises,
      lemmas: context?.availableLemmas || [],
      complexity: this.calculateInitialComplexity(premises, conclusion),
      verificationHistory: []
    };

    this.proofCache.set(proofId, proof);
    return proof;
  }

  /**
   * Add a proof step to an existing proof
   */
  public addProofStep(
    proofId: string,
    rule: InferenceRule,
    premises: string[],
    conclusion: LogicalFormula,
    justification: string
  ): ProofStep {
    const proof = this.proofCache.get(proofId);
    if (!proof) {
      throw new Error(`Proof not found: ${proofId}`);
    }

    const step: ProofStep = {
      id: `${proofId}-step-${proof.proofSteps.length + 1}`,
      stepNumber: proof.proofSteps.length + 1,
      rule,
      premises,
      conclusion,
      justification,
      confidence: this.calculateStepConfidence(rule, premises, conclusion)
    };

    proof.proofSteps.push(step);
    proof.inferenceSteps = proof.proofSteps; // Keep inferenceSteps in sync
    proof.inference.push(rule);
    
    // Update complexity metrics
    proof.complexity = this.recalculateComplexity(proof);
    
    return step;
  }

  /**
   * Validate a formal proof
   */
  public async validateProof(proofId: string): Promise<ProofValidationResult> {
    const proof = this.proofCache.get(proofId);
    if (!proof) {
      throw new Error(`Proof not found: ${proofId}`);
    }

    const errors: ProofError[] = [];
    const warnings: ProofWarning[] = [];
    const suggestions: ProofSuggestion[] = [];

    // Validate each proof step
    for (const step of proof.proofSteps) {
      const stepValidation = await this.validateProofStep(step, proof);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    }

    // Check overall proof structure
    const structuralValidation = this.validateProofStructure(proof);
    errors.push(...structuralValidation.errors);
    warnings.push(...structuralValidation.warnings);

    // Generate suggestions for improvement
    suggestions.push(...this.generateProofSuggestions(proof));

    const isValid = errors.filter(e => e.severity >= ErrorSeverity.HIGH).length === 0;
    const confidence = this.calculateProofConfidence(proof, errors, warnings);
    const metrics = this.calculateProofMetrics(proof, errors, warnings);

    // Update proof validity
    proof.validity = {
      isValid,
      confidence,
      verifiedBy: [ProofSystem.HOARE_LOGIC],
      errors: errors.map(e => e.message)
    };
    proof.strength = confidence;

    return {
      isValid,
      confidence,
      errors,
      warnings,
      suggestions,
      metrics
    };
  }

  /**
   * Verify proof using external theorem prover
   */
  public async verifyWithTheoremProver(
    proofId: string,
    proverSystem: ProofSystem
  ): Promise<ProofValidity> {
    const proof = this.proofCache.get(proofId);
    if (!proof) {
      throw new Error(`Proof not found: ${proofId}`);
    }

    const verifier = this.verificationProviders.get(proverSystem);
    if (!verifier) {
      throw new Error(`No verifier available for ${proverSystem}`);
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await verifier.verify(proof);
      
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      // Record verification attempt
      const attempt: VerificationAttempt = {
        timestamp: Date.now(),
        proverSystem,
        result,
        duration,
        resources: {
          memoryUsed,
          cpuTime: duration,
          theoremProverCalls: 1,
          cacheHits: 0
        }
      };

      proof.verificationHistory.push(attempt);
      
      return result;

    } catch (error) {
      const result: ProofValidity = {
        isValid: false,
        confidence: 0,
        verifiedBy: [],
        errors: [(error as Error).message]
      };

      const attempt: VerificationAttempt = {
        timestamp: Date.now(),
        proverSystem,
        result,
        duration: Date.now() - startTime,
        resources: {
          memoryUsed: process.memoryUsage().heapUsed - startMemory,
          cpuTime: Date.now() - startTime,
          theoremProverCalls: 1,
          cacheHits: 0
        }
      };

      proof.verificationHistory.push(attempt);
      
      return result;
    }
  }

  /**
   * Get proof by ID
   */
  public getProof(proofId: string): ExtendedFormalProof | undefined {
    return this.proofCache.get(proofId);
  }

  /**
   * Register a new inference rule
   */
  public registerInferenceRule(rule: InferenceRule): void {
    this.inferenceRules.set(rule.name, rule);
  }

  /**
   * Register a new lemma
   */
  public registerLemma(lemma: Lemma): void {
    this.lemmaLibrary.set(lemma.id, lemma);
  }

  /**
   * Register a proof verifier
   */
  public registerVerifier(system: ProofSystem, verifier: ProofVerifier): void {
    this.verificationProviders.set(system, verifier);
  }

  /**
   * Get proof statistics
   */
  public getProofStatistics(): {
    totalProofs: number;
    validProofs: number;
    averageComplexity: number;
    averageConfidence: number;
    mostUsedRules: string[];
  } {
    const proofs = Array.from(this.proofCache.values());
    const validProofs = proofs.filter(p => p.validity.isValid);
    
    const totalComplexity = proofs.reduce((sum, p) => sum + p.complexity.stepCount, 0);
    const averageComplexity = proofs.length > 0 ? totalComplexity / proofs.length : 0;
    
    const totalConfidence = proofs.reduce((sum, p) => sum + p.validity.confidence, 0);
    const averageConfidence = proofs.length > 0 ? totalConfidence / proofs.length : 0;

    // Count rule usage
    const ruleUsage = new Map<string, number>();
    for (const proof of proofs) {
      for (const step of proof.proofSteps) {
        const count = ruleUsage.get(step.rule.name) || 0;
        ruleUsage.set(step.rule.name, count + 1);
      }
    }

    const mostUsedRules = Array.from(ruleUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rule]) => rule);

    return {
      totalProofs: proofs.length,
      validProofs: validProofs.length,
      averageComplexity,
      averageConfidence,
      mostUsedRules
    };
  }

  // Private helper methods

  private initializeStandardRules(): void {
    // Modus Ponens
    this.registerInferenceRule({
      name: 'ModusPonens',
      premises: [
        { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
        { expression: 'P', variables: [], type: FormulaType.ASSERTION }
      ],
      conclusion: { expression: 'Q', variables: [], type: FormulaType.ASSERTION },
      soundness: true
    });

    // Modus Tollens
    this.registerInferenceRule({
      name: 'ModusTollens',
      premises: [
        { expression: 'P → Q', variables: [], type: FormulaType.ASSERTION },
        { expression: '¬Q', variables: [], type: FormulaType.ASSERTION }
      ],
      conclusion: { expression: '¬P', variables: [], type: FormulaType.ASSERTION },
      soundness: true
    });

    // Universal Instantiation
    this.registerInferenceRule({
      name: 'UniversalInstantiation',
      premises: [
        { expression: '∀x P(x)', variables: [], type: FormulaType.ASSERTION }
      ],
      conclusion: { expression: 'P(a)', variables: [], type: FormulaType.ASSERTION },
      soundness: true
    });

    // Existential Generalization
    this.registerInferenceRule({
      name: 'ExistentialGeneralization',
      premises: [
        { expression: 'P(a)', variables: [], type: FormulaType.ASSERTION }
      ],
      conclusion: { expression: '∃x P(x)', variables: [], type: FormulaType.ASSERTION },
      soundness: true
    });
  }

  private initializeStandardLemmas(): void {
    // Identity lemma
    this.registerLemma({
      id: 'identity',
      name: 'Identity',
      statement: { expression: 'P → P', variables: [], type: FormulaType.ASSERTION },
      isAxiom: true,
      domain: ['logic']
    });

    // Contradiction lemma
    this.registerLemma({
      id: 'contradiction',
      name: 'Contradiction',
      statement: { expression: '¬(P ∧ ¬P)', variables: [], type: FormulaType.ASSERTION },
      isAxiom: true,
      domain: ['logic']
    });

    // Excluded middle
    this.registerLemma({
      id: 'excluded-middle',
      name: 'Excluded Middle',
      statement: { expression: 'P ∨ ¬P', variables: [], type: FormulaType.ASSERTION },
      isAxiom: true,
      domain: ['classical-logic']
    });
  }

  private generateProofId(): string {
    return `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateInitialComplexity(premises: LogicalFormula[], conclusion: LogicalFormula): ProofComplexity {
    return {
      stepCount: 0,
      depth: 0,
      branchingFactor: 1,
      cyclomaticComplexity: 1,
      logicalComplexity: premises.length + 1
    };
  }

  private recalculateComplexity(proof: ExtendedFormalProof): ProofComplexity {
    const stepCount = proof.proofSteps.length;
    const depth = this.calculateProofDepth(proof);
    const branchingFactor = this.calculateBranchingFactor(proof);
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(proof);
    const logicalComplexity = this.calculateLogicalComplexity(proof);

    return {
      stepCount,
      depth,
      branchingFactor,
      cyclomaticComplexity,
      logicalComplexity
    };
  }

  private calculateProofDepth(proof: ExtendedFormalProof): number {
    // Calculate the maximum depth of dependency chains
    const dependencies = new Map<string, string[]>();
    
    for (const step of proof.proofSteps) {
      dependencies.set(step.id, step.premises);
    }

    let maxDepth = 0;
    for (const step of proof.proofSteps) {
      const depth = this.calculateStepDepth(step.id, dependencies, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private calculateStepDepth(stepId: string, dependencies: Map<string, string[]>, visited: Set<string>): number {
    if (visited.has(stepId)) return 0; // Avoid cycles
    visited.add(stepId);

    const deps = dependencies.get(stepId) || [];
    if (deps.length === 0) return 1;

    let maxDepth = 0;
    for (const dep of deps) {
      const depth = this.calculateStepDepth(dep, dependencies, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  private calculateBranchingFactor(proof: ExtendedFormalProof): number {
    if (proof.proofSteps.length === 0) return 1;
    
    const totalPremises = proof.proofSteps.reduce((sum, step) => sum + step.premises.length, 0);
    return totalPremises / proof.proofSteps.length;
  }

  private calculateCyclomaticComplexity(proof: ExtendedFormalProof): number {
    // Simplified cyclomatic complexity for proof structures
    const edges = proof.proofSteps.reduce((sum, step) => sum + step.premises.length, 0);
    const nodes = proof.proofSteps.length + proof.assumptions.length;
    return edges - nodes + 2;
  }

  private calculateLogicalComplexity(proof: ExtendedFormalProof): number {
    // Count logical operators and quantifiers
    let complexity = 0;
    
    for (const step of proof.proofSteps) {
      complexity += this.countLogicalOperators(step.conclusion.expression);
    }
    
    return complexity;
  }

  private countLogicalOperators(expression: string): number {
    const operators = ['∧', '∨', '→', '↔', '¬', '∀', '∃'];
    let count = 0;
    
    for (const op of operators) {
      count += (expression.match(new RegExp(op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    }
    
    return count;
  }

  private calculateStepConfidence(rule: InferenceRule, premises: string[], conclusion: LogicalFormula): number {
    // Base confidence on rule soundness and premise availability
    let confidence = rule.soundness ? 0.9 : 0.5;
    
    // Reduce confidence for steps with many premises (more complex)
    confidence *= Math.max(0.5, 1 - (premises.length * 0.1));
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private async validateProofStep(step: ProofStep, proof: ExtendedFormalProof): Promise<{
    errors: ProofError[];
    warnings: ProofWarning[];
  }> {
    const errors: ProofError[] = [];
    const warnings: ProofWarning[] = [];

    // Check if rule exists
    if (!this.inferenceRules.has(step.rule.name)) {
      errors.push({
        stepId: step.id,
        errorType: ProofErrorType.INVALID_INFERENCE,
        message: `Unknown inference rule: ${step.rule.name}`,
        severity: ErrorSeverity.HIGH
      });
    }

    // Check if premises are available
    for (const premise of step.premises) {
      const isAvailable = this.isPremiseAvailable(premise, step, proof);
      if (!isAvailable) {
        errors.push({
          stepId: step.id,
          errorType: ProofErrorType.MISSING_PREMISE,
          message: `Premise not available: ${premise}`,
          severity: ErrorSeverity.HIGH
        });
      }
    }

    // Check for circular reasoning
    if (this.hasCircularReasoning(step, proof)) {
      errors.push({
        stepId: step.id,
        errorType: ProofErrorType.CIRCULAR_REASONING,
        message: 'Circular reasoning detected',
        severity: ErrorSeverity.CRITICAL
      });
    }

    // Performance warnings
    if (step.premises.length > 5) {
      warnings.push({
        stepId: step.id,
        warningType: ProofWarningType.COMPLEX_FORMULA,
        message: 'Step has many premises, consider simplification'
      });
    }

    return { errors, warnings };
  }

  private validateProofStructure(proof: ExtendedFormalProof): {
    errors: ProofError[];
    warnings: ProofWarning[];
  } {
    const errors: ProofError[] = [];
    const warnings: ProofWarning[] = [];

    // Check if proof reaches the conclusion
    const lastStep = proof.proofSteps[proof.proofSteps.length - 1];
    if (lastStep && lastStep.conclusion.expression !== proof.conclusion.expression) {
      errors.push({
        stepId: 'structure',
        errorType: ProofErrorType.LOGICAL_INCONSISTENCY,
        message: 'Proof does not reach the intended conclusion',
        severity: ErrorSeverity.CRITICAL
      });
    }

    // Check for unused assumptions
    const usedAssumptions = new Set<string>();
    for (const step of proof.proofSteps) {
      for (const premise of step.premises) {
        usedAssumptions.add(premise);
      }
    }

    for (let i = 0; i < proof.assumptions.length; i++) {
      const assumptionId = `assumption-${i}`;
      if (!usedAssumptions.has(assumptionId)) {
        warnings.push({
          stepId: 'structure',
          warningType: ProofWarningType.REDUNDANT_PREMISE,
          message: `Unused assumption: ${proof.assumptions[i].expression}`
        });
      }
    }

    return { errors, warnings };
  }

  private generateProofSuggestions(proof: ExtendedFormalProof): ProofSuggestion[] {
    const suggestions: ProofSuggestion[] = [];

    // Suggest combining consecutive steps with same rule
    for (let i = 0; i < proof.proofSteps.length - 1; i++) {
      const current = proof.proofSteps[i];
      const next = proof.proofSteps[i + 1];
      
      if (current.rule.name === next.rule.name) {
        suggestions.push({
          type: SuggestionType.COMBINE_STEPS,
          description: `Consider combining steps ${current.stepNumber} and ${next.stepNumber}`,
          impact: ImpactLevel.MEDIUM,
          implementation: async () => {
            // Implementation would combine the steps
            return proof;
          }
        });
      }
    }

    // Suggest adding lemmas for complex proofs
    if (proof.complexity.stepCount > 10) {
      suggestions.push({
        type: SuggestionType.ADD_LEMMA,
        description: 'Consider breaking this proof into lemmas',
        impact: ImpactLevel.HIGH,
        implementation: async () => {
          // Implementation would suggest lemma extraction
          return proof;
        }
      });
    }

    return suggestions;
  }

  private calculateProofConfidence(
    proof: ExtendedFormalProof,
    errors: ProofError[],
    warnings: ProofWarning[]
  ): number {
    let confidence = 1.0;

    // Reduce confidence for errors
    for (const error of errors) {
      confidence -= error.severity * 0.2;
    }

    // Slightly reduce confidence for warnings
    confidence -= warnings.length * 0.05;

    // Adjust for proof complexity
    const complexityPenalty = Math.min(0.3, proof.complexity.stepCount * 0.01);
    confidence -= complexityPenalty;

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  private calculateProofMetrics(
    proof: ExtendedFormalProof,
    errors: ProofError[],
    warnings: ProofWarning[]
  ): ProofMetrics {
    const correctness = errors.length === 0 ? 1.0 : Math.max(0, 1 - errors.length * 0.2);
    const completeness = proof.proofSteps.length > 0 ? 0.9 : 0.0;
    const elegance = Math.max(0, 1 - proof.complexity.stepCount * 0.05);
    const readability = Math.max(0, 1 - warnings.length * 0.1);
    const efficiency = Math.max(0, 1 - proof.complexity.cyclomaticComplexity * 0.1);
    const robustness = Math.max(0, 1 - errors.filter(e => e.severity >= ErrorSeverity.HIGH).length * 0.3);

    return {
      correctness,
      completeness,
      elegance,
      readability,
      efficiency,
      robustness
    };
  }

  private isPremiseAvailable(premise: string, step: ProofStep, proof: ExtendedFormalProof): boolean {
    // Check if premise is an assumption
    for (let i = 0; i < proof.assumptions.length; i++) {
      if (premise === `assumption-${i}`) {
        return true;
      }
    }

    // Check if premise is from a previous step
    for (const prevStep of proof.proofSteps) {
      if (prevStep.stepNumber < step.stepNumber && prevStep.id === premise) {
        return true;
      }
    }

    return false;
  }

  private hasCircularReasoning(step: ProofStep, proof: ExtendedFormalProof): boolean {
    // Simplified circular reasoning detection
    const visited = new Set<string>();
    return this.checkCircularDependency(step.id, step.premises, proof, visited);
  }

  private checkCircularDependency(
    stepId: string,
    premises: string[],
    proof: ExtendedFormalProof,
    visited: Set<string>
  ): boolean {
    if (visited.has(stepId)) {
      return true;
    }

    visited.add(stepId);

    for (const premise of premises) {
      const premiseStep = proof.proofSteps.find(s => s.id === premise);
      if (premiseStep) {
        if (this.checkCircularDependency(premiseStep.id, premiseStep.premises, proof, new Set(visited))) {
          return true;
        }
      }
    }

    return false;
  }
}

/**
 * Interface for external proof verifiers
 */
export interface ProofVerifier {
  verify(proof: ExtendedFormalProof): Promise<ProofValidity>;
  translateProof(proof: ExtendedFormalProof): Promise<ProofTranslation>;
  getCapabilities(): VerifierCapabilities;
}

/**
 * Capabilities of a proof verifier
 */
export interface VerifierCapabilities {
  supportedLogics: string[];
  maxComplexity: number;
  timeoutSeconds: number;
  supportsInteractive: boolean;
}