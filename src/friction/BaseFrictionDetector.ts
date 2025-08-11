/**
 * Base Friction Detection Framework for Sherlock Ω
 * Abstract foundation for all friction detection and elimination systems
 */

/**
 * Core friction point interface - simplified and extensible
 */
export interface FrictionPoint {
  /**
   * Unique identifier for the friction instance
   */
  id: string;
  
  /**
   * Description of the friction
   */
  description: string;
  
  /**
   * Severity score (0.0–1.0)
   */
  severity: number;
  
  /**
   * Location/context where friction occurred
   */
  location?: any;
  
  /**
   * Whether auto-elimination was attempted
   */
  attempted?: boolean;
  
  /**
   * Whether auto-elimination succeeded
   */
  eliminated?: boolean;
  
  /**
   * Timestamp when friction was detected
   */
  timestamp?: number;
  
  /**
   * Additional metadata specific to friction type
   */
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for detecting and reporting development friction points
 */
export abstract class FrictionDetector<T extends FrictionPoint> {
  protected history: T[] = [];
  protected name: string;
  
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Detect friction in the provided context
   * @param context Arbitrary context data (e.g., code text, AST, diagnostics)
   * @returns List of friction points detected
   */
  abstract detect(context: any): T[] | Promise<T[]>;

  /**
   * Apply elimination strategies for a given friction point
   * @param point A friction point to address
   * @returns True if elimination was successful, false otherwise
   */
  abstract eliminate(point: T): Promise<boolean>;

  /**
   * Records the outcome of a detection/elimination cycle
   */
  protected record(point: T, result: boolean): void {
    const recordedPoint = {
      ...point,
      eliminated: result,
      timestamp: point.timestamp || Date.now()
    };
    this.history.push(recordedPoint);
  }

  /**
   * Retrieve the history of all friction detection/elimination events
   */
  getHistory(): T[] {
    return [...this.history];
  }

  /**
   * Get the name/type of this detector
   */
  getName(): string {
    return this.name;
  }

  /**
   * Clear the history (useful for testing or memory management)
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get statistics about detection and elimination success rates
   */
  getStats(): FrictionDetectorStats {
    const total = this.history.length;
    const attempted = this.history.filter(p => p.attempted).length;
    const eliminated = this.history.filter(p => p.eliminated).length;
    
    return {
      totalDetected: total,
      totalAttempted: attempted,
      totalEliminated: eliminated,
      eliminationRate: attempted > 0 ? eliminated / attempted : 0,
      detectionRate: total > 0 ? attempted / total : 0
    };
  }

  /**
   * Get recent friction points (last N entries)
   */
  getRecentFriction(count: number = 10): T[] {
    return this.history.slice(-count);
  }

  /**
   * Filter friction points by severity threshold
   */
  getHighSeverityFriction(threshold: number = 0.7): T[] {
    return this.history.filter(p => p.severity >= threshold);
  }
}

/**
 * Statistics interface for friction detectors
 */
export interface FrictionDetectorStats {
  totalDetected: number;
  totalAttempted: number;
  totalEliminated: number;
  eliminationRate: number;
  detectionRate: number;
}

/**
 * Configuration interface for friction detectors
 */
export interface FrictionDetectorConfig {
  enabled: boolean;
  autoEliminate: boolean;
  severityThreshold: number;
  maxHistorySize: number;
}

/**
 * Default configuration for friction detectors
 */
export const DEFAULT_FRICTION_DETECTOR_CONFIG: FrictionDetectorConfig = {
  enabled: true,
  autoEliminate: true,
  severityThreshold: 0.5,
  maxHistorySize: 1000
};