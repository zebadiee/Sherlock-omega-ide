/**
 * AI Integration Utilities
 * 
 * Common utility functions for AI processing, validation, and optimization.
 */

import {
  AIRequest,
  AIResponse,
  TokenUsage,
  PerformanceMetrics,
  ValidationResult,
  AIError,
  AIErrorCode,
  ModelConfiguration,
  ProjectContext,
  CodeContext,
  Position
} from './interfaces';

/**
 * Request ID generation utility
 */
export class RequestIdGenerator {
  private static counter = 0;
  private static readonly PREFIX = 'ai_req';

  static generate(): string {
    const timestamp = Date.now().toString(36);
    const counter = (++this.counter).toString(36).padStart(3, '0');
    const random = Math.random().toString(36).substring(2, 5);
    return `${this.PREFIX}_${timestamp}_${counter}_${random}`;
  }

  static isValid(id: string): boolean {
    return /^ai_req_[a-z0-9]+_[a-z0-9]{3}_[a-z0-9]{3}$/.test(id);
  }
}

/**
 * Token usage calculation utilities
 */
export class TokenUtils {
  /**
   * Estimate token count for text (rough approximation)
   */
  static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    // This is a simplified version - production would use tiktoken or similar
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on token usage and model pricing
   */
  static calculateCost(tokens: TokenUsage, model: ModelConfiguration): number {
    return tokens.totalTokens * model.costPerToken;
  }

  /**
   * Combine multiple token usage records
   */
  static combineTokenUsage(usages: TokenUsage[]): TokenUsage {
    return usages.reduce(
      (total, usage) => ({
        promptTokens: total.promptTokens + usage.promptTokens,
        completionTokens: total.completionTokens + usage.completionTokens,
        totalTokens: total.totalTokens + usage.totalTokens,
        cost: (total.cost || 0) + (usage.cost || 0)
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 }
    );
  }

  /**
   * Validate token usage limits
   */
  static validateTokenLimits(tokens: TokenUsage, model: ModelConfiguration): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (tokens.totalTokens > model.maxTokens) {
      issues.push({
        type: 'performance',
        severity: 'critical',
        description: `Token count ${tokens.totalTokens} exceeds model limit ${model.maxTokens}`,
        suggestion: 'Reduce input size or use a model with higher token limits'
      });
    }

    if (tokens.totalTokens > model.maxTokens * 0.9) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: `Token count ${tokens.totalTokens} approaching model limit ${model.maxTokens}`,
        suggestion: 'Consider optimizing input to stay well below token limits'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      confidence: Math.max(0, 1 - (tokens.totalTokens / model.maxTokens)),
      issues,
      suggestions: issues.map(i => i.suggestion).filter(Boolean) as string[]
    };
  }
}

/**
 * Performance metrics calculation utilities
 */
export class PerformanceUtils {
  /**
   * Calculate average response time from metrics history
   */
  static calculateAverageResponseTime(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  }

  /**
   * Calculate throughput (requests per second)
   */
  static calculateThroughput(requestCount: number, timeWindowMs: number): number {
    return (requestCount * 1000) / timeWindowMs;
  }

  /**
   * Calculate error rate percentage
   */
  static calculateErrorRate(errorCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return (errorCount / totalCount) * 100;
  }

  /**
   * Calculate performance score (0-1 scale)
   */
  static calculatePerformanceScore(metrics: PerformanceMetrics, targets: {
    maxResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
  }): number {
    let score = 1.0;

    // Response time score (0-0.4)
    const responseTimeScore = Math.max(0, 1 - (metrics.responseTime / targets.maxResponseTime)) * 0.4;
    
    // Throughput score (0-0.3)
    const throughputScore = Math.min(1, metrics.throughput / targets.minThroughput) * 0.3;
    
    // Error rate score (0-0.3)
    const errorRateScore = Math.max(0, 1 - (metrics.errorRate / targets.maxErrorRate)) * 0.3;

    return responseTimeScore + throughputScore + errorRateScore;
  }

