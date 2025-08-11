/**
 * Simplified Zero-Friction Protocol for Sherlock Ω
 * Orchestrates multiple friction detectors and manages elimination workflows
 */

import { FrictionDetector, FrictionPoint } from './BaseFrictionDetector';
import { DependencyFrictionDetector } from './DependencyFrictionDetector';

/**
 * Protocol execution result
 */
export interface ProtocolResult {
  totalFriction: number;
  eliminatedFriction: number;
  failedElimination: number;
  detectorResults: DetectorResult[];
  executionTime: number;
}

/**
 * Individual detector execution result
 */
export interface DetectorResult {
  detectorName: string;
  frictionDetected: number;
  frictionEliminated: number;
  frictionFailed: number;
  executionTime: number;
  errors: string[];
}

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  autoEliminate: boolean;
  parallelExecution: boolean;
  maxConcurrentDetectors: number;
  timeoutMs: number;
}

/**
 * Default protocol configuration
 */
export const DEFAULT_PROTOCOL_CONFIG: ProtocolConfig = {
  autoEliminate: true,
  parallelExecution: true,
  maxConcurrentDetectors: 5,
  timeoutMs: 30000 // 30 seconds
};

/**
 * Simplified Zero-Friction Protocol implementation
 */
export class SimpleZeroFrictionProtocol {
  private detectors: FrictionDetector<FrictionPoint>[];
  private config: ProtocolConfig;
  private executionHistory: ProtocolResult[] = [];

  constructor(
    detectors: FrictionDetector<FrictionPoint>[], 
    config: ProtocolConfig = DEFAULT_PROTOCOL_CONFIG
  ) {
    this.detectors = detectors;
    this.config = config;
  }

  /**
   * Run all detectors on the given context and attempt elimination
   * @param context Arbitrary context (e.g., file text, project state)
   * @returns Protocol execution result with all friction points
   */
  async run(context: any): Promise<ProtocolResult> {
    const startTime = Date.now();
    const detectorResults: DetectorResult[] = [];
    const allFrictionPoints: FrictionPoint[] = [];

    try {
      if (this.config.parallelExecution) {
        // Run detectors in parallel
        const results = await this.runDetectorsInParallel(context);
        detectorResults.push(...results.detectorResults);
        allFrictionPoints.push(...results.allFriction);
      } else {
        // Run detectors sequentially
        const results = await this.runDetectorsSequentially(context);
        detectorResults.push(...results.detectorResults);
        allFrictionPoints.push(...results.allFriction);
      }

      const executionTime = Date.now() - startTime;
      
      // Calculate totals
      const totalFriction = allFrictionPoints.length;
      const eliminatedFriction = allFrictionPoints.filter(p => p.eliminated).length;
      const failedElimination = allFrictionPoints.filter(p => p.attempted && !p.eliminated).length;

      const result: ProtocolResult = {
        totalFriction,
        eliminatedFriction,
        failedElimination,
        detectorResults,
        executionTime
      };

      // Store in history
      this.executionHistory.push(result);
      
      // Log summary
      this.logExecutionSummary(result);

      return result;

    } catch (error) {
      console.error('Protocol execution failed:', error);
      
      const executionTime = Date.now() - startTime;
      const errorResult: ProtocolResult = {
        totalFriction: 0,
        eliminatedFriction: 0,
        failedElimination: 0,
        detectorResults: [{
          detectorName: 'Protocol',
          frictionDetected: 0,
          frictionEliminated: 0,
          frictionFailed: 0,
          executionTime,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }],
        executionTime
      };

      this.executionHistory.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Run detectors in parallel with concurrency control
   */
  private async runDetectorsInParallel(context: any): Promise<{
    detectorResults: DetectorResult[];
    allFriction: FrictionPoint[];
  }> {
    const detectorResults: DetectorResult[] = [];
    const allFriction: FrictionPoint[] = [];

    // Process detectors in batches to respect concurrency limits
    const batches = this.createBatches(this.detectors, this.config.maxConcurrentDetectors);

    for (const batch of batches) {
      const batchPromises = batch.map(detector => this.runSingleDetector(detector, context));
      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        detectorResults.push(result.detectorResult);
        allFriction.push(...result.frictionPoints);
      }
    }

    return { detectorResults, allFriction };
  }

  /**
   * Run detectors sequentially
   */
  private async runDetectorsSequentially(context: any): Promise<{
    detectorResults: DetectorResult[];
    allFriction: FrictionPoint[];
  }> {
    const detectorResults: DetectorResult[] = [];
    const allFriction: FrictionPoint[] = [];

    for (const detector of this.detectors) {
      const result = await this.runSingleDetector(detector, context);
      detectorResults.push(result.detectorResult);
      allFriction.push(...result.frictionPoints);
    }

    return { detectorResults, allFriction };
  }

  /**
   * Run a single detector with error handling and timeout
   */
  private async runSingleDetector(
    detector: FrictionDetector<FrictionPoint>, 
    context: any
  ): Promise<{
    detectorResult: DetectorResult;
    frictionPoints: FrictionPoint[];
  }> {
    const startTime = Date.now();
    const detectorName = detector.getName();
    const errors: string[] = [];
    let frictionPoints: FrictionPoint[] = [];

    try {
      // Detection phase
      const detectionResult = await Promise.race([
        Promise.resolve(detector.detect(context)),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Detection timeout')), this.config.timeoutMs)
        )
      ]);

      frictionPoints = Array.isArray(detectionResult) ? detectionResult : [];

      // Elimination phase (if enabled)
      if (this.config.autoEliminate) {
        for (const point of frictionPoints) {
          try {
            await detector.eliminate(point);
          } catch (eliminationError) {
            const errorMsg = eliminationError instanceof Error 
              ? eliminationError.message 
              : 'Unknown elimination error';
            errors.push(`Elimination failed for ${point.id}: ${errorMsg}`);
          }
        }
      }

    } catch (detectionError) {
      const errorMsg = detectionError instanceof Error 
        ? detectionError.message 
        : 'Unknown detection error';
      errors.push(`Detection failed: ${errorMsg}`);
    }

    const executionTime = Date.now() - startTime;
    const frictionEliminated = frictionPoints.filter(p => p.eliminated).length;
    const frictionFailed = frictionPoints.filter(p => p.attempted && !p.eliminated).length;

    const detectorResult: DetectorResult = {
      detectorName,
      frictionDetected: frictionPoints.length,
      frictionEliminated,
      frictionFailed,
      executionTime,
      errors
    };

    return { detectorResult, frictionPoints };
  }

