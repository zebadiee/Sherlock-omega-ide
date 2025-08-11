/**
 * Zero-Friction Protocol Engine for Sherlock Ω
 * Maintains continuous flow state by eliminating all friction points proactively
 */

import { 
  FrictionDetector, 
  FrictionPoint, 
  FrictionType, 
  EliminationResult,
  FrictionDetectorConfig,
  DEFAULT_FRICTION_CONFIG
} from './FrictionDetector';
import { SyntaxFrictionDetector, SyntaxContext } from './SyntaxFrictionDetector';

/**
 * Flow state measurement
 */
export interface FlowState {
  level: FlowLevel;
  score: number; // 0.0 to 1.0
  factors: FlowFactor[];
  timestamp: number;
  duration: number; // milliseconds in current state
}

/**
 * Flow state levels
 */
export enum FlowLevel {
  OPTIMAL = 'OPTIMAL',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  DISRUPTED = 'DISRUPTED',
  BLOCKED = 'BLOCKED'
}

/**
 * Factors affecting flow state
 */
export interface FlowFactor {
  type: FlowFactorType;
  impact: number; // -1.0 to 1.0
  description: string;
  source: string;
}

/**
 * Types of flow factors
 */
export enum FlowFactorType {
  SYNTAX_CLARITY = 'SYNTAX_CLARITY',
  DEPENDENCY_AVAILABILITY = 'DEPENDENCY_AVAILABILITY',
  PERFORMANCE_RESPONSIVENESS = 'PERFORMANCE_RESPONSIVENESS',
  COGNITIVE_LOAD = 'COGNITIVE_LOAD',
  INTERRUPTION_FREQUENCY = 'INTERRUPTION_FREQUENCY',
  TOOL_RELIABILITY = 'TOOL_RELIABILITY'
}

/**
 * Friction elimination statistics
 */
export interface FrictionStats {
  totalDetected: number;
  totalEliminated: number;
  eliminationRate: number;
  averageEliminationTime: number;
  frictionByType: Map<FrictionType, number>;
  flowStateHistory: FlowState[];
}

/**
 * Zero-Friction Protocol configuration
 */
export interface ZeroFrictionConfig {
  enabled: boolean;
  monitoringInterval: number; // milliseconds
  proactiveMode: boolean;
  flowStateThreshold: number; // minimum acceptable flow score
  maxConcurrentEliminations: number;
  escalationThreshold: number; // failures before meta-reasoning
}

/**
 * Default Zero-Friction Protocol configuration
 */
export const DEFAULT_ZERO_FRICTION_CONFIG: ZeroFrictionConfig = {
  enabled: true,
  monitoringInterval: 500, // 500ms
  proactiveMode: true,
  flowStateThreshold: 0.8,
  maxConcurrentEliminations: 5,
  escalationThreshold: 3
};

/**
 * Zero-Friction Protocol Engine
 * Coordinates all friction detectors to maintain optimal flow state
 */
export class ZeroFrictionProtocol {
  private frictionDetectors: Map<FrictionType, FrictionDetector> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private currentFlowState: FlowState;
  private stats: FrictionStats;
  private activeEliminations: Set<string> = new Set();

  constructor(
    private config: ZeroFrictionConfig = DEFAULT_ZERO_FRICTION_CONFIG
  ) {
    this.initializeFrictionDetectors();
    this.currentFlowState = this.createInitialFlowState();
    this.stats = this.createInitialStats();
  }

  /**
   * Start the zero-friction protocol
   */
  public async start(): Promise<void> {
    if (this.isMonitoring || !this.config.enabled) {
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Zero-Friction Protocol started');

    // Start continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.maintainZeroFriction();
    }, this.config.monitoringInterval);

