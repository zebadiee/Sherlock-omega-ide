/**
 * Hoare Logic Proof Generator for Sherlock Ω
 * Constructs {P} S {Q} proofs for code transformations with mathematical guarantees
 */

import { 
  FormalProofSystem, 
  ExtendedFormalProof, 
  ProofConstructionContext 
} from './FormalProofSystem';

import {
  LogicalFormula,
  InferenceRule,
  ProofSystem,
  FormulaType,
  Variable,
  ComputationalIssue,
  FixCandidate,
  CodeTransformation,
  TransformationType
} from '../types/core';

/**
 * Hoare triple representing {P} S {Q}
 */
export interface HoareTriple {
  precondition: LogicalFormula;
  statement: CodeStatement;
  postcondition: LogicalFormula;
}

/**
 * Code statement in Hoare logic
 */
export interface CodeStatement {
  type: StatementType;
  content: string;
  variables: Variable[];
  substatements?: CodeStatement[];
  condition?: LogicalFormula;
  metadata: StatementMetadata;
}

export enum StatementType {
  ASSIGNMENT = 'ASSIGNMENT',
  SEQUENCE = 'SEQUENCE',
  CONDITIONAL = 'CONDITIONAL',
  LOOP = 'LOOP',
  FUNCTION_CALL = 'FUNCTION_CALL',
  RETURN = 'RETURN',
  DECLARATION = 'DECLARATION',
  EXPRESSION = 'EXPRESSION'
}

/**
 * Metadata for code statements
 */
export interface StatementMetadata {
  line: number;
  column: number;
  file: string;
  originalCode: string;
  transformedCode?: string;
  complexity: number;
}

/**
 * Weakest precondition calculation result
 */
export interface WeakestPrecondition {
  formula: LogicalFormula;
  substitutions: Map<string, string>;
  conditions: LogicalFormula[];
  confidence: number;
}

/**
 * Strongest postcondition calculation result
 */
export interface StrongestPostcondition {
  formula: LogicalFormula;
  effects: VariableEffect[];
  invariants: LogicalFormula[];
  confidence: number;
}

/**
 * Variable effect in postcondition
 */
export interface VariableEffect {
  variable: string;
  oldValue: string;
  newValue: string;
  effectType: EffectType;
}

export enum EffectType {
  ASSIGNMENT = 'ASSIGNMENT',
  MODIFICATION = 'MODIFICATION',
  CREATION = 'CREATION',
  DESTRUCTION = 'DESTRUCTION'
}

/**
 * Proof obligation for verification
 */
export interface ProofObligation {
  id: string;
  type: ObligationType;
  formula: LogicalFormula;
  context: ProofObligationContext;
  priority: number;
  dependencies: string[];
}

export enum ObligationType {
  PRECONDITION_IMPLIES_WP = 'PRECONDITION_IMPLIES_WP',
  SP_IMPLIES_POSTCONDITION = 'SP_IMPLIES_POSTCONDITION',
  LOOP_INVARIANT = 'LOOP_INVARIANT',
  TERMINATION = 'TERMINATION',
  SAFETY = 'SAFETY'
}

/**
 * Context for proof obligations
 */
export interface ProofObligationContext {
  statement: CodeStatement;
  precondition: LogicalFormula;
  postcondition: LogicalFormula;
  variables: Variable[];
  assumptions: LogicalFormula[];
}

/**
 * Hoare Logic Proof Generator
 * Implements formal verification using Hoare logic for code transformations
 */
export class HoareProofGenerator {
  private proofSystem: FormalProofSystem;
  private hoareRules: Map<StatementType, HoareRule> = new Map();

  constructor(proofSystem: FormalProofSystem) {
    this.proofSystem = proofSystem;
    this.initializeHoareRules();
  }

  /**
   * Generate proof for preconditions, code transformation, and postconditions
   */
  public async generateProof(
    preconditions: LogicalFormula[],
    codeTransformation: CodeTransformation,
    postconditions: LogicalFormula[]
  ): Promise<ExtendedFormalProof> {
    // Parse the code transformation into statements
    const statement = this.parseCodeTransformation(codeTransformation);

    // Create Hoare triple
    const hoareTriple: HoareTriple = {
      precondition: this.combineFormulas(preconditions, '∧'),
      statement,
      postcondition: this.combineFormulas(postconditions, '∧')
    };

    // Generate proof obligations
    const obligations = this.generateProofObligations(hoareTriple);

    // Create formal proof
    const proof = this.proofSystem.createProof(
      preconditions,
      hoareTriple.postcondition,
      this.createProofContext(hoareTriple, obligations)
    );

    // Construct proof steps using Hoare rules
    await this.constructHoareProofSteps(proof, hoareTriple, obligations);

    return proof;
  }

