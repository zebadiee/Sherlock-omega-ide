/**
 * Ollama Provider Implementation
 * 
 * Implements local Ollama API integration for privacy-preserving AI processing
 * with support for code-focused models like DeepSeek Coder and CodeLlama.
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
 * Ollama-specific request format
 */
interface OllamaRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
}

/**
 * Ollama-specific response format
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama model information
 */
interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

/**
 * Ollama Provider implementation for local AI processing
 */
export class OllamaProvider extends BaseModelProvider {
  private readonly baseUrl: string;
  private readonly pullTimeout: number = 300000; // 5 minutes for model pulling

  constructor(config: ProviderConfig, logger: Logger, performanceMonitor: PerformanceMonitor) {
    super(config, logger, performanceMonitor);
    this.baseUrl = config.auth.endpoint || 'http://localhost:11434';
  }

  getProviderType(): ModelProvider {
    return ModelProvider.OLLAMA;
  }

  getSupportedCapabilities(): ModelCapability[] {
    return [
      ModelCapability.CODE_COMPLETION,
      ModelCapability.CODE_ANALYSIS,
      ModelCapability.TEXT_GENERATION,
      ModelCapability.NATURAL_LANGUAGE
    ];
  }

  protected async convertToProviderRequest(request: AIRequest): Promise<ProviderRequest> {
    const ollamaRequest = await this.buildOllamaRequest(request);
    
    return {
      model: ollamaRequest.model,
      prompt: ollamaRequest.prompt,
      maxTokens: ollamaRequest.options?.num_predict,
      temperature: ollamaRequest.options?.temperature,
      topP: ollamaRequest.options?.top_p,
      stop: ollamaRequest.options?.stop,
      stream: ollamaRequest.stream || false,
      metadata: {
        ollamaRequest,
        requestType: request.type,
        privacyLevel: request.privacyLevel
      }
    };
  }