  /**
   * Detect performance anomalies
   */
  static detectAnomalies(
    current: PerformanceMetrics, 
    baseline: PerformanceMetrics[]
  ): { hasAnomalies: boolean; anomalies: string[] } {
    if (baseline.length < 10) {
      return { hasAnomalies: false, anomalies: [] };
    }

    const avgResponseTime = this.calculateAverageResponseTime(baseline);
    const avgThroughput = baseline.reduce((sum, m) => sum + m.throughput, 0) / baseline.length;
    const avgErrorRate = baseline.reduce((sum, m) => sum + m.errorRate, 0) / baseline.length;

    const anomalies: string[] = [];

    // Response time anomaly (>2x average)
    if (current.responseTime > avgResponseTime * 2) {
      anomalies.push(`Response time ${current.responseTime}ms is ${(current.responseTime / avgResponseTime).toFixed(1)}x higher than baseline`);
    }

    // Throughput anomaly (<50% of average)
    if (current.throughput < avgThroughput * 0.5) {
      anomalies.push(`Throughput ${current.throughput} is ${((1 - current.throughput / avgThroughput) * 100).toFixed(1)}% lower than baseline`);
    }

    // Error rate anomaly (>2x average)
    if (current.errorRate > avgErrorRate * 2 && current.errorRate > 0.05) {
      anomalies.push(`Error rate ${(current.errorRate * 100).toFixed(1)}% is significantly higher than baseline`);
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies
    };
  }
}

/**
 * Context analysis utilities
 */
