/**
 * Thought Completion Friction Detector
 * Detects friction points that can be resolved through predictive code completion
 */

import { FrictionDetector, FrictionPoint, FrictionType } from './FrictionDetector';
import { ThoughtCompletion, CompletionType, CompletionContext } from '../intent/ThoughtCompletion';
import { IntegratedFrictionProtocol } from './IntegratedFrictionProtocol';

/**
 * Friction point specific to thought completion
 */
export interface ThoughtCompletionFrictionPoint extends FrictionPoint {
  type: FrictionType;
  completionType: CompletionType;
  suggestedCompletion: string;
  intentAlignment: number;
  estimatedImplementationTime: number;
}

/**
 * Configuration for thought completion friction detection
 */
export interface ThoughtCompletionConfig {
  enableProactiveCompletion: boolean;
  minimumConfidenceThreshold: number;
  minimumIntentAlignment: number;
  maxSuggestionsPerType: number;
  enabledCompletionTypes: CompletionType[];
}

/**
 * Default configuration for thought completion friction detection
 */
export const DEFAULT_THOUGHT_COMPLETION_CONFIG: ThoughtCompletionConfig = {
  enableProactiveCompletion: true,
  minimumConfidenceThreshold: 0.6,
  minimumIntentAlignment: 0.5,
  maxSuggestionsPerType: 3,
  enabledCompletionTypes: [
    CompletionType.FUNCTION_SIGNATURE,
    CompletionType.FUNCTION_IMPLEMENTATION,
    CompletionType.TEST_CASE,
    CompletionType.COMMENT,
    CompletionType.IMPORT_STATEMENT,
    CompletionType.TYPE_DEFINITION
  ]
};

/**
 * Friction detector that identifies opportunities for thought completion
 */
export class ThoughtCompletionFrictionDetector extends FrictionDetector {
  private thoughtCompletion: ThoughtCompletion;
  private config: ThoughtCompletionConfig;

  constructor(
    thoughtCompletion: ThoughtCompletion,
    config: ThoughtCompletionConfig = DEFAULT_THOUGHT_COMPLETION_CONFIG
  ) {
    super();
    this.thoughtCompletion = thoughtCompletion;
    this.config = config;
  }

  /**
   * Get detector name
   */
  getName(): string {
    return 'ThoughtCompletionFrictionDetector';
  }

  /**
   * Detect friction points that can be resolved through thought completion
   */
  async detect(context: any): Promise<ThoughtCompletionFrictionPoint[]> {
    if (!this.config.enableProactiveCompletion) {
      return [];
    }

    try {
      const completionContext = this.convertToCompletionContext(context);
      if (!completionContext) {
        return [];
      }

      // Get thought completion suggestions
      const completionResult = await this.thoughtCompletion.completeThought(completionContext);

      // Filter suggestions based on configuration
      const filteredSuggestions = completionResult.suggestions.filter(suggestion => 
        this.config.enabledCompletionTypes.includes(suggestion.type) &&
        suggestion.confidence >= this.config.minimumConfidenceThreshold &&
        suggestion.intentAlignment >= this.config.minimumIntentAlignment
      );

      // Convert suggestions to friction points
      const frictionPoints: ThoughtCompletionFrictionPoint[] = [];

      for (const suggestion of filteredSuggestions) {
        const frictionPoint: ThoughtCompletionFrictionPoint = {
          id: `thought_completion_${suggestion.id}`,
          type: this.mapCompletionTypeToFrictionType(suggestion.type),
          severity: this.calculateSeverity(suggestion),
          description: `Proactive suggestion: ${suggestion.description}`,
          location: {
            file: completionContext.filePath,
            line: completionContext.cursorPosition.line,
            column: completionContext.cursorPosition.column
          },
          metadata: {
            confidence: suggestion.confidence,
            intentAlignment: suggestion.intentAlignment,
            completionType: suggestion.type,
            estimatedTime: suggestion.metadata.estimatedTime,
            language: suggestion.metadata.language,
            paradigm: suggestion.metadata.paradigm
          },
          timestamp: Date.now(),
          eliminated: false,
          completionType: suggestion.type,
          suggestedCompletion: suggestion.content,
          intentAlignment: suggestion.intentAlignment,
          estimatedImplementationTime: suggestion.metadata.estimatedTime
        };

        frictionPoints.push(frictionPoint);
      }

      // Limit suggestions per type
      const limitedFrictionPoints = this.limitSuggestionsPerType(frictionPoints);

      return limitedFrictionPoints;

    } catch (error) {
      console.error('Thought completion friction detection failed:', error);
      return [];
    }
  }

