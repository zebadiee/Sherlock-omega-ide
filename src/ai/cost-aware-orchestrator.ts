/**
 * SHERLOCK Ω COST-AWARE AI ORCHESTRATOR
 * Intelligent routing and cost optimization for multi-LLM requests
 * "Nothing is truly impossible—only unconceived."
 */

import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

export class CostAwareAIOrchestrator {
  private logger: Logger;
  private providerCosts: Map<string, ProviderCostInfo> = new Map();
  private requestHistory: AIRequestRecord[] = [];

  constructor(platform: PlatformType) {
    this.logger = new Logger(platform);
    this.initializeProviderCosts();
  }

  private initializeProviderCosts(): void {
    // OpenRouter pricing (example rates)
    this.providerCosts.set('openrouter/gpt-4-turbo', {
      provider: 'OpenRouter',
      model: 'gpt-4-turbo',
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      capabilities: ['reasoning', 'code-generation', 'analysis'],
      averageResponseTime: 2000
    });

    this.providerCosts.set('openrouter/claude-3-opus', {
      provider: 'OpenRouter',
      model: 'claude-3-opus',
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
      capabilities: ['reasoning', 'analysis', 'writing'],
      averageResponseTime: 1800
    });

    this.providerCosts.set('openrouter/deepseek-coder', {
      provider: 'OpenRouter',
      model: 'deepseek-coder',
      inputCostPer1k: 0.0014,
      outputCostPer1k: 0.0028,
      capabilities: ['code-generation', 'debugging', 'optimization'],
      averageResponseTime: 1200
    });

    this.providerCosts.set('groq/llama-3-70b', {
      provider: 'Groq',
      model: 'llama-3-70b',
      inputCostPer1k: 0.0005,
      outputCostPer1k: 0.0008,
      capabilities: ['fast-inference', 'general'],
      averageResponseTime: 300
    });

    this.providerCosts.set('ollama/local', {
      provider: 'Ollama',
      model: 'local-model',
      inputCostPer1k: 0,
      outputCostPer1k: 0,
      capabilities: ['privacy', 'offline'],
      averageResponseTime: 5000
    });
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    this.logger.info(`🤖 Processing AI request: ${request.type}`);

    // Step 1: Analyze request requirements
    const requirements = this.analyzeRequestRequirements(request);
    
    // Step 2: Find optimal model based on cost, capability, and performance
    const optimalModel = await this.selectOptimalModel(request, requirements);
    
    // Step 3: Execute request with selected model
    const response = await this.executeWithModel(request, optimalModel);
    
    // Step 4: Record for cost analysis and learning
    await this.recordRequest(request, response, optimalModel);
    
    return response;
  }

  private analyzeRequestRequirements(request: AIRequest): RequestRequirements {
    const requirements: RequestRequirements = {
      capabilities: [],
      maxLatency: 5000,
      privacyLevel: request.privacyLevel || 'FULL_CLOUD',
      costSensitivity: 'medium'
    };

    // Analyze request type to determine requirements
    switch (request.type) {
      case 'code-completion':
        requirements.capabilities = ['code-generation', 'fast-inference'];
        requirements.maxLatency = 1000;
        requirements.costSensitivity = 'high'; // Frequent requests
        break;

      case 'code-analysis':
        requirements.capabilities = ['reasoning', 'analysis'];
        requirements.maxLatency = 3000;
        requirements.costSensitivity = 'medium';
        break;

      case 'explanation':
        requirements.capabilities = ['reasoning', 'writing'];
        requirements.maxLatency = 4000;
        requirements.costSensitivity = 'low'; // Quality over cost
        break;

      case 'debugging':
        requirements.capabilities = ['debugging', 'reasoning'];
        requirements.maxLatency = 2000;
        requirements.costSensitivity = 'medium';
        break;
    }

    return requirements;
  }

  private async selectOptimalModel(request: AIRequest, requirements: RequestRequirements): Promise<string> {
    this.logger.info('🎯 Selecting optimal model based on cost, capability, and performance...');

    const candidates: ModelCandidate[] = [];

    // Evaluate each provider
    for (const [modelId, costInfo] of this.providerCosts) {
      const score = this.calculateModelScore(costInfo, requirements, request);
      
      if (score > 0) {
        candidates.push({
          modelId,
          costInfo,
          score,
          estimatedCost: this.estimateRequestCost(request, costInfo)
        });
      }
    }

    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      throw new Error('No suitable model found for request');
    }

    const selected = candidates[0];
    this.logger.info(`✅ Selected model: ${selected.modelId} (score: ${selected.score.toFixed(2)}, estimated cost: $${selected.estimatedCost.toFixed(4)})`);

