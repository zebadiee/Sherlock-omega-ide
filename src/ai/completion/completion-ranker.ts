/**
 * Completion Ranker
 * 
 * Implements intelligent ranking and filtering of code completion suggestions
 * with confidence scoring algorithms targeting >90% accuracy.
 */

import {
  CompletionContext,
  CompletionType,
  SymbolInfo,
  SymbolKind,
  UsagePattern,
  SyntaxContext,
  SemanticContext
} from './context-analyzer';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';

/**
 * Completion suggestion with ranking information
 */
export interface RankedCompletion {
  symbol: SymbolInfo;
  score: number;
  confidence: number;
  relevanceFactors: RelevanceFactor[];
  insertText: string;
  displayText: string;
  documentation?: string;
  sortText: string;
  filterText: string;
}

/**
 * Factors contributing to relevance scoring
 */
export interface RelevanceFactor {
  type: FactorType;
  weight: number;
  score: number;
  description: string;
}

export enum FactorType {
  CONTEXT_MATCH = 'context_match',
  USAGE_FREQUENCY = 'usage_frequency',
  RECENCY = 'recency',
  TYPE_COMPATIBILITY = 'type_compatibility',
  SCOPE_PROXIMITY = 'scope_proximity',
  PATTERN_MATCH = 'pattern_match',
  USER_PREFERENCE = 'user_preference',
  SEMANTIC_SIMILARITY = 'semantic_similarity'
}

/**
 * Ranking configuration
 */
export interface RankingConfig {
  maxSuggestions: number;
  minConfidence: number;
  factorWeights: Record<FactorType, number>;
  enableFuzzyMatching: boolean;
  enableSemanticRanking: boolean;
  personalizedRanking: boolean;
}

/**
 * Completion ranker for intelligent suggestion ordering
 */
export class CompletionRanker {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private config: RankingConfig;
  private userPreferences: Map<string, number> = new Map();

