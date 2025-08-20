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

export class PerformanceMonitor {
  private logger: Logger;
  private startTime: number;
  private operations: Map<string, OperationMetrics> = new Map();
  private completedOperations: OperationMetrics[] = [];
  private maxHistorySize: number = 1000;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = Date.now();
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
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to milliseconds
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      responseTime: avgResponseTime,
      throughput,
      errorRate: errorRate * 100, // Convert to percentage
      uptime
    };
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