/**
 * AI Orchestrator Implementation
 * 
 * Central coordination component that manages all AI interactions and ensures
 * optimal resource utilization with performance targets <200ms response time.
 */

import { 
  AIOrchestrator as IAIOrchestrator, 
  AIRequest, 
  AIResponse, 
  ModelSelection, 
  ValidationResult, 
  PerformanceMetrics, 
  UserFeedback, 
  ModelPreferences,
  AIError,
  AIErrorCode,
  OrchestratorConfig,
  RequestPriority
} from './interfaces';
import { ModelRouter } from './model-router';
import { ContextEngine } from './context-engine';
import { Logger } from '../logging/logger';
import { PerformanceMonitor, MetricType } from '../monitoring/performance-monitor';

export class AIOrchestrator implements IAIOrchestrator {
  private modelRouter: ModelRouter;
  private contextEngine: ContextEngine;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private config: OrchestratorConfig;
  private activeRequests: Map<string, AIRequest> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private userFeedbackHistory: UserFeedback[] = [];

  constructor(
    modelRouter: ModelRouter,
    contextEngine: ContextEngine,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    config: OrchestratorConfig
  ) {
    this.modelRouter = modelRouter;
    this.contextEngine = contextEngine;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.config = config;
  }

  /**
   * Process an AI request with performance monitoring and error handling
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.activeRequests.set(request.id, request);

    try {
      this.logger.info('Processing AI request', {
        requestId: request.id,
        type: request.type,
        priority: request.priority,
        privacyLevel: request.privacyLevel
      });

      // Validate request
      await this.validateRequest(request);

      // Check for cached response
      const cachedResponse = await this.getCachedResponse(request);
      if (cachedResponse) {
        this.logger.debug('Returning cached response', { requestId: request.id });
        return cachedResponse;
      }

      // Route to optimal model
      const modelSelection = await this.routeToOptimalModel(request);
      
      // Process request with selected model
      const response = await this.executeRequest(request, modelSelection);

      // Validate response quality
      const validation = await this.validateResponse(response);
      if (!validation.isValid) {
        throw new AIError(
          `Response validation failed: ${validation.issues.map(i => i.description).join(', ')}`,
          AIErrorCode.QUALITY_THRESHOLD_NOT_MET,
          true
        );
      }

      // Cache successful response
      await this.cacheResponse(request, response);

      // Track performance metrics
      const processingTime = Date.now() - startTime;
      await this.trackRequestPerformance(request, response, processingTime);

      this.logger.info('AI request completed successfully', {
        requestId: request.id,
        processingTime,
        modelUsed: response.modelUsed,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.handleRequestError(request, error as AIError, processingTime);
      throw error;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Route request to optimal model based on requirements and performance
   */
  async routeToOptimalModel(request: AIRequest): Promise<ModelSelection> {
    try {
      // Get available models
      const availableModels = await this.modelRouter.getAvailableModels();
      
      if (availableModels.length === 0) {
        throw new AIError(
          'No AI models available',
          AIErrorCode.MODEL_UNAVAILABLE,
          false
        );
      }

      // Select optimal model based on request characteristics
      const selection = await this.modelRouter.selectModel(request);
      
      this.logger.debug('Model selected for request', {
        requestId: request.id,
        selectedModel: selection.modelId,
        confidence: selection.confidence,
        estimatedCost: selection.estimatedCost,
        estimatedLatency: selection.estimatedLatency,
        reasoning: selection.reasoning
      });

      return selection;

    } catch (error) {
      this.logger.error('Failed to route request to model', {
        requestId: request.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Aggregate multiple responses (for ensemble models or multi-step processing)
   */
  async aggregateResponses(responses: AIResponse[]): Promise<AIResponse> {
    if (responses.length === 0) {
      throw new AIError(
        'No responses to aggregate',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    if (responses.length === 1) {
      return responses[0];
    }

    // Calculate weighted average confidence
    const totalConfidence = responses.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / responses.length;

    // Select best response based on confidence and processing time
    const bestResponse = responses.reduce((best, current) => {
      const bestScore = best.confidence * (1 / Math.max(best.processingTime, 1));
      const currentScore = current.confidence * (1 / Math.max(current.processingTime, 1));
      return currentScore > bestScore ? current : best;
    });

    // Create aggregated response
    const aggregatedResponse: AIResponse = {
      ...bestResponse,
      id: `aggregated_${Date.now()}`,
      confidence: avgConfidence,
      processingTime: Math.max(...responses.map(r => r.processingTime)),
      tokens: responses.reduce((total, r) => ({
        promptTokens: total.promptTokens + r.tokens.promptTokens,
        completionTokens: total.completionTokens + r.tokens.completionTokens,
        totalTokens: total.totalTokens + r.tokens.totalTokens,
        cost: (total.cost || 0) + (r.tokens.cost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 })
    };

    this.logger.debug('Responses aggregated', {
      responseCount: responses.length,
      finalConfidence: avgConfidence,
      selectedResponse: bestResponse.id
    });

    return aggregatedResponse;
  }

  /**
   * Validate response quality against thresholds
   */
  async validateResponse(response: AIResponse): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const suggestions: string[] = [];

    // Check confidence threshold
    if (response.confidence < this.config.qualityThreshold) {
      issues.push({
        type: 'accuracy',
        severity: 'medium',
        description: `Response confidence ${response.confidence} below threshold ${this.config.qualityThreshold}`,
        suggestion: 'Consider using a more capable model or providing more context'
      });
    }

    // Check response time (using 200ms default target)
    const maxResponseTime = 200; // Default target from Cycle 4 requirements
    if (response.processingTime > maxResponseTime) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `Response time ${response.processingTime}ms exceeds target ${maxResponseTime}ms`,
        suggestion: 'Consider optimizing model selection or using caching'
      });
    }

    // Validate response content
    if (!response.result || (typeof response.result === 'string' && response.result.trim().length === 0)) {
      issues.push({
        type: 'accuracy',
        severity: 'critical',
        description: 'Response contains no meaningful content',
        suggestion: 'Retry with different model or adjust request parameters'
      });
    }

    const isValid = issues.filter(i => i.severity === 'critical').length === 0;

    return {
      isValid,
      confidence: response.confidence,
      issues,
      suggestions
    };
  }

  /**
   * Track performance metrics for continuous optimization
   */
  trackPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // Keep only recent metrics (last 1000 entries)
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    // Record metrics with performance monitor
    this.performanceMonitor.recordMetric('ai_response_time', metrics.responseTime, MetricType.RESPONSE_TIME);
    this.performanceMonitor.recordMetric('ai_throughput', metrics.throughput, MetricType.EXECUTION_TIME);
    this.performanceMonitor.recordMetric('ai_error_rate', metrics.errorRate, MetricType.ERROR_RATE);
    this.performanceMonitor.recordMetric('ai_user_satisfaction', metrics.userSatisfaction, MetricType.SUGGESTION_QUALITY);

    this.logger.debug('Performance metrics tracked', metrics as unknown as Record<string, unknown>);
  }

  /**
   * Optimize resource allocation based on performance history
   */
  async optimizeResourceAllocation(): Promise<void> {
    if (this.performanceHistory.length < 10) {
      return; // Need more data for optimization
    }

    const recentMetrics = this.performanceHistory.slice(-100);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;

    const targetResponseTime = 200; // Cycle 4 target
    this.logger.info('Optimizing resource allocation', {
      avgResponseTime,
      avgErrorRate,
      targetResponseTime,
      sampleSize: recentMetrics.length
    });

    // Adjust concurrent request limit based on performance
    if (avgResponseTime > targetResponseTime * 1.2) {
      this.config.maxConcurrentRequests = Math.max(1, Math.floor(this.config.maxConcurrentRequests * 0.8));
      this.logger.info('Reduced concurrent request limit', { 
        newLimit: this.config.maxConcurrentRequests 
      });
    } else if (avgResponseTime < targetResponseTime * 0.8 && avgErrorRate < 0.05) {
      this.config.maxConcurrentRequests = Math.min(20, Math.ceil(this.config.maxConcurrentRequests * 1.2));
      this.logger.info('Increased concurrent request limit', { 
        newLimit: this.config.maxConcurrentRequests 
      });
    }
  }

  /**
   * Record user feedback for learning and improvement
   */
  recordUserFeedback(feedback: UserFeedback): void {
    this.userFeedbackHistory.push(feedback);
    
    // Keep only recent feedback (last 5000 entries)
    if (this.userFeedbackHistory.length > 5000) {
      this.userFeedbackHistory = this.userFeedbackHistory.slice(-5000);
    }

    this.logger.info('User feedback recorded', {
      requestId: feedback.requestId,
      rating: feedback.rating,
      accepted: feedback.accepted,
      feedbackLength: feedback.feedback.length
    });

    // Trigger model retraining if we have enough negative feedback
    const recentFeedback = this.userFeedbackHistory.slice(-100);
    const negativeRatio = recentFeedback.filter(f => f.rating < 3).length / recentFeedback.length;
    
    if (negativeRatio > 0.3 && recentFeedback.length >= 50) {
      this.logger.warn('High negative feedback ratio detected, triggering model retraining', {
        negativeRatio,
        sampleSize: recentFeedback.length
      });
      this.triggerModelRetraining().catch(error => {
        this.logger.error('Failed to trigger model retraining', { error: error instanceof Error ? error.message : String(error) });
      });
    }
  }

  /**
   * Update model preferences based on user behavior
   */
  updateModelPreferences(preferences: ModelPreferences): void {
    this.logger.info('Model preferences updated', preferences as unknown as Record<string, unknown>);
    // Implementation will be completed in model router integration
  }

  /**
   * Trigger model retraining based on feedback and performance
   */
  async triggerModelRetraining(): Promise<void> {
    this.logger.info('Triggering model retraining');
    // Implementation will be completed in learning pipeline integration
  }

  // Private helper methods

  private async validateRequest(request: AIRequest): Promise<void> {
    if (!request.id || !request.type || !request.context) {
      throw new AIError(
        'Invalid request: missing required fields',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      throw new AIError(
        'Maximum concurrent requests exceeded',
        AIErrorCode.INSUFFICIENT_RESOURCES,
        true
      );
    }
  }

  private async getCachedResponse(request: AIRequest): Promise<AIResponse | null> {
    // Implementation will be completed with caching system
    return null;
  }

  private async executeRequest(request: AIRequest, modelSelection: ModelSelection): Promise<AIResponse> {
    return await this.modelRouter.routeRequest(request, modelSelection);
  }

  private async cacheResponse(request: AIRequest, response: AIResponse): Promise<void> {
    // Implementation will be completed with caching system
  }

  private async trackRequestPerformance(
    request: AIRequest, 
    response: AIResponse, 
    processingTime: number
  ): Promise<void> {
    const metrics: PerformanceMetrics = {
      responseTime: processingTime,
      throughput: 1000 / processingTime, // requests per second
      errorRate: 0, // successful request
      resourceUsage: {
        cpuUsage: 0, // Will be implemented with resource monitoring
        memoryUsage: 0,
        networkBandwidth: 0,
        storageUsage: 0
      },
      userSatisfaction: response.confidence // Proxy for satisfaction
    };

    this.trackPerformanceMetrics(metrics);
  }

  private async handleRequestError(
    request: AIRequest, 
    error: AIError, 
    processingTime: number
  ): Promise<void> {
    this.logger.error('AI request failed', {
      requestId: request.id,
      error: error instanceof Error ? error.message : String(error),
      code: error.code,
      processingTime,
      retryable: error.retryable
    });

    // Track error metrics
    const errorMetrics: PerformanceMetrics = {
      responseTime: processingTime,
      throughput: 0,
      errorRate: 1,
      resourceUsage: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkBandwidth: 0,
        storageUsage: 0
      },
      userSatisfaction: 0
    };

    this.trackPerformanceMetrics(errorMetrics);

    // Implement retry logic for retryable errors
    if (error.retryable && request.priority >= RequestPriority.HIGH) {
      // Retry logic will be implemented in next iteration
    }
  }
}