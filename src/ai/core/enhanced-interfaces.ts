/**
 * Enhanced Core Interfaces for AI Bot System
 * Simplified, FOSS-friendly design with quantum computing integration
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 * @author Sherlock Ω Contributors
 */

// Core Bot Interface - Simple and extensible
export interface IBot {
  name: string;
  description: string;
  version: string;
  author?: string;
  tags?: string[];
  
  // Core execution method - all bots must implement this
  execute(input: any): Promise<any>;
  
  // Optional lifecycle methods
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
  
  // Metadata for FOSS sharing
  getMetadata(): BotMetadata;
}

// Quantum-Enhanced Bot Interface
export interface IQuantumBot extends IBot {
  // Quantum circuit simulation
  simulateCircuit(circuitDescription: string): Promise<QuantumSimulationOutput>;
  
  // Quantum algorithm execution
  executeQuantumAlgorithm(algorithm: string, parameters?: any): Promise<QuantumAlgorithmResult>;
  
  // Hybrid classical-quantum processing
  hybridExecute(classicalInput: any, quantumCircuit?: string): Promise<HybridResult>;
  
  // Quantum state management
  getQuantumState?(): Promise<QuantumState>;
  setQuantumState?(state: QuantumState): Promise<void>;
}

// Educational Quantum Bot for tutorials and learning
export interface IQuantumEducationBot extends IQuantumBot {
  // Generate educational content
  generateTutorial(topic: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<QuantumTutorial>;
  
  // Interactive quantum exercises
  createExercise(concept: string): Promise<QuantumExercise>;
  
  // Visualizations for quantum concepts
  generateVisualization(type: 'bloch-sphere' | 'circuit' | 'probability'): Promise<QuantumVisualization>;
}

// Bot Registry Interface - Manages bot lifecycle
export interface IBotRegistry {
  // Basic registry operations
  register(bot: IBot): Promise<void>;
  unregister(name: string): Promise<void>;
  getBot(name: string): Promise<IBot | undefined>;
  listBots(filter?: BotFilter): Promise<IBot[]>;
  
  // Search and discovery
  searchBots(query: string): Promise<IBot[]>;
  getBotsByTag(tag: string): Promise<IBot[]>;
  getBotsByAuthor(author: string): Promise<IBot[]>;
  
  // FOSS sharing capabilities
  exportRegistry(): Promise<string>;
  importRegistry(data: string): Promise<void>;
  exportBot(name: string): Promise<string>;
  importBot(data: string): Promise<void>;
  
  // Version management
  getBotVersions(name: string): Promise<string[]>;
  getBotVersion(name: string, version: string): Promise<IBot | undefined>;
}

// Bot Builder Interface - Natural language to bot conversion
export interface IBotBuilder {
  // Core building functionality
  buildFromDescription(description: string): Promise<IBot>;
  buildQuantumBot(description: string): Promise<IQuantumBot>;
  
  // Interactive building
  startInteractiveSession(): Promise<BuilderSession>;
  continueSession(sessionId: string, input: string): Promise<BuilderResponse>;
  finalizeSession(sessionId: string): Promise<IBot>;
  
  // Code generation
  generateBotCode(description: string, options?: CodeGenerationOptions): Promise<string>;
  generateQuantumCode(circuitDescription: string): Promise<string>;
  
  // Template management
  getTemplates(): Promise<BotTemplate[]>;
  createTemplate(bot: IBot): Promise<BotTemplate>;
}

// Quantum Simulator Interface - Simplified for FOSS integration
export interface IQuantumSimulator {
  // Circuit execution
  executeCircuit(circuit: QuantumCircuitDefinition): Promise<QuantumSimulationOutput>;
  
  // Backend management
  listBackends(): Promise<string[]>;
  setBackend(backend: string): Promise<void>;
  getCurrentBackend(): string;
  
  // Quantum state operations
  getStateVector(circuit: QuantumCircuitDefinition): Promise<ComplexNumber[]>;
  getProbabilities(circuit: QuantumCircuitDefinition): Promise<Record<string, number>>;
  