  /**
   * Create batches for parallel processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Log execution summary
   */
  private logExecutionSummary(result: ProtocolResult): void {
    console.log('\n🎯 Zero-Friction Protocol Execution Summary');
    console.log('='.repeat(45));
    console.log(`Total friction detected: ${result.totalFriction}`);
    console.log(`Friction eliminated: ${result.eliminatedFriction}`);
    console.log(`Failed eliminations: ${result.failedElimination}`);
    console.log(`Execution time: ${result.executionTime}ms`);
    
    if (result.detectorResults.length > 0) {
      console.log('\nDetector Results:');
      for (const dr of result.detectorResults) {
        console.log(`  ${dr.detectorName}: ${dr.frictionDetected} detected, ${dr.frictionEliminated} eliminated`);
        if (dr.errors.length > 0) {
          console.log(`    Errors: ${dr.errors.join(', ')}`);
        }
      }
    }
    console.log('');
  }

  /**
   * Add a new detector to the protocol
   */
  addDetector(detector: FrictionDetector<FrictionPoint>): void {
    this.detectors.push(detector);
  }

  /**
   * Remove a detector from the protocol
   */
  removeDetector(detectorName: string): boolean {
    const initialLength = this.detectors.length;
    this.detectors = this.detectors.filter(d => d.getName() !== detectorName);
    return this.detectors.length < initialLength;
  }

  /**
   * Get all registered detectors
   */
  getDetectors(): FrictionDetector<FrictionPoint>[] {
    return [...this.detectors];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ProtocolResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get protocol statistics
   */
  getProtocolStats(): ProtocolStats {
    if (this.executionHistory.length === 0) {
      return {
        totalExecutions: 0,
        averageExecutionTime: 0,
        totalFrictionDetected: 0,
        totalFrictionEliminated: 0,
        overallEliminationRate: 0,
        detectorPerformance: {}
      };
    }

    const totalExecutions = this.executionHistory.length;
    const totalExecutionTime = this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0);
    const totalFrictionDetected = this.executionHistory.reduce((sum, r) => sum + r.totalFriction, 0);
    const totalFrictionEliminated = this.executionHistory.reduce((sum, r) => sum + r.eliminatedFriction, 0);

    // Calculate detector performance
    const detectorPerformance: Record<string, DetectorPerformance> = {};
    
    for (const result of this.executionHistory) {
      for (const dr of result.detectorResults) {
        if (!detectorPerformance[dr.detectorName]) {
          detectorPerformance[dr.detectorName] = {
            totalDetected: 0,
            totalEliminated: 0,
            totalErrors: 0,
            averageExecutionTime: 0,
            executionCount: 0
          };
        }
        
        const perf = detectorPerformance[dr.detectorName];
        perf.totalDetected += dr.frictionDetected;
        perf.totalEliminated += dr.frictionEliminated;
        perf.totalErrors += dr.errors.length;
        perf.averageExecutionTime = (perf.averageExecutionTime * perf.executionCount + dr.executionTime) / (perf.executionCount + 1);
        perf.executionCount++;
      }
    }

    return {
      totalExecutions,
      averageExecutionTime: totalExecutionTime / totalExecutions,
      totalFrictionDetected,
      totalFrictionEliminated,
      overallEliminationRate: totalFrictionDetected > 0 ? totalFrictionEliminated / totalFrictionDetected : 0,
      detectorPerformance
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}

/**
 * Protocol statistics interface
 */
export interface ProtocolStats {
  totalExecutions: number;
  averageExecutionTime: number;
  totalFrictionDetected: number;
  totalFrictionEliminated: number;
  overallEliminationRate: number;
  detectorPerformance: Record<string, DetectorPerformance>;
}

/**
 * Individual detector performance metrics
 */
export interface DetectorPerformance {
  totalDetected: number;
  totalEliminated: number;
  totalErrors: number;
  averageExecutionTime: number;
  executionCount: number;
}