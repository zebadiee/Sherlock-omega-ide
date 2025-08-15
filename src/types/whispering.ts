/**
 * Whispering Architecture Type Definitions
 * Specialized types for the three observers and gentle suggestion system
 */

import { PlatformType } from '../core/whispering-interfaces';

// Mathematical Harmony Types (Pattern Keeper)
export interface MathematicalHarmony {
  elegance: number; // 0-1 mathematical beauty score
  efficiency: number; // 0-1 performance optimization potential
  symmetry: number; // 0-1 structural symmetry score
  resonance: number; // 0-1 developer alignment score
  optimization?: CodeOptimization;
  patterns: HarmonyPattern[];
}

export interface HarmonyPattern {
  type: HarmonyType;
  strength: number; // 0-1
  location: CodeLocation;
  suggestion?: string;
  confidence: number;
}

export enum HarmonyType {
  ALGORITHMIC_ELEGANCE = 'ALGORITHMIC_ELEGANCE',
  DATA_STRUCTURE_OPTIMIZATION = 'DATA_STRUCTURE_OPTIMIZATION',
  FUNCTIONAL_COMPOSITION = 'FUNCTIONAL_COMPOSITION',
  RECURSIVE_BEAUTY = 'RECURSIVE_BEAUTY',
  MATHEMATICAL_SYMMETRY = 'MATHEMATICAL_SYMMETRY',
  COMPLEXITY_REDUCTION = 'COMPLEXITY_REDUCTION'
}

export interface CodeOptimization {
  type: OptimizationType;
  description: string;
  originalComplexity: string;
  optimizedComplexity: string;
  performanceGain: number; // percentage
  readabilityImpact: number; // -1 to 1
  implementation: string;
}

export enum OptimizationType {
  TIME_COMPLEXITY = 'TIME_COMPLEXITY',
  SPACE_COMPLEXITY = 'SPACE_COMPLEXITY',
  ALGORITHMIC_APPROACH = 'ALGORITHMIC_APPROACH',
  DATA_STRUCTURE_CHOICE = 'DATA_STRUCTURE_CHOICE',
  FUNCTIONAL_REFACTOR = 'FUNCTIONAL_REFACTOR'
}

// Computational Poetry Types (Systems Philosopher)
export interface ComputationalPoetry {
  elegance: number; // 0-1 architectural beauty score
  harmony: number; // 0-1 system integration score
  resonance: number; // 0-1 developer alignment score
  flow: number; // 0-1 code flow and readability
  optimizedApproach?: ArchitecturalImprovement;
  poeticElements: PoetryElement[];
}

export interface PoetryElement {
  type: PoetryType;
  strength: number; // 0-1
  location: CodeLocation;
  description: string;
  suggestion?: string;
}

export enum PoetryType {
  ARCHITECTURAL_SYMMETRY = 'ARCHITECTURAL_SYMMETRY',
  DEPENDENCY_HARMONY = 'DEPENDENCY_HARMONY',
  INTERFACE_ELEGANCE = 'INTERFACE_ELEGANCE',
  ABSTRACTION_BEAUTY = 'ABSTRACTION_BEAUTY',
  COMPOSITION_FLOW = 'COMPOSITION_FLOW',
  NAMING_POETRY = 'NAMING_POETRY',
  SEPARATION_OF_CONCERNS = 'SEPARATION_OF_CONCERNS'
}

export interface ArchitecturalImprovement {
  type: ImprovementType;
  description: string;
  currentPattern: string;
  suggestedPattern: string;
  benefits: string[];
  tradeoffs: string[];
  implementation: ImplementationGuide;
}

