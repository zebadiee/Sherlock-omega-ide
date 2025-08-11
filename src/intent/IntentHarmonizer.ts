/**
 * Intent Harmonizer for Sherlock Ω
 * Merges results from multiple intent analyzers into a unified IntentProfile
 */

import { IntentAnalysis, ActionPlan } from '@core/interfaces';
import { SimpleIntentAnalyzer } from './SimpleIntentAnalyzer';
import { PatternIntentAnalyzer } from './PatternIntentAnalyzer';
import { BehaviorIntentAnalyzer } from './BehaviorIntentAnalyzer';

/**
 * Unified intent profile combining multiple analyzer results
 */
export interface IntentProfile {
  primaryIntent: string;
  confidence: number;
  consensusLevel: number; // How much analyzers agree (0-1)
  conflictResolution: ConflictResolution;
  contributingAnalyzers: AnalyzerContribution[];
  harmonizedActions: ActionPlan[];
  metadata: IntentProfileMetadata;
}

/**
 * Contribution from each analyzer
 */
export interface AnalyzerContribution {
  analyzerType: AnalyzerType;
  intent: IntentAnalysis;
  weight: number;
  reliability: number;
}

/**
 * Types of intent analyzers
 */
export enum AnalyzerType {
  SIMPLE = 'SIMPLE',
  PATTERN = 'PATTERN',
  BEHAVIOR = 'BEHAVIOR'
}

/**
 * Conflict resolution strategy and result
 */
export interface ConflictResolution {
  strategy: ConflictStrategy;
  conflictLevel: number; // 0 = no conflict, 1 = high conflict
  resolvedBy: AnalyzerType;
  alternativeIntents: string[];
}

/**
 * Conflict resolution strategies
 */
export enum ConflictStrategy {
  HIGHEST_CONFIDENCE = 'HIGHEST_CONFIDENCE',
  WEIGHTED_CONSENSUS = 'WEIGHTED_CONSENSUS',
  ANALYZER_PRIORITY = 'ANALYZER_PRIORITY',
  TEMPORAL_RECENCY = 'TEMPORAL_RECENCY',
  CONTEXT_SPECIFIC = 'CONTEXT_SPECIFIC'
}

/**
 * Metadata for the intent profile
 */
export interface IntentProfileMetadata {
  analysisTimestamp: number;
  totalAnalyzers: number;
  harmonizationMethod: string;
  contextFactors: string[];
  qualityScore: number; // Overall quality of the harmonization (0-1)
}

/**
 * Intent Harmonizer that combines multiple analyzer results
 */
export class IntentHarmonizer {
  private simpleAnalyzer: SimpleIntentAnalyzer;
  private patternAnalyzer: PatternIntentAnalyzer;
  private behaviorAnalyzer: BehaviorIntentAnalyzer;

  // Analyzer weights based on reliability and context
  private analyzerWeights: Record<AnalyzerType, number> = {
    [AnalyzerType.SIMPLE]: 0.3,
    [AnalyzerType.PATTERN]: 0.4,
    [AnalyzerType.BEHAVIOR]: 0.3
  };

  // Priority order for conflict resolution
  private analyzerPriority: AnalyzerType[] = [
    AnalyzerType.BEHAVIOR,  // Most contextual
    AnalyzerType.PATTERN,   // Most precise
    AnalyzerType.SIMPLE     // Most general
  ];

  constructor() {
    this.simpleAnalyzer = new SimpleIntentAnalyzer();
    this.patternAnalyzer = new PatternIntentAnalyzer();
    this.behaviorAnalyzer = new BehaviorIntentAnalyzer();
  }

