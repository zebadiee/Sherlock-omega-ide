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

// Action Types
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

// Rollback Strategy
export interface RollbackStrategy {
  type: 'AUTOMATIC' | 'MANUAL' | 'CHECKPOINT';
  steps: RollbackStep[];
  timeLimit: number;
}

export interface RollbackStep {
  description: string;
  command?: string;
  verification?: string;
}

// Action Interfaces
export interface Action {
  id: string;
  type: ActionType;
  description: string;
  priority: number;
  estimatedTime: number;
  dependencies: string[];
  rollbackPlan: RollbackStrategy;
}

export interface PreventiveAction extends Action {
  // Preventive actions have the same structure as regular actions
}

// Fixed ActionPlan Interface
export interface ActionPlan {
  id: string;
  description: string;        // Required field
  priority: number;          // Required field
  orderedActions: Action[];
  estimatedTime: number;
  confidence: number;
  criticalPath: string[];
}

export interface PreventiveActionPlan {
  id: string;
  orderedActions: PreventiveAction[];
  estimatedTime: number;
  confidence: number;
  criticalPath: string[];
}

// Intent Analysis Interfaces
export interface IntentAnalysis {
  intentType: string;
  confidence: number;
  suggestedActions: Action[];
  metadata?: any;
}

export interface IntentAnalyzer {
  analyze(code: string): Promise<IntentAnalysis>;
  getType(): string;
}

// Core System Interfaces
export interface IOmniscientDevelopmentMonitor {
  monitorUniversalState(): Promise<PreventiveActionPlan>;
  preventAllProblems(actionPlan: PreventiveActionPlan): Promise<void>;
  quantumInterference(monitoringResults: any[]): any[];
  generatePreventiveActionPlan(criticalIssues: any[]): Promise<PreventiveActionPlan>;
}

export interface IProvablyCorrectCodeHealer {
  healWithProof(problem: ComputationalIssue): Promise<any>;
  generateCorrectnessProof(fix: FixCandidate, problem: ComputationalIssue): Promise<FormalProof>;
  selectFixWithStrongestProof(verifiedFixes: any[]): any;
}

export interface IDeveloperMindInterface {
  understandDeveloperIntent(codeContext: any): Promise<DeveloperIntent>;
  completeThought(partialThought: any): Promise<ThoughtCompletion>;
  fuseIntentSignals(intentSignals: any[]): Promise<any>;
}

export interface IZeroFrictionProtocol {
  maintainZeroFriction(): Promise<any>;
  identifyAllFrictionPoints(): Promise<any[]>;
  eliminateFrictionProactively(friction: any): Promise<void>;
  ensureFlowState(): Promise<any>;
}

export interface IUniversalResolutionEngine {
  resolveWithAbsoluteGuarantee(problem: any): Promise<any>;
  findGuaranteedResolutionPath(problem: any): Promise<any>;
  transformProblemSpace(problem: any): Promise<any>;
  quantumSearch(solutionSpace: any, isResolutionState: any, guaranteedTermination: any): Promise<any>;
}

// Sensor Interfaces
export interface SensorInterface {
  monitor(): Promise<SensorResult>;
  getType(): string;
  isActive(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// User Action Interfaces
export enum UserActionType {
  KEYSTROKE = 'KEYSTROKE',
  FILE_SAVE = 'FILE_SAVE',
  FILE_OPEN = 'FILE_OPEN',
  COMMAND_EXECUTE = 'COMMAND_EXECUTE'
}

export interface UserAction {
  id: string;
  type: UserActionType;
  timestamp: number;
  context: any;
  data: any;
}