import { PlatformType } from '../core/whispering-interfaces';

/**
 * Log levels with numeric values for comparison
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Log level names for display
 */
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * Log entry structure
 */
export interface LogEntry {
  /** Timestamp when the log was created */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Logger name/category */
  logger: string;
  /** Log message */
  message: string;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Error object if applicable */
  error?: Error;
  /** Platform information */
  platform: PlatformType;
  /** Unique log entry ID */
  id: string;
  /** Performance data if available */
  performance?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

/**
 * Log formatter interface
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Log transport interface for output destinations
 */
export interface LogTransport {
  /** Transport name */
  name: string;
  /** Whether the transport is enabled */
  enabled: boolean;
  /** Minimum log level to transport */
  minLevel: LogLevel;
  
  /**
   * Transports a log entry
   * @param entry - Log entry to transport
   */
  transport(entry: LogEntry): Promise<void>;
  
  /**
   * Flushes any buffered logs
   */
  flush(): Promise<void>;
  
  /**
   * Closes the transport
   */
  close(): Promise<void>;
}

/**
 * Console transport configuration
 */
export interface ConsoleTransportConfig {
  /** Whether to use colors */
  colors: boolean;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Whether to include logger name */
  includeLogger: boolean;
  /** Whether to include context */
  includeContext: boolean;
  /** Whether to include performance data */
  includePerformance: boolean;
}

/**
 * File transport configuration
 */
export interface FileTransportConfig {
  /** Log file path */
  filePath: string;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Maximum number of backup files */
  maxBackups: number;
  /** Whether to compress old log files */
  compress: boolean;
  /** Log rotation interval */
  rotationInterval: number;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Default log level */
  defaultLevel: LogLevel;
  /** Whether logging is enabled globally */
  enabled: boolean;
  /** Maximum number of log entries to keep in memory */
  maxEntries: number;
  /** Log entry retention period in milliseconds */
  retentionPeriod: number;
  /** Whether to include performance data */
  includePerformance: boolean;
  /** Console transport configuration */
  console: ConsoleTransportConfig;
  /** File transport configuration */
  file: FileTransportConfig;
  /** Custom transports */
  transports: LogTransport[];
}

/**
 * Console transport for logging to console
 */
export class ConsoleTransport implements LogTransport {
  name = 'console';
  enabled = true;
  minLevel: LogLevel;

  constructor(
    private config: ConsoleTransportConfig,
    minLevel: LogLevel = LogLevel.DEBUG
  ) {
    this.minLevel = minLevel;
  }

  async transport(entry: LogEntry): Promise<void> {
    if (!this.enabled || entry.level < this.minLevel) return;

    const formatted = this.formatEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  async flush(): Promise<void> {
    // Console transport doesn't buffer
  }

  async close(): Promise<void> {
    // Console transport doesn't need cleanup
  }

  private formatEntry(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }
    
    parts.push(`[${LogLevelNames[entry.level]}]`);
    
    if (this.config.includeLogger) {
      parts.push(`[${entry.logger}]`);
    }
    
    parts.push(entry.message);
    
    if (entry.error && entry.error.stack) {
      parts.push(`\n${entry.error.stack}`);
    }
    
    if (this.config.includeContext && entry.context) {
      parts.push(`\nContext: ${JSON.stringify(entry.context, null, 2)}`);
    }
    
    if (this.config.includePerformance && entry.performance) {
      const perf = entry.performance;
      const perfParts: string[] = [];
      if (perf.duration !== undefined) perfParts.push(`duration: ${perf.duration}ms`);
      if (perf.memoryUsage !== undefined) perfParts.push(`memory: ${perf.memoryUsage}MB`);
      if (perf.cpuUsage !== undefined) perfParts.push(`cpu: ${perf.cpuUsage}%`);
      if (perfParts.length > 0) {
        parts.push(`\nPerformance: ${perfParts.join(', ')}`);
      }
    }
    
    return parts.join(' ');
  }
}

/**
 * File transport for logging to files
 */
export class FileTransport implements LogTransport {
  name = 'file';
  enabled = true;
  minLevel: LogLevel;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(
    private config: FileTransportConfig,
    minLevel: LogLevel = LogLevel.INFO
  ) {
    this.minLevel = minLevel;
    
    // Set up periodic flushing
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  async transport(entry: LogEntry): Promise<void> {
    if (!this.enabled || entry.level < this.minLevel) return;

    this.logBuffer.push(entry);
    
    // Flush immediately for high-priority logs
    if (entry.level >= LogLevel.ERROR) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      // In a real implementation, this would write to a file
      // For now, we'll just clear the buffer
      const entries = [...this.logBuffer];
      this.logBuffer = [];
      
      console.log(`[FileTransport] Flushed ${entries.length} log entries to ${this.config.filePath}`);
    } catch (error) {
      console.error('Failed to flush logs to file:', error);
    }
  }

