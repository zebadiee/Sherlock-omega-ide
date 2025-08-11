/**
 * Paradigm Generator Framework for Sherlock Ω Multi-Paradigm Healing Engine
 * Provides interfaces and base classes for different programming paradigm fix generators
 */

import {
  ComputationalIssue,
  FixCandidate,
  ParadigmType,
  CodeTransformation,
  TransformationType,
  Impact,
  RiskLevel,
  ProblemType,
  SeverityLevel
} from '../types/core';

import { ExtendedFormalProof } from '../verification/FormalProofSystem';

/**
 * Fix generation context containing all necessary information for generating fixes
 */
export interface FixGenerationContext {
  issue: ComputationalIssue;
  relatedIssues: ComputationalIssue[];
  codeContext: CodeAnalysisContext;
  constraints: FixConstraint[];
  preferences: FixPreferences;
  historicalData: HistoricalFixData[];
}

/**
 * Code analysis context for understanding the code structure
 */
export interface CodeAnalysisContext {
  sourceCode: string;
  ast: any; // Abstract Syntax Tree
  symbols: SymbolTable;
  dependencies: DependencyGraph;
  typeInformation: TypeInformation;
  semanticModel: SemanticModel;
  metrics: CodeMetrics;
}

/**
 * Symbol table for variable and function tracking
 */
export interface SymbolTable {
  variables: Map<string, VariableInfo>;
  functions: Map<string, FunctionInfo>;
  classes: Map<string, ClassInfo>;
  imports: Map<string, ImportInfo>;
  exports: Map<string, ExportInfo>;
}

/**
 * Variable information in symbol table
 */
export interface VariableInfo {
  name: string;
  type: string;
  scope: string;
  isConstant: boolean;
  isUsed: boolean;
  declarationLine: number;
  usageLines: number[];
}

/**
 * Function information in symbol table
 */
export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  isPure: boolean;
  complexity: number;
  calledBy: string[];
  calls: string[];
}

/**
 * Parameter information for functions
 */
export interface ParameterInfo {
  name: string;
  type: string;
  isOptional: boolean;
  defaultValue?: string;
}

/**
 * Class information in symbol table
 */
export interface ClassInfo {
  name: string;
  superClass?: string;
  interfaces: string[];
  methods: FunctionInfo[];
  properties: VariableInfo[];
  isAbstract: boolean;
}

/**
 * Import/Export information
 */
export interface ImportInfo {
  module: string;
  symbols: string[];
  isDefault: boolean;
  alias?: string;
}

export interface ExportInfo {
  symbol: string;
  type: string;
  isDefault: boolean;
}

/**
 * Dependency graph for understanding code relationships
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  cycles: string[][];
}

export interface DependencyNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'variable';
  metadata: Record<string, any>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'calls' | 'imports' | 'extends' | 'uses';
  weight: number;
}

/**
 * Type information for static analysis
 */
export interface TypeInformation {
  typeMap: Map<string, TypeInfo>;
  typeConstraints: TypeConstraint[];
  genericTypes: GenericTypeInfo[];
}

export interface TypeInfo {
  name: string;
  kind: 'primitive' | 'object' | 'function' | 'union' | 'intersection';
  properties?: Map<string, TypeInfo>;
  parameters?: TypeInfo[];
  returnType?: TypeInfo;
}

export interface TypeConstraint {
  variable: string;
  constraint: string;
  source: string;
}

export interface GenericTypeInfo {
  name: string;
  bounds: TypeInfo[];
  variance: 'covariant' | 'contravariant' | 'invariant';
}

/**
 * Semantic model for understanding code meaning
 */
export interface SemanticModel {
  controlFlow: ControlFlowGraph;
  dataFlow: DataFlowGraph;
  callGraph: CallGraph;
  invariants: Invariant[];
}

export interface ControlFlowGraph {
  nodes: ControlFlowNode[];
  edges: ControlFlowEdge[];
  entryPoint: string;
  exitPoints: string[];
}

export interface ControlFlowNode {
  id: string;
  type: 'statement' | 'condition' | 'loop' | 'function_call';
  code: string;
  line: number;
}

export interface ControlFlowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface DataFlowGraph {
  variables: Map<string, DataFlowInfo>;
  definitions: Definition[];
  uses: Use[];
}

export interface DataFlowInfo {
  variable: string;
  definitions: number[];
  uses: number[];
  liveRanges: LiveRange[];
}

export interface Definition {
  variable: string;
  line: number;
  value?: string;
}

export interface Use {
  variable: string;
  line: number;
  context: string;
}

