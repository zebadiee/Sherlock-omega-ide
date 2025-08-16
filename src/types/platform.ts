/**
 * Platform-Specific Type Definitions
 * Types that vary between web and desktop implementations
 */

// Platform Detection and Capabilities
export enum PlatformType {
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
  HYBRID = 'HYBRID'
}

export interface PlatformCapabilities {
  type: PlatformType;
  fileSystem: FileSystemCapabilities;
  storage: StorageCapabilities;
  processing: ProcessingCapabilities;
  ui: UICapabilities;
  network: NetworkCapabilities;
  system: SystemCapabilities;
}

export interface FileSystemCapabilities {
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canWatchFiles: boolean;
  canExecuteCommands: boolean;
  canAccessSystemPaths: boolean;
  supportedOperations: FileOperation[];
  maxFileSize: number; // bytes
  supportedFormats: string[];
}

export enum FileOperation {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  RENAME = 'RENAME',
  COPY = 'COPY',
  MOVE = 'MOVE',
  WATCH = 'WATCH',
  EXECUTE = 'EXECUTE'
}

export interface StorageCapabilities {
  persistent: boolean;
  maxSize: number; // bytes
  quotaManaged: boolean;
  supportedTypes: StorageType[];
  encryption: boolean;
  compression: boolean;
}

export enum StorageType {
  LOCAL_STORAGE = 'LOCAL_STORAGE',
  SESSION_STORAGE = 'SESSION_STORAGE',
  INDEXED_DB = 'INDEXED_DB',
  FILE_SYSTEM = 'FILE_SYSTEM',
  DATABASE = 'DATABASE',
  MEMORY = 'MEMORY'
}

export interface ProcessingCapabilities {
  multiThreading: boolean;
  webWorkers: boolean;
  childProcesses: boolean;
  maxConcurrency: number;
  backgroundProcessing: boolean;
  resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
  maxMemory: number; // bytes
  maxCpuTime: number; // milliseconds
  maxNetworkRequests: number;
  maxFileHandles: number;
}

export interface UICapabilities {
  framework: UIFramework;
  nativeIntegration: boolean;
  customStyling: boolean;
  animations: boolean;
  notifications: NotificationCapabilities;
  accessibility: AccessibilityCapabilities;
}

export enum UIFramework {
  REACT = 'REACT',
  ELECTRON = 'ELECTRON',
  NATIVE = 'NATIVE',
  WEB_COMPONENTS = 'WEB_COMPONENTS',
  TERMINAL = 'TERMINAL'
}

export interface NotificationCapabilities {
  toast: boolean;
  system: boolean;
  persistent: boolean;
  interactive: boolean;
  scheduling: boolean;
}

export interface AccessibilityCapabilities {
  screenReader: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
  customization: boolean;
}

export interface NetworkCapabilities {
  httpRequests: boolean;
  websockets: boolean;
  cors: boolean;
  proxy: boolean;
  offline: boolean;
  rateLimiting: RateLimitingCapabilities;
}

export interface RateLimitingCapabilities {
  requestsPerSecond: number;
  burstLimit: number;
  backoffStrategy: BackoffStrategy;
}

export enum BackoffStrategy {
  LINEAR = 'LINEAR',
  EXPONENTIAL = 'EXPONENTIAL',
  FIXED = 'FIXED',
  ADAPTIVE = 'ADAPTIVE'
}

export interface SystemCapabilities {
  osIntegration: boolean;
  environmentVariables: boolean;
  processManagement: boolean;
  systemCommands: boolean;
  hardwareAccess: boolean;
  permissions: PermissionLevel;
}