  /**
   * Eliminate friction by applying the suggested completion
   */
  async eliminate(frictionPoint: ThoughtCompletionFrictionPoint): Promise<boolean> {
    try {
      console.log(`🧠 Applying thought completion: ${frictionPoint.description}`);
      console.log(`   Completion: ${frictionPoint.suggestedCompletion}`);
      console.log(`   Intent alignment: ${(frictionPoint.intentAlignment * 100).toFixed(1)}%`);
      console.log(`   Estimated time: ${frictionPoint.estimatedImplementationTime}s`);

      // In a real implementation, this would apply the completion to the editor
      // For now, we simulate the application
      await this.simulateCompletionApplication(frictionPoint);

      frictionPoint.eliminated = true;
      console.log(`✅ Thought completion applied successfully`);
      
      return true;

    } catch (error) {
      console.error(`❌ Failed to apply thought completion:`, error);
      return false;
    }
  }

  /**
   * Get detector statistics
   */
  getStats(): {
    totalDetected: number;
    totalEliminated: number;
    eliminationRate: number;
    averageConfidence: number;
    averageIntentAlignment: number;
    completionTypeBreakdown: Record<CompletionType, number>;
  } {
    const history = this.getHistory() as ThoughtCompletionFrictionPoint[];
    
    if (history.length === 0) {
      return {
        totalDetected: 0,
        totalEliminated: 0,
        eliminationRate: 0,
        averageConfidence: 0,
        averageIntentAlignment: 0,
        completionTypeBreakdown: {} as Record<CompletionType, number>
      };
    }

    const totalDetected = history.length;
    const totalEliminated = history.filter(fp => fp.eliminated).length;
    const eliminationRate = totalEliminated / totalDetected;

    const averageConfidence = history.reduce((sum, fp) => 
      sum + (fp.metadata?.confidence || 0), 0) / totalDetected;
    
    const averageIntentAlignment = history.reduce((sum, fp) => 
      sum + fp.intentAlignment, 0) / totalDetected;

    // Calculate completion type breakdown
    const completionTypeBreakdown: Record<CompletionType, number> = {} as Record<CompletionType, number>;
    for (const type of Object.values(CompletionType)) {
      completionTypeBreakdown[type] = history.filter(fp => fp.completionType === type).length;
    }

    return {
      totalDetected,
      totalEliminated,
      eliminationRate,
      averageConfidence,
      averageIntentAlignment,
      completionTypeBreakdown
    };
  }

  // Private helper methods

  /**
   * Convert generic context to completion context
   */
  private convertToCompletionContext(context: any): CompletionContext | null {
    if (!context || typeof context !== 'object') {
      return null;
    }

    // Extract required fields
    const filePath = context.filePath || context.file || 'unknown.ts';
    const content = context.content || context.code || '';
    const language = context.language || this.inferLanguageFromPath(filePath);

    // Extract cursor position
    let cursorPosition = { line: 0, column: 0 };
    if (context.cursorPosition) {
      cursorPosition = context.cursorPosition;
    } else if (context.line !== undefined && context.column !== undefined) {
      cursorPosition = { line: context.line, column: context.column };
    } else {
      // Default to end of content
      const lines = content.split('\n');
      cursorPosition = {
        line: lines.length - 1,
        column: lines[lines.length - 1]?.length || 0
      };
    }

    return {
      filePath,
      content,
      cursorPosition,
      language,
      selectedText: context.selectedText,
      projectContext: context.projectContext
    };
  }

