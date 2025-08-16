/**
 * Model Router Implementation
 * 
 * Handles model selection, load balancing, and request routing for optimal
 * AI performance with intelligent failover capabilities.
 */

import {
  ModelRouter as IModelRouter,
  AIRequest,
  AIResponse,
  ModelSelection,
  ModelConfiguration,
  RoutingPlan,
  RouteAssignment,
  HealthStatus,
  AIError,
  AIErrorCode,
  ModelProvider,
  ModelCapability,
  RequestPriority,
  PrivacyLevel
} from './interfaces';
import { Logger } from '../logging/logger';
import { PerformanceMonitor, MetricType } from '../monitoring/performance-monitor';

export class ModelRouter implements IModelRouter {
  private models: Map<string, ModelConfiguration> = new Map();
  private modelHealth: Map<string, HealthStatus> = new Map();
  private loadBalancer: LoadBalancer;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private routingHistory: RouteAssignment[] = [];

  constructor(logger: Logger, performanceMonitor: PerformanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.loadBalancer = new LoadBalancer();
  }

  /**
   * Select optimal model based on request characteristics and performance
   */
  async selectModel(request: AIRequest): Promise<ModelSelection> {
    const availableModels = await this.getHealthyModels();
    
    if (availableModels.length === 0) {
      throw new AIError(
        'No healthy models available',
        AIErrorCode.MODEL_UNAVAILABLE,
        true
      );
    }

    // Filter models by capability requirements
    const capableModels = this.filterByCapability(availableModels, request);
    
    if (capableModels.length === 0) {
      throw new AIError(
        `No models available with required capabilities for ${request.type}`,
        AIErrorCode.MODEL_UNAVAILABLE,
        false
      );
    }

    // Filter by privacy requirements
    const privacyCompliantModels = this.filterByPrivacy(capableModels, request.privacyLevel);
    
    if (privacyCompliantModels.length === 0) {
      throw new AIError(
        `No models available that meet privacy level ${request.privacyLevel}`,
        AIErrorCode.PRIVACY_VIOLATION,
        false
      );
    }

    // Score and rank models
    const scoredModels = await this.scoreModels(privacyCompliantModels, request);
    const bestModel = scoredModels[0];

    const selection: ModelSelection = {
      modelId: bestModel.model.modelId,
      provider: bestModel.model.provider,
      confidence: bestModel.score,
      estimatedCost: this.estimateCost(bestModel.model, request),
      estimatedLatency: bestModel.model.responseTime,
      reasoning: bestModel.reasoning
    };

    this.logger.debug('Model selected', {
      requestId: request.id,
      selection,
      consideredModels: scoredModels.length,
      availableModels: availableModels.length
    });

    return selection;
  }

  /**
   * Route request to selected model with error handling
   */
  async routeRequest(request: AIRequest, model: ModelSelection): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Get model configuration
      const modelConfig = this.models.get(model.modelId);
      if (!modelConfig) {
        throw new AIError(
          `Model configuration not found: ${model.modelId}`,
          AIErrorCode.MODEL_UNAVAILABLE,
          false
        );
      }

      // Check model health before routing
      const health = await this.healthCheck(model.modelId);
      if (health.status === 'unhealthy') {
        throw new AIError(
          `Model ${model.modelId} is unhealthy: ${health.issues.join(', ')}`,
          AIErrorCode.MODEL_UNAVAILABLE,
          true
        );
      }

      // Route to appropriate provider
      const response = await this.routeToProvider(request, modelConfig);
      
      // Update routing history
      const processingTime = Date.now() - startTime;
      this.updateRoutingHistory(request, model, processingTime, true);

      // Track performance metrics
      this.performanceMonitor.recordMetric('model_response_time', processingTime, MetricType.RESPONSE_TIME);
      this.performanceMonitor.recordMetric('model_success_rate', 1, MetricType.ERROR_RATE);

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateRoutingHistory(request, model, processingTime, false);
      
      this.logger.error('Request routing failed', {
        requestId: request.id,
        modelId: model.modelId,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      // Track error metrics
      this.performanceMonitor.recordMetric('model_error_rate', 1, MetricType.ERROR_RATE);
      
      throw error;
    }
  }