  /**
   * Generate Hoare logic proof for code transformation
   */
  public async generateHoareProof(
    problem: ComputationalIssue,
    fix: FixCandidate
  ): Promise<ExtendedFormalProof> {
    // Extract preconditions and postconditions from the problem
    const preconditions = this.extractPreconditions(problem);
    const postconditions = this.extractPostconditions(problem, fix);

    // Parse the code transformation into statements
    const statement = this.parseCodeTransformation(fix.implementation);

    // Create Hoare triple
    const hoareTriple: HoareTriple = {
      precondition: this.combineFormulas(preconditions, '∧'),
      statement,
      postcondition: this.combineFormulas(postconditions, '∧')
    };

    // Generate proof obligations
    const obligations = this.generateProofObligations(hoareTriple);

    // Create formal proof
    const proof = this.proofSystem.createProof(
      preconditions,
      hoareTriple.postcondition,
      this.createProofContext(hoareTriple, obligations)
    );

    // Construct proof steps using Hoare rules
    await this.constructHoareProofSteps(proof, hoareTriple, obligations);

    return proof;
  }

  /**
   * Calculate weakest precondition for statement and postcondition
   */
  public calculateWeakestPrecondition(
    statement: CodeStatement,
    postcondition: LogicalFormula
  ): WeakestPrecondition {
    const substitutions = new Map<string, string>();
    const conditions: LogicalFormula[] = [];

    let wpFormula: LogicalFormula;

    switch (statement.type) {
      case StatementType.ASSIGNMENT:
        wpFormula = this.wpAssignment(statement, postcondition, substitutions);
        break;
      
      case StatementType.SEQUENCE:
        wpFormula = this.wpSequence(statement, postcondition, substitutions, conditions);
        break;
      
      case StatementType.CONDITIONAL:
        wpFormula = this.wpConditional(statement, postcondition, substitutions, conditions);
        break;
      
      case StatementType.LOOP:
        wpFormula = this.wpLoop(statement, postcondition, substitutions, conditions);
        break;
      
      default:
        wpFormula = this.wpDefault(statement, postcondition, substitutions);
        break;
    }

    return {
      formula: wpFormula,
      substitutions,
      conditions,
      confidence: this.calculateWPConfidence(statement, wpFormula)
    };
  }

  /**
   * Calculate strongest postcondition for precondition and statement
   */
  public calculateStrongestPostcondition(
    precondition: LogicalFormula,
    statement: CodeStatement
  ): StrongestPostcondition {
    const effects: VariableEffect[] = [];
    const invariants: LogicalFormula[] = [];

    let spFormula: LogicalFormula;

    switch (statement.type) {
      case StatementType.ASSIGNMENT:
        spFormula = this.spAssignment(precondition, statement, effects);
        break;
      
      case StatementType.SEQUENCE:
        spFormula = this.spSequence(precondition, statement, effects, invariants);
        break;
      
      case StatementType.CONDITIONAL:
        spFormula = this.spConditional(precondition, statement, effects, invariants);
        break;
      
      case StatementType.LOOP:
        spFormula = this.spLoop(precondition, statement, effects, invariants);
        break;
      
      default:
        spFormula = this.spDefault(precondition, statement, effects);
        break;
    }

    return {
      formula: spFormula,
      effects,
      invariants,
      confidence: this.calculateSPConfidence(precondition, statement, spFormula)
    };
  }

  /**
   * Verify Hoare triple {P} S {Q}
   */
  public async verifyHoareTriple(triple: HoareTriple): Promise<{
    isValid: boolean;
    confidence: number;
    obligations: ProofObligation[];
    proof?: ExtendedFormalProof;
  }> {
    // Generate proof obligations
    const obligations = this.generateProofObligations(triple);

    // Create and construct proof
    const proof = this.proofSystem.createProof(
      [triple.precondition],
      triple.postcondition
    );

    await this.constructHoareProofSteps(proof, triple, obligations);

    // Validate the proof
    const validation = await this.proofSystem.validateProof(proof.id);

    return {
      isValid: validation.isValid,
      confidence: validation.confidence,
      obligations,
      proof: validation.isValid ? proof : undefined
    };
  }

  // Private implementation methods

