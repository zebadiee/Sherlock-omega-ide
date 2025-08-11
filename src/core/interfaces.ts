/**
 * Core interfaces for Sherlock Ω system components
 * Defines the contracts for all major system components
 */

import {
  ComputationalIssue,
  FixCandidate,
  FormalProof,
  DeveloperIntent,
  SensorResult,
  ThoughtCompletion
} from '../types/core';

// Additional types needed for interfaces
export interface PreventiveActionPlan {
  id: string;
  orderedActions: PreventiveAction[];
  estimatedTime: number;
  confidence: number;
  criticalPath: string[];
}

export interface ActionPlan {
  id: string;
  orderedActions: Action[];
  estimatedTime: number;
  confidence: number;
  criticalPath: string[];
}

export interface Action {
  id: string;
  type: ActionType;
  description: string;
  priority: number;
  estimatedTime: number;
  dependencies: string[];
  rollbackPlan: RollbackStrategy;
}

export interface PreventiveAction {
  id: string;
  type: ActionType;
  description: string;
  priority: number;
  estimatedTime: number;
  dependencies: string[];
  rollbackPlan: RollbackStrategy;
}

export enum ActionType {
  SYNTAX_CORRECTION = 'SYNTAX_CORRECTION',
  DEPENDENCY_RESOLUTION = 'DEPENDENCY_RESOLUTION',
  CONFIGURATION_FIX = 'CONFIGURATION_FIX',
  PERFORMANCE_OPTIMIZATION = 'PERFORMANCE_OPTIMIZATION',
  SECURITY_ENHANCEMENT = 'SECURITY_ENHANCEMENT',
  CODE_REFACTORING = 'CODE_REFACTORING',
  DOCUMENTATION_UPDATE = 'DOCUMENTATION_UPDATE',
  TEST_GENERATION = 'TEST_GENERATION',
  ERROR_HANDLING = 'ERROR_HANDLING'
}

export interface RollbackStrategy {
  type: 'AUTOMATIC' | 'MANUAL' | 'CHECKPOINT';
  steps: RollbackStep[];
  timeLimit: number;
}

export interface RollbackStep {
  description: string;
  action: () => Promise<void>;
  verification: () => Promise<boolean>;
}

export interface CertifiedFix {
  solution: FixCandidate;
  proof: FormalProof;
  confidence: number;
  guarantees: ResolutionGuarantee[];
  rollbackPlan: RollbackStrategy;
}

export interface ResolutionGuarantee {
  type: GuaranteeType;
  description: string;
  mathematicalBasis: string;
  confidence: number;
}

export enum GuaranteeType {
  CORRECTNESS = 'CORRECTNESS',
  TERMINATION = 'TERMINATION',
  PERFORMANCE = 'PERFORMANCE',
  SAFETY = 'SAFETY'
}

export interface FrictionPoint {
  id: string;
  type: FrictionType;
  severity: number;
  location: string;
  description: string;
  impact: FrictionImpact;
  detectedAt: number;
}

export enum FrictionType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  API_CONNECTIVITY = 'API_CONNECTIVITY',
  PERFORMANCE_BOTTLENECK = 'PERFORMANCE_BOTTLENECK',
  ARCHITECTURAL_INCONSISTENCY = 'ARCHITECTURAL_INCONSISTENCY',
  UNKNOWN = 'UNKNOWN'
}

export interface FrictionImpact {
  developmentFlow: number;
  productivity: number;
  codeQuality: number;
  userExperience: number;
}

export interface GuaranteedResolution {
  problem: ComputationalIssue;
  solution: CertifiedFix;
  path: ResolutionPath;
  guarantee: ResolutionGuarantee;
  executedAt: number;
}

export interface ResolutionPath {
  exists: boolean;
  steps: ResolutionStep[];
  complexity: number;
  estimatedTime: number;
}

export interface ResolutionStep {
  id: string;
  description: string;
  action: () => Promise<void>;
  verification: () => Promise<boolean>;
  rollback: () => Promise<void>;
}

