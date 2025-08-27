/**
 * Performance Monitor for Sherlock Ω
 * Tracks system performance, resource usage, and metrics
 */

import { Logger } from '../logging/logger';

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export interface OperationMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: any;
}

export enum MetricType {
  EXECUTION_TIME = 'execution_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  ERROR_RATE = 'error_rate',
  THROUGHPUT = 'throughput',
  RESPONSE_TIME = 'response_time'
}

export class PerformanceMonitor {
  private logger: Logger;
  private startTime: number;
  private operations: Map<string, OperationMetrics> = new Map();
  private completedOperations: OperationMetrics[] = [];
  private maxHistorySize: number = 1000;
  private cleanupInterval?: NodeJS.Timeout;
  private metrics: Map<string, any> = new Map();

  constructor(loggerOrConfig: Logger | any) {
    // Handle both Logger instances and other config types
    if (loggerOrConfig && typeof loggerOrConfig.info === 'function') {
      this.logger = loggerOrConfig;
    } else {
      // Create a new logger if not provided or if config is provided
      this.logger = new Logger();
    }
    this.startTime = Date.now();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Start tracking an operation
   */
  startOperation(name: string, metadata?: any): string {
    const operationId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: OperationMetrics = {
      name,
      startTime: Date.now(),
      success: false,
      metadata
    };

    this.operations.set(operationId, operation);
    this.logger.debug(`Started operation: ${name}`, { operationId, metadata });

    return operationId;
  }

  /**
   * End tracking an operation
   */
  endOperation(operationId: string, success: boolean = true, error?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      this.logger.warn(`Operation not found: ${operationId}`);
      return;
    }

    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.success = success;
    operation.error = error;

    // Move to completed operations
    this.completedOperations.push(operation);
    this.operations.delete(operationId);

    // Maintain history size
    if (this.completedOperations.length > this.maxHistorySize) {
      this.completedOperations.shift();
    }

    this.logger.debug(`Completed operation: ${operation.name}`, {
      operationId,
      duration: operation.duration,
      success,
      error
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate derived metrics
    const totalOperations = this.completedOperations.length;
    const successfulOperations = this.completedOperations.filter(op => op.success).length;
    const errorRate = totalOperations > 0 ? (totalOperations - successfulOperations) / totalOperations : 0;
    
    const recentOperations = this.completedOperations.slice(-100);
    const avgResponseTime = recentOperations.length > 0 
      ? recentOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / recentOperations.length
      : 0;

    const uptime = Date.now() - this.startTime;
    const throughput = totalOperations > 0 ? totalOperations / (uptime / 1000) : 0;

    return {
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      responseTime: avgResponseTime,
      throughput,
      errorRate: errorRate * 100,
      uptime
    };
  }

  /**
   * Get specific metrics by name
   */
  getMetricsByName(name: string): any[] {
    const results: any[] = [];
    for (const [key, metric] of this.metrics.entries()) {
      if (key.startsWith(name)) {
        results.push(metric);
      }
    }
    return results;
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): {
    active: number;
    completed: number;
    successRate: number;
    averageDuration: number;
    operationsByType: Record<string, number>;
  } {
    const completed = this.completedOperations.length;
    const successful = this.completedOperations.filter(op => op.success).length;
    const successRate = completed > 0 ? (successful / completed) * 100 : 100;
    
    const avgDuration = completed > 0
      ? this.completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completed
      : 0;

    const operationsByType: Record<string, number> = {};
    this.completedOperations.forEach(op => {
      operationsByType[op.name] = (operationsByType[op.name] || 0) + 1;
    });

    return {
      active: this.operations.size,
      completed,
      successRate,
      averageDuration: avgDuration,
      operationsByType
    };
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit: number = 10): OperationMetrics[] {
    return this.completedOperations.slice(-limit);
  }

  /**
   * Get operations by name
   */
  getOperationsByName(name: string): OperationMetrics[] {
    return this.completedOperations.filter(op => op.name === name);
  }

  /**
   * Time an async operation and record metrics
   */
  async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const operationId = this.startOperation(name);
    
    try {
      const result = await operation();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.endOperation(operationId, false, errorMessage);
      throw error;
    }
  }

  /**
   * Time a synchronous operation and record metrics
   */
  timeSync<T>(name: string, operation: () => T): T {
    const operationId = this.startOperation(name);
    
    try {
      const result = operation();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.endOperation(operationId, false, errorMessage);
      throw error;
    }
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, type: MetricType | string, context?: Record<string, unknown>): void {
    const metric = {
      name,
      value,
      type: typeof type === 'string' ? type : (type as string),
      timestamp: Date.now(),
      context
    };
    
    this.metrics.set(`${name}-${Date.now()}`, metric);
    this.logger.debug(`Recorded metric: ${name}`, { value, type, context });
  }

  /**
   * Stop the cleanup interval (called during shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.completedOperations = [];
    this.logger.info('Performance monitor history cleared');
  }

  /**
   * Get system resource usage
   */
  getResourceUsage(): {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    loadAverage?: number[];
  } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : undefined
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    return {
      metrics: this.getMetrics(),
      operations: this.getOperationStats(),
      uptime: Date.now() - this.startTime,
      resourceUsage: this.getResourceUsage()
    };
  }

  /**
   * Get evolution metrics
   */
  async getEvolutionMetrics(): Promise<any> {
    const baseMetrics = this.getMetrics();
    const stats = this.getOperationStats();
    return {
      ...baseMetrics,
      evolutionCycles: this.completedOperations.filter(op => op.name.includes('evolution')).length,
      adaptationRate: stats.successRate,
      systemHealth: baseMetrics.errorRate < 10 ? 'healthy' : 'degraded'
    };
  }

  /**
   * Get performance metrics (alias for compatibility)
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.getMetrics();
  }

  /**
   * Identify system bottlenecks
   */
  async identifyBottlenecks(): Promise<string[]> {
    const stats = this.getOperationStats();
    const bottlenecks: string[] = [];
    
    if (stats.averageDuration > 5000) {
      bottlenecks.push('High average operation duration');
    }
    
    if (stats.successRate < 90) {
      bottlenecks.push('Low success rate');
    }
    
    const metrics = this.getMetrics();
    if (metrics.memoryUsage.percentage > 80) {
      bottlenecks.push('High memory usage');
    }
    
    return bottlenecks;
  }

  /**
   * Cleanup old metrics and operations
   */
  private cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    // Clean old metrics
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(key);
      }
    }
  }

  /**
   * Destroy monitor and cleanup resources
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.operations.clear();
    this.completedOperations = [];
    this.metrics.clear();
  }

  /**
   * Monitor a function execution
   */
  async monitor<T>(name: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    const operationId = this.startOperation(name, metadata);
    
    try {
      const result = await fn();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      this.endOperation(operationId, false, (error as Error).message);
      throw error;
    }
  }

  /**
   * Monitor a synchronous function execution
   */
  monitorSync<T>(name: string, fn: () => T, metadata?: any): T {
    const operationId = this.startOperation(name, metadata);
    
    try {
      const result = fn();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      this.endOperation(operationId, false, (error as Error).message);
      throw error;
    }
  }
}