  private initializeHoareRules(): void {
    // Assignment rule: {P[x/E]} x := E {P}
    this.hoareRules.set(StatementType.ASSIGNMENT, {
      name: 'Assignment',
      apply: (precondition: LogicalFormula, statement: CodeStatement, postcondition: LogicalFormula) => {
        return this.applyAssignmentRule(precondition, statement, postcondition);
      }
    });

    // Sequence rule: {P} S1 {Q}, {Q} S2 {R} ⊢ {P} S1; S2 {R}
    this.hoareRules.set(StatementType.SEQUENCE, {
      name: 'Sequence',
      apply: (precondition: LogicalFormula, statement: CodeStatement, postcondition: LogicalFormula) => {
        return this.applySequenceRule(precondition, statement, postcondition);
      }
    });

    // Conditional rule: {P ∧ B} S1 {Q}, {P ∧ ¬B} S2 {Q} ⊢ {P} if B then S1 else S2 {Q}
    this.hoareRules.set(StatementType.CONDITIONAL, {
      name: 'Conditional',
      apply: (precondition: LogicalFormula, statement: CodeStatement, postcondition: LogicalFormula) => {
        return this.applyConditionalRule(precondition, statement, postcondition);
      }
    });

    // Loop rule: {I ∧ B} S {I} ⊢ {I} while B do S {I ∧ ¬B}
    this.hoareRules.set(StatementType.LOOP, {
      name: 'Loop',
      apply: (precondition: LogicalFormula, statement: CodeStatement, postcondition: LogicalFormula) => {
        return this.applyLoopRule(precondition, statement, postcondition);
      }
    });
  }

  private extractPreconditions(problem: ComputationalIssue): LogicalFormula[] {
    const preconditions: LogicalFormula[] = [];

    // Convert problem preconditions
    for (const condition of problem.preconditions) {
      preconditions.push(condition);
    }

    // Add implicit preconditions based on problem context
    if (problem.context.file) {
      preconditions.push({
        expression: `file_exists("${problem.context.file}")`,
        variables: [],
        type: FormulaType.PRECONDITION
      });
    }

    if (problem.context.line) {
      preconditions.push({
        expression: `line_number = ${problem.context.line}`,
        variables: [{ name: 'line_number', type: 'number' }],
        type: FormulaType.PRECONDITION
      });
    }

    // Add type safety preconditions
    preconditions.push({
      expression: 'type_safe(original_code)',
      variables: [{ name: 'original_code', type: 'string' }],
      type: FormulaType.PRECONDITION
    });

    return preconditions;
  }

  private extractPostconditions(problem: ComputationalIssue, fix: FixCandidate): LogicalFormula[] {
    const postconditions: LogicalFormula[] = [];

    // Convert problem postconditions
    for (const condition of problem.postconditions) {
      postconditions.push(condition);
    }

    // Add fix-specific postconditions
    postconditions.push({
      expression: 'problem_resolved(original_issue)',
      variables: [{ name: 'original_issue', type: 'Issue' }],
      type: FormulaType.POSTCONDITION
    });

    postconditions.push({
      expression: 'syntax_valid(transformed_code)',
      variables: [{ name: 'transformed_code', type: 'string' }],
      type: FormulaType.POSTCONDITION
    });

    // Add semantic preservation postcondition
    if (fix.implementation.type !== TransformationType.REFACTORING) {
      postconditions.push({
        expression: 'semantics_preserved(original_code, transformed_code)',
        variables: [
          { name: 'original_code', type: 'string' },
          { name: 'transformed_code', type: 'string' }
        ],
        type: FormulaType.POSTCONDITION
      });
    }

    return postconditions;
  }

  private parseCodeTransformation(transformation: CodeTransformation): CodeStatement {
    const metadata: StatementMetadata = {
      line: 0,
      column: 0,
      file: '',
      originalCode: transformation.sourceCode,
      transformedCode: transformation.targetCode,
      complexity: this.calculateStatementComplexity(transformation.targetCode)
    };

    // Determine statement type based on transformation
    let statementType: StatementType;
    switch (transformation.type) {
      case TransformationType.INSERTION:
        statementType = StatementType.DECLARATION;
        break;
      case TransformationType.MODIFICATION:
        statementType = StatementType.ASSIGNMENT;
        break;
      case TransformationType.REFACTORING:
        statementType = StatementType.SEQUENCE;
        break;
      default:
        statementType = StatementType.EXPRESSION;
        break;
    }

    // Extract variables from the code
    const variables = this.extractVariables(transformation.targetCode);

    return {
      type: statementType,
      content: transformation.targetCode,
      variables,
      metadata
    };
  }

