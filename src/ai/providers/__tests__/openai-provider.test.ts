/**
 * OpenAI Provider Unit Tests
 * 
 * Comprehensive tests for OpenAI provider functionality including
 * request conversion, API integration, and error handling.
 */

import { OpenAIProvider } from '../openai-provider';
import { ProviderConfig } from '../base-provider';
import {
  AIRequest,
  AIRequestType,
  RequestPriority,
  PrivacyLevel,
  ModelProvider,
  ModelCapability,
  AIError,
  AIErrorCode
} from '../../interfaces';
import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';
import { PlatformType } from '../../../core/whispering-interfaces';

// Mock fetch globally
global.fetch = jest.fn();

// Mock dependencies
jest.mock('../../../logging/logger');
jest.mock('../../../monitoring/performance-monitor');

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let config: ProviderConfig;

  beforeEach(() => {
    mockLogger = new Logger(PlatformType.WEB) as jest.Mocked<Logger>;
    mockPerformanceMonitor = new PerformanceMonitor(PlatformType.WEB) as jest.Mocked<PerformanceMonitor>;

    mockLogger.debug = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();
    mockPerformanceMonitor.recordMetric = jest.fn();

    config = {
      auth: {
        apiKey: 'test-api-key',
        organizationId: 'test-org'
      },
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      defaultModel: 'gpt-3.5-turbo',
      supportedModels: ['gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4']
    };

    provider = new OpenAIProvider(config, mockLogger, mockPerformanceMonitor);

    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('provider identification', () => {
    it('should return correct provider type', () => {
      expect(provider.getProviderType()).toBe(ModelProvider.OPENAI);
    });

    it('should return supported capabilities', () => {
      const capabilities = provider.getSupportedCapabilities();
      
      expect(capabilities).toContain(ModelCapability.CODE_COMPLETION);
      expect(capabilities).toContain(ModelCapability.TEXT_GENERATION);
      expect(capabilities).toContain(ModelCapability.CODE_ANALYSIS);
      expect(capabilities).toContain(ModelCapability.NATURAL_LANGUAGE);
      expect(capabilities).toContain(ModelCapability.REASONING);
    });
  });

  describe('request processing', () => {
    const mockRequest: AIRequest = {
      id: 'test-request-1',
      type: AIRequestType.CODE_COMPLETION,
      context: {
        projectId: 'test-project',
        language: 'typescript',
        dependencies: [],
        architecture: 'unknown' as any,
        codeMetrics: {
          linesOfCode: 1000,
          complexity: 5,
          testCoverage: 80,
          technicalDebt: 2,
          maintainabilityIndex: 85
        },
        userPreferences: {
          codingStyle: {
            indentation: 'spaces',
            indentSize: 2,
            lineLength: 100,
            namingConvention: 'camelCase',
            bracketStyle: 'same-line'
          },
          preferredPatterns: [],
          completionSettings: {
            enabled: true,
            triggerCharacters: ['.'],
            maxSuggestions: 10,
            minConfidence: 0.7,
            showDocumentation: true
          },
          privacyLevel: PrivacyLevel.INTERNAL,
          modelPreferences: {
            preferredProviders: ['openai'],
            fallbackStrategy: 'most_accurate',
            maxCostPerRequest: 0.01,
            localOnly: false
          }
        }
      },
      payload: {
        code: 'const user = { name: "John", age: ',
        context: 'User object definition'
      },
      priority: RequestPriority.NORMAL,
      privacyLevel: PrivacyLevel.INTERNAL,
      timestamp: new Date()
    };

    const mockOpenAIResponse = {
      id: 'cmpl-test123',
      object: 'text_completion',
      created: 1234567890,
      model: 'gpt-3.5-turbo',
      choices: [
        {
          text: '30 };',
          finish_reason: 'stop',
          index: 0
        }
      ],
      usage: {
        prompt_tokens: 25,
        completion_tokens: 5,
        total_tokens: 30
      }
    };

    it('should process code completion request successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIResponse
      });

      const result = await provider.processRequest(mockRequest);

      expect(result).toBeDefined();
      expect(result.requestId).toBe(mockRequest.id);
      expect(result.result).toBe('30 };');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.tokens.totalTokens).toBe(30);
      expect(mockLogger.debug).toHaveBeenCalledWith('Executing OpenAI request', expect.any(Object));
    });

    it('should handle natural language requests', async () => {
      const nlRequest = {
        ...mockRequest,
        type: AIRequestType.NATURAL_LANGUAGE,
        payload: {
          message: 'Explain how async/await works in JavaScript'
        }
      };

      const chatResponse = {
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Async/await is a syntax for handling asynchronous operations...'
            },
            finish_reason: 'stop',
            index: 0
          }
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 50,
          total_tokens: 70
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => chatResponse
      });

      const result = await provider.processRequest(nlRequest);

      expect(result.result).toContain('Async/await is a syntax');
      expect(result.tokens.totalTokens).toBe(70);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      });

      await expect(provider.processRequest(mockRequest)).rejects.toThrow('HTTP 401: Invalid API key');
      expect(mockLogger.error).toHaveBeenCalledWith('OpenAI request failed', expect.any(Object));
    });

    it('should handle timeout errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new DOMException('Timeout', 'AbortError'));

      await expect(provider.processRequest(mockRequest)).rejects.toThrow('Request timeout');
    });

    it('should handle rate limiting', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            message: 'Rate limit exceeded'
          }
        })
      });

      await expect(provider.processRequest(mockRequest)).rejects.toThrow('HTTP 429: Rate limit exceeded');
    });

    it('should respect privacy levels', async () => {
      const privateRequest = {
        ...mockRequest,
        privacyLevel: PrivacyLevel.CONFIDENTIAL
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIResponse
      });

      await provider.processRequest(privateRequest);

      // Verify that privacy considerations are included in system prompt
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      if (requestBody.messages) {
        const systemMessage = requestBody.messages.find((msg: any) => msg.role === 'system');
        expect(systemMessage?.content).toContain('Do not store or remember');
      }
    });
  });

  describe('health check', () => {
    it('should return healthy status when API is accessible', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'gpt-3.5-turbo', object: 'model' },
            { id: 'gpt-4', object: 'model' }
          ]
        })
      });

      const health = await provider.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.issues).toHaveLength(0);
    });

    it('should return unhealthy status when API is inaccessible', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const health = await provider.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.issues).toContain('Network error');
      expect(mockLogger.error).toHaveBeenCalledWith('Health check failed', expect.any(Object));
    });
  });

  describe('model management', () => {
    it('should fetch available models from API', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'gpt-3.5-turbo', object: 'model' },
          { id: 'gpt-4-turbo', object: 'model' },
          { id: 'gpt-4', object: 'model' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockModelsResponse
      });

      const models = await provider.getAvailableModels();

      expect(models).toHaveLength(3);
      expect(models[0].provider).toBe(ModelProvider.OPENAI);
      expect(models[0].capabilities).toContain(ModelCapability.CODE_COMPLETION);
    });

    it('should return default models when API fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API error'));

      const models = await provider.getAvailableModels();

      expect(models.length).toBeGreaterThan(0);
      expect(models[0].provider).toBe(ModelProvider.OPENAI);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch OpenAI models', expect.any(Object));
    });

    it('should filter supported models', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'gpt-3.5-turbo', object: 'model' },
          { id: 'unsupported-model', object: 'model' },
          { id: 'gpt-4', object: 'model' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockModelsResponse
      });

      const models = await provider.getAvailableModels();

      // Should only include supported models (gpt-3.5-turbo and gpt-4)
      expect(models).toHaveLength(2);
      expect(models.every(m => m.modelId.startsWith('gpt-'))).toBe(true);
    });
  });

  describe('request conversion', () => {
    it('should convert code completion request correctly', async () => {
      const request: AIRequest = {
        id: 'test',
        type: AIRequestType.CODE_COMPLETION,
        context: {
          projectId: 'test',
          language: 'javascript',
          dependencies: [],
          architecture: 'unknown' as any,
          codeMetrics: {} as any,
          userPreferences: {} as any
        },
        payload: {
          code: 'function hello() {',
          suffix: '}'
        },
        priority: RequestPriority.NORMAL,
        privacyLevel: PrivacyLevel.INTERNAL,
        timestamp: new Date()
      };

      const providerRequest = await (provider as any).convertToProviderRequest(request);

      expect(providerRequest.model).toBe('gpt-3.5-turbo');
      expect(providerRequest.prompt).toContain('function hello() {');
      expect(providerRequest.maxTokens).toBeLessThanOrEqual(150);
      expect(providerRequest.metadata.requestType).toBe(AIRequestType.CODE_COMPLETION);
    });

    it('should select appropriate model based on request type', async () => {
      const analysisRequest: AIRequest = {
        id: 'test',
        type: AIRequestType.PREDICTIVE_ANALYSIS,
        context: {} as any,
        payload: { code: 'test code' },
        priority: RequestPriority.HIGH,
        privacyLevel: PrivacyLevel.INTERNAL,
        timestamp: new Date()
      };

      const providerRequest = await (provider as any).convertToProviderRequest(analysisRequest);

      // Should use more capable model for analysis
      expect(providerRequest.model).toBe('gpt-4-turbo');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        timeout: 45000,
        retryAttempts: 5
      };

      provider.updateConfig(newConfig);
      const updatedConfig = provider.getConfig();

      expect(updatedConfig.timeout).toBe(45000);
      expect(updatedConfig.retryAttempts).toBe(5);
      expect(updatedConfig.auth.apiKey).toBe('test-api-key'); // Should preserve existing values
    });

    it('should include organization ID in requests when configured', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: []
        })
      });

      await provider.healthCheck();

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['OpenAI-Organization']).toBe('test-org');
    });

    it('should include custom headers when configured', async () => {
      provider.updateConfig({
        auth: {
          ...config.auth,
          customHeaders: {
            'X-Custom-Header': 'test-value'
          }
        }
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: []
        })
      });

      await provider.healthCheck();

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['X-Custom-Header']).toBe('test-value');
    });
  });

  describe('performance tracking', () => {
    it('should track request metrics', async () => {
      const mockRequest: AIRequest = {
        id: 'test',
        type: AIRequestType.CODE_COMPLETION,
        context: {} as any,
        payload: { code: 'test' },
        priority: RequestPriority.NORMAL,
        privacyLevel: PrivacyLevel.INTERNAL,
        timestamp: new Date()
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test',
          choices: [{ text: 'result', finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: 'gpt-3.5-turbo',
          created: Date.now()
        })
      });

      await provider.processRequest(mockRequest);

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('openai_response_time', expect.any(Number));
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('openai_success_rate', 1);
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('openai_tokens_used', 15);
    });
  });
});