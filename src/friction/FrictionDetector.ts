/**
 * Friction Detection Framework for Sherlock Ω Zero-Friction Protocol
 * Identifies and eliminates development friction points proactively
 */

import { ComputationalIssue, ProblemType, SeverityLevel } from '../types/core';

/**
 * Types of friction that can occur during development
 */
export enum FrictionType {
  SYNTAX = 'SYNTAX',
  DEPENDENCY = 'DEPENDENCY',
  CONFIGURATION = 'CONFIGURATION',
  CONNECTIVITY = 'CONNECTIVITY',
  PERFORMANCE = 'PERFORMANCE',
  ARCHITECTURAL = 'ARCHITECTURAL',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Represents a specific friction point in the development process
 */
export interface FrictionPoint {
  id: string;
  type: FrictionType;
  severity: SeverityLevel;
  description: string;
  location: FrictionLocation;
  impact: FrictionImpact;
  detectedAt: number;
  metadata: FrictionMetadata;
}

/**
 * Location information for friction points
 */
export interface FrictionLocation {
  file?: string;
  line?: number;
  column?: number;
  function?: string;
  scope: string[];
  context: string;
}

/**
 * Impact assessment of friction on development flow
 */
export interface FrictionImpact {
  flowDisruption: number; // 0.0 to 1.0
  timeDelay: number; // milliseconds
  cognitiveLoad: number; // 0.0 to 1.0
  blockingPotential: number; // 0.0 to 1.0
}

/**
 * Metadata for friction points
 */
export interface FrictionMetadata {
  confidence: number;
  recurrence: number;
  lastOccurrence?: number;
  resolutionHistory: ResolutionAttempt[];
  tags: string[];
}

/**
 * Record of previous resolution attempts
 */
export interface ResolutionAttempt {
  timestamp: number;
  strategy: string;
  success: boolean;
  duration: number;
  notes?: string;
}

/**
 * Result of friction elimination attempt
 */
export interface EliminationResult {
  success: boolean;
  frictionPoint: FrictionPoint;
  strategy: EliminationStrategy;
  duration: number;
  rollbackPlan?: RollbackPlan;
  error?: string;
}

/**
 * Strategy for eliminating friction
 */
export interface EliminationStrategy {
  name: string;
  type: 'AUTO_CORRECTION' | 'TRANSFORMATION' | 'CONFIGURATION' | 'INSTALLATION';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  steps: EliminationStep[];
}

/**
 * Individual step in elimination strategy
 */
export interface EliminationStep {
  description: string;
  action: () => Promise<void>;
  rollback: () => Promise<void>;
  validation: () => Promise<boolean>;
}

/**
 * Plan for rolling back elimination attempts
 */
export interface RollbackPlan {
  steps: Array<() => Promise<void>>;
  timeout: number;
  validation: () => Promise<boolean>;
}

/**
 * Abstract base class for friction detectors
 */
export abstract class FrictionDetector {
  protected detectedFriction: Map<string, FrictionPoint> = new Map();
  protected eliminationHistory: EliminationResult[] = [];

  constructor(
    public readonly type: FrictionType,
    protected config: FrictionDetectorConfig = DEFAULT_FRICTION_CONFIG
  ) {}

  /**
   * Detect friction points in the current context
   */
  public abstract detectFriction(context: any): Promise<FrictionPoint[]>;

  /**
   * Eliminate a specific friction point
   */
  public abstract eliminateFriction(friction: FrictionPoint): Promise<EliminationResult>;

  /**
   * Get all currently detected friction points
   */
  public getDetectedFriction(): FrictionPoint[] {
    return Array.from(this.detectedFriction.values());
  }

  /**
   * Get elimination history
   */
  public getEliminationHistory(): EliminationResult[] {
    return [...this.eliminationHistory];
  }

