/**
 * Process Manager - Handles graceful shutdown and resource cleanup
 * Fixes memory issues and process termination problems
 */

import { Logger } from '../logging/logger';
import { PlatformType } from '../types/core';

export class ProcessManager {
  private static instance: ProcessManager;
  private logger: Logger;
  private cleanupHandlers: (() => Promise<void>)[] = [];
  private isShuttingDown = false;

  private constructor() {
    this.logger = new Logger(PlatformType.NODE);
    this.setupSignalHandlers();
  }

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  /**
   * Register a cleanup handler to be called on shutdown
   */
  registerCleanupHandler(handler: () => Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes, etc.)
    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, initiating graceful shutdown...');
      this.gracefulShutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, initiating graceful shutdown...');
      this.gracefulShutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection:', reason);
      this.logger.error('Promise:', promise);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle memory warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        this.logger.warn('Memory warning - too many listeners:', warning.message);
      }
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    this.isShuttingDown = true;
    this.logger.info(`Starting graceful shutdown due to ${signal}...`);

    try {
      // Set a timeout for cleanup
      const cleanupTimeout = setTimeout(() => {
        this.logger.error('Cleanup timeout reached, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds

      // Run all cleanup handlers
      await Promise.all(
        this.cleanupHandlers.map(async (handler, index) => {
          try {
            this.logger.debug(`Running cleanup handler ${index + 1}/${this.cleanupHandlers.length}`);
            await handler();
          } catch (error) {
            this.logger.error(`Cleanup handler ${index + 1} failed:`, error);
          }
        })
      );

      clearTimeout(cleanupTimeout);
      this.logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Monitor memory usage and warn if high
   */
  startMemoryMonitoring(intervalMs: number = 30000): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(usage.rss / 1024 / 1024);

      // Warn if memory usage is high
      if (heapUsedMB > 512) { // 512MB threshold
        this.logger.warn(`High memory usage: ${heapUsedMB}MB heap used, ${rssMB}MB RSS`);
      }

      // Log memory stats periodically
      this.logger.debug(`Memory usage: ${heapUsedMB}/${heapTotalMB}MB heap, ${rssMB}MB RSS`);

      // Force garbage collection if available and memory is high
      if (global.gc && heapUsedMB > 256) {
        this.logger.debug('Running garbage collection...');
        global.gc();
      }
    }, intervalMs);
  }

  /**
   * Check if a port is in use and kill the process using it
   */
  async killProcessOnPort(port: number): Promise<void> {
    try {
      const { spawn } = require('child_process');
      
      // Find process using the port
      const lsof = spawn('lsof', ['-ti', `:${port}`]);
      let pid = '';
      
      lsof.stdout.on('data', (data: Buffer) => {
        pid += data.toString();
      });

      lsof.on('close', (code) => {
        if (code === 0 && pid.trim()) {
          const processId = pid.trim();
          this.logger.info(`Killing process ${processId} on port ${port}`);
          
          // Kill the process
          const kill = spawn('kill', ['-9', processId]);
          kill.on('close', (killCode) => {
            if (killCode === 0) {
              this.logger.info(`Successfully killed process on port ${port}`);
            } else {
              this.logger.warn(`Failed to kill process on port ${port}`);
            }
          });
        }
      });

    } catch (error) {
      this.logger.warn(`Failed to kill process on port ${port}:`, error);
    }
  }

  /**
   * Get system resource usage
   */
  getResourceUsage(): any {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime()),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    };
  }
}

// Export singleton instance
export const processManager = ProcessManager.getInstance();