  /**
   * Harmonize intent analysis from all analyzers
   * @param code - The code to analyze
   * @param behaviorContext - Optional behavior context
   * @returns Promise resolving to unified intent profile
   */
  async harmonizeIntent(code: string, behaviorContext?: any): Promise<IntentProfile> {
    try {
      // Run all analyzers in parallel
      const [simpleIntent, patternIntent, behaviorIntent] = await Promise.all([
        this.simpleAnalyzer.analyzeIntent(code),
        this.patternAnalyzer.analyzeIntent(code),
        this.behaviorAnalyzer.analyzeIntent(code, behaviorContext)
      ]);

      // Create analyzer contributions
      const contributions: AnalyzerContribution[] = [
        {
          analyzerType: AnalyzerType.SIMPLE,
          intent: simpleIntent,
          weight: this.analyzerWeights[AnalyzerType.SIMPLE],
          reliability: this.calculateReliability(simpleIntent, AnalyzerType.SIMPLE)
        },
        {
          analyzerType: AnalyzerType.PATTERN,
          intent: patternIntent,
          weight: this.analyzerWeights[AnalyzerType.PATTERN],
          reliability: this.calculateReliability(patternIntent, AnalyzerType.PATTERN)
        },
        {
          analyzerType: AnalyzerType.BEHAVIOR,
          intent: behaviorIntent,
          weight: this.analyzerWeights[AnalyzerType.BEHAVIOR],
          reliability: this.calculateReliability(behaviorIntent, AnalyzerType.BEHAVIOR)
        }
      ];

      // Detect and resolve conflicts
      const conflictResolution = this.resolveConflicts(contributions);

      // Determine primary intent
      const primaryIntent = this.determinePrimaryIntent(contributions, conflictResolution);

      // Calculate consensus level
      const consensusLevel = this.calculateConsensusLevel(contributions);

      // Calculate overall confidence
      const confidence = this.calculateHarmonizedConfidence(contributions, consensusLevel);

      // Harmonize action plans
      const harmonizedActions = await this.harmonizeActionPlans(contributions, primaryIntent);

      // Create metadata
      const metadata: IntentProfileMetadata = {
        analysisTimestamp: Date.now(),
        totalAnalyzers: contributions.length,
        harmonizationMethod: conflictResolution.strategy,
        contextFactors: this.extractContextFactors(contributions),
        qualityScore: this.calculateQualityScore(contributions, consensusLevel, confidence)
      };

      return {
        primaryIntent,
        confidence,
        consensusLevel,
        conflictResolution,
        contributingAnalyzers: contributions,
        harmonizedActions,
        metadata
      };

    } catch (error) {
      console.error('Error in intent harmonization:', error);
      return this.createFallbackProfile(code);
    }
  }

  /**
   * Update analyzer weights based on performance
   * @param analyzerType - Type of analyzer
   * @param performanceScore - Performance score (0-1)
   */
  updateAnalyzerWeight(analyzerType: AnalyzerType, performanceScore: number): void {
    const currentWeight = this.analyzerWeights[analyzerType];
    const adjustment = (performanceScore - 0.5) * 0.1; // Adjust by up to ±0.1
    
    this.analyzerWeights[analyzerType] = Math.max(0.1, Math.min(0.8, currentWeight + adjustment));
    
    // Normalize weights to sum to 1
    this.normalizeWeights();
  }

  /**
   * Get current analyzer weights
   */
  getAnalyzerWeights(): Record<AnalyzerType, number> {
    return { ...this.analyzerWeights };
  }

  /**
   * Calculate reliability score for an analyzer result
   */
  private calculateReliability(intent: IntentAnalysis, analyzerType: AnalyzerType): number {
    let reliability = intent.confidence;

    // Adjust based on analyzer-specific factors
    switch (analyzerType) {
      case AnalyzerType.SIMPLE:
        // Simple analyzer is more reliable for basic patterns
        if (intent.keyExpressions.length > 0) {
          reliability += 0.1;
        }
        break;

      case AnalyzerType.PATTERN:
        // Pattern analyzer is more reliable with multiple patterns
        if (intent.context?.detectedPatterns?.length > 1) {
          reliability += 0.15;
        }
        if (intent.context?.analysisMethod === 'hybrid-pattern-matching') {
          reliability += 0.1;
        }
        break;

      case AnalyzerType.BEHAVIOR:
        // Behavior analyzer is more reliable with more context
        if (intent.context?.signalCount > 1) {
          reliability += 0.1;
        }
        if (intent.context?.analysisMethod === 'combined-behavior-analysis') {
          reliability += 0.15;
        }
        break;
    }

    return Math.min(1.0, reliability);
  }

