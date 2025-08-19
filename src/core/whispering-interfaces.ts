/**
 * Whispering Architecture Interfaces
 * Defines contracts for the three observers and gentle suggestion system
 */

import { SensorInterface } from './interfaces';
import { SensorResult } from '../types/core';

// Platform Types
export enum PlatformType {
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
  HYBRID = 'HYBRID',
  NODE = 'NODE'
}

// Whispering Observer Base Interface
export interface WhisperingObserver<T> extends SensorInterface {
  // Platform-agnostic observation
  observe(context: T, platform: PlatformType): Promise<void>;
  
  // Generate platform-appropriate whispers
  whisper(insight: Insight, platform: PlatformType): Promise<WhisperSuggestion>;
  
  // Learn from feedback across platforms
  attune(feedback: DeveloperFeedback, platform: PlatformType): void;
  
  // Check readiness for suggestions
  isResonating(platform: PlatformType): boolean;
  
  // Platform-specific optimization
  optimizeForPlatform(platform: PlatformType): Promise<void>;
}

// Insight Types
export interface Insight {
  id: string;
  type: InsightType;
  observer: ObserverType;
  confidence: number;
  pattern: any;
  context: ObservationContext;
  timestamp: Date;
}

export enum InsightType {
  MATHEMATICAL_HARMONY = 'MATHEMATICAL_HARMONY',
  COMPUTATIONAL_POETRY = 'COMPUTATIONAL_POETRY',
  COSMIC_CONNECTION = 'COSMIC_CONNECTION',
  PATTERN_OPTIMIZATION = 'PATTERN_OPTIMIZATION',
  SYSTEM_ELEGANCE = 'SYSTEM_ELEGANCE',
  DIMENSIONAL_RELATIONSHIP = 'DIMENSIONAL_RELATIONSHIP'
}

export enum ObserverType {
  PATTERN_KEEPER = 'PATTERN_KEEPER',
  SYSTEMS_PHILOSOPHER = 'SYSTEMS_PHILOSOPHER',
  COSMIC_CARTOGRAPHER = 'COSMIC_CARTOGRAPHER'
}

// Whisper Suggestion
export interface WhisperSuggestion {
  id: string;
  type: InsightType;
  observer: ObserverType;
  message: string;
  confidence: number;
  subtlety: number; // How gently to present (0-1)
  timing: WhisperTiming;
  renderLocation: RenderLocation;
  code?: string;
  explanation?: string;
  metadata: WhisperMetadata;
}

export enum WhisperTiming {
  IMMEDIATE = 'IMMEDIATE',
  NEXT_PAUSE = 'NEXT_PAUSE',
  WHEN_CURIOUS = 'WHEN_CURIOUS',
  ON_REQUEST = 'ON_REQUEST'
}

export enum RenderLocation {
  HUD_OVERLAY = 'HUD_OVERLAY',
  INLINE_SUGGESTION = 'INLINE_SUGGESTION',
  MONACO_WIDGET = 'MONACO_WIDGET',
  STATUS_BAR = 'STATUS_BAR',
  NOTIFICATION = 'NOTIFICATION'
}

export interface WhisperMetadata {
  createdAt: Date;
  platform: PlatformType;
  contextHash: string;
  priority: number;
  dismissible: boolean;
  autoHide?: number; // milliseconds
}

// Developer Feedback
export interface DeveloperFeedback {
  whisperId: string;
  action: FeedbackAction;
  timestamp: Date;
  context: any;
  platform: PlatformType;
}

export enum FeedbackAction {
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
  IGNORED = 'IGNORED',
  MODIFIED = 'MODIFIED',
  REQUESTED_MORE = 'REQUESTED_MORE'
}

// Observation Context
export interface ObservationContext {
  timestamp: Date;
  platform: PlatformType;
  codeContext: CodeContext;
  developerState: DeveloperState;
  systemState: SystemState;
  environmentFactors: EnvironmentFactor[];
}

export interface CodeContext {
  content: string;
  language: string;
  filePath: string;
  cursorPosition?: Position;
  selection?: Range;
  recentChanges: Change[];
}

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Change {
  type: 'insert' | 'delete' | 'replace';
  position: Position;
  content: string;
  timestamp: Date;
}

export interface DeveloperState {
  flowState: FlowState;
  attentionLevel: number; // 0-1
  recentPatterns: Pattern[];
  preferences: DeveloperPreference[];
  typingRhythm: TypingMetrics;
}

export enum FlowState {
  DEEP_FOCUS = 'DEEP_FOCUS',
  EXPLORING = 'EXPLORING',
  DEBUGGING = 'DEBUGGING',
  CURIOUS = 'CURIOUS',
  STUCK = 'STUCK',
  DISTRACTED = 'DISTRACTED'
}

export interface Pattern {
  type: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
  variations: any[];
}

export interface DeveloperPreference {
  category: string;
  value: any;
  confidence: number;
  platform: PlatformType;
}

export interface TypingMetrics {
  averageSpeed: number; // characters per minute
  pausePatterns: number[];
  rhythmConsistency: number; // 0-1
  recentActivity: ActivityWindow[];
}

export interface ActivityWindow {
  start: Date;
  end: Date;
  intensity: number; // 0-1
  focusLevel: number; // 0-1
}

export interface SystemState {
  platform: PlatformType;
  resources: SystemResources;
  permissions: SystemPermissions;
  network: NetworkStatus;
  storage: StorageStatus;
  performance: PerformanceState;
}

export interface PerformanceState {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeAlerts: number;
  healthScore: number; // 0-1
}

export interface SystemResources {
  cpuUsage: number; // 0-1
  memoryUsage: number; // 0-1
  availableCores: number;
  diskSpace: number; // bytes available
}

export interface SystemPermissions {
  fileSystem: boolean;
  network: boolean;
  notifications: boolean;
  clipboard: boolean;
  camera?: boolean;
  microphone?: boolean;
}

export interface NetworkStatus {
  online: boolean;
  speed: number; // Mbps
  latency: number; // ms
  stability: number; // 0-1
}

export interface StorageStatus {
  available: number; // bytes
  used: number; // bytes
  quota: number; // bytes
  type: 'localStorage' | 'indexedDB' | 'filesystem' | 'database';
}

export interface EnvironmentFactor {
  type: string;
  value: any;
  relevance: number; // 0-1
  platform: PlatformType;
}

// Three Questions Framework
export interface EthicalValidation {
  servesIntent: boolean;
  respectsTrust: boolean;
  evolvesHarmoniously: boolean;
  confidence: number;
  reasoning: string[];
}

export interface EthicalGateway {
  validateSuggestion(suggestion: WhisperSuggestion, context: ObservationContext): Promise<EthicalValidation>;
  serveDeveloperIntent(suggestion: WhisperSuggestion, context: ObservationContext): Promise<boolean>;
  respectCommunityTrust(suggestion: WhisperSuggestion, context: ObservationContext): Promise<boolean>;
  evolveHarmoniously(suggestion: WhisperSuggestion, context: ObservationContext): Promise<boolean>;
}