export enum PermissionLevel {
  NONE = 'NONE',
  LIMITED = 'LIMITED',
  STANDARD = 'STANDARD',
  ELEVATED = 'ELEVATED',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

// Platform-Specific Editor Types
export interface WebEditorConfig {
  monacoVersion: string;
  theme: MonacoTheme;
  workers: WorkerConfig;
  extensions: WebExtension[];
  performance: WebPerformanceConfig;
}

export interface MonacoTheme {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: ThemeRule[];
  colors: Record<string, string>;
}

export interface ThemeRule {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface WorkerConfig {
  enabled: boolean;
  maxWorkers: number;
  workerPaths: Record<string, string>;
  fallbackToMainThread: boolean;
}

export interface WebExtension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface WebPerformanceConfig {
  lazyLoading: boolean;
  codeMinification: boolean;
  assetOptimization: boolean;
  caching: CachingConfig;
}

export interface CachingConfig {
  enabled: boolean;
  strategy: CacheStrategy;
  maxSize: number; // bytes
  ttl: number; // seconds
}

export enum CacheStrategy {
  CACHE_FIRST = 'CACHE_FIRST',
  NETWORK_FIRST = 'NETWORK_FIRST',
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE',
  NETWORK_ONLY = 'NETWORK_ONLY',
  CACHE_ONLY = 'CACHE_ONLY'
}

export interface DesktopEditorConfig {
  nativeFramework: NativeFramework;
  systemIntegration: SystemIntegrationConfig;
  performance: DesktopPerformanceConfig;
  security: SecurityConfig;
}

export enum NativeFramework {
  ELECTRON = 'ELECTRON',
  TAURI = 'TAURI',
  NATIVE_CPP = 'NATIVE_CPP',
  NATIVE_RUST = 'NATIVE_RUST',
  NATIVE_GO = 'NATIVE_GO'
}

export interface SystemIntegrationConfig {
  fileAssociations: FileAssociation[];
  contextMenus: boolean;
  systemTray: boolean;
  autoStart: boolean;
  urlProtocols: string[];
}

export interface FileAssociation {
  extension: string;
  description: string;
  icon?: string;
  defaultAction: string;
}

export interface DesktopPerformanceConfig {
  multiProcessing: boolean;
  hardwareAcceleration: boolean;
  memoryOptimization: boolean;
  diskCaching: boolean;
}

export interface SecurityConfig {
  sandboxing: boolean;
  codeSignature: boolean;
  permissions: SecurityPermission[];
  encryption: EncryptionConfig;
}

export interface SecurityPermission {
  type: PermissionType;
  granted: boolean;
  reason: string;
}

export enum PermissionType {
  FILE_SYSTEM_READ = 'FILE_SYSTEM_READ',
  FILE_SYSTEM_WRITE = 'FILE_SYSTEM_WRITE',
  NETWORK_ACCESS = 'NETWORK_ACCESS',
  SYSTEM_COMMANDS = 'SYSTEM_COMMANDS',
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE',
  LOCATION = 'LOCATION'
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keyManagement: KeyManagementStrategy;
}

export enum EncryptionAlgorithm {
  AES_256 = 'AES_256',
  CHACHA20 = 'CHACHA20',
  RSA_2048 = 'RSA_2048',
  ECDSA = 'ECDSA'
}

export enum KeyManagementStrategy {
  LOCAL_KEYCHAIN = 'LOCAL_KEYCHAIN',
  SYSTEM_KEYSTORE = 'SYSTEM_KEYSTORE',
  HARDWARE_SECURITY_MODULE = 'HARDWARE_SECURITY_MODULE',
  CLOUD_KEY_MANAGEMENT = 'CLOUD_KEY_MANAGEMENT'
}

// Platform-Specific Storage Types
export interface WebStorageConfig {
  localStorage: LocalStorageConfig;
  sessionStorage: SessionStorageConfig;
  indexedDB: IndexedDBConfig;
  quotaManagement: QuotaManagementConfig;
}

export interface LocalStorageConfig {
  enabled: boolean;
  maxSize: number; // bytes
  compression: boolean;
  encryption: boolean;
  keyPrefix: string;
}

export interface SessionStorageConfig {
  enabled: boolean;
  maxSize: number; // bytes
  autoCleanup: boolean;
  keyPrefix: string;
}

export interface IndexedDBConfig {
  enabled: boolean;
  databaseName: string;
  version: number;
  stores: IndexedDBStore[];
  maxSize: number; // bytes
}

export interface IndexedDBStore {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: IndexedDBIndex[];
}

export interface IndexedDBIndex {
  name: string;
  keyPath: string;
  unique: boolean;
  multiEntry: boolean;
}

export interface QuotaManagementConfig {
  enabled: boolean;
  warningThreshold: number; // percentage
  cleanupStrategy: CleanupStrategy;
  userNotification: boolean;
}

export enum CleanupStrategy {
  OLDEST_FIRST = 'OLDEST_FIRST',
  LEAST_USED = 'LEAST_USED',
  LARGEST_FIRST = 'LARGEST_FIRST',
  USER_CHOICE = 'USER_CHOICE'
}

export interface DesktopStorageConfig {
  fileSystem: FileSystemStorageConfig;
  database: DatabaseConfig;
  backup: BackupConfig;
  synchronization: SynchronizationConfig;
}

export interface FileSystemStorageConfig {
  basePath: string;
  structure: DirectoryStructure;
  permissions: FilePermissions;
  compression: boolean;
  encryption: boolean;
}

export interface DirectoryStructure {
  config: string;
  data: string;
  cache: string;
  logs: string;
  temp: string;
  backup: string;
}

export interface FilePermissions {
  owner: PermissionSet;
  group: PermissionSet;
  others: PermissionSet;
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface DatabaseConfig {
  type: DatabaseType;
  connectionString: string;
  poolSize: number;
  timeout: number; // milliseconds
  encryption: boolean;
}

export enum DatabaseType {
  SQLITE = 'SQLITE',
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  LEVELDB = 'LEVELDB'
}

export interface BackupConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  location: BackupLocation;
}

export enum BackupFrequency {
  REAL_TIME = 'REAL_TIME',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface BackupLocation {
  type: BackupLocationType;
  path: string;
  credentials?: BackupCredentials;
}

export enum BackupLocationType {
  LOCAL_DIRECTORY = 'LOCAL_DIRECTORY',
  NETWORK_DRIVE = 'NETWORK_DRIVE',
  CLOUD_STORAGE = 'CLOUD_STORAGE',
  EXTERNAL_DEVICE = 'EXTERNAL_DEVICE'
}

export interface BackupCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
}

export interface SynchronizationConfig {
  enabled: boolean;
  strategy: SyncStrategy;
  conflictResolution: ConflictResolution;
  endpoints: SyncEndpoint[];
}

export enum SyncStrategy {
  REAL_TIME = 'REAL_TIME',
  PERIODIC = 'PERIODIC',
  ON_DEMAND = 'ON_DEMAND',
  EVENT_DRIVEN = 'EVENT_DRIVEN'
}

export enum ConflictResolution {
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  TIMESTAMP_WINS = 'TIMESTAMP_WINS',
  USER_CHOICE = 'USER_CHOICE',
  MERGE = 'MERGE'
}

export interface SyncEndpoint {
  id: string;
  url: string;
  authentication: AuthenticationConfig;
  priority: number;
  enabled: boolean;
}

export interface AuthenticationConfig {
  type: AuthenticationType;
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: Date;
}

export enum AuthenticationType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  BEARER_TOKEN = 'BEARER_TOKEN',
  OAUTH2 = 'OAUTH2',
  API_KEY = 'API_KEY',
  CERTIFICATE = 'CERTIFICATE'
}

// Platform-Specific Observer Types
export interface WebObserverConfig {
  workers: WebWorkerConfig;
  performance: WebObserverPerformance;
  fallback: FallbackConfig;
  communication: WebCommunicationConfig;
}

export interface WebWorkerConfig {
  enabled: boolean;
  maxWorkers: number;
  workerTimeout: number; // milliseconds
  memoryLimit: number; // bytes
  scriptPaths: Record<string, string>;
}

export interface WebObserverPerformance {
  analysisInterval: number; // milliseconds
  batchSize: number;
  throttling: ThrottlingConfig;
  optimization: WebOptimizationConfig;
}

export interface ThrottlingConfig {
  enabled: boolean;
  maxOperationsPerSecond: number;
  burstLimit: number;
  cooldownPeriod: number; // milliseconds
}

export interface WebOptimizationConfig {
  lazyAnalysis: boolean;
  incrementalUpdates: boolean;
  caching: boolean;
  compression: boolean;
}

export interface FallbackConfig {
  enabled: boolean;
  triggers: FallbackTrigger[];
  degradedMode: DegradedModeConfig;
}

export interface FallbackTrigger {
  condition: FallbackCondition;
  threshold: number;
  action: FallbackAction;
}

export enum FallbackCondition {
  WORKER_FAILURE = 'WORKER_FAILURE',
  MEMORY_LIMIT = 'MEMORY_LIMIT',
  TIMEOUT = 'TIMEOUT',
  ERROR_RATE = 'ERROR_RATE'
}

export enum FallbackAction {
  DISABLE_OBSERVER = 'DISABLE_OBSERVER',
  REDUCE_FREQUENCY = 'REDUCE_FREQUENCY',
  MAIN_THREAD_PROCESSING = 'MAIN_THREAD_PROCESSING',
  SIMPLIFIED_ANALYSIS = 'SIMPLIFIED_ANALYSIS'
}

export interface DegradedModeConfig {
  analysisDepth: AnalysisDepth;
  updateFrequency: number; // milliseconds
  featureDisabling: string[];
}

export enum AnalysisDepth {
  MINIMAL = 'MINIMAL',
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  COMPREHENSIVE = 'COMPREHENSIVE'
}

export interface WebCommunicationConfig {
  messageFormat: MessageFormat;
  serialization: SerializationConfig;
  errorHandling: ErrorHandlingConfig;
}

export enum MessageFormat {
  JSON = 'JSON',
  BINARY = 'BINARY',
  COMPRESSED_JSON = 'COMPRESSED_JSON',
  PROTOBUF = 'PROTOBUF'
}

export interface SerializationConfig {
  format: SerializationFormat;
  compression: boolean;
  encryption: boolean;
}

export enum SerializationFormat {
  JSON = 'JSON',
  MSGPACK = 'MSGPACK',
  PROTOBUF = 'PROTOBUF',
  AVRO = 'AVRO'
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number; // milliseconds
  circuitBreaker: CircuitBreakerConfig;
  logging: LoggingConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface LoggingConfig {
  level: LogLevel;
  destination: LogDestination;
  format: LogFormat;
  retention: number; // days
}

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogDestination {
  CONSOLE = 'CONSOLE',
  LOCAL_STORAGE = 'LOCAL_STORAGE',
  INDEXED_DB = 'INDEXED_DB',
  REMOTE_SERVICE = 'REMOTE_SERVICE'
}

export enum LogFormat {
  PLAIN = 'PLAIN',
  JSON = 'JSON',
  STRUCTURED = 'STRUCTURED'
}

export interface DesktopObserverConfig {
  processes: ProcessConfig;
  performance: DesktopObserverPerformance;
  systemIntegration: ObserverSystemIntegration;
  communication: DesktopCommunicationConfig;
}

export interface ProcessConfig {
  enabled: boolean;
  maxProcesses: number;
  processTimeout: number; // milliseconds
  memoryLimit: number; // bytes
  cpuLimit: number; // percentage
}

export interface DesktopObserverPerformance {
  analysisInterval: number; // milliseconds
  batchSize: number;
  parallelization: ParallelizationConfig;
  optimization: DesktopOptimizationConfig;
}

export interface ParallelizationConfig {
  enabled: boolean;
  maxThreads: number;
  workStealing: boolean;
  loadBalancing: LoadBalancingStrategy;
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  LEAST_LOADED = 'LEAST_LOADED',
  RANDOM = 'RANDOM',
  WEIGHTED = 'WEIGHTED'
}

export interface DesktopOptimizationConfig {
  nativeLibraries: boolean;
  hardwareAcceleration: boolean;
  memoryMapping: boolean;
  diskCaching: boolean;
}

export interface ObserverSystemIntegration {
  fileWatching: FileWatchingConfig;
  processMonitoring: ProcessMonitoringConfig;
  networkMonitoring: NetworkMonitoringConfig;
}

export interface FileWatchingConfig {
  enabled: boolean;
  recursive: boolean;
  filters: string[];
  debounceTime: number; // milliseconds
}

export interface ProcessMonitoringConfig {
  enabled: boolean;
  targetProcesses: string[];
  metrics: ProcessMetric[];
  alertThresholds: Record<string, number>;
}

export enum ProcessMetric {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  DISK_IO = 'DISK_IO',
  NETWORK_IO = 'NETWORK_IO',
  THREAD_COUNT = 'THREAD_COUNT'
}

export interface NetworkMonitoringConfig {
  enabled: boolean;
  interfaces: string[];
  protocols: NetworkProtocol[];
  trafficAnalysis: boolean;
}

export enum NetworkProtocol {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  WEBSOCKET = 'WEBSOCKET',
  TCP = 'TCP',
  UDP = 'UDP'
}

export interface DesktopCommunicationConfig {
  ipc: IPCConfig;
  networking: NetworkingConfig;
  serialization: SerializationConfig;
}

export interface IPCConfig {
  mechanism: IPCMechanism;
  bufferSize: number; // bytes
  timeout: number; // milliseconds
  compression: boolean;
}

export enum IPCMechanism {
  PIPES = 'PIPES',
  SOCKETS = 'SOCKETS',
  SHARED_MEMORY = 'SHARED_MEMORY',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE'
}

export interface NetworkingConfig {
  bindAddress: string;
  port: number;
  ssl: SSLConfig;
  compression: boolean;
}

export interface SSLConfig {
  enabled: boolean;
  certificatePath: string;
  privateKeyPath: string;
  cipherSuites: string[];
}

// Platform-Specific Error Types
export interface WebError extends Error {
  type: WebErrorType;
  context: WebErrorContext;
  recovery: WebRecoveryStrategy;
}

export enum WebErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  WORKER_FAILURE = 'WORKER_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY'
}

export interface WebErrorContext {
  browser: BrowserInfo;
  storage: StorageStatus;
  network: NetworkStatus;
  permissions: PermissionStatus[];
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
}

export interface StorageStatus {
  available: number; // bytes
  used: number; // bytes
  quota: number; // bytes
  persistent: boolean;
}

export interface NetworkStatus {
  online: boolean;
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // milliseconds
}

export interface PermissionStatus {
  name: string;
  state: PermissionState;
}

export enum PermissionState {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  PROMPT = 'PROMPT'
}

export interface WebRecoveryStrategy {
  type: WebRecoveryType;
  actions: WebRecoveryAction[];
  fallback: WebFallbackStrategy;
}

export enum WebRecoveryType {
  AUTOMATIC = 'AUTOMATIC',
  USER_INTERVENTION = 'USER_INTERVENTION',
  GRACEFUL_DEGRADATION = 'GRACEFUL_DEGRADATION',
  FEATURE_DISABLE = 'FEATURE_DISABLE'
}

export interface WebRecoveryAction {
  description: string;
  action: () => Promise<void>;
  priority: number;
  userVisible: boolean;
}

export interface WebFallbackStrategy {
  disableFeatures: string[];
  alternativeImplementation?: string;
  userNotification: string;
}

export interface DesktopError extends Error {
  type: DesktopErrorType;
  context: DesktopErrorContext;
  recovery: DesktopRecoveryStrategy;
}

export enum DesktopErrorType {
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  PROCESS_ERROR = 'PROCESS_ERROR',
  SYSTEM_RESOURCE_ERROR = 'SYSTEM_RESOURCE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface DesktopErrorContext {
  system: SystemInfo;
  process: ProcessInfo;
  resources: ResourceInfo;
  permissions: SystemPermissionInfo[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  hostname: string;
  uptime: number; // seconds
}

export interface ProcessInfo {
  pid: number;
  ppid: number;
  memory: ProcessMemoryInfo;
  cpu: ProcessCPUInfo;
}

export interface ProcessMemoryInfo {
  rss: number; // bytes
  heapTotal: number; // bytes
  heapUsed: number; // bytes
  external: number; // bytes
}

export interface ProcessCPUInfo {
  user: number; // microseconds
  system: number; // microseconds
}

export interface ResourceInfo {
  memory: SystemMemoryInfo;
  disk: DiskInfo[];
  network: NetworkInterfaceInfo[];
}

export interface SystemMemoryInfo {
  total: number; // bytes
  free: number; // bytes
  available: number; // bytes
  used: number; // bytes
}

export interface DiskInfo {
  filesystem: string;
  size: number; // bytes
  used: number; // bytes
  available: number; // bytes
  mountpoint: string;
}

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
}

export interface SystemPermissionInfo {
  resource: string;
  permission: string;
  granted: boolean;
  reason?: string;
}

export interface DesktopRecoveryStrategy {
  type: DesktopRecoveryType;
  actions: DesktopRecoveryAction[];
  fallback: DesktopFallbackStrategy;
}

export enum DesktopRecoveryType {
  AUTOMATIC = 'AUTOMATIC',
  ELEVATED_PERMISSIONS = 'ELEVATED_PERMISSIONS',
  ALTERNATIVE_PATH = 'ALTERNATIVE_PATH',
  SYSTEM_REPAIR = 'SYSTEM_REPAIR'
}

export interface DesktopRecoveryAction {
  description: string;
  action: () => Promise<void>;
  requiresElevation: boolean;
  systemImpact: SystemImpactLevel;
}

export enum SystemImpactLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface DesktopFallbackStrategy {
  alternativeImplementation?: string;
  reducedFunctionality: string[];
  userGuidance: string;
  supportContact?: string;
}