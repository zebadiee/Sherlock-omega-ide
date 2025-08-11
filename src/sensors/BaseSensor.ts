/**
 * Base Sensor Implementation for Sherlock Ω Omniscient Monitoring System
 * Provides common functionality for all sensor types
 */

import { 
  SensorInterface, 
  SensorResult, 
  SensorStatus, 
  SensorType,
  ComputationalIssue 
} from '../types/core';

/**
 * Sensor configuration options
 */
export interface SensorConfig {
  enabled: boolean;
  monitoringInterval: number; // milliseconds
  maxRetries: number;
  timeout: number; // milliseconds
  sensitivity: number; // 0.0 to 1.0
  bufferSize: number;
}

/**
 * Default sensor configuration
 */
export const DEFAULT_SENSOR_CONFIG: SensorConfig = {
  enabled: true,
  monitoringInterval: 100, // 100ms for real-time monitoring
  maxRetries: 3,
  timeout: 5000, // 5 seconds
  sensitivity: 0.8,
  bufferSize: 1000
};

/**
 * Sensor metrics for performance monitoring
 */
export interface SensorMetrics {
  totalMonitoringCycles: number;
  successfulCycles: number;
  failedCycles: number;
  averageResponseTime: number;
  lastSuccessfulMonitoring: number;
  lastFailure?: {
    timestamp: number;
    error: string;
    retryCount: number;
  };
}

/**
 * Abstract base class for all sensors in the omniscient monitoring system
 * Implements common functionality and error handling patterns
 */
export abstract class BaseSensor implements SensorInterface {
  protected config: SensorConfig;
  protected status: SensorStatus;
  protected metrics: SensorMetrics;
  protected isMonitoring: boolean = false;
  protected monitoringInterval?: ReturnType<typeof setInterval>;
  protected resultBuffer: SensorResult[] = [];

