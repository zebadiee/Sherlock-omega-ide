/**
 * Platform Abstraction Interfaces
 * Defines contracts for cross-platform functionality
 */

import { PlatformType, WhisperingObserver, ObservationContext } from './whispering-interfaces';

// Platform Adapter Interface
export interface PlatformAdapter {
  type: PlatformType;
  
  // UI Management
  createEditor(): Promise<EditorInstance>;
  createFileExplorer(): Promise<FileExplorerInstance>;
  createTerminal(): Promise<TerminalInstance>;
  createWhisperingHUD(): Promise<WhisperingHUDInstance>;
  
  // System Integration
  getFileSystem(): FileSystemAbstraction;
  getStorage(): StorageManager;
  getGitHubClient(): GitHubClient;
  getNotificationManager(): NotificationManager;
  
  // Observer Management
  createObserverEnvironment(): Promise<ObserverEnvironment>;
  
  // Performance Optimization
  optimizeForPlatform(): Promise<void>;
  getCapabilities(): PlatformCapabilities;
}

// Editor Abstraction
export interface EditorInstance {
  type: 'monaco' | 'native' | 'terminal';
  
  // Content Management
  getValue(): string;
  setValue(content: string): void;
  getSelection(): Range | null;
  setSelection(range: Range): void;
  
  // Event Handling
  onDidChangeContent(callback: (event: ContentChangeEvent) => void): void;
  onDidChangeCursorPosition(callback: (event: CursorChangeEvent) => void): void;
  onDidChangeSelection(callback: (event: SelectionChangeEvent) => void): void;
  
  // Whispering Integration
  showWhisper(suggestion: WhisperSuggestion): Promise<void>;
  hideWhisper(whisperId: string): Promise<void>;
  registerSuggestionProvider(provider: SuggestionProvider): void;
  
  // Platform-specific
  getPlatformSpecificAPI(): any;
}

export interface ContentChangeEvent {
  content: string;
  changes: ContentChange[];
  timestamp: Date;
}

export interface ContentChange {
  range: Range;
  text: string;
  rangeLength: number;
}

export interface CursorChangeEvent {
  position: Position;
  timestamp: Date;
}

export interface SelectionChangeEvent {
  selection: Range;
  timestamp: Date;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  column: number;
}

// File System Abstraction
export interface FileSystemAbstraction {
  // File Operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  
  // Directory Operations
  readDirectory(path: string): Promise<FileEntry[]>;
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  
  // Watch Operations
  watchFile(path: string, callback: (event: FileChangeEvent) => void): Promise<FileWatcher>;
  watchDirectory(path: string, callback: (event: DirectoryChangeEvent) => void): Promise<DirectoryWatcher>;
  
  // Project Operations
  getProjectRoot(): Promise<string>;
  findFiles(pattern: string): Promise<string[]>;
  
  // Platform-specific
  getPlatformPath(path: string): string;
  getCapabilities(): FileSystemCapabilities;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  permissions?: FilePermissions;
}

export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted';
  path: string;
  timestamp: Date;
}

export interface DirectoryChangeEvent {
  type: 'created' | 'modified' | 'deleted';
  path: string;
  entry: FileEntry;
  timestamp: Date;
}

export interface FileWatcher {
  dispose(): void;
}

export interface DirectoryWatcher {
  dispose(): void;
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface FileSystemCapabilities {
  canWatch: boolean;
  canExecute: boolean;
  maxFileSize: number;
  supportedEncodings: string[];
}

// Storage Manager
export interface StorageManager {
  // Key-Value Storage
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  
  // Structured Storage
  getObject<T>(collection: string, id: string): Promise<T | null>;
  setObject<T>(collection: string, id: string, value: T): Promise<void>;
  deleteObject(collection: string, id: string): Promise<void>;
  queryObjects<T>(collection: string, query: StorageQuery): Promise<T[]>;
  
