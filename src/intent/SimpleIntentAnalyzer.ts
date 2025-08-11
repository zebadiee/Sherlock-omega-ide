/**
 * Simple Intent Analyzer for Sherlock Ω
 * Implements basic keyword-based intent detection
 */

import { AbstractIntentAnalyzer } from './AbstractIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

/**
 * Simple intent analyzer using keyword-based heuristics
 * Suitable for basic intent detection scenarios
 */
export class SimpleIntentAnalyzer extends AbstractIntentAnalyzer {
  private readonly intentKeywords = {
    refactor: /refactor|cleanup|simplify|restructure|reorganize/gi,
    optimize: /optimi[sz]e|performance|speed|faster|efficient/gi,
    secure: /auth|encrypt|sanitize|validate|security|secure/gi,
    debug: /debug|fix|bug|error|issue|problem/gi,
    test: /\btest\b|spec|coverage|unit|integration/gi,
    document: /document|comment|readme|doc|explain/gi,
    style: /format|style|lint|prettier|eslint/gi,
    upgrade: /upgrade|update dependencies|npm update|yarn upgrade|migrate|version|dependency/gi
  };

  /**
   * Analyze code to detect developer intent using keyword matching
   * @param code - The code to analyze
   * @returns Promise resolving to intent analysis
   */
  async analyzeIntent(code: string): Promise<IntentAnalysis> {
    if (!code || code.trim().length === 0) {
      return this.createUnknownIntent();
    }

    // First check for structural patterns (highest confidence)
    const structuralIntent = this.analyzeStructuralPatterns(code);
    if (structuralIntent) {
      return structuralIntent;
    }

    // Then check for keyword matches with cumulative scoring
    const matches: Record<string, string[]> = {};
    
    for (const [intentType, regex] of Object.entries(this.intentKeywords)) {
      const hits = code.match(regex) || [];
      if (hits.length > 0) {
        // Filter out matches that are inside TODO/FIXME comments
        const filteredHits = hits.filter(hit => {
          const hitIndex = code.indexOf(hit);
          const beforeHit = code.substring(0, hitIndex);
          const afterHit = code.substring(hitIndex + hit.length);
          
          // Check if this hit is inside a TODO/FIXME comment
          const inTodoComment = /\/\*\s*TODO:[^*]*$/.test(beforeHit) && /^[^*]*\*\//.test(afterHit);
          const inFixmeComment = /\/\*\s*FIXME:[^*]*$/.test(beforeHit) && /^[^*]*\*\//.test(afterHit);
          
          return !inTodoComment && !inFixmeComment;
        });
        
        if (filteredHits.length > 0) {
          matches[intentType] = [...new Set(filteredHits)]; // Remove duplicates
        }
      }
    }

    // Find the intent with the most matches
    const bestMatch = Object.entries(matches)
      .sort((a, b) => b[1].length - a[1].length)[0];

    if (bestMatch) {
      const [intentType, keyExpressions] = bestMatch;
      const matchCount = keyExpressions.length;
      const confidence = this.calculateKeywordConfidence(intentType, keyExpressions, code);
      
      return this.createIntent(
        intentType,
        confidence,
        keyExpressions,
        {
          matches: matchCount,
          analysisMethod: 'keyword-matching',
          codeLength: code.length
        }
      );
    }

    return this.createUnknownIntent();
  }

