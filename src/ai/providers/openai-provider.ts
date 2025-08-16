/**
 * OpenAI Provider Implementation
 * 
 * Implements OpenAI API integration with GPT models for code completion,
 * text generation, and advanced reasoning capabilities.
 */

import { BaseModelProvider, ProviderRequest, ProviderResponse, ProviderConfig } from './base-provider';
import {
  AIRequest,
  AIResponse,
  ModelProvider,
  ModelCapability,
  ModelConfiguration,
  AIRequestType,
  AIError,
  AIErrorCode
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import { RequestIdGenerator, TokenUtils } from '../utils';

/**
 * OpenAI-specific request format
 */
interface OpenAIRequest {
  model: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
  suffix?: string;
}

/**
 * OpenAI-specific response format
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text?: string;
    message?: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
    logprobs?: any;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI Provider implementation
 */
export class OpenAIProvider extends BaseModelProvider {
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  constructor(config: ProviderConfig, logger: Logger, performanceMonitor: PerformanceMonitor) {
    super(config, logger, performanceMonitor);
    this.baseUrl = config.auth.endpoint || 'https://api.openai.com/v1';
    this.apiVersion = '2023-12-01';
  }

  getProviderType(): ModelProvider {
    return ModelProvider.OPENAI;
  }

  getSupportedCapabilities(): ModelCapability[] {
    return [
      ModelCapability.CODE_COMPLETION,
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CODE_ANALYSIS,
      ModelCapability.NATURAL_LANGUAGE,
      ModelCapability.REASONING
    ];
  }

  protected async convertToProviderRequest(request: AIRequest): Promise<ProviderRequest> {
    const openaiRequest = await this.buildOpenAIRequest(request);
    
    return {
      model: openaiRequest.model,
      prompt: this.extractPrompt(openaiRequest),
      maxTokens: openaiRequest.max_tokens,
      temperature: openaiRequest.temperature,
      topP: openaiRequest.top_p,
      stop: openaiRequest.stop,
      stream: openaiRequest.stream || false,
      metadata: {
        openaiRequest,
        requestType: request.type,
        privacyLevel: request.privacyLevel
      }
    };
  }

  protected async executeRequest(request: ProviderRequest): Promise<ProviderResponse> {
    const openaiRequest = request.metadata?.openaiRequest as OpenAIRequest;
    const endpoint = this.getEndpoint(request.metadata?.requestType as AIRequestType);
    
    try {
      this.logger.debug('Executing OpenAI request', {
        endpoint,
        model: openaiRequest.model,
        requestId: this.generateProviderRequestId()
      });

      const response = await this.makeHttpRequest(endpoint, openaiRequest);
      const openaiResponse = response as OpenAIResponse;

      // Convert to standard provider response format
      const providerResponse: ProviderResponse = {
        id: openaiResponse.id,
        choices: openaiResponse.choices.map(choice => ({
          text: choice.text || choice.message?.content || '',
          finishReason: choice.finish_reason,
          index: choice.index
        })),
        usage: {
          promptTokens: openaiResponse.usage.prompt_tokens,
          completionTokens: openaiResponse.usage.completion_tokens,
          totalTokens: openaiResponse.usage.total_tokens
        },
        model: openaiResponse.model,
        created: openaiResponse.created
      };

      this.logger.debug('OpenAI request completed', {
        responseId: openaiResponse.id,
        tokensUsed: openaiResponse.usage.total_tokens,
        finishReason: openaiResponse.choices[0]?.finish_reason
      });

      return providerResponse;

    } catch (error) {
      this.logger.error('OpenAI request failed', {
        endpoint,
        model: openaiRequest.model,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  protected async convertToAIResponse(
    originalRequest: AIRequest,
    providerResponse: ProviderResponse
  ): Promise<AIResponse> {
    const choice = providerResponse.choices[0];
    if (!choice) {
      throw new AIError(
        'No response choices returned from OpenAI',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Get model configuration for cost calculation
    const modelConfig = await this.getModelConfiguration(providerResponse.model);
    const tokenUsage = this.createTokenUsage(providerResponse, modelConfig);
    const confidence = this.calculateConfidence(providerResponse, originalRequest);

    const aiResponse: AIResponse = {
      id: `openai_${providerResponse.id}`,
      requestId: originalRequest.id,
      result: this.formatResult(choice.text, originalRequest.type),
      confidence,
      modelUsed: providerResponse.model,
      processingTime: 0, // Will be set by orchestrator
      tokens: tokenUsage
    };

    return aiResponse;
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      // Simple health check using models endpoint
      const response = await this.makeHttpRequest('/models', null, 'GET');
      return response && Array.isArray(response.data);
    } catch (error) {
      this.logger.warn('OpenAI health check failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  protected async fetchAvailableModels(): Promise<ModelConfiguration[]> {
    try {
      const response = await this.makeHttpRequest('/models', null, 'GET');
      const models = response.data || [];

      return models
        .filter((model: any) => this.isSupportedModel(model.id))
        .map((model: any) => this.createModelConfiguration(model));

    } catch (error) {
      this.logger.error('Failed to fetch OpenAI models', { error: error instanceof Error ? error.message : String(error) });
      return this.getDefaultModels();
    }
  }

  protected getDefaultModels(): ModelConfiguration[] {
    return [
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
        responseTime: 2000,
        accuracy: 0.95,
        availability: 0.99
      },
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
        responseTime: 1000,
        accuracy: 0.85,
        availability: 0.99
      },
      {
        modelId: 'gpt-4',
        provider: ModelProvider.OPENAI,
        capabilities: [
          ModelCapability.CODE_COMPLETION,
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_ANALYSIS,
          ModelCapability.NATURAL_LANGUAGE,
          ModelCapability.REASONING
        ],
        costPerToken: 0.00006, // $0.06 per 1K tokens
        maxTokens: 8192,
        responseTime: 3000,
        accuracy: 0.93,
        availability: 0.98
      }
    ];
  }

  // Private helper methods

  private async buildOpenAIRequest(request: AIRequest): Promise<OpenAIRequest> {
    const model = this.selectModel(request);
    const baseRequest: OpenAIRequest = {
      model,
      temperature: 0.1, // Low temperature for more deterministic code completion
      max_tokens: this.calculateMaxTokens(request),
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    switch (request.type) {
      case AIRequestType.CODE_COMPLETION:
        return this.buildCodeCompletionRequest(baseRequest, request);
      
      case AIRequestType.NATURAL_LANGUAGE:
        return this.buildChatRequest(baseRequest, request);
      
      case AIRequestType.PREDICTIVE_ANALYSIS:
        return this.buildAnalysisRequest(baseRequest, request);
      
      case AIRequestType.DEBUG_ASSISTANCE:
        return this.buildDebugRequest(baseRequest, request);
      
      default:
        return this.buildGenericRequest(baseRequest, request);
    }
  }

  private buildCodeCompletionRequest(baseRequest: OpenAIRequest, request: AIRequest): OpenAIRequest {
    const payload = request.payload as any;
    const code = payload.code || '';
    const context = payload.context || '';
    
    // Use completion endpoint for code completion
    return {
      ...baseRequest,
      prompt: this.buildCodeCompletionPrompt(code, context, request.context),
      suffix: payload.suffix,
      temperature: 0.1,
      max_tokens: Math.min(150, baseRequest.max_tokens || 150), // Shorter for completions
      stop: ['\n\n', '```', '};', '});']
    };
  }

  private buildChatRequest(baseRequest: OpenAIRequest, request: AIRequest): OpenAIRequest {
    const payload = request.payload as any;
    const userMessage = payload.message || payload.command || '';
    
    return {
      ...baseRequest,
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(request)
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.3 // Slightly higher for natural language
    };
  }

  private buildAnalysisRequest(baseRequest: OpenAIRequest, request: AIRequest): OpenAIRequest {
    const payload = request.payload as any;
    const code = payload.code || '';
    
    return {
      ...baseRequest,
      messages: [
        {
          role: 'system',
          content: 'You are an expert code analyzer. Analyze the provided code for potential issues, optimizations, and best practices.'
        },
        {
          role: 'user',
          content: `Analyze this ${request.context.language} code:\n\n${code}`
        }
      ],
      temperature: 0.2
    };
  }

  private buildDebugRequest(baseRequest: OpenAIRequest, request: AIRequest): OpenAIRequest {
    const payload = request.payload as any;
    const error = payload.error || '';
    const code = payload.code || '';
    
    return {
      ...baseRequest,
      messages: [
        {
          role: 'system',
          content: 'You are an expert debugging assistant. Help identify and fix code issues.'
        },
        {
          role: 'user',
          content: `Debug this ${request.context.language} code error:\n\nError: ${error}\n\nCode:\n${code}`
        }
      ],
      temperature: 0.1
    };
  }

  private buildGenericRequest(baseRequest: OpenAIRequest, request: AIRequest): OpenAIRequest {
    const payload = request.payload as any;
    const prompt = payload.prompt || payload.text || '';
    
    return {
      ...baseRequest,
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(request)
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };
  }

  private buildCodeCompletionPrompt(code: string, context: string, projectContext: any): string {
    const language = projectContext.language || 'javascript';
    const framework = projectContext.framework || '';
    
    let prompt = `Complete the following ${language} code`;
    if (framework) {
      prompt += ` using ${framework}`;
    }
    prompt += ':\n\n';
    
    if (context) {
      prompt += `Context:\n${context}\n\n`;
    }
    
    prompt += `Code to complete:\n${code}`;
    
    return prompt;
  }

  private buildSystemPrompt(request: AIRequest): string {
    const language = request.context.language || 'javascript';
    const framework = request.context.framework || '';
    
    let prompt = `You are an expert ${language} developer`;
    if (framework) {
      prompt += ` specializing in ${framework}`;
    }
    prompt += '. Provide accurate, efficient, and well-documented code solutions.';
    
    // Add privacy considerations
    if (request.privacyLevel === 'confidential' || request.privacyLevel === 'local_only') {
      prompt += ' Do not store or remember any code or data from this conversation.';
    }
    
    return prompt;
  }

  private selectModel(request: AIRequest): string {
    // Select model based on request type and complexity
    const userPreferences = request.context.userPreferences?.modelPreferences;
    
    if (userPreferences?.preferredProviders.includes('openai')) {
      // Use user's preferred model if available
      if (this.config.supportedModels.includes(userPreferences.preferredProviders[0])) {
        return userPreferences.preferredProviders[0];
      }
    }

    // Default model selection based on request type
    switch (request.type) {
      case AIRequestType.CODE_COMPLETION:
        return 'gpt-3.5-turbo'; // Fast for completions
      
      case AIRequestType.PREDICTIVE_ANALYSIS:
      case AIRequestType.DEBUG_ASSISTANCE:
        return 'gpt-4-turbo'; // More capable for analysis
      
      default:
        return this.config.defaultModel || 'gpt-3.5-turbo';
    }
  }

  private calculateMaxTokens(request: AIRequest): number {
    const payload = request.payload as any;
    const inputText = payload.code || payload.prompt || payload.message || '';
    const estimatedInputTokens = TokenUtils.estimateTokenCount(inputText);
    
    // Reserve tokens for response based on request type
    switch (request.type) {
      case AIRequestType.CODE_COMPLETION:
        return Math.min(150, 4096 - estimatedInputTokens);
      
      case AIRequestType.NATURAL_LANGUAGE:
        return Math.min(500, 4096 - estimatedInputTokens);
      
      case AIRequestType.PREDICTIVE_ANALYSIS:
      case AIRequestType.DEBUG_ASSISTANCE:
        return Math.min(1000, 4096 - estimatedInputTokens);
      
      default:
        return Math.min(500, 4096 - estimatedInputTokens);
    }
  }

  private getEndpoint(requestType: AIRequestType): string {
    switch (requestType) {
      case AIRequestType.CODE_COMPLETION:
        return '/completions';
      
      default:
        return '/chat/completions';
    }
  }

  private extractPrompt(openaiRequest: OpenAIRequest): string {
    if (openaiRequest.prompt) {
      return openaiRequest.prompt;
    }
    
    if (openaiRequest.messages) {
      return openaiRequest.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
    }
    
    return '';
  }

  private async makeHttpRequest(
    endpoint: string, 
    data: any, 
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.auth.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Sherlock-Omega-IDE/1.0'
    };

    if (this.config.auth.organizationId) {
      headers['OpenAI-Organization'] = this.config.auth.organizationId;
    }

    // Add custom headers
    if (this.config.auth.customHeaders) {
      Object.assign(headers, this.config.auth.customHeaders);
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (data && method === 'POST') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${(errorData as any).error?.message || response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if ((error as any).name === 'AbortError') {
        throw new AIError(
          'Request timeout',
          AIErrorCode.TIMEOUT,
          true
        );
      }
      throw error;
    }
  }

  private isSupportedModel(modelId: string): boolean {
    const supportedPrefixes = ['gpt-3.5', 'gpt-4', 'text-davinci', 'code-davinci'];
    return supportedPrefixes.some(prefix => modelId.startsWith(prefix));
  }

  private createModelConfiguration(model: any): ModelConfiguration {
    const capabilities = this.getModelCapabilities(model.id);
    const pricing = this.getModelPricing(model.id);
    
    return {
      modelId: model.id,
      provider: ModelProvider.OPENAI,
      capabilities,
      costPerToken: pricing.costPerToken,
      maxTokens: pricing.maxTokens,
      responseTime: pricing.responseTime,
      accuracy: pricing.accuracy,
      availability: 0.99
    };
  }

  private getModelCapabilities(modelId: string): ModelCapability[] {
    if (modelId.includes('gpt-4')) {
      return [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CODE_ANALYSIS,
        ModelCapability.NATURAL_LANGUAGE,
        ModelCapability.REASONING
      ];
    }
    
    if (modelId.includes('gpt-3.5')) {
      return [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.NATURAL_LANGUAGE
      ];
    }
    
    return [ModelCapability.TEXT_GENERATION];
  }

  private getModelPricing(modelId: string): {
    costPerToken: number;
    maxTokens: number;
    responseTime: number;
    accuracy: number;
  } {
    // Pricing as of 2024 - would be updated from API in production
    const pricingMap: Record<string, any> = {
      'gpt-4-turbo': { costPerToken: 0.00003, maxTokens: 128000, responseTime: 2000, accuracy: 0.95 },
      'gpt-4': { costPerToken: 0.00006, maxTokens: 8192, responseTime: 3000, accuracy: 0.93 },
      'gpt-3.5-turbo': { costPerToken: 0.000002, maxTokens: 16384, responseTime: 1000, accuracy: 0.85 }
    };

    return pricingMap[modelId] || pricingMap['gpt-3.5-turbo'];
  }

  private async getModelConfiguration(modelId: string): Promise<ModelConfiguration> {
    const defaultModels = this.getDefaultModels();
    return defaultModels.find(m => m.modelId === modelId) || defaultModels[0];
  }

  private formatResult(text: string, requestType: AIRequestType): string {
    if (!text) return '';

    switch (requestType) {
      case AIRequestType.CODE_COMPLETION:
        // Clean up code completion results
        return text.trim().replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
      
      default:
        return text.trim();
    }
  }
}