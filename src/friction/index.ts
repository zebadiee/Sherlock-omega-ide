/**
 * Friction Detection and Elimination System for Sherlock Ω
 * Exports all friction-related components for zero-friction development
 */

// Base friction detection framework (Task 7.1)
export {
  FrictionDetector as BaseFrictionDetector,
  FrictionPoint as BaseFrictionPoint,
  FrictionDetectorStats,
  FrictionDetectorConfig,
  DEFAULT_FRICTION_DETECTOR_CONFIG
} from './BaseFrictionDetector';

// Simplified framework components (Task 7.1)
export {
  SimpleSyntaxFrictionDetector,
  SyntaxFrictionPoint,
  SyntaxStats
} from './SimpleSyntaxFrictionDetector';

export {
  SimpleZeroFrictionProtocol,
  ProtocolResult,
  DetectorResult,
  ProtocolConfig,
  ProtocolStats,
  DetectorPerformance,
  DEFAULT_PROTOCOL_CONFIG
} from './SimpleZeroFrictionProtocol';

// Advanced friction detection framework (Task 7.3)
export {
  FrictionDetector,
  FrictionType,
  FrictionPoint,
  FrictionLocation,
  FrictionImpact,
  FrictionMetadata,
  ResolutionAttempt,
  EliminationResult,
  EliminationStrategy,
  EliminationStep,
  RollbackPlan,
  FrictionDetectorConfig as AdvancedFrictionDetectorConfig,
  DEFAULT_FRICTION_CONFIG
} from './FrictionDetector';

// Advanced syntax friction detection and elimination (Task 7.3)
export {
  SyntaxFrictionDetector,
  SyntaxContext,
  SupportedLanguage,
  SyntaxError,
  AutoCorrectionSuggestion,
  CorrectionType
} from './SyntaxFrictionDetector';

// Advanced zero-friction protocol coordination (Task 7.3)
export {
  ZeroFrictionProtocol,
  FlowState,
  FlowLevel,
  FlowFactor,
  FlowFactorType,
  FrictionStats,
  ZeroFrictionConfig,
  DEFAULT_ZERO_FRICTION_CONFIG
} from './ZeroFrictionProtocol';

// Thought completion friction detection (Task 6.4)
export {
  ThoughtCompletionFrictionDetector,
  ThoughtCompletionFrictionPoint,
  ThoughtCompletionConfig,
  DEFAULT_THOUGHT_COMPLETION_CONFIG
} from './ThoughtCompletionFrictionDetector';