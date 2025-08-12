/**
 * Enhanced Thought Completion with AI Integration
 * Combines local intelligence with GPT-4/Claude for sophisticated completions
 */

import { ThoughtCompletion, CompletionContext, CompletionSuggestion, CompletionType } from './ThoughtCompletion';
import { AIProviderManager, AIRequest, AICapability } from '../ai/AIProvider';
import { PerformanceAnalytics } from '../analytics/PerformanceAnalytics';
import { DeveloperIntent } from '../types/core';

export interface EnhancedCompletionConfig {
  useAI: boolean;
  aiProvider: 'openai' | 'anthropic' | 'auto';
  fallbackToLocal: boolean;
  confidenceThreshold: number;
  maxAIRequests: number;
  aiTimeout: number;
  hybridMode: boolean; // Combine AI and local suggestions
}

export interface AICompletionSuggestion extends CompletionSuggestion {
  source: 'local' | 'ai' | 'hybrid';
  aiModel?: string;
  reasoning?: string;
  alternatives?: string[];
  cost?: number;
}

/**
 * Enhanced Thought Completion with AI Integration
 */
export class EnhancedThoughtCompletion extends ThoughtCompletion {
  private aiProvider: AIProviderManager;
  private analytics: PerformanceAnalytics;
  private config: EnhancedCompletionConfig;
  private aiRequestCount: number = 0;

  constructor(
    frictionProtocol: any,
    aiProvider: AIProviderManager,
    analytics: PerformanceAnalytics,
    config: EnhancedCompletionConfig
  ) {
    super(frictionProtocol);
    this.aiProvider = aiProvider;
    this.analytics = analytics;
    this.config = config;
  }