  constructor(
    public readonly type: SensorType,
    config: Partial<SensorConfig> = {}
  ) {
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...config };
    this.status = SensorStatus.INACTIVE;
    this.metrics = {
      totalMonitoringCycles: 0,
      successfulCycles: 0,
      failedCycles: 0,
      averageResponseTime: 0,
      lastSuccessfulMonitoring: 0
    };
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring || !this.config.enabled) {
      return;
    }

    this.isMonitoring = true;
    this.status = SensorStatus.ACTIVE;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitor();
      } catch (error) {
        console.error(`Sensor ${this.type} monitoring error:`, error);
        await this.handleFailure(error as Error);
      }
    }, this.config.monitoringInterval);

    console.log(`🔍 ${this.type} sensor started monitoring`);
  }

  /**
   * Stop continuous monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.status = SensorStatus.INACTIVE;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log(`⏹️ ${this.type} sensor stopped monitoring`);
  }

  /**
   * Main monitoring method - must be implemented by concrete sensors
   */
  public async monitor(): Promise<SensorResult> {
    const startTime = Date.now();
    this.metrics.totalMonitoringCycles++;

    try {
      // Call the concrete sensor's monitoring logic
      const result = await this.performMonitoring();
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateSuccessMetrics(responseTime);
      
      // Buffer the result
      this.bufferResult(result);
      
      return result;
    } catch (error) {
      this.metrics.failedCycles++;
      throw error;
    }
  }

  /**
   * Abstract method for concrete sensor monitoring logic
   * Must be implemented by each sensor type
   */
  protected abstract performMonitoring(): Promise<SensorResult>;

  /**
   * Handle sensor failures with retry logic and recovery
   */
  public async handleFailure(error: Error): Promise<void> {
    this.status = SensorStatus.FAILED;
    this.metrics.lastFailure = {
      timestamp: Date.now(),
      error: error.message,
      retryCount: 0
    };

    console.error(`❌ ${this.type} sensor failure:`, error.message);

    // Attempt recovery with exponential backoff
    await this.attemptRecovery(error);
  }

  /**
   * Get current sensor status
   */
  public getStatus(): SensorStatus {
    return this.status;
  }

  /**
   * Get sensor metrics
   */
  public getMetrics(): SensorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent sensor results from buffer
   */
  public getRecentResults(count: number = 10): SensorResult[] {
    return this.resultBuffer.slice(-count);
  }

  /**
   * Update sensor configuration
   */
  public updateConfig(newConfig: Partial<SensorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed and currently monitoring
    if (this.isMonitoring && newConfig.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Reset sensor metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalMonitoringCycles: 0,
      successfulCycles: 0,
      failedCycles: 0,
      averageResponseTime: 0,
      lastSuccessfulMonitoring: 0
    };
  }

  /**
   * Check if sensor is healthy based on recent performance
   */
  public isHealthy(): boolean {
    const { successfulCycles, failedCycles, lastSuccessfulMonitoring } = this.metrics;
    const totalCycles = successfulCycles + failedCycles;
    
    if (totalCycles === 0) return true; // No data yet
    
    const successRate = successfulCycles / totalCycles;
    const timeSinceLastSuccess = Date.now() - lastSuccessfulMonitoring;
    
    return successRate >= 0.8 && timeSinceLastSuccess < 30000; // 80% success rate, last success within 30s
  }

  // Protected helper methods

  /**
   * Update metrics after successful monitoring
   */
  protected updateSuccessMetrics(responseTime: number): void {
    this.metrics.successfulCycles++;
    this.metrics.lastSuccessfulMonitoring = Date.now();
    
    // Update average response time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  /**
   * Buffer sensor result for historical analysis
   */
  protected bufferResult(result: SensorResult): void {
    this.resultBuffer.push(result);
    
    // Maintain buffer size limit
    if (this.resultBuffer.length > this.config.bufferSize) {
      this.resultBuffer.shift();
    }
  }

  /**
   * Attempt sensor recovery with exponential backoff
   */
  protected async attemptRecovery(error: Error): Promise<void> {
    const maxRetries = this.config.maxRetries;
    let retryCount = 0;

    this.status = SensorStatus.RECOVERING;

    while (retryCount < maxRetries) {
      try {
        // Wait with exponential backoff
        const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, etc.
        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // Attempt recovery
        await this.performRecovery();
        
        // Test if recovery was successful
        await this.performMonitoring();
        
        // Recovery successful
        this.status = SensorStatus.ACTIVE;
        console.log(`✅ ${this.type} sensor recovered after ${retryCount + 1} attempts`);
        return;

      } catch (recoveryError) {
        retryCount++;
        console.warn(`🔄 ${this.type} sensor recovery attempt ${retryCount} failed:`, recoveryError);
        
        if (this.metrics.lastFailure) {
          this.metrics.lastFailure.retryCount = retryCount;
        }
      }
    }

    // All recovery attempts failed
    this.status = SensorStatus.FAILED;
    console.error(`💀 ${this.type} sensor recovery failed after ${maxRetries} attempts`);
  }

  /**
   * Perform sensor-specific recovery logic
   * Can be overridden by concrete sensors
   */
  protected async performRecovery(): Promise<void> {
    // Default recovery: reset internal state
    this.resultBuffer = [];
  }

  /**
   * Create a standard sensor result structure
   */
  protected createSensorResult(
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL',
    issues: ComputationalIssue[] = [],
    customMetrics: Record<string, number> = {}
  ): SensorResult {
    return {
      timestamp: Date.now(),
      status,
      issues,
      metrics: {
        responseTime: this.metrics.averageResponseTime,
        successRate: this.metrics.totalMonitoringCycles > 0 
          ? this.metrics.successfulCycles / this.metrics.totalMonitoringCycles 
          : 1.0,
        ...customMetrics
      }
    };
  }

  /**
   * Determine overall status based on issues
   */
  protected determineStatus(issues: ComputationalIssue[]): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (issues.length === 0) return 'HEALTHY';
    
    const hasBlocking = issues.some(issue => issue.severity >= 5);
    const hasCritical = issues.some(issue => issue.severity >= 4);
    
    if (hasBlocking) return 'CRITICAL';
    if (hasCritical) return 'CRITICAL';
    
    return 'WARNING';
  }
}