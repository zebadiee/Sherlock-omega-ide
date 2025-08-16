/**
 * Base Model Provider Interface
 * 
 * Unified interface for all AI model providers with standardized request/response
 * format and comprehensive error handling.
 */

import {
  AIRequest,
  AIResponse,
  ModelConfiguration,
  HealthStatus,
  TokenUsage,
  AIError,
  AIErrorCode,
  ModelProvider,
  ModelCapability
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';

/**
 * Provider-specific request format
 */
export interface ProviderRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stop?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Provider-specific response format
 */
export interface ProviderResponse {
  id: string;
  choices: Array<{
    text: string;
    finishReason: string;
    index: number;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  created: number;
}

/**
 * Provider authentication configuration
 */
export interface ProviderAuth {
  apiKey?: string;
  endpoint?: string;
  organizationId?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  auth: ProviderAuth;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
  defaultModel: string;
  supportedModels: string[];
}

/**
 * Abstract base class for all model providers
 */
export abstract class BaseModelProvider {
  protected logger: Logger;
  protected performanceMonitor: PerformanceMonitor;
  protected config: ProviderConfig;
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;
  protected rateLimitWindow: number[] = [];

  constructor(
    config: ProviderConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Get provider type
   */
  abstract getProviderType(): ModelProvider;

  /**
   * Get supported capabilities
   */
  abstract getSupportedCapabilities(): ModelCapability[];

  /**
   * Process AI request through provider
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Processing request with provider', {
        provider: this.getProviderType(),
        requestId: request.id,
        type: request.type
      });

      // Check rate limits
      await this.checkRateLimit();

      // Convert to provider format
      const providerRequest = await this.convertToProviderRequest(request);

      // Validate request
      await this.validateProviderRequest(providerRequest);

      // Execute request
      const providerResponse = await this.executeRequest(providerRequest);

      // Convert response
      const aiResponse = await this.convertToAIResponse(request, providerResponse);

      // Track metrics
      const processingTime = Date.now() - startTime;
      this.trackRequestMetrics(request, aiResponse, processingTime, true);

      this.logger.debug('Request processed successfully', {
        provider: this.getProviderType(),
        requestId: request.id,
        processingTime,
        confidence: aiResponse.confidence
      });

      return aiResponse;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.trackRequestMetrics(request, null, processingTime, false);
      
      this.logger.error('Request processing failed', {
        provider: this.getProviderType(),
        requestId: request.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw this.handleProviderError(error, request);
    }
  }

  /**
   * Check provider health
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Performing health check', {
        provider: this.getProviderType()
      });

      // Perform provider-specific health check
      const isHealthy = await this.performHealthCheck();
      const responseTime = Date.now() - startTime;

      const status: HealthStatus = {
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        errorRate: this.calculateErrorRate(),
        lastChecked: new Date(),
        issues: isHealthy ? [] : ['Health check failed']
      };

      this.logger.debug('Health check completed', {
        provider: this.getProviderType(),
        status: status.status,
        responseTime
      });

      return status;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error('Health check failed', {
        provider: this.getProviderType(),
        error: error instanceof Error ? error.message : String(error),
        responseTime
      });

      return {
        status: 'unhealthy',
        responseTime,
        errorRate: 1,
        lastChecked: new Date(),
        issues: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get available models for this provider
   */
  async getAvailableModels(): Promise<ModelConfiguration[]> {
    try {
      const models = await this.fetchAvailableModels();
      
      this.logger.debug('Available models fetched', {
        provider: this.getProviderType(),
        modelCount: models.length
      });

      return models;

    } catch (error) {
      this.logger.error('Failed to fetch available models', {
        provider: this.getProviderType(),
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return default models if fetch fails
      return this.getDefaultModels();
    }
  }

  /**
   * Update provider configuration
   */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('Provider configuration updated', {
      provider: this.getProviderType(),
      updatedFields: Object.keys(newConfig)
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  // Abstract methods to be implemented by specific providers

  /**
   * Convert AI request to provider-specific format
   */
  protected abstract convertToProviderRequest(request: AIRequest): Promise<ProviderRequest>;

  /**
   * Execute request with provider API
   */
  protected abstract executeRequest(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Convert provider response to AI response format
   */
  protected abstract convertToAIResponse(
    originalRequest: AIRequest, 
    providerResponse: ProviderResponse
  ): Promise<AIResponse>;

  /**
   * Perform provider-specific health check
   */
  protected abstract performHealthCheck(): Promise<boolean>;

  /**
   * Fetch available models from provider
   */
  protected abstract fetchAvailableModels(): Promise<ModelConfiguration[]>;

  /**
   * Get default model configurations
   */
  protected abstract getDefaultModels(): ModelConfiguration[];

  // Protected helper methods

  /**
   * Check and enforce rate limits
   */
  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Clean old requests from window
    this.rateLimitWindow = this.rateLimitWindow.filter(time => time > windowStart);

    // Check if we're at the limit
    if (this.rateLimitWindow.length >= this.config.rateLimitPerMinute) {
      const waitTime = this.rateLimitWindow[0] + 60000 - now;
      
      this.logger.warn('Rate limit reached, waiting', {
        provider: this.getProviderType(),
        waitTime,
        requestsInWindow: this.rateLimitWindow.length
      });

      throw new AIError(
        `Rate limit exceeded. Wait ${waitTime}ms before next request.`,
        AIErrorCode.RATE_LIMIT_EXCEEDED,
        true
      );
    }

    // Add current request to window
    this.rateLimitWindow.push(now);
    this.requestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Validate provider request format
   */
  protected async validateProviderRequest(request: ProviderRequest): Promise<void> {
    if (!request.model || request.model.trim().length === 0) {
      throw new AIError(
        'Model name is required',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new AIError(
        'Prompt is required',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    if (request.maxTokens && request.maxTokens <= 0) {
      throw new AIError(
        'Max tokens must be positive',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new AIError(
        'Temperature must be between 0 and 2',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }
  }

  /**
   * Handle provider-specific errors
   */
  protected handleProviderError(error: any, request: AIRequest): AIError {
    // Map common HTTP status codes to AI error codes
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      
      switch (status) {
        case 401:
          return new AIError(
            'Authentication failed',
            AIErrorCode.AUTHENTICATION_FAILED,
            false
          );
        case 429:
          return new AIError(
            'Rate limit exceeded',
            AIErrorCode.RATE_LIMIT_EXCEEDED,
            true
          );
        case 503:
        case 502:
        case 504:
          return new AIError(
            'Service temporarily unavailable',
            AIErrorCode.MODEL_UNAVAILABLE,
            true
          );
        case 400:
          return new AIError(
            'Invalid request format',
            AIErrorCode.INVALID_REQUEST,
            false
          );
        default:
          return new AIError(
            `HTTP ${status}: ${error instanceof Error ? error.message : String(error)}`,
            AIErrorCode.NETWORK_ERROR,
            status >= 500
          );
      }
    }

    // Handle timeout errors
    if ((error as any).code === 'ECONNABORTED' || (error instanceof Error && error.message?.includes('timeout'))) {
      return new AIError(
        'Request timeout',
        AIErrorCode.TIMEOUT,
        true
      );
    }

    // Handle network errors
    if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
      return new AIError(
        'Network connection failed',
        AIErrorCode.NETWORK_ERROR,
        true
      );
    }

    // Default error handling
    return new AIError(
      (error instanceof Error ? error.message : String(error)) || 'Unknown provider error',
      AIErrorCode.MODEL_UNAVAILABLE,
      true
    );
  }

  /**
   * Track request metrics
   */
  protected trackRequestMetrics(
    request: AIRequest,
    response: AIResponse | null,
    processingTime: number,
    success: boolean
  ): void {
    const providerType = this.getProviderType();
    
    // Track provider-specific metrics
    this.performanceMonitor.recordMetric(`${providerType}_response_time`, processingTime, MetricType.RESPONSE_TIME);
    this.performanceMonitor.recordMetric(`${providerType}_success_rate`, success ? 1 : 0, MetricType.ERROR_RATE);
    this.performanceMonitor.recordMetric(`${providerType}_request_count`, 1, MetricType.EXECUTION_TIME);

    if (response) {
      this.performanceMonitor.recordMetric(`${providerType}_confidence`, response.confidence, MetricType.SUGGESTION_QUALITY);
      this.performanceMonitor.recordMetric(`${providerType}_tokens_used`, response.tokens.totalTokens, MetricType.EXECUTION_TIME);
      
      if (response.tokens.cost) {
        this.performanceMonitor.recordMetric(`${providerType}_cost`, response.tokens.cost, MetricType.EXECUTION_TIME);
      }
    }

    // Track request type metrics
    this.performanceMonitor.recordMetric(`${request.type}_${providerType}_time`, processingTime, MetricType.RESPONSE_TIME);
  }

  /**
   * Calculate error rate for this provider
   */
  protected calculateErrorRate(): number {
    // This is a simplified calculation
    // In production, this would track actual success/failure rates
    return 0.05; // 5% default error rate
  }

  /**
   * Generate unique request ID for provider
   */
  protected generateProviderRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.getProviderType()}_${timestamp}_${random}`;
  }

  /**
   * Calculate confidence score based on provider response
   */
  protected calculateConfidence(
    providerResponse: ProviderResponse,
    request: AIRequest
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    const choice = providerResponse.choices[0];
    if (choice) {
      switch (choice.finishReason) {
        case 'stop':
          confidence += 0.1;
          break;
        case 'length':
          confidence -= 0.1;
          break;
        case 'content_filter':
          confidence -= 0.3;
          break;
      }
    }

    // Adjust based on response length
    const responseLength = choice?.text?.length || 0;
    if (responseLength > 0) {
      confidence += Math.min(0.1, responseLength / 1000);
    }

    // Adjust based on token usage efficiency
    const tokenEfficiency = providerResponse.usage.completionTokens / 
                           Math.max(providerResponse.usage.promptTokens, 1);
    confidence += Math.min(0.1, tokenEfficiency * 0.1);

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Create token usage from provider response
   */
  protected createTokenUsage(
    providerResponse: ProviderResponse,
    model: ModelConfiguration
  ): TokenUsage {
    const usage = providerResponse.usage;
    const cost = usage.totalTokens * model.costPerToken;

    return {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      cost
    };
  }
}