  /**
   * Suggest next actions based on detected intent
   * @param intent - The analyzed intent
   * @returns Array of suggested action plans
   */
  suggestNextActions(intent: IntentAnalysis): ActionPlan[] {
    const plans: ActionPlan[] = [];

    if (!this.isConfidentIntent(intent)) {
      plans.push({
        description: 'Review code context manually - intent unclear',
        priority: 2,
        parameters: { 
          confidence: intent.confidence,
          reason: 'Low confidence in intent detection'
        }
      });
      
      // Also add clarification request for unknown intents
      if (intent.intentType === 'unknown') {
        plans.push({
          description: 'Prompt for user clarification',
          priority: 2,
          parameters: { 
            detectedIntent: intent.intentType,
            confidence: intent.confidence
          }
        });
      }
      
      return plans;
    }

    switch (intent.intentType) {
      case 'refactor':
        plans.push({
          description: 'Run auto-refactor tool',
          priority: 1,
          parameters: { 
            tool: 'prettier',
            scope: 'current-file'
          },
          estimatedTime: 5000
        });
        plans.push({
          description: 'Analyze code complexity metrics',
          priority: 2,
          parameters: { 
            metrics: ['cyclomatic', 'cognitive', 'maintainability']
          },
          estimatedTime: 3000
        });
        break;

      case 'optimize':
        plans.push({
          description: 'Profile performance hotspots',
          priority: 1,
          parameters: { 
            profiler: 'node-profiler',
            duration: 30000
          },
          estimatedTime: 10000
        });
        plans.push({
          description: 'Analyze algorithmic complexity',
          priority: 2,
          estimatedTime: 5000
        });
        break;

      case 'secure':
        plans.push({
          description: 'Run security audit',
          priority: 1,
          parameters: { 
            tools: ['eslint-security', 'audit'],
            scope: 'dependencies'
          },
          estimatedTime: 15000
        });
        plans.push({
          description: 'Check for common vulnerabilities',
          priority: 1,
          parameters: { 
            checks: ['xss', 'injection', 'auth']
          },
          estimatedTime: 8000
        });
        break;

      case 'debug':
        plans.push({
          description: 'Set up debugging environment',
          priority: 1,
          parameters: { 
            debugger: 'node-inspector',
            breakpoints: 'auto'
          },
          estimatedTime: 3000
        });
        plans.push({
          description: 'Analyze error patterns',
          priority: 2,
          estimatedTime: 5000
        });
        break;

      case 'test':
        plans.push({
          description: 'Generate unit tests',
          priority: 1,
          parameters: { 
            framework: 'jest',
            coverage: 'auto'
          },
          estimatedTime: 10000
        });
        plans.push({
          description: 'Run existing test suite',
          priority: 2,
          estimatedTime: 5000
        });
        break;

      case 'document':
        plans.push({
          description: 'Generate documentation',
          priority: 1,
          parameters: { 
            format: 'jsdoc',
            includeExamples: true
          },
          estimatedTime: 8000
        });
        break;

      case 'style':
        plans.push({
          description: 'Apply code formatting',
          priority: 1,
          parameters: { 
            formatter: 'prettier',
            linter: 'eslint'
          },
          estimatedTime: 2000
        });
        break;

      case 'upgrade':
        plans.push({
          description: 'Check for dependency updates',
          priority: 1,
          parameters: { 
            manager: 'npm',
            security: true
          },
          estimatedTime: 10000
        });
        break;

      default:
        plans.push({
          description: 'Prompt for user clarification',
          priority: 1,
          parameters: { 
            detectedIntent: intent.intentType,
            confidence: intent.confidence
          }
        });
        break;
    }

    return plans;
  }

  /**
   * Calculate confidence score for keyword matches
   * @param intentType - The type of intent
   * @param keyExpressions - Unique keyword matches found
   * @param code - The full code being analyzed
   * @returns Confidence score between 0 and 1
   */
  private calculateKeywordConfidence(
    intentType: string,
    keyExpressions: string[],
    code: string
  ): number {
    const matchCount = keyExpressions.length;
    let confidence = Math.min(0.6 + matchCount * 0.1, 1.0);

    // Boost confidence for matches in comments (likely intentional)
    const commentMatches = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g);
    if (commentMatches) {
      const hasCommentMatch = commentMatches.some(comment => 
        this.intentKeywords[intentType as keyof typeof this.intentKeywords].test(comment)
      );
      if (hasCommentMatch) {
        confidence += 0.15;
      }
    }

    // Reduce confidence for very short code snippets
    if (code.length < 50) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Analyze structural patterns in code to infer intent
   * @param code - The code to analyze
   * @returns Intent analysis or null if no patterns detected
   */
  private analyzeStructuralPatterns(code: string): IntentAnalysis | null {
    // Check for TODO comments first (highest priority for refactor)
    if (/\/\*\s*TODO:/i.test(code) || /\/\/\s*TODO:/i.test(code)) {
      const todoMatches = code.match(/(\/\*\s*TODO:[^*]*\*\/|\/\/\s*TODO:[^\n]*)/gi) || ['TODO'];
      return this.createIntent(
        'refactor',
        0.7,
        todoMatches,
        {
          pattern: 'todo-comments',
          analysisMethod: 'structural-pattern',
          matches: todoMatches.length
        }
      );
    }

    // Check for test-like function names (high confidence)
    if (/(describe|it|test|expect|should)\s*\(/i.test(code)) {
      const testMatches = code.match(/(describe|it|test|expect|should)\s*\(/gi) || [];
      return this.createIntent(
        'test',
        0.9,
        testMatches,
        {
          pattern: 'test-functions',
          analysisMethod: 'structural-pattern',
          matches: testMatches.length
        }
      );
    }

    // Check for FIXME comments (more specific pattern)
    if (/\/\*\s*FIXME:/i.test(code) || /\/\/\s*FIXME:/i.test(code)) {
      const fixmeMatches = code.match(/(\/\*\s*FIXME:[^*]*\*\/|\/\/\s*FIXME:[^\n]*)/gi) || ['FIXME'];
      return this.createIntent(
        'refactor',
        0.7,
        fixmeMatches,
        {
          pattern: 'todo-comments',
          analysisMethod: 'structural-pattern',
          matches: fixmeMatches.length
        }
      );
    }

    // Check for debug statements (multiple console.log calls)
    const debugMatches = code.match(/console\.(log|debug|warn|error)/gi);
    if (debugMatches && debugMatches.length > 2) {
      return this.createIntent(
        'debug',
        0.6,
        debugMatches,
        {
          pattern: 'debug-statements',
          analysisMethod: 'structural-pattern',
          matches: debugMatches.length
        }
      );
    }

    return null;
  }
}