    // Initial friction scan
    await this.maintainZeroFriction();
  }

  /**
   * Stop the zero-friction protocol
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('⏹️ Zero-Friction Protocol stopped');
  }

  /**
   * Main friction elimination loop
   */
  public async maintainZeroFriction(): Promise<FlowState> {
    try {
      // 1. Identify all friction points
      const frictionPoints = await this.identifyAllFrictionPoints();
      
      // 2. Update statistics
      this.updateFrictionStats(frictionPoints);
      
      // 3. Eliminate friction points proactively
      if (this.config.proactiveMode) {
        await this.eliminateAllFrictionProactively(frictionPoints);
      }
      
      // 4. Measure and update flow state
      this.currentFlowState = await this.measureFlowState(frictionPoints);
      this.stats.flowStateHistory.push(this.currentFlowState);
      
      // 5. Ensure flow state meets threshold
      if (this.currentFlowState.score < this.config.flowStateThreshold) {
        await this.escalateFlowStateImprovement();
      }
      
      return this.currentFlowState;
      
    } catch (error) {
      console.error('Zero-friction maintenance failed:', error);
      return this.createErrorFlowState();
    }
  }

  /**
   * Identify all friction points across all detectors
   */
  private async identifyAllFrictionPoints(): Promise<FrictionPoint[]> {
    const allFriction: FrictionPoint[] = [];
    
    // Get current context for analysis
    const context = await this.getCurrentContext();
    
    // Run all friction detectors in parallel
    const detectionPromises = Array.from(this.frictionDetectors.values()).map(async detector => {
      try {
        return await detector.detectFriction(context);
      } catch (error) {
        console.error(`Friction detection failed for ${detector.type}:`, error);
        return [];
      }
    });
    
    const detectionResults = await Promise.all(detectionPromises);
    
    // Flatten and deduplicate results
    for (const friction of detectionResults.flat()) {
      if (!allFriction.some(f => f.id === friction.id)) {
        allFriction.push(friction);
      }
    }
    
    return allFriction;
  }

  /**
   * Eliminate all friction points proactively
   */
  private async eliminateAllFrictionProactively(frictionPoints: FrictionPoint[]): Promise<void> {
    // Sort by priority (severity and blocking potential)
    const prioritizedFriction = frictionPoints.sort((a, b) => {
      const priorityA = a.severity + a.impact.blockingPotential;
      const priorityB = b.severity + b.impact.blockingPotential;
      return priorityB - priorityA;
    });

    // Limit concurrent eliminations
    const toEliminate = prioritizedFriction.slice(0, this.config.maxConcurrentEliminations);
    
    // Eliminate friction points in parallel
    const eliminationPromises = toEliminate.map(async friction => {
      if (this.activeEliminations.has(friction.id)) {
        return; // Already being eliminated
      }
      
      this.activeEliminations.add(friction.id);
      
      try {
        const detector = this.frictionDetectors.get(friction.type);
        if (detector) {
          const result = await detector.eliminateFriction(friction);
          this.handleEliminationResult(result);
        }
      } catch (error) {
        console.error(`Friction elimination failed for ${friction.id}:`, error);
      } finally {
        this.activeEliminations.delete(friction.id);
      }
    });
    
    await Promise.all(eliminationPromises);
  }

  /**
   * Measure current flow state
   */
  private async measureFlowState(frictionPoints: FrictionPoint[]): Promise<FlowState> {
    const factors: FlowFactor[] = [];
    let totalScore = 1.0;

    // Analyze friction impact on flow
    for (const friction of frictionPoints) {
      const impact = -friction.impact.flowDisruption * (friction.severity / 5);
      totalScore += impact;
      
      factors.push({
        type: this.mapFrictionToFlowFactor(friction.type),
        impact,
        description: friction.description,
        source: friction.location.file || 'unknown'
      });
    }

    // Ensure score is within bounds
    totalScore = Math.max(0, Math.min(1, totalScore));

    // Determine flow level
    const level = this.determineFlowLevel(totalScore);

    return {
      level,
      score: totalScore,
      factors,
      timestamp: Date.now(),
      duration: this.calculateFlowStateDuration(level)
    };
  }

  /**
   * Handle elimination result
   */
  private handleEliminationResult(result: EliminationResult): void {
    this.stats.totalEliminated += result.success ? 1 : 0;
    
    if (result.success) {
      console.log(`✅ Eliminated friction: ${result.frictionPoint.description}`);
    } else {
      console.warn(`❌ Failed to eliminate friction: ${result.error}`);
      
      // Check if escalation is needed
      const failureCount = this.getFailureCount(result.frictionPoint.type);
      if (failureCount >= this.config.escalationThreshold) {
        this.escalateToMetaReasoning(result.frictionPoint, result.error || 'Unknown error');
      }
    }
  }

  /**
   * Escalate to meta-reasoning when friction elimination fails repeatedly
   */
  private async escalateToMetaReasoning(friction: FrictionPoint, error: string): Promise<void> {
    console.log(`🧠 Escalating to meta-reasoning for friction: ${friction.id}`);
    console.log(`   Error: ${error}`);
    
    // In a full implementation, this would:
    // 1. Analyze why elimination failed
    // 2. Generate alternative strategies
    // 3. Transform the problem space if needed
    // 4. Apply quantum-inspired search for solutions
    
    // For now, we'll log the escalation
    console.log('   Meta-reasoning analysis initiated...');
  }

  /**
   * Escalate flow state improvement when threshold not met
   */
  private async escalateFlowStateImprovement(): Promise<void> {
    console.log(`📈 Escalating flow state improvement (current: ${this.currentFlowState.score})`);
    
    // Identify the most impactful friction points
    const criticalFactors = this.currentFlowState.factors
      .filter(f => f.impact < -0.2)
      .sort((a, b) => a.impact - b.impact);
    
    console.log(`   Critical factors: ${criticalFactors.length}`);
    
    // Apply intensive elimination strategies
    // This would involve more aggressive correction attempts
  }

  /**
   * Get current context for friction detection
   */
  private async getCurrentContext(): Promise<any> {
    // In a real implementation, this would gather:
    // - Current file content
    // - Cursor position
    // - Open files
    // - Project configuration
    // - System resources
    
    return {
      // Mock context for now
      filePath: 'current-file.ts',
      content: '// Current file content',
      language: 'typescript',
      cursorPosition: { line: 1, column: 1 }
    };
  }

  /**
   * Initialize friction detectors
   */
  private initializeFrictionDetectors(): void {
    // Add syntax friction detector
    this.frictionDetectors.set(FrictionType.SYNTAX, new SyntaxFrictionDetector());
    
    // Additional detectors would be added here:
    // this.frictionDetectors.set(FrictionType.DEPENDENCY, new DependencyFrictionDetector());
    // this.frictionDetectors.set(FrictionType.PERFORMANCE, new PerformanceFrictionDetector());
    // etc.
  }

  /**
   * Create initial flow state
   */
  private createInitialFlowState(): FlowState {
    return {
      level: FlowLevel.OPTIMAL,
      score: 1.0,
      factors: [],
      timestamp: Date.now(),
      duration: 0
    };
  }

  /**
   * Create initial statistics
   */
  private createInitialStats(): FrictionStats {
    return {
      totalDetected: 0,
      totalEliminated: 0,
      eliminationRate: 0,
      averageEliminationTime: 0,
      frictionByType: new Map(),
      flowStateHistory: []
    };
  }

  /**
   * Create error flow state
   */
  private createErrorFlowState(): FlowState {
    return {
      level: FlowLevel.BLOCKED,
      score: 0.0,
      factors: [{
        type: FlowFactorType.TOOL_RELIABILITY,
        impact: -1.0,
        description: 'Zero-friction protocol error',
        source: 'system'
      }],
      timestamp: Date.now(),
      duration: 0
    };
  }

  /**
   * Update friction statistics
   */
  private updateFrictionStats(frictionPoints: FrictionPoint[]): void {
    this.stats.totalDetected = frictionPoints.length;
    
    // Update friction by type
    this.stats.frictionByType.clear();
    for (const friction of frictionPoints) {
      const current = this.stats.frictionByType.get(friction.type) || 0;
      this.stats.frictionByType.set(friction.type, current + 1);
    }
    
    // Calculate elimination rate
    if (this.stats.totalDetected > 0) {
      this.stats.eliminationRate = this.stats.totalEliminated / this.stats.totalDetected;
    }
  }

  /**
   * Map friction type to flow factor type
   */
  private mapFrictionToFlowFactor(frictionType: FrictionType): FlowFactorType {
    switch (frictionType) {
      case FrictionType.SYNTAX:
        return FlowFactorType.SYNTAX_CLARITY;
      case FrictionType.DEPENDENCY:
        return FlowFactorType.DEPENDENCY_AVAILABILITY;
      case FrictionType.PERFORMANCE:
        return FlowFactorType.PERFORMANCE_RESPONSIVENESS;
      default:
        return FlowFactorType.COGNITIVE_LOAD;
    }
  }

  /**
   * Determine flow level from score
   */
  private determineFlowLevel(score: number): FlowLevel {
    if (score >= 0.9) return FlowLevel.OPTIMAL;
    if (score >= 0.7) return FlowLevel.GOOD;
    if (score >= 0.5) return FlowLevel.MODERATE;
    if (score >= 0.3) return FlowLevel.DISRUPTED;
    return FlowLevel.BLOCKED;
  }

  /**
   * Calculate flow state duration
   */
  private calculateFlowStateDuration(level: FlowLevel): number {
    // Calculate how long we've been in this flow level
    const history = this.stats.flowStateHistory;
    if (history.length === 0) return 0;
    
    let duration = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].level === level) {
        duration += this.config.monitoringInterval;
      } else {
        break;
      }
    }
    
    return duration;
  }

  /**
   * Get failure count for friction type
   */
  private getFailureCount(frictionType: FrictionType): number {
    const detector = this.frictionDetectors.get(frictionType);
    if (!detector) return 0;
    
    const history = detector.getEliminationHistory();
    return history.filter(result => !result.success).length;
  }

  /**
   * Get current flow state
   */
  public getCurrentFlowState(): FlowState {
    return { ...this.currentFlowState };
  }

  /**
   * Get friction statistics
   */
  public getStats(): FrictionStats {
    return { ...this.stats };
  }

  /**
   * Get all detected friction points
   */
  public getAllDetectedFriction(): FrictionPoint[] {
    const allFriction: FrictionPoint[] = [];
    
    for (const detector of this.frictionDetectors.values()) {
      allFriction.push(...detector.getDetectedFriction());
    }
    
    return allFriction;
  }
}