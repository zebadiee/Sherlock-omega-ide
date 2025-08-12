/**
 * Tests for AI Provider System
 */

import { AIProviderManager, OpenAIProvider, AnthropicProvider, AICapability, AIRequest } from '../AIProvider';

// Mock fetch globally
global.fetch = jest.fn();

describe('AIProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      const config = {
        apiKey: 'test-key',
        models: ['gpt-4'],
        defaultModel: 'gpt-4'
      };
      const model = {
        name: 'gpt-4',
        provider: 'openai' as const,
        capabilities: [AICapability.CODE_COMPLETION],
        maxTokens: 8192,
        costPerToken: 0.00003,
        latency: 2000
      };
      provider = new OpenAIProvider(config, model);
    });

    it('should complete AI requests successfully', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'function test() { return true; }' },
          finish_reason: 'stop'
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        id: 'test-1',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      const response = await provider.complete(request);

      expect(response.id).toBe('test-1');
      expect(response.content).toBe('function test() { return true; }');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata.model).toBe('gpt-4');
      expect(response.metadata.tokensUsed).toBe(50);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const request: AIRequest = {
        id: 'test-2',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      await expect(provider.complete(request)).rejects.toThrow('OpenAI API error');
    });

    it('should check health status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello' } }]
        })
      });

      const isHealthy = await provider.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should track usage statistics', () => {
      const stats = provider.getUsageStats();
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('totalTokens');
      expect(stats).toHaveProperty('totalCost');
      expect(stats.provider).toBe('openai');
    });
  });

  describe('AnthropicProvider', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      const config = {
        apiKey: 'test-key',
        models: ['claude-3-opus'],
        defaultModel: 'claude-3-opus'
      };
      const model = {
        name: 'claude-3-opus',
        provider: 'anthropic' as const,
        capabilities: [AICapability.CODE_COMPLETION],
        maxTokens: 4096,
        costPerToken: 0.000015,
        latency: 1500
      };
      provider = new AnthropicProvider(config, model);
    });

    it('should complete AI requests successfully', async () => {
      const mockResponse = {
        content: [{ text: 'function test() { return true; }' }],
        usage: { input_tokens: 20, output_tokens: 30 },
        model: 'claude-3-opus',
        stop_reason: 'end_turn'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        id: 'test-1',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      const response = await provider.complete(request);

      expect(response.id).toBe('test-1');
      expect(response.content).toBe('function test() { return true; }');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata.model).toBe('claude-3-opus');
      expect(response.metadata.tokensUsed).toBe(50);
    });
  });

  describe('AIProviderManager', () => {
    let manager: AIProviderManager;

    beforeEach(() => {
      const config = {
        openai: {
          apiKey: 'openai-key',
          models: ['gpt-4'],
          defaultModel: 'gpt-4'
        },
        anthropic: {
          apiKey: 'anthropic-key',
          models: ['claude-3-opus'],
          defaultModel: 'claude-3-opus'
        },
        fallbackStrategy: 'quality_optimized' as const,
        maxConcurrentRequests: 5,
        requestTimeout: 30000,
        retryAttempts: 3
      };
      manager = new AIProviderManager(config);
    });

    it('should route requests to appropriate providers', async () => {
      const mockOpenAIResponse = {
        choices: [{ message: { content: 'OpenAI response' }, finish_reason: 'stop' }],
        usage: { total_tokens: 50 },
        model: 'gpt-4'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse)
      });

      const request: AIRequest = {
        id: 'test-1',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      const response = await manager.complete(request);
      expect(response.content).toBe('OpenAI response');
    });

    it('should get health status for all providers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello' } }]
        })
      });

      const healthStatus = await manager.getHealthStatus();
      expect(healthStatus).toHaveProperty('openai');
      expect(healthStatus).toHaveProperty('anthropic');
    });

    it('should get usage statistics for all providers', () => {
      const stats = manager.getUsageStats();
      expect(stats).toHaveProperty('openai');
      expect(stats).toHaveProperty('anthropic');
    });
  });

  describe('AI Capability Mapping', () => {
    it('should map capabilities to appropriate completion types', () => {
      const capabilities = Object.values(AICapability);
      expect(capabilities).toContain(AICapability.CODE_COMPLETION);
      expect(capabilities).toContain(AICapability.REFACTORING);
      expect(capabilities).toContain(AICapability.DEBUGGING);
      expect(capabilities).toContain(AICapability.TEST_GENERATION);
    });
  });

  describe('Error Handling', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      const config = {
        apiKey: 'test-key',
        models: ['gpt-4'],
        defaultModel: 'gpt-4'
      };
      const model = {
        name: 'gpt-4',
        provider: 'openai' as const,
        capabilities: [AICapability.CODE_COMPLETION],
        maxTokens: 8192,
        costPerToken: 0.00003,
        latency: 2000
      };
      provider = new OpenAIProvider(config, model);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request: AIRequest = {
        id: 'test-1',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      await expect(provider.complete(request)).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      const request: AIRequest = {
        id: 'test-1',
        type: AICapability.CODE_COMPLETION,
        context: {
          code: 'function test(',
          language: 'typescript',
          filePath: 'test.ts'
        },
        prompt: 'Complete this function',
        priority: 'high'
      };

      // Should not throw but handle gracefully
      const response = await provider.complete(request);
      expect(response.confidence).toBeGreaterThan(0);
    });
  });
});