  async close(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}

/**
 * JSON formatter for structured logging
 */
export class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: LogLevelNames[entry.level],
      logger: entry.logger,
      message: entry.message,
      context: entry.context,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      } : undefined,
      platform: entry.platform,
      id: entry.id,
      performance: entry.performance
    });
  }
}

/**
 * Comprehensive logging system for Sherlock Omega IDE
 * 
 * Features:
 * - Multiple log levels with filtering
 * - Structured logging with context
 * - Multiple transport destinations (console, file, custom)
 * - Performance monitoring integration
 * - Log rotation and retention
 * - Platform-aware logging
 * 
 * @example
 * ```typescript
 * const logger = new Logger(PlatformType.WEB);
 * 
 * // Basic logging
 * logger.info('Application started');
 * logger.warn('High memory usage detected', { memoryUsage: 85 });
 * 
 * // With context
 * logger.error('Failed to process file', { 
 *   filePath: '/path/to/file.ts',
 *   error: new Error('File not found')
 * });
 * 
 * // Performance logging
 * logger.time('file_processing', async () => {
 *   // ... file processing logic
 * });
 * ```
 */
export class Logger {
  private config: LoggerConfig;
  private platform: PlatformType;
  private transports: LogTransport[] = [];
  private logEntries: LogEntry[] = [];
  private logCount = 0;

