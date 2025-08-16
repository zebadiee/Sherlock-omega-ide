/**
 * Provider Factory
 * 
 * Factory pattern implementation for creating and managing AI model providers
 * with dynamic instantiation and registry management.
 */

import { BaseModelProvider, ProviderConfig } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GoogleProvider } from './google-provider';
import {
  ModelProvider,
  ModelConfiguration,
  ModelCapability,
  AIError,
  AIErrorCode
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';

/**
 * Provider registration information
 */
interface ProviderRegistration {
  type: ModelProvider;
  factory: (config: ProviderConfig, logger: Logger, monitor: PerformanceMonitor) => BaseModelProvider;
  defaultConfig: Partial<ProviderConfig>;
  description: string;
  requiresAuth: boolean;
}

/**
 * Provider factory for creating and managing AI model providers
 */
export class ProviderFactory {
  private static registrations: Map<ModelProvider, ProviderRegistration> = new Map();
  private static instances: Map<string, BaseModelProvider> = new Map();
  private static logger: Logger;
  private static performanceMonitor: PerformanceMonitor;

  /**
   * Initialize the factory with dependencies
   */
  static initialize(logger: Logger, performanceMonitor: PerformanceMonitor): void {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.registerDefaultProviders();
  }

  /**
   * Register a provider type
   */
  static registerProvider(registration: ProviderRegistration): void {
    this.registrations.set(registration.type, registration);
    
    this.logger?.debug('Provider registered', {
      type: registration.type,
      description: registration.description,
      requiresAuth: registration.requiresAuth
    });
  }

  /**
   * Create a provider instance
   */
  static createProvider(
    type: ModelProvider,
    config: ProviderConfig,
    instanceId?: string
  ): BaseModelProvider {
    const registration = this.registrations.get(type);
    
    if (!registration) {
      throw new AIError(
        `Provider type not registered: ${type}`,
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Merge with default configuration
    const mergedConfig: ProviderConfig = {
      ...this.getDefaultConfig(type),
      ...config
    };

    // Validate configuration
    this.validateProviderConfig(type, mergedConfig);

    // Create instance
    const provider = registration.factory(mergedConfig, this.logger, this.performanceMonitor);
    
    // Cache instance if ID provided
    if (instanceId) {
      const cacheKey = `${type}_${instanceId}`;
      this.instances.set(cacheKey, provider);
    }

    this.logger?.info('Provider instance created', {
      type,
      instanceId,
      hasAuth: !!mergedConfig.auth.apiKey
    });

    return provider;
  }

  /**
   * Get cached provider instance
   */
  static getProvider(type: ModelProvider, instanceId: string): BaseModelProvider | null {
    const cacheKey = `${type}_${instanceId}`;
    return this.instances.get(cacheKey) || null;
  }

  /**
   * Get or create provider instance
   */
  static getOrCreateProvider(
    type: ModelProvider,
    config: ProviderConfig,
    instanceId: string
  ): BaseModelProvider {
    const existing = this.getProvider(type, instanceId);
    if (existing) {
      return existing;
    }

    return this.createProvider(type, config, instanceId);
  }

  /**
   * Remove cached provider instance
   */
  static removeProvider(type: ModelProvider, instanceId: string): boolean {
    const cacheKey = `${type}_${instanceId}`;
    return this.instances.delete(cacheKey);
  }

  /**
   * Get all registered provider types
   */
  static getRegisteredProviders(): ModelProvider[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get provider registration info
   */
  static getProviderInfo(type: ModelProvider): ProviderRegistration | null {
    return this.registrations.get(type) || null;
  }

  /**
   * Check if provider type is registered
   */
  static isProviderRegistered(type: ModelProvider): boolean {
    return this.registrations.has(type);
  }

  /**
   * Get default configuration for provider type
   */
  static getDefaultConfig(type: ModelProvider): ProviderConfig {
    const registration = this.registrations.get(type);
    if (!registration) {
      throw new AIError(
        `Provider type not registered: ${type}`,
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    return {
      auth: {},
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: '',
      supportedModels: [],
      ...registration.defaultConfig
    } as ProviderConfig;
  }

  /**
   * Create provider from model configuration
   */
  static createProviderFromModel(
    model: ModelConfiguration,
    authConfig: { apiKey?: string; endpoint?: string } = {}
  ): BaseModelProvider {
    const config: ProviderConfig = {
      auth: {
        apiKey: authConfig.apiKey,
        endpoint: authConfig.endpoint
      },
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: model.modelId,
      supportedModels: [model.modelId]
    };

    return this.createProvider(model.provider, config);
  }

  /**
   * Validate provider configuration
   */
  private static validateProviderConfig(type: ModelProvider, config: ProviderConfig): void {
    const registration = this.registrations.get(type);
    if (!registration) {
      throw new AIError(
        `Provider type not registered: ${type}`,
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Check required authentication
    if (registration.requiresAuth && !config.auth.apiKey) {
      throw new AIError(
        `API key required for provider: ${type}`,
        AIErrorCode.AUTHENTICATION_FAILED,
        false
      );
    }

    // Validate timeout
    if (config.timeout <= 0) {
      throw new AIError(
        'Timeout must be positive',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Validate retry attempts
    if (config.retryAttempts < 0) {
      throw new AIError(
        'Retry attempts cannot be negative',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Validate rate limit
    if (config.rateLimitPerMinute <= 0) {
      throw new AIError(
        'Rate limit must be positive',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Validate supported models
    if (config.supportedModels.length === 0) {
      this.logger?.warn('No supported models specified for provider', { type });
    }
  }

  /**
   * Register default providers
   */
  private static registerDefaultProviders(): void {
    // OpenAI Provider
    this.registerProvider({
      type: ModelProvider.OPENAI,
      factory: (config, logger, monitor) => new OpenAIProvider(config, logger, monitor),
      defaultConfig: {
        timeout: 30000,
        retryAttempts: 3,
        rateLimitPerMinute: 60,
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-32k']
      },
      description: 'OpenAI GPT models for code completion and text generation',
      requiresAuth: true
    });

    // Ollama Provider (Local)
    this.registerProvider({
      type: ModelProvider.OLLAMA,
      factory: (config, logger, monitor) => new OllamaProvider(config, logger, monitor),
      defaultConfig: {
        auth: { endpoint: 'http://localhost:11434' },
        timeout: 60000, // Longer timeout for local processing
        retryAttempts: 2,
        rateLimitPerMinute: 120, // Higher rate limit for local
        defaultModel: 'deepseek-coder',
        supportedModels: ['deepseek-coder', 'codellama', 'qwen2.5-coder', 'starcoder2']
      },
      description: 'Local Ollama models for privacy-preserving AI processing',
      requiresAuth: false
    });

    // Anthropic Provider
    this.registerProvider({
      type: ModelProvider.ANTHROPIC,
      factory: (config, logger, monitor) => new AnthropicProvider(config, logger, monitor),
      defaultConfig: {
        timeout: 30000,
        retryAttempts: 3,
        rateLimitPerMinute: 50,
        defaultModel: 'claude-3-sonnet-20240229',
        supportedModels: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      },
      description: 'Anthropic Claude models for advanced reasoning and code analysis',
      requiresAuth: true
    });

    // Google Provider
    this.registerProvider({
      type: ModelProvider.GOOGLE,
      factory: (config, logger, monitor) => new GoogleProvider(config, logger, monitor),
      defaultConfig: {
        timeout: 30000,
        retryAttempts: 3,
        rateLimitPerMinute: 60,
        defaultModel: 'gemini-pro',
        supportedModels: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro']
      },
      description: 'Google Gemini models for multimodal AI capabilities',
      requiresAuth: true
    });

    this.logger?.info('Default providers registered', {
      providerCount: this.registrations.size,
      providers: Array.from(this.registrations.keys())
    });
  }

  /**
   * Clear all cached instances
   */
  static clearCache(): void {
    this.instances.clear();
    this.logger?.debug('Provider cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { totalInstances: number; providerBreakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
    
    for (const key of this.instances.keys()) {
      const providerType = key.split('_')[0];
      breakdown[providerType] = (breakdown[providerType] || 0) + 1;
    }

    return {
      totalInstances: this.instances.size,
      providerBreakdown: breakdown
    };
  }
}

/**
 * Provider registry for managing available providers
 */
export class ProviderRegistry {
  private providers: Map<string, BaseModelProvider> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a provider instance
   */
  register(id: string, provider: BaseModelProvider): void {
    this.providers.set(id, provider);
    
    this.logger.info('Provider registered in registry', {
      id,
      type: provider.getProviderType(),
      capabilities: provider.getSupportedCapabilities()
    });
  }

  /**
   * Unregister a provider
   */
  unregister(id: string): boolean {
    const removed = this.providers.delete(id);
    
    if (removed) {
      this.logger.info('Provider unregistered from registry', { id });
    }

    return removed;
  }

  /**
   * Get provider by ID
   */
  get(id: string): BaseModelProvider | null {
    return this.providers.get(id) || null;
  }

  /**
   * Get all registered providers
   */
  getAll(): BaseModelProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  getByType(type: ModelProvider): BaseModelProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.getProviderType() === type);
  }

  /**
   * Get providers by capability
   */
  getByCapability(capability: ModelCapability): BaseModelProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.getSupportedCapabilities().includes(capability));
  }

  /**
   * Check if provider is registered
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalProviders: number;
    typeBreakdown: Record<ModelProvider, number>;
    capabilityBreakdown: Record<ModelCapability, number>;
  } {
    const typeBreakdown: Record<ModelProvider, number> = {} as any;
    const capabilityBreakdown: Record<ModelCapability, number> = {} as any;

    for (const provider of this.providers.values()) {
      const type = provider.getProviderType();
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

      for (const capability of provider.getSupportedCapabilities()) {
        capabilityBreakdown[capability] = (capabilityBreakdown[capability] || 0) + 1;
      }
    }

    return {
      totalProviders: this.providers.size,
      typeBreakdown,
      capabilityBreakdown
    };
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.logger.info('Provider registry cleared');
  }
}