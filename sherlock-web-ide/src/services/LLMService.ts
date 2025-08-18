/**
 * LLM Service for Sherlock Web IDE
 * Provides language model integration capabilities
 */

export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('LLM API key not configured');
    }

    // Mock implementation for now
    return {
      text: `Generated response for: ${request.prompt}`,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      }
    };
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export default LLMService;