/**
 * Provider Factory Unit Tests
 * 
 * Tests for provider factory functionality including registration,
 * creation, caching, and configuration validation.
 */

import { ProviderFactory, ProviderRegistry } from '../provider-factory';
import { BaseModelProvider, ProviderConfig } from '../base-provider';
import {
  ModelProvider,
  ModelCapability,
  AIError,
  AIErrorCode
} from '../../interfaces';
import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';
import { PlatformType } from '../../../core/whispering-interfaces';

// Mock dependencies
jest.mock('../../../logging/logger');
jest.mock('../../../monitoring/performance-monitor');

// Mock provider implementation
class MockProvider extends BaseModelProvider {
  getProviderType(): ModelProvider {
    return ModelProvider.OPENAI;
  }

  getSupportedCapabilities(): ModelCapability[] {
    return [ModelCapability.CODE_COMPLETION, ModelCapability.TEXT_GENERATION];
  }

  protected async convertToProviderRequest(): Promise<any> {
    return { model: 'test', prompt: 'test' };
  }

  protected async executeRequest(): Promise<any> {
    return {
      id: 'test',
      choices: [{ text: 'test', finishReason: 'stop', index: 0 }],
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      model: 'test',
      created: Date.now()
    };
  }

  protected async convertToAIResponse(): Promise<any> {
    return {
      id: 'test',
      requestId: 'test',
      result: 'test',
      confidence: 0.8,
      modelUsed: 'test',
      processingTime: 100,
      tokens: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    };
  }

  protected async performHealthCheck(): Promise<boolean> {
    return true;
  }

  protected async fetchAvailableModels(): Promise<any[]> {
    return [];
  }

  protected getDefaultModels(): any[] {
    return [];
  }
}