    return selected.modelId;
  }

  private calculateModelScore(
    costInfo: ProviderCostInfo,
    requirements: RequestRequirements,
    request: AIRequest
  ): number {
    let score = 0;

    // Capability match (40% of score)
    const capabilityMatch = this.calculateCapabilityMatch(costInfo.capabilities, requirements.capabilities);
    score += capabilityMatch * 0.4;

    // Cost efficiency (30% of score)
    const costEfficiency = this.calculateCostEfficiency(costInfo, requirements.costSensitivity);
    score += costEfficiency * 0.3;

    // Performance (20% of score)
    const performanceScore = this.calculatePerformanceScore(costInfo, requirements.maxLatency);
    score += performanceScore * 0.2;

    // Privacy compliance (10% of score)
    const privacyScore = this.calculatePrivacyScore(costInfo, requirements.privacyLevel);
    score += privacyScore * 0.1;

    return score;
  }

  private calculateCapabilityMatch(modelCapabilities: string[], requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 1;

    const matches = requiredCapabilities.filter(req => 
      modelCapabilities.some(cap => cap.includes(req) || req.includes(cap))
    );

    return matches.length / requiredCapabilities.length;
  }

  private calculateCostEfficiency(costInfo: ProviderCostInfo, sensitivity: CostSensitivity): number {
    const totalCostPer1k = costInfo.inputCostPer1k + costInfo.outputCostPer1k;
    
    // Normalize cost (lower cost = higher score)
    const maxCost = 0.1; // $0.10 per 1k tokens as reference
    const costScore = Math.max(0, (maxCost - totalCostPer1k) / maxCost);

    // Apply sensitivity multiplier
    const sensitivityMultiplier = {
      'low': 0.5,
      'medium': 1.0,
      'high': 2.0
    }[sensitivity];

    return Math.min(1, costScore * sensitivityMultiplier);
  }

  private calculatePerformanceScore(costInfo: ProviderCostInfo, maxLatency: number): number {
    if (costInfo.averageResponseTime <= maxLatency) {
      // Reward faster responses
      return Math.max(0, (maxLatency - costInfo.averageResponseTime) / maxLatency);
    }
    return 0; // Fails latency requirement
  }

  private calculatePrivacyScore(costInfo: ProviderCostInfo, privacyLevel: string): number {
    if (privacyLevel === 'LOCAL_ONLY') {
      return costInfo.provider === 'Ollama' ? 1 : 0;
    }
    return 1; // All cloud providers acceptable for other privacy levels
  }

  private estimateRequestCost(request: AIRequest, costInfo: ProviderCostInfo): number {
    // Estimate token usage based on request type and payload size
    const estimatedInputTokens = this.estimateInputTokens(request);
    const estimatedOutputTokens = this.estimateOutputTokens(request);

    const inputCost = (estimatedInputTokens / 1000) * costInfo.inputCostPer1k;
    const outputCost = (estimatedOutputTokens / 1000) * costInfo.outputCostPer1k;

    return inputCost + outputCost;
  }

  private estimateInputTokens(request: AIRequest): number {
    // Simple estimation based on payload size
    const payloadSize = JSON.stringify(request.payload).length;
    return Math.ceil(payloadSize / 4); // Rough approximation: 4 chars per token
  }

  private estimateOutputTokens(request: AIRequest): number {
    // Estimate based on request type
    const estimates = {
      'code-completion': 50,
      'code-analysis': 200,
      'explanation': 300,
      'debugging': 150,
      'refactoring': 100
    };

    return estimates[request.type as keyof typeof estimates] || 100;
  }

  private async executeWithModel(request: AIRequest, modelId: string): Promise<AIResponse> {
    // Mock execution - in real implementation, this would call the actual model
    const startTime = Date.now();
    
    // Simulate processing time based on model
    const costInfo = this.providerCosts.get(modelId);
    if (costInfo) {
      await new Promise(resolve => setTimeout(resolve, costInfo.averageResponseTime / 10));
    }

    const processingTime = Date.now() - startTime;
    const estimatedTokens = this.estimateInputTokens(request) + this.estimateOutputTokens(request);

    return {
      id: `response-${Date.now()}`,
      requestId: request.id,
      result: `Mock response from ${modelId}`,
      confidence: 0.9,
      modelUsed: modelId,
      processingTime,
      tokens: {
        promptTokens: this.estimateInputTokens(request),
        completionTokens: this.estimateOutputTokens(request),
        totalTokens: estimatedTokens
      }
    };
  }

  private async recordRequest(request: AIRequest, response: AIResponse, modelId: string): Promise<void> {
    const costInfo = this.providerCosts.get(modelId);
    const actualCost = costInfo ? this.calculateActualCost(response.tokens, costInfo) : 0;

    const record: AIRequestRecord = {
      requestId: request.id,
      type: request.type,
      modelUsed: modelId,
      cost: actualCost,
      processingTime: response.processingTime,
      tokens: response.tokens,
      timestamp: new Date()
    };

    this.requestHistory.push(record);
    
    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }

  private calculateActualCost(tokens: TokenUsage, costInfo: ProviderCostInfo): number {
    const inputCost = (tokens.promptTokens / 1000) * costInfo.inputCostPer1k;
    const outputCost = (tokens.completionTokens / 1000) * costInfo.outputCostPer1k;
    return inputCost + outputCost;
  }

  async getCostAnalysis(request: AIRequest): Promise<CostAnalysisReport> {
    const requirements = this.analyzeRequestRequirements(request);
    const recommendations: ModelCandidate[] = [];

    // Analyze all suitable models
    for (const [modelId, costInfo] of this.providerCosts) {
      const score = this.calculateModelScore(costInfo, requirements, request);
      if (score > 0) {
        recommendations.push({
          modelId,
          costInfo,
          score,
          estimatedCost: this.estimateRequestCost(request, costInfo)
        });
      }
    }

    recommendations.sort((a, b) => a.estimatedCost - b.estimatedCost);

    const cheapest = recommendations[0];
    const recommended = recommendations.sort((a, b) => b.score - a.score)[0];

    return {
      requestId: request.id,
      totalCost: recommended.estimatedCost,
      breakdown: [{
        modelUsed: recommended.modelId,
        provider: recommended.costInfo.provider,
        inputTokens: this.estimateInputTokens(request),
        outputTokens: this.estimateOutputTokens(request),
        costPerToken: (recommended.costInfo.inputCostPer1k + recommended.costInfo.outputCostPer1k) / 1000
      }],
      recommendations: {
        alternativeModel: cheapest.modelId !== recommended.modelId ? cheapest.modelId : undefined,
        potentialSavings: cheapest.modelId !== recommended.modelId ? 
          recommended.estimatedCost - cheapest.estimatedCost : 0,
        reasonForRecommendation: 'Balanced cost, performance, and capability match'
      },
      timestamp: new Date()
    };
  }

  // Get usage statistics
  getUsageStatistics(): UsageStatistics {
    const totalCost = this.requestHistory.reduce((sum, record) => sum + record.cost, 0);
    const totalRequests = this.requestHistory.length;
    const averageCost = totalRequests > 0 ? totalCost / totalRequests : 0;

    const modelUsage = new Map<string, number>();
    this.requestHistory.forEach(record => {
      modelUsage.set(record.modelUsed, (modelUsage.get(record.modelUsed) || 0) + 1);
    });

    return {
      totalRequests,
      totalCost,
      averageCost,
      modelUsage: Object.fromEntries(modelUsage),
      timeRange: {
        start: this.requestHistory[0]?.timestamp || new Date(),
        end: this.requestHistory[this.requestHistory.length - 1]?.timestamp || new Date()
      }
    };
  }
}