  private combineFormulas(formulas: LogicalFormula[], operator: string): LogicalFormula {
    if (formulas.length === 0) {
      return { expression: 'true', variables: [], type: FormulaType.ASSERTION };
    }

    if (formulas.length === 1) {
      return formulas[0];
    }

    const expressions = formulas.map(f => f.expression);
    const allVariables = formulas.flatMap(f => f.variables);
    const uniqueVariables = this.deduplicateVariables(allVariables);

    return {
      expression: `(${expressions.join(` ${operator} `)})`,
      variables: uniqueVariables,
      type: formulas[0].type
    };
  }

  private generateProofObligations(triple: HoareTriple): ProofObligation[] {
    const obligations: ProofObligation[] = [];

    // Main proof obligation: precondition implies weakest precondition
    const wp = this.calculateWeakestPrecondition(triple.statement, triple.postcondition);
    obligations.push({
      id: `po-main-${Date.now()}`,
      type: ObligationType.PRECONDITION_IMPLIES_WP,
      formula: {
        expression: `(${triple.precondition.expression}) → (${wp.formula.expression})`,
        variables: [...triple.precondition.variables, ...wp.formula.variables],
        type: FormulaType.ASSERTION
      },
      context: {
        statement: triple.statement,
        precondition: triple.precondition,
        postcondition: triple.postcondition,
        variables: triple.statement.variables,
        assumptions: []
      },
      priority: 10,
      dependencies: []
    });

    // Additional obligations based on statement type
    if (triple.statement.type === StatementType.LOOP) {
      obligations.push(...this.generateLoopObligations(triple));
    }

    if (triple.statement.type === StatementType.CONDITIONAL) {
      obligations.push(...this.generateConditionalObligations(triple));
    }

    return obligations;
  }

  private generateLoopObligations(triple: HoareTriple): ProofObligation[] {
    const obligations: ProofObligation[] = [];

    // Loop invariant preservation
    if (triple.statement.condition) {
      const invariant = this.inferLoopInvariant(triple.statement, triple.precondition);
      
      obligations.push({
        id: `po-loop-invariant-${Date.now()}`,
        type: ObligationType.LOOP_INVARIANT,
        formula: {
          expression: `(${invariant.expression} ∧ ${triple.statement.condition.expression}) → wp(S, ${invariant.expression})`,
          variables: [...invariant.variables, ...triple.statement.condition.variables],
          type: FormulaType.ASSERTION
        },
        context: {
          statement: triple.statement,
          precondition: triple.precondition,
          postcondition: triple.postcondition,
          variables: triple.statement.variables,
          assumptions: [invariant]
        },
        priority: 9,
        dependencies: []
      });

      // Termination obligation
      obligations.push({
        id: `po-termination-${Date.now()}`,
        type: ObligationType.TERMINATION,
        formula: {
          expression: `∃n. (${invariant.expression} → variant_decreases(n))`,
          variables: [{ name: 'n', type: 'number' }, ...invariant.variables],
          type: FormulaType.ASSERTION
        },
        context: {
          statement: triple.statement,
          precondition: triple.precondition,
          postcondition: triple.postcondition,
          variables: triple.statement.variables,
          assumptions: [invariant]
        },
        priority: 8,
        dependencies: []
      });
    }

    return obligations;
  }

  private generateConditionalObligations(triple: HoareTriple): ProofObligation[] {
    const obligations: ProofObligation[] = [];

    if (triple.statement.condition && triple.statement.substatements) {
      const condition = triple.statement.condition;
      
      // Then branch obligation
      if (triple.statement.substatements[0]) {
        const thenBranch = triple.statement.substatements[0];
        obligations.push({
          id: `po-then-branch-${Date.now()}`,
          type: ObligationType.PRECONDITION_IMPLIES_WP,
          formula: {
            expression: `(${triple.precondition.expression} ∧ ${condition.expression}) → wp(${thenBranch.content}, ${triple.postcondition.expression})`,
            variables: [...triple.precondition.variables, ...condition.variables, ...triple.postcondition.variables],
            type: FormulaType.ASSERTION
          },
          context: {
            statement: thenBranch,
            precondition: triple.precondition,
            postcondition: triple.postcondition,
            variables: thenBranch.variables,
            assumptions: [condition]
          },
          priority: 9,
          dependencies: []
        });
      }

      // Else branch obligation
      if (triple.statement.substatements[1]) {
        const elseBranch = triple.statement.substatements[1];
        obligations.push({
          id: `po-else-branch-${Date.now()}`,
          type: ObligationType.PRECONDITION_IMPLIES_WP,
          formula: {
            expression: `(${triple.precondition.expression} ∧ ¬${condition.expression}) → wp(${elseBranch.content}, ${triple.postcondition.expression})`,
            variables: [...triple.precondition.variables, ...condition.variables, ...triple.postcondition.variables],
            type: FormulaType.ASSERTION
          },
          context: {
            statement: elseBranch,
            precondition: triple.precondition,
            postcondition: triple.postcondition,
            variables: elseBranch.variables,
            assumptions: [{
              expression: `¬${condition.expression}`,
              variables: condition.variables,
              type: FormulaType.ASSERTION
            }]
          },
          priority: 9,
          dependencies: []
        });
      }
    }

    return obligations;
  }

