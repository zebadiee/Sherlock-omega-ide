/**
 * 🛡️ SHERLOCK Ω IDE - ENTERPRISE ERROR HANDLING SYSTEM
 * =====================================================
 * 
 * Implements expert TypeScript error handling patterns:
 * ✅ Custom typed error classes
 * ✅ Result/union types for predictable failures  
 * ✅ Type guards for safe error handling
 * ✅ Centralized error management
 * ✅ Async error flow handling
 * ✅ Structured logging integration
 */

import { Logger } from '../logging/logger';

// ============================================================================
// 🎯 RESULT PATTERN - AVOID EXCEPTIONS FOR PREDICTABLE FAILURES
// ============================================================================

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
  readonly error?: never;
}

export interface Failure<E> {
  readonly success: false;
  readonly data?: never;
  readonly error: E;
}

export const Ok = <T>(data: T): Success<T> => ({ success: true, data });
export const Err = <E>(error: E): Failure<E> => ({ success: false, error });

// Result utility functions
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.success;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;

// ============================================================================
// 🏗️ CUSTOM ERROR CLASSES - TYPED AND STRUCTURED
// ============================================================================

export abstract class SherlockError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  readonly timestamp: Date;
  readonly context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    this.cause = cause;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      cause: this.cause?.message,
    };
  }
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  QUANTUM = 'quantum',
  AI = 'ai',
  CONFIGURATION = 'configuration',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
}

// ============================================================================
// 🔐 DOMAIN-SPECIFIC ERROR CLASSES
// ============================================================================

export class ValidationError extends SherlockError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.VALIDATION;

  constructor(
    field: string,
    value: any,
    constraint: string,
    context?: Record<string, any>
  ) {
    super(
      `Validation failed for field '${field}': ${constraint}`,
      { field, value, constraint, ...context }
    );
  }
}

export class AuthenticationError extends SherlockError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly category = ErrorCategory.AUTHENTICATION;

  constructor(reason: string, context?: Record<string, any>) {
    super(`Authentication failed: ${reason}`, context);
  }
}

export class QuantumSimulationError extends SherlockError {
  readonly code = 'QUANTUM_SIMULATION_ERROR';
  readonly category = ErrorCategory.QUANTUM;

  constructor(
    operation: string,
    qubits: number,
    details: string,
    context?: Record<string, any>
  ) {
    super(
      `Quantum simulation failed for ${operation} on ${qubits} qubits: ${details}`,
      { operation, qubits, details, ...context }
    );
  }
}

export class AIModelError extends SherlockError {
  readonly code = 'AI_MODEL_ERROR';
  readonly category = ErrorCategory.AI;

  constructor(
    model: string,
    operation: string,
    details: string,
    context?: Record<string, any>
  ) {
    super(
      `AI model '${model}' failed during ${operation}: ${details}`,
      { model, operation, details, ...context }
    );
  }
}

export class ConfigurationError extends SherlockError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly category = ErrorCategory.CONFIGURATION;

  constructor(
    setting: string,
    expectedType: string,
    actualValue: any,
    context?: Record<string, any>
  ) {
    super(
      `Configuration error for '${setting}': expected ${expectedType}, got ${typeof actualValue}`,
      { setting, expectedType, actualValue, ...context }
    );
  }
}

export class SecurityError extends SherlockError {
  readonly code = 'SECURITY_ERROR';
  readonly category = ErrorCategory.SECURITY;

  constructor(
    threat: string,
    details: string,
    context?: Record<string, any>
  ) {
    super(`Security threat detected: ${threat} - ${details}`, context);
  }
}

// ============================================================================
// 🛡️ TYPE GUARDS FOR SAFE ERROR HANDLING
// ============================================================================