  /**
   * Resolve conflicts between analyzer results
   */
  private resolveConflicts(contributions: AnalyzerContribution[]): ConflictResolution {
    const intents = contributions.map(c => c.intent.intentType);
    const uniqueIntents = [...new Set(intents)];
    
    const conflictLevel = 1 - (uniqueIntents.length === 1 ? 1 : uniqueIntents.length / intents.length);
    
    if (conflictLevel < 0.3) {
      // Low conflict - use weighted consensus
      return {
        strategy: ConflictStrategy.WEIGHTED_CONSENSUS,
        conflictLevel,
        resolvedBy: this.getHighestWeightedAnalyzer(contributions),
        alternativeIntents: uniqueIntents.filter(intent => intent !== this.getMostCommonIntent(intents))
      };
    } else if (conflictLevel < 0.7) {
      // Medium conflict - use highest confidence
      return {
        strategy: ConflictStrategy.HIGHEST_CONFIDENCE,
        conflictLevel,
        resolvedBy: this.getHighestConfidenceAnalyzer(contributions),
        alternativeIntents: uniqueIntents.filter(intent => intent !== this.getHighestConfidenceIntent(contributions))
      };
    } else {
      // High conflict - use analyzer priority
      return {
        strategy: ConflictStrategy.ANALYZER_PRIORITY,
        conflictLevel,
        resolvedBy: this.getHighestPriorityAnalyzer(contributions),
        alternativeIntents: uniqueIntents.filter(intent => intent !== this.getPriorityIntent(contributions))
      };
    }
  }

  /**
   * Determine the primary intent from contributions
   */
  private determinePrimaryIntent(contributions: AnalyzerContribution[], resolution: ConflictResolution): string {
    switch (resolution.strategy) {
      case ConflictStrategy.WEIGHTED_CONSENSUS:
        return this.getWeightedConsensusIntent(contributions);
      
      case ConflictStrategy.HIGHEST_CONFIDENCE:
        return this.getHighestConfidenceIntent(contributions);
      
      case ConflictStrategy.ANALYZER_PRIORITY:
        return this.getPriorityIntent(contributions);
      
      default:
        return this.getHighestConfidenceIntent(contributions);
    }
  }

