/**
 * AI Configuration Management
 * 
 * Centralized configuration for AI services with environment-based settings
 * and runtime optimization capabilities.
 */

import {
  AIConfiguration,
  OrchestratorConfig,
  ModelConfiguration,
  PrivacyConfig,
  PerformanceConfig,
  LoggingConfig,
  ModelProvider,
  ModelCapability,
  PrivacyLevel,
  ResourceLimits
} from './interfaces';

/**
 * Default AI Configuration
 */
export const DEFAULT_AI_CONFIG: AIConfiguration = {
  orchestrator: {
    maxConcurrentRequests: 10,
    requestTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    fallbackStrategy: 'graceful_degradation',
    qualityThreshold: 0.7
  },
  models: [
    // OpenAI GPT-4 Configuration
    {
      modelId: 'gpt-4-turbo',
      provider: ModelProvider.OPENAI,
      capabilities: [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_ANALYSIS,
        ModelCapability.NATURAL_LANGUAGE,
        ModelCapability.REASONING
      ],
      costPerToken: 0.00003, // $0.03 per 1K tokens
      maxTokens: 128000,
      responseTime: 2000, // 2 seconds average
      accuracy: 0.95,
      availability: 0.99
    },
    // OpenAI GPT-3.5 Configuration
    {
      modelId: 'gpt-3.5-turbo',
      provider: ModelProvider.OPENAI,
      capabilities: [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.NATURAL_LANGUAGE
      ],
      costPerToken: 0.000002, // $0.002 per 1K tokens
      maxTokens: 16384,
      responseTime: 1000, // 1 second average
      accuracy: 0.85,
      availability: 0.99
    },
    // Ollama Local Model Configuration
    {
      modelId: 'deepseek-coder',
      provider: ModelProvider.OLLAMA,
      capabilities: [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.CODE_ANALYSIS
      ],
      costPerToken: 0, // Free local processing
      maxTokens: 4096,
      responseTime: 500, // 500ms average
      accuracy: 0.80,
      availability: 0.95
    },
    // Anthropic Claude Configuration
    {
      modelId: 'claude-3-sonnet',
      provider: ModelProvider.ANTHROPIC,
      capabilities: [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_ANALYSIS,
        ModelCapability.NATURAL_LANGUAGE,
        ModelCapability.REASONING
      ],
      costPerToken: 0.000015, // $0.015 per 1K tokens
      maxTokens: 200000,
      responseTime: 1500, // 1.5 seconds average
      accuracy: 0.92,
      availability: 0.98
    }
  ],
  privacy: {
    defaultPrivacyLevel: PrivacyLevel.INTERNAL,
    dataRetentionDays: 30,
    anonymizationEnabled: true,
    localProcessingPreferred: false,
    consentRequired: true
  },
  performance: {
    maxResponseTime: 200, // Target <200ms for Cycle 4
    targetAccuracy: 0.90, // Target >90% accuracy
    cachingEnabled: true,
    preloadModels: true,
    resourceLimits: {
      maxMemoryUsage: 2048, // 2GB
      maxCpuUsage: 80, // 80%
      maxNetworkBandwidth: 100, // 100 MB/s
      maxStorageUsage: 10240 // 10GB
    }
  },
  logging: {
    level: 'info',
    enableMetrics: true,
    enableTracing: true,
    retentionDays: 7,
    sensitiveDataFiltering: true
  }
};

/**
 * Environment-specific configuration overrides
 */
interface EnvironmentOverrides {
  orchestrator?: Partial<OrchestratorConfig>;
  models?: ModelConfiguration[];
  privacy?: Partial<PrivacyConfig>;
  performance?: Partial<PerformanceConfig>;
  logging?: Partial<LoggingConfig>;
}

export class AIConfigManager {
  private config: AIConfiguration;
  private environmentOverrides: EnvironmentOverrides = {};