  /**
   * Balance load across multiple requests
   */
  async balanceLoad(requests: AIRequest[]): Promise<RoutingPlan> {
    const routes: RouteAssignment[] = [];
    const loadDistribution: Record<string, number> = {};
    let totalEstimatedLatency = 0;
    let totalEstimatedCost = 0;

    // Sort requests by priority
    const sortedRequests = requests.sort((a, b) => b.priority - a.priority);

    for (const request of sortedRequests) {
      try {
        const modelSelection = await this.selectModel(request);
        
        const assignment: RouteAssignment = {
          requestId: request.id,
          modelId: modelSelection.modelId,
          priority: request.priority,
          estimatedProcessingTime: modelSelection.estimatedLatency
        };

        routes.push(assignment);
        
        // Update load distribution
        loadDistribution[modelSelection.modelId] = 
          (loadDistribution[modelSelection.modelId] || 0) + 1;
        
        totalEstimatedLatency = Math.max(totalEstimatedLatency, modelSelection.estimatedLatency);
        totalEstimatedCost += modelSelection.estimatedCost;

      } catch (error) {
        this.logger.warn('Failed to route request in load balancing', {
          requestId: request.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const plan: RoutingPlan = {
      routes,
      estimatedLatency: totalEstimatedLatency,
      estimatedCost: totalEstimatedCost,
      loadDistribution
    };

    this.logger.debug('Load balancing plan created', {
      requestCount: requests.length,
      routedCount: routes.length,
      plan
    });

    return plan;
  }

  /**
   * Handle failover when a model fails
   */
  async handleFailover(failedModel: string, request: AIRequest): Promise<AIResponse> {
    this.logger.warn('Handling model failover', {
      failedModel,
      requestId: request.id
    });

    // Mark model as unhealthy
    await this.markModelUnhealthy(failedModel, 'Request processing failed');

    // Select alternative model (excluding failed one)
    const availableModels = (await this.getHealthyModels())
      .filter(m => m.modelId !== failedModel);

    if (availableModels.length === 0) {
      throw new AIError(
        'No alternative models available for failover',
        AIErrorCode.MODEL_UNAVAILABLE,
        false
      );
    }

    // Create new request with failover context
    const failoverRequest: AIRequest = {
      ...request,
      id: `${request.id}_failover_${Date.now()}`
    };

    // Select and route to alternative model
    const alternativeModel = await this.selectModel(failoverRequest);
    return await this.routeRequest(failoverRequest, alternativeModel);
  }

  /**
   * Register a new model
   */
  async registerModel(model: ModelConfiguration): Promise<void> {
    this.models.set(model.modelId, model);
    
    // Initialize health status
    this.modelHealth.set(model.modelId, {
      status: 'healthy',
      responseTime: model.responseTime,
      errorRate: 0,
      lastChecked: new Date(),
      issues: []
    });

    this.logger.info('Model registered', {
      modelId: model.modelId,
      provider: model.provider,
      capabilities: model.capabilities
    });
  }

  /**
   * Unregister a model
   */
  async unregisterModel(modelId: string): Promise<void> {
    this.models.delete(modelId);
    this.modelHealth.delete(modelId);
    
    this.logger.info('Model unregistered', { modelId });
  }

  /**
   * Get all available models
   */
  async getAvailableModels(): Promise<ModelConfiguration[]> {
    return Array.from(this.models.values());
  }

  /**
   * Check health of a specific model
   */
  async healthCheck(modelId: string): Promise<HealthStatus> {
    const model = this.models.get(modelId);
    if (!model) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 1,
        lastChecked: new Date(),
        issues: ['Model not found']
      };
    }

    // Get cached health status
    const cachedHealth = this.modelHealth.get(modelId);
    if (cachedHealth && this.isHealthStatusFresh(cachedHealth)) {
      return cachedHealth;
    }

    // Perform actual health check
    const startTime = Date.now();
    try {
      const isHealthy = await this.performHealthCheck(model);
      const responseTime = Date.now() - startTime;
      
      const health: HealthStatus = {
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        errorRate: this.calculateErrorRate(modelId),
        lastChecked: new Date(),
        issues: isHealthy ? [] : ['Health check failed']
      };

      this.modelHealth.set(modelId, health);
      return health;

    } catch (error) {
      const health: HealthStatus = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastChecked: new Date(),
        issues: [error instanceof Error ? error.message : String(error)]
      };

      this.modelHealth.set(modelId, health);
      return health;
    }
  }

  // Private helper methods

  private async getHealthyModels(): Promise<ModelConfiguration[]> {
    const models = Array.from(this.models.values());
    const healthyModels: ModelConfiguration[] = [];

    for (const model of models) {
      const health = await this.healthCheck(model.modelId);
      if (health.status !== 'unhealthy') {
        healthyModels.push(model);
      }
    }

    return healthyModels;
  }

  private filterByCapability(models: ModelConfiguration[], request: AIRequest): ModelConfiguration[] {
    const requiredCapability = this.getRequiredCapability(request.type);
    return models.filter(model => model.capabilities.includes(requiredCapability));
  }

  private filterByPrivacy(models: ModelConfiguration[], privacyLevel: PrivacyLevel): ModelConfiguration[] {
    if (privacyLevel === PrivacyLevel.LOCAL_ONLY) {
      return models.filter(model => 
        model.provider === ModelProvider.OLLAMA || 
        model.provider === ModelProvider.CUSTOM
      );
    }
    return models; // All models acceptable for other privacy levels
  }

  private async scoreModels(
    models: ModelConfiguration[], 
    request: AIRequest
  ): Promise<Array<{ model: ModelConfiguration; score: number; reasoning: string }>> {
    const scoredModels = models.map(model => {
      let score = 0;
      const factors: string[] = [];

      // Accuracy weight (40%)
      score += model.accuracy * 0.4;
      factors.push(`accuracy: ${model.accuracy}`);

      // Performance weight (30%)
      const performanceScore = Math.max(0, 1 - (model.responseTime / 1000)); // Normalize to 0-1
      score += performanceScore * 0.3;
      factors.push(`performance: ${performanceScore.toFixed(2)}`);

      // Cost efficiency weight (20%)
      const costScore = Math.max(0, 1 - (model.costPerToken / 0.01)); // Normalize assuming max $0.01/token
      score += costScore * 0.2;
      factors.push(`cost: ${costScore.toFixed(2)}`);

      // Availability weight (10%)
      score += model.availability * 0.1;
      factors.push(`availability: ${model.availability}`);

      // Priority boost for high-priority requests
      if (request.priority >= RequestPriority.HIGH) {
        score += 0.1;
        factors.push('priority boost');
      }

      return {
        model,
        score,
        reasoning: `Factors: ${factors.join(', ')} | Total: ${score.toFixed(3)}`
      };
    });

    // Sort by score (descending)
    return scoredModels.sort((a, b) => b.score - a.score);
  }

  private getRequiredCapability(requestType: string): ModelCapability {
    switch (requestType) {
      case 'code_completion':
        return ModelCapability.CODE_COMPLETION;
      case 'natural_language':
        return ModelCapability.NATURAL_LANGUAGE;
      case 'predictive_analysis':
        return ModelCapability.CODE_ANALYSIS;
      case 'debug_assistance':
        return ModelCapability.REASONING;
      default:
        return ModelCapability.TEXT_GENERATION;
    }
  }

  private estimateCost(model: ModelConfiguration, request: AIRequest): number {
    // Estimate token usage based on request type and context
    const estimatedTokens = this.estimateTokenUsage(request);
    return estimatedTokens * model.costPerToken;
  }

  private estimateTokenUsage(request: AIRequest): number {
    // Simple estimation - will be refined with actual usage data
    switch (request.type) {
      case 'code_completion':
        return 150; // Average for code completion
      case 'natural_language':
        return 300; // Average for NLP commands
      case 'predictive_analysis':
        return 500; // More complex analysis
      case 'debug_assistance':
        return 400; // Debugging context
      default:
        return 200; // Default estimate
    }
  }

  private async routeToProvider(request: AIRequest, model: ModelConfiguration): Promise<AIResponse> {
    // This will be implemented with actual provider integrations
    // For now, return a mock response
    return {
      id: `response_${Date.now()}`,
      requestId: request.id,
      result: 'Mock AI response',
      confidence: 0.85,
      modelUsed: model.modelId,
      processingTime: model.responseTime,
      tokens: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: this.estimateCost(model, request)
      }
    };
  }