  /**
   * Clear resolved friction points
   */
  public clearResolvedFriction(): void {
    const now = Date.now();
    const staleThreshold = this.config.staleThreshold;

    for (const [id, friction] of this.detectedFriction.entries()) {
      if (now - friction.detectedAt > staleThreshold) {
        this.detectedFriction.delete(id);
      }
    }
  }

  /**
   * Create a friction point with standard structure
   */
  protected createFrictionPoint(
    type: FrictionType,
    severity: SeverityLevel,
    description: string,
    location: FrictionLocation,
    impact: FrictionImpact,
    metadata: Partial<FrictionMetadata> = {}
  ): FrictionPoint {
    const id = this.generateFrictionId(type, location);
    
    return {
      id,
      type,
      severity,
      description,
      location,
      impact,
      detectedAt: Date.now(),
      metadata: {
        confidence: 0.8,
        recurrence: 1,
        resolutionHistory: [],
        tags: [],
        ...metadata
      }
    };
  }

  /**
   * Generate unique ID for friction point
   */
  protected generateFrictionId(type: FrictionType, location: FrictionLocation): string {
    const locationStr = `${location.file || 'unknown'}:${location.line || 0}:${location.column || 0}`;
    return `${type}_${locationStr}_${Date.now()}`;
  }

  /**
   * Execute elimination with rollback capability
   */
  protected async executeWithRollback(
    strategy: EliminationStrategy,
    friction: FrictionPoint
  ): Promise<EliminationResult> {
    const startTime = Date.now();
    const rollbackSteps: Array<() => Promise<void>> = [];

    try {
      // Execute elimination steps
      for (const step of strategy.steps) {
        await step.action();
        rollbackSteps.unshift(step.rollback); // Add to front for reverse order
        
        // Validate step success
        const isValid = await step.validation();
        if (!isValid) {
          throw new Error(`Elimination step failed validation: ${step.description}`);
        }
      }

      const result: EliminationResult = {
        success: true,
        frictionPoint: friction,
        strategy,
        duration: Date.now() - startTime,
        rollbackPlan: {
          steps: rollbackSteps,
          timeout: this.config.rollbackTimeout,
          validation: () => this.validateFrictionEliminated(friction)
        }
      };

      this.eliminationHistory.push(result);
      return result;

    } catch (error) {
      // Rollback on failure
      await this.performRollback(rollbackSteps);

      const result: EliminationResult = {
        success: false,
        frictionPoint: friction,
        strategy,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.eliminationHistory.push(result);
      return result;
    }
  }

  /**
   * Perform rollback of elimination steps
   */
  protected async performRollback(rollbackSteps: Array<() => Promise<void>>): Promise<void> {
    for (const rollback of rollbackSteps) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Rollback step failed:', rollbackError);
      }
    }
  }

  /**
   * Validate that friction has been eliminated
   */
  protected async validateFrictionEliminated(friction: FrictionPoint): Promise<boolean> {
    // Re-detect friction in the same location
    const currentFriction = await this.detectFriction(friction.location);
    return !currentFriction.some(f => f.id === friction.id);
  }

  /**
   * Record successful elimination
   */
  protected recordSuccessfulElimination(friction: FrictionPoint, strategy: string): void {
    const attempt: ResolutionAttempt = {
      timestamp: Date.now(),
      strategy,
      success: true,
      duration: 0
    };

    friction.metadata.resolutionHistory.push(attempt);
    this.detectedFriction.delete(friction.id);
  }
}

/**
 * Configuration for friction detectors
 */
export interface FrictionDetectorConfig {
  enabled: boolean;
  sensitivity: number; // 0.0 to 1.0
  staleThreshold: number; // milliseconds
  rollbackTimeout: number; // milliseconds
  maxRetries: number;
}

/**
 * Default friction detector configuration
 */
export const DEFAULT_FRICTION_CONFIG: FrictionDetectorConfig = {
  enabled: true,
  sensitivity: 0.8,
  staleThreshold: 300000, // 5 minutes
  rollbackTimeout: 10000, // 10 seconds
  maxRetries: 3
};