export interface LiveRange {
  start: number;
  end: number;
}

export interface CallGraph {
  functions: Map<string, CallGraphNode>;
  calls: CallGraphEdge[];
}

export interface CallGraphNode {
  name: string;
  isRecursive: boolean;
  callCount: number;
  complexity: number;
}

export interface CallGraphEdge {
  caller: string;
  callee: string;
  callSites: number[];
}

export interface Invariant {
  type: 'loop' | 'function' | 'class';
  location: string;
  condition: string;
  confidence: number;
}

/**
 * Code metrics for quality assessment
 */
export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage: number;
  duplicatedLines: number;
}

/**
 * Constraints on fix generation
 */
export interface FixConstraint {
  type: ConstraintType;
  value: any;
  priority: number;
  isHard: boolean; // Hard constraints must be satisfied, soft constraints are preferences
}

export enum ConstraintType {
  PRESERVE_SEMANTICS = 'PRESERVE_SEMANTICS',
  MAINTAIN_PERFORMANCE = 'MAINTAIN_PERFORMANCE',
  MINIMIZE_CHANGES = 'MINIMIZE_CHANGES',
  PRESERVE_API = 'PRESERVE_API',
  MAINTAIN_STYLE = 'MAINTAIN_STYLE',
  AVOID_BREAKING_CHANGES = 'AVOID_BREAKING_CHANGES',
  PREFER_IMMUTABILITY = 'PREFER_IMMUTABILITY',
  MAXIMIZE_READABILITY = 'MAXIMIZE_READABILITY'
}

/**
 * Preferences for fix generation
 */
export interface FixPreferences {
  paradigm: ParadigmType;
  style: CodingStyle;
  verbosity: VerbosityLevel;
  riskTolerance: RiskTolerance;
  optimizationGoals: OptimizationGoal[];
}

export enum CodingStyle {
  FUNCTIONAL = 'FUNCTIONAL',
  OBJECT_ORIENTED = 'OBJECT_ORIENTED',
  PROCEDURAL = 'PROCEDURAL',
  DECLARATIVE = 'DECLARATIVE',
  REACTIVE = 'REACTIVE'
}

export enum VerbosityLevel {
  MINIMAL = 'MINIMAL',
  CONCISE = 'CONCISE',
  EXPLICIT = 'EXPLICIT',
  VERBOSE = 'VERBOSE'
}

export enum RiskTolerance {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE'
}

export enum OptimizationGoal {
  PERFORMANCE = 'PERFORMANCE',
  READABILITY = 'READABILITY',
  MAINTAINABILITY = 'MAINTAINABILITY',
  TESTABILITY = 'TESTABILITY',
  SECURITY = 'SECURITY'
}

/**
 * Historical fix data for learning and improvement
 */
export interface HistoricalFixData {
  issue: ComputationalIssue;
  fix: FixCandidate;
  outcome: FixOutcome;
  feedback: UserFeedback;
  timestamp: number;
}

export interface FixOutcome {
  success: boolean;
  timeToApply: number;
  sideEffects: SideEffect[];
  qualityImprovement: QualityMetrics;
  userSatisfaction: number;
}

export interface SideEffect {
  type: 'performance' | 'readability' | 'maintainability' | 'security';
  impact: number; // -1 to 1, negative is worse, positive is better
  description: string;
}

export interface QualityMetrics {
  beforeMetrics: CodeMetrics;
  afterMetrics: CodeMetrics;
  improvement: number; // Overall improvement score
}

export interface UserFeedback {
  rating: number; // 1-5 stars
  comments: string;
  wouldUseAgain: boolean;
  suggestedImprovements: string[];
}

/**
 * Fix generation result with multiple candidates
 */
export interface FixGenerationResult {
  candidates: FixCandidate[];
  analysisTime: number;
  confidence: number;
  reasoning: FixReasoning;
  alternatives: AlternativeApproach[];
}

/**
 * Reasoning behind fix generation
 */
export interface FixReasoning {
  primaryStrategy: string;
  appliedPatterns: string[];
  consideredAlternatives: string[];
  riskAssessment: RiskAssessment;
  tradeoffs: Tradeoff[];
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  type: string;
  severity: number;
  probability: number;
  impact: string;
}

export interface Tradeoff {
  aspect: string;
  benefit: string;
  cost: string;
  recommendation: string;
}

/**
 * Alternative approaches that were considered
 */
export interface AlternativeApproach {
  paradigm: ParadigmType;
  description: string;
  pros: string[];
  cons: string[];
  estimatedEffort: number;
  confidence: number;
}

