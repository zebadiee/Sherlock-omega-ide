import { Observable, BehaviorSubject } from 'rxjs';

export interface ModelCapability {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  optimalUseCases: string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'local' | 'custom';
  endpoint?: string;
  apiKey?: string;
  maxTokens: number;
  costPerToken: number;
  averageLatency: number;
  capabilities: ModelCapability[];
  isAvailable: boolean;
  qualityScore: number; // 0-1
  speedScore: number; // 0-1
  costScore: number; // 0-1 (higher = more cost effective)
}

export interface TaskRequirements {
  type: 'code-generation' | 'analysis' | 'testing' | 'documentation' | 'debugging' | 'explanation';
  complexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxLatency?: number; // milliseconds
  maxCost?: number; // per request
  qualityThreshold?: number; // 0-1
  language?: string;
  context?: any;
}

export interface ModelSelection {
  model: ModelConfig;
  confidence: number; // 0-1
  reasoning: string[];
  alternatives: Array<{
    model: ModelConfig;
    score: number;
    reason: string;
  }>;
  estimatedCost: number;
  estimatedLatency: number;
}

export interface ModelPerformance {
  modelId: string;
  taskType: string;
  successRate: number;
  averageLatency: number;
  averageCost: number;
  qualityRating: number;
  totalRequests: number;
  lastUpdated: Date;
}

export class IntelligentModelRouter {
  private models = new Map<string, ModelConfig>();
  private performance = new Map<string, ModelPerformance>();
  private modelSubject = new BehaviorSubject<ModelConfig[]>([]);
  
  private selectionHistory: Array<{
    requirements: TaskRequirements;
    selection: ModelSelection;
    actualPerformance?: {
      latency: number;
      cost: number;
      quality: number;
      success: boolean;
    };
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeDefaultModels();
    this.loadPerformanceHistory();
  }

  // Model Management
  registerModel(model: ModelConfig): void {
    this.models.set(model.id, model);
    this.updateModelsSubject();
  }

  removeModel(modelId: string): void {
    this.models.delete(modelId);
    this.performance.delete(modelId);
    this.updateModelsSubject();
  }

  getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  getAvailableModels(): ModelConfig[] {
    return Array.from(this.models.values()).filter(m => m.isAvailable);
  }

  // Intelligent Model Selection
  async selectOptimalModel(requirements: TaskRequirements): Promise<ModelSelection> {
    const availableModels = this.getAvailableModels();
    if (availableModels.length === 0) {
      throw new Error('No available models');
    }

    const scoredModels = availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model, requirements),
      reasoning: this.generateReasoningForModel(model, requirements)
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    const bestModel = scoredModels[0];
    const alternatives = scoredModels.slice(1, 4).map(sm => ({
      model: sm.model,
      score: sm.score,
      reason: sm.reasoning.join(', ')
    }));

    const selection: ModelSelection = {
      model: bestModel.model,
      confidence: bestModel.score,
      reasoning: bestModel.reasoning,
      alternatives,
      estimatedCost: this.estimateCost(bestModel.model, requirements),
      estimatedLatency: this.estimateLatency(bestModel.model, requirements)
    };

    // Record selection for learning
    this.selectionHistory.push({
      requirements,
      selection,
      timestamp: new Date()
    });