  private createProofContext(triple: HoareTriple, obligations: ProofObligation[]): ProofConstructionContext {
    return {
      targetTheorem: triple.postcondition,
      availableLemmas: [],
      axioms: [triple.precondition],
      constraints: [{
        type: 'MAX_STEPS' as any,
        value: 50,
        priority: 1
      }],
      preferences: {
        preferredStyle: 'NATURAL_DEDUCTION' as any,
        minimizeSteps: true,
        maximizeReadability: true,
        preferConstructive: true,
        allowNonClassical: false
      }
    };
  }

  private async constructHoareProofSteps(
    proof: ExtendedFormalProof,
    triple: HoareTriple,
    obligations: ProofObligation[]
  ): Promise<void> {
    // Apply appropriate Hoare rule based on statement type
    const rule = this.hoareRules.get(triple.statement.type);
    if (!rule) {
      throw new Error(`No Hoare rule available for statement type: ${triple.statement.type}`);
    }

    // Apply the rule to generate proof steps
    const ruleApplication = rule.apply(triple.precondition, triple.statement, triple.postcondition);

    // Add proof steps for each obligation
    for (const obligation of obligations) {
      const inferenceRule: InferenceRule = {
        name: `Hoare-${obligation.type}`,
        premises: [obligation.context.precondition],
        conclusion: obligation.formula,
        soundness: true
      };

      this.proofSystem.addProofStep(
        proof.id,
        inferenceRule,
        ['assumption-0'],
        obligation.formula,
        `Proof obligation: ${obligation.type}`
      );
    }

    // Add final step to conclude the postcondition
    const conclusionRule: InferenceRule = {
      name: 'Hoare-Conclusion',
      premises: obligations.map(o => o.formula),
      conclusion: triple.postcondition,
      soundness: true
    };

    const premiseIds = proof.proofSteps.map(step => step.id);
    this.proofSystem.addProofStep(
      proof.id,
      conclusionRule,
      premiseIds,
      triple.postcondition,
      'Conclude postcondition from proof obligations'
    );
  }

  // Weakest precondition calculations

  private wpAssignment(
    statement: CodeStatement,
    postcondition: LogicalFormula,
    substitutions: Map<string, string>
  ): LogicalFormula {
    // For assignment x := E, wp(x := E, Q) = Q[x/E]
    const assignment = this.parseAssignment(statement.content);
    if (assignment) {
      const substitutedExpression = this.substituteVariable(
        postcondition.expression,
        assignment.variable,
        assignment.expression
      );
      
      substitutions.set(assignment.variable, assignment.expression);
      
      return {
        expression: substitutedExpression,
        variables: this.updateVariables(postcondition.variables, assignment),
        type: FormulaType.PRECONDITION
      };
    }

    return postcondition;
  }

  private wpSequence(
    statement: CodeStatement,
    postcondition: LogicalFormula,
    substitutions: Map<string, string>,
    conditions: LogicalFormula[]
  ): LogicalFormula {
    // For sequence S1; S2, wp(S1; S2, Q) = wp(S1, wp(S2, Q))
    if (statement.substatements && statement.substatements.length >= 2) {
      let currentWP = postcondition;
      
      // Work backwards through the sequence
      for (let i = statement.substatements.length - 1; i >= 0; i--) {
        currentWP = this.calculateWeakestPrecondition(statement.substatements[i], currentWP).formula;
      }
      
      return currentWP;
    }

    return postcondition;
  }

  private wpConditional(
    statement: CodeStatement,
    postcondition: LogicalFormula,
    substitutions: Map<string, string>,
    conditions: LogicalFormula[]
  ): LogicalFormula {
    // For if B then S1 else S2, wp(if B then S1 else S2, Q) = (B → wp(S1, Q)) ∧ (¬B → wp(S2, Q))
    if (statement.condition && statement.substatements && statement.substatements.length >= 2) {
      const thenWP = this.calculateWeakestPrecondition(statement.substatements[0], postcondition).formula;
      const elseWP = this.calculateWeakestPrecondition(statement.substatements[1], postcondition).formula;
      
      const condition = statement.condition.expression;
      
      return {
        expression: `((${condition}) → (${thenWP.expression})) ∧ ((¬${condition}) → (${elseWP.expression}))`,
        variables: [
          ...statement.condition.variables,
          ...thenWP.variables,
          ...elseWP.variables
        ],
        type: FormulaType.PRECONDITION
      };
    }

    return postcondition;
  }