  private updateRoutingHistory(
    request: AIRequest, 
    model: ModelSelection, 
    processingTime: number, 
    success: boolean
  ): void {
    const assignment: RouteAssignment = {
      requestId: request.id,
      modelId: model.modelId,
      priority: request.priority,
      estimatedProcessingTime: processingTime
    };

    this.routingHistory.push(assignment);
    
    // Keep only recent history (last 1000 entries)
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-1000);
    }
  }

  private async markModelUnhealthy(modelId: string, reason: string): Promise<void> {
    const health = this.modelHealth.get(modelId);
    if (health) {
      health.status = 'unhealthy';
      health.issues.push(reason);
      health.lastChecked = new Date();
      this.modelHealth.set(modelId, health);
    }
  }

  private isHealthStatusFresh(health: HealthStatus): boolean {
    const maxAge = 60000; // 1 minute
    return Date.now() - health.lastChecked.getTime() < maxAge;
  }

  private async performHealthCheck(model: ModelConfiguration): Promise<boolean> {
    // Implementation will be completed with actual provider health checks
    return true; // Mock implementation
  }

  private calculateErrorRate(modelId: string): number {
    const recentHistory = this.routingHistory
      .filter(h => h.modelId === modelId)
      .slice(-100); // Last 100 requests

    if (recentHistory.length === 0) return 0;

    // This is a simplified calculation - will be enhanced with actual error tracking
    return 0.05; // Mock 5% error rate
  }
}

/**
 * Load Balancer for distributing requests across models
 */
class LoadBalancer {
  private requestCounts: Map<string, number> = new Map();

  getNextModel(availableModels: string[]): string {
    if (availableModels.length === 0) {
      throw new Error('No models available for load balancing');
    }

    if (availableModels.length === 1) {
      return availableModels[0];
    }

    // Round-robin load balancing
    let selectedModel = availableModels[0];
    let minRequests = this.requestCounts.get(selectedModel) || 0;

    for (const modelId of availableModels) {
      const requests = this.requestCounts.get(modelId) || 0;
      if (requests < minRequests) {
        minRequests = requests;
        selectedModel = modelId;
      }
    }

    // Increment request count
    this.requestCounts.set(selectedModel, minRequests + 1);

    return selectedModel;
  }

  resetCounts(): void {
    this.requestCounts.clear();
  }
}