/**
 * Main interface for paradigm generators
 */
export interface ParadigmGenerator {
  readonly paradigm: ParadigmType;
  readonly supportedProblemTypes: ProblemType[];
  readonly capabilities: GeneratorCapabilities;

  /**
   * Generate fix candidates for the given issue
   */
  generateFix(context: FixGenerationContext): Promise<FixGenerationResult>;

  /**
   * Validate that a fix candidate is applicable
   */
  validateFix(fix: FixCandidate, context: FixGenerationContext): Promise<ValidationResult>;

  /**
   * Estimate the impact of applying a fix
   */
  estimateImpact(fix: FixCandidate, context: FixGenerationContext): Promise<Impact>;

  /**
   * Learn from fix outcomes to improve future generations
   */
  learnFromOutcome(context: FixGenerationContext, outcome: FixOutcome): Promise<void>;

  /**
   * Get confidence score for handling a specific type of issue
   */
  getConfidenceForIssue(issue: ComputationalIssue): number;
}

/**
 * Capabilities of a paradigm generator
 */
export interface GeneratorCapabilities {
  maxComplexity: number;
  supportedLanguages: string[];
  requiresTypeInformation: boolean;
  canHandleAsync: boolean;
  canRefactor: boolean;
  canOptimize: boolean;
  estimatedAccuracy: number;
}

/**
 * Validation result for fix candidates
 */
export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
  proof?: ExtendedFormalProof;
}

export interface ValidationIssue {
  type: 'syntax' | 'semantic' | 'type' | 'style' | 'performance';
  severity: SeverityLevel;
  message: string;
  location?: { line: number; column: number };
  suggestedFix?: string;
}

/**
 * Abstract base class for paradigm generators
 */
export abstract class AbstractParadigmGenerator implements ParadigmGenerator {
  public abstract readonly paradigm: ParadigmType;
  public abstract readonly supportedProblemTypes: ProblemType[];
  public abstract readonly capabilities: GeneratorCapabilities;

  protected learningData: Map<string, HistoricalFixData[]> = new Map();
  protected patternLibrary: FixPattern[] = [];

  /**
   * Generate fix candidates - must be implemented by concrete generators
   */
  public abstract generateFix(context: FixGenerationContext): Promise<FixGenerationResult>;

  /**
   * Validate fix candidate with common validation logic
   */
  public async validateFix(fix: FixCandidate, context: FixGenerationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    let confidence = 1.0;

    // Common validation checks
    const syntaxValidation = await this.validateSyntax(fix, context);
    issues.push(...syntaxValidation.issues);
    confidence *= syntaxValidation.confidence;

    const semanticValidation = await this.validateSemantics(fix, context);
    issues.push(...semanticValidation.issues);
    confidence *= semanticValidation.confidence;

    // Paradigm-specific validation
    const paradigmValidation = await this.validateParadigmSpecific(fix, context);
    issues.push(...paradigmValidation.issues);
    confidence *= paradigmValidation.confidence;

    const isValid = issues.filter(i => i.severity >= SeverityLevel.HIGH).length === 0;

    return {
      isValid,
      confidence,
      issues,
      suggestions: this.generateValidationSuggestions(issues),
      proof: paradigmValidation.proof
    };
  }

  /**
   * Estimate impact using common metrics
   */
  public async estimateImpact(fix: FixCandidate, context: FixGenerationContext): Promise<Impact> {
    const baseImpact = this.calculateBaseImpact(fix, context);
    const paradigmImpact = await this.calculateParadigmSpecificImpact(fix, context);

    return {
      performance: this.combineImpactScores(baseImpact.performance, paradigmImpact.performance),
      readability: this.combineImpactScores(baseImpact.readability, paradigmImpact.readability),
      maintainability: this.combineImpactScores(baseImpact.maintainability, paradigmImpact.maintainability),
      testability: this.combineImpactScores(baseImpact.testability, paradigmImpact.testability),
      security: this.combineImpactScores(baseImpact.security, paradigmImpact.security)
    };
  }

  /**
   * Learn from outcomes to improve future fix generation
   */
  public async learnFromOutcome(context: FixGenerationContext, outcome: FixOutcome): Promise<void> {
    const issueKey = this.getIssueKey(context.issue);
    const existingData = this.learningData.get(issueKey) || [];
    
    const historicalData: HistoricalFixData = {
      issue: context.issue,
      fix: context.issue as any, // This would be the actual fix applied
      outcome,
      feedback: outcome as any, // This would be actual user feedback
      timestamp: Date.now()
    };

    existingData.push(historicalData);
    this.learningData.set(issueKey, existingData);

    // Update pattern library based on successful fixes
    if (outcome.success && outcome.userSatisfaction > 3) {
      await this.updatePatternLibrary(context, outcome);
    }
  }