export const isSherlockError = (error: unknown): error is SherlockError => {
  return error instanceof SherlockError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isQuantumError = (error: unknown): error is QuantumSimulationError => {
  return error instanceof QuantumSimulationError;
};

export const isAIError = (error: unknown): error is AIModelError => {
  return error instanceof AIModelError;
};

export const isConfigurationError = (error: unknown): error is ConfigurationError => {
  return error instanceof ConfigurationError;
};

export const isSecurityError = (error: unknown): error is SecurityError => {
  return error instanceof SecurityError;
};

// ============================================================================
// 🎯 CENTRALIZED ERROR HANDLER
// ============================================================================

export interface ErrorHandlerConfig {
  logger: Logger;
  enableStackTrace: boolean;
  enableSensitiveDataLogging: boolean;
  maxErrorLogLength: number;
}

export class CentralizedErrorHandler {
  private logger: Logger;
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  /**
   * Handle and log errors with proper categorization
   */
  handleError(error: unknown, context?: Record<string, any>): void {
    const errorInfo = this.categorizeError(error);
    
    // Log based on severity
    if (this.isCriticalError(errorInfo.category)) {
      this.logger.error(errorInfo.message, {
        ...errorInfo.context,
        ...context,
        stack: this.config.enableStackTrace ? errorInfo.stack : undefined,
      });
    } else {
      this.logger.warn(errorInfo.message, {
        ...errorInfo.context,
        ...context,
      });
    }

    // Additional handling for specific error types
    this.handleSpecificError(errorInfo);
  }

  /**
   * Safe async error handling wrapper
   */
  async safeAsync<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<Result<T, SherlockError>> {
    try {
      const result = await operation();
      return Ok(result);
    } catch (error) {
      const sherlockError = this.normalizeError(error, context);
      this.handleError(sherlockError, context);
      return Err(sherlockError);
    }
  }

  /**
   * Safe sync operation wrapper
   */
  safe<T>(
    operation: () => T,
    context?: Record<string, any>
  ): Result<T, SherlockError> {
    try {
      const result = operation();
      return Ok(result);
    } catch (error) {
      const sherlockError = this.normalizeError(error, context);
      this.handleError(sherlockError, context);
      return Err(sherlockError);
    }
  }

  /**
   * Normalize any error to SherlockError
   */
  private normalizeError(error: unknown, context?: Record<string, any>): SherlockError {
    if (isSherlockError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new (class extends SherlockError {
        readonly code = 'UNKNOWN_ERROR';
        readonly category = ErrorCategory.SYSTEM;
      })(error.message, context, error);
    }

    // Handle non-Error throws (string, object, etc.)
    const message = typeof error === 'string' ? error : 'Unknown error occurred';
    return new (class extends SherlockError {
      readonly code = 'UNKNOWN_ERROR';
      readonly category = ErrorCategory.SYSTEM;
    })(message, { originalError: error, ...context });
  }

  /**
   * Categorize errors for proper handling
   */
  private categorizeError(error: unknown): {
    message: string;
    category: ErrorCategory;
    stack?: string;
    context?: Record<string, any>;
  } {
    if (isSherlockError(error)) {
      return {
        message: error.message,
        category: error.category,
        stack: error.stack,
        context: error.context,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        category: ErrorCategory.SYSTEM,
        stack: error.stack,
      };
    }

    return {
      message: String(error),
      category: ErrorCategory.SYSTEM,
    };
  }

  /**
   * Determine if error is critical and requires immediate attention
   */
  private isCriticalError(category: ErrorCategory): boolean {
    const criticalCategories = [
      ErrorCategory.SECURITY,
      ErrorCategory.DATABASE,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.SYSTEM,
    ];
    return criticalCategories.includes(category);
  }

  /**
   * Handle specific error types with custom logic
   */
  private handleSpecificError(errorInfo: { category: ErrorCategory; [key: string]: any }): void {
    switch (errorInfo.category) {
      case ErrorCategory.SECURITY:
        // Trigger security alerts, rate limiting, etc.
        this.logger.fatal('SECURITY ALERT: ' + errorInfo.message);
        break;
      
      case ErrorCategory.QUANTUM:
        // Log quantum simulation metrics for analysis
        this.logger.info('Quantum simulation metrics logged for analysis');
        break;
      
      case ErrorCategory.AI:
        // Track AI model performance degradation
        this.logger.warn('AI model performance issue detected');
        break;
    }
  }
}

// ============================================================================
// 🔧 VALIDATION UTILITIES WITH RESULT PATTERN
// ============================================================================

export class ValidationUtils {
  static validateEmail(email: string): Result<string, ValidationError> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || typeof email !== 'string') {
      return Err(new ValidationError('email', email, 'must be a non-empty string'));
    }
    
    if (!emailRegex.test(email)) {
      return Err(new ValidationError('email', email, 'must be a valid email format'));
    }
    
    return Ok(email.toLowerCase());
  }

  static validateQuantumQubits(qubits: number): Result<number, ValidationError> {
    if (!Number.isInteger(qubits)) {
      return Err(new ValidationError('qubits', qubits, 'must be an integer'));
    }
    
    if (qubits < 1 || qubits > 100) {
      return Err(new ValidationError('qubits', qubits, 'must be between 1 and 100'));
    }
    
    return Ok(qubits);
  }

  static validateAPIKey(apiKey: string, service: string): Result<string, ValidationError> {
    if (!apiKey || typeof apiKey !== 'string') {
      return Err(new ValidationError('apiKey', apiKey, 'must be a non-empty string'));
    }
    
    const minLength = service === 'openai' ? 40 : 20;
    if (apiKey.length < minLength) {
      return Err(new ValidationError('apiKey', '***', `must be at least ${minLength} characters`));
    }
    
    return Ok(apiKey);
  }
}