export class ContextUtils {
  /**
   * Calculate context similarity between two code contexts
   */
  static calculateContextSimilarity(context1: CodeContext, context2: CodeContext): number {
    let similarity = 0;
    let factors = 0;

    // File similarity
    if (context1.currentFile === context2.currentFile) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Import similarity
    const commonImports = context1.imports.filter(imp => context2.imports.includes(imp));
    const importSimilarity = commonImports.length / Math.max(context1.imports.length, context2.imports.length, 1);
    similarity += importSimilarity * 0.2;
    factors += 0.2;

    // Function similarity
    const commonFunctions = context1.functions.filter(f1 => 
      context2.functions.some(f2 => f1.name === f2.name)
    );
    const functionSimilarity = commonFunctions.length / Math.max(context1.functions.length, context2.functions.length, 1);
    similarity += functionSimilarity * 0.3;
    factors += 0.3;

    // Variable similarity
    const commonVariables = context1.variables.filter(v1 => 
      context2.variables.some(v2 => v1.name === v2.name && v1.type === v2.type)
    );
    const variableSimilarity = commonVariables.length / Math.max(context1.variables.length, context2.variables.length, 1);
    similarity += variableSimilarity * 0.2;
    factors += 0.2;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Extract relevant context for AI request
   */
  static extractRelevantContext(
    fullContext: CodeContext, 
    position: Position,
    maxContextSize: number = 2000
  ): string {
    const lines = fullContext.surroundingCode.split('\n');
    const currentLineIndex = Math.min(position.line, lines.length - 1);
    
    // Start with current line and expand outward
    let contextLines: string[] = [];
    let totalLength = 0;
    let radius = 0;

    while (totalLength < maxContextSize && radius < Math.max(currentLineIndex, lines.length - currentLineIndex)) {
      const startIndex = Math.max(0, currentLineIndex - radius);
      const endIndex = Math.min(lines.length - 1, currentLineIndex + radius);

      if (radius === 0) {
        contextLines = [lines[currentLineIndex] || ''];
        totalLength = contextLines[0].length;
      } else {
        if (startIndex < currentLineIndex - radius + 1) {
          const newLine = lines[startIndex];
          if (totalLength + newLine.length <= maxContextSize) {
            contextLines.unshift(newLine);
            totalLength += newLine.length;
          }
        }
        
        if (endIndex > currentLineIndex + radius - 1) {
          const newLine = lines[endIndex];
          if (totalLength + newLine.length <= maxContextSize) {
            contextLines.push(newLine);
            totalLength += newLine.length;
          }
        }
      }

      radius++;
    }

    return contextLines.join('\n');
  }

  /**
   * Generate context hash for caching
   */
  static generateContextHash(context: CodeContext): string {
    const hashInput = [
      context.currentFile,
      context.cursorPosition.line,
      context.cursorPosition.character,
      context.imports.join(','),
      context.functions.map(f => `${f.name}:${f.parameters.length}`).join(','),
      context.variables.map(v => `${v.name}:${v.type}`).join(',')
    ].join('|');

    return Buffer.from(hashInput).toString('base64').substring(0, 16);
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Create standardized AI error
   */
  static createAIError(
    message: string,
    code: AIErrorCode,
    retryable: boolean = false,
    context?: unknown
  ): AIError {
    const error = new Error(message) as AIError;
    error.code = code;
    error.retryable = retryable;
    error.context = context;
    return error;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AIError): boolean {
    return error.retryable && [
      AIErrorCode.NETWORK_ERROR,
      AIErrorCode.TIMEOUT,
      AIErrorCode.RATE_LIMIT_EXCEEDED,
      AIErrorCode.MODEL_UNAVAILABLE
    ].includes(error.code);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    const maxDelay = 30000; // 30 seconds max
    const delay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Wrap async function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          break;
        }

        if (error instanceof Error && 'code' in error) {
          const aiError = error as AIError;
          if (!this.isRetryable(aiError)) {
            break;
          }
        }

        const delay = this.calculateRetryDelay(attempt, baseDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate AI request structure
   */
  static validateRequest(request: AIRequest): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (!request.id || typeof request.id !== 'string') {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Request ID is required and must be a string'
      });
    }

    if (!request.type) {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Request type is required'
      });
    }

    if (!request.context) {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Request context is required'
      });
    }

    if (request.payload === undefined || request.payload === null) {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Request payload is empty'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      confidence: issues.length === 0 ? 1 : Math.max(0, 1 - (issues.length * 0.2)),
      issues,
      suggestions: issues.map(i => i.suggestion).filter(Boolean) as string[]
    };
  }

  /**
   * Validate AI response structure
   */
  static validateResponse(response: AIResponse): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    if (!response.id || typeof response.id !== 'string') {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Response ID is required and must be a string'
      });
    }

    if (!response.requestId || typeof response.requestId !== 'string') {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Response must reference a request ID'
      });
    }

    if (response.confidence < 0 || response.confidence > 1) {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Response confidence must be between 0 and 1'
      });
    }

    if (response.processingTime < 0) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: 'Processing time cannot be negative'
      });
    }

    if (!response.tokens || response.tokens.totalTokens < 0) {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Token usage information is invalid'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      confidence: issues.length === 0 ? 1 : Math.max(0, 1 - (issues.length * 0.2)),
      issues,
      suggestions: issues.map(i => i.suggestion).filter(Boolean) as string[]
    };
  }
}

/**
 * Caching utilities
 */
export class CacheUtils {
  /**
   * Generate cache key from request
   */
  static generateCacheKey(request: AIRequest): string {
    const keyComponents = [
      request.type,
      request.context.projectId,
      request.context.language,
      JSON.stringify(request.payload)
    ];

    const keyString = keyComponents.join('|');
    return Buffer.from(keyString).toString('base64').substring(0, 32);
  }

  /**
   * Check if cached response is still valid
   */
  static isCacheValid(
    cachedTimestamp: number, 
    ttlMs: number = 300000 // 5 minutes default
  ): boolean {
    return Date.now() - cachedTimestamp < ttlMs;
  }

  /**
   * Calculate cache priority based on request characteristics
   */
  static calculateCachePriority(request: AIRequest): number {
    let priority = 0;

    // Higher priority for frequent request types
    switch (request.type) {
      case 'code_completion':
        priority += 0.4;
        break;
      case 'natural_language':
        priority += 0.2;
        break;
      default:
        priority += 0.1;
    }

    // Higher priority for high-priority requests
    priority += request.priority * 0.2;

    // Lower priority for privacy-sensitive requests
    if (request.privacyLevel === 'local_only') {
      priority -= 0.1;
    }

    return Math.max(0, Math.min(1, priority));
  }
}