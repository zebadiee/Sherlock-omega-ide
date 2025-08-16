import { PlatformType, WhisperSuggestion } from '../../core/whispering-interfaces';
import { PlatformAdapter } from '../../core/platform-interfaces';

/**
 * Represents an adaptation event that occurs during the evolution process.
 * These events are tracked and can trigger learning and improvement cycles.
 */
export interface AdaptationEvent {
  /** The type of adaptation that occurred */
  type: 'code_optimization' | 'pattern_learning' | 'system_improvement';
  /** Confidence level of the adaptation (0-1) */
  confidence: number;
  /** Human-readable description of the adaptation */
  description: string;
  /** When the adaptation occurred */
  timestamp: Date;
  /** Additional metadata about the adaptation */
  metadata: Record<string, unknown>;
}

/**
 * Configuration for the SelfEvolutionEngine.
 * Defines the platform, adapter, and consciousness reference.
 */
export interface EvolutionConfig {
  /** The platform type (web, desktop, hybrid) */
  platform: PlatformType;
  /** Platform-specific adapter for system integration */
  adapter: PlatformAdapter;
  /** Reference to the consciousness system */
  consciousnessRef: unknown;
}

/**
 * SelfEvolutionEngine manages the autonomous evolution of the Sherlock Omega IDE.
 * 
 * This engine is responsible for:
 * - Learning from developer interactions
 * - Adapting system behavior based on patterns
 * - Coordinating evolution cycles
 * - Managing adaptation callbacks
 * 
 * @example
 * ```typescript
 * const engine = new SelfEvolutionEngine({
 *   platform: PlatformType.WEB,
 *   adapter: webAdapter,
 *   consciousnessRef: consciousness
 * });
 * 
 * engine.onAdaptation((adaptation) => {
 *   console.log('New adaptation:', adaptation.description);
 * });
 * 
 * await engine.performEvolutionCycle();
 * ```
 */
export class SelfEvolutionEngine {
  private config: EvolutionConfig;
  private adaptationCallbacks: Array<(adaptation: AdaptationEvent) => void> = [];

  /**
   * Creates a new SelfEvolutionEngine instance.
   * @param config - Configuration for the evolution engine
   */
  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  /**
   * Registers a callback to be notified when adaptations occur.
   * @param callback - Function to call when an adaptation happens
   */
  onAdaptation(callback: (adaptation: AdaptationEvent) => void): void {
    this.adaptationCallbacks.push(callback);
  }

  /**
   * Initiates an evolution cycle to improve the system.
   * This is the core method that drives autonomous improvement.
   */
  async evolve(): Promise<void> {
    // Evolution logic will be implemented here
    console.log('🔄 Evolution cycle initiated');
  }

  /**
   * Processes an adaptation event and notifies all registered callbacks.
   * @param adaptation - The adaptation event that occurred
   */
  async adapt(adaptation: AdaptationEvent): Promise<void> {
    // Notify all adaptation callbacks
    this.adaptationCallbacks.forEach(callback => callback(adaptation));
  }

  /**
   * Performs a complete evolution cycle including learning and adaptation.
   * This is the main entry point for triggering evolution.
   */
  async performEvolutionCycle(): Promise<void> {
    // Perform a complete evolution cycle
    console.log('🧬 Performing evolution cycle');
    await this.evolve();
  }

  /**
   * Learns from a developer interaction to improve future suggestions.
   * @param suggestion - The whisper suggestion that was presented
   * @param platform - The platform where the interaction occurred
   */
  async learnFromInteraction(suggestion: WhisperSuggestion, platform: PlatformType): Promise<void> {
    // Learn from interaction
    console.log('📚 Learning from interaction');
  }
}
