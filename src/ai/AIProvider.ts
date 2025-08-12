/**
 * Advanced AI Provider Integration for Sherlock Ω
 * Connects to GPT-4, Claude, and other AI models for sophisticated completions
 */

export interface AIModel {
  name: string;
  provider: 'openai' | 'anthropic' | 'local';
  capabilities: AICapability[];
  maxTokens: number;
  costPerToken: number;
  latency: number; // ms
}

export enum AICapability {
  CODE_COMPLETION = 'code_completion',
  CODE_EXPLANATION = 'code_explanation',
  REFACTORING = 'refactoring',
  DEBUGGING = 'debugging',
  ARCHITECTURE_DESIGN = 'architecture_design',
  TEST_GENERATION = 'test_generation',
  DOCUMENTATION = 'documentation',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization'
}

export interface AIRequest {
  id: string;
  type: AICapability;
  context: {
    code: string;
    language: string;
    filePath: string;
    cursorPosition?: { line: number; column: number };
    selectedText?: string;
    projectContext?: any;
  };
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  reasoning?: string;
  alternatives?: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    latency: number;
    cost: number;
    timestamp: number;
  };
}

export interface AIProviderConfig {
  openai?: {
    apiKey: string;
    baseURL?: string;
    models: string[];
    defaultModel: string;
  };
  anthropic?: {
    apiKey: string;
    baseURL?: string;
    models: string[];
    defaultModel: string;
  };
  local?: {
    endpoint: string;
    models: string[];
    defaultModel: string;
  };
  fallbackStrategy: 'round_robin' | 'cost_optimized' | 'latency_optimized' | 'quality_optimized';
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
}

/**
 * Abstract base class for AI providers
 */
export abstract class AIProvider {
  protected config: any;
  protected model: AIModel;

  constructor(config: any, model: AIModel) {
    this.config = config;
    this.model = model;
  }

  abstract complete(request: AIRequest): Promise<AIResponse>;
  abstract isHealthy(): Promise<boolean>;
  abstract getUsageStats(): any;
}

/**
 * OpenAI GPT-4 Provider
 */
