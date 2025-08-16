/**
 * Core AI Integration Interfaces
 * 
 * Defines the foundational interfaces for AI orchestration, model management,
 * and request/response handling in Sherlock Ω IDE.
 */

// Core AI Request/Response Types
export interface AIRequest {
  id: string;
  type: AIRequestType;
  context: ProjectContext;
  payload: unknown;
  priority: RequestPriority;
  privacyLevel: PrivacyLevel;
  timestamp: Date;
}

export interface AIResponse {
  id: string;
  requestId: string;
  result: unknown;
  confidence: number;
  modelUsed: string;
  processingTime: number;
  tokens: TokenUsage;
}

export enum AIRequestType {
  CODE_COMPLETION = 'code_completion',
  NATURAL_LANGUAGE = 'natural_language',
  PREDICTIVE_ANALYSIS = 'predictive_analysis',
  DEBUG_ASSISTANCE = 'debug_assistance',
  CONTEXT_ANALYSIS = 'context_analysis'
}

export enum RequestPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  LOCAL_ONLY = 'local_only'
}

// Token Usage Tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

// Project Context
export interface ProjectContext {
  projectId: string;
  language: string;
  framework?: string;
  dependencies: Dependency[];
  architecture: ArchitecturePattern;
  codeMetrics: CodeMetrics;
  userPreferences: UserPreferences;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  source: string;
}

export enum ArchitecturePattern {
  MVC = 'mvc',
  MVVM = 'mvvm',
  MICROSERVICES = 'microservices',
  MONOLITHIC = 'monolithic',
  SERVERLESS = 'serverless',
  UNKNOWN = 'unknown'
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  testCoverage: number;
  technicalDebt: number;
  maintainabilityIndex: number;
}

export interface UserPreferences {
  codingStyle: CodingStyle;
  preferredPatterns: string[];
  completionSettings: CompletionSettings;
  privacyLevel: PrivacyLevel;
  modelPreferences: ModelPreferences;
}

export interface CodingStyle {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  lineLength: number;
  namingConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
  bracketStyle: 'same-line' | 'new-line';
}

export interface CompletionSettings {
  enabled: boolean;
  triggerCharacters: string[];
  maxSuggestions: number;
  minConfidence: number;
  showDocumentation: boolean;
}

export interface ModelPreferences {
  preferredProviders: string[];
  fallbackStrategy: 'fastest' | 'most_accurate' | 'cheapest';
  maxCostPerRequest: number;
  localOnly: boolean;
}

// AI Orchestrator Interface
export interface AIOrchestrator {
  // Core orchestration methods
  processRequest(request: AIRequest): Promise<AIResponse>;
  routeToOptimalModel(request: AIRequest): Promise<ModelSelection>;
  aggregateResponses(responses: AIResponse[]): Promise<AIResponse>;
  
  // Quality and performance management
  validateResponse(response: AIResponse): Promise<ValidationResult>;
  trackPerformanceMetrics(metrics: PerformanceMetrics): void;
  optimizeResourceAllocation(): Promise<void>;
  
  // Learning and adaptation
  recordUserFeedback(feedback: UserFeedback): void;
  updateModelPreferences(preferences: ModelPreferences): void;
  triggerModelRetraining(): Promise<void>;
}

export interface ModelSelection {
  modelId: string;
  provider: string;
  confidence: number;
  estimatedCost: number;
  estimatedLatency: number;
  reasoning: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'accuracy' | 'safety' | 'privacy' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion?: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUsage: ResourceUsage;
  userSatisfaction: number;
}

export interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  networkBandwidth: number;
  storageUsage: number;
}

export interface UserFeedback {
  requestId: string;
  rating: number; // 1-5 scale
  feedback: string;
  accepted: boolean;
  timestamp: Date;
  context: string;
}

// Model Router Interface
export interface ModelRouter {
  // Model selection and routing
  selectModel(request: AIRequest): Promise<ModelSelection>;
  routeRequest(request: AIRequest, model: ModelSelection): Promise<AIResponse>;
  
  // Load balancing and failover
  balanceLoad(requests: AIRequest[]): Promise<RoutingPlan>;
  handleFailover(failedModel: string, request: AIRequest): Promise<AIResponse>;
  
  // Model management
  registerModel(model: ModelConfiguration): Promise<void>;
  unregisterModel(modelId: string): Promise<void>;
  getAvailableModels(): Promise<ModelConfiguration[]>;
  healthCheck(modelId: string): Promise<HealthStatus>;
}

export interface RoutingPlan {
  routes: RouteAssignment[];
  estimatedLatency: number;
  estimatedCost: number;
  loadDistribution: Record<string, number>;
}

export interface RouteAssignment {
  requestId: string;
  modelId: string;
  priority: number;
  estimatedProcessingTime: number;
}

export interface ModelConfiguration {
  modelId: string;
  provider: ModelProvider;
  capabilities: ModelCapability[];
  costPerToken: number;
  maxTokens: number;
  responseTime: number;
  accuracy: number;
  availability: number;
}

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
  HUGGINGFACE = 'huggingface',
  CUSTOM = 'custom'
}