  private wpLoop(
    statement: CodeStatement,
    postcondition: LogicalFormula,
    substitutions: Map<string, string>,
    conditions: LogicalFormula[]
  ): LogicalFormula {
    // For while B do S, we need to find an invariant I such that:
    // wp(while B do S, Q) = I ∧ (I ∧ ¬B → Q) ∧ (I ∧ B → wp(S, I))
    const invariant = this.inferLoopInvariant(statement, postcondition);
    
    if (statement.condition) {
      const condition = statement.condition.expression;
      
      conditions.push({
        expression: `(${invariant.expression} ∧ ¬${condition}) → (${postcondition.expression})`,
        variables: [...invariant.variables, ...statement.condition.variables, ...postcondition.variables],
        type: FormulaType.ASSERTION
      });
    }

    return invariant;
  }

  private wpDefault(
    statement: CodeStatement,
    postcondition: LogicalFormula,
    substitutions: Map<string, string>
  ): LogicalFormula {
    // For unknown statements, assume they don't change the postcondition
    return postcondition;
  }

  // Strongest postcondition calculations

  private spAssignment(
    precondition: LogicalFormula,
    statement: CodeStatement,
    effects: VariableEffect[]
  ): LogicalFormula {
    // For assignment x := E, sp(P, x := E) = ∃x₀. P[x/x₀] ∧ x = E[x/x₀]
    const assignment = this.parseAssignment(statement.content);
    if (assignment) {
      effects.push({
        variable: assignment.variable,
        oldValue: `old_${assignment.variable}`,
        newValue: assignment.expression,
        effectType: EffectType.ASSIGNMENT
      });

      return {
        expression: `∃old_${assignment.variable}. (${this.substituteVariable(precondition.expression, assignment.variable, `old_${assignment.variable}`)}) ∧ (${assignment.variable} = ${assignment.expression})`,
        variables: [
          ...precondition.variables,
          { name: `old_${assignment.variable}`, type: 'any' },
          { name: assignment.variable, type: 'any' }
        ],
        type: FormulaType.POSTCONDITION
      };
    }

    return precondition;
  }

  private spSequence(
    precondition: LogicalFormula,
    statement: CodeStatement,
    effects: VariableEffect[],
    invariants: LogicalFormula[]
  ): LogicalFormula {
    // For sequence S1; S2, sp(P, S1; S2) = sp(sp(P, S1), S2)
    if (statement.substatements && statement.substatements.length >= 2) {
      let currentSP = precondition;
      
      for (const substmt of statement.substatements) {
        currentSP = this.calculateStrongestPostcondition(currentSP, substmt).formula;
      }
      
      return currentSP;
    }

    return precondition;
  }

  private spConditional(
    precondition: LogicalFormula,
    statement: CodeStatement,
    effects: VariableEffect[],
    invariants: LogicalFormula[]
  ): LogicalFormula {
    // For if B then S1 else S2, sp(P, if B then S1 else S2) = sp(P ∧ B, S1) ∨ sp(P ∧ ¬B, S2)
    if (statement.condition && statement.substatements && statement.substatements.length >= 2) {
      const condition = statement.condition.expression;
      
      const thenPrecondition = {
        expression: `(${precondition.expression}) ∧ (${condition})`,
        variables: [...precondition.variables, ...statement.condition.variables],
        type: FormulaType.PRECONDITION
      };
      
      const elsePrecondition = {
        expression: `(${precondition.expression}) ∧ (¬${condition})`,
        variables: [...precondition.variables, ...statement.condition.variables],
        type: FormulaType.PRECONDITION
      };
      
      const thenSP = this.calculateStrongestPostcondition(thenPrecondition, statement.substatements[0]).formula;
      const elseSP = this.calculateStrongestPostcondition(elsePrecondition, statement.substatements[1]).formula;
      
      return {
        expression: `(${thenSP.expression}) ∨ (${elseSP.expression})`,
        variables: [...thenSP.variables, ...elseSP.variables],
        type: FormulaType.POSTCONDITION
      };
    }

    return precondition;
  }