    return selection;
  }

  // Model Scoring Algorithm
  private calculateModelScore(model: ModelConfig, requirements: TaskRequirements): number {
    let score = 0;
    const weights = this.getWeights(requirements);

    // Base capability score
    const capabilityScore = this.calculateCapabilityScore(model, requirements);
    score += capabilityScore * weights.capability;

    // Performance history score
    const performanceScore = this.calculatePerformanceScore(model, requirements);
    score += performanceScore * weights.performance;

    // Cost efficiency score
    const costScore = this.calculateCostScore(model, requirements);
    score += costScore * weights.cost;

    // Speed score
    const speedScore = this.calculateSpeedScore(model, requirements);
    score += speedScore * weights.speed;

    // Quality score
    score += model.qualityScore * weights.quality;

    // Apply penalties
    score = this.applyPenalties(score, model, requirements);

    return Math.max(0, Math.min(1, score));
  }

  private getWeights(requirements: TaskRequirements): Record<string, number> {
    const baseWeights = {
      capability: 0.3,
      performance: 0.2,
      cost: 0.15,
      speed: 0.15,
      quality: 0.2
    };

    // Adjust weights based on priority and requirements
    if (requirements.priority === 'critical') {
      baseWeights.quality = 0.4;
      baseWeights.performance = 0.3;
      baseWeights.cost = 0.05;
    } else if (requirements.maxLatency && requirements.maxLatency < 5000) {
      baseWeights.speed = 0.4;
      baseWeights.quality = 0.15;
    } else if (requirements.maxCost && requirements.maxCost < 0.01) {
      baseWeights.cost = 0.4;
      baseWeights.quality = 0.15;
    }

    return baseWeights;
  }

  private calculateCapabilityScore(model: ModelConfig, requirements: TaskRequirements): number {
    const relevantCapabilities = model.capabilities.filter(cap =>
      cap.optimalUseCases.includes(requirements.type) ||
      cap.strengths.some(strength => 
        strength.toLowerCase().includes(requirements.type.toLowerCase())
      )
    );

    if (relevantCapabilities.length === 0) return 0.3; // Base score for general capability

    // Score based on how well capabilities match requirements
    let score = relevantCapabilities.length / model.capabilities.length;
    
    // Bonus for exact matches
    const exactMatches = relevantCapabilities.filter(cap =>
      cap.optimalUseCases.includes(requirements.type)
    );
    score += exactMatches.length * 0.2;

    return Math.min(1, score);
  }

  private calculatePerformanceScore(model: ModelConfig, requirements: TaskRequirements): number {
    const key = `${model.id}_${requirements.type}`;
    const perf = this.performance.get(key);
    
    if (!perf) return 0.5; // Neutral score for unknown performance

    let score = perf.successRate;
    
    // Adjust based on quality rating
    score = (score + perf.qualityRating) / 2;
    
    // Penalty for high latency if speed is important
    if (requirements.maxLatency && perf.averageLatency > requirements.maxLatency) {
      score *= 0.5;
    }

    return score;
  }

  private calculateCostScore(model: ModelConfig, requirements: TaskRequirements): number {
    if (!requirements.maxCost) return model.costScore;
    
    const estimatedCost = this.estimateCost(model, requirements);
    if (estimatedCost > requirements.maxCost) return 0;
    
    // Higher score for lower cost
    return Math.max(0, 1 - (estimatedCost / requirements.maxCost));
  }

  private calculateSpeedScore(model: ModelConfig, requirements: TaskRequirements): number {
    if (!requirements.maxLatency) return model.speedScore;
    
    const estimatedLatency = this.estimateLatency(model, requirements);
    if (estimatedLatency > requirements.maxLatency) return 0;
    
    // Higher score for lower latency
    return Math.max(0, 1 - (estimatedLatency / requirements.maxLatency));
  }

  private applyPenalties(score: number, model: ModelConfig, requirements: TaskRequirements): number {
    // Penalty for quality threshold not met
    if (requirements.qualityThreshold && model.qualityScore < requirements.qualityThreshold) {
      score *= 0.7;
    }

    // Penalty for complexity mismatch
    if (requirements.complexity === 'high' && model.qualityScore < 0.8) {
      score *= 0.8;
    }

    return score;
  }

  private generateReasoningForModel(model: ModelConfig, requirements: TaskRequirements): string[] {
    const reasoning: string[] = [];

    // Capability reasoning
    const relevantCaps = model.capabilities.filter(cap =>
      cap.optimalUseCases.includes(requirements.type)
    );
    if (relevantCaps.length > 0) {
      reasoning.push(`Optimized for ${requirements.type} tasks`);
    }

    // Performance reasoning
    const perfKey = `${model.id}_${requirements.type}`;
    const perf = this.performance.get(perfKey);
    if (perf && perf.successRate > 0.9) {
      reasoning.push(`High success rate (${(perf.successRate * 100).toFixed(1)}%)`);
    }

    // Cost reasoning
    if (model.costScore > 0.8) {
      reasoning.push('Cost-effective option');
    }

    // Speed reasoning
    if (model.speedScore > 0.8) {
      reasoning.push('Fast response times');
    }

    // Quality reasoning
    if (model.qualityScore > 0.9) {
      reasoning.push('High-quality outputs');
    }

    return reasoning;
  }

  // Cost and Latency Estimation
  private estimateCost(model: ModelConfig, requirements: TaskRequirements): number {
    let baseTokens = 1000; // Default estimate

    // Adjust based on task type and complexity
    const complexityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 2.0
    };

    const typeMultiplier = {
      'code-generation': 1.5,
      'analysis': 1.0,
      'testing': 1.2,
      'documentation': 0.8,
      'debugging': 1.3,
      'explanation': 0.7
    };

    const estimatedTokens = baseTokens * 
      complexityMultiplier[requirements.complexity] * 
      typeMultiplier[requirements.type];

    return estimatedTokens * model.costPerToken;
  }

  private estimateLatency(model: ModelConfig, requirements: TaskRequirements): number {
    let baseLatency = model.averageLatency;

    // Adjust based on complexity
    const complexityMultiplier = {
      low: 0.7,
      medium: 1.0,
      high: 1.5
    };

    return baseLatency * complexityMultiplier[requirements.complexity];
  }

  // Performance Tracking
  recordPerformance(
    modelId: string,
    taskType: string,
    performance: {
      latency: number;
      cost: number;
      quality: number;
      success: boolean;
    }
  ): void {
    const key = `${modelId}_${taskType}`;
    const existing = this.performance.get(key);

    if (existing) {
      // Update existing performance metrics (moving average)
      const alpha = 0.1; // Learning rate
      existing.averageLatency = existing.averageLatency * (1 - alpha) + performance.latency * alpha;
      existing.averageCost = existing.averageCost * (1 - alpha) + performance.cost * alpha;
      existing.qualityRating = existing.qualityRating * (1 - alpha) + performance.quality * alpha;
      existing.successRate = existing.successRate * (1 - alpha) + (performance.success ? 1 : 0) * alpha;
      existing.totalRequests++;
      existing.lastUpdated = new Date();
    } else {
      // Create new performance record
      this.performance.set(key, {
        modelId,
        taskType,
        successRate: performance.success ? 1 : 0,
        averageLatency: performance.latency,
        averageCost: performance.cost,
        qualityRating: performance.quality,
        totalRequests: 1,
        lastUpdated: new Date()
      });
    }

    // Update selection history with actual performance
    const recentSelection = this.selectionHistory
      .reverse()
      .find(h => h.selection.model.id === modelId && !h.actualPerformance);
    
    if (recentSelection) {
      recentSelection.actualPerformance = performance;
    }
  }

  // Analytics and Insights
  getModelAnalytics(modelId: string): {
    overallPerformance: ModelPerformance[];
    taskTypeBreakdown: Record<string, ModelPerformance>;
    trends: {
      qualityTrend: number; // -1 to 1
      speedTrend: number;
      costTrend: number;
    };
    recommendations: string[];
  } {
    const modelPerformances = Array.from(this.performance.values())
      .filter(p => p.modelId === modelId);

    const taskTypeBreakdown = modelPerformances.reduce((acc, perf) => {
      acc[perf.taskType] = perf;
      return acc;
    }, {} as Record<string, ModelPerformance>);

    // Calculate trends (simplified)
    const trends = {
      qualityTrend: 0,
      speedTrend: 0,
      costTrend: 0
    };

    const recommendations: string[] = [];
    
    // Generate recommendations based on performance
    const avgQuality = modelPerformances.reduce((sum, p) => sum + p.qualityRating, 0) / modelPerformances.length;
    if (avgQuality < 0.7) {
      recommendations.push('Consider using this model for simpler tasks only');
    }

    const avgLatency = modelPerformances.reduce((sum, p) => sum + p.averageLatency, 0) / modelPerformances.length;
    if (avgLatency > 10000) {
      recommendations.push('This model may be too slow for time-sensitive tasks');
    }

    return {
      overallPerformance: modelPerformances,
      taskTypeBreakdown,
      trends,
      recommendations
    };
  }

  // Observables
  getModels$(): Observable<ModelConfig[]> {
    return this.modelSubject.asObservable();
  }

  // Private methods
  private updateModelsSubject(): void {
    this.modelSubject.next(Array.from(this.models.values()));
  }

  private initializeDefaultModels(): void {
    const defaultModels: ModelConfig[] = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        costPerToken: 0.00003,
        averageLatency: 3000,
        capabilities: [
          {
            id: 'code-gen',
            name: 'Code Generation',
            description: 'Generate high-quality code',
            strengths: ['Complex logic', 'Multiple languages', 'Best practices'],
            weaknesses: ['Higher cost', 'Slower'],
            optimalUseCases: ['code-generation', 'debugging']
          }
        ],
        isAvailable: true,
        qualityScore: 0.95,
        speedScore: 0.6,
        costScore: 0.4
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        costPerToken: 0.000002,
        averageLatency: 1500,
        capabilities: [
          {
            id: 'fast-gen',
            name: 'Fast Generation',
            description: 'Quick code generation',
            strengths: ['Speed', 'Cost-effective', 'Good for simple tasks'],
            weaknesses: ['Lower quality for complex tasks'],
            optimalUseCases: ['explanation', 'documentation']
          }
        ],
        isAvailable: true,
        qualityScore: 0.8,
        speedScore: 0.9,
        costScore: 0.95
      },
      {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'anthropic',
        maxTokens: 8192,
        costPerToken: 0.000025,
        averageLatency: 2500,
        capabilities: [
          {
            id: 'analysis',
            name: 'Code Analysis',
            description: 'Excellent at code analysis and explanation',
            strengths: ['Analysis', 'Explanation', 'Safety'],
            weaknesses: ['Availability'],
            optimalUseCases: ['analysis', 'testing']
          }
        ],
        isAvailable: true,
        qualityScore: 0.9,
        speedScore: 0.7,
        costScore: 0.6
      }
    ];

    for (const model of defaultModels) {
      this.registerModel(model);
    }
  }

  private loadPerformanceHistory(): void {
    // In a real implementation, this would load from persistent storage
    // For now, we'll initialize with some sample data
    this.performance.set('gpt-4_code-generation', {
      modelId: 'gpt-4',
      taskType: 'code-generation',
      successRate: 0.95,
      averageLatency: 3200,
      averageCost: 0.05,
      qualityRating: 0.92,
      totalRequests: 150,
      lastUpdated: new Date()
    });
  }
}