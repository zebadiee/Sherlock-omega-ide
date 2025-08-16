/**
 * Cross-Platform Unified Type Definitions
 * Types that work consistently across web and desktop implementations
 */

import { 
  PlatformType, 
  PlatformCapabilities, 
  BackoffStrategy,
  ThrottlingConfig
} from './platform';
import { ComputationalIssue, DeveloperIntent, SensorResult } from './core';

// Re-export platform types for convenience
export { PlatformType } from './platform';

// Unified Context Types
export interface UnifiedContext {
  platform: PlatformType;
  editor: EditorContext;
  project: ProjectContext;
  developer: DeveloperContext;
  system: SystemContext;
  session: SessionContext;
}

export interface EditorContext {
  type: EditorType;
  content: string;
  language: string;
  cursor: Position;
  selection?: Range;
  metadata: EditorMetadata;
  capabilities: EditorCapabilities;
}

export enum EditorType {
  MONACO = 'MONACO',
  NATIVE = 'NATIVE',
  TERMINAL = 'TERMINAL',
  EMBEDDED = 'EMBEDDED'
}

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface EditorMetadata {
  fileName: string;
  filePath: string;
  fileSize: number;
  lastModified: Date;
  encoding: string;
  lineEndings: LineEndingType;
  tabSize: number;
  insertSpaces: boolean;
}

export enum LineEndingType {
  LF = 'LF',
  CRLF = 'CRLF',
  CR = 'CR'
}

export interface EditorCapabilities {
  syntaxHighlighting: boolean;
  autoCompletion: boolean;
  errorHighlighting: boolean;
  codeFormatting: boolean;
  refactoring: boolean;
  debugging: boolean;
  extensions: boolean;
}

export interface ProjectContext {
  root: string;
  name: string;
  type: ProjectType;
  files: FileMetadata[];
  dependencies: DependencyInfo[];
  configuration: ProjectConfiguration;
  versionControl: VCSInfo;
  build: BuildInfo;
}

export enum ProjectType {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  PYTHON = 'PYTHON',
  RUST = 'RUST',
  GO = 'GO',
  JAVA = 'JAVA',
  CSHARP = 'CSHARP',
  CPP = 'CPP',
  MIXED = 'MIXED',
  UNKNOWN = 'UNKNOWN'
}

export interface FileMetadata {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  type: FileType;
  encoding: string;
  permissions: FilePermissionSet;
}

export enum FileType {
  SOURCE_CODE = 'SOURCE_CODE',
  CONFIGURATION = 'CONFIGURATION',
  DOCUMENTATION = 'DOCUMENTATION',
  ASSET = 'ASSET',
  BUILD_ARTIFACT = 'BUILD_ARTIFACT',
  TEST = 'TEST',
  UNKNOWN = 'UNKNOWN'
}

export interface FilePermissionSet {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: DependencyType;
  source: DependencySource;
  status: DependencyStatus;
  vulnerabilities: SecurityVulnerability[];
}

export enum DependencyType {
  RUNTIME = 'RUNTIME',
  DEVELOPMENT = 'DEVELOPMENT',
  PEER = 'PEER',
  OPTIONAL = 'OPTIONAL',
  BUNDLED = 'BUNDLED'
}

export enum DependencySource {
  NPM = 'NPM',
  YARN = 'YARN',
  CARGO = 'CARGO',
  PIP = 'PIP',
  MAVEN = 'MAVEN',
  NUGET = 'NUGET',
  GO_MOD = 'GO_MOD',
  LOCAL = 'LOCAL'
}

export enum DependencyStatus {
  INSTALLED = 'INSTALLED',
  MISSING = 'MISSING',
  OUTDATED = 'OUTDATED',
  VULNERABLE = 'VULNERABLE',
  DEPRECATED = 'DEPRECATED'
}

export interface SecurityVulnerability {
  id: string;
  severity: VulnerabilitySeverity;
  description: string;
  fixAvailable: boolean;
  fixVersion?: string;
}

export enum VulnerabilitySeverity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ProjectConfiguration {
  buildSystem: BuildSystem;
  testFramework?: TestFramework;
  linter?: LinterConfig;
  formatter?: FormatterConfig;
  typeChecker?: TypeCheckerConfig;
  bundler?: BundlerConfig;
}

export enum BuildSystem {
  NPM = 'NPM',
  YARN = 'YARN',
  WEBPACK = 'WEBPACK',
  VITE = 'VITE',
  ROLLUP = 'ROLLUP',
  CARGO = 'CARGO',
  MAKE = 'MAKE',
  CMAKE = 'CMAKE',
  GRADLE = 'GRADLE',
  MAVEN = 'MAVEN',
  MSBUILD = 'MSBUILD'
}

export enum TestFramework {
  JEST = 'JEST',
  MOCHA = 'MOCHA',
  VITEST = 'VITEST',
  CYPRESS = 'CYPRESS',
  PLAYWRIGHT = 'PLAYWRIGHT',
  PYTEST = 'PYTEST',
  CARGO_TEST = 'CARGO_TEST',
  GO_TEST = 'GO_TEST'
}

export interface LinterConfig {
  name: string;
  version: string;
  rules: Record<string, any>;
  enabled: boolean;
}

export interface FormatterConfig {
  name: string;
  version: string;
  settings: Record<string, any>;
  enabled: boolean;
}

