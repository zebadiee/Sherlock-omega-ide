/**
 * Core type definitions for Sherlock Ω Computational Immunity System
 * Fundamental interfaces that define the system's architecture
 */

// Core theorem: Every computational state must have a path to resolution
export interface UniversalResolutionPromise {
  guarantee: 'ABSOLUTE';
  theorem: 'EVERY_COMPUTABLE_PROBLEM_HAS_SOLUTION';
  timebound: 'FINITE';
}

// Quantum-entangled problem detection across all IDE layers
export interface OmniscientDiagnosticGrid {
  sensors: Map<SensorType, SensorInterface>;
  quantumEntanglement: boolean;
  coverage: 'UNIVERSAL';
}

// Self-healing code generation with mathematical proof of correctness
export interface ProvablyCorrectCodeGeneration {
  paradigms: ParadigmType[];
  proofSystem: ProofSystem;
  correctnessGuarantee: 'MATHEMATICAL';
}

// Meta-cognitive reasoning about development intent
export interface DeveloperMindInterface {
  cognitionModel: CognitionModel;
  intentUnderstanding: IntentUnderstanding;
  thoughtCompletion: ThoughtCompletion;
}

// Main Computational Immunity System interface
export interface ComputationalImmunitySystem {
  // Fundamental guarantee: No blocking state can persist
  immunityGuarantee: UniversalResolutionPromise;
  
  // Quantum-entangled problem detection across all IDE layers
  universalSensorNetwork: OmniscientDiagnosticGrid;
  
  // Self-healing code generation with mathematical proof of correctness
  autonomousRepairEngine: ProvablyCorrectCodeGeneration;
  
  // Meta-cognitive reasoning about development intent
  intentUnderstandingEngine: DeveloperMindInterface;
}

// Sensor system types
export enum SensorType {
  SYNTAX = 'SYNTAX',
  SEMANTIC = 'SEMANTIC',
  DEPENDENCY = 'DEPENDENCY',
  RESOURCE = 'RESOURCE',
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  ARCHITECTURE = 'ARCHITECTURE',
  DEPLOYMENT = 'DEPLOYMENT'
}

export interface SensorInterface {
  type: SensorType;
  monitor(): Promise<SensorResult>;
  handleFailure(error: Error): Promise<void>;
  getStatus(): SensorStatus;
}

export interface SensorResult {
  timestamp: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: ComputationalIssue[];
  metrics: Record<string, number>;
}

export enum SensorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
  RECOVERING = 'RECOVERING'
}

// Problem and solution types
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
  SEMANTIC_ERROR = 'SEMANTIC_ERROR',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PERFORMANCE_BOTTLENECK = 'PERFORMANCE_BOTTLENECK',
  SECURITY_VULNERABILITY = 'SECURITY_VULNERABILITY',
  ARCHITECTURAL_INCONSISTENCY = 'ARCHITECTURAL_INCONSISTENCY',
  UNKNOWN = 'UNKNOWN'
}

export enum SeverityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  BLOCKING = 5
}

export interface ProblemContext {
  file: string;
  line?: number;
  column?: number;
  function?: string;
  scope: string[];
  relatedFiles: string[];
}

export interface ProblemMetadata {
  detectedAt: number;
  detectedBy: SensorType;
  confidence: number;
  tags: string[];
}

// Formal verification types
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
  domain?: string;
}

export interface Constraint {
  type: ConstraintType;
  expression: string;
  weight: number;
}

export enum ConstraintType {
  PERFORMANCE = 'PERFORMANCE',
  MEMORY = 'MEMORY',
  SECURITY = 'SECURITY',
  COMPATIBILITY = 'COMPATIBILITY',
  STYLE = 'STYLE'
}

// Healing and fix types
export interface FixCandidate {
  id: string;
  paradigm: ParadigmType;
  implementation: CodeTransformation;
  confidence: number;
  estimatedImpact: Impact;
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
  type: TransformationType;
  sourceCode: string;
  targetCode: string;
  diff: CodeDiff;
  reversible: boolean;
}

export enum TransformationType {
  INSERTION = 'INSERTION',
  DELETION = 'DELETION',
  MODIFICATION = 'MODIFICATION',
  REFACTORING = 'REFACTORING',
  OPTIMIZATION = 'OPTIMIZATION'
}

export interface CodeDiff {
  additions: string[];
  deletions: string[];
  modifications: Array<{
    original: string;
    modified: string;
    line: number;
  }>;
}

export interface Impact {
  performance: number;
  readability: number;
  maintainability: number;
  testability: number;
  security: number;
}

export interface FixMetadata {
  generatedAt: number;
  generatedBy: ParadigmType;
  estimatedTime: number;
  riskLevel: RiskLevel;
}

export enum RiskLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Proof system types
export interface FormalProof {
  premises: LogicalFormula[];
  inference: InferenceRule[];
  conclusion: LogicalFormula;
  proofSystem: ProofSystem;
  validity: ProofValidity;
  strength: number;
}

export enum ProofSystem {
  HOARE_LOGIC = 'HOARE_LOGIC',
  COQ = 'COQ',
  LEAN = 'LEAN',
  ISABELLE = 'ISABELLE',
  AGDA = 'AGDA'
}

export interface InferenceRule {
  name: string;
  premises: LogicalFormula[];
  conclusion: LogicalFormula;
  soundness: boolean;
}

export interface ProofValidity {
  isValid: boolean;
  confidence: number;
  verifiedBy: ProofSystem[];
  errors: string[];
}

// Intent understanding types
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
  criteria: string[];
}

export enum GoalType {
  IMPLEMENTATION = 'IMPLEMENTATION',
  REFACTORING = 'REFACTORING',
  DEBUGGING = 'DEBUGGING',
  OPTIMIZATION = 'OPTIMIZATION',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION'
}

export interface IntentConstraint {
  type: ConstraintType;
  description: string;
  mandatory: boolean;
  weight: number;
}

export interface DeveloperPreference {
  category: PreferenceCategory;
  value: string;
  strength: number;
  learned: boolean;
}

export enum PreferenceCategory {
  CODING_STYLE = 'CODING_STYLE',
  ARCHITECTURE = 'ARCHITECTURE',
  TESTING = 'TESTING',
  PERFORMANCE = 'PERFORMANCE',
  NAMING = 'NAMING'
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
  PERFORMANCE_REQUIREMENTS = 'PERFORMANCE_REQUIREMENTS',
  PLATFORM_TARGET = 'PLATFORM_TARGET'
}

// Cognition and thought completion types
export interface CognitionModel {
  patterns: CognitionPattern[];
  learningRate: number;
  adaptability: number;
  memoryCapacity: number;
}

export interface CognitionPattern {
  id: string;
  pattern: string;
  frequency: number;
  context: string[];
  effectiveness: number;
}

export interface IntentUnderstanding {
  accuracy: number;
  confidence: number;
  signals: IntentSignal[];
  fusionMethod: 'QUANTUM_INSPIRED' | 'BAYESIAN' | 'NEURAL';
}

export interface IntentSignal {
  type: SignalType;
  strength: number;
  reliability: number;
  source: string;
}

export enum SignalType {
  CODE_PATTERN = 'CODE_PATTERN',
  DOCUMENTATION = 'DOCUMENTATION',
  VERSION_HISTORY = 'VERSION_HISTORY',
  BEHAVIOR = 'BEHAVIOR',
  ARCHITECTURE = 'ARCHITECTURE'
}

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