export enum ImprovementType {
  DESIGN_PATTERN_APPLICATION = 'DESIGN_PATTERN_APPLICATION',
  DEPENDENCY_INVERSION = 'DEPENDENCY_INVERSION',
  INTERFACE_SEGREGATION = 'INTERFACE_SEGREGATION',
  SINGLE_RESPONSIBILITY = 'SINGLE_RESPONSIBILITY',
  COMPOSITION_OVER_INHERITANCE = 'COMPOSITION_OVER_INHERITANCE',
  IMMUTABILITY_INTRODUCTION = 'IMMUTABILITY_INTRODUCTION'
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  estimatedTime: number; // minutes
  difficulty: DifficultyLevel;
  prerequisites: string[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  code?: string;
  explanation: string;
}

export enum DifficultyLevel {
  TRIVIAL = 'TRIVIAL',
  EASY = 'EASY',
  MODERATE = 'MODERATE',
  CHALLENGING = 'CHALLENGING',
  EXPERT = 'EXPERT'
}

// Cosmic Connections Types (Cosmic Cartographer)
export interface CosmicConnection {
  strength: number; // 0-1 connection strength
  type: ConnectionType;
  source: CodeLocation;
  target: CodeLocation;
  relationship: RelationshipType;
  emergentOpportunity?: EmergentOpportunity;
  dimensionalAnalysis: DimensionalAnalysis;
}

export enum ConnectionType {
  DATA_FLOW = 'DATA_FLOW',
  CONTROL_FLOW = 'CONTROL_FLOW',
  DEPENDENCY_RELATIONSHIP = 'DEPENDENCY_RELATIONSHIP',
  SEMANTIC_SIMILARITY = 'SEMANTIC_SIMILARITY',
  ARCHITECTURAL_PATTERN = 'ARCHITECTURAL_PATTERN',
  CROSS_CUTTING_CONCERN = 'CROSS_CUTTING_CONCERN',
  EMERGENT_BEHAVIOR = 'EMERGENT_BEHAVIOR'
}

export enum RelationshipType {
  DIRECT_DEPENDENCY = 'DIRECT_DEPENDENCY',
  INDIRECT_COUPLING = 'INDIRECT_COUPLING',
  SHARED_ABSTRACTION = 'SHARED_ABSTRACTION',
  PARALLEL_EVOLUTION = 'PARALLEL_EVOLUTION',
  COMPLEMENTARY_FUNCTION = 'COMPLEMENTARY_FUNCTION',
  POTENTIAL_UNIFICATION = 'POTENTIAL_UNIFICATION'
}

export interface EmergentOpportunity {
  type: OpportunityType;
  description: string;
  potential: number; // 0-1 opportunity strength
  implementation: OpportunityImplementation;
  benefits: OpportunityBenefit[];
}

export enum OpportunityType {
  CODE_REUSE = 'CODE_REUSE',
  ABSTRACTION_EXTRACTION = 'ABSTRACTION_EXTRACTION',
  PATTERN_UNIFICATION = 'PATTERN_UNIFICATION',
  CROSS_CUTTING_SOLUTION = 'CROSS_CUTTING_SOLUTION',
  ARCHITECTURAL_EVOLUTION = 'ARCHITECTURAL_EVOLUTION',
  PERFORMANCE_OPTIMIZATION = 'PERFORMANCE_OPTIMIZATION'
}

export interface OpportunityImplementation {
  approach: string;
  steps: string[];
  estimatedImpact: ImpactAssessment;
  riskLevel: RiskLevel;
}

export interface ImpactAssessment {
  codeReduction: number; // percentage
  performanceImprovement: number; // percentage
  maintainabilityGain: number; // 0-1 score
  testabilityImprovement: number; // 0-1 score
}

export enum RiskLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface OpportunityBenefit {
  category: BenefitCategory;
  description: string;
  quantification?: number;
  unit?: string;
}

export enum BenefitCategory {
  PERFORMANCE = 'PERFORMANCE',
  MAINTAINABILITY = 'MAINTAINABILITY',
  READABILITY = 'READABILITY',
  TESTABILITY = 'TESTABILITY',
  REUSABILITY = 'REUSABILITY',
  SCALABILITY = 'SCALABILITY'
}

export interface DimensionalAnalysis {
  dimensions: CodeDimension[];
  relationships: DimensionalRelationship[];
  emergentProperties: EmergentProperty[];
}

export interface CodeDimension {
  name: string;
  type: DimensionType;
  value: number;
  unit: string;
  significance: number; // 0-1
}

export enum DimensionType {
  COMPLEXITY = 'COMPLEXITY',
  COUPLING = 'COUPLING',
  COHESION = 'COHESION',
  ABSTRACTION_LEVEL = 'ABSTRACTION_LEVEL',
  INFORMATION_FLOW = 'INFORMATION_FLOW',
  TEMPORAL_BEHAVIOR = 'TEMPORAL_BEHAVIOR'
}

export interface DimensionalRelationship {
  dimension1: string;
  dimension2: string;
  correlation: number; // -1 to 1
  causality: CausalityType;
}

export enum CausalityType {
  NONE = 'NONE',
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  BIDIRECTIONAL = 'BIDIRECTIONAL'
}

export interface EmergentProperty {
  name: string;
  description: string;
  strength: number; // 0-1
  stability: number; // 0-1
  predictability: number; // 0-1
}

// Common Types
export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  context?: string;
}

