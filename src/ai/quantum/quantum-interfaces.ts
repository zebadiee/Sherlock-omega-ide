/**
 * Quantum Computing Interfaces for AI Bot System
 * Integrates quantum algorithms and simulations into bot capabilities
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

export interface QuantumCapability {
  type: QuantumCapabilityType;
  description: string;
  qubits: number;
  gates: QuantumGate[];
  complexity: QuantumComplexity;
  simulationBackend: QuantumBackend;
  errorCorrection?: ErrorCorrectionScheme;
}

export enum QuantumCapabilityType {
  CIRCUIT_SIMULATION = 'circuit-simulation',
  OPTIMIZATION = 'optimization',
  MACHINE_LEARNING = 'machine-learning',
  CRYPTOGRAPHY = 'cryptography',
  SEARCH = 'search',
  SAMPLING = 'sampling',
  ERROR_CORRECTION = 'error-correction',
  HYBRID_CLASSICAL = 'hybrid-classical'
}

export enum QuantumComplexity {
  SIMPLE = 'simple',        // 1-5 qubits, basic gates
  MODERATE = 'moderate',    // 6-15 qubits, intermediate circuits
  ADVANCED = 'advanced',    // 16-25 qubits, complex algorithms
  RESEARCH = 'research'     // 25+ qubits, cutting-edge experiments
}

export enum QuantumBackend {
  QUANTUM_CIRCUIT_JS = 'quantum-circuit',
  Q_JS = 'q-js',
  QISKIT_SIMULATOR = 'qiskit-simulator',
  CIRQ_SIMULATOR = 'cirq-simulator',
  LOCAL_SIMULATOR = 'local-simulator'
}

export interface QuantumGate {
  name: string;
  type: GateType;
  qubits: number[];
  parameters?: number[];
  description: string;
}

export enum GateType {
  // Single-qubit gates
  X = 'X',           // Pauli-X (NOT)
  Y = 'Y',           // Pauli-Y
  Z = 'Z',           // Pauli-Z
  H = 'H',           // Hadamard
  S = 'S',           // Phase
  T = 'T',           // T-gate
  RX = 'RX',         // Rotation around X
  RY = 'RY',         // Rotation around Y
  RZ = 'RZ',         // Rotation around Z
  
  // Two-qubit gates
  CNOT = 'CNOT',     // Controlled-NOT
  CZ = 'CZ',         // Controlled-Z
  SWAP = 'SWAP',     // Swap
  
  // Multi-qubit gates
  TOFFOLI = 'TOFFOLI', // Controlled-Controlled-NOT
  FREDKIN = 'FREDKIN', // Controlled-SWAP
  
  // Measurement
  MEASURE = 'MEASURE'
}

export interface ErrorCorrectionScheme {
  type: ErrorCorrectionType;
  logicalQubits: number;
  physicalQubits: number;
  threshold: number;
  description: string;
}

export enum ErrorCorrectionType {
  SURFACE_CODE = 'surface-code',
  STEANE_CODE = 'steane-code',
  SHOR_CODE = 'shor-code',
  REPETITION_CODE = 'repetition-code',
  CUSTOM = 'custom'
}

export interface QuantumAlgorithm {
  name: string;
  type: AlgorithmType;
  description: string;
  qubits: number;
  depth: number;
  gates: QuantumGate[];
  parameters: AlgorithmParameter[];
  applications: string[];
  complexity: QuantumComplexity;
}

export enum AlgorithmType {
  // Optimization
  QAOA = 'qaoa',                    // Quantum Approximate Optimization Algorithm
  VQE = 'vqe',                      // Variational Quantum Eigensolver
  QUANTUM_ANNEALING = 'quantum-annealing',
  
  // Search
  GROVER = 'grover',                // Grover's Search Algorithm
  AMPLITUDE_AMPLIFICATION = 'amplitude-amplification',
  
  // Factoring & Cryptography
  SHOR = 'shor',                    // Shor's Factoring Algorithm
  QUANTUM_KEY_DISTRIBUTION = 'qkd',
  
  // Machine Learning
  QSVM = 'qsvm',                    // Quantum Support Vector Machine
  QUANTUM_GAN = 'quantum-gan',
  VARIATIONAL_CLASSIFIER = 'variational-classifier',
  
  // Simulation
  QUANTUM_SIMULATION = 'quantum-simulation',
  HAMILTONIAN_SIMULATION = 'hamiltonian-simulation',
  
  // Sampling
  QUANTUM_SUPREMACY = 'quantum-supremacy',
  BOSON_SAMPLING = 'boson-sampling'
}

export interface AlgorithmParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  description: string;
  defaultValue?: any;
  constraints?: ParameterConstraint;
}

export interface ParameterConstraint {
  min?: number;
  max?: number;
  options?: any[];
  pattern?: string;
}

export interface QuantumCircuit {
  id: string;
  name: string;
  description: string;
  qubits: number;
  depth: number;
  gates: QuantumGate[];
  measurements: MeasurementOperation[];
  metadata: CircuitMetadata;
}

export interface MeasurementOperation {
  qubit: number;
  classicalBit: number;
  basis?: MeasurementBasis;
}

export enum MeasurementBasis {
  COMPUTATIONAL = 'computational',  // Z-basis
  HADAMARD = 'hadamard',           // X-basis
  CIRCULAR = 'circular',           // Y-basis
  CUSTOM = 'custom'
}

export interface CircuitMetadata {
  created: Date;
  author: string;
  version: string;
  tags: string[];
  references: string[];
  complexity: QuantumComplexity;
}

export interface QuantumSimulationResult {
  circuitId: string;
  backend: QuantumBackend;
  shots: number;
  executionTime: number;
  results: SimulationOutcome[];
  statistics: ExecutionStatistics;
  errors?: QuantumError[];
}

export interface SimulationOutcome {
  state: string;           // Binary string representation
  probability: number;
  amplitude?: ComplexNumber;
  count: number;
}

export interface ComplexNumber {
  real: number;
  imaginary: number;
}

export interface ExecutionStatistics {
  totalShots: number;
  uniqueStates: number;
  entropy: number;
  fidelity?: number;
  errorRate?: number;
}

export interface QuantumError {
  type: ErrorType;
  message: string;
  qubit?: number;
  gate?: string;
  severity: ErrorSeverity;
}

export enum ErrorType {
  DECOHERENCE = 'decoherence',
  GATE_ERROR = 'gate-error',
  MEASUREMENT_ERROR = 'measurement-error',
  CROSSTALK = 'crosstalk',
  CALIBRATION_ERROR = 'calibration-error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface IQuantumBotBuilder {
  // Natural language to quantum circuit
  parseQuantumDescription(description: string): Promise<QuantumCircuit>;
  
  // Algorithm generation
  generateQuantumAlgorithm(type: AlgorithmType, parameters: any): Promise<QuantumAlgorithm>;
  
  // Circuit optimization
  optimizeCircuit(circuit: QuantumCircuit): Promise<QuantumCircuit>;
  
  // Hybrid classical-quantum workflows
  createHybridWorkflow(classicalSteps: any[], quantumSteps: QuantumCircuit[]): Promise<any>;
  
  // Educational content generation
  generateQuantumTutorial(topic: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<any>;
}

export interface IQuantumSimulator {
  // Circuit execution
  executeCircuit(circuit: QuantumCircuit, shots?: number): Promise<QuantumSimulationResult>;
  
  // State vector simulation
  getStateVector(circuit: QuantumCircuit): Promise<ComplexNumber[]>;
  
  // Noise modeling
  addNoise(circuit: QuantumCircuit, noiseModel: NoiseModel): Promise<QuantumCircuit>;
  
  // Backend management
  listBackends(): Promise<QuantumBackend[]>;
  setBackend(backend: QuantumBackend): Promise<void>;
  
  // Performance optimization
  optimizeForBackend(circuit: QuantumCircuit, backend: QuantumBackend): Promise<QuantumCircuit>;
  
  // Lifecycle management
  shutdown(): Promise<void>;
}

export interface NoiseModel {
  name: string;
  description: string;
  singleQubitErrorRate: number;
  twoQubitErrorRate: number;
  measurementErrorRate: number;
  decoherenceTime: number;
  customErrors?: CustomError[];
}

export interface CustomError {
  type: string;
  probability: number;
  qubits: number[];
  description: string;
}

export interface QuantumBotCapability {
  // Extends the base BotCapability with quantum-specific features
  quantumFeatures: QuantumCapability[];
  hybridMode: boolean;
  requiresQuantumBackend: boolean;
  fallbackToClassical: boolean;
  quantumAdvantage?: QuantumAdvantageMetric;
}

export interface QuantumAdvantageMetric {
  speedup: number;           // Expected quantum speedup
  accuracy: number;          // Accuracy improvement
  resourceReduction: number; // Resource usage reduction
  confidence: number;        // Confidence in quantum advantage
}

// Quantum-inspired classical algorithms
export interface QuantumInspiredAlgorithm {
  name: string;
  description: string;
  quantumPrinciple: string;  // Which quantum principle it's based on
  classicalImplementation: string;
  applications: string[];
  performance: PerformanceMetric;
}

export interface PerformanceMetric {
  timeComplexity: string;
  spaceComplexity: string;
  approximationRatio?: number;
  convergenceRate?: number;
}

// Integration with existing bot system
export interface QuantumBotDefinition {
  // Extends BotDefinition with quantum capabilities
  quantumCapabilities: QuantumBotCapability[];
  requiredBackends: QuantumBackend[];
  quantumResources: QuantumResourceRequirement;
  educationalContent?: QuantumEducationalContent;
}

export interface QuantumResourceRequirement {
  minQubits: number;
  maxQubits: number;
  coherenceTime: number;     // Required coherence time in microseconds
  gateTime: number;          // Required gate time in nanoseconds
  fidelity: number;          // Required gate fidelity
}

export interface QuantumEducationalContent {
  concepts: QuantumConcept[];
  visualizations: QuantumVisualization[];
  exercises: QuantumExercise[];
  references: QuantumReference[];
}

export interface QuantumConcept {
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  examples: string[];
}

export interface QuantumVisualization {
  type: 'bloch-sphere' | 'circuit-diagram' | 'probability-distribution' | 'state-evolution';
  data: any;
  interactive: boolean;
  description: string;
}

export interface QuantumExercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: string;
  hints: string[];
  verification: (answer: any) => boolean;
}

export interface QuantumReference {
  title: string;
  authors: string[];
  url?: string;
  doi?: string;
  type: 'paper' | 'book' | 'tutorial' | 'documentation';
}