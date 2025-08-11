/**
 * Behavior Intent Analyzer for Sherlock Ω
 * Tracks editing patterns and developer habits to predict intent
 */

import { AbstractIntentAnalyzer } from './AbstractIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

/**
 * Developer behavior pattern
 */
interface BehaviorPattern {
  id: string;
  type: BehaviorType;
  frequency: number;
  context: string[];
  timeOfDay?: number;
  dayOfWeek?: number;
  lastSeen: number;
  confidence: number;
}

/**
 * Types of behavior patterns
 */
enum BehaviorType {
  REFACTORING_SESSION = 'REFACTORING_SESSION',
  DEBUGGING_SESSION = 'DEBUGGING_SESSION',
  FEATURE_DEVELOPMENT = 'FEATURE_DEVELOPMENT',
  CODE_REVIEW = 'CODE_REVIEW',
  TESTING_PHASE = 'TESTING_PHASE',
  OPTIMIZATION_FOCUS = 'OPTIMIZATION_FOCUS',
  DOCUMENTATION_WRITING = 'DOCUMENTATION_WRITING'
}

/**
 * Keystroke pattern analysis
 */
interface KeystrokePattern {
  sequence: string[];
  frequency: number;
  context: string;
  intent: string;
  confidence: number;
}

/**
 * Developer habit model
 */
interface DeveloperHabit {
  habitType: string;
  triggers: string[];
  actions: string[];
  frequency: number;
  effectiveness: number;
  timePattern?: {
    preferredHours: number[];
    preferredDays: number[];
  };
}

/**
 * Behavior Intent Analyzer using keystroke patterns and developer habits
 */
export class BehaviorIntentAnalyzer extends AbstractIntentAnalyzer {
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private keystrokePatterns: KeystrokePattern[] = [];
  private developerHabits: Map<string, DeveloperHabit> = new Map();
  private recentActions: string[] = [];
  private sessionStartTime: number;

  constructor() {
    super();
    this.sessionStartTime = Date.now();
    this.initializeDefaultPatterns();
  }

  /**
   * Analyze code and behavior context to determine developer intent
   * @param code - The code to analyze
   * @param behaviorContext - Optional behavior context
   * @returns Promise resolving to intent analysis
   */
  async analyzeIntent(code: string, behaviorContext?: any): Promise<IntentAnalysis> {
    if (!code || code.trim().length === 0) {
      return this.createUnknownIntent();
    }

    try {
      // Analyze current behavior patterns
      const currentBehavior = this.analyzeCurrentBehavior(code, behaviorContext);
      
      // Analyze keystroke patterns if available
      const keystrokeIntent = this.analyzeKeystrokePatterns(behaviorContext?.keystrokes);
      
      // Analyze developer habits
      const habitIntent = this.analyzeHabits(code, behaviorContext);
      
      // Combine all behavior signals
      const combinedIntent = this.combineBehaviorSignals(
        currentBehavior,
        keystrokeIntent,
        habitIntent
      );

      // Update behavior patterns based on this analysis
      this.updateBehaviorPatterns(combinedIntent, code);

      return combinedIntent;

    } catch (error) {
      console.error('Error in behavior analysis:', error);
      return this.createUnknownIntent();
    }
  }