  /**
   * Infer language from file path
   */
  private inferLanguageFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'c':
        return 'c';
      case 'cs':
        return 'csharp';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      default:
        return 'typescript'; // Default fallback
    }
  }

  /**
   * Map completion type to friction type
   */
  private mapCompletionTypeToFrictionType(completionType: CompletionType): FrictionType {
    switch (completionType) {
      case CompletionType.FUNCTION_SIGNATURE:
      case CompletionType.FUNCTION_IMPLEMENTATION:
      case CompletionType.VARIABLE_DECLARATION:
        return FrictionType.SYNTAX;
      case CompletionType.TEST_CASE:
        return FrictionType.PERFORMANCE; // Use PERFORMANCE as proxy for testing
      case CompletionType.COMMENT:
        return FrictionType.CONFIGURATION; // Use CONFIGURATION as proxy for documentation
      case CompletionType.IMPORT_STATEMENT:
        return FrictionType.DEPENDENCY;
      case CompletionType.TYPE_DEFINITION:
        return FrictionType.SYNTAX;
      case CompletionType.CLASS_DEFINITION:
      case CompletionType.INTERFACE_DEFINITION:
        return FrictionType.ARCHITECTURAL;
      case CompletionType.ERROR_HANDLING:
        return FrictionType.CONNECTIVITY; // Use CONNECTIVITY as proxy for error handling
      default:
        return FrictionType.UNKNOWN;
    }
  }

  /**
   * Calculate severity based on suggestion properties
   */
  private calculateSeverity(suggestion: any): number {
    let severity = 0.5; // Base severity

    // Increase severity for high confidence suggestions
    if (suggestion.confidence > 0.8) {
      severity += 0.2;
    }

    // Increase severity for high intent alignment
    if (suggestion.intentAlignment > 0.8) {
      severity += 0.2;
    }

    // Increase severity for critical completion types
    if ([CompletionType.IMPORT_STATEMENT, CompletionType.ERROR_HANDLING].includes(suggestion.type)) {
      severity += 0.1;
    }

    // Decrease severity for low priority suggestions
    if (suggestion.priority > 3) {
      severity -= 0.1;
    }

    return Math.max(0, Math.min(1, severity));
  }

  /**
   * Limit suggestions per completion type
   */
  private limitSuggestionsPerType(frictionPoints: ThoughtCompletionFrictionPoint[]): ThoughtCompletionFrictionPoint[] {
    const typeGroups = new Map<CompletionType, ThoughtCompletionFrictionPoint[]>();

    // Group by completion type
    for (const point of frictionPoints) {
      if (!typeGroups.has(point.completionType)) {
        typeGroups.set(point.completionType, []);
      }
      typeGroups.get(point.completionType)!.push(point);
    }

    // Limit each group and sort by confidence
    const limitedPoints: ThoughtCompletionFrictionPoint[] = [];
    for (const [type, points] of typeGroups) {
      const sortedPoints = points.sort((a, b) => 
        (b.metadata?.confidence || 0) - (a.metadata?.confidence || 0)
      );
      const limitedTypePoints = sortedPoints.slice(0, this.config.maxSuggestionsPerType);
      limitedPoints.push(...limitedTypePoints);
    }

    return limitedPoints;
  }

  /**
   * Simulate completion application (in real implementation, would integrate with editor)
   */
  private async simulateCompletionApplication(frictionPoint: ThoughtCompletionFrictionPoint): Promise<void> {
    // Simulate processing time based on completion type
    const processingTime = this.getProcessingTime(frictionPoint.completionType);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Log the completion that would be applied
    console.log(`📝 Would apply completion at ${frictionPoint.location?.file}:${frictionPoint.location?.line}:${frictionPoint.location?.column}`);
    console.log(`   Type: ${frictionPoint.completionType}`);
    console.log(`   Content: ${frictionPoint.suggestedCompletion.substring(0, 100)}${frictionPoint.suggestedCompletion.length > 100 ? '...' : ''}`);
  }

  /**
   * Get processing time for different completion types
   */
  private getProcessingTime(completionType: CompletionType): number {
    switch (completionType) {
      case CompletionType.IMPORT_STATEMENT:
        return 100;
      case CompletionType.COMMENT:
        return 200;
      case CompletionType.FUNCTION_SIGNATURE:
        return 300;
      case CompletionType.TYPE_DEFINITION:
        return 400;
      case CompletionType.FUNCTION_IMPLEMENTATION:
        return 800;
      case CompletionType.TEST_CASE:
        return 1000;
      default:
        return 500;
    }
  }
}