  /**
   * Get confidence for handling specific issue types
   */
  public getConfidenceForIssue(issue: ComputationalIssue): number {
    if (!this.supportedProblemTypes.includes(issue.type)) {
      return 0;
    }

    let confidence = 0.7; // Base confidence

    // Adjust based on historical success
    const issueKey = this.getIssueKey(issue);
    const historicalData = this.learningData.get(issueKey) || [];
    
    if (historicalData.length > 0) {
      const successRate = historicalData.filter(d => d.outcome.success).length / historicalData.length;
      confidence = confidence * 0.5 + successRate * 0.5;
    }

    // Adjust based on issue complexity
    const complexityPenalty = Math.min(0.3, issue.severity * 0.05);
    confidence -= complexityPenalty;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Protected helper methods for subclasses

  protected async validateSyntax(fix: FixCandidate, context: FixGenerationContext): Promise<{
    issues: ValidationIssue[];
    confidence: number;
  }> {
    // Basic syntax validation - would use actual parser in real implementation
    const issues: ValidationIssue[] = [];
    let confidence = 0.95;

    // Check for basic syntax errors
    const code = fix.implementation.targetCode;
    if (code.includes('undefined') || code.includes('null')) {
      issues.push({
        type: 'syntax',
        severity: SeverityLevel.MEDIUM,
        message: 'Potential undefined/null reference',
        suggestedFix: 'Add null checks or use optional chaining'
      });
      confidence *= 0.9;
    }

    return { issues, confidence };
  }

  protected async validateSemantics(fix: FixCandidate, context: FixGenerationContext): Promise<{
    issues: ValidationIssue[];
    confidence: number;
  }> {
    // Semantic validation - check if fix preserves meaning
    const issues: ValidationIssue[] = [];
    let confidence = 0.9;

    // This would involve more sophisticated analysis in real implementation
    return { issues, confidence };
  }

  protected abstract validateParadigmSpecific(fix: FixCandidate, context: FixGenerationContext): Promise<{
    issues: ValidationIssue[];
    confidence: number;
    proof?: ExtendedFormalProof;
  }>;

  protected calculateBaseImpact(fix: FixCandidate, context: FixGenerationContext): Impact {
    // Calculate base impact metrics
    const codeChange = fix.implementation.targetCode.length - fix.implementation.sourceCode.length;
    const changeRatio = Math.abs(codeChange) / fix.implementation.sourceCode.length;

    return {
      performance: Math.max(-0.1, -changeRatio * 0.5), // Larger changes might hurt performance
      readability: fix.confidence * 0.8 - 0.4, // Higher confidence fixes are usually more readable
      maintainability: Math.min(0.3, 0.5 - changeRatio), // Smaller changes are more maintainable
      testability: 0.1, // Neutral impact on testability by default
      security: 0.0 // Neutral impact on security by default
    };
  }

  protected abstract calculateParadigmSpecificImpact(fix: FixCandidate, context: FixGenerationContext): Promise<Impact>;

  protected combineImpactScores(base: number, specific: number): number {
    // Weighted combination of base and paradigm-specific impacts
    return base * 0.4 + specific * 0.6;
  }

  protected generateValidationSuggestions(issues: ValidationIssue[]): string[] {
    return issues
      .filter(issue => issue.suggestedFix)
      .map(issue => issue.suggestedFix!)
      .slice(0, 5); // Limit to top 5 suggestions
  }

  protected getIssueKey(issue: ComputationalIssue): string {
    return `${issue.type}-${issue.context.file}-${issue.severity}`;
  }

  protected async updatePatternLibrary(context: FixGenerationContext, outcome: FixOutcome): Promise<void> {
    // Extract successful patterns for reuse
    const pattern: FixPattern = {
      id: `pattern-${Date.now()}`,
      problemType: context.issue.type,
      paradigm: this.paradigm,
      pattern: this.extractPattern(context),
      successRate: 1.0, // Start with perfect success rate
      usageCount: 1,
      lastUsed: Date.now()
    };

    this.patternLibrary.push(pattern);
  }

  protected abstract extractPattern(context: FixGenerationContext): string;
}

/**
 * Fix pattern for reusable solutions
 */
export interface FixPattern {
  id: string;
  problemType: ProblemType;
  paradigm: ParadigmType;
  pattern: string;
  successRate: number;
  usageCount: number;
  lastUsed: number;
}