// Learning and Adaptation Types
export interface LearningData {
  platform: PlatformType;
  patterns: LearnedPattern[];
  preferences: LearnedPreference[];
  adaptations: Adaptation[];
  performance: PerformanceMetrics;
}

export interface LearnedPattern {
  type: string;
  frequency: number;
  accuracy: number;
  lastSeen: Date;
  context: PatternContext;
}

export interface PatternContext {
  language: string;
  projectType: string;
  codeStyle: string;
  complexity: string;
}

export interface LearnedPreference {
  category: string;
  preference: any;
  confidence: number;
  source: PreferenceSource;
  timestamp: Date;
}

export enum PreferenceSource {
  EXPLICIT_FEEDBACK = 'EXPLICIT_FEEDBACK',
  IMPLICIT_BEHAVIOR = 'IMPLICIT_BEHAVIOR',
  PATTERN_ANALYSIS = 'PATTERN_ANALYSIS',
  COMMUNITY_CONSENSUS = 'COMMUNITY_CONSENSUS'
}

export interface Adaptation {
  type: AdaptationType;
  description: string;
  trigger: string;
  implementation: string;
  effectiveness: number; // 0-1
  timestamp: Date;
}

export enum AdaptationType {
  SENSITIVITY_ADJUSTMENT = 'SENSITIVITY_ADJUSTMENT',
  TIMING_OPTIMIZATION = 'TIMING_OPTIMIZATION',
  SUGGESTION_FILTERING = 'SUGGESTION_FILTERING',
  PRESENTATION_STYLE = 'PRESENTATION_STYLE',
  ALGORITHM_TUNING = 'ALGORITHM_TUNING'
}

export interface PerformanceMetrics {
  analysisSpeed: number; // ms per analysis
  accuracy: number; // 0-1
  userSatisfaction: number; // 0-1
  resourceUsage: ResourceMetrics;
  improvementRate: number; // improvements per day
}

export interface ResourceMetrics {
  cpuUsage: number; // 0-1
  memoryUsage: number; // bytes
  networkUsage: number; // bytes
  storageUsage: number; // bytes
}

// Self-Evolution Types
export interface EvolutionEvent {
  id: string;
  type: EvolutionType;
  description: string;
  trigger: EvolutionTrigger;
  implementation: EvolutionImplementation;
  validation: EvolutionValidation;
  timestamp: Date;
}

export enum EvolutionType {
  ALGORITHM_IMPROVEMENT = 'ALGORITHM_IMPROVEMENT',
  NEW_PATTERN_RECOGNITION = 'NEW_PATTERN_RECOGNITION',
  PERFORMANCE_OPTIMIZATION = 'PERFORMANCE_OPTIMIZATION',
  USER_EXPERIENCE_ENHANCEMENT = 'USER_EXPERIENCE_ENHANCEMENT',
  INTEGRATION_IMPROVEMENT = 'INTEGRATION_IMPROVEMENT'
}

export interface EvolutionTrigger {
  type: TriggerType;
  threshold: number;
  condition: string;
  data: any;
}