export interface CodeContext {
  file: string;
  content: string;
  cursor: Position;
  selection?: Range;
  ast?: any;
  symbols?: Symbol[];
  imports?: Import[];
  exports?: Export[];
}

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Symbol {
  name: string;
  type: string;
  scope: string;
  definition: Position;
  references: Position[];
}

export interface Import {
  module: string;
  symbols: string[];
  alias?: string;
  position: Position;
}

export interface Export {
  symbol: string;
  type: string;
  position: Position;
}

export interface PartialCode {
  content: string;
  context: CodeContext;
  intent?: DeveloperIntent;
}

// Core system interfaces

/**
 * Omniscient Development Monitor Interface
 * Monitors all possible failure points simultaneously
 */
export interface IOmniscientDevelopmentMonitor {
  /**
   * Monitor all system states in parallel
   * @returns Promise resolving to preventive action plan
   */
  monitorUniversalState(): Promise<PreventiveActionPlan>;

  /**
   * Execute preventive actions to prevent problems before they occur
   * @param actionPlan - The plan containing ordered preventive actions
   */
  preventAllProblems(actionPlan: PreventiveActionPlan): Promise<void>;

  /**
   * Handle quantum interference pattern analysis
   * @param monitoringResults - Results from parallel monitoring
   */
  quantumInterference(monitoringResults: SensorResult[]): ComputationalIssue[];

  /**
   * Generate preventive action plan from critical issues
   * @param criticalIssues - Issues identified as critical
   */
  generatePreventiveActionPlan(criticalIssues: ComputationalIssue[]): Promise<PreventiveActionPlan>;
}

/**
 * Provably Correct Code Healer Interface
 * Heals code with mathematical proof of correctness
 */
export interface IProvablyCorrectCodeHealer {
  /**
   * Heal computational issue with formal proof of correctness
   * @param problem - The computational issue to heal
   * @returns Promise resolving to certified fix with proof
   */
  healWithProof(problem: ComputationalIssue): Promise<CertifiedFix>;

  /**
   * Generate formal correctness proof for a fix candidate
   * @param fix - The fix candidate to prove
   * @param problem - The original problem
   * @returns Promise resolving to formal proof
   */
  generateCorrectnessProof(fix: FixCandidate, problem: ComputationalIssue): Promise<FormalProof>;

  /**
   * Select fix with strongest mathematical proof
   * @param verifiedFixes - Array of fixes with proofs
   * @returns The fix with strongest proof
   */
  selectFixWithStrongestProof(verifiedFixes: Array<{ fix: FixCandidate; proof: FormalProof }>): FixCandidate;
}

/**
 * Developer Mind Interface
 * Understands developer intent and completes thoughts
 */
export interface IDeveloperMindInterface {
  /**
   * Understand developer intent from code context
   * @param codeContext - Current code context
   * @returns Promise resolving to developer intent
   */
  understandDeveloperIntent(codeContext: CodeContext): Promise<DeveloperIntent>;

  /**
   * Complete developer's partial thought
   * @param partialThought - Partial code with context
   * @returns Promise resolving to thought completion
   */
  completeThought(partialThought: PartialCode): Promise<ThoughtCompletion>;

  /**
   * Analyze intent signals using quantum-inspired reasoning
   * @param intentSignals - Multi-modal intent signals
   * @returns Fused intent understanding
   */
  fuseIntentSignals(intentSignals: any[]): Promise<DeveloperIntent>;
}

/**
 * Zero-Friction Protocol Interface
 * Eliminates all blocking states to maintain flow
 */
export interface IZeroFrictionProtocol {
  /**
   * Maintain zero friction by eliminating all friction points
   * @returns Promise resolving to frictionless state
   */
  maintainZeroFriction(): Promise<FrictionlessState>;

  /**
   * Identify all current friction points
   * @returns Promise resolving to array of friction points
   */
  identifyAllFrictionPoints(): Promise<FrictionPoint[]>;

