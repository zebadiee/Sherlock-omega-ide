
/**
 * Unified Logger Factory
 * Handles all logger initialization scenarios
 */
import { Logger, LogLevel } from './logger';

export class LoggerFactory {
  static create(input?: any): Logger {
    if (input instanceof Logger) {
      return input;
    }
    
    if (typeof input === 'number' && input >= 0 && input <= 4) {
      return new Logger(input as LogLevel);
    }
    
    if (typeof input === 'string') {
      const level = LogLevel[input.toUpperCase() as keyof typeof LogLevel];
      return new Logger(level || LogLevel.INFO);
    }
    
    // Default logger for any other input
    return new Logger(LogLevel.INFO);
  }
}