describe('ProviderFactory', () => {
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    mockLogger = new Logger(PlatformType.WEB) as jest.Mocked<Logger>;
    mockPerformanceMonitor = new PerformanceMonitor(PlatformType.WEB) as jest.Mocked<PerformanceMonitor>;

    mockLogger.debug = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();

    // Clear factory state
    ProviderFactory.clearCache();
    
    // Initialize factory
    ProviderFactory.initialize(mockLogger, mockPerformanceMonitor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    ProviderFactory.clearCache();
  });

  describe('initialization', () => {
    it('should initialize with default providers', () => {
      const registeredProviders = ProviderFactory.getRegisteredProviders();
      
      expect(registeredProviders).toContain(ModelProvider.OPENAI);
      expect(registeredProviders).toContain(ModelProvider.OLLAMA);
      expect(registeredProviders).toContain(ModelProvider.ANTHROPIC);
      expect(registeredProviders).toContain(ModelProvider.GOOGLE);
      expect(mockLogger.info).toHaveBeenCalledWith('Default providers registered', expect.any(Object));
    });

    it('should register custom provider', () => {
      const customType = 'CUSTOM' as ModelProvider;
      
      ProviderFactory.registerProvider({
        type: customType,
        factory: (config, logger, monitor) => new MockProvider(config, logger, monitor),
        defaultConfig: { defaultModel: 'custom-model' },
        description: 'Custom test provider',
        requiresAuth: false
      });

      expect(ProviderFactory.isProviderRegistered(customType)).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('Provider registered', expect.any(Object));
    });
  });

  describe('provider creation', () => {
    const testConfig: ProviderConfig = {
      auth: { apiKey: 'test-key' },
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: 'gpt-3.5-turbo',
      supportedModels: ['gpt-3.5-turbo', 'gpt-4']
    };

    it('should create provider successfully', () => {
      const provider = ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig);
      
      expect(provider).toBeDefined();
      expect(provider.getProviderType()).toBe(ModelProvider.OPENAI);
      expect(mockLogger.info).toHaveBeenCalledWith('Provider instance created', expect.any(Object));
    });

    it('should cache provider instance when ID provided', () => {
      const instanceId = 'test-instance';
      const provider = ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig, instanceId);
      
      const cachedProvider = ProviderFactory.getProvider(ModelProvider.OPENAI, instanceId);
      
      expect(cachedProvider).toBe(provider);
    });

    it('should throw error for unregistered provider type', () => {
      const invalidType = 'INVALID' as ModelProvider;
      
      expect(() => {
        ProviderFactory.createProvider(invalidType, testConfig);
      }).toThrow('Provider type not registered: INVALID');
    });

    it('should merge with default configuration', () => {
      const partialConfig: Partial<ProviderConfig> = {
        auth: { apiKey: 'test-key' },
        timeout: 45000
      };

      const provider = ProviderFactory.createProvider(ModelProvider.OPENAI, partialConfig as ProviderConfig);
      const config = provider.getConfig();
      
      expect(config.timeout).toBe(45000);
      expect(config.retryAttempts).toBe(3); // From default config
      expect(config.auth.apiKey).toBe('test-key');
    });
  });

  describe('configuration validation', () => {
    it('should validate required authentication', () => {
      const configWithoutAuth: ProviderConfig = {
        auth: {},
        timeout: 30000,
        retryAttempts: 3,
        rateLimitPerMinute: 60,
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo']
      };

      expect(() => {
        ProviderFactory.createProvider(ModelProvider.OPENAI, configWithoutAuth);
      }).toThrow('API key required for provider: openai');
    });

    it('should validate timeout value', () => {
      const invalidConfig: ProviderConfig = {
        auth: { apiKey: 'test-key' },
        timeout: -1000,
        retryAttempts: 3,
        rateLimitPerMinute: 60,
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo']
      };

      expect(() => {
        ProviderFactory.createProvider(ModelProvider.OPENAI, invalidConfig);
      }).toThrow('Timeout must be positive');
    });

    it('should validate retry attempts', () => {
      const invalidConfig: ProviderConfig = {
        auth: { apiKey: 'test-key' },
        timeout: 30000,
        retryAttempts: -1,
        rateLimitPerMinute: 60,
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo']
      };

      expect(() => {
        ProviderFactory.createProvider(ModelProvider.OPENAI, invalidConfig);
      }).toThrow('Retry attempts cannot be negative');
    });

    it('should validate rate limit', () => {
      const invalidConfig: ProviderConfig = {
        auth: { apiKey: 'test-key' },
        timeout: 30000,
        retryAttempts: 3,
        rateLimitPerMinute: 0,
        defaultModel: 'gpt-3.5-turbo',
        supportedModels: ['gpt-3.5-turbo']
      };

      expect(() => {
        ProviderFactory.createProvider(ModelProvider.OPENAI, invalidConfig);
      }).toThrow('Rate limit must be positive');
    });
  });

  describe('provider management', () => {
    const testConfig: ProviderConfig = {
      auth: { apiKey: 'test-key' },
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: 'gpt-3.5-turbo',
      supportedModels: ['gpt-3.5-turbo']
    };

    it('should get or create provider', () => {
      const instanceId = 'test-instance';
      
      // First call should create
      const provider1 = ProviderFactory.getOrCreateProvider(ModelProvider.OPENAI, testConfig, instanceId);
      
      // Second call should return cached
      const provider2 = ProviderFactory.getOrCreateProvider(ModelProvider.OPENAI, testConfig, instanceId);
      
      expect(provider1).toBe(provider2);
    });

    it('should remove cached provider', () => {
      const instanceId = 'test-instance';
      ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig, instanceId);
      
      const removed = ProviderFactory.removeProvider(ModelProvider.OPENAI, instanceId);
      const cached = ProviderFactory.getProvider(ModelProvider.OPENAI, instanceId);
      
      expect(removed).toBe(true);
      expect(cached).toBeNull();
    });

    it('should get cache statistics', () => {
      ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig, 'instance1');
      ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig, 'instance2');
      ProviderFactory.createProvider(ModelProvider.OLLAMA, testConfig, 'instance3');
      
      const stats = ProviderFactory.getCacheStats();
      
      expect(stats.totalInstances).toBe(3);
      expect(stats.providerBreakdown.openai).toBe(2);
      expect(stats.providerBreakdown.ollama).toBe(1);
    });

    it('should clear cache', () => {
      ProviderFactory.createProvider(ModelProvider.OPENAI, testConfig, 'instance1');
      ProviderFactory.createProvider(ModelProvider.OLLAMA, testConfig, 'instance2');
      
      ProviderFactory.clearCache();
      const stats = ProviderFactory.getCacheStats();
      
      expect(stats.totalInstances).toBe(0);
    });
  });

  describe('provider information', () => {
    it('should get provider information', () => {
      const info = ProviderFactory.getProviderInfo(ModelProvider.OPENAI);
      
      expect(info).toBeDefined();
      expect(info?.type).toBe(ModelProvider.OPENAI);
      expect(info?.description).toContain('OpenAI');
      expect(info?.requiresAuth).toBe(true);
    });

    it('should get default configuration', () => {
      const defaultConfig = ProviderFactory.getDefaultConfig(ModelProvider.OPENAI);
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.timeout).toBe(30000);
      expect(defaultConfig.retryAttempts).toBe(3);
      expect(defaultConfig.defaultModel).toBe('gpt-3.5-turbo');
    });

    it('should check if provider is registered', () => {
      expect(ProviderFactory.isProviderRegistered(ModelProvider.OPENAI)).toBe(true);
      expect(ProviderFactory.isProviderRegistered('INVALID' as ModelProvider)).toBe(false);
    });
  });
});

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;
  let mockLogger: jest.Mocked<Logger>;
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockLogger = new Logger(PlatformType.WEB) as jest.Mocked<Logger>;
    mockLogger.info = jest.fn();

    registry = new ProviderRegistry(mockLogger);
    
    const mockConfig: ProviderConfig = {
      auth: {},
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: 'test',
      supportedModels: ['test']
    };
    
    mockProvider = new MockProvider(mockConfig, mockLogger, null as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('provider registration', () => {
    it('should register provider', () => {
      registry.register('test-provider', mockProvider);
      
      expect(registry.has('test-provider')).toBe(true);
      expect(registry.get('test-provider')).toBe(mockProvider);
      expect(mockLogger.info).toHaveBeenCalledWith('Provider registered in registry', expect.any(Object));
    });

    it('should unregister provider', () => {
      registry.register('test-provider', mockProvider);
      const removed = registry.unregister('test-provider');
      
      expect(removed).toBe(true);
      expect(registry.has('test-provider')).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Provider unregistered from registry', expect.any(Object));
    });

    it('should return false when unregistering non-existent provider', () => {
      const removed = registry.unregister('non-existent');
      
      expect(removed).toBe(false);
    });
  });

  describe('provider retrieval', () => {
    beforeEach(() => {
      registry.register('test-provider', mockProvider);
    });

    it('should get all providers', () => {
      const providers = registry.getAll();
      
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(mockProvider);
    });

    it('should get providers by type', () => {
      const providers = registry.getByType(ModelProvider.OPENAI);
      
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(mockProvider);
    });

    it('should get providers by capability', () => {
      const providers = registry.getByCapability(ModelCapability.CODE_COMPLETION);
      
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(mockProvider);
    });

    it('should return empty array for non-matching type', () => {
      const providers = registry.getByType(ModelProvider.ANTHROPIC);
      
      expect(providers).toHaveLength(0);
    });

    it('should return empty array for non-matching capability', () => {
      const providers = registry.getByCapability(ModelCapability.MULTIMODAL);
      
      expect(providers).toHaveLength(0);
    });
  });

  describe('registry statistics', () => {
    it('should get registry statistics', () => {
      registry.register('test-provider', mockProvider);
      
      const stats = registry.getStats();
      
      expect(stats.totalProviders).toBe(1);
      expect(stats.typeBreakdown[ModelProvider.OPENAI]).toBe(1);
      expect(stats.capabilityBreakdown[ModelCapability.CODE_COMPLETION]).toBe(1);
      expect(stats.capabilityBreakdown[ModelCapability.TEXT_GENERATION]).toBe(1);
    });

    it('should handle empty registry', () => {
      const stats = registry.getStats();
      
      expect(stats.totalProviders).toBe(0);
      expect(Object.keys(stats.typeBreakdown)).toHaveLength(0);
      expect(Object.keys(stats.capabilityBreakdown)).toHaveLength(0);
    });
  });

  describe('registry management', () => {
    it('should clear registry', () => {
      registry.register('test-provider', mockProvider);
      registry.clear();
      
      expect(registry.getAll()).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Provider registry cleared');
    });
  });
});