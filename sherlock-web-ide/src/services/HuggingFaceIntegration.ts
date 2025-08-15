/**
 * Hugging Face Integration Service
 * Provides access to thousands of open-source LLMs via HF Inference API and local models
 */

export interface HuggingFaceModel {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  pipeline_tag: string;
  downloads: number;
  likes: number;
  library_name?: string;
  license?: string;
  model_size?: string;
  precision?: string;
  architecture?: string;
  languages?: string[];
  capabilities: ModelCapability[];
  isLocal?: boolean;
  localEndpoint?: string;
}

export interface ModelCapability {
  type: 'text-generation' | 'code-generation' | 'chat' | 'embeddings' | 'classification' | 'summarization';
  strength: number; // 0-1
  specialization?: string;
}

export interface HuggingFaceProvider {
  id: string;
  name: string;
  type: 'huggingface-api' | 'local-llama-cpp' | 'local-ollama' | 'local-lm-studio' | 'groq' | 'together-ai';
  apiKey?: string;
  baseUrl?: string;
  models: HuggingFaceModel[];
  isAvailable: boolean;
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
}

export interface HuggingFaceRequest {
  provider: string;
  model: string;
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    do_sample?: boolean;
    return_full_text?: boolean;
    stop?: string[];
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

export interface HuggingFaceResponse {
  id: string;
  provider: string;
  model: string;
  generated_text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: any;
}

class HuggingFaceService {
  private providers: Map<string, HuggingFaceProvider> = new Map();
  private modelCache: Map<string, HuggingFaceModel[]> = new Map();
  private popularModels: HuggingFaceModel[] = [];

  constructor() {
    this.initializeProviders();
    this.loadPopularModels();
  }

  private initializeProviders() {
    // Hugging Face Inference API
    this.providers.set('huggingface-api', {
      id: 'huggingface-api',
      name: 'Hugging Face Inference API',
      type: 'huggingface-api',
      models: [],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 1000,
        tokensPerMinute: 100000
      }
    });

    // Local llama.cpp
    this.providers.set('local-llama-cpp', {
      id: 'local-llama-cpp',
      name: 'Local llama.cpp Server',
      type: 'local-llama-cpp',
      baseUrl: 'http://localhost:8080',
      models: [],
      isAvailable: false
    });

    // Local Ollama
    this.providers.set('local-ollama', {
      id: 'local-ollama',
      name: 'Local Ollama',
      type: 'local-ollama',
      baseUrl: 'http://localhost:11434',
      models: [],
      isAvailable: false
    });

    // Local LM Studio
    this.providers.set('local-lm-studio', {
      id: 'local-lm-studio',
      name: 'Local LM Studio',
      type: 'local-lm-studio',
      baseUrl: 'http://localhost:1234',
      models: [],
      isAvailable: false
    });

    // Groq (Fast inference)
    this.providers.set('groq', {
      id: 'groq',
      name: 'Groq (Fast Inference)',
      type: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: [],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 30,
        tokensPerMinute: 6000
      }
    });