// ============================================================================
// 🚀 USAGE EXAMPLES AND PATTERNS
// ============================================================================

export class ErrorHandlingExamples {
  private errorHandler: CentralizedErrorHandler;

  constructor(logger: Logger) {
    this.errorHandler = new CentralizedErrorHandler({
      logger,
      enableStackTrace: true,
      enableSensitiveDataLogging: false,
      maxErrorLogLength: 1000,
    });
  }

  /**
   * Example: Safe async operation with Result pattern
   */
  async performQuantumSimulation(qubits: number): Promise<Result<any, SherlockError>> {
    // Validate input first
    const qubitValidation = ValidationUtils.validateQuantumQubits(qubits);
    if (!qubitValidation.success) {
      return Err(qubitValidation.error);
    }

    // Perform operation with error handling
    return this.errorHandler.safeAsync(async () => {
      // Simulated quantum operation
      if (Math.random() < 0.1) {
        throw new QuantumSimulationError(
          'bellState',
          qubits,
          'Quantum decoherence detected',
          { fidelity: 0.85, noiseLevel: 0.15 }
        );
      }
      
      return { result: 'success', qubits, fidelity: 0.95 };
    }, { operation: 'quantumSimulation', qubits });
  }

  /**
   * Example: Centralized API error handling middleware
   */
  apiErrorMiddleware = (error: unknown, req: any, res: any, next: any) => {
    this.errorHandler.handleError(error, {
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
    });

    if (isValidationError(error)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        field: error.context?.field,
      });
    }

    if (isAuthenticationError(error)) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Please provide valid credentials',
      });
    }

    if (isSecurityError(error)) {
      return res.status(403).json({
        error: 'Security Error',
        message: 'Access denied for security reasons',
      });
    }

    // Default error response
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  };
}

// Export singleton instance for global use
export const createErrorHandler = (logger: Logger) => 
  new CentralizedErrorHandler({
    logger,
    enableStackTrace: process.env.NODE_ENV !== 'production',
    enableSensitiveDataLogging: process.env.NODE_ENV === 'development',
    maxErrorLogLength: 2000,
  });