export enum TriggerType {
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  USER_FEEDBACK_PATTERN = 'USER_FEEDBACK_PATTERN',
  ACCURACY_IMPROVEMENT_OPPORTUNITY = 'ACCURACY_IMPROVEMENT_OPPORTUNITY',
  RESOURCE_OPTIMIZATION_POTENTIAL = 'RESOURCE_OPTIMIZATION_POTENTIAL',
  COMMUNITY_PATTERN_EMERGENCE = 'COMMUNITY_PATTERN_EMERGENCE'
}

export interface EvolutionImplementation {
  changes: CodeChange[];
  tests: EvolutionTest[];
  rollbackPlan: RollbackPlan;
  deploymentStrategy: DeploymentStrategy;
}

export interface CodeChange {
  file: string;
  type: ChangeType;
  oldCode?: string;
  newCode: string;
  reasoning: string;
}

export enum ChangeType {
  ADDITION = 'ADDITION',
  MODIFICATION = 'MODIFICATION',
  DELETION = 'DELETION',
  REFACTORING = 'REFACTORING'
}

export interface EvolutionTest {
  name: string;
  type: TestType;
  criteria: TestCriteria;
  expectedResult: any;
}

export enum TestType {
  UNIT_TEST = 'UNIT_TEST',
  INTEGRATION_TEST = 'INTEGRATION_TEST',
  PERFORMANCE_TEST = 'PERFORMANCE_TEST',
  USER_EXPERIENCE_TEST = 'USER_EXPERIENCE_TEST',
  REGRESSION_TEST = 'REGRESSION_TEST'
}

export interface TestCriteria {
  metric: string;
  operator: ComparisonOperator;
  value: number;
  tolerance?: number;
}

export enum ComparisonOperator {
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  EQUAL_TO = 'EQUAL_TO',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL'
}

export interface RollbackPlan {
  steps: RollbackStep[];
  automaticTriggers: RollbackTrigger[];
  manualOverride: boolean;
}

export interface RollbackStep {
  order: number;
  description: string;
  action: string;
  verification: string;
}

export interface RollbackTrigger {
  condition: string;
  threshold: number;
  action: string;
}

export interface DeploymentStrategy {
  type: DeploymentType;
  phases: DeploymentPhase[];
  monitoring: MonitoringPlan;
}

export enum DeploymentType {
  IMMEDIATE = 'IMMEDIATE',
  GRADUAL_ROLLOUT = 'GRADUAL_ROLLOUT',
  A_B_TEST = 'A_B_TEST',
  CANARY_DEPLOYMENT = 'CANARY_DEPLOYMENT'
}

export interface DeploymentPhase {
  name: string;
  percentage: number; // percentage of users
  duration: number; // hours
  successCriteria: TestCriteria[];
}

export interface MonitoringPlan {
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  duration: number; // hours
}

export interface MonitoringMetric {
  name: string;
  type: MetricType;
  frequency: number; // seconds
  threshold?: number;
}

export enum MetricType {
  PERFORMANCE = 'PERFORMANCE',
  ACCURACY = 'ACCURACY',
  USER_SATISFACTION = 'USER_SATISFACTION',
  ERROR_RATE = 'ERROR_RATE',
  RESOURCE_USAGE = 'RESOURCE_USAGE'
}

export interface MonitoringAlert {
  condition: string;
  severity: AlertSeverity;
  action: string;
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface EvolutionValidation {
  preDeploymentTests: ValidationTest[];
  postDeploymentValidation: ValidationTest[];
  userAcceptanceCriteria: AcceptanceCriteria[];
  rollbackCriteria: RollbackCriteria[];
}

export interface ValidationTest {
  name: string;
  type: ValidationType;
  criteria: TestCriteria;
  result?: ValidationResult;
}

export enum ValidationType {
  FUNCTIONAL = 'FUNCTIONAL',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  USABILITY = 'USABILITY',
  COMPATIBILITY = 'COMPATIBILITY'
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  details: string;
  timestamp: Date;
}

export interface AcceptanceCriteria {
  description: string;
  metric: string;
  target: number;
  tolerance: number;
}

export interface RollbackCriteria {
  condition: string;
  threshold: number;
  automatic: boolean;
}