// Interfaces
interface ProviderCostInfo {
  provider: string;
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  capabilities: string[];
  averageResponseTime: number;
}

interface RequestRequirements {
  capabilities: string[];
  maxLatency: number;
  privacyLevel: string;
  costSensitivity: CostSensitivity;
}

type CostSensitivity = 'low' | 'medium' | 'high';

interface ModelCandidate {
  modelId: string;
  costInfo: ProviderCostInfo;
  score: number;
  estimatedCost: number;
}

interface AIRequestRecord {
  requestId: string;
  type: string;
  modelUsed: string;
  cost: number;
  processingTime: number;
  tokens: TokenUsage;
  timestamp: Date;
}

interface UsageStatistics {
  totalRequests: number;
  totalCost: number;
  averageCost: number;
  modelUsage: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

interface CostAnalysisReport {
  requestId: string;
  totalCost: number;
  breakdown: {
    modelUsed: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    costPerToken: number;
  }[];
  recommendations: {
    alternativeModel?: string;
    potentialSavings?: number;
    reasonForRecommendation?: string;
  };
  timestamp: Date;
}

interface AIRequest {
  id: string;
  type: string;
  payload: any;
  privacyLevel?: string;
}

interface AIResponse {
  id: string;
  requestId: string;
  result: any;
  confidence: number;
  modelUsed: string;
  processingTime: number;
  tokens: TokenUsage;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}