export class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private baseURL: string;
  private requestCount: number = 0;
  private totalTokens: number = 0;
  private totalCost: number = 0;

  constructor(config: AIProviderConfig['openai'], model: AIModel) {
    super(config, model);
    this.apiKey = config!.apiKey;
    this.baseURL = config!.baseURL || 'https://api.openai.com/v1';
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest({
        model: request.model || this.config.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(request.type, request.context)
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const latency = Date.now() - startTime;
      const tokensUsed = response.usage.total_tokens;
      const cost = tokensUsed * this.model.costPerToken;

      this.requestCount++;
      this.totalTokens += tokensUsed;
      this.totalCost += cost;

      return {
        id: request.id,
        content: response.choices[0].message.content,
        confidence: this.calculateConfidence(response),
        reasoning: this.extractReasoning(response.choices[0].message.content),
        alternatives: this.extractAlternatives(response.choices),
        metadata: {
          model: response.model,
          tokensUsed,
          latency,
          cost,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      return response.choices && response.choices.length > 0;
    } catch {
      return false;
    }
  }

  getUsageStats() {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      averageLatency: this.model.latency,
      provider: 'openai'
    };
  }

  private async makeRequest(payload: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private buildSystemPrompt(type: AICapability, context: any): string {
    const basePrompt = `You are Sherlock Ω, an advanced AI assistant specialized in ${type.replace('_', ' ')}. 
You have deep expertise in software development, architecture, and best practices.`;

    const contextPrompt = `
Context:
- Language: ${context.language}
- File: ${context.filePath}
- Project type: ${this.inferProjectType(context)}
`;

    const capabilityPrompts: Record<AICapability, string> = {
      [AICapability.CODE_COMPLETION]: `
Focus on providing intelligent, context-aware code completions that:
- Follow the existing code style and patterns
- Are syntactically correct and semantically meaningful
- Consider the broader codebase architecture
- Optimize for readability and maintainability`,

      [AICapability.CODE_EXPLANATION]: `
Provide clear explanations of the code that:
- Explain the purpose and functionality
- Identify potential issues or improvements
- Suggest best practices
- Help with understanding complex logic`,

      [AICapability.REFACTORING]: `
Provide refactoring suggestions that:
- Improve code quality and maintainability
- Follow SOLID principles and design patterns
- Preserve existing functionality
- Consider performance implications`,

      [AICapability.DEBUGGING]: `
Help debug issues by:
- Analyzing error patterns and stack traces
- Suggesting potential root causes
- Providing step-by-step debugging strategies
- Recommending preventive measures`,

      [AICapability.ARCHITECTURE_DESIGN]: `
Provide architectural guidance that:
- Follows industry best practices
- Considers scalability and maintainability
- Suggests appropriate design patterns
- Balances complexity and functionality`,

      [AICapability.TEST_GENERATION]: `
Generate comprehensive tests that:
- Cover edge cases and error conditions
- Follow testing best practices
- Are maintainable and readable
- Provide good coverage of the codebase`,

      [AICapability.DOCUMENTATION]: `
Generate clear, comprehensive documentation that:
- Explains functionality and usage
- Includes examples and best practices
- Follows documentation standards
- Is maintainable and up-to-date`,

      [AICapability.PERFORMANCE_OPTIMIZATION]: `
Suggest performance optimizations that:
- Identify bottlenecks and inefficiencies
- Provide measurable improvements
- Consider memory and CPU usage
- Maintain code readability`
    };

    return basePrompt + contextPrompt + (capabilityPrompts[type] || '');
  }

  private inferProjectType(context: any): string {
    const filePath = context.filePath.toLowerCase();
    
    if (filePath.includes('package.json') || filePath.includes('node_modules')) {
      return 'Node.js';
    }
    if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
      return 'React';
    }
    if (filePath.includes('.vue')) {
      return 'Vue.js';
    }
    if (filePath.includes('.py')) {
      return 'Python';
    }
    
    return 'General';
  }

  private calculateConfidence(response: any): number {
    // Calculate confidence based on response characteristics
    const choice = response.choices[0];
    
    let confidence = 0.8; // Base confidence
    
    // Adjust based on finish reason
    if (choice.finish_reason === 'stop') {
      confidence += 0.1;
    } else if (choice.finish_reason === 'length') {
      confidence -= 0.1;
    }
    
    // Adjust based on content length and structure
    const content = choice.message.content;
    if (content.length > 50 && content.includes('\n')) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private extractReasoning(content: string): string | undefined {
    // Extract reasoning from response if present
    const reasoningMatch = content.match(/(?:because|since|reason|explanation):\s*(.+?)(?:\n|$)/i);
    return reasoningMatch ? reasoningMatch[1].trim() : undefined;
  }

  private extractAlternatives(choices: any[]): string[] {
    // Extract alternative suggestions if multiple choices
    return choices.slice(1).map(choice => choice.message.content);
  }
}

/**
 * Anthropic Claude Provider
 */
export class AnthropicProvider extends AIProvider {
  private apiKey: string;
  private baseURL: string;
  private requestCount: number = 0;
  private totalTokens: number = 0;
  private totalCost: number = 0;

  constructor(config: AIProviderConfig['anthropic'], model: AIModel) {
    super(config, model);
    this.apiKey = config!.apiKey;
    this.baseURL = config!.baseURL || 'https://api.anthropic.com/v1';
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest({
        model: request.model || this.config.defaultModel,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(request)
          }
        ]
      });

      const latency = Date.now() - startTime;
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const cost = tokensUsed * this.model.costPerToken;

      this.requestCount++;
      this.totalTokens += tokensUsed;
      this.totalCost += cost;

      return {
        id: request.id,
        content: response.content[0].text,
        confidence: this.calculateConfidence(response),
        metadata: {
          model: response.model,
          tokensUsed,
          latency,
          cost,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      return response.content && response.content.length > 0;
    } catch {
      return false;
    }
  }

  getUsageStats() {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      averageLatency: this.model.latency,
      provider: 'anthropic'
    };
  }

  private async makeRequest(payload: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private buildPrompt(request: AIRequest): string {
    return `${this.buildSystemPrompt(request.type, request.context)}

${request.prompt}

Please provide a thoughtful, accurate response that considers the context and requirements.`;
  }

  private buildSystemPrompt(type: AICapability, context: any): string {
    return `You are Claude, integrated into Sherlock Ω, an advanced development environment. 
You're helping with ${type.replace('_', ' ')} for a ${context.language} project.

Context:
- File: ${context.filePath}
- Language: ${context.language}
- Current code context provided below

Please provide precise, helpful responses that integrate well with the development workflow.`;
  }

  private calculateConfidence(response: any): number {
    // Claude-specific confidence calculation
    let confidence = 0.85; // Base confidence for Claude
    
    const content = response.content[0].text;
    if (content.length > 100) {
      confidence += 0.05;
    }
    
    if (response.stop_reason === 'end_turn') {
      confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }
}

/**
 * AI Provider Manager - Orchestrates multiple AI providers
 */
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private config: AIProviderConfig;
  private requestQueue: AIRequest[] = [];
  private activeRequests: number = 0;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider
    if (this.config.openai) {
      const gpt4Model: AIModel = {
        name: 'gpt-4',
        provider: 'openai',
        capabilities: Object.values(AICapability),
        maxTokens: 8192,
        costPerToken: 0.00003,
        latency: 2000
      };
      
      this.providers.set('openai', new OpenAIProvider(this.config.openai, gpt4Model));
    }

    // Initialize Anthropic provider
    if (this.config.anthropic) {
      const claudeModel: AIModel = {
        name: 'claude-3-opus',
        provider: 'anthropic',
        capabilities: Object.values(AICapability),
        maxTokens: 4096,
        costPerToken: 0.000015,
        latency: 1500
      };
      
      this.providers.set('anthropic', new AnthropicProvider(this.config.anthropic, claudeModel));
    }
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    // Select best provider for the request
    const provider = await this.selectProvider(request);
    
    if (!provider) {
      throw new Error('No available AI provider for request');
    }

    // Rate limiting
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      this.requestQueue.push(request);
      await this.waitForSlot();
    }

    this.activeRequests++;
    
    try {
      const response = await provider.complete(request);
      return response;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  private async selectProvider(request: AIRequest): Promise<AIProvider | null> {
    const availableProviders = Array.from(this.providers.values());
    
    // Filter providers that support the requested capability
    const capableProviders = availableProviders.filter(provider => 
      provider['model'].capabilities.includes(request.type)
    );

    if (capableProviders.length === 0) {
      return null;
    }

    // Select based on strategy
    switch (this.config.fallbackStrategy) {
      case 'cost_optimized':
        return capableProviders.reduce((best, current) => 
          current['model'].costPerToken < best['model'].costPerToken ? current : best
        );
      
      case 'latency_optimized':
        return capableProviders.reduce((best, current) => 
          current['model'].latency < best['model'].latency ? current : best
        );
      
      case 'quality_optimized':
        // Prefer Claude for reasoning, GPT-4 for code
        if (request.type === AICapability.ARCHITECTURE_DESIGN) {
          return this.providers.get('anthropic') || capableProviders[0];
        }
        return this.providers.get('openai') || capableProviders[0];
      
      default:
        return capableProviders[0];
    }
  }

  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.activeRequests < this.config.maxConcurrentRequests) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.config.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      if (request) {
        this.complete(request);
      }
    }
  }

  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    this.providers.forEach(async (provider, name) => {
      status[name] = await provider.isHealthy();
    });
    
    return status;
  }

  getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.providers.forEach((provider, name) => {
      stats[name] = provider.getUsageStats();
    });
    
    return stats;
  }
}