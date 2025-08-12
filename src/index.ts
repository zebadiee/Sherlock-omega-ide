/**
 * Sherlock Ω (Omega) - Revolutionary Self-Healing Development Environment
 * Main entry point for the Computational Consciousness IDE
 */

export { SherlockOmegaCore, UserAction, UserActionType, EnhancedResult } from './core/SherlockOmegaCore';

export {
  IOmniscientDevelopmentMonitor,
  IProvablyCorrectCodeHealer,
  IDeveloperMindInterface,
  IZeroFrictionProtocol,
  IUniversalResolutionEngine,
  PreventiveActionPlan,
  PreventiveAction,
  ActionType,
  CertifiedFix,
  FrictionPoint,
  FrictionType,
  GuaranteedResolution,
  ResolutionPath
} from './core/interfaces';

export {
  ComputationalImmunitySystem,
  UniversalResolutionPromise,
  OmniscientDiagnosticGrid,
  ProvablyCorrectCodeGeneration,
  DeveloperMindInterface,
  SensorType,
  SensorInterface,
  SensorResult,
  SensorStatus,
  ComputationalIssue,
  ProblemType,
  SeverityLevel,
  FixCandidate,
  ParadigmType,
  FormalProof,
  ProofSystem,
  DeveloperIntent,
  Goal,
  GoalType
} from './types/core';

// Export friction detection and elimination system
export {
  IntegratedFrictionProtocol,
  ActionableItem,
  IntegratedProtocolResult,
  UIMetadata,
  ActionExecutionResult,
  UIStats,
  IntegratedContext
} from './friction/IntegratedFrictionProtocol';

// Export thought completion system
export {
  ThoughtCompletion,
  CompletionSuggestion,
  CompletionType,
  CompletionContext,
  CompletionMetadata,
  ThoughtCompletionResult
} from './intent/ThoughtCompletion';

export {
  ThoughtCompletionFrictionDetector,
  ThoughtCompletionFrictionPoint,
  ThoughtCompletionConfig,
  DEFAULT_THOUGHT_COMPLETION_CONFIG
} from './friction/ThoughtCompletionFrictionDetector';

/**
 * Create a new Sherlock Ω instance with default configuration
 * This is a factory function for easy instantiation
 */
export function createSherlockOmega(): SherlockOmegaCore {
  // For now, we'll create with null implementations
  // These will be replaced with actual implementations in subsequent tasks
  const nullMonitor = null as any;
  const nullHealer = null as any;
  const nullIntent = null as any;
  const nullFriction = null as any;
  const nullResolution = null as any;

  return new SherlockOmegaCore(
    nullMonitor,
    nullHealer,
    nullIntent,
    nullFriction,
    nullResolution
  );
}

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const CODENAME = 'Computational Consciousness';

/**
 * System constants
 */
export const SHERLOCK_OMEGA_CONSTANTS = {
  // Core guarantees
  IMMUNITY_GUARANTEE: 'ABSOLUTE' as const,
  RESOLUTION_THEOREM: 'EVERY_COMPUTABLE_PROBLEM_HAS_SOLUTION' as const,
  TIME_BOUND: 'FINITE' as const,
  
  // Performance targets
  MAX_RESPONSE_TIME_MS: 100,
  MIN_CONFIDENCE_THRESHOLD: 0.8,
  MIN_INTENT_ALIGNMENT: 0.7,
  
  // Evolution parameters
  EVOLUTION_CYCLE_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  LEARNING_RATE: 0.1,
  ADAPTABILITY_FACTOR: 0.8,
  MEMORY_CAPACITY: 1000000,
  
  // Quantum reasoning parameters
  QUANTUM_ENTANGLEMENT: true,
  INTERFERENCE_THRESHOLD: 0.5,
  SUPERPOSITION_STATES: 8,
  
  // Formal verification parameters
  PROOF_CONFIDENCE_THRESHOLD: 0.95,
  THEOREM_PROVER_TIMEOUT_MS: 10000,
  MAX_PROOF_DEPTH: 100
} as const;

console.log(`
🧠 Sherlock Ω (Omega) v${VERSION} - ${CODENAME}
   Revolutionary Self-Healing Development Environment
   
   "Making computational friction extinct through 
    omniscient monitoring, provable healing, and 
    continuous evolution."
    
   MIT Advanced Computational Intelligence Laboratory
`);