  /**
   * Eliminate friction point before developer encounters it
   * @param friction - The friction point to eliminate
   */
  eliminateFrictionProactively(friction: FrictionPoint): Promise<void>;

  /**
   * Ensure smooth flow state is maintained
   * @returns Promise resolving to flow state metrics
   */
  ensureFlowState(): Promise<FrictionlessState>;
}

export interface FrictionlessState {
  flowScore: number;
  blockedOperations: number;
  averageResponseTime: number;
  developerSatisfaction: number;
  timestamp: number;
}

// Intent Analysis interfaces

/**
 * Intent analysis result with confidence scoring
 */
export interface IntentAnalysis {
  intentType: string; // e.g., 'refactor', 'optimize', 'secure'
  confidence: number; // 0.0–1.0 probability score
  keyExpressions: string[]; // code tokens or patterns indicating intent
  context?: IntentContext;
  timestamp: number;
}

/**
 * Extended context for intent analysis
 */
export interface IntentContext {
  pattern?: string; // e.g. 'todo-comments', 'debug-statements'
  matches?: number; // number of regex hits
  analysisMethod?: string; // method used for analysis
  codeLength?: number; // length of analyzed code
  matchCount?: number; // total match count
  patternType?: string; // e.g., 'loop-unrolling', 'async-await', 'null-check'
  patternLocation?: PatternLocation[]; // locations where patterns were found
  [key: string]: any; // Allow additional properties
}

/**
 * Location information for detected patterns
 */
export interface PatternLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  patternName?: string;
}

/**
 * Action plan for responding to detected intent
 */
export interface ActionPlan {
  description: string; // human-readable next step
  priority: number; // lower is higher priority (e.g., 1 = critical)
  parameters?: Record<string, any>; // optional context data
  estimatedTime?: number; // estimated execution time in ms
  dependencies?: string[]; // required prerequisites
}

/**
 * Intent Analyzer interface for understanding developer intentions
 */
export interface IntentAnalyzer {
  /**
   * Analyze code to determine developer intent
   * @param code - The code to analyze
   * @returns Promise resolving to intent analysis
   */
  analyzeIntent(code: string): Promise<IntentAnalysis>;

  /**
   * Suggest next actions based on detected intent
   * @param intent - The analyzed intent
   * @returns Array of suggested action plans
   */
  suggestNextActions(intent: IntentAnalysis): ActionPlan[];

  /**
   * Run complete intent analysis and action suggestion workflow
   * @param code - The code to analyze
   * @returns Promise resolving to suggested actions
   */
  run(code: string): Promise<ActionPlan[]>;
}

/**
 * Universal Resolution Engine Interface
 * Provides absolute guarantee of problem resolution
 */
export interface IUniversalResolutionEngine {
  /**
   * Resolve any problem with absolute guarantee
   * @param problem - The problem to resolve
   * @returns Promise resolving to guaranteed resolution
   */
  resolveWithAbsoluteGuarantee(problem: any): Promise<GuaranteedResolution>;

  /**
   * Find guaranteed resolution path for a problem
   * @param problem - The problem to analyze
   * @returns Promise resolving to resolution path
   */
  findGuaranteedResolutionPath(problem: any): Promise<ResolutionPath>;

  /**
   * Transform problem space when no direct solution exists
   * @param problem - The problem to transform
   * @returns Promise resolving to transformed problem
   */
  transformProblemSpace(problem: any): Promise<any>;

  /**
   * Execute quantum-inspired search with guaranteed termination
   * @param solutionSpace - The space to search
   * @param isResolutionState - Function to check if state is resolution
   * @param guaranteedTermination - Termination guarantee function
   * @returns Promise resolving to optimal path
   */
  quantumSearch(
    solutionSpace: any,
    isResolutionState: (state: any) => boolean,
    guaranteedTermination: () => boolean
  ): Promise<ResolutionPath>;
}