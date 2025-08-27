/**
 * SHERLOCK Ω OPENROUTER INTEGRATION
 * 
 * Connects to real AI models through OpenRouter for true autonomous development
 */

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  fallbackModels: string[];
  maxTokens: number;
  temperature: number;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  codeContext?: string;
  fileType?: string;
  task: 'chat' | 'code_generation' | 'code_review' | 'debugging' | 'explanation';
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  isCode: boolean;
  language?: string;
  filename?: string;
  confidence: number;
}

export class OpenRouterAI {
  private config: OpenRouterConfig;
  private requestCount = 0;
  private totalTokens = 0;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  /**
   * Process AI request with intelligent model selection
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const model = this.selectOptimalModel(request);
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await this.callOpenRouter(model, systemPrompt, userPrompt);
      this.requestCount++;
      this.totalTokens += response.tokens;

      return {
        content: response.content,
        model: response.model,
        tokens: response.tokens,
        isCode: this.detectCodeResponse(response.content, request),
        language: this.detectLanguage(response.content, request),
        filename: this.suggestFilename(response.content, request),
        confidence: this.calculateConfidence(response, request)
      };
    } catch (error) {
      console.error('OpenRouter request failed:', error);
      throw new Error(`AI request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Select optimal model based on request type
   */
  private selectOptimalModel(request: AIRequest): string {
    const modelMap = {
      'chat': 'anthropic/claude-3-haiku',
      'code_generation': 'anthropic/claude-3-sonnet',
      'code_review': 'openai/gpt-4-turbo',
      'debugging': 'anthropic/claude-3-sonnet',
      'explanation': 'anthropic/claude-3-haiku'
    };

    return modelMap[request.task] || this.config.defaultModel;
  }

  /**
   * Build system prompt based on task
   */
  private buildSystemPrompt(request: AIRequest): string {
    const basePrompt = `You are Sherlock Ω, an autonomous development AI assistant. You are integrated into a professional IDE and help developers build applications safely and efficiently.`;

    const taskPrompts = {
      'chat': `${basePrompt}

You are having a conversation with a developer. Be helpful, knowledgeable, and friendly. Answer questions about programming, explain concepts, and provide guidance. Do not generate code unless specifically asked.`,

      'code_generation': `${basePrompt}

You are generating production-ready code. Follow these principles:
- Write clean, well-documented code
- Include error handling and validation
- Add safety checks and input validation
- Follow best practices for the language/framework
- Include helpful comments
- Make code modular and testable

Always generate complete, working code that can be used immediately.`,

      'code_review': `${basePrompt}

You are reviewing code for quality, security, and best practices. Provide:
- Specific improvement suggestions
- Security vulnerability identification
- Performance optimization opportunities
- Code style and maintainability feedback
- Testing recommendations`,

      'debugging': `${basePrompt}

You are helping debug code issues. Analyze the problem and provide:
- Clear explanation of the issue
- Step-by-step debugging approach
- Fixed code with explanations
- Prevention strategies for similar issues`,

      'explanation': `${basePrompt}

You are explaining programming concepts. Provide:
- Clear, beginner-friendly explanations
- Practical examples
- Common use cases
- Best practices
- Related concepts to explore`
    };

    return taskPrompts[request.task] || taskPrompts['chat'];
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(request: AIRequest): string {
    let prompt = request.prompt;

    if (request.context) {
      prompt = `Context: ${request.context}\n\nRequest: ${prompt}`;
    }

    if (request.codeContext) {
      prompt = `Current code:\n\`\`\`\n${request.codeContext}\n\`\`\`\n\n${prompt}`;
    }

    if (request.fileType) {
      prompt = `File type: ${request.fileType}\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(model: string, systemPrompt: string, userPrompt: string) {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sherlock-omega-ide.dev',
        'X-Title': 'Sherlock Ω IDE'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: data.model,
      tokens: data.usage?.total_tokens || 0
    };
  }

  /**
   * Detect if response contains code
   */
  private detectCodeResponse(content: string, request: AIRequest): boolean {
    if (request.task === 'code_generation') return true;
    
    const codeIndicators = [
      '```',
      'function ',
      'class ',
      'const ',
      'let ',
      'var ',
      'import ',
      'export ',
      'return ',
      '=> {',
      'async ',
      'await '
    ];

    return codeIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Detect programming language from response
   */
  private detectLanguage(content: string, request: AIRequest): string | undefined {
    if (!this.detectCodeResponse(content, request)) return undefined;

    const langPatterns = {
      'javascript': /```(javascript|js)\n|function |const |let |var |=>/,
      'typescript': /```(typescript|ts)\n|interface |type |: string|: number/,
      'python': /```python\n|def |import |from |if __name__/,
      'java': /```java\n|public class|private |protected /,
      'html': /```html\n|<html|<div|<span|<p>/,
      'css': /```css\n|\.class|#id|\{[^}]*\}/,
      'json': /```json\n|\{[\s\S]*"[\w]+":[\s\S]*\}/
    };

    for (const [lang, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(content)) {
        return lang;
      }
    }

    return 'javascript'; // Default
  }

  /**
   * Suggest filename based on content and request
   */
  private suggestFilename(content: string, request: AIRequest): string | undefined {
    if (!this.detectCodeResponse(content, request)) return undefined;

    const language = this.detectLanguage(content, request);
    const prompt = request.prompt.toLowerCase();

    // Extract meaningful name from prompt
    let baseName = 'generated';
    
    if (prompt.includes('component')) baseName = 'Component';
    else if (prompt.includes('api') || prompt.includes('server')) baseName = 'server';
    else if (prompt.includes('test')) baseName = 'test';
    else if (prompt.includes('util')) baseName = 'utils';
    else if (prompt.includes('auth')) baseName = 'auth';
    else if (prompt.includes('user')) baseName = 'user';
    else if (prompt.includes('todo')) baseName = 'todo';

    const extensions: Record<string, string> = {
      'javascript': '.js',
      'typescript': '.ts',
      'python': '.py',
      'java': '.java',
      'html': '.html',
      'css': '.css',
      'json': '.json'
    };

    return baseName + (language && extensions[language] ? extensions[language] : '.js');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(response: any, request: AIRequest): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on response length (longer = more detailed = higher confidence)
    if (response.content.length > 500) confidence += 0.1;
    if (response.content.length > 1000) confidence += 0.05;

    // Adjust based on task type
    if (request.task === 'chat') confidence += 0.1;
    if (request.task === 'code_generation' && this.detectCodeResponse(response.content, request)) {
      confidence += 0.1;
    }

    // Adjust based on context availability
    if (request.context) confidence += 0.05;
    if (request.codeContext) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      averageTokensPerRequest: this.requestCount > 0 ? Math.round(this.totalTokens / this.requestCount) : 0
    };
  }
}

/**
 * Default OpenRouter configuration
 */
export const DEFAULT_OPENROUTER_CONFIG: Partial<OpenRouterConfig> = {
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-3-sonnet',
  fallbackModels: [
    'anthropic/claude-3-haiku',
    'openai/gpt-4-turbo',
    'openai/gpt-3.5-turbo'
  ],
  maxTokens: 4000,
  temperature: 0.7
};