  /**
   * Suggest actions based on behavior-detected intent
   * @param intent - The analyzed intent
   * @returns Array of suggested action plans
   */
  suggestNextActions(intent: IntentAnalysis): ActionPlan[] {
    const plans: ActionPlan[] = [];

    if (!this.isConfidentIntent(intent)) {
      plans.push({
        description: 'Continue current development pattern - behavior analysis needs more data',
        priority: 3,
        parameters: {
          confidence: intent.confidence,
          reason: 'Insufficient behavior data for confident prediction'
        }
      });
      return plans;
    }

    // Generate behavior-specific actions
    switch (intent.intentType) {
      case 'refactor':
        plans.push({
          description: 'Continue refactoring session - apply consistent patterns',
          priority: 1,
          parameters: {
            sessionType: 'refactoring',
            suggestedTools: ['prettier', 'eslint', 'refactoring-tools']
          },
          estimatedTime: 15000
        });
        break;

      case 'debug':
        plans.push({
          description: 'Enter debugging mode - set up debugging environment',
          priority: 1,
          parameters: {
            sessionType: 'debugging',
            suggestedTools: ['debugger', 'console', 'logging']
          },
          estimatedTime: 10000
        });
        break;

      case 'optimize':
        plans.push({
          description: 'Focus on performance optimization - analyze bottlenecks',
          priority: 1,
          parameters: {
            sessionType: 'optimization',
            suggestedTools: ['profiler', 'performance-monitor']
          },
          estimatedTime: 20000
        });
        break;

      case 'test':
        plans.push({
          description: 'Continue testing phase - generate additional test cases',
          priority: 1,
          parameters: {
            sessionType: 'testing',
            suggestedTools: ['jest', 'test-generator']
          },
          estimatedTime: 12000
        });
        break;

      default:
        plans.push({
          description: 'Adapt to detected development pattern',
          priority: 2,
          parameters: {
            detectedPattern: intent.intentType,
            confidence: intent.confidence
          }
        });
        break;
    }

    // Add habit-based suggestions
    const habitSuggestions = this.generateHabitBasedSuggestions(intent);
    plans.push(...habitSuggestions);

    return plans.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Record a developer action for behavior learning
   * @param action - The action performed
   * @param context - Context of the action
   */
  recordAction(action: string, context?: any): void {
    this.recentActions.push(action);
    
    // Keep only recent actions (last 50)
    if (this.recentActions.length > 50) {
      this.recentActions = this.recentActions.slice(-50);
    }

    // Update behavior patterns
    this.updateBehaviorFromAction(action, context);
  }

  /**
   * Analyze current behavior patterns
   */
  private analyzeCurrentBehavior(code: string, context?: any): IntentAnalysis {
    const currentTime = Date.now();
    const sessionDuration = currentTime - this.sessionStartTime;
    
    // Analyze session characteristics
    const sessionType = this.detectSessionType(this.recentActions, sessionDuration);
    
    // Analyze code characteristics
    const codeCharacteristics = this.analyzeCodeCharacteristics(code);
    
    // Combine session and code analysis
    const intent = this.inferIntentFromBehavior(sessionType, codeCharacteristics);
    
    return this.createIntent(
      intent.type,
      intent.confidence,
      intent.keyExpressions,
      {
        analysisMethod: 'behavior-analysis',
        sessionType,
        sessionDuration,
        recentActions: this.recentActions.slice(-5),
        codeCharacteristics
      }
    );
  }

  /**
   * Analyze keystroke patterns
   */
  private analyzeKeystrokePatterns(keystrokes?: string[]): IntentAnalysis | null {
    if (!keystrokes || keystrokes.length === 0) {
      return null;
    }

    // Look for known keystroke patterns
    for (const pattern of this.keystrokePatterns) {
      if (this.matchesKeystrokePattern(keystrokes, pattern.sequence)) {
        return this.createIntent(
          pattern.intent,
          pattern.confidence,
          [pattern.context],
          {
            analysisMethod: 'keystroke-pattern',
            matchedPattern: pattern.sequence.join(''),
            patternFrequency: pattern.frequency
          }
        );
      }
    }

    return null;
  }

  /**
   * Analyze developer habits
   */
  private analyzeHabits(code: string, context?: any): IntentAnalysis | null {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Find habits that match current time and context
    for (const [habitId, habit] of this.developerHabits) {
      if (this.matchesHabitContext(habit, currentHour, currentDay, code)) {
        const intent = this.inferIntentFromHabit(habit);
        return this.createIntent(
          intent,
          habit.effectiveness,
          [habitId],
          {
            analysisMethod: 'habit-analysis',
            matchedHabit: habitId,
            habitEffectiveness: habit.effectiveness,
            timeMatch: true
          }
        );
      }
    }

    return null;
  }

  /**
   * Combine multiple behavior signals
   */
  private combineBehaviorSignals(
    currentBehavior: IntentAnalysis,
    keystrokeIntent: IntentAnalysis | null,
    habitIntent: IntentAnalysis | null
  ): IntentAnalysis {
    const signals = [currentBehavior, keystrokeIntent, habitIntent].filter(Boolean) as IntentAnalysis[];
    
    if (signals.length === 1) {
      return signals[0];
    }

    // Weight the signals based on confidence and recency
    const weightedSignals = signals.map(signal => ({
      signal,
      weight: this.calculateSignalWeight(signal)
    }));

    // Find the dominant signal
    const dominantSignal = weightedSignals.reduce((prev, current) => 
      current.weight > prev.weight ? current : prev
    );

    // Combine confidence scores
    const combinedConfidence = weightedSignals.reduce((sum, ws) => 
      sum + (ws.signal.confidence * ws.weight), 0
    ) / weightedSignals.reduce((sum, ws) => sum + ws.weight, 0);

    // Combine key expressions
    const allExpressions = signals.flatMap(s => s.keyExpressions);

    return this.createIntent(
      dominantSignal.signal.intentType,
      Math.min(combinedConfidence, 1.0),
      [...new Set(allExpressions)],
      {
        analysisMethod: 'combined-behavior-analysis',
        signalCount: signals.length,
        dominantSignal: dominantSignal.signal.context?.analysisMethod,
        combinedWeight: dominantSignal.weight
      }
    );
  }

  /**
   * Initialize default behavior patterns
   */
  private initializeDefaultPatterns(): void {
    // Default keystroke patterns
    this.keystrokePatterns = [
      {
        sequence: ['Ctrl+F', 'Ctrl+H'],
        frequency: 10,
        context: 'find-replace',
        intent: 'refactor',
        confidence: 0.7
      },
      {
        sequence: ['F12', 'console.log'],
        frequency: 15,
        context: 'debugging',
        intent: 'debug',
        confidence: 0.8
      },
      {
        sequence: ['Ctrl+Shift+T', 'test'],
        frequency: 8,
        context: 'testing',
        intent: 'test',
        confidence: 0.75
      }
    ];

    // Default developer habits
    this.developerHabits.set('morning-refactor', {
      habitType: 'time-based-refactoring',
      triggers: ['morning', 'fresh-start'],
      actions: ['clean-code', 'organize-imports'],
      frequency: 5,
      effectiveness: 0.8,
      timePattern: {
        preferredHours: [8, 9, 10],
        preferredDays: [1, 2, 3, 4, 5] // Weekdays
      }
    });

    this.developerHabits.set('afternoon-debugging', {
      habitType: 'time-based-debugging',
      triggers: ['afternoon', 'post-lunch'],
      actions: ['debug', 'fix-bugs'],
      frequency: 7,
      effectiveness: 0.75,
      timePattern: {
        preferredHours: [13, 14, 15, 16],
        preferredDays: [1, 2, 3, 4, 5]
      }
    });
  }

  /**
   * Detect session type from recent actions
   */
  private detectSessionType(actions: string[], duration: number): string {
    if (actions.length === 0) return 'unknown';

    const actionCounts = actions.reduce((counts, action) => {
      counts[action] = (counts[action] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const dominantAction = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Map actions to session types
    const sessionTypeMap: Record<string, string> = {
      'refactor': 'refactoring',
      'debug': 'debugging',
      'test': 'testing',
      'optimize': 'optimization',
      'document': 'documentation'
    };

    return sessionTypeMap[dominantAction] || 'development';
  }

  /**
   * Analyze code characteristics
   */
  private analyzeCodeCharacteristics(code: string): any {
    return {
      length: code.length,
      complexity: this.estimateComplexity(code),
      hasTests: /test|spec|describe|it\(/i.test(code),
      hasComments: /\/\/|\/\*/.test(code),
      hasConsoleLog: /console\.log/.test(code),
      hasAsync: /async|await|Promise/.test(code)
    };
  }

  /**
   * Estimate code complexity
   */
  private estimateComplexity(code: string): number {
    const complexityIndicators = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /function\s+\w+/g,
      /=>\s*{/g
    ];

    return complexityIndicators.reduce((complexity, pattern) => {
      const matches = code.match(pattern);
      return complexity + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Infer intent from behavior patterns
   */
  private inferIntentFromBehavior(sessionType: string, codeCharacteristics: any): any {
    const intentMap: Record<string, any> = {
      'refactoring': {
        type: 'refactor',
        confidence: 0.7,
        keyExpressions: ['refactoring-session']
      },
      'debugging': {
        type: 'debug',
        confidence: 0.8,
        keyExpressions: ['debugging-session']
      },
      'testing': {
        type: 'test',
        confidence: 0.75,
        keyExpressions: ['testing-session']
      },
      'optimization': {
        type: 'optimize',
        confidence: 0.7,
        keyExpressions: ['optimization-session']
      }
    };

    const baseIntent = intentMap[sessionType] || {
      type: 'unknown',
      confidence: 0.5,
      keyExpressions: ['development-session']
    };

    // Adjust confidence based on code characteristics
    if (codeCharacteristics.hasConsoleLog && sessionType === 'debugging') {
      baseIntent.confidence += 0.1;
    }
    if (codeCharacteristics.hasTests && sessionType === 'testing') {
      baseIntent.confidence += 0.15;
    }

    return baseIntent;
  }

  /**
   * Check if keystrokes match a pattern
   */
  private matchesKeystrokePattern(keystrokes: string[], pattern: string[]): boolean {
    if (keystrokes.length < pattern.length) return false;
    
    const recent = keystrokes.slice(-pattern.length);
    return pattern.every((key, index) => recent[index] === key);
  }

  /**
   * Check if habit matches current context
   */
  private matchesHabitContext(habit: DeveloperHabit, hour: number, day: number, code: string): boolean {
    if (habit.timePattern) {
      const hourMatch = habit.timePattern.preferredHours.includes(hour);
      const dayMatch = habit.timePattern.preferredDays.includes(day);
      if (!hourMatch || !dayMatch) return false;
    }

    // Check if code context matches habit triggers
    return habit.triggers.some(trigger => {
      switch (trigger) {
        case 'morning': return hour >= 6 && hour <= 11;
        case 'afternoon': return hour >= 12 && hour <= 17;
        case 'fresh-start': return this.recentActions.length < 5;
        default: return code.toLowerCase().includes(trigger);
      }
    });
  }

  /**
   * Infer intent from habit
   */
  private inferIntentFromHabit(habit: DeveloperHabit): string {
    if (habit.actions.includes('refactor') || habit.actions.includes('clean-code')) {
      return 'refactor';
    }
    if (habit.actions.includes('debug') || habit.actions.includes('fix-bugs')) {
      return 'debug';
    }
    if (habit.actions.includes('test')) {
      return 'test';
    }
    if (habit.actions.includes('optimize')) {
      return 'optimize';
    }
    return 'unknown';
  }

  /**
   * Calculate signal weight for combination
   */
  private calculateSignalWeight(signal: IntentAnalysis): number {
    let weight = signal.confidence;
    
    // Boost weight for certain analysis methods
    if (signal.context?.analysisMethod === 'keystroke-pattern') {
      weight *= 1.2; // Keystroke patterns are very indicative
    }
    if (signal.context?.analysisMethod === 'habit-analysis' && signal.context?.timeMatch) {
      weight *= 1.1; // Time-matched habits are reliable
    }
    
    return Math.min(weight, 1.0);
  }

  /**
   * Update behavior patterns based on analysis
   */
  private updateBehaviorPatterns(intent: IntentAnalysis, code: string): void {
    const patternId = `${intent.intentType}_${Date.now()}`;
    
    this.behaviorPatterns.set(patternId, {
      id: patternId,
      type: this.mapIntentToBehaviorType(intent.intentType),
      frequency: 1,
      context: intent.keyExpressions,
      lastSeen: Date.now(),
      confidence: intent.confidence
    });

    // Clean up old patterns (keep only last 100)
    if (this.behaviorPatterns.size > 100) {
      const oldestPattern = Array.from(this.behaviorPatterns.entries())
        .sort(([,a], [,b]) => a.lastSeen - b.lastSeen)[0];
      this.behaviorPatterns.delete(oldestPattern[0]);
    }
  }

  /**
   * Update behavior from recorded action
   */
  private updateBehaviorFromAction(action: string, context?: any): void {
    // Update keystroke patterns if keystrokes are provided
    if (context?.keystrokes) {
      this.updateKeystrokePatterns(context.keystrokes, action);
    }

    // Update habits based on action patterns
    this.updateHabits(action, context);
  }

  /**
   * Update keystroke patterns
   */
  private updateKeystrokePatterns(keystrokes: string[], action: string): void {
    // Look for new patterns in recent keystrokes
    if (keystrokes.length >= 2) {
      const recentSequence = keystrokes.slice(-2);
      const existingPattern = this.keystrokePatterns.find(p => 
        p.sequence.join('') === recentSequence.join('')
      );

      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.confidence = Math.min(existingPattern.confidence + 0.05, 1.0);
      } else {
        this.keystrokePatterns.push({
          sequence: recentSequence,
          frequency: 1,
          context: action,
          intent: this.mapActionToIntent(action),
          confidence: 0.5
        });
      }
    }
  }

  /**
   * Update habits based on actions
   */
  private updateHabits(action: string, context?: any): void {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Look for existing habits that match this action and time
    for (const [habitId, habit] of this.developerHabits) {
      if (habit.actions.includes(action)) {
        habit.frequency++;
        
        // Update time patterns
        if (habit.timePattern) {
          if (!habit.timePattern.preferredHours.includes(currentHour)) {
            habit.timePattern.preferredHours.push(currentHour);
          }
          if (!habit.timePattern.preferredDays.includes(currentDay)) {
            habit.timePattern.preferredDays.push(currentDay);
          }
        }
      }
    }
  }

  /**
   * Generate habit-based suggestions
   */
  private generateHabitBasedSuggestions(intent: IntentAnalysis): ActionPlan[] {
    const suggestions: ActionPlan[] = [];
    const currentHour = new Date().getHours();

    for (const [habitId, habit] of this.developerHabits) {
      if (habit.timePattern?.preferredHours.includes(currentHour) && 
          habit.effectiveness > 0.6) {
        suggestions.push({
          description: `Based on your habits: ${habit.habitType.replace(/-/g, ' ')}`,
          priority: 2,
          parameters: {
            habitId,
            effectiveness: habit.effectiveness,
            suggestedActions: habit.actions
          },
          estimatedTime: 8000
        });
      }
    }

    return suggestions;
  }

  /**
   * Map intent type to behavior type
   */
  private mapIntentToBehaviorType(intentType: string): BehaviorType {
    const mapping: Record<string, BehaviorType> = {
      'refactor': BehaviorType.REFACTORING_SESSION,
      'debug': BehaviorType.DEBUGGING_SESSION,
      'test': BehaviorType.TESTING_PHASE,
      'optimize': BehaviorType.OPTIMIZATION_FOCUS,
      'document': BehaviorType.DOCUMENTATION_WRITING
    };

    return mapping[intentType] || BehaviorType.FEATURE_DEVELOPMENT;
  }

  /**
   * Map action to intent
   */
  private mapActionToIntent(action: string): string {
    const mapping: Record<string, string> = {
      'refactor': 'refactor',
      'debug': 'debug',
      'test': 'test',
      'optimize': 'optimize',
      'document': 'document'
    };

    return mapping[action] || 'unknown';
  }
}