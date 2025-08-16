/**
 * Monaco Editor Completion Provider
 * 
 * Integrates intelligent AI completion with Monaco Editor for real-time
 * code suggestions with <200ms response time targeting.
 */

import * as monaco from 'monaco-editor';
import { ContextAnalyzer, CompletionContext } from './context-analyzer';
import { CompletionRanker, RankedCompletion } from './completion-ranker';
import { ProjectAnalyzer } from './project-analyzer';
import { AIOrchestrator } from '../orchestrator';
import {
  AIRequest,
  AIRequestType,
  RequestPriority,
  PrivacyLevel,
  ProjectContext
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';
import { RequestIdGenerator } from '../utils';

/**
 * Monaco completion item with AI enhancements
 */
export interface AICompletionItem extends monaco.languages.CompletionItem {
  aiMetadata: {
    confidence: number;
    relevanceFactors: string[];
    modelUsed?: string;
    processingTime: number;
  };
}

/**
 * Completion provider configuration
 */
export interface CompletionProviderConfig {
  triggerCharacters: string[];
  maxSuggestions: number;
  minConfidence: number;
  enableAICompletion: boolean;
  enableLocalCompletion: boolean;
  responseTimeout: number;
  cacheEnabled: boolean;
}

/**
 * Completion statistics
 */
export interface CompletionStats {
  totalRequests: number;
  averageResponseTime: number;
  accuracyRate: number;
  cacheHitRate: number;
  userSatisfactionScore: number;
}

/**
 * Monaco Editor completion provider with AI integration
 */
export class MonacoCompletionProvider implements monaco.languages.CompletionItemProvider {
  private contextAnalyzer: ContextAnalyzer;
  private completionRanker: CompletionRanker;
  private projectAnalyzer: ProjectAnalyzer;
  private aiOrchestrator: AIOrchestrator;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private config: CompletionProviderConfig;
  private projectContext?: ProjectContext;
  private completionCache: Map<string, { items: AICompletionItem[]; timestamp: number }> = new Map();
  private stats: CompletionStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    accuracyRate: 0,
    cacheHitRate: 0,
    userSatisfactionScore: 0
  };

  readonly triggerCharacters: string[];

  constructor(
    contextAnalyzer: ContextAnalyzer,
    completionRanker: CompletionRanker,
    projectAnalyzer: ProjectAnalyzer,
    aiOrchestrator: AIOrchestrator,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<CompletionProviderConfig>
  ) {
    this.contextAnalyzer = contextAnalyzer;
    this.completionRanker = completionRanker;
    this.projectAnalyzer = projectAnalyzer;
    this.aiOrchestrator = aiOrchestrator;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    
    this.config = {
      triggerCharacters: ['.', '(', '[', '<', '"', "'", ' '],
      maxSuggestions: 20,
      minConfidence: 0.1,
      enableAICompletion: true,
      enableLocalCompletion: true,
      responseTimeout: 200, // Target <200ms
      cacheEnabled: true,
      ...config
    };

    this.triggerCharacters = this.config.triggerCharacters;
  }

  /**
   * Provide completion items for Monaco Editor
   */
  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionList> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      this.logger.debug('Providing completion items', {
        uri: model.uri.toString(),
        position: { line: position.lineNumber, column: position.column },
        triggerKind: context.triggerKind
      });

      // Check cancellation
      if (token.isCancellationRequested) {
        return { suggestions: [] };
      }

      // Get file path and content
      const filePath = model.uri.fsPath;
      const content = model.getValue();

      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCachedCompletions(filePath, position);
        if (cached) {
          this.stats.cacheHitRate = (this.stats.cacheHitRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
          return { suggestions: cached };
        }
      }

      // Analyze completion context
      const completionContext = await this.contextAnalyzer.analyzeCompletionContext(
        filePath,
        { line: position.lineNumber - 1, character: position.column - 1 },
        this.projectContext || await this.getProjectContext(filePath)
      );

      // Check cancellation again
      if (token.isCancellationRequested) {
        return { suggestions: [] };
      }

      // Get completion suggestions
      const suggestions = await this.getCompletionSuggestions(
        completionContext,
        context,
        token,
        position
      );

      // Cache results
      if (this.config.cacheEnabled && suggestions.length > 0) {
        this.cacheCompletions(filePath, position, suggestions);
      }

      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateStatistics(processingTime, suggestions.length);

      this.logger.debug('Completion items provided', {
        suggestionCount: suggestions.length,
        processingTime,
        cached: false
      });

      return {
        suggestions,
        incomplete: false
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Completion provision failed', {
        uri: model.uri.toString(),
        position,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      return { suggestions: [] };
    }
  }

  /**
   * Resolve additional completion item details
   */
  async resolveCompletionItem(
    item: monaco.languages.CompletionItem,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionItem> {
    try {
      const aiItem = item as AICompletionItem;
      
      // Add detailed documentation if not already present
      if (!item.documentation && aiItem.aiMetadata) {
        item.documentation = {
          value: this.generateDetailedDocumentation(aiItem),
          isTrusted: true
        };
      }

      return item;

    } catch (error) {
      this.logger.error('Completion item resolution failed', {
        label: item.label,
        error: error instanceof Error ? error.message : String(error)
      });
      return item;
    }
  }

  /**
   * Track completion acceptance for learning
   */
  trackCompletionAcceptance(
    item: AICompletionItem,
    accepted: boolean,
    context: CompletionContext
  ): void {
    try {
      // Update completion ranker preferences
      const rankedCompletion = this.convertToRankedCompletion(item);
      this.completionRanker.updateUserPreferences(rankedCompletion, accepted, context);

      // Update context analyzer usage patterns
      this.contextAnalyzer.updateUsagePatterns(
        context.currentFile,
        item.label as string,
        context.surroundingCode,
        accepted
      );

      // Update statistics
      if (accepted) {
        this.stats.userSatisfactionScore = (this.stats.userSatisfactionScore * 0.9) + (1.0 * 0.1);
      } else {
        this.stats.userSatisfactionScore = (this.stats.userSatisfactionScore * 0.9) + (0.0 * 0.1);
      }

      this.logger.debug('Completion acceptance tracked', {
        label: item.label,
        accepted,
        confidence: item.aiMetadata.confidence
      });

    } catch (error) {
      this.logger.error('Failed to track completion acceptance', {
        label: item.label,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Set project context for completions
   */
  setProjectContext(projectContext: ProjectContext): void {
    this.projectContext = projectContext;
    this.logger.debug('Project context updated', {
      projectId: projectContext.projectId,
      language: projectContext.language
    });
  }

  /**
   * Get completion statistics
   */
  getStatistics(): CompletionStats {
    return { ...this.stats };
  }

  /**
   * Clear completion cache
   */
  clearCache(): void {
    this.completionCache.clear();
    this.logger.debug('Completion cache cleared');
  }

  // Private helper methods

  private async getCompletionSuggestions(
    context: CompletionContext,
    monacoContext: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
    position?: monaco.Position
  ): Promise<AICompletionItem[]> {
    const suggestions: AICompletionItem[] = [];

    // Get local completions first (fast)
    if (this.config.enableLocalCompletion) {
      const localSuggestions = await this.getLocalCompletions(context, position);
      suggestions.push(...localSuggestions);
    }

    // Check cancellation before AI completion
    if (token.isCancellationRequested) {
      return suggestions;
    }

    // Get AI completions if enabled and context is suitable
    if (this.config.enableAICompletion && this.shouldUseAICompletion(context, monacoContext)) {
      try {
        const aiSuggestions = await this.getAICompletions(context, token, position);
        suggestions.push(...aiSuggestions);
      } catch (error) {
        this.logger.warn('AI completion failed, using local only', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Merge and deduplicate suggestions
    const mergedSuggestions = this.mergeSuggestions(suggestions);

    // Limit to max suggestions
    return mergedSuggestions.slice(0, this.config.maxSuggestions);
  }

  private async getLocalCompletions(context: CompletionContext, position?: monaco.Position): Promise<AICompletionItem[]> {
    const startTime = Date.now();
    
    try {
      // Rank available symbols
      const rankedCompletions = await this.completionRanker.rankCompletions(
        context.availableSymbols,
        context
      );

      // Convert to Monaco completion items
      const items = rankedCompletions.map(completion => 
        this.convertToMonacoItem(completion, 'local', Date.now() - startTime, position)
      );

      this.logger.debug('Local completions generated', {
        count: items.length,
        processingTime: Date.now() - startTime
      });

      return items;

    } catch (error) {
      this.logger.error('Local completion generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async getAICompletions(
    context: CompletionContext,
    token: monaco.CancellationToken,
    position?: monaco.Position
  ): Promise<AICompletionItem[]> {
    const startTime = Date.now();

    try {
      // Create AI request
      const aiRequest: AIRequest = {
        id: RequestIdGenerator.generate(),
        type: AIRequestType.CODE_COMPLETION,
        context: this.projectContext!,
        payload: {
          code: this.extractCodeForAI(context),
          context: context.surroundingCode,
          completionType: context.completionType,
          expectedType: context.expectedType
        },
        priority: RequestPriority.HIGH,
        privacyLevel: this.projectContext?.userPreferences.privacyLevel || PrivacyLevel.INTERNAL,
        timestamp: new Date()
      };

      // Process with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI completion timeout')), this.config.responseTimeout);
      });

      const aiResponse = await Promise.race([
        this.aiOrchestrator.processRequest(aiRequest),
        timeoutPromise
      ]);

      // Check cancellation
      if (token.isCancellationRequested) {
        return [];
      }

      // Parse AI response into completion items
      const items = this.parseAIResponse(aiResponse, Date.now() - startTime, position);

      this.logger.debug('AI completions generated', {
        count: items.length,
        processingTime: Date.now() - startTime,
        modelUsed: aiResponse.modelUsed,
        confidence: aiResponse.confidence
      });

      return items;

    } catch (error) {
      this.logger.warn('AI completion failed', {
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime
      });
      return [];
    }
  }

  private shouldUseAICompletion(
    context: CompletionContext,
    monacoContext: monaco.languages.CompletionContext
  ): boolean {
    // Don't use AI for simple cases that local completion handles well
    if (context.completionType === 'member_access' && context.availableSymbols.length > 5) {
      return false;
    }

    // Use AI for complex cases
    if (context.completionType === 'generic_expression' || 
        context.completionType === 'variable_declaration') {
      return true;
    }

    // Use AI when local completions are insufficient
    return context.availableSymbols.length < 3;
  }

  private extractCodeForAI(context: CompletionContext): string {
    // Extract relevant code context for AI processing
    const lines = context.surroundingCode.split('\n');
    const cursorLine = context.cursorPosition.line;
    
    // Get current line up to cursor
    const currentLine = lines[cursorLine] || '';
    const beforeCursor = currentLine.substring(0, context.cursorPosition.character);
    
    return beforeCursor;
  }

  private parseAIResponse(aiResponse: any, processingTime: number, position?: monaco.Position): AICompletionItem[] {
    try {
      const result = aiResponse.result as string;
      if (!result || result.trim().length === 0) {
        return [];
      }

      // Simple parsing - in production would be more sophisticated
      const suggestions = result.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Limit AI suggestions

      return suggestions.map((suggestion, index) => ({
        label: suggestion,
        kind: monaco.languages.CompletionItemKind.Text,
        insertText: suggestion,
        detail: `AI suggestion (${aiResponse.modelUsed})`,
        documentation: `Generated by AI with ${(aiResponse.confidence * 100).toFixed(1)}% confidence`,
        sortText: `ai_${index.toString().padStart(3, '0')}`,
        range: position ? new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ) : new monaco.Range(1, 1, 1, 1),
        aiMetadata: {
          confidence: aiResponse.confidence,
          relevanceFactors: ['ai_generated'],
          modelUsed: aiResponse.modelUsed,
          processingTime
        }
      }));

    } catch (error) {
      this.logger.error('Failed to parse AI response', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private convertToMonacoItem(
    completion: RankedCompletion,
    source: string,
    processingTime: number,
    position?: monaco.Position
  ): AICompletionItem {
    return {
      label: completion.displayText,
      kind: this.getMonacoCompletionKind(completion.symbol.kind),
      insertText: completion.insertText,
      detail: completion.symbol.type,
      documentation: completion.documentation,
      sortText: completion.sortText,
      filterText: completion.filterText,
      range: position ? new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ) : new monaco.Range(1, 1, 1, 1),
      aiMetadata: {
        confidence: completion.confidence,
        relevanceFactors: completion.relevanceFactors.map(f => f.type),
        processingTime
      }
    };
  }

  private getMonacoCompletionKind(symbolKind: string): monaco.languages.CompletionItemKind {
    switch (symbolKind) {
      case 'function':
        return monaco.languages.CompletionItemKind.Function;
      case 'variable':
        return monaco.languages.CompletionItemKind.Variable;
      case 'class':
        return monaco.languages.CompletionItemKind.Class;
      case 'interface':
        return monaco.languages.CompletionItemKind.Interface;
      case 'enum':
        return monaco.languages.CompletionItemKind.Enum;
      case 'property':
        return monaco.languages.CompletionItemKind.Property;
      case 'method':
        return monaco.languages.CompletionItemKind.Method;
      case 'constant':
        return monaco.languages.CompletionItemKind.Constant;
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  }

  private mergeSuggestions(suggestions: AICompletionItem[]): AICompletionItem[] {
    // Remove duplicates based on label
    const seen = new Set<string>();
    const merged: AICompletionItem[] = [];

    for (const suggestion of suggestions) {
      const key = suggestion.label as string;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(suggestion);
      }
    }

    // Sort by confidence and relevance
    return merged.sort((a, b) => {
      const aScore = a.aiMetadata.confidence;
      const bScore = b.aiMetadata.confidence;
      return bScore - aScore;
    });
  }

  private getCachedCompletions(
    filePath: string,
    position: monaco.Position
  ): AICompletionItem[] | null {
    const key = `${filePath}:${position.lineNumber}:${position.column}`;
    const cached = this.completionCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
      return cached.items;
    }
    
    return null;
  }

  private cacheCompletions(
    filePath: string,
    position: monaco.Position,
    items: AICompletionItem[]
  ): void {
    const key = `${filePath}:${position.lineNumber}:${position.column}`;
    this.completionCache.set(key, {
      items,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.completionCache.size > 100) {
      const oldestKey = this.completionCache.keys().next().value;
      if (oldestKey) {
        this.completionCache.delete(oldestKey);
      }
    }
  }

  private async getProjectContext(filePath: string): Promise<ProjectContext> {
    if (!this.projectContext) {
      // Extract project path from file path
      const projectPath = this.extractProjectPath(filePath);
      const analysis = await this.projectAnalyzer.analyzeProject(projectPath);
      
      this.projectContext = {
        projectId: projectPath,
        language: 'typescript', // Would be detected
        dependencies: [],
        architecture: 'unknown' as any,
        codeMetrics: {
          linesOfCode: analysis.metrics.totalLines,
          complexity: analysis.metrics.averageComplexity,
          testCoverage: analysis.metrics.testCoverage,
          technicalDebt: analysis.metrics.technicalDebt.totalMinutes / 60, // Convert to hours
          maintainabilityIndex: Math.max(0, 100 - analysis.metrics.averageComplexity * 10)
        },
        userPreferences: {
          codingStyle: {
            indentation: 'spaces',
            indentSize: 2,
            lineLength: 100,
            namingConvention: 'camelCase',
            bracketStyle: 'same-line'
          },
          preferredPatterns: [],
          completionSettings: {
            enabled: true,
            triggerCharacters: this.config.triggerCharacters,
            maxSuggestions: this.config.maxSuggestions,
            minConfidence: this.config.minConfidence,
            showDocumentation: true
          },
          privacyLevel: PrivacyLevel.INTERNAL,
          modelPreferences: {
            preferredProviders: ['openai', 'ollama'],
            fallbackStrategy: 'most_accurate',
            maxCostPerRequest: 0.01,
            localOnly: false
          }
        }
      };
    }
    
    return this.projectContext!;
  }

  private extractProjectPath(filePath: string): string {
    // Simple project path extraction - would be more sophisticated
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/');
  }

  private generateDetailedDocumentation(item: AICompletionItem): string {
    let doc = `**${item.label}**\n\n`;
    
    if (item.detail) {
      doc += `*Type:* ${item.detail}\n\n`;
    }
    
    doc += `*Confidence:* ${(item.aiMetadata.confidence * 100).toFixed(1)}%\n`;
    doc += `*Processing Time:* ${item.aiMetadata.processingTime}ms\n`;
    
    if (item.aiMetadata.modelUsed) {
      doc += `*Model:* ${item.aiMetadata.modelUsed}\n`;
    }
    
    return doc;
  }

  private convertToRankedCompletion(item: AICompletionItem): any {
    // Convert Monaco item back to RankedCompletion for preference tracking
    return {
      symbol: {
        name: item.label as string,
        confidence: item.aiMetadata.confidence
      },
      score: item.aiMetadata.confidence,
      confidence: item.aiMetadata.confidence,
      relevanceFactors: item.aiMetadata.relevanceFactors.map(type => ({ type }))
    };
  }

  private updateStatistics(processingTime: number, suggestionCount: number): void {
    // Update average response time
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + processingTime) / 
      this.stats.totalRequests;

    // Update accuracy rate (simplified)
    if (suggestionCount > 0) {
      this.stats.accuracyRate = (this.stats.accuracyRate * 0.95) + (0.9 * 0.05);
    }

    // Record performance metrics
    this.performanceMonitor.recordMetric('completion_response_time', processingTime, MetricType.RESPONSE_TIME);
    this.performanceMonitor.recordMetric('completion_suggestion_count', suggestionCount, MetricType.EXECUTION_TIME);
  }
}