    // Together AI
    this.providers.set('together-ai', {
      id: 'together-ai',
      name: 'Together AI',
      type: 'together-ai',
      baseUrl: 'https://api.together.xyz',
      models: [],
      isAvailable: false,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 20000
      }
    });
  }

  private loadPopularModels() {
    // Curated list of popular models for different tasks
    this.popularModels = [
      // Code Generation Models
      {
        id: 'deepseek-ai/deepseek-coder-33b-instruct',
        name: 'DeepSeek Coder 33B Instruct',
        author: 'deepseek-ai',
        description: 'State-of-the-art code generation model with 33B parameters',
        tags: ['code', 'instruct', 'deepseek'],
        pipeline_tag: 'text-generation',
        downloads: 50000,
        likes: 1200,
        library_name: 'transformers',
        license: 'deepseek',
        model_size: '33B',
        architecture: 'DeepSeek',
        languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'rust'],
        capabilities: [
          { type: 'code-generation', strength: 0.95, specialization: 'multi-language' },
          { type: 'text-generation', strength: 0.88 },
          { type: 'chat', strength: 0.85 }
        ]
      },
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen2.5 Coder 32B Instruct',
        author: 'Qwen',
        description: 'Advanced coding model from Alibaba with excellent reasoning',
        tags: ['qwen', 'code', 'instruct'],
        pipeline_tag: 'text-generation',
        downloads: 45000,
        likes: 980,
        library_name: 'transformers',
        license: 'apache-2.0',
        model_size: '32B',
        architecture: 'Qwen',
        languages: ['python', 'javascript', 'typescript', 'java', 'go', 'rust'],
        capabilities: [
          { type: 'code-generation', strength: 0.93, specialization: 'reasoning' },
          { type: 'text-generation', strength: 0.90 },
          { type: 'chat', strength: 0.87 }
        ]
      },
      {
        id: 'meta-llama/CodeLlama-34b-Instruct-hf',
        name: 'Code Llama 34B Instruct',
        author: 'meta-llama',
        description: 'Meta\'s specialized code generation model',
        tags: ['llama', 'code', 'meta'],
        pipeline_tag: 'text-generation',
        downloads: 80000,
        likes: 1500,
        library_name: 'transformers',
        license: 'llama2',
        model_size: '34B',
        architecture: 'Llama',
        languages: ['python', 'javascript', 'typescript', 'java', 'cpp'],
        capabilities: [
          { type: 'code-generation', strength: 0.91, specialization: 'completion' },
          { type: 'text-generation', strength: 0.85 }
        ]
      },
      // Chat Models
      {
        id: 'microsoft/DialoGPT-large',
        name: 'DialoGPT Large',
        author: 'microsoft',
        description: 'Conversational AI model optimized for dialogue',
        tags: ['chat', 'dialogue', 'microsoft'],
        pipeline_tag: 'text-generation',
        downloads: 120000,
        likes: 2000,
        library_name: 'transformers',
        license: 'mit',
        model_size: '774M',
        architecture: 'GPT',
        capabilities: [
          { type: 'chat', strength: 0.88, specialization: 'conversation' },
          { type: 'text-generation', strength: 0.82 }
        ]
      },
      // Embedding Models
      {
        id: 'sentence-transformers/all-MiniLM-L6-v2',
        name: 'All MiniLM L6 v2',
        author: 'sentence-transformers',
        description: 'Fast and efficient sentence embeddings',
        tags: ['embeddings', 'sentence-transformers'],
        pipeline_tag: 'feature-extraction',
        downloads: 200000,
        likes: 3000,
        library_name: 'sentence-transformers',
        license: 'apache-2.0',
        model_size: '22M',
        architecture: 'BERT',
        capabilities: [
          { type: 'embeddings', strength: 0.85, specialization: 'semantic-search' }
        ]
      },
      // Specialized Models
      {
        id: 'bigcode/starcoder2-15b',
        name: 'StarCoder2 15B',
        author: 'bigcode',
        description: 'Next-generation code model trained on diverse programming languages',
        tags: ['code', 'starcoder', 'bigcode'],
        pipeline_tag: 'text-generation',
        downloads: 35000,
        likes: 800,
        library_name: 'transformers',
        license: 'bigcode-openrail-m',
        model_size: '15B',
        architecture: 'StarCoder',
        languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'rust', 'go'],
        capabilities: [
          { type: 'code-generation', strength: 0.89, specialization: 'multi-language' },
          { type: 'text-generation', strength: 0.78 }
        ]
      }
    ];
  }

  async searchModels(query: string, filters?: {
    pipeline_tag?: string;
    library?: string;
    language?: string;
    license?: string;
    sort?: 'downloads' | 'likes' | 'recent';
    limit?: number;
  }): Promise<HuggingFaceModel[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (filters?.pipeline_tag) params.append('pipeline_tag', filters.pipeline_tag);
      if (filters?.library) params.append('library', filters.library);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`https://huggingface.co/api/models?${params}`);
      const models = await response.json();

      return models.map((model: any) => this.transformHFModelToInternal(model));
    } catch (error) {
      console.warn('Failed to search HF models, using popular models:', error);
      return this.getPopularModels(filters);
    }
  }

  private transformHFModelToInternal(hfModel: any): HuggingFaceModel {
    return {
      id: hfModel.id || hfModel.modelId,
      name: hfModel.id?.split('/')[1] || hfModel.modelId,
      author: hfModel.id?.split('/')[0] || 'unknown',
      description: hfModel.description || '',
      tags: hfModel.tags || [],
      pipeline_tag: hfModel.pipeline_tag || 'text-generation',
      downloads: hfModel.downloads || 0,
      likes: hfModel.likes || 0,
      library_name: hfModel.library_name,
      license: hfModel.cardData?.license,
      capabilities: this.inferCapabilities(hfModel)
    };
  }

  private inferCapabilities(hfModel: any): ModelCapability[] {
    const capabilities: ModelCapability[] = [];
    const tags = hfModel.tags || [];
    const pipelineTag = hfModel.pipeline_tag;

    // Infer capabilities from tags and pipeline
    if (pipelineTag === 'text-generation' || tags.includes('text-generation')) {
      capabilities.push({ type: 'text-generation', strength: 0.8 });
    }

    if (tags.some((tag: string) => ['code', 'coding', 'programming'].includes(tag.toLowerCase()))) {
      capabilities.push({ type: 'code-generation', strength: 0.85 });
    }

    if (tags.some((tag: string) => ['chat', 'conversational', 'dialogue'].includes(tag.toLowerCase()))) {
      capabilities.push({ type: 'chat', strength: 0.8 });
    }

    if (pipelineTag === 'feature-extraction' || tags.includes('embeddings')) {
      capabilities.push({ type: 'embeddings', strength: 0.85 });
    }

    if (tags.some((tag: string) => ['summarization', 'summary'].includes(tag.toLowerCase()))) {
      capabilities.push({ type: 'summarization', strength: 0.8 });
    }

    return capabilities.length > 0 ? capabilities : [{ type: 'text-generation', strength: 0.7 }];
  }

  getPopularModels(filters?: any): HuggingFaceModel[] {
    let models = [...this.popularModels];

    if (filters?.pipeline_tag) {
      models = models.filter(m => m.pipeline_tag === filters.pipeline_tag);
    }

    if (filters?.language) {
      models = models.filter(m => 
        m.languages?.includes(filters.language) || 
        m.capabilities.some(c => c.specialization?.includes(filters.language))
      );
    }

    if (filters?.limit) {
      models = models.slice(0, filters.limit);
    }

    return models;
  }

  async sendRequest(request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not found`);
    }

    switch (provider.type) {
      case 'huggingface-api':
        return this.sendHuggingFaceAPIRequest(provider, request);
      case 'local-llama-cpp':
        return this.sendLlamaCppRequest(provider, request);
      case 'local-ollama':
        return this.sendOllamaRequest(provider, request);
      case 'local-lm-studio':
        return this.sendLMStudioRequest(provider, request);
      case 'groq':
        return this.sendGroqRequest(provider, request);
      case 'together-ai':
        return this.sendTogetherAIRequest(provider, request);
      default:
        throw new Error(`Provider type ${provider.type} not supported`);
    }
  }

  private async sendHuggingFaceAPIRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${request.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.inputs,
        parameters: request.parameters,
        options: request.options
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'huggingface-api',
      model: request.model,
      generated_text: Array.isArray(data) ? data[0]?.generated_text : data.generated_text,
      metadata: data
    };
  }

  private async sendLlamaCppRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`${provider.baseUrl}/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.inputs,
        n_predict: request.parameters?.max_new_tokens || 512,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        top_k: request.parameters?.top_k || 40,
        repeat_penalty: request.parameters?.repetition_penalty || 1.1,
        stop: request.parameters?.stop || []
      })
    });

    if (!response.ok) {
      throw new Error(`llama.cpp error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'local-llama-cpp',
      model: request.model,
      generated_text: data.content,
      usage: {
        prompt_tokens: data.tokens_evaluated || 0,
        completion_tokens: data.tokens_predicted || 0,
        total_tokens: (data.tokens_evaluated || 0) + (data.tokens_predicted || 0)
      }
    };
  }

  private async sendOllamaRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`${provider.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.inputs,
        stream: false,
        options: {
          temperature: request.parameters?.temperature || 0.7,
          top_p: request.parameters?.top_p || 0.9,
          top_k: request.parameters?.top_k || 40,
          repeat_penalty: request.parameters?.repetition_penalty || 1.1,
          num_predict: request.parameters?.max_new_tokens || 512
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'local-ollama',
      model: request.model,
      generated_text: data.response
    };
  }

  private async sendLMStudioRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`${provider.baseUrl}/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.inputs,
        max_tokens: request.parameters?.max_new_tokens || 512,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        stop: request.parameters?.stop || []
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      provider: 'local-lm-studio',
      model: request.model,
      generated_text: data.choices[0].text,
      usage: data.usage
    };
  }

  private async sendGroqRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: 'user', content: request.inputs }],
        max_tokens: request.parameters?.max_new_tokens || 512,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        stop: request.parameters?.stop
      })
    });

    if (!response.ok) {
      throw new Error(`Groq error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      provider: 'groq',
      model: request.model,
      generated_text: data.choices[0].message.content,
      usage: data.usage
    };
  }

  private async sendTogetherAIRequest(provider: HuggingFaceProvider, request: HuggingFaceRequest): Promise<HuggingFaceResponse> {
    const response = await fetch(`${provider.baseUrl}/inference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.inputs,
        max_tokens: request.parameters?.max_new_tokens || 512,
        temperature: request.parameters?.temperature || 0.7,
        top_p: request.parameters?.top_p || 0.9,
        top_k: request.parameters?.top_k || 40,
        repetition_penalty: request.parameters?.repetition_penalty || 1.1,
        stop: request.parameters?.stop
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: Date.now().toString(),
      provider: 'together-ai',
      model: request.model,
      generated_text: data.output.choices[0].text,
      usage: data.output.usage
    };
  }

  // Provider management
  getProviders(): HuggingFaceProvider[] {
    return Array.from(this.providers.values());
  }

  async configureProvider(providerId: string, config: Partial<HuggingFaceProvider>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    Object.assign(provider, config);
    provider.isAvailable = await this.checkProviderAvailability(providerId);
  }

  async checkProviderAvailability(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      switch (provider.type) {
        case 'huggingface-api':
          return !!provider.apiKey;
        case 'local-llama-cpp':
        case 'local-ollama':
        case 'local-lm-studio':
          const response = await fetch(`${provider.baseUrl}/health`).catch(() => null);
          return response?.ok || false;
        case 'groq':
        case 'together-ai':
          return !!provider.apiKey;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // Specialized methods for Sherlock observers
  async generateCode(prompt: string, language: string, model?: string): Promise<string> {
    const codeModels = this.popularModels.filter(m => 
      m.capabilities.some(c => c.type === 'code-generation')
    );
    
    const selectedModel = model || codeModels[0]?.id || 'deepseek-ai/deepseek-coder-33b-instruct';
    
    const response = await this.sendRequest({
      provider: 'huggingface-api',
      model: selectedModel,
      inputs: `Generate ${language} code for: ${prompt}`,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.2,
        do_sample: true
      }
    });

    return response.generated_text;
  }

  async explainCode(code: string, language: string): Promise<string> {
    const response = await this.sendRequest({
      provider: 'huggingface-api',
      model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      inputs: `Explain this ${language} code:\n\n${code}`,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.3
      }
    });

    return response.generated_text;
  }

  async optimizeCode(code: string, language: string): Promise<string> {
    const response = await this.sendRequest({
      provider: 'huggingface-api',
      model: 'deepseek-ai/deepseek-coder-33b-instruct',
      inputs: `Optimize this ${language} code for better performance and readability:\n\n${code}`,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.1
      }
    });

    return response.generated_text;
  }
}

export const huggingFaceService = new HuggingFaceService();
export default HuggingFaceService;