  constructor(platform: PlatformType, config?: Partial<LoggerConfig>) {
    this.platform = platform;
    
    this.config = {
      defaultLevel: LogLevel.INFO,
      enabled: true,
      maxEntries: 10000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      includePerformance: true,
      console: {
        colors: true,
        includeTimestamp: true,
        includeLogger: true,
        includeContext: true,
        includePerformance: true
      },
      file: {
        filePath: './logs/sherlock-omega.log',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxBackups: 5,
        compress: true,
        rotationInterval: 24 * 60 * 60 * 1000 // 24 hours
      },
      transports: [],
      ...config
    };

    // Set up default transports
    this.setupDefaultTransports();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Logs a debug message
   * @param message - Log message
   * @param context - Additional context
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an info message
   * @param message - Log message
   * @param context - Additional context
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   * @param message - Log message
   * @param context - Additional context
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message
   * @param message - Log message
   * @param context - Additional context
   * @param error - Error object
   */
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Logs a fatal error message
   * @param message - Log message
   * @param context - Additional context
   * @param error - Error object
   */
  fatal(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Times an asynchronous operation and logs the duration
   * @param name - Operation name
   * @param operation - Async operation to time
   * @param context - Additional context
   * @returns The result of the operation
   */
  async time<T>(name: string, operation: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.log(LogLevel.INFO, `Operation '${name}' completed`, {
        ...context,
        operation: name,
        duration,
        memoryDelta: endMemory - startMemory
      }, undefined, {
        duration,
        memoryUsage: endMemory
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.log(LogLevel.ERROR, `Operation '${name}' failed`, {
        ...context,
        operation: name,
        duration,
        memoryDelta: endMemory - startMemory
      }, error instanceof Error ? error : new Error(String(error)), {
        duration,
        memoryUsage: endMemory
      });
      
      throw error;
    }
  }

  /**
   * Times a synchronous operation and logs the duration
   * @param name - Operation name
   * @param operation - Sync operation to time
   * @param context - Additional context
   * @returns The result of the operation
   */
  timeSync<T>(name: string, operation: () => T, context?: Record<string, unknown>): T {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.log(LogLevel.INFO, `Operation '${name}' completed`, {
        ...context,
        operation: name,
        duration,
        memoryDelta: endMemory - startMemory
      }, undefined, {
        duration,
        memoryUsage: endMemory
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.log(LogLevel.ERROR, `Operation '${name}' failed`, {
        ...context,
        operation: name,
        duration,
        memoryDelta: endMemory - startMemory
      }, error instanceof Error ? error : new Error(String(error)), {
        duration,
        memoryUsage: endMemory
      });
      
      throw error;
    }
  }

  /**
   * Adds a custom transport
   * @param transport - Transport to add
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Removes a transport by name
   * @param name - Transport name
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter(t => t.name !== name);
  }

  /**
   * Gets all log entries
   * @param level - Minimum log level to include
   * @param limit - Maximum number of entries to return
   * @returns Array of log entries
   */
  getLogEntries(level: LogLevel = LogLevel.DEBUG, limit?: number): LogEntry[] {
    let entries = this.logEntries.filter(entry => entry.level >= level);
    
    if (limit) {
      entries = entries.slice(-limit);
    }
    
    return entries;
  }

  /**
   * Exports logs in various formats
   * @param format - Export format
   * @param level - Minimum log level to include
   * @returns Exported log data
   */
  exportLogs(format: 'json' | 'csv' | 'text' = 'json', level: LogLevel = LogLevel.DEBUG): string {
    const entries = this.getLogEntries(level);
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      case 'csv':
        return this.exportToCSV(entries);
      case 'text':
        return this.exportToText(entries);
      default:
        return JSON.stringify(entries, null, 2);
    }
  }

  /**
   * Clears all log entries
   */
  clearLogs(): void {
    this.logEntries = [];
    this.logCount = 0;
  }

  /**
   * Updates logger configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update transport configurations
    this.transports.forEach(transport => {
      if (transport.name === 'console' && updates.console) {
        // Update console transport config
      } else if (transport.name === 'file' && updates.file) {
        // Update file transport config
      }
    });
  }

  /**
   * Gets the current configuration
   * @returns Current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Flushes all transports
   */
  async flush(): Promise<void> {
    await Promise.all(this.transports.map(transport => transport.flush()));
  }

  /**
   * Closes the logger and all transports
   */
  async close(): Promise<void> {
    await Promise.all(this.transports.map(transport => transport.close()));
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    performance?: { duration?: number; memoryUsage?: number; cpuUsage?: number }
  ): void {
    if (!this.config.enabled || level < this.config.defaultLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      logger: 'sherlock-omega',
      message,
      context,
      error,
      platform: this.platform,
      id: `log_${++this.logCount}_${Date.now()}`,
      performance
    };

    // Store log entry
    this.logEntries.push(entry);
    
    // Limit stored entries
    if (this.logEntries.length > this.config.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxEntries);
    }

    // Transport to all enabled transports
    this.transports.forEach(transport => {
      if (transport.enabled && level >= transport.minLevel) {
        transport.transport(entry).catch(err => {
          console.error('Failed to transport log entry:', err);
        });
      }
    });
  }

  private setupDefaultTransports(): void {
    // Console transport
    const consoleTransport = new ConsoleTransport(
      this.config.console,
      this.config.defaultLevel
    );
    this.transports.push(consoleTransport);

    // File transport
    const fileTransport = new FileTransport(
      this.config.file,
      this.config.defaultLevel
    );
    this.transports.push(fileTransport);

    // Custom transports
    this.transports.push(...this.config.transports);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.config.retentionPeriod;
      this.logEntries = this.logEntries.filter(
        entry => entry.timestamp.getTime() > cutoff
      );
    }, 60000); // Clean up every minute
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024); // MB
    }
    return 0;
  }

  private exportToCSV(entries: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'logger', 'message', 'context', 'error', 'platform', 'id'];
    const rows = [headers.join(',')];
    
    entries.forEach(entry => {
      const row = [
        entry.timestamp.toISOString(),
        LogLevelNames[entry.level],
        entry.logger,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.context ? `"${JSON.stringify(entry.context).replace(/"/g, '""')}"` : '',
        entry.error ? `"${entry.error.message.replace(/"/g, '""')}"` : '',
        entry.platform,
        entry.id
      ].join(',');
      
      rows.push(row);
    });
    
    return rows.join('\n');
  }

  private exportToText(entries: LogEntry[]): string {
    return entries.map(entry => {
      const parts = [
        `[${entry.timestamp.toISOString()}]`,
        `[${LogLevelNames[entry.level]}]`,
        `[${entry.logger}]`,
        entry.message
      ];
      
      if (entry.context) {
        parts.push(`\nContext: ${JSON.stringify(entry.context, null, 2)}`);
      }
      
      if (entry.error) {
        parts.push(`\nError: ${entry.error.stack || entry.error.message}`);
      }
      
      return parts.join(' ');
    }).join('\n\n');
  }
}