export interface TypeCheckerConfig {
  name: string;
  version: string;
  strictMode: boolean;
  options: Record<string, any>;
}

export interface BundlerConfig {
  name: string;
  version: string;
  target: BuildTarget;
  optimization: OptimizationConfig;
}

export enum BuildTarget {
  ES5 = 'ES5',
  ES2015 = 'ES2015',
  ES2018 = 'ES2018',
  ES2020 = 'ES2020',
  ES2022 = 'ES2022',
  ESNEXT = 'ESNEXT',
  NODE = 'NODE',
  BROWSER = 'BROWSER',
  WEBWORKER = 'WEBWORKER'
}

export interface OptimizationConfig {
  minify: boolean;
  treeshake: boolean;
  splitChunks: boolean;
  compression: boolean;
}

export interface VCSInfo {
  type: VCSType;
  remote?: string;
  branch: string;
  commit: string;
  status: VCSStatus;
  changes: VCSChange[];
}

export enum VCSType {
  GIT = 'GIT',
  SVN = 'SVN',
  MERCURIAL = 'MERCURIAL',
  NONE = 'NONE'
}

export interface VCSStatus {
  clean: boolean;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
}

export interface VCSChange {
  file: string;
  type: ChangeType;
  additions: number;
  deletions: number;
}

export enum ChangeType {
  ADDED = 'ADDED',
  MODIFIED = 'MODIFIED',
  DELETED = 'DELETED',
  RENAMED = 'RENAMED',
  COPIED = 'COPIED'
}

export interface BuildInfo {
  status: BuildStatus;
  lastBuild: Date;
  duration: number; // milliseconds
  artifacts: BuildArtifact[];
  errors: BuildError[];
  warnings: BuildWarning[];
}

export enum BuildStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  NOT_STARTED = 'NOT_STARTED'
}

export interface BuildArtifact {
  name: string;
  path: string;
  size: number;
  type: ArtifactType;
}

export enum ArtifactType {
  EXECUTABLE = 'EXECUTABLE',
  LIBRARY = 'LIBRARY',
  BUNDLE = 'BUNDLE',
  DOCUMENTATION = 'DOCUMENTATION',
  SOURCE_MAP = 'SOURCE_MAP'
}

export interface BuildError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: ErrorSeverity;
}

export interface BuildWarning {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  category: WarningCategory;
}