  protected async executeRequest(request: ProviderRequest): Promise<ProviderResponse> {
    const ollamaRequest = request.metadata?.ollamaRequest as OllamaRequest;
    
    try {
      this.logger.debug('Executing Ollama request', {
        model: ollamaRequest.model,
        endpoint: this.baseUrl,
        requestId: this.generateProviderRequestId()
      });

      // Check if model is available locally
      await this.ensureModelAvailable(ollamaRequest.model);

      const response = await this.makeHttpRequest('/api/generate', ollamaRequest);
      const ollamaResponse = response as OllamaResponse;

      // Convert to standard provider response format
      const providerResponse: ProviderResponse = {
        id: this.generateProviderRequestId(),
        choices: [{
          text: ollamaResponse.response,
          finishReason: ollamaResponse.done ? 'stop' : 'length',
          index: 0
        }],
        usage: {
          promptTokens: ollamaResponse.prompt_eval_count || 0,
          completionTokens: ollamaResponse.eval_count || 0,
          totalTokens: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0)
        },
        model: ollamaResponse.model,
        created: new Date(ollamaResponse.created_at).getTime() / 1000
      };

      this.logger.debug('Ollama request completed', {
        model: ollamaResponse.model,
        responseLength: ollamaResponse.response.length,
        totalDuration: ollamaResponse.total_duration,
        tokensGenerated: ollamaResponse.eval_count
      });

      return providerResponse;

    } catch (error) {
      this.logger.error('Ollama request failed', {
        model: ollamaRequest.model,
        endpoint: this.baseUrl,
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
        'No response choices returned from Ollama',
        AIErrorCode.INVALID_REQUEST,
        false
      );
    }

    // Get model configuration for processing
    const modelConfig = await this.getModelConfiguration(providerResponse.model);
    const tokenUsage = this.createTokenUsage(providerResponse, modelConfig);
    const confidence = this.calculateConfidence(providerResponse, originalRequest);

    const aiResponse: AIResponse = {
      id: `ollama_${providerResponse.id}`,
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
      // Check if Ollama service is running
      const response = await this.makeHttpRequest('/api/tags', null, 'GET');
      return response && Array.isArray(response.models);
    } catch (error) {
      this.logger.warn('Ollama health check failed', { 
        endpoint: this.baseUrl,
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  protected async fetchAvailableModels(): Promise<ModelConfiguration[]> {
    try {
      const response = await this.makeHttpRequest('/api/tags', null, 'GET');
      const models = response.models || [];

      const modelConfigs = await Promise.all(
        models.map(async (model: OllamaModelInfo) => {
          try {
            return await this.createModelConfiguration(model);
          } catch (error) {
            this.logger.warn('Failed to create configuration for model', {
              model: model.name,
              error: error instanceof Error ? error.message : String(error)
            });
            return null;
          }
        })
      );

      return modelConfigs.filter(config => config !== null) as ModelConfiguration[];

    } catch (error) {
      this.logger.error('Failed to fetch Ollama models', { 
        endpoint: this.baseUrl,
        error: error instanceof Error ? error.message : String(error) 
      });
      return this.getDefaultModels();
    }
  }

  protected getDefaultModels(): ModelConfiguration[] {
    return [
      {
        modelId: 'deepseek-coder',
        provider: ModelProvider.OLLAMA,
        capabilities: [
          ModelCapability.CODE_COMPLETION,
          ModelCapability.CODE_ANALYSIS
        ],
        costPerToken: 0, // Free local processing
        maxTokens: 4096,
        responseTime: 500,
        accuracy: 0.80,
        availability: 0.95
      },
      {
        modelId: 'codellama',
        provider: ModelProvider.OLLAMA,
        capabilities: [
          ModelCapability.CODE_COMPLETION,
          ModelCapability.CODE_ANALYSIS
        ],
        costPerToken: 0,
        maxTokens: 4096,
        responseTime: 800,
        accuracy: 0.75,
        availability: 0.95
      },
      {
        modelId: 'qwen2.5-coder',
        provider: ModelProvider.OLLAMA,
        capabilities: [
          ModelCapability.CODE_COMPLETION,
          ModelCapability.CODE_ANALYSIS,
          ModelCapability.TEXT_GENERATION
        ],
        costPerToken: 0,
        maxTokens: 8192,
        responseTime: 600,
        accuracy: 0.82,
        availability: 0.95
      }
    ];
  }

  // Private helper methods

  private async buildOllamaRequest(request: AIRequest): Promise<OllamaRequest> {
    const model = this.selectModel(request);
    const baseRequest: OllamaRequest = {
      model,
      prompt: '',
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for deterministic code completion
        top_p: 0.95,
        top_k: 40,
        repeat_penalty: 1.1,
        num_predict: this.calculateMaxTokens(request)
      }
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

  private buildCodeCompletionRequest(baseRequest: OllamaRequest, request: AIRequest): OllamaRequest {
    const payload = request.payload as any;
    const code = payload.code || '';
    const context = payload.context || '';
    
    return {
      ...baseRequest,
      prompt: this.buildCodeCompletionPrompt(code, context, request.context),
      system: this.buildCodeSystemPrompt(request.context.language),
      options: {
        ...baseRequest.options,
        temperature: 0.1,
        num_predict: Math.min(100, baseRequest.options?.num_predict || 100),
        stop: ['\n\n', '```', '};', '});', 'function ', 'class ', 'const ', 'let ', 'var ']
      }
    };
  }

  private buildChatRequest(baseRequest: OllamaRequest, request: AIRequest): OllamaRequest {
    const payload = request.payload as any;
    const userMessage = payload.message || payload.command || '';
    
    return {
      ...baseRequest,
      prompt: userMessage,
      system: this.buildChatSystemPrompt(request),
      options: {
        ...baseRequest.options,
        temperature: 0.3 // Slightly higher for natural language
      }
    };
  }

  private buildAnalysisRequest(baseRequest: OllamaRequest, request: AIRequest): OllamaRequest {
    const payload = request.payload as any;
    const code = payload.code || '';
    
    return {
      ...baseRequest,
      prompt: `Analyze this ${request.context.language} code for potential issues, optimizations, and best practices:\n\n${code}`,
      system: 'You are an expert code analyzer. Provide detailed analysis of code quality, potential issues, and improvement suggestions.',
      options: {
        ...baseRequest.options,
        temperature: 0.2
      }
    };
  }

  private buildDebugRequest(baseRequest: OllamaRequest, request: AIRequest): OllamaRequest {
    const payload = request.payload as any;
    const error = payload.error || '';
    const code = payload.code || '';
    
    return {
      ...baseRequest,
      prompt: `Debug this ${request.context.language} code error:\n\nError: ${error}\n\nCode:\n${code}\n\nProvide a solution:`,
      system: 'You are an expert debugging assistant. Help identify root causes and provide clear solutions.',
      options: {
        ...baseRequest.options,
        temperature: 0.1
      }
    };
  }

  private buildGenericRequest(baseRequest: OllamaRequest, request: AIRequest): OllamaRequest {
    const payload = request.payload as any;
    const prompt = payload.prompt || payload.text || '';
    
    return {
      ...baseRequest,
      prompt,
      system: this.buildGenericSystemPrompt(request)
    };
  }

  private buildCodeCompletionPrompt(code: string, context: string, projectContext: any): string {
    const language = projectContext.language || 'javascript';
    
    let prompt = `Complete the following ${language} code:\n\n`;
    
    if (context) {
      prompt += `Context: ${context}\n\n`;
    }
    
    prompt += `Code:\n${code}`;
    
    return prompt;
  }

  private buildCodeSystemPrompt(language: string): string {
    return `You are an expert ${language} developer. Complete code accurately and efficiently. Only provide the completion, no explanations or additional text.`;
  }

  private buildChatSystemPrompt(request: AIRequest): string {
    const language = request.context.language || 'javascript';
    const framework = request.context.framework || '';
    
    let prompt = `You are an expert ${language} developer`;
    if (framework) {
      prompt += ` specializing in ${framework}`;
    }
    prompt += '. Provide helpful, accurate responses about programming concepts and code.';
    
    return prompt;
  }

  private buildGenericSystemPrompt(request: AIRequest): string {
    return 'You are a helpful AI assistant. Provide accurate and useful responses.';
  }

  private selectModel(request: AIRequest): string {
    // Select model based on request type and available models
    const supportedModels = this.config.supportedModels;
    
    switch (request.type) {
      case AIRequestType.CODE_COMPLETION:
      case AIRequestType.CONTEXT_ANALYSIS:
        // Prefer code-specific models
        if (supportedModels.includes('deepseek-coder')) {
          return 'deepseek-coder';
        }
        if (supportedModels.includes('codellama')) {
          return 'codellama';
        }
        if (supportedModels.includes('qwen2.5-coder')) {
          return 'qwen2.5-coder';
        }
        break;
      
      case AIRequestType.NATURAL_LANGUAGE:
        // Prefer general-purpose models
        if (supportedModels.includes('qwen2.5-coder')) {
          return 'qwen2.5-coder';
        }
        break;
    }
    
    return this.config.defaultModel || 'deepseek-coder';
  }

  private calculateMaxTokens(request: AIRequest): number {
    const payload = request.payload as any;
    const inputText = payload.code || payload.prompt || payload.message || '';
    const estimatedInputTokens = TokenUtils.estimateTokenCount(inputText);
    
    // Reserve tokens for response based on request type
    switch (request.type) {
      case AIRequestType.CODE_COMPLETION:
        return Math.min(100, 4096 - estimatedInputTokens);
      
      case AIRequestType.NATURAL_LANGUAGE:
        return Math.min(500, 4096 - estimatedInputTokens);
      
      case AIRequestType.PREDICTIVE_ANALYSIS:
      case AIRequestType.DEBUG_ASSISTANCE:
        return Math.min(800, 4096 - estimatedInputTokens);
      
      default:
        return Math.min(400, 4096 - estimatedInputTokens);
    }
  }

  private async ensureModelAvailable(modelName: string): Promise<void> {
    try {
      // Check if model is already available
      const availableModels = await this.makeHttpRequest('/api/tags', null, 'GET');
      const modelExists = availableModels.models?.some((model: any) => model.name === modelName);
      
      if (modelExists) {
        return;
      }

      this.logger.info('Model not found locally, attempting to pull', { 
        model: modelName 
      });

      // Attempt to pull the model
      await this.pullModel(modelName);

    } catch (error) {
      throw new AIError(
        `Model ${modelName} is not available and could not be pulled: ${error instanceof Error ? error.message : String(error)}`,
        AIErrorCode.MODEL_UNAVAILABLE,
        false
      );
    }
  }

  private async pullModel(modelName: string): Promise<void> {
    try {
      const pullRequest = { name: modelName };
      
      // Use longer timeout for model pulling
      const response = await this.makeHttpRequest('/api/pull', pullRequest, 'POST', this.pullTimeout);
      
      this.logger.info('Model pulled successfully', { 
        model: modelName,
        response: response.status 
      });

    } catch (error) {
      this.logger.error('Failed to pull model', {
        model: modelName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async makeHttpRequest(
    endpoint: string, 
    data: any, 
    method: 'GET' | 'POST' = 'POST',
    timeout: number = this.config.timeout
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Sherlock-Omega-IDE/1.0'
    };

    // Add custom headers
    if (this.config.auth.customHeaders) {
      Object.assign(headers, this.config.auth.customHeaders);
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    if (data && method === 'POST') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
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
      
      // Handle connection errors (Ollama not running)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        throw new AIError(
          'Ollama service is not running or not accessible',
          AIErrorCode.MODEL_UNAVAILABLE,
          true
        );
      }
      
      throw error;
    }
  }

  private async createModelConfiguration(model: OllamaModelInfo): Promise<ModelConfiguration> {
    const capabilities = this.getModelCapabilities(model.name);
    const performance = this.getModelPerformance(model.name, model.size);
    
    return {
      modelId: model.name,
      provider: ModelProvider.OLLAMA,
      capabilities,
      costPerToken: 0, // Local processing is free
      maxTokens: this.getModelMaxTokens(model.name),
      responseTime: performance.responseTime,
      accuracy: performance.accuracy,
      availability: 0.95 // Local models have high availability when running
    };
  }

  private getModelCapabilities(modelName: string): ModelCapability[] {
    // Determine capabilities based on model name
    if (modelName.includes('coder') || modelName.includes('code')) {
      return [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.CODE_ANALYSIS,
        ModelCapability.TEXT_GENERATION
      ];
    }
    
    if (modelName.includes('llama') || modelName.includes('qwen')) {
      return [
        ModelCapability.CODE_COMPLETION,
        ModelCapability.CODE_ANALYSIS,
        ModelCapability.TEXT_GENERATION,
        ModelCapability.NATURAL_LANGUAGE
      ];
    }
    
    return [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.NATURAL_LANGUAGE
    ];
  }

  private getModelPerformance(modelName: string, size: number): {
    responseTime: number;
    accuracy: number;
  } {
    // Estimate performance based on model characteristics
    let baseResponseTime = 500;
    let baseAccuracy = 0.75;
    
    // Adjust based on model size (larger models are slower but more accurate)
    const sizeGB = size / (1024 * 1024 * 1024);
    if (sizeGB > 10) {
      baseResponseTime += 300;
      baseAccuracy += 0.1;
    } else if (sizeGB > 5) {
      baseResponseTime += 150;
      baseAccuracy += 0.05;
    }
    
    // Adjust based on model type
    if (modelName.includes('deepseek-coder')) {
      baseAccuracy += 0.05; // DeepSeek Coder is particularly good
    }
    
    if (modelName.includes('qwen2.5')) {
      baseAccuracy += 0.07; // Qwen 2.5 is very capable
      baseResponseTime += 100; // But slightly slower
    }
    
    return {
      responseTime: Math.min(baseResponseTime, 2000), // Cap at 2 seconds
      accuracy: Math.min(baseAccuracy, 0.95) // Cap at 95%
    };
  }

  private getModelMaxTokens(modelName: string): number {
    // Return max tokens based on known model limits
    if (modelName.includes('qwen2.5')) {
      return 8192;
    }
    
    if (modelName.includes('deepseek-coder')) {
      return 4096;
    }
    
    if (modelName.includes('codellama')) {
      return 4096;
    }
    
    return 2048; // Conservative default
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
        return text.trim()
          .replace(/^```[\w]*\n?/, '')
          .replace(/\n?```$/, '')
          .replace(/^Here's the completion:?\s*/i, '')
          .replace(/^The completed code is:?\s*/i, '');
      
      default:
        return text.trim();
    }
  }
}