/**
 * Abstract Intent Analyzer for Sherlock Ω
 * Base class for all intent analysis implementations
 */

import { IntentAnalyzer, IntentAnalysis, ActionPlan } from '@core/interfaces';

/**
 * Abstract base class for intent analyzers
 * Provides common functionality and enforces interface compliance
 */
export abstract class AbstractIntentAnalyzer implements IntentAnalyzer {
  protected readonly threshold = 0.6;
  
  /**
   * Log analysis results for debugging and monitoring
   * @param intent - The intent analysis to log
   */
  protected logAnalysis(intent: IntentAnalysis): void {
    console.debug('[IntentAnalyzer]', {
      type: intent.intentType,
      confidence: intent.confidence,
      expressions: intent.keyExpressions,
      timestamp: new Date(intent.timestamp).toISOString()
    });
  }

  /**
   * Abstract method to analyze code intent
   * Must be implemented by concrete analyzers
   */
  abstract analyzeIntent(code: string): Promise<IntentAnalysis>;

  /**
   * Abstract method to suggest actions based on intent
   * Must be implemented by concrete analyzers
   */
  abstract suggestNextActions(intent: IntentAnalysis): ActionPlan[];

  /**
   * Run complete intent analysis workflow
   * @param code - The code to analyze
   * @returns Promise resolving to suggested actions
   */
  async run(code: string): Promise<ActionPlan[]> {
    const intent = await this.analyzeIntent(code);
    this.logAnalysis(intent);
    return this.suggestNextActions(intent);
  }

  /**
   * Check if intent confidence meets threshold
   * @param intent - The intent to check
   * @returns True if confidence is above threshold
   */
  protected isConfidentIntent(intent: IntentAnalysis): boolean {
    return intent.confidence >= this.threshold;
  }

  /**
   * Create a low-confidence unknown intent
   * @param keyExpressions - Any expressions found in the code
   * @returns Unknown intent analysis
   */
  protected createUnknownIntent(keyExpressions: string[] = []): IntentAnalysis {
    return {
      intentType: 'unknown',
      confidence: 0.5,
      keyExpressions,
      timestamp: Date.now()
    };
  }

  /**
   * Create a high-confidence intent
   * @param intentType - The type of intent detected
   * @param confidence - Confidence score (0.0-1.0)
   * @param keyExpressions - Expressions that indicate this intent
   * @param context - Additional context data
   * @returns Intent analysis
   */
  protected createIntent(
    intentType: string,
    confidence: number,
    keyExpressions: string[],
    context?: Record<string, any>
  ): IntentAnalysis {
    return {
      intentType,
      confidence: Math.max(0, Math.min(1, confidence)),
      keyExpressions,
      context,
      timestamp: Date.now()
    };
  }
}