  // Noise modeling (for realistic simulations)
  addNoise(circuit: QuantumCircuitDefinition, noiseLevel: number): Promise<QuantumCircuitDefinition>;
}

// Data Types and Structures

export interface BotMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  created: Date;
  updated: Date;
  tags: string[];
  category: BotCategory;
  license: string;
  repository?: string;
  documentation?: string;
}

export enum BotCategory {
  GENERAL = 'general',
  QUANTUM = 'quantum',
  EDUCATION = 'education',
  OPTIMIZATION = 'optimization',
  SIMULATION = 'simulation',
  CRYPTOGRAPHY = 'cryptography',
  MACHINE_LEARNING = 'machine-learning',
  RESEARCH = 'research'
}

export interface BotFilter {
  category?: BotCategory;
  tags?: string[];
  author?: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface QuantumSimulationOutput {
  // Measurement results
  probabilities: Record<string, number>;
  
  // Raw measurement counts
  counts: Record<string, number>;
  
  // Execution metadata
  shots: number;
  executionTime: number;
  backend: string;
  
  // Quantum state information
  stateVector?: ComplexNumber[];
  entropy?: number;
  fidelity?: number;
}

export interface QuantumAlgorithmResult {
  // Algorithm-specific results
  result: any;
  
  // Performance metrics
  quantumAdvantage?: number;
  classicalComparison?: any;
  
  // Execution details
  circuitDepth: number;
  gateCount: number;
  executionTime: number;
}

export interface HybridResult {
  // Combined classical and quantum results
  classicalResult: any;
  quantumResult: QuantumSimulationOutput;
  
  // Integration metadata
  hybridAdvantage?: number;
  totalExecutionTime: number;
}

export interface QuantumState {
  // State vector representation
  amplitudes: ComplexNumber[];
  
  // Measurement basis
  basis: 'computational' | 'hadamard' | 'custom';
  
  // Entanglement information
  entangled: boolean;
  entanglementEntropy?: number;
}

export interface QuantumCircuitDefinition {
  // Circuit structure
  qubits: number;
  gates: QuantumGate[];
  measurements: QuantumMeasurement[];
  
  // Metadata
  name: string;
  description: string;
  
  // Optimization hints
  optimizationLevel?: 'none' | 'basic' | 'aggressive';
}

export interface QuantumGate {
  // Gate identification
  type: string; // 'H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ', etc.
  qubits: number[];
  parameters?: number[];
  
  // Optional metadata
  name?: string;
  description?: string;
}

export interface QuantumMeasurement {
  qubit: number;
  classicalBit: number;
  basis?: 'Z' | 'X' | 'Y';
}

export interface ComplexNumber {
  real: number;
  imaginary: number;
}

// Educational Content Types

export interface QuantumTutorial {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  
  // Content structure
  sections: TutorialSection[];
  exercises: QuantumExercise[];
  
  // Prerequisites and resources
  prerequisites: string[];
  estimatedTime: string;
  resources: TutorialResource[];
}

export interface TutorialSection {
  title: string;
  content: string;
  codeExamples?: CodeExample[];
  visualizations?: QuantumVisualization[];
}

export interface QuantumExercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Exercise content
  problem: string;
  hints: string[];
  solution: string;
  
  // Interactive elements
  interactiveCircuit?: QuantumCircuitDefinition;
  expectedOutput?: QuantumSimulationOutput;
}

export interface QuantumVisualization {
  type: 'bloch-sphere' | 'circuit-diagram' | 'probability-distribution' | 'state-evolution';
  data: any;
  interactive: boolean;
  description: string;
}

export interface TutorialResource {
  title: string;
  type: 'paper' | 'book' | 'video' | 'website' | 'code';
  url: string;
  description: string;
}

export interface CodeExample {
  title: string;
  description: string;
  language: string;
  code: string;
  runnable: boolean;
}