export enum ErrorSeverity {
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum WarningCategory {
  DEPRECATION = 'DEPRECATION',
  PERFORMANCE = 'PERFORMANCE',
  STYLE = 'STYLE',
  COMPATIBILITY = 'COMPATIBILITY'
}

export interface DeveloperContext {
  preferences: DeveloperPreferences;
  patterns: DeveloperPatterns;
  flowState: FlowState;
  platform: PlatformType;
  capabilities: PlatformCapabilities;
  session: DeveloperSession;
}

export interface DeveloperPreferences {
  theme: ThemePreference;
  editor: EditorPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
}

export interface ThemePreference {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  customColors?: Record<string, string>;
  fontSize: number;
  fontFamily: string;
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
  HIGH_CONTRAST = 'HIGH_CONTRAST'
}

export enum ColorScheme {
  DEFAULT = 'DEFAULT',
  WHISPERING = 'WHISPERING',
  MINIMAL = 'MINIMAL',
  VIBRANT = 'VIBRANT',
  CUSTOM = 'CUSTOM'
}

export interface EditorPreferences {
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: AutoSaveMode;
  suggestions: SuggestionPreferences;
}

export enum AutoSaveMode {
  OFF = 'OFF',
  AFTER_DELAY = 'AFTER_DELAY',
  ON_FOCUS_CHANGE = 'ON_FOCUS_CHANGE',
  ON_WINDOW_CHANGE = 'ON_WINDOW_CHANGE'
}

export interface SuggestionPreferences {
  enabled: boolean;
  frequency: SuggestionFrequency;
  timing: SuggestionTiming;
  types: SuggestionType[];
}

export enum SuggestionFrequency {
  MINIMAL = 'MINIMAL',
  MODERATE = 'MODERATE',
  FREQUENT = 'FREQUENT',
  MAXIMUM = 'MAXIMUM'
}

export enum SuggestionTiming {
  IMMEDIATE = 'IMMEDIATE',
  ON_PAUSE = 'ON_PAUSE',
  ON_REQUEST = 'ON_REQUEST',
  CONTEXTUAL = 'CONTEXTUAL'
}

export enum SuggestionType {
  CODE_COMPLETION = 'CODE_COMPLETION',
  REFACTORING = 'REFACTORING',
  OPTIMIZATION = 'OPTIMIZATION',
  ARCHITECTURAL = 'ARCHITECTURAL',
  EDUCATIONAL = 'EDUCATIONAL'
}

export interface NotificationPreferences {
  enabled: boolean;
  types: NotificationType[];
  delivery: NotificationDelivery;
  doNotDisturb: DoNotDisturbConfig;
}

export enum NotificationType {
  WHISPER = 'WHISPER',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS'
}

export interface NotificationDelivery {
  method: DeliveryMethod;
  position: NotificationPosition;
  duration: number; // milliseconds
  sound: boolean;
}

export enum DeliveryMethod {
  OVERLAY = 'OVERLAY',
  TOAST = 'TOAST',
  SYSTEM = 'SYSTEM',
  INLINE = 'INLINE'
}

export enum NotificationPosition {
  TOP_RIGHT = 'TOP_RIGHT',
  TOP_LEFT = 'TOP_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  CENTER = 'CENTER'
}

export interface DoNotDisturbConfig {
  enabled: boolean;
  schedule: DisturbSchedule;
  exceptions: DisturbException[];
}

export interface DisturbSchedule {
  start: string; // HH:MM format
  end: string; // HH:MM format
  days: DayOfWeek[];
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface DisturbException {
  type: ExceptionType;
  condition: string;
  priority: ExceptionPriority;
}

export enum ExceptionType {
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  BUILD_FAILURE = 'BUILD_FAILURE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER'
}

export enum ExceptionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface PrivacyPreferences {
  dataCollection: DataCollectionLevel;
  analytics: boolean;
  crashReporting: boolean;
  usageStatistics: boolean;
  personalizedSuggestions: boolean;
}

export enum DataCollectionLevel {
  NONE = 'NONE',
  MINIMAL = 'MINIMAL',
  STANDARD = 'STANDARD',
  FULL = 'FULL'
}

export interface AccessibilityPreferences {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
  reducedMotion: boolean;
}

export interface DeveloperPatterns {
  codingStyle: CodingStylePattern;
  workingHours: WorkingHoursPattern;
  focusPatterns: FocusPattern[];
  errorPatterns: ErrorPattern[];
  learningPatterns: LearningPattern[];
}

export interface CodingStylePattern {
  language: string;
  conventions: StyleConvention[];
  preferences: StylePreference[];
  consistency: number; // 0-1 score
}

export interface StyleConvention {
  type: ConventionType;
  rule: string;
  adherence: number; // 0-1 score
}

export enum ConventionType {
  NAMING = 'NAMING',
  INDENTATION = 'INDENTATION',
  SPACING = 'SPACING',
  STRUCTURE = 'STRUCTURE',
  COMMENTS = 'COMMENTS'
}

export interface StylePreference {
  category: PreferenceCategory;
  value: any;
  confidence: number; // 0-1 score
}

export enum PreferenceCategory {
  FUNCTIONAL_VS_IMPERATIVE = 'FUNCTIONAL_VS_IMPERATIVE',
  VERBOSE_VS_CONCISE = 'VERBOSE_VS_CONCISE',
  EXPLICIT_VS_IMPLICIT = 'EXPLICIT_VS_IMPLICIT',
  PERFORMANCE_VS_READABILITY = 'PERFORMANCE_VS_READABILITY'
}

export interface WorkingHoursPattern {
  timezone: string;
  peakHours: TimeRange[];
  breakPatterns: BreakPattern[];
  productivityCurve: ProductivityPoint[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface BreakPattern {
  frequency: number; // minutes
  duration: number; // minutes
  type: BreakType;
}

export enum BreakType {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
  MEAL = 'MEAL'
}

export interface ProductivityPoint {
  hour: number; // 0-23
  productivity: number; // 0-1 score
  confidence: number; // 0-1 score
}

export interface FocusPattern {
  trigger: FocusTrigger;
  duration: number; // minutes
  intensity: number; // 0-1 score
  interruptions: InterruptionTolerance;
}

export interface FocusTrigger {
  type: TriggerType;
  condition: string;
  reliability: number; // 0-1 score
}

export enum TriggerType {
  TIME_BASED = 'TIME_BASED',
  TASK_BASED = 'TASK_BASED',
  CONTEXT_BASED = 'CONTEXT_BASED',
  EXTERNAL_SIGNAL = 'EXTERNAL_SIGNAL'
}

export interface InterruptionTolerance {
  level: ToleranceLevel;
  acceptableTypes: InterruptionType[];
  recoveryTime: number; // minutes
}

export enum ToleranceLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum InterruptionType {
  NOTIFICATION = 'NOTIFICATION',
  MEETING = 'MEETING',
  QUESTION = 'QUESTION',
  EMERGENCY = 'EMERGENCY'
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  resolution: ResolutionPattern;
  learning: LearningOutcome;
}

export interface ResolutionPattern {
  averageTime: number; // minutes
  strategies: ResolutionStrategy[];
  successRate: number; // 0-1 score
}

export interface ResolutionStrategy {
  name: string;
  frequency: number;
  effectiveness: number; // 0-1 score
}

export interface LearningOutcome {
  improvement: number; // 0-1 score
  retention: number; // 0-1 score
  application: number; // 0-1 score
}

export interface LearningPattern {
  topic: string;
  method: LearningMethod;
  effectiveness: number; // 0-1 score
  retention: RetentionCurve;
}

export enum LearningMethod {
  DOCUMENTATION = 'DOCUMENTATION',
  EXAMPLES = 'EXAMPLES',
  EXPERIMENTATION = 'EXPERIMENTATION',
  MENTORING = 'MENTORING',
  COMMUNITY = 'COMMUNITY'
}

export interface RetentionCurve {
  initial: number; // 0-1 score
  oneDay: number; // 0-1 score
  oneWeek: number; // 0-1 score
  oneMonth: number; // 0-1 score
}

export interface FlowState {
  current: FlowLevel;
  duration: number; // minutes
  triggers: FlowTrigger[];
  disruptors: FlowDisruptor[];
  recovery: FlowRecovery;
}

export enum FlowLevel {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  MODERATE = 'MODERATE',
  DEEP = 'DEEP',
  PEAK = 'PEAK'
}

export interface FlowTrigger {
  type: string;
  strength: number; // 0-1 score
  reliability: number; // 0-1 score
}

export interface FlowDisruptor {
  type: string;
  impact: number; // 0-1 score
  frequency: number;
}

export interface FlowRecovery {
  averageTime: number; // minutes
  strategies: RecoveryStrategy[];
  successRate: number; // 0-1 score
}

export interface RecoveryStrategy {
  name: string;
  effectiveness: number; // 0-1 score
  duration: number; // minutes
}

export interface DeveloperSession {
  id: string;
  startTime: Date;
  duration: number; // minutes
  activities: SessionActivity[];
  productivity: ProductivityMetrics;
  goals: SessionGoal[];
}

export interface SessionActivity {
  type: ActivityType;
  startTime: Date;
  duration: number; // minutes
  context: ActivityContext;
}

export enum ActivityType {
  CODING = 'CODING',
  DEBUGGING = 'DEBUGGING',
  TESTING = 'TESTING',
  REFACTORING = 'REFACTORING',
  DOCUMENTATION = 'DOCUMENTATION',
  RESEARCH = 'RESEARCH',
  PLANNING = 'PLANNING',
  REVIEW = 'REVIEW'
}

export interface ActivityContext {
  files: string[];
  language: string;
  complexity: ComplexityLevel;
  collaboration: boolean;
}

export enum ComplexityLevel {
  TRIVIAL = 'TRIVIAL',
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  VERY_COMPLEX = 'VERY_COMPLEX'
}

export interface ProductivityMetrics {
  linesOfCode: number;
  functionsWritten: number;
  testsWritten: number;
  bugsFixed: number;
  refactorings: number;
  focusTime: number; // minutes
  interruptionCount: number;
}

export interface SessionGoal {
  description: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number; // 0-1 score
}

export enum GoalType {
  FEATURE_IMPLEMENTATION = 'FEATURE_IMPLEMENTATION',
  BUG_FIX = 'BUG_FIX',
  REFACTORING = 'REFACTORING',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION',
  LEARNING = 'LEARNING'
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED'
}

export interface SystemContext {
  platform: PlatformType;
  resources: SystemResources;
  permissions: SystemPermissions;
  network: NetworkStatus;
  storage: StorageStatus;
  performance: PerformanceMetrics;
}

export interface SystemResources {
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkInfo;
}

export interface CPUInfo {
  cores: number;
  usage: number; // 0-1 percentage
  temperature?: number; // Celsius
  frequency: number; // MHz
}

export interface MemoryInfo {
  total: number; // bytes
  available: number; // bytes
  used: number; // bytes
  cached: number; // bytes
}

export interface DiskInfo {
  total: number; // bytes
  available: number; // bytes
  used: number; // bytes
  type: DiskType;
}

export enum DiskType {
  HDD = 'HDD',
  SSD = 'SSD',
  NVME = 'NVME',
  NETWORK = 'NETWORK',
  VIRTUAL = 'VIRTUAL'
}

export interface NetworkInfo {
  interfaces: NetworkInterface[];
  bandwidth: BandwidthInfo;
  latency: LatencyInfo;
}

export interface NetworkInterface {
  name: string;
  type: InterfaceType;
  status: InterfaceStatus;
  speed: number; // Mbps
}

export enum InterfaceType {
  ETHERNET = 'ETHERNET',
  WIFI = 'WIFI',
  CELLULAR = 'CELLULAR',
  BLUETOOTH = 'BLUETOOTH',
  VPN = 'VPN'
}

export enum InterfaceStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR'
}

export interface BandwidthInfo {
  download: number; // Mbps
  upload: number; // Mbps
  utilization: number; // 0-1 percentage
}

export interface LatencyInfo {
  average: number; // milliseconds
  minimum: number; // milliseconds
  maximum: number; // milliseconds
  jitter: number; // milliseconds
}

export interface SystemPermissions {
  fileSystem: FileSystemPermissions;
  network: NetworkPermissions;
  system: SystemLevelPermissions;
  privacy: PrivacyPermissions;
}

export interface FileSystemPermissions {
  read: string[]; // allowed paths
  write: string[]; // allowed paths
  execute: string[]; // allowed paths
  restricted: string[]; // restricted paths
}

export interface NetworkPermissions {
  outbound: boolean;
  inbound: boolean;
  domains: string[]; // allowed domains
  ports: number[]; // allowed ports
}

export interface SystemLevelPermissions {
  processManagement: boolean;
  systemCommands: boolean;
  hardwareAccess: boolean;
  environmentVariables: boolean;
}

export interface PrivacyPermissions {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  personalizedContent: boolean;
}

export interface PerformanceMetrics {
  responseTime: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  reliability: ReliabilityMetrics;
  efficiency: EfficiencyMetrics;
}

export interface ResponseTimeMetrics {
  average: number; // milliseconds
  p50: number; // milliseconds
  p95: number; // milliseconds
  p99: number; // milliseconds
}

export interface ThroughputMetrics {
  operationsPerSecond: number;
  dataProcessed: number; // bytes per second
  concurrentOperations: number;
}

export interface ReliabilityMetrics {
  uptime: number; // 0-1 percentage
  errorRate: number; // 0-1 percentage
  crashCount: number;
  recoveryTime: number; // seconds
}

export interface EfficiencyMetrics {
  cpuEfficiency: number; // 0-1 score
  memoryEfficiency: number; // 0-1 score
  energyEfficiency: number; // 0-1 score
  resourceUtilization: number; // 0-1 score
}

export interface SessionContext {
  id: string;
  startTime: Date;
  platform: PlatformType;
  user: UserInfo;
  workspace: WorkspaceInfo;
  state: SessionState;
}

export interface UserInfo {
  id: string;
  name?: string;
  email?: string;
  preferences: DeveloperPreferences;
  subscription: SubscriptionInfo;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  features: string[];
  expiresAt?: Date;
  usage: UsageMetrics;
}

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export interface UsageMetrics {
  apiCalls: number;
  storageUsed: number; // bytes
  computeTime: number; // minutes
  features: FeatureUsage[];
}

export interface FeatureUsage {
  name: string;
  count: number;
  lastUsed: Date;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  projects: ProjectInfo[];
  settings: WorkspaceSettings;
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  status: ProjectStatus;
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  ERROR = 'ERROR'
}

export interface WorkspaceSettings {
  theme: ThemePreference;
  layout: LayoutPreference;
  extensions: ExtensionInfo[];
  shortcuts: ShortcutMapping[];
}

export interface LayoutPreference {
  sidebarPosition: SidebarPosition;
  panelPosition: PanelPosition;
  tabLayout: TabLayout;
  splitView: SplitViewConfig;
}

export enum SidebarPosition {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  HIDDEN = 'HIDDEN'
}

export enum PanelPosition {
  BOTTOM = 'BOTTOM',
  RIGHT = 'RIGHT',
  HIDDEN = 'HIDDEN'
}

export enum TabLayout {
  SINGLE_ROW = 'SINGLE_ROW',
  MULTI_ROW = 'MULTI_ROW',
  SCROLLABLE = 'SCROLLABLE'
}

export interface SplitViewConfig {
  enabled: boolean;
  orientation: SplitOrientation;
  ratio: number; // 0-1
}

export enum SplitOrientation {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL'
}

export interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface ShortcutMapping {
  command: string;
  keys: string[];
  context: string;
  description: string;
}

export interface SessionState {
  openFiles: OpenFileInfo[];
  activeFile?: string;
  cursorPositions: Record<string, Position>;
  selections: Record<string, Range>;
  history: HistoryEntry[];
}

export interface OpenFileInfo {
  path: string;
  modified: boolean;
  pinned: boolean;
  preview: boolean;
}

export interface HistoryEntry {
  timestamp: Date;
  action: HistoryAction;
  context: HistoryContext;
  reversible: boolean;
}

export enum HistoryAction {
  FILE_OPEN = 'FILE_OPEN',
  FILE_CLOSE = 'FILE_CLOSE',
  FILE_SAVE = 'FILE_SAVE',
  TEXT_EDIT = 'TEXT_EDIT',
  REFACTOR = 'REFACTOR',
  NAVIGATION = 'NAVIGATION'
}

export interface HistoryContext {
  file?: string;
  position?: Position;
  selection?: Range;
  data?: any;
}

// Unified Observer Types
export interface UnifiedObserverContext {
  platform: PlatformType;
  capabilities: ObserverCapabilities;
  environment: ObserverEnvironment;
  configuration: ObserverConfiguration;
}

export interface ObserverCapabilities {
  backgroundProcessing: boolean;
  realTimeAnalysis: boolean;
  crossFileAnalysis: boolean;
  systemIntegration: boolean;
  networkAccess: boolean;
  persistentStorage: boolean;
}

export interface ObserverEnvironment {
  type: EnvironmentType;
  resources: EnvironmentResources;
  constraints: EnvironmentConstraints;
  communication: CommunicationChannel;
}

export enum EnvironmentType {
  WEB_WORKER = 'WEB_WORKER',
  MAIN_THREAD = 'MAIN_THREAD',
  CHILD_PROCESS = 'CHILD_PROCESS',
  SEPARATE_THREAD = 'SEPARATE_THREAD'
}

export interface EnvironmentResources {
  memory: number; // bytes
  cpu: number; // percentage
  storage: number; // bytes
  network: number; // bytes per second
}

export interface EnvironmentConstraints {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  allowedOperations: string[];
  restrictedAPIs: string[];
}

export interface CommunicationChannel {
  type: ChannelType;
  protocol: CommunicationProtocol;
  serialization: SerializationFormat;
  compression: boolean;
}

export enum ChannelType {
  MESSAGE_PASSING = 'MESSAGE_PASSING',
  SHARED_MEMORY = 'SHARED_MEMORY',
  IPC = 'IPC',
  NETWORK = 'NETWORK'
}

export enum CommunicationProtocol {
  JSON_RPC = 'JSON_RPC',
  BINARY = 'BINARY',
  WEBSOCKET = 'WEBSOCKET',
  HTTP = 'HTTP'
}

export enum SerializationFormat {
  JSON = 'JSON',
  MSGPACK = 'MSGPACK',
  PROTOBUF = 'PROTOBUF',
  BINARY = 'BINARY'
}

export interface ObserverConfiguration {
  sensitivity: SensitivityLevel;
  frequency: AnalysisFrequency;
  scope: AnalysisScope;
  filters: AnalysisFilter[];
}

export enum SensitivityLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  MAXIMUM = 'MAXIMUM'
}

export enum AnalysisFrequency {
  REAL_TIME = 'REAL_TIME',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  ON_DEMAND = 'ON_DEMAND'
}

export interface AnalysisScope {
  files: ScopeFilter;
  functions: ScopeFilter;
  dependencies: ScopeFilter;
  timeRange: TimeRangeFilter;
}

export interface ScopeFilter {
  include: string[];
  exclude: string[];
  patterns: string[];
}

export interface TimeRangeFilter {
  start?: Date;
  end?: Date;
  duration?: number; // milliseconds
}

export interface AnalysisFilter {
  type: FilterType;
  condition: string;
  action: FilterAction;
}

export enum FilterType {
  FILE_TYPE = 'FILE_TYPE',
  FILE_SIZE = 'FILE_SIZE',
  COMPLEXITY = 'COMPLEXITY',
  LANGUAGE = 'LANGUAGE',
  PATTERN = 'PATTERN'
}

export enum FilterAction {
  INCLUDE = 'INCLUDE',
  EXCLUDE = 'EXCLUDE',
  PRIORITIZE = 'PRIORITIZE',
  DEPRIORITIZE = 'DEPRIORITIZE'
}

// Unified Whisper Types
export interface UnifiedWhisper {
  id: string;
  type: WhisperType;
  content: WhisperContent;
  metadata: WhisperMetadata;
  delivery: WhisperDelivery;
  interaction: WhisperInteraction;
}

export enum WhisperType {
  PATTERN_HARMONY = 'PATTERN_HARMONY',
  COMPUTATIONAL_POETRY = 'COMPUTATIONAL_POETRY',
  COSMIC_CONNECTION = 'COSMIC_CONNECTION',
  OPTIMIZATION_SUGGESTION = 'OPTIMIZATION_SUGGESTION',
  ARCHITECTURAL_INSIGHT = 'ARCHITECTURAL_INSIGHT'
}

export interface WhisperContent {
  title: string;
  message: string;
  code?: CodeSuggestion;
  visualization?: VisualizationData;
  references: Reference[];
}

export interface CodeSuggestion {
  original: string;
  suggested: string;
  explanation: string;
  benefits: string[];
  tradeoffs: string[];
}

export interface VisualizationData {
  type: VisualizationType;
  data: any;
  config: VisualizationConfig;
}

export enum VisualizationType {
  GRAPH = 'GRAPH',
  CHART = 'CHART',
  DIAGRAM = 'DIAGRAM',
  HEATMAP = 'HEATMAP',
  TREE = 'TREE'
}

export interface VisualizationConfig {
  width: number;
  height: number;
  interactive: boolean;
  theme: string;
}

export interface Reference {
  type: ReferenceType;
  title: string;
  url?: string;
  description: string;
}

export enum ReferenceType {
  DOCUMENTATION = 'DOCUMENTATION',
  EXAMPLE = 'EXAMPLE',
  TUTORIAL = 'TUTORIAL',
  BEST_PRACTICE = 'BEST_PRACTICE',
  RESEARCH_PAPER = 'RESEARCH_PAPER'
}

export interface WhisperMetadata {
  observer: string;
  confidence: number; // 0-1 score
  priority: WhisperPriority;
  category: WhisperCategory;
  tags: string[];
  timestamp: Date;
}

export enum WhisperPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum WhisperCategory {
  PERFORMANCE = 'PERFORMANCE',
  MAINTAINABILITY = 'MAINTAINABILITY',
  SECURITY = 'SECURITY',
  BEST_PRACTICE = 'BEST_PRACTICE',
  LEARNING = 'LEARNING'
}

export interface WhisperDelivery {
  timing: DeliveryTiming;
  presentation: PresentationStyle;
  persistence: PersistenceConfig;
  platform: PlatformDeliveryConfig;
}

export interface DeliveryTiming {
  strategy: TimingStrategy;
  delay: number; // milliseconds
  conditions: DeliveryCondition[];
}

export enum TimingStrategy {
  IMMEDIATE = 'IMMEDIATE',
  NEXT_PAUSE = 'NEXT_PAUSE',
  END_OF_TASK = 'END_OF_TASK',
  SCHEDULED = 'SCHEDULED',
  CONTEXTUAL = 'CONTEXTUAL'
}

export interface DeliveryCondition {
  type: ConditionType;
  value: any;
  operator: ComparisonOperator;
}

export enum ConditionType {
  FLOW_STATE = 'FLOW_STATE',
  ACTIVITY_TYPE = 'ACTIVITY_TYPE',
  TIME_OF_DAY = 'TIME_OF_DAY',
  FOCUS_LEVEL = 'FOCUS_LEVEL',
  ERROR_COUNT = 'ERROR_COUNT'
}

export enum ComparisonOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CONTAINS = 'CONTAINS'
}

export interface PresentationStyle {
  format: PresentationFormat;
  animation: AnimationConfig;
  styling: StylingConfig;
  accessibility: AccessibilityConfig;
}

export enum PresentationFormat {
  TOOLTIP = 'TOOLTIP',
  MODAL = 'MODAL',
  SIDEBAR = 'SIDEBAR',
  INLINE = 'INLINE',
  OVERLAY = 'OVERLAY'
}

export interface AnimationConfig {
  enabled: boolean;
  type: AnimationType;
  duration: number; // milliseconds
  easing: EasingFunction;
}

export enum AnimationType {
  FADE = 'FADE',
  SLIDE = 'SLIDE',
  SCALE = 'SCALE',
  BOUNCE = 'BOUNCE',
  NONE = 'NONE'
}

export enum EasingFunction {
  LINEAR = 'LINEAR',
  EASE_IN = 'EASE_IN',
  EASE_OUT = 'EASE_OUT',
  EASE_IN_OUT = 'EASE_IN_OUT',
  CUBIC_BEZIER = 'CUBIC_BEZIER'
}

export interface StylingConfig {
  theme: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
}

export enum FontWeight {
  LIGHT = 'LIGHT',
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
  BOLD = 'BOLD'
}

export interface SpacingConfig {
  padding: number;
  margin: number;
  borderRadius: number;
  borderWidth: number;
}

export interface AccessibilityConfig {
  screenReaderText: string;
  keyboardNavigation: boolean;
  highContrast: boolean;
  focusIndicator: boolean;
}

export interface PersistenceConfig {
  dismissible: boolean;
  autoHide: boolean;
  hideDelay: number; // milliseconds
  rememberChoice: boolean;
}

export interface PlatformDeliveryConfig {
  web: WebDeliveryConfig;
  desktop: DesktopDeliveryConfig;
}

export interface WebDeliveryConfig {
  container: string; // CSS selector
  zIndex: number;
  responsive: boolean;
  touchOptimized: boolean;
}

export interface DesktopDeliveryConfig {
  window: WindowConfig;
  systemIntegration: SystemNotificationConfig;
}

export interface WindowConfig {
  modal: boolean;
  resizable: boolean;
  minimizable: boolean;
  alwaysOnTop: boolean;
}

export interface SystemNotificationConfig {
  enabled: boolean;
  icon: string;
  sound: boolean;
  actionButtons: ActionButton[];
}

export interface ActionButton {
  label: string;
  action: string;
  primary: boolean;
}

export interface WhisperInteraction {
  actions: WhisperAction[];
  feedback: FeedbackConfig;
  analytics: AnalyticsConfig;
}

export interface WhisperAction {
  id: string;
  label: string;
  type: ActionType;
  handler: string;
  confirmation: boolean;
}

export enum ActionType {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  MODIFY = 'MODIFY',
  LEARN_MORE = 'LEARN_MORE',
  SNOOZE = 'SNOOZE',
  NEVER_SHOW = 'NEVER_SHOW'
}

export interface FeedbackConfig {
  enabled: boolean;
  types: FeedbackType[];
  collection: FeedbackCollection;
}

export enum FeedbackType {
  RATING = 'RATING',
  COMMENT = 'COMMENT',
  CATEGORY = 'CATEGORY',
  BINARY = 'BINARY'
}

export interface FeedbackCollection {
  method: CollectionMethod;
  timing: CollectionTiming;
  optional: boolean;
}

export enum CollectionMethod {
  INLINE = 'INLINE',
  POPUP = 'POPUP',
  BACKGROUND = 'BACKGROUND',
  DELAYED = 'DELAYED'
}

export enum CollectionTiming {
  IMMEDIATE = 'IMMEDIATE',
  ON_ACTION = 'ON_ACTION',
  SESSION_END = 'SESSION_END',
  PERIODIC = 'PERIODIC'
}

export interface AnalyticsConfig {
  enabled: boolean;
  events: AnalyticsEvent[];
  privacy: AnalyticsPrivacy;
}

export interface AnalyticsEvent {
  name: string;
  properties: string[];
  sensitive: boolean;
}

export interface AnalyticsPrivacy {
  anonymize: boolean;
  retention: number; // days
  consent: boolean;
}

// Unified Error Handling Types
export interface UnifiedError {
  id: string;
  type: UnifiedErrorType;
  severity: ErrorSeverity;
  context: UnifiedErrorContext;
  recovery: UnifiedRecoveryStrategy;
  platform: PlatformType;
}

export enum UnifiedErrorType {
  PLATFORM_SPECIFIC = 'PLATFORM_SPECIFIC',
  CROSS_PLATFORM = 'CROSS_PLATFORM',
  OBSERVER_ERROR = 'OBSERVER_ERROR',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface UnifiedErrorContext {
  platform: PlatformType;
  component: string;
  operation: string;
  timestamp: Date;
  stackTrace: string[];
  environment: EnvironmentInfo;
}

export interface EnvironmentInfo {
  version: string;
  configuration: Record<string, any>;
  resources: ResourceSnapshot;
  dependencies: DependencySnapshot[];
}

export interface ResourceSnapshot {
  memory: number; // bytes
  cpu: number; // percentage
  disk: number; // bytes
  network: number; // bytes per second
}

export interface DependencySnapshot {
  name: string;
  version: string;
  status: DependencyStatus;
}

export interface UnifiedRecoveryStrategy {
  automatic: AutomaticRecovery;
  manual: ManualRecovery;
  fallback: FallbackStrategy;
  prevention: PreventionStrategy;
}

export interface AutomaticRecovery {
  enabled: boolean;
  strategies: RecoveryStep[];
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
}

export interface RecoveryStep {
  name: string;
  action: RecoveryAction;
  condition: RecoveryCondition;
  timeout: number; // milliseconds
}

export interface RecoveryAction {
  type: RecoveryActionType;
  parameters: Record<string, any>;
  rollback: boolean;
}

export enum RecoveryActionType {
  RESTART_COMPONENT = 'RESTART_COMPONENT',
  CLEAR_CACHE = 'CLEAR_CACHE',
  RESET_CONFIGURATION = 'RESET_CONFIGURATION',
  FALLBACK_MODE = 'FALLBACK_MODE',
  RESOURCE_CLEANUP = 'RESOURCE_CLEANUP'
}

export interface RecoveryCondition {
  type: ConditionType;
  value: any;
  timeout: number; // milliseconds
}

export interface ManualRecovery {
  instructions: RecoveryInstruction[];
  diagnostics: DiagnosticStep[];
  support: SupportInfo;
}

export interface RecoveryInstruction {
  step: number;
  description: string;
  action: string;
  verification: string;
}

export interface DiagnosticStep {
  name: string;
  command: string;
  expectedOutput: string;
  troubleshooting: string;
}

export interface SupportInfo {
  documentation: string;
  community: string;
  contact: string;
  bugReport: string;
}

export interface FallbackStrategy {
  enabled: boolean;
  mode: FallbackMode;
  limitations: string[];
  restoration: RestorationStrategy;
}

export enum FallbackMode {
  REDUCED_FUNCTIONALITY = 'REDUCED_FUNCTIONALITY',
  SAFE_MODE = 'SAFE_MODE',
  READ_ONLY = 'READ_ONLY',
  OFFLINE = 'OFFLINE'
}

export interface RestorationStrategy {
  automatic: boolean;
  triggers: RestorationTrigger[];
  validation: ValidationStep[];
}

export interface RestorationTrigger {
  condition: string;
  threshold: number;
  delay: number; // milliseconds
}

export interface ValidationStep {
  name: string;
  test: string;
  expected: any;
  critical: boolean;
}

export interface PreventionStrategy {
  monitoring: MonitoringConfig;
  alerts: AlertConfig[];
  maintenance: MaintenanceConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MonitoringMetric[];
  frequency: number; // seconds
  retention: number; // days
}

export interface MonitoringMetric {
  name: string;
  type: MetricType;
  threshold: MetricThreshold;
  action: MonitoringAction;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
}

export interface MonitoringAction {
  type: ActionType;
  parameters: Record<string, any>;
  notification: boolean;
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: AlertSeverity;
  notification: NotificationConfig;
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  template: string;
  throttling: ThrottlingConfig;
}

export interface NotificationChannel {
  type: ChannelType;
  config: Record<string, any>;
  enabled: boolean;
}

export interface MaintenanceConfig {
  scheduled: ScheduledMaintenance[];
  automatic: AutomaticMaintenance;
  manual: ManualMaintenance;
}

export interface ScheduledMaintenance {
  name: string;
  schedule: CronExpression;
  tasks: MaintenanceTask[];
  window: MaintenanceWindow;
}

export type CronExpression = string;

export interface MaintenanceTask {
  name: string;
  type: TaskType;
  parameters: Record<string, any>;
  timeout: number; // milliseconds
}

export enum TaskType {
  CLEANUP = 'CLEANUP',
  OPTIMIZATION = 'OPTIMIZATION',
  BACKUP = 'BACKUP',
  UPDATE = 'UPDATE',
  VALIDATION = 'VALIDATION'
}

export interface MaintenanceWindow {
  start: string; // HH:MM format
  duration: number; // minutes
  timezone: string;
}

export interface AutomaticMaintenance {
  enabled: boolean;
  triggers: MaintenanceTrigger[];
  tasks: MaintenanceTask[];
}

export interface MaintenanceTrigger {
  type: TriggerType;
  condition: string;
  threshold: number;
}

export interface ManualMaintenance {
  procedures: MaintenanceProcedure[];
  tools: MaintenanceTool[];
  documentation: string;
}

export interface MaintenanceProcedure {
  name: string;
  description: string;
  steps: ProcedureStep[];
  frequency: MaintenanceFrequency;
}

export interface ProcedureStep {
  order: number;
  description: string;
  command?: string;
  verification: string;
}

export enum MaintenanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  AS_NEEDED = 'AS_NEEDED'
}

export interface MaintenanceTool {
  name: string;
  purpose: string;
  command: string;
  documentation: string;
}

// Additional type definitions referenced in the unified types
export interface NetworkStatus {
  online: boolean;
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // milliseconds
}

export interface StorageStatus {
  available: number; // bytes
  used: number; // bytes
  quota: number; // bytes
  persistent: boolean;
}

export enum MetricType {
  PERFORMANCE = 'PERFORMANCE',
  ACCURACY = 'ACCURACY',
  USER_SATISFACTION = 'USER_SATISFACTION',
  ERROR_RATE = 'ERROR_RATE',
  RESOURCE_USAGE = 'RESOURCE_USAGE'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}