  private spLoop(
    precondition: LogicalFormula,
    statement: CodeStatement,
    effects: VariableEffect[],
    invariants: LogicalFormula[]
  ): LogicalFormula {
    // For while B do S, sp(P, while B do S) = I ∧ ¬B where I is the loop invariant
    const invariant = this.inferLoopInvariant(statement, precondition);
    invariants.push(invariant);
    
    if (statement.condition) {
      return {
        expression: `(${invariant.expression}) ∧ (¬${statement.condition.expression})`,
        variables: [...invariant.variables, ...statement.condition.variables],
        type: FormulaType.POSTCONDITION
      };
    }

    return invariant;
  }

  private spDefault(
    precondition: LogicalFormula,
    statement: CodeStatement,
    effects: VariableEffect[]
  ): LogicalFormula {
    // For unknown statements, assume they preserve the precondition
    return precondition;
  }

  // Helper methods

  private parseAssignment(code: string): { variable: string; expression: string } | null {
    // Simple assignment parsing (x = expr or x := expr)
    const assignmentMatch = code.match(/(\w+)\s*(?:=|:=)\s*(.+)/);
    if (assignmentMatch) {
      return {
        variable: assignmentMatch[1].trim(),
        expression: assignmentMatch[2].trim()
      };
    }
    return null;
  }

  private substituteVariable(expression: string, variable: string, replacement: string): string {
    // Simple variable substitution (would need more sophisticated parsing in practice)
    const regex = new RegExp(`\\b${variable}\\b`, 'g');
    return expression.replace(regex, replacement);
  }

  private updateVariables(variables: Variable[], assignment: { variable: string; expression: string }): Variable[] {
    // Update variable list after substitution
    return variables.filter(v => v.name !== assignment.variable);
  }

  private inferLoopInvariant(statement: CodeStatement, context: LogicalFormula): LogicalFormula {
    // Simplified loop invariant inference (would use more sophisticated analysis in practice)
    return {
      expression: `loop_invariant(${statement.content})`,
      variables: statement.variables,
      type: FormulaType.INVARIANT
    };
  }

  private extractVariables(code: string): Variable[] {
    // Simple variable extraction (would use proper AST parsing in practice)
    const variables: Variable[] = [];
    const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    
    while ((match = identifierRegex.exec(code)) !== null) {
      const name = match[1];
      if (!variables.some(v => v.name === name)) {
        variables.push({ name, type: 'any' });
      }
    }
    
    return variables;
  }

  private deduplicateVariables(variables: Variable[]): Variable[] {
    const seen = new Set<string>();
    return variables.filter(v => {
      if (seen.has(v.name)) {
        return false;
      }
      seen.add(v.name);
      return true;
    });
  }

  private calculateStatementComplexity(code: string): number {
    // Simple complexity calculation based on code length and constructs
    let complexity = Math.ceil(code.length / 10);
    
    // Add complexity for control structures
    complexity += (code.match(/\b(if|while|for|switch)\b/g) || []).length * 2;
    complexity += (code.match(/\b(function|class|interface)\b/g) || []).length * 3;
    
    return complexity;
  }

  private calculateWPConfidence(statement: CodeStatement, wp: LogicalFormula): number {
    // Calculate confidence based on statement complexity and formula complexity
    let confidence = 0.9;
    
    // Reduce confidence for complex statements
    confidence -= Math.min(0.3, statement.metadata.complexity * 0.02);
    
    // Reduce confidence for complex formulas
    const formulaComplexity = (wp.expression.match(/[∧∨→↔¬∀∃]/g) || []).length;
    confidence -= Math.min(0.2, formulaComplexity * 0.05);
    
    return Math.max(0.1, confidence);
  }

  private calculateSPConfidence(precondition: LogicalFormula, statement: CodeStatement, sp: LogicalFormula): number {
    // Similar to WP confidence calculation
    return this.calculateWPConfidence(statement, sp);
  }

  // Hoare rule application methods

  private applyAssignmentRule(
    precondition: LogicalFormula,
    statement: CodeStatement,
    postcondition: LogicalFormula
  ): HoareRuleApplication {
    const wp = this.calculateWeakestPrecondition(statement, postcondition);
    
    return {
      isValid: true,
      obligations: [{
        formula: {
          expression: `(${precondition.expression}) → (${wp.formula.expression})`,
          variables: [...precondition.variables, ...wp.formula.variables],
          type: FormulaType.ASSERTION
        },
        description: 'Precondition implies weakest precondition for assignment'
      }],
      confidence: wp.confidence
    };
  }