export enum ModelCapability {
  CODE_COMPLETION = 'code_completion',
  TEXT_GENERATION = 'text_generation',
  CODE_ANALYSIS = 'code_analysis',
  NATURAL_LANGUAGE = 'natural_language',
  REASONING = 'reasoning',
  MULTIMODAL = 'multimodal'
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  issues: string[];
}

// Context Engine Interface
export interface ContextEngine {
  // Context analysis and extraction
  analyzeProject(projectPath: string): Promise<ProjectContext>;
  extractCodeContext(file: string, position: Position): Promise<CodeContext>;
  updateContext(context: ProjectContext): Promise<void>;
  
  // Pattern recognition and learning
  identifyPatterns(codebase: Codebase): Promise<CodePattern[]>;
  learnFromInteractions(interactions: Interaction[]): Promise<void>;
  
  // Context caching and optimization
  cacheContext(key: string, context: unknown): Promise<void>;
  getCachedContext(key: string): Promise<unknown | null>;
  invalidateCache(pattern: string): Promise<void>;
}

export interface Position {
  line: number;
  character: number;
}

export interface CodeContext {
  currentFile: string;
  cursorPosition: Position;
  surroundingCode: string;
  imports: string[];
  functions: FunctionInfo[];
  variables: VariableInfo[];
  scope: ScopeInfo;
}

export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  documentation?: string;
  startLine: number;
  endLine: number;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface VariableInfo {
  name: string;
  type: string;
  scope: 'local' | 'global' | 'parameter';
  value?: string;
  line: number;
}

export interface ScopeInfo {
  type: 'function' | 'class' | 'module' | 'block';
  name: string;
  parent?: ScopeInfo;
  variables: VariableInfo[];
}

export interface Codebase {
  files: CodeFile[];
  structure: ProjectStructure;
  dependencies: DependencyGraph;
  metrics: CodebaseMetrics;
  patterns: IdentifiedPattern[];
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
  ast?: unknown; // Abstract Syntax Tree
}

export interface ProjectStructure {
  rootPath: string;
  directories: DirectoryInfo[];
  files: FileInfo[];
  packageInfo?: PackageInfo;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  children: (DirectoryInfo | FileInfo)[];
}

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: 'source' | 'test' | 'config' | 'documentation' | 'asset';
}

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][];
  depth: number;
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: 'internal' | 'external';
  size: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic';
  weight: number;
}

export interface CodebaseMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  testCoverage: number;
  duplicateCode: number;
  technicalDebt: TechnicalDebtInfo;
}

export interface TechnicalDebtInfo {
  totalMinutes: number;
  categories: Record<string, number>;
  hotspots: CodeHotspot[];
}

export interface CodeHotspot {
  file: string;
  startLine: number;
  endLine: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  effort: number; // minutes to fix
}

export interface CodePattern {
  id: string;
  name: string;
  type: 'design_pattern' | 'anti_pattern' | 'idiom' | 'convention';
  confidence: number;
  occurrences: PatternOccurrence[];
  description: string;
  recommendation?: string;
}

export interface PatternOccurrence {
  file: string;
  startLine: number;
  endLine: number;
  context: string;
  confidence: number;
}

export interface IdentifiedPattern extends CodePattern {
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  suggestions: string[];
}

export interface Interaction {
  id: string;
  type: 'completion' | 'command' | 'feedback' | 'correction';
  timestamp: Date;
  context: CodeContext;
  input: string;
  output: string;
  accepted: boolean;
  feedback?: UserFeedback;
}

// Error Handling Types
export class AIError extends Error {
  code: AIErrorCode;
  requestId?: string;
  modelId?: string;
  retryable: boolean;
  context?: unknown;

  constructor(
    message: string,
    code: AIErrorCode,
    retryable: boolean = false,
    context?: unknown
  ) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
  }
}

export enum AIErrorCode {
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  QUALITY_THRESHOLD_NOT_MET = 'QUALITY_THRESHOLD_NOT_MET',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES'
}

// Configuration Types
export interface AIConfiguration {
  orchestrator: OrchestratorConfig;
  models: ModelConfiguration[];
  privacy: PrivacyConfig;
  performance: PerformanceConfig;
  logging: LoggingConfig;
}

export interface OrchestratorConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
  fallbackStrategy: 'fail_fast' | 'graceful_degradation' | 'best_effort';
  qualityThreshold: number;
}

export interface PrivacyConfig {
  defaultPrivacyLevel: PrivacyLevel;
  dataRetentionDays: number;
  anonymizationEnabled: boolean;
  localProcessingPreferred: boolean;
  consentRequired: boolean;
}

export interface PerformanceConfig {
  maxResponseTime: number;
  targetAccuracy: number;
  cachingEnabled: boolean;
  preloadModels: boolean;
  resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxNetworkBandwidth: number; // MB/s
  maxStorageUsage: number; // MB
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableTracing: boolean;
  retentionDays: number;
  sensitiveDataFiltering: boolean;
}