  constructor(baseConfig: AIConfiguration = DEFAULT_AI_CONFIG) {
    this.config = { ...baseConfig };
    this.loadEnvironmentOverrides();
    this.applyEnvironmentOverrides();
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfiguration {
    return { ...this.config };
  }

  /**
   * Get orchestrator configuration
   */
  getOrchestratorConfig(): OrchestratorConfig {
    return { ...this.config.orchestrator };
  }

  /**
   * Get model configurations
   */
  getModelConfigurations(): ModelConfiguration[] {
    return [...this.config.models];
  }

  /**
   * Get model configuration by ID
   */
  getModelConfig(modelId: string): ModelConfiguration | null {
    return this.config.models.find(m => m.modelId === modelId) || null;
  }

  /**
   * Get privacy configuration
   */
  getPrivacyConfig(): PrivacyConfig {
    return { ...this.config.privacy };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig(): LoggingConfig {
    return { ...this.config.logging };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<AIConfiguration>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

  /**
   * Add or update model configuration
   */
  addModelConfig(model: ModelConfiguration): void {
    const existingIndex = this.config.models.findIndex(m => m.modelId === model.modelId);
    
    if (existingIndex >= 0) {
      this.config.models[existingIndex] = model;
    } else {
      this.config.models.push(model);
    }
  }

  /**
   * Remove model configuration
   */
  removeModelConfig(modelId: string): boolean {
    const initialLength = this.config.models.length;
    this.config.models = this.config.models.filter(m => m.modelId !== modelId);
    return this.config.models.length < initialLength;
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: ModelCapability): ModelConfiguration[] {
    return this.config.models.filter(m => m.capabilities.includes(capability));
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: ModelProvider): ModelConfiguration[] {
    return this.config.models.filter(m => m.provider === provider);
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate orchestrator config
    if (this.config.orchestrator.maxConcurrentRequests <= 0) {
      errors.push('maxConcurrentRequests must be greater than 0');
    }

    if (this.config.orchestrator.requestTimeout <= 0) {
      errors.push('requestTimeout must be greater than 0');
    }

    if (this.config.orchestrator.qualityThreshold < 0 || this.config.orchestrator.qualityThreshold > 1) {
      errors.push('qualityThreshold must be between 0 and 1');
    }

    // Validate models
    if (this.config.models.length === 0) {
      errors.push('At least one model configuration is required');
    }

    for (const model of this.config.models) {
      if (!model.modelId || model.modelId.trim().length === 0) {
        errors.push(`Model ID is required for model: ${JSON.stringify(model)}`);
      }

      if (model.capabilities.length === 0) {
        errors.push(`Model ${model.modelId} must have at least one capability`);
      }

      if (model.costPerToken < 0) {
        errors.push(`Model ${model.modelId} costPerToken cannot be negative`);
      }

      if (model.accuracy < 0 || model.accuracy > 1) {
        errors.push(`Model ${model.modelId} accuracy must be between 0 and 1`);
      }

      if (model.availability < 0 || model.availability > 1) {
        errors.push(`Model ${model.modelId} availability must be between 0 and 1`);
      }
    }

    // Validate performance config
    if (this.config.performance.maxResponseTime <= 0) {
      errors.push('maxResponseTime must be greater than 0');
    }

    if (this.config.performance.targetAccuracy < 0 || this.config.performance.targetAccuracy > 1) {
      errors.push('targetAccuracy must be between 0 and 1');
    }

    // Validate privacy config
    if (this.config.privacy.dataRetentionDays < 0) {
      errors.push('dataRetentionDays cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfig(environment: 'development' | 'staging' | 'production'): Partial<AIConfiguration> {
    switch (environment) {
      case 'development':
        return {
          orchestrator: {
            maxConcurrentRequests: 5,
            requestTimeout: 60000, // Longer timeout for debugging
            retryAttempts: 1,
            fallbackStrategy: 'fail_fast',
            qualityThreshold: 0.5 // Lower threshold for testing
          },
          privacy: {
            defaultPrivacyLevel: PrivacyLevel.LOCAL_ONLY,
            dataRetentionDays: 1,
            anonymizationEnabled: false,
            localProcessingPreferred: true,
            consentRequired: false
          },
          logging: {
            level: 'debug',
            enableMetrics: true,
            enableTracing: true,
            retentionDays: 1,
            sensitiveDataFiltering: false
          }
        };

      case 'staging':
        return {
          orchestrator: {
            maxConcurrentRequests: 8,
            requestTimeout: 45000,
            retryAttempts: 2,
            fallbackStrategy: 'graceful_degradation',
            qualityThreshold: 0.6
          },
          privacy: {
            defaultPrivacyLevel: PrivacyLevel.INTERNAL,
            dataRetentionDays: 7,
            anonymizationEnabled: true,
            localProcessingPreferred: false,
            consentRequired: true
          },
          logging: {
            level: 'info',
            enableMetrics: true,
            enableTracing: true,
            retentionDays: 3,
            sensitiveDataFiltering: true
          }
        };

      case 'production':
        return {
          orchestrator: {
            maxConcurrentRequests: 20,
            requestTimeout: 30000,
            retryAttempts: 3,
            fallbackStrategy: 'graceful_degradation',
            qualityThreshold: 0.8
          },
          privacy: {
            defaultPrivacyLevel: PrivacyLevel.CONFIDENTIAL,
            dataRetentionDays: 30,
            anonymizationEnabled: true,
            localProcessingPreferred: false,
            consentRequired: true
          },
          performance: {
            maxResponseTime: 150, // Stricter in production
            targetAccuracy: 0.95,
            cachingEnabled: true,
            preloadModels: true,
            resourceLimits: {
              maxMemoryUsage: 4096, // 4GB in production
              maxCpuUsage: 70,
              maxNetworkBandwidth: 200,
              maxStorageUsage: 20480 // 20GB
            }
          },
          logging: {
            level: 'warn',
            enableMetrics: true,
            enableTracing: false, // Disabled for performance
            retentionDays: 30,
            sensitiveDataFiltering: true
          }
        };

      default:
        return {};
    }
  }

  // Private helper methods

  private loadEnvironmentOverrides(): void {
    const env = process.env.NODE_ENV || 'development';
    this.environmentOverrides = this.getEnvironmentConfig(env as any);

    // Load from environment variables
    if (process.env.AI_MAX_CONCURRENT_REQUESTS) {
      this.environmentOverrides.orchestrator = {
        ...(this.environmentOverrides.orchestrator || {}),
        maxConcurrentRequests: parseInt(process.env.AI_MAX_CONCURRENT_REQUESTS, 10)
      };
    }

    if (process.env.AI_REQUEST_TIMEOUT) {
      this.environmentOverrides.orchestrator = {
        ...(this.environmentOverrides.orchestrator || {}),
        requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT, 10)
      };
    }

    if (process.env.AI_MAX_RESPONSE_TIME) {
      this.environmentOverrides.performance = {
        ...(this.environmentOverrides.performance || {}),
        maxResponseTime: parseInt(process.env.AI_MAX_RESPONSE_TIME, 10)
      };
    }

    if (process.env.AI_TARGET_ACCURACY) {
      this.environmentOverrides.performance = {
        ...(this.environmentOverrides.performance || {}),
        targetAccuracy: parseFloat(process.env.AI_TARGET_ACCURACY)
      };
    }

    if (process.env.AI_PRIVACY_LEVEL) {
      this.environmentOverrides.privacy = {
        ...this.environmentOverrides.privacy,
        defaultPrivacyLevel: process.env.AI_PRIVACY_LEVEL as PrivacyLevel
      };
    }

    if (process.env.AI_LOG_LEVEL) {
      this.environmentOverrides.logging = {
        ...this.environmentOverrides.logging,
        level: process.env.AI_LOG_LEVEL as any
      };
    }
  }

  private applyEnvironmentOverrides(): void {
    this.config = this.mergeConfigs(this.config, this.environmentOverrides);
  }

  private mergeConfigs(base: AIConfiguration, override: EnvironmentOverrides): AIConfiguration {
    return {
      orchestrator: { ...base.orchestrator, ...override.orchestrator },
      models: override.models || base.models,
      privacy: { ...base.privacy, ...override.privacy },
      performance: { 
        ...base.performance, 
        ...override.performance,
        resourceLimits: {
          ...base.performance.resourceLimits,
          ...override.performance?.resourceLimits
        }
      },
      logging: { ...base.logging, ...override.logging }
    };
  }
}

/**
 * Global configuration instance
 */
export const aiConfig = new AIConfigManager();

/**
 * Configuration validation utility
 */
export function validateAIConfig(config: AIConfiguration): void {
  const manager = new AIConfigManager(config);
  const validation = manager.validateConfig();
  
  if (!validation.isValid) {
    throw new Error(`Invalid AI configuration: ${validation.errors.join(', ')}`);
  }
}