// Builder Types

export interface BuilderSession {
  id: string;
  state: SessionState;
  context: BuilderContext;
  history: SessionMessage[];
  currentBot?: Partial<IBot>;
}

export enum SessionState {
  INITIALIZING = 'initializing',
  GATHERING_REQUIREMENTS = 'gathering-requirements',
  GENERATING_CODE = 'generating-code',
  TESTING = 'testing',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed'
}

export interface BuilderContext {
  userPreferences: UserPreferences;
  projectContext: ProjectContext;
  availableLibraries: string[];
}

export interface UserPreferences {
  language: 'typescript' | 'javascript' | 'python';
  quantumLibrary: 'quantum-circuit' | 'qiskit' | 'cirq' | 'q-js';
  codeStyle: CodeStyle;
  complexity: 'simple' | 'moderate' | 'advanced';
}

export interface CodeStyle {
  indentation: string;
  quotes: 'single' | 'double';
  semicolons: boolean;
  async: boolean;
}

export interface ProjectContext {
  type: 'standalone' | 'plugin' | 'library';
  targetPlatform: 'node' | 'browser' | 'both';
  dependencies: string[];
}

export interface SessionMessage {
  timestamp: Date;
  type: 'user' | 'system' | 'error';
  content: string;
  metadata?: any;
}

export interface BuilderResponse {
  message: string;
  suggestions: string[];
  nextSteps: string[];
  requiresInput: boolean;
  inputPrompt?: string;
  generatedCode?: string;
}

export interface CodeGenerationOptions {
  language: 'typescript' | 'javascript' | 'python';
  includeTests: boolean;
  includeDocumentation: boolean;
  optimizationLevel: 'none' | 'basic' | 'aggressive';
  quantumFeatures: boolean;
}

export interface BotTemplate {
  name: string;
  description: string;
  category: BotCategory;
  
  // Template structure
  codeTemplate: string;
  configTemplate: any;
  
  // Customization points
  parameters: TemplateParameter[];
  
  // Metadata
  author: string;
  version: string;
  tags: string[];
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  defaultValue?: any;
  required: boolean;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  options?: any[];
}

// FOSS Integration Types

export interface FOSSMetadata {
  license: string;
  repository: string;
  contributors: string[];
  issues?: string;
  documentation?: string;
  changelog?: string;
}

export interface RegistryExport {
  version: string;
  exportDate: Date;
  bots: BotExport[];
  metadata: FOSSMetadata;
}

export interface BotExport {
  metadata: BotMetadata;
  code: string;
  tests?: string;
  documentation?: string;
  dependencies: string[];
}

// Error Types

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public botName?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class QuantumError extends BotError {
  constructor(
    message: string,
    public quantumCode: string,
    public circuit?: QuantumCircuitDefinition,
    details?: any
  ) {
    super(message, quantumCode, undefined, details);
    this.name = 'QuantumError';
  }
}

// Utility Types

export type BotExecutionResult<T = any> = {
  success: boolean;
  result?: T;
  error?: string;
  executionTime: number;
  metadata?: any;
};

export type QuantumBackend = 'quantum-circuit' | 'qiskit-simulator' | 'cirq-simulator' | 'local-simulator';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Event Types for EventEmitter integration

export interface BotRegistryEvents {
  'bot-registered': { bot: IBot };
  'bot-unregistered': { name: string };
  'bot-updated': { bot: IBot };
  'registry-exported': { data: string };
  'registry-imported': { count: number };
}

export interface BotBuilderEvents {
  'session-started': { sessionId: string };
  'session-completed': { sessionId: string; bot: IBot };
  'code-generated': { code: string; language: string };
  'bot-built': { bot: IBot; description: string };
}

export interface QuantumSimulatorEvents {
  'circuit-executed': { circuit: QuantumCircuitDefinition; result: QuantumSimulationOutput };
  'backend-changed': { backend: string };
  'simulation-error': { error: QuantumError };
}