  // Storage Management
  getUsage(): Promise<StorageUsage>;
  optimize(): Promise<void>;
  
  // Platform-specific
  getCapabilities(): StorageCapabilities;
}

export interface StorageQuery {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface StorageUsage {
  used: number;
  available: number;
  quota: number;
  percentage: number;
}

export interface StorageCapabilities {
  maxItemSize: number;
  maxTotalSize: number;
  supportsIndexing: boolean;
  supportsTransactions: boolean;
  persistent: boolean;
}

// GitHub Client
export interface GitHubClient {
  // Authentication
  authenticate(): Promise<AuthResult>;
  isAuthenticated(): Promise<boolean>;
  getUser(): Promise<GitHubUser>;
  
  // Repository Operations
  searchRepositories(query: RepositoryQuery): Promise<Repository[]>;
  getRepository(owner: string, name: string): Promise<Repository>;
  cloneRepository(repo: Repository, destination: string): Promise<void>;
  
  // File Operations
  getFileContent(repo: Repository, path: string): Promise<string>;
  createFile(repo: Repository, path: string, content: string, message: string): Promise<void>;
  updateFile(repo: Repository, path: string, content: string, message: string): Promise<void>;
  
  // Commit Operations
  getCommits(repo: Repository, options?: CommitOptions): Promise<Commit[]>;
  createCommit(repo: Repository, message: string, files: FileChange[]): Promise<Commit>;
  
  // Platform-specific
  getCapabilities(): GitHubCapabilities;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: GitHubUser;
  error?: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  description: string;
  url: string;
  clone_url: string;
  license?: License;
  language: string;
  stars: number;
  forks: number;
}

export interface License {
  key: string;
  name: string;
  spdx_id: string;
}

export interface RepositoryQuery {
  q: string;
  sort?: 'stars' | 'forks' | 'updated';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface Commit {
  sha: string;
  message: string;
  author: CommitAuthor;
  date: Date;
  url: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
}

export interface CommitOptions {
  since?: Date;
  until?: Date;
  author?: string;
  path?: string;
}

export interface FileChange {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface GitHubCapabilities {
  canClone: boolean;
  canCommit: boolean;
  canPush: boolean;
  maxFileSize: number;
  rateLimitRemaining: number;
}

// Observer Environment
export interface ObserverEnvironment {
  // Observer Management
  createObserver<T>(type: ObserverType, config: ObserverConfig): Promise<WhisperingObserver<T>>;
  destroyObserver(observer: WhisperingObserver<any>): Promise<void>;
  
  // Processing Management
  scheduleAnalysis(task: AnalysisTask): Promise<void>;
  cancelAnalysis(taskId: string): Promise<void>;
  
  // Resource Management
  getResourceUsage(): Promise<ResourceUsage>;
  optimizeResources(): Promise<void>;
  