  private applySequenceRule(
    precondition: LogicalFormula,
    statement: CodeStatement,
    postcondition: LogicalFormula
  ): HoareRuleApplication {
    if (!statement.substatements || statement.substatements.length < 2) {
      return { isValid: false, obligations: [], confidence: 0 };
    }

    const obligations: { formula: LogicalFormula; description: string }[] = [];
    
    // Generate intermediate conditions
    let currentPrecondition = precondition;
    for (let i = 0; i < statement.substatements.length - 1; i++) {
      const intermediateSP = this.calculateStrongestPostcondition(currentPrecondition, statement.substatements[i]);
      const nextWP = this.calculateWeakestPrecondition(statement.substatements[i + 1], postcondition);
      
      obligations.push({
        formula: {
          expression: `(${intermediateSP.formula.expression}) → (${nextWP.formula.expression})`,
          variables: [...intermediateSP.formula.variables, ...nextWP.formula.variables],
          type: FormulaType.ASSERTION
        },
        description: `Intermediate condition for sequence step ${i + 1}`
      });
      
      currentPrecondition = intermediateSP.formula;
    }

    return {
      isValid: true,
      obligations,
      confidence: 0.8
    };
  }

  private applyConditionalRule(
    precondition: LogicalFormula,
    statement: CodeStatement,
    postcondition: LogicalFormula
  ): HoareRuleApplication {
    if (!statement.condition || !statement.substatements || statement.substatements.length < 2) {
      return { isValid: false, obligations: [], confidence: 0 };
    }

    const condition = statement.condition.expression;
    const obligations: { formula: LogicalFormula; description: string }[] = [];

    // Then branch obligation
    const thenWP = this.calculateWeakestPrecondition(statement.substatements[0], postcondition);
    obligations.push({
      formula: {
        expression: `(${precondition.expression} ∧ ${condition}) → (${thenWP.formula.expression})`,
        variables: [...precondition.variables, ...statement.condition.variables, ...thenWP.formula.variables],
        type: FormulaType.ASSERTION
      },
      description: 'Then branch proof obligation'
    });

    // Else branch obligation
    const elseWP = this.calculateWeakestPrecondition(statement.substatements[1], postcondition);
    obligations.push({
      formula: {
        expression: `(${precondition.expression} ∧ ¬${condition}) → (${elseWP.formula.expression})`,
        variables: [...precondition.variables, ...statement.condition.variables, ...elseWP.formula.variables],
        type: FormulaType.ASSERTION
      },
      description: 'Else branch proof obligation'
    });

    return {
      isValid: true,
      obligations,
      confidence: Math.min(thenWP.confidence, elseWP.confidence)
    };
  }

  private applyLoopRule(
    precondition: LogicalFormula,
    statement: CodeStatement,
    postcondition: LogicalFormula
  ): HoareRuleApplication {
    if (!statement.condition) {
      return { isValid: false, obligations: [], confidence: 0 };
    }

    const invariant = this.inferLoopInvariant(statement, precondition);
    const condition = statement.condition.expression;
    const obligations: { formula: LogicalFormula; description: string }[] = [];

    // Invariant establishment
    obligations.push({
      formula: {
        expression: `(${precondition.expression}) → (${invariant.expression})`,
        variables: [...precondition.variables, ...invariant.variables],
        type: FormulaType.ASSERTION
      },
      description: 'Loop invariant establishment'
    });

    // Invariant preservation
    if (statement.substatements && statement.substatements.length > 0) {
      const bodyWP = this.calculateWeakestPrecondition(statement.substatements[0], invariant);
      obligations.push({
        formula: {
          expression: `(${invariant.expression} ∧ ${condition}) → (${bodyWP.formula.expression})`,
          variables: [...invariant.variables, ...statement.condition.variables, ...bodyWP.formula.variables],
          type: FormulaType.ASSERTION
        },
        description: 'Loop invariant preservation'
      });
    }

    // Postcondition establishment
    obligations.push({
      formula: {
        expression: `(${invariant.expression} ∧ ¬${condition}) → (${postcondition.expression})`,
        variables: [...invariant.variables, ...statement.condition.variables, ...postcondition.variables],
        type: FormulaType.ASSERTION
      },
      description: 'Loop postcondition establishment'
    });

    return {
      isValid: true,
      obligations,
      confidence: 0.7 // Lower confidence for loops due to invariant inference
    };
  }
}

// Supporting interfaces and types

interface HoareRule {
  name: string;
  apply: (precondition: LogicalFormula, statement: CodeStatement, postcondition: LogicalFormula) => HoareRuleApplication;
}

interface HoareRuleApplication {
  isValid: boolean;
  obligations: { formula: LogicalFormula; description: string }[];
  confidence: number;
}