/**
 * AI Bot Registry - Core interfaces for bot catalog and management
 * Extends Sherlock Ω's plugin architecture for AI agent management
 */

export interface BotMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: BotCategory;
  tags: string[];
  capabilities: BotCapability[];
  requirements: BotRequirements;
  created: Date;
  updated: Date;
  downloads: number;
  rating: number;
  verified: boolean;
}

export interface BotCapability {
  type: CapabilityType;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  examples?: CapabilityExample[];
}

export interface CapabilityExample {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface BotRequirements {
  nodeVersion?: string;
  dependencies?: string[];
  permissions?: Permission[];
  resources?: ResourceRequirement;
}

export interface ResourceRequirement {
  memory?: string;
  cpu?: string;
  storage?: string;
  network?: boolean;
}

export enum BotCategory {
  CODE_GENERATION = 'code-generation',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  ANALYSIS = 'analysis',
  AUTOMATION = 'automation',
  INTEGRATION = 'integration',
  CUSTOM = 'custom'
}

export enum CapabilityType {
  TEXT_PROCESSING = 'text-processing',
  CODE_ANALYSIS = 'code-analysis',
  FILE_MANIPULATION = 'file-manipulation',
  API_INTEGRATION = 'api-integration',
  DATA_TRANSFORMATION = 'data-transformation',
  WORKFLOW_AUTOMATION = 'workflow-automation'
}

export enum Permission {
  FILE_READ = 'file:read',
  FILE_WRITE = 'file:write',
  NETWORK_ACCESS = 'network:access',
  SYSTEM_COMMANDS = 'system:commands',
  PLUGIN_MANAGEMENT = 'plugin:management'
}

export interface IBotRegistry {
  // Registry management
  registerBot(bot: BotDefinition): Promise<void>;
  unregisterBot(botId: string): Promise<void>;
  updateBot(botId: string, updates: Partial<BotDefinition>): Promise<void>;
  
  // Discovery and search
  searchBots(query: BotSearchQuery): Promise<BotMetadata[]>;
  getBotById(botId: string): Promise<BotDefinition | null>;
  listBots(category?: BotCategory): Promise<BotMetadata[]>;
  
  // Version management
  getBotVersions(botId: string): Promise<string[]>;
  getBotVersion(botId: string, version: string): Promise<BotDefinition | null>;
  
  // Installation and lifecycle
  installBot(botId: string, version?: string): Promise<void>;
  uninstallBot(botId: string): Promise<void>;
  enableBot(botId: string): Promise<void>;
  disableBot(botId: string): Promise<void>;
  
  // Validation and security
  validateBot(bot: BotDefinition): Promise<ValidationResult>;
  verifyBotSecurity(botId: string): Promise<SecurityReport>;
}

export interface BotDefinition {
  metadata: BotMetadata;
  implementation: BotImplementation;
  configuration: BotConfiguration;
  tests?: BotTest[];
}

export interface BotImplementation {
  entryPoint: string;
  sourceFiles: Record<string, string>;
  dependencies: Record<string, string>;
  buildScript?: string;
}

export interface BotConfiguration {
  settings: Record<string, any>;
  environment?: Record<string, string>;
  triggers?: BotTrigger[];
  permissions: Permission[];
}

export interface BotTrigger {
  type: TriggerType;
  condition: string;
  action: string;
}

export enum TriggerType {
  FILE_CHANGE = 'file-change',
  COMMAND = 'command',
  SCHEDULE = 'schedule',
  EVENT = 'event'
}

export interface BotTest {
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  timeout?: number;
}

export interface BotSearchQuery {
  query?: string;
  category?: BotCategory;
  tags?: string[];
  capabilities?: CapabilityType[];
  author?: string;
  verified?: boolean;
  minRating?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface SecurityReport {
  safe: boolean;
  risks: SecurityRisk[];
  permissions: Permission[];
  sandboxed: boolean;
}

export interface SecurityRisk {
  level: RiskLevel;
  description: string;
  mitigation?: string;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}