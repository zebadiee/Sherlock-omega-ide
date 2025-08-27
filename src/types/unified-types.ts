
/**
 * Unified type definitions for Sherlock Ω IDE
 */

export interface UnifiedConfig {
  platform: PlatformType;
  logLevel: LogLevel;
  enablePerformanceMonitoring: boolean;
  enableSecurity: boolean;
}

export interface ServiceFactory {
  createLogger(config?: any): Logger;
  createPerformanceMonitor(config?: any): PerformanceMonitor;
  createErrorHandler(config?: any): CentralizedErrorHandler;
}