  /**
   * Calculate consensus level between analyzers
   */
  private calculateConsensusLevel(contributions: AnalyzerContribution[]): number {
    const intents = contributions.map(c => c.intent.intentType);
    const intentCounts = intents.reduce((counts, intent) => {
      counts[intent] = (counts[intent] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(intentCounts));
    return maxCount / intents.length;
  }

  /**
   * Calculate harmonized confidence score
   */
  private calculateHarmonizedConfidence(contributions: AnalyzerContribution[], consensusLevel: number): number {
    // Weighted average of confidences
    const weightedConfidence = contributions.reduce((sum, contrib) => {
      return sum + (contrib.intent.confidence * contrib.weight * contrib.reliability);
    }, 0) / contributions.reduce((sum, contrib) => sum + (contrib.weight * contrib.reliability), 0);

    // Boost confidence based on consensus
    const consensusBoost = consensusLevel * 0.2;
    
    return Math.min(1.0, weightedConfidence + consensusBoost);
  }

  /**
   * Harmonize action plans from all analyzers
   */
  private async harmonizeActionPlans(contributions: AnalyzerContribution[], primaryIntent: string): Promise<ActionPlan[]> {
    // Get action plans from all analyzers
    const allActionPlans = await Promise.all(
      contributions.map(async contrib => {
        const analyzer = this.getAnalyzerInstance(contrib.analyzerType);
        return analyzer.suggestNextActions(contrib.intent);
      })
    );

    // Flatten and deduplicate actions
    const allActions = allActionPlans.flat();
    const uniqueActions = this.deduplicateActions(allActions);

    // Prioritize actions based on primary intent and analyzer weights
    const prioritizedActions = this.prioritizeActions(uniqueActions, contributions, primaryIntent);

    // Limit to top 5 actions to avoid overwhelming the user
    return prioritizedActions.slice(0, 5);
  }

  /**
   * Extract context factors from contributions
   */
  private extractContextFactors(contributions: AnalyzerContribution[]): string[] {
    const factors: string[] = [];

    contributions.forEach(contrib => {
      if (contrib.intent.context?.analysisMethod) {
        factors.push(contrib.intent.context.analysisMethod);
      }
      if (contrib.intent.context?.patternType) {
        factors.push(`pattern:${contrib.intent.context.patternType}`);
      }
      if (contrib.intent.context?.sessionType) {
        factors.push(`session:${contrib.intent.context.sessionType}`);
      }
    });

    return [...new Set(factors)];
  }

  /**
   * Calculate overall quality score for the harmonization
   */
  private calculateQualityScore(contributions: AnalyzerContribution[], consensusLevel: number, confidence: number): number {
    // Base score from confidence and consensus
    let score = (confidence + consensusLevel) / 2;

    // Boost for high reliability analyzers
    const avgReliability = contributions.reduce((sum, c) => sum + c.reliability, 0) / contributions.length;
    score += avgReliability * 0.2;

    // Boost for multiple contributing analyzers
    if (contributions.length >= 3) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Create fallback profile when harmonization fails
   */
  private createFallbackProfile(code: string): IntentProfile {
    return {
      primaryIntent: 'unknown',
      confidence: 0.3,
      consensusLevel: 0.0,
      conflictResolution: {
        strategy: ConflictStrategy.HIGHEST_CONFIDENCE,
        conflictLevel: 1.0,
        resolvedBy: AnalyzerType.SIMPLE,
        alternativeIntents: []
      },
      contributingAnalyzers: [],
      harmonizedActions: [{
        description: 'Intent harmonization failed - manual review required',
        priority: 1,
        parameters: { error: 'harmonization_failed' }
      }],
      metadata: {
        analysisTimestamp: Date.now(),
        totalAnalyzers: 0,
        harmonizationMethod: 'fallback',
        contextFactors: [],
        qualityScore: 0.1
      }
    };
  }

  // Helper methods for conflict resolution

  private getMostCommonIntent(intents: string[]): string {
    const counts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0];
  }

  private getHighestWeightedAnalyzer(contributions: AnalyzerContribution[]): AnalyzerType {
    return contributions.reduce((prev, current) => 
      (current.weight * current.reliability) > (prev.weight * prev.reliability) ? current : prev
    ).analyzerType;
  }

  private getHighestConfidenceAnalyzer(contributions: AnalyzerContribution[]): AnalyzerType {
    return contributions.reduce((prev, current) => 
      current.intent.confidence > prev.intent.confidence ? current : prev
    ).analyzerType;
  }

  private getHighestPriorityAnalyzer(contributions: AnalyzerContribution[]): AnalyzerType {
    for (const priority of this.analyzerPriority) {
      const contrib = contributions.find(c => c.analyzerType === priority);
      if (contrib) return priority;
    }
    return contributions[0].analyzerType;
  }

  private getWeightedConsensusIntent(contributions: AnalyzerContribution[]): string {
    const weightedVotes: Record<string, number> = {};
    
    contributions.forEach(contrib => {
      const intent = contrib.intent.intentType;
      const weight = contrib.weight * contrib.reliability * contrib.intent.confidence;
      weightedVotes[intent] = (weightedVotes[intent] || 0) + weight;
    });

    return Object.entries(weightedVotes).sort(([,a], [,b]) => b - a)[0][0];
  }

  private getHighestConfidenceIntent(contributions: AnalyzerContribution[]): string {
    return contributions.reduce((prev, current) => 
      current.intent.confidence > prev.intent.confidence ? current : prev
    ).intent.intentType;
  }

  private getPriorityIntent(contributions: AnalyzerContribution[]): string {
    for (const priority of this.analyzerPriority) {
      const contrib = contributions.find(c => c.analyzerType === priority);
      if (contrib) return contrib.intent.intentType;
    }
    return contributions[0].intent.intentType;
  }

  private getAnalyzerInstance(type: AnalyzerType): any {
    switch (type) {
      case AnalyzerType.SIMPLE: return this.simpleAnalyzer;
      case AnalyzerType.PATTERN: return this.patternAnalyzer;
      case AnalyzerType.BEHAVIOR: return this.behaviorAnalyzer;
      default: return this.simpleAnalyzer;
    }
  }

  private deduplicateActions(actions: ActionPlan[]): ActionPlan[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      const key = `${action.description}_${action.priority}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private prioritizeActions(actions: ActionPlan[], contributions: AnalyzerContribution[], primaryIntent: string): ActionPlan[] {
    return actions
      .map(action => ({
        ...action,
        harmonizedPriority: this.calculateActionPriority(action, contributions, primaryIntent)
      }))
      .sort((a, b) => a.harmonizedPriority - b.harmonizedPriority);
  }

  private calculateActionPriority(action: ActionPlan, contributions: AnalyzerContribution[], primaryIntent: string): number {
    let priority = action.priority;

    // Boost priority if action aligns with primary intent
    if (action.description.toLowerCase().includes(primaryIntent)) {
      priority -= 0.5;
    }

    // Boost priority based on analyzer reliability
    const avgReliability = contributions.reduce((sum, c) => sum + c.reliability, 0) / contributions.length;
    priority -= avgReliability * 0.3;

    return Math.max(1, priority);
  }

  private normalizeWeights(): void {
    const total = Object.values(this.analyzerWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(this.analyzerWeights).forEach(key => {
      this.analyzerWeights[key as AnalyzerType] /= total;
    });
  }
}