  // Platform-specific
  getCapabilities(): ObserverCapabilities;
}

export enum ObserverType {
  PATTERN_KEEPER = 'PATTERN_KEEPER',
  SYSTEMS_PHILOSOPHER = 'SYSTEMS_PHILOSOPHER',
  COSMIC_CARTOGRAPHER = 'COSMIC_CARTOGRAPHER'
}

export interface ObserverConfig {
  platform: PlatformType;
  resources: ResourceAllocation;
  preferences: ObserverPreferences;
}

export interface ResourceAllocation {
  maxMemory: number;
  maxCPU: number;
  priority: number;
}

export interface ObserverPreferences {
  sensitivity: number; // 0-1
  frequency: number; // Hz
  batchSize: number;
}

export interface AnalysisTask {
  id: string;
  type: string;
  data: any;
  priority: number;
  callback: (result: any) => void;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  activeObservers: number;
  queuedTasks: number;
}

export interface ObserverCapabilities {
  maxObservers: number;
  supportsWebWorkers: boolean;
  supportsChildProcesses: boolean;
  supportsGPU: boolean;
}

// Platform Capabilities
export interface PlatformCapabilities {
  type: PlatformType;
  ui: UICapabilities;
  system: SystemCapabilities;
  network: NetworkCapabilities;
  storage: StorageCapabilities;
  observers: ObserverCapabilities;
}

export interface UICapabilities {
  supportsNativeDialogs: boolean;
  supportsSystemNotifications: boolean;
  supportsClipboard: boolean;
  supportsDragDrop: boolean;
  maxWindowSize: { width: number; height: number };
}

export interface SystemCapabilities {
  canAccessFileSystem: boolean;
  canExecuteCommands: boolean;
  canAccessEnvironment: boolean;
  canInstallPackages: boolean;
  operatingSystem: string;
}

export interface NetworkCapabilities {
  canMakeRequests: boolean;
  supportsCORS: boolean;
  supportsWebSockets: boolean;
  maxConcurrentRequests: number;
}

// Notification Manager
export interface NotificationManager {
  show(notification: Notification): Promise<void>;
  hide(id: string): Promise<void>;
  clear(): Promise<void>;
  getCapabilities(): NotificationCapabilities;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  callback: () => void;
}

export interface NotificationCapabilities {
  supportsActions: boolean;
  supportsImages: boolean;
  maxDuration: number;
  persistent: boolean;
}

// Suggestion Provider
export interface SuggestionProvider {
  provideCompletionItems(context: CompletionContext): Promise<CompletionItem[]>;
  resolveCompletionItem(item: CompletionItem): Promise<CompletionItem>;
}

export interface CompletionContext {
  position: Position;
  triggerCharacter?: string;
  triggerKind: CompletionTriggerKind;
}

export enum CompletionTriggerKind {
  Invoke = 0,
  TriggerCharacter = 1,
  TriggerForIncompleteCompletions = 2
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  range?: Range;
  command?: Command;
}

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18
}

export interface Command {
  id: string;
  title: string;
  arguments?: any[];
}

// File Explorer Instance
export interface FileExplorerInstance {
  // Tree Management
  refresh(): Promise<void>;
  expandPath(path: string): Promise<void>;
  collapsePath(path: string): Promise<void>;
  
  // Selection
  getSelectedPaths(): string[];
  setSelectedPaths(paths: string[]): void;
  
  // Events
  onDidSelectFile(callback: (path: string) => void): void;
  onDidOpenFile(callback: (path: string) => void): void;
  onDidCreateFile(callback: (path: string) => void): void;
  onDidDeleteFile(callback: (path: string) => void): void;
  
  // Operations
  createFile(parentPath: string, name: string): Promise<void>;
  createFolder(parentPath: string, name: string): Promise<void>;
  deleteItem(path: string): Promise<void>;
  renameItem(path: string, newName: string): Promise<void>;
}

// Terminal Instance
export interface TerminalInstance {
  // Process Management
  execute(command: string): Promise<ExecutionResult>;
  kill(): Promise<void>;
  
  // I/O
  write(data: string): void;
  onData(callback: (data: string) => void): void;
  
  // State
  isRunning(): boolean;
  getWorkingDirectory(): string;
  setWorkingDirectory(path: string): Promise<void>;
  
  // Events
  onExit(callback: (code: number) => void): void;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

// Whispering HUD Instance
export interface WhisperingHUDInstance {
  // Whisper Management
  showWhisper(suggestion: WhisperSuggestion): Promise<void>;
  hideWhisper(id: string): Promise<void>;
  clearWhispers(): Promise<void>;
  
  // Queue Management
  queueWhisper(suggestion: WhisperSuggestion): void;
  getQueueLength(): number;
  
  // State Management
  setDeveloperState(state: DeveloperState): void;
  getDeveloperState(): DeveloperState;
  
  // Events
  onWhisperAccepted(callback: (id: string) => void): void;
  onWhisperDismissed(callback: (id: string) => void): void;
  onWhisperIgnored(callback: (id: string) => void): void;
}