  /**
   * Enhanced thought completion with AI integration
   */
  async completeThought(
    context: CompletionContext,
    intent?: DeveloperIntent
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get local suggestions first
      const localResult = await super.completeThought(context, intent);
      
      // Enhance with AI if enabled and conditions are met
      let aiSuggestions: AICompletionSuggestion[] = [];
      
      if (this.shouldUseAI(context, localResult)) {
        aiSuggestions = await this.getAISuggestions(context, intent, localResult);
      }

      // Combine and rank suggestions
      const enhancedSuggestions = this.combineAndRankSuggestions(
        localResult.suggestions,
        aiSuggestions
      );

      const result = {
        ...localResult,
        suggestions: enhancedSuggestions,
        aiEnhanced: aiSuggestions.length > 0,
        aiSuggestionsCount: aiSuggestions.length,
        hybridMode: this.config.hybridMode
      };

      // Record analytics
      this.recordCompletionAnalytics(context, result, Date.now() - startTime);

      return result;

    } catch (error) {
      console.error('Enhanced thought completion failed:', error);
      
      // Fallback to local completion
      if (this.config.fallbackToLocal) {
        return super.completeThought(context, intent);
      }
      
      throw error;
    }
  }

  /**
   * Get AI-powered suggestions
   */
  private async getAISuggestions(
    context: CompletionContext,
    intent?: DeveloperIntent,
    localResult?: any
  ): Promise<AICompletionSuggestion[]> {
    const suggestions: AICompletionSuggestion[] = [];
    
    // Determine which AI capabilities to use
    const capabilities = this.determineAICapabilities(context, intent);
    
    // Create AI requests for each capability
    const aiRequests = capabilities.map(capability => 
      this.createAIRequest(capability, context, intent, localResult)
    );

    // Execute AI requests with timeout and rate limiting
    const aiResponses = await Promise.allSettled(
      aiRequests.map(request => 
        Promise.race([
          this.aiProvider.complete(request),
          this.createTimeoutPromise(this.config.aiTimeout)
        ])
      )
    );

    // Process AI responses
    for (let i = 0; i < aiResponses.length; i++) {
      const response = aiResponses[i];
      
      if (response.status === 'fulfilled' && response.value) {
        const aiSuggestion = this.convertAIResponseToSuggestion(
          response.value,
          capabilities[i],
          context
        );
        
        if (aiSuggestion && aiSuggestion.confidence >= this.config.confidenceThreshold) {
          suggestions.push(aiSuggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * Determine which AI capabilities to use based on context
   */
  private determineAICapabilities(context: CompletionContext, intent?: DeveloperIntent): AICapability[] {
    const capabilities: AICapability[] = [];
    
    // Always try code completion
    capabilities.push(AICapability.CODE_COMPLETION);
    
    // Add capabilities based on context
    if (context.content.includes('TODO') || context.content.includes('FIXME')) {
      capabilities.push(AICapability.CODE_EXPLANATION);
    }
    
    if (context.filePath.includes('test') || context.filePath.includes('spec')) {
      capabilities.push(AICapability.TEST_GENERATION);
    }
    
    if (intent) {
      switch (intent.primaryGoal.type) {
        case 'REFACTORING':
          capabilities.push(AICapability.REFACTORING);
          break;
        case 'DEBUGGING':
          capabilities.push(AICapability.DEBUGGING);
          break;
        case 'TESTING':
          capabilities.push(AICapability.TEST_GENERATION);
          break;
        case 'DOCUMENTATION':
          capabilities.push(AICapability.DOCUMENTATION);
          break;
        case 'OPTIMIZATION':
          capabilities.push(AICapability.PERFORMANCE_OPTIMIZATION);
          break;
      }
    }
    
    // Check for architecture-related context
    if (this.isArchitecturalContext(context)) {
      capabilities.push(AICapability.ARCHITECTURE_DESIGN);
    }
    
    return Array.from(new Set(capabilities)); // Remove duplicates
  }

  /**
   * Create AI request for a specific capability
   */
  private createAIRequest(
    capability: AICapability,
    context: CompletionContext,
    intent?: DeveloperIntent,
    localResult?: any
  ): AIRequest {
    const prompt = this.buildAIPrompt(capability, context, intent, localResult);
    
    return {
      id: this.generateId(),
      type: capability,
      context: {
        code: context.content,
        language: context.language,
        filePath: context.filePath,
        cursorPosition: context.cursorPosition,
        selectedText: context.selectedText,
        projectContext: context.projectContext
      },
      prompt,
      maxTokens: this.getMaxTokensForCapability(capability),
      temperature: this.getTemperatureForCapability(capability),
      priority: this.getPriorityForCapability(capability)
    };
  }

  /**
   * Build AI prompt for specific capability
   */
  private buildAIPrompt(
    capability: AICapability,
    context: CompletionContext,
    intent?: DeveloperIntent,
    localResult?: any
  ): string {
    const baseContext = `
File: ${context.filePath}
Language: ${context.language}
Cursor Position: Line ${context.cursorPosition.line}, Column ${context.cursorPosition.column}

Current Code:
\`\`\`${context.language}
${context.content}
\`\`\`
`;

    const intentContext = intent ? `
Developer Intent: ${intent.primaryGoal.description}
Constraints: ${intent.constraints.map(c => c.description).join(', ')}
` : '';

    const localContext = localResult ? `
Local Suggestions Available: ${localResult.suggestions.length}
Local Confidence: ${(localResult.confidence * 100).toFixed(1)}%
` : '';

    const capabilityPrompts: Partial<Record<AICapability, string>> = {
      [AICapability.CODE_COMPLETION]: `
Please provide intelligent code completion suggestions for the current cursor position.
Focus on:
- Syntactically correct and semantically meaningful completions
- Following existing code patterns and style
- Considering the broader context and architecture
- Providing multiple alternatives if appropriate

Provide your response as a JSON object with:
{
  "suggestions": [
    {
      "code": "completion code here",
      "description": "what this completion does",
      "confidence": 0.9
    }
  ],
  "reasoning": "why these suggestions are appropriate"
}`,

      [AICapability.CODE_EXPLANATION]: `
Provide clear explanations of the code.
Focus on:
- Explaining the purpose and functionality
- Identifying potential issues or improvements
- Suggesting best practices
- Helping with understanding complex logic`,

      [AICapability.REFACTORING]: `
Analyze the code and suggest refactoring improvements.
Focus on:
- Code quality and maintainability
- Design patterns and best practices
- Performance optimizations
- Reducing complexity

Provide specific, actionable refactoring suggestions.`,

      [AICapability.DEBUGGING]: `
Help identify and fix potential issues in the code.
Look for:
- Logic errors and edge cases
- Performance bottlenecks
- Security vulnerabilities
- Best practice violations

Provide debugging insights and fix suggestions.`,

      [AICapability.TEST_GENERATION]: `
Generate comprehensive test cases for the code.
Include:
- Unit tests for individual functions
- Integration tests for component interactions
- Edge cases and error conditions
- Mock data and setup code

Follow testing best practices for ${context.language}.`,

      [AICapability.DOCUMENTATION]: `
Generate clear, comprehensive documentation.
Include:
- Function/class descriptions
- Parameter and return value documentation
- Usage examples
- Implementation notes

Follow documentation standards for ${context.language}.`,

      [AICapability.ARCHITECTURE_DESIGN]: `
Provide architectural guidance and design suggestions.
Consider:
- System design patterns
- Scalability and maintainability
- Component relationships
- Best practices for ${context.language}

Suggest improvements to the overall architecture.`,

      [AICapability.PERFORMANCE_OPTIMIZATION]: `
Analyze the code for performance optimization opportunities.
Look for:
- Algorithmic improvements
- Memory usage optimization
- I/O efficiency
- Caching opportunities

Provide specific optimization suggestions with expected impact.`
    };

    return baseContext + intentContext + localContext + (capabilityPrompts[capability] || '');
  }

  /**
   * Convert AI response to completion suggestion
   */
  private convertAIResponseToSuggestion(
    aiResponse: any,
    capability: AICapability,
    context: CompletionContext
  ): AICompletionSuggestion | null {
    try {
      // Try to parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse.content);
      } catch {
        // If not JSON, treat as plain text
        parsedResponse = { suggestions: [{ code: aiResponse.content, description: 'AI suggestion', confidence: 0.8 }] };
      }

      if (parsedResponse.suggestions && parsedResponse.suggestions.length > 0) {
        const suggestion = parsedResponse.suggestions[0];
        
        return {
          id: this.generateId(),
          type: this.mapCapabilityToCompletionType(capability),
          content: suggestion.code || aiResponse.content,
          description: suggestion.description || `AI-powered ${capability.replace('_', ' ')}`,
          confidence: Math.min(0.95, suggestion.confidence || aiResponse.confidence || 0.8),
          intentAlignment: 0.9, // AI suggestions are generally well-aligned
          priority: 1,
          source: 'ai',
          aiModel: aiResponse.metadata.model,
          reasoning: parsedResponse.reasoning || aiResponse.reasoning,
          alternatives: parsedResponse.suggestions.slice(1).map((s: any) => s.code),
          cost: aiResponse.metadata.cost,
          metadata: {
            language: context.language,
            paradigm: 'ai-enhanced',
            estimatedTime: 60,
            dependencies: [],
            relatedFiles: [],
            testCoverage: 0,
            complexity: 'medium',
            riskLevel: 'low'
          }
        };
      }
    } catch (error) {
      console.error('Failed to convert AI response:', error);
    }
    
    return null;
  }

  /**
   * Combine and rank local and AI suggestions
   */
  private combineAndRankSuggestions(
    localSuggestions: CompletionSuggestion[],
    aiSuggestions: AICompletionSuggestion[]
  ): AICompletionSuggestion[] {
    // Convert local suggestions to enhanced format
    const enhancedLocalSuggestions: AICompletionSuggestion[] = localSuggestions.map(suggestion => ({
      ...suggestion,
      source: 'local' as const
    }));

    // Combine all suggestions
    const allSuggestions = [...enhancedLocalSuggestions, ...aiSuggestions];

    // Rank suggestions based on multiple factors
    return allSuggestions.sort((a, b) => {
      // Primary sort: confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) {
        return confidenceDiff;
      }

      // Secondary sort: intent alignment
      const intentDiff = b.intentAlignment - a.intentAlignment;
      if (Math.abs(intentDiff) > 0.1) {
        return intentDiff;
      }

      // Tertiary sort: prefer AI suggestions for complex tasks
      if (a.source === 'ai' && b.source === 'local') {
        return -1;
      }
      if (a.source === 'local' && b.source === 'ai') {
        return 1;
      }

      // Final sort: priority
      return a.priority - b.priority;
    });
  }

  /**
   * Determine if AI should be used for this completion
   */
  private shouldUseAI(context: CompletionContext, localResult: any): boolean {
    if (!this.config.useAI) return false;
    
    // Rate limiting
    if (this.aiRequestCount >= this.config.maxAIRequests) return false;
    
    // Use AI if local confidence is low
    if (localResult.confidence < 0.7) return true;
    
    // Use AI for complex contexts
    if (this.isComplexContext(context)) return true;
    
    // Use AI if explicitly requested through intent
    if (this.isAIRequestedByIntent(context)) return true;
    
    return false;
  }

  /**
   * Check if context is complex enough to warrant AI assistance
   */
  private isComplexContext(context: CompletionContext): boolean {
    const content = context.content;
    
    // Complex if it has multiple functions/classes
    const functionCount = (content.match(/function\s+\w+|class\s+\w+/g) || []).length;
    if (functionCount > 3) return true;
    
    // Complex if it has TODO/FIXME comments
    if (content.includes('TODO') || content.includes('FIXME')) return true;
    
    // Complex if it's a large file
    if (content.split('\n').length > 100) return true;
    
    // Complex if it has error handling
    if (content.includes('try') || content.includes('catch') || content.includes('throw')) return true;
    
    return false;
  }

  /**
   * Check if context suggests architectural decisions
   */
  private isArchitecturalContext(context: CompletionContext): boolean {
    const content = context.content.toLowerCase();
    const filePath = context.filePath.toLowerCase();
    
    return (
      filePath.includes('architecture') ||
      filePath.includes('design') ||
      content.includes('pattern') ||
      content.includes('interface') ||
      content.includes('abstract') ||
      content.includes('factory') ||
      content.includes('singleton')
    );
  }

  /**
   * Check if AI is explicitly requested by intent
   */
  private isAIRequestedByIntent(context: CompletionContext): boolean {
    // Check for AI-related comments or hints
    const content = context.content.toLowerCase();
    return (
      content.includes('ai help') ||
      content.includes('suggest') ||
      content.includes('generate') ||
      content.includes('optimize')
    );
  }

  /**
   * Map AI capability to completion type
   */
  private mapCapabilityToCompletionType(capability: AICapability): CompletionType {
    const mapping = {
      [AICapability.CODE_COMPLETION]: CompletionType.FUNCTION_IMPLEMENTATION,
      [AICapability.CODE_EXPLANATION]: CompletionType.COMMENT,
      [AICapability.REFACTORING]: CompletionType.FUNCTION_IMPLEMENTATION,
      [AICapability.DEBUGGING]: CompletionType.ERROR_HANDLING,
      [AICapability.ARCHITECTURE_DESIGN]: CompletionType.CLASS_DEFINITION,
      [AICapability.TEST_GENERATION]: CompletionType.TEST_CASE,
      [AICapability.DOCUMENTATION]: CompletionType.COMMENT,
      [AICapability.PERFORMANCE_OPTIMIZATION]: CompletionType.FUNCTION_IMPLEMENTATION
    };
    
    return mapping[capability] || CompletionType.FUNCTION_IMPLEMENTATION;
  }

  /**
   * Get max tokens for capability
   */
  private getMaxTokensForCapability(capability: AICapability): number {
    const tokenLimits = {
      [AICapability.CODE_COMPLETION]: 1000,
      [AICapability.CODE_EXPLANATION]: 500,
      [AICapability.REFACTORING]: 2000,
      [AICapability.DEBUGGING]: 1500,
      [AICapability.ARCHITECTURE_DESIGN]: 3000,
      [AICapability.TEST_GENERATION]: 2000,
      [AICapability.DOCUMENTATION]: 1000,
      [AICapability.PERFORMANCE_OPTIMIZATION]: 1500
    };
    
    return tokenLimits[capability] || 1000;
  }

  /**
   * Get temperature for capability
   */
  private getTemperatureForCapability(capability: AICapability): number {
    const temperatures = {
      [AICapability.CODE_COMPLETION]: 0.3, // More deterministic
      [AICapability.CODE_EXPLANATION]: 0.5,
      [AICapability.REFACTORING]: 0.4,
      [AICapability.DEBUGGING]: 0.2, // Very deterministic
      [AICapability.ARCHITECTURE_DESIGN]: 0.7, // More creative
      [AICapability.TEST_GENERATION]: 0.3,
      [AICapability.DOCUMENTATION]: 0.4,
      [AICapability.PERFORMANCE_OPTIMIZATION]: 0.3
    };
    
    return temperatures[capability] || 0.5;
  }

  /**
   * Get priority for capability
   */
  private getPriorityForCapability(capability: AICapability): 'low' | 'medium' | 'high' | 'critical' {
    const priorities = {
      [AICapability.CODE_COMPLETION]: 'high' as const,
      [AICapability.CODE_EXPLANATION]: 'medium' as const,
      [AICapability.REFACTORING]: 'medium' as const,
      [AICapability.DEBUGGING]: 'critical' as const,
      [AICapability.ARCHITECTURE_DESIGN]: 'high' as const,
      [AICapability.TEST_GENERATION]: 'medium' as const,
      [AICapability.DOCUMENTATION]: 'low' as const,
      [AICapability.PERFORMANCE_OPTIMIZATION]: 'high' as const
    };
    
    return priorities[capability] || 'medium';
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), timeout);
    });
  }

  /**
   * Record completion analytics
   */
  private recordCompletionAnalytics(context: CompletionContext, result: any, duration: number): void {
    if (!this.analytics) return;
    
    this.analytics.recordMetric({
      id: this.generateId(),
      name: 'enhanced_completion_time',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: {
        language: context.language,
        aiEnhanced: result.aiEnhanced,
        suggestionsCount: result.suggestions.length,
        aiSuggestionsCount: result.aiSuggestionsCount
      },
      tags: ['completion', 'ai', 'performance']
    });

    if (result.aiEnhanced && this.analytics) {
      this.analytics.recordMetric({
        id: this.generateId(),
        name: 'ai_completion_usage',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        context: {
          provider: this.config.aiProvider,
          hybridMode: this.config.hybridMode
        },
        tags: ['ai', 'usage']
      });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Get enhanced completion statistics
   */
  getEnhancedStats(): any {
    const baseStats = this.getCompletionStats();
    
    return {
      ...baseStats,
      aiRequestCount: this.aiRequestCount,
      aiEnabled: this.config.useAI,
      hybridMode: this.config.hybridMode,
      aiProvider: this.config.aiProvider,
      confidenceThreshold: this.config.confidenceThreshold
    };
  }
}