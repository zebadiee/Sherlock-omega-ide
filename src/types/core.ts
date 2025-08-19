/**
 * Core type definitions for Sherlock Ω system
 * Fundamental types used across all modules
 */

// Re-export platform types for convenience
export { PlatformType } from './platform';

// Computational Issue Types
export interface ComputationalIssue {
  id: string;
  type: ProblemType;
  severity: SeverityLevel;
  context: ProblemContext;
  preconditions: LogicalFormula[];
  postconditions: LogicalFormula[];
  constraints: Constraint[];
  metadata: ProblemMetadata;
}

export enum ProblemType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
  SECURITY_VULNERABILITY = 'SECURITY_VULNERABILITY',
  ARCHITECTURAL_INCONSISTENCY = 'ARCHITECTURAL_INCONSISTENCY'
}

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ProblemContext {
  file?: string;
  line?: number;
  column?: number;
  function?: string;
  module?: string;
  stackTrace?: string[];
}

export interface ProblemMetadata {
  detectedAt: Date;
  detectedBy: string;
  confidence: number;
  relatedIssues: string[];
}

// Formal Logic Types
export interface LogicalFormula {
  expression: string;
  variables: Variable[];
  type: FormulaType;
}

export enum FormulaType {
  PRECONDITION = 'PRECONDITION',
  POSTCONDITION = 'POSTCONDITION',
  INVARIANT = 'INVARIANT',
  ASSERTION = 'ASSERTION'
}

export interface Variable {
  name: string;
  type: string;
  domain?: any[];
}

export interface Constraint {
  type: ConstraintType;
  description: string;
  formula: LogicalFormula;
}

export enum ConstraintType {
  TEMPORAL = 'TEMPORAL',
  SPATIAL = 'SPATIAL',
  RESOURCE = 'RESOURCE',
  LOGICAL = 'LOGICAL'
}

// Fix and Proof Types
export interface FixCandidate {
  id: string;
  description: string;
  implementation: CodeTransformation;
  paradigm: ParadigmType;
  estimatedTime: number;
  confidence: number;
  metadata: FixMetadata;
}

export enum ParadigmType {
  FUNCTIONAL = 'FUNCTIONAL',
  IMPERATIVE = 'IMPERATIVE',
  DECLARATIVE = 'DECLARATIVE',
  QUANTUM_INSPIRED = 'QUANTUM_INSPIRED',
  EVOLUTIONARY = 'EVOLUTIONARY'
}

export interface CodeTransformation {
  originalCode: string;
  transformedCode: string;
  transformationType: TransformationType;
  affectedLines: number[];
}

export enum TransformationType {
  REPLACEMENT = 'REPLACEMENT',
  INSERTION = 'INSERTION',
  DELETION = 'DELETION',
  REFACTORING = 'REFACTORING'
}

export interface FixMetadata {
  createdAt: Date;
  createdBy: string;
  testCoverage: number;
  performanceImpact: number;
}

export interface FormalProof {
  premises: LogicalFormula[];
  inference: InferenceRule[];
  conclusion: LogicalFormula;
  proofSystem: ProofSystem;
  validity: ProofValidity;
  strength: number;
}

export interface InferenceRule {
  name: string;
  premises: LogicalFormula[];
  conclusion: LogicalFormula;
  justification: string;
}

export enum ProofSystem {
  HOARE_LOGIC = 'HOARE_LOGIC',
  TEMPORAL_LOGIC = 'TEMPORAL_LOGIC',
  SEPARATION_LOGIC = 'SEPARATION_LOGIC',
  DEPENDENT_TYPES = 'DEPENDENT_TYPES'
}

export interface ProofValidity {
  isValid: boolean;
  confidence: number;
  verifiedBy: string[];
  errors: string[];
}

// Developer Intent Types
export interface DeveloperIntent {
  primaryGoal: Goal;
  subGoals: Goal[];
  constraints: IntentConstraint[];
  preferences: DeveloperPreference[];
  confidence: number;
  contextualFactors: ContextFactor[];
}

export interface Goal {
  description: string;
  type: GoalType;
  priority: number;
  measurable: boolean;
  criteria: SuccessCriteria[];
}

export enum GoalType {
  IMPLEMENTATION = 'IMPLEMENTATION',
  REFACTORING = 'REFACTORING',
  OPTIMIZATION = 'OPTIMIZATION',
  DEBUGGING = 'DEBUGGING',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION'
}

export interface SuccessCriteria {
  description: string;
  metric: string;
  threshold: number;
}

export interface IntentConstraint {
  type: ConstraintType;
  description: string;
  weight: number;
}

export interface DeveloperPreference {
  category: PreferenceCategory;
  value: any;
  confidence: number;
}

export enum PreferenceCategory {
  CODING_STYLE = 'CODING_STYLE',
  ARCHITECTURE = 'ARCHITECTURE',
  PERFORMANCE = 'PERFORMANCE',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION'
}

export interface ContextFactor {
  type: ContextType;
  value: any;
  relevance: number;
}

export enum ContextType {
  PROJECT_TYPE = 'PROJECT_TYPE',
  TEAM_SIZE = 'TEAM_SIZE',
  DEADLINE = 'DEADLINE',
  COMPLEXITY = 'COMPLEXITY',
  DOMAIN = 'DOMAIN'
}

// Sensor Types
export interface SensorResult {
  sensorId: string;
  timestamp: Date;
  status: SensorStatus;
  data: any;
  issues: ComputationalIssue[];
  confidence: number;
}

export enum SensorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE'
}

// Thought Completion Types
export interface ThoughtCompletion {
  suggestions: CompletionSuggestion[];
  confidence: number;
  latency: number;
}

export interface CompletionSuggestion {
  code: string;
  description: string;
  confidence: number;
  intentAlignment: number;
  rank: number;
}