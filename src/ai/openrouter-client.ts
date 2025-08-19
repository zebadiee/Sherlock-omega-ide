// src/ai/openrouter-client.ts - Practical OpenRouter integration
import fetch from 'node-fetch';

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenRouterClient {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], model?: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/elena-vasquez/sherlock-omega-ide',
          'X-Title': 'Sherlock Ω IDE'
        },
        body: JSON.stringify({
          model: model || this.config.defaultModel,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterResponse;
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenRouter request failed:', error);
      throw new Error(`Failed to get AI response: ${error}`);
    }
  }

  async analyzeCode(code: string, task: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert TypeScript/JavaScript developer helping with code analysis and optimization. Provide practical, actionable suggestions.'
      },
      {
        role: 'user',
        content: `Task: ${task}\n\nCode to analyze:\n\`\`\`typescript\n${code}\n\`\`\`\n\nPlease provide specific improvements, optimizations, or fixes.`
      }
    ];

    return this.chat(messages);
  }

  async fixTypeScriptErrors(code: string, errors: string[]): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a TypeScript expert. Fix the provided TypeScript errors with minimal changes to preserve functionality.'
      },
      {
        role: 'user',
        content: `Fix these TypeScript errors:\n\n${errors.join('\n')}\n\nCode:\n\`\`\`typescript\n${code}\n\`\`\`\n\nReturn only the corrected code.`
      }
    ];

    return this.chat(messages);
  }

  async optimizeQuantumCode(code: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a quantum computing expert specializing in quantum algorithm optimization and error correction. Focus on practical improvements.'
      },
      {
        role: 'user',
        content: `Optimize this quantum code for better performance and accuracy:\n\n\`\`\`typescript\n${code}\n\`\`\`\n\nFocus on:\n1. Algorithm efficiency\n2. Error reduction\n3. Memory optimization\n4. Quantum advantage maximization`
      }
    ];

    return this.chat(messages, 'anthropic/claude-3.5-sonnet');
  }

  async generateTests(code: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a testing expert. Generate comprehensive Jest tests with high coverage.'
      },
      {
        role: 'user',
        content: `Generate Jest tests for this code:\n\n\`\`\`typescript\n${code}\n\`\`\`\n\nInclude:\n1. Unit tests for all functions\n2. Edge cases\n3. Error handling\n4. Performance tests`
      }
    ];

    return this.chat(messages);
  }
}