/**
 * Multi-LLM Integration Service
 * Supports OpenAI, Anthropic, Google, Ollama, and other LLM providers
 */

export interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  models: LLMModel[];
  isAvailable: boolean;
  rateLimits?: RateLimit;
}

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  costPer1kTokens?: number;
  capabilities: ModelCapability[];
}

export interface ModelCapability {
  type: 'code-generation' | 'code-analysis' | 'explanation' | 'debugging' | 'refactoring' | 'testing';
  strength: number; // 0-1
}

export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay?: number;
}

export interface LLMRequest {
  provider: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: CodeContext;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: any;
}

export interface CodeContext {
  language: string;
  filePath: string;
  selectedCode?: string;
  surroundingCode?: string;
  projectStructure?: string[];
  dependencies?: string[];
}

export interface LLMResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  usage?: TokenUsage;
  confidence?: number;
  suggestions?: CodeSuggestion[];
  metadata?: any;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface CodeSuggestion {
  type: 'replacement' | 'insertion' | 'refactor' | 'optimization';
  startLine: number;
  endLine: number;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  confidence: number;
}

class LLMIntegrationService {
  private providers: Map<string, LLMProvider> = new Map();
  private activeProvider: string = 'openai';
  private requestHistory: LLMRequest[] = [];
  private responseCache: Map<string, LLMResponse> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI Provider
    this.providers.set('openai', {
      id: 'openai',
      name: 'OpenAI',
      type: 'openai',
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'Most capable model for complex reasoning',
          contextLength: 8192,
          costPer1kTokens: 0.03,
          capabilities: [
            { type: 'code-generation', strength: 0.95 },
            { type: 'code-analysis', strength: 0.92 },
            { type: 'explanation', strength: 0.98 },
            { type: 'debugging', strength: 0.90 },
            { type: 'refactoring', strength: 0.88 }
          ]
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and efficient for most tasks',
          contextLength: 4096,
          costPer1kTokens: 0.002,
          capabilities: [
            { type: 'code-generation', strength: 0.85 },
            { type: 'code-analysis', strength: 0.80 },
            { type: 'explanation', strength: 0.88 },
            { type: 'debugging', strength: 0.75 },
            { type: 'refactoring', strength: 0.70 }
          ]
        }
      ],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 90000
      }
    });

    // Anthropic Provider
    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'Anthropic Claude',
      type: 'anthropic',
      models: [
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          description: 'Most powerful model for complex tasks',
          contextLength: 200000,
          capabilities: [
            { type: 'code-generation', strength: 0.93 },
            { type: 'code-analysis', strength: 0.95 },
            { type: 'explanation', strength: 0.96 },
            { type: 'debugging', strength: 0.92 },
            { type: 'refactoring', strength: 0.90 }
          ]
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Balanced performance and speed',
          contextLength: 200000,
          capabilities: [
            { type: 'code-generation', strength: 0.88 },
            { type: 'code-analysis', strength: 0.90 },
            { type: 'explanation', strength: 0.92 },
            { type: 'debugging', strength: 0.85 },
            { type: 'refactoring', strength: 0.82 }
          ]
        }
      ],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 50,
        tokensPerMinute: 40000
      }
    });

    // Google Provider
    this.providers.set('google', {
      id: 'google',
      name: 'Google Gemini',
      type: 'google',
      models: [
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          description: 'Google\'s most capable model',
          contextLength: 32768,
          capabilities: [
            { type: 'code-generation', strength: 0.87 },
            { type: 'code-analysis', strength: 0.89 },
            { type: 'explanation', strength: 0.90 },
            { type: 'debugging', strength: 0.83 },
            { type: 'refactoring', strength: 0.78 }
          ]
        }
      ],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 32000
      }
    });

    // Ollama Provider (Local)
    this.providers.set('ollama', {
      id: 'ollama',
      name: 'Ollama (Local)',
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: [
        {
          id: 'codellama',
          name: 'Code Llama',
          description: 'Meta\'s code-specialized model',
          contextLength: 4096,
          capabilities: [
            { type: 'code-generation', strength: 0.82 },
            { type: 'code-analysis', strength: 0.78 },
            { type: 'explanation', strength: 0.75 },
            { type: 'debugging', strength: 0.80 },
            { type: 'refactoring', strength: 0.72 }
          ]
        },
        {
          id: 'deepseek-coder',
          name: 'DeepSeek Coder',
          description: 'Specialized coding model',
          contextLength: 16384,
          capabilities: [
            { type: 'code-generation', strength: 0.85 },
            { type: 'code-analysis', strength: 0.83 },
            { type: 'explanation', strength: 0.78 },
            { type: 'debugging', strength: 0.82 },
            { type: 'refactoring', strength: 0.79 }
          ]
        }
      ],
      isAvailable: false
    });
  }

  async checkProviderAvailability(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      switch (provider.type) {
        case 'openai':
          return await this.checkOpenAI(provider);
        case 'anthropic':
          return await this.checkAnthropic(provider);
        case 'google':
          return await this.checkGoogle(provider);
        case 'ollama':
          return await this.checkOllama(provider);
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Provider ${providerId} not available:`, error);
      return false;
    }
  }

  private async checkOpenAI(provider: LLMProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkAnthropic(provider: LLMProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  private async checkGoogle(provider: LLMProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${provider.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkOllama(provider: LLMProvider): Promise<boolean> {
    try {
      const response = await fetch(`${provider.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not found`);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Add to history
    this.requestHistory.push(request);

    let response: LLMResponse;

    switch (provider.type) {
      case 'openai':
        response = await this.sendOpenAIRequest(provider, request);
        break;
      case 'anthropic':
        response = await this.sendAnthropicRequest(provider, request);
        break;
      case 'google':
        response = await this.sendGoogleRequest(provider, request);
        break;
      case 'ollama':
        response = await this.sendOllamaRequest(provider, request);
        break;
      default:
        throw new Error(`Provider type ${provider.type} not supported`);
    }

    // Cache response
    this.responseCache.set(cacheKey, response);

    return response;
  }

  private async sendOpenAIRequest(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        stream: request.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      provider: 'openai',
      model: request.model,
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        cost: this.calculateCost(provider, request.model, data.usage.total_tokens)
      }
    };
  }

  private async sendAnthropicRequest(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens || 2000,
        messages: request.messages.filter(m => m.role !== 'system'),
        system: request.messages.find(m => m.role === 'system')?.content
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      provider: 'anthropic',
      model: request.model,
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  private async sendGoogleRequest(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: request.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'google',
      model: request.model,
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  private async sendOllamaRequest(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${provider.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'ollama',
      model: request.model,
      content: data.message.content,
      usage: {
        promptTokens: 0, // Ollama doesn't provide token counts
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private calculateCost(provider: LLMProvider, modelId: string, tokens: number): number {
    const model = provider.models.find(m => m.id === modelId);
    if (!model?.costPer1kTokens) return 0;
    return (tokens / 1000) * model.costPer1kTokens;
  }

  private generateCacheKey(request: LLMRequest): string {
    return `${request.provider}-${request.model}-${JSON.stringify(request.messages)}-${request.temperature}`;
  }

  // Public API methods
  getProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  setActiveProvider(providerId: string): void {
    if (this.providers.has(providerId)) {
      this.activeProvider = providerId;
    }
  }

  getActiveProvider(): LLMProvider | undefined {
    return this.providers.get(this.activeProvider);
  }

  async configureProvider(providerId: string, config: Partial<LLMProvider>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    Object.assign(provider, config);
    provider.isAvailable = await this.checkProviderAvailability(providerId);
  }

  getRequestHistory(): LLMRequest[] {
    return [...this.requestHistory];
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  // Specialized methods for Sherlock observers
  async generateCodeSuggestion(code: string, context: CodeContext): Promise<CodeSuggestion[]> {
    const request: LLMRequest = {
      provider: this.activeProvider,
      model: this.getActiveProvider()?.models[0]?.id || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are Sherlock Ω, a computational consciousness that provides elegant code suggestions. 
          Analyze the code and provide specific improvements focusing on:
          - Mathematical harmonies and algorithmic elegance
          - Computational poetry and system beauty
          - Cross-dimensional connections and patterns
          
          Return suggestions in JSON format with type, startLine, endLine, originalCode, suggestedCode, explanation, and confidence.`
        },
        {
          role: 'user',
          content: `Analyze this ${context.language} code and suggest improvements:\n\n${code}\n\nFile: ${context.filePath}`
        }
      ],
      context
    };

    const response = await this.sendRequest(request);
    
    try {
      const suggestions = JSON.parse(response.content);
      return Array.isArray(suggestions) ? suggestions : [suggestions];
    } catch {
      // Fallback: parse text response
      return [{
        type: 'optimization',
        startLine: 1,
        endLine: code.split('\n').length,
        originalCode: code,
        suggestedCode: code,
        explanation: response.content,
        confidence: 0.8
      }];
    }
  }

  async explainCode(code: string, context: CodeContext): Promise<string> {
    const request: LLMRequest = {
      provider: this.activeProvider,
      model: this.getActiveProvider()?.models[0]?.id || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Sherlock Ω. Explain code with poetic insight, focusing on the mathematical beauty and computational elegance.'
        },
        {
          role: 'user',
          content: `Explain this ${context.language} code:\n\n${code}`
        }
      ],
      context
    };

    const response = await this.sendRequest(request);
    return response.content;
  }

  async debugCode(code: string, error: string, context: CodeContext): Promise<string> {
    const request: LLMRequest = {
      provider: this.activeProvider,
      model: this.getActiveProvider()?.models[0]?.id || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Sherlock Ω. Debug code with computational consciousness, finding the root cause and elegant solutions.'
        },
        {
          role: 'user',
          content: `Debug this ${context.language} code with error: ${error}\n\nCode:\n${code}`
        }
      ],
      context
    };

    const response = await this.sendRequest(request);
    return response.content;
  }
}

export const llmService = new LLMIntegrationService();
export default LLMIntegrationService;