  constructor(
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<RankingConfig>
  ) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.config = {
      maxSuggestions: 20,
      minConfidence: 0.1,
      factorWeights: {
        [FactorType.CONTEXT_MATCH]: 0.25,
        [FactorType.USAGE_FREQUENCY]: 0.20,
        [FactorType.RECENCY]: 0.15,
        [FactorType.TYPE_COMPATIBILITY]: 0.15,
        [FactorType.SCOPE_PROXIMITY]: 0.10,
        [FactorType.PATTERN_MATCH]: 0.10,
        [FactorType.USER_PREFERENCE]: 0.03,
        [FactorType.SEMANTIC_SIMILARITY]: 0.02
      },
      enableFuzzyMatching: true,
      enableSemanticRanking: true,
      personalizedRanking: true,
      ...config
    };
  }

  /**
   * Rank and filter completion suggestions
   */
  async rankCompletions(
    symbols: SymbolInfo[],
    context: CompletionContext,
    query?: string
  ): Promise<RankedCompletion[]> {
    const startTime = Date.now();

    try {
      this.logger.debug('Ranking completions', {
        symbolCount: symbols.length,
        completionType: context.completionType,
        query
      });

      // Filter symbols based on context
      const filteredSymbols = this.filterByContext(symbols, context, query);

      // Calculate relevance scores
      const scoredCompletions = await this.calculateRelevanceScores(
        filteredSymbols,
        context,
        query
      );

      // Sort by score
      scoredCompletions.sort((a, b) => b.score - a.score);

      // Apply final filtering
      const finalCompletions = this.applyFinalFiltering(scoredCompletions);

      // Limit results
      const limitedCompletions = finalCompletions.slice(0, this.config.maxSuggestions);

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('completion_ranking_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.debug('Completions ranked', {
        originalCount: symbols.length,
        filteredCount: filteredSymbols.length,
        finalCount: limitedCompletions.length,
        processingTime
      });

      return limitedCompletions;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Completion ranking failed', {
        symbolCount: symbols.length,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });
      return [];
    }
  }

  /**
   * Update user preferences based on accepted/rejected completions
   */
  updateUserPreferences(
    completion: RankedCompletion,
    accepted: boolean,
    context: CompletionContext
  ): void {
    try {
      const key = `${completion.symbol.name}:${context.completionType}`;
      const currentPreference = this.userPreferences.get(key) || 0;
      
      // Adjust preference based on acceptance
      const adjustment = accepted ? 0.1 : -0.05;
      const newPreference = Math.max(-1, Math.min(1, currentPreference + adjustment));
      
      this.userPreferences.set(key, newPreference);

      this.logger.debug('User preferences updated', {
        symbol: completion.symbol.name,
        accepted,
        newPreference
      });

    } catch (error) {
      this.logger.error('Failed to update user preferences', {
        symbol: completion.symbol.name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get completion statistics
   */
  getStatistics(): {
    totalPreferences: number;
    averageRankingTime: number;
    topSymbols: Array<{ symbol: string; preference: number }>;
  } {
    const preferences = Array.from(this.userPreferences.entries())
      .map(([symbol, preference]) => ({ symbol, preference }))
      .sort((a, b) => b.preference - a.preference);

    return {
      totalPreferences: this.userPreferences.size,
      averageRankingTime: 0, // Would be calculated from metrics
      topSymbols: preferences.slice(0, 10)
    };
  }

  // Private helper methods

  private filterByContext(
    symbols: SymbolInfo[],
    context: CompletionContext,
    query?: string
  ): SymbolInfo[] {
    return symbols.filter(symbol => {
      // Filter by completion type
      if (!this.isSymbolValidForCompletionType(symbol, context.completionType)) {
        return false;
      }

      // Filter by syntax context
      if (!this.isSymbolValidForSyntaxContext(symbol, context.syntaxContext)) {
        return false;
      }

      // Filter by query if provided
      if (query && !this.matchesQuery(symbol, query)) {
        return false;
      }

      // Filter by confidence threshold
      if (symbol.confidence < this.config.minConfidence) {
        return false;
      }

      return true;
    });
  }

  private isSymbolValidForCompletionType(
    symbol: SymbolInfo,
    completionType: CompletionType
  ): boolean {
    switch (completionType) {
      case CompletionType.MEMBER_ACCESS:
        return symbol.kind === SymbolKind.PROPERTY || 
               symbol.kind === SymbolKind.METHOD;

      case CompletionType.FUNCTION_CALL:
        return symbol.kind === SymbolKind.FUNCTION || 
               symbol.kind === SymbolKind.METHOD ||
               symbol.kind === SymbolKind.CONSTRUCTOR;

      case CompletionType.TYPE_ANNOTATION:
        return symbol.kind === SymbolKind.TYPE || 
               symbol.kind === SymbolKind.INTERFACE ||
               symbol.kind === SymbolKind.CLASS;

      case CompletionType.IMPORT_STATEMENT:
        return symbol.scope === 'global' || symbol.kind === SymbolKind.MODULE;

      case CompletionType.VARIABLE_DECLARATION:
        return symbol.kind === SymbolKind.VARIABLE ||
               symbol.kind === SymbolKind.CONSTANT ||
               symbol.kind === SymbolKind.FUNCTION;

      default:
        return true;
    }
  }

  private isSymbolValidForSyntaxContext(
    symbol: SymbolInfo,
    syntaxContext: SyntaxContext
  ): boolean {
    // Don't suggest anything in strings or comments
    if (syntaxContext.inString || syntaxContext.inComment) {
      return false;
    }

    // Context-specific filtering
    if (syntaxContext.inFunction && symbol.kind === SymbolKind.CLASS) {
      // Less likely to need class declarations inside functions
      return false;
    }

    return true;
  }

  private matchesQuery(symbol: SymbolInfo, query: string): boolean {
    if (!query) return true;

    const symbolName = symbol.name.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (symbolName === queryLower) {
      return true;
    }

    // Starts with
    if (symbolName.startsWith(queryLower)) {
      return true;
    }

    // Fuzzy matching if enabled
    if (this.config.enableFuzzyMatching) {
      return this.fuzzyMatch(symbolName, queryLower);
    }

    // Contains
    return symbolName.includes(queryLower);
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length;
  }

  private async calculateRelevanceScores(
    symbols: SymbolInfo[],
    context: CompletionContext,
    query?: string
  ): Promise<RankedCompletion[]> {
    const completions: RankedCompletion[] = [];

    for (const symbol of symbols) {
      const relevanceFactors = await this.calculateRelevanceFactors(
        symbol,
        context,
        query
      );

      const score = this.calculateOverallScore(relevanceFactors);
      const confidence = this.calculateConfidence(symbol, relevanceFactors);

      const completion: RankedCompletion = {
        symbol,
        score,
        confidence,
        relevanceFactors,
        insertText: this.generateInsertText(symbol, context),
        displayText: this.generateDisplayText(symbol),
        documentation: symbol.documentation,
        sortText: this.generateSortText(symbol, score),
        filterText: symbol.name
      };

      completions.push(completion);
    }

    return completions;
  }

  private async calculateRelevanceFactors(
    symbol: SymbolInfo,
    context: CompletionContext,
    query?: string
  ): Promise<RelevanceFactor[]> {
    const factors: RelevanceFactor[] = [];

    // Context match factor
    factors.push({
      type: FactorType.CONTEXT_MATCH,
      weight: this.config.factorWeights[FactorType.CONTEXT_MATCH],
      score: this.calculateContextMatchScore(symbol, context),
      description: 'How well the symbol matches the current context'
    });

    // Usage frequency factor
    factors.push({
      type: FactorType.USAGE_FREQUENCY,
      weight: this.config.factorWeights[FactorType.USAGE_FREQUENCY],
      score: this.calculateUsageFrequencyScore(symbol, context),
      description: 'How frequently the symbol is used'
    });

    // Recency factor
    factors.push({
      type: FactorType.RECENCY,
      weight: this.config.factorWeights[FactorType.RECENCY],
      score: this.calculateRecencyScore(symbol, context),
      description: 'How recently the symbol was used'
    });

    // Type compatibility factor
    factors.push({
      type: FactorType.TYPE_COMPATIBILITY,
      weight: this.config.factorWeights[FactorType.TYPE_COMPATIBILITY],
      score: this.calculateTypeCompatibilityScore(symbol, context),
      description: 'How well the symbol type matches expected type'
    });

    // Scope proximity factor
    factors.push({
      type: FactorType.SCOPE_PROXIMITY,
      weight: this.config.factorWeights[FactorType.SCOPE_PROXIMITY],
      score: this.calculateScopeProximityScore(symbol, context),
      description: 'How close the symbol is in scope hierarchy'
    });

    // Pattern match factor
    if (query) {
      factors.push({
        type: FactorType.PATTERN_MATCH,
        weight: this.config.factorWeights[FactorType.PATTERN_MATCH],
        score: this.calculatePatternMatchScore(symbol, query),
        description: 'How well the symbol matches the query pattern'
      });
    }

    // User preference factor
    if (this.config.personalizedRanking) {
      factors.push({
        type: FactorType.USER_PREFERENCE,
        weight: this.config.factorWeights[FactorType.USER_PREFERENCE],
        score: this.calculateUserPreferenceScore(symbol, context),
        description: 'User preference based on past interactions'
      });
    }

    return factors;
  }

  private calculateContextMatchScore(symbol: SymbolInfo, context: CompletionContext): number {
    let score = 0;

    // Base score from symbol confidence
    score += symbol.confidence * 0.5;

    // Bonus for matching completion type
    if (this.isSymbolValidForCompletionType(symbol, context.completionType)) {
      score += 0.3;
    }

    // Bonus for scope relevance
    if (symbol.scope === 'local') {
      score += 0.2;
    } else if (symbol.scope === 'global') {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private calculateUsageFrequencyScore(symbol: SymbolInfo, context: CompletionContext): number {
    const usagePattern = context.recentUsage.find(p => p.symbol === symbol.name);
    if (!usagePattern) {
      return 0.1; // Low score for unused symbols
    }

    // Normalize frequency (assuming max frequency of 100)
    return Math.min(1, usagePattern.frequency / 100);
  }

  private calculateRecencyScore(symbol: SymbolInfo, context: CompletionContext): number {
    const usagePattern = context.recentUsage.find(p => p.symbol === symbol.name);
    if (!usagePattern) {
      return 0.1;
    }

    // Calculate recency score based on last usage (within last 24 hours = 1.0)
    const hoursSinceLastUse = (Date.now() - usagePattern.lastUsed.getTime()) / (1000 * 60 * 60);
    return Math.max(0.1, Math.min(1, 1 - (hoursSinceLastUse / 24)));
  }

  private calculateTypeCompatibilityScore(symbol: SymbolInfo, context: CompletionContext): number {
    if (!context.expectedType) {
      return 0.5; // Neutral score when no type expected
    }

    // Simple type matching - would be more sophisticated in production
    if (symbol.type === context.expectedType) {
      return 1.0;
    }

    // Partial matches
    if (symbol.type.includes(context.expectedType) || 
        context.expectedType.includes(symbol.type)) {
      return 0.7;
    }

    return 0.2;
  }

  private calculateScopeProximityScore(symbol: SymbolInfo, context: CompletionContext): number {
    // Prefer local symbols over global ones
    switch (symbol.scope) {
      case 'local':
        return 1.0;
      case 'global':
        return 0.6;
      case 'imported':
        return 0.8;
      default:
        return 0.4;
    }
  }

  private calculatePatternMatchScore(symbol: SymbolInfo, query: string): number {
    const symbolName = symbol.name.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (symbolName === queryLower) {
      return 1.0;
    }

    // Starts with
    if (symbolName.startsWith(queryLower)) {
      return 0.9;
    }

    // Camel case match
    if (this.camelCaseMatch(symbolName, queryLower)) {
      return 0.8;
    }

    // Contains
    if (symbolName.includes(queryLower)) {
      return 0.6;
    }

    // Fuzzy match
    if (this.fuzzyMatch(symbolName, queryLower)) {
      return 0.4;
    }

    return 0.1;
  }

  private camelCaseMatch(text: string, query: string): boolean {
    const capitals = text.match(/[A-Z]/g);
    if (!capitals) return false;

    const acronym = capitals.join('').toLowerCase();
    return acronym.startsWith(query);
  }

  private calculateUserPreferenceScore(symbol: SymbolInfo, context: CompletionContext): number {
    const key = `${symbol.name}:${context.completionType}`;
    const preference = this.userPreferences.get(key) || 0;
    
    // Convert preference (-1 to 1) to score (0 to 1)
    return (preference + 1) / 2;
  }

  private calculateOverallScore(factors: RelevanceFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(symbol: SymbolInfo, factors: RelevanceFactor[]): number {
    // Base confidence from symbol
    let confidence = symbol.confidence;

    // Boost confidence based on strong factors
    const strongFactors = factors.filter(f => f.score > 0.8);
    confidence += strongFactors.length * 0.05;

    // Reduce confidence for deprecated symbols
    if (symbol.isDeprecated) {
      confidence *= 0.5;
    }

    return Math.min(1, confidence);
  }

  private generateInsertText(symbol: SymbolInfo, context: CompletionContext): string {
    let insertText = symbol.name;

    // Add function call parentheses
    if (symbol.kind === SymbolKind.FUNCTION || symbol.kind === SymbolKind.METHOD) {
      if (context.completionType === CompletionType.FUNCTION_CALL) {
        insertText += '()';
      }
    }

    return insertText;
  }

  private generateDisplayText(symbol: SymbolInfo): string {
    let displayText = symbol.name;

    // Add type information
    if (symbol.type && symbol.type !== 'unknown') {
      displayText += `: ${symbol.type}`;
    }

    // Add deprecation indicator
    if (symbol.isDeprecated) {
      displayText += ' (deprecated)';
    }

    return displayText;
  }

  private generateSortText(symbol: SymbolInfo, score: number): string {
    // Generate sort text that ensures proper ordering
    const scoreString = (1 - score).toFixed(3); // Invert score for ascending sort
    return `${scoreString}_${symbol.name}`;
  }

  private applyFinalFiltering(completions: RankedCompletion[]): RankedCompletion[] {
    // Remove duplicates
    const seen = new Set<string>();
    const filtered = completions.filter(completion => {
      const key = completion.symbol.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Filter by minimum confidence
    return filtered.filter(completion => 
      completion.confidence >= this.config.minConfidence
    );
  }
}