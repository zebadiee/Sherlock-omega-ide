/**
 * Pattern Intent Analyzer for Sherlock Ω
 * Advanced intent detection using structural and semantic code pattern analysis
 * Combines regex patterns with AST-based analysis for comprehensive pattern detection
 */

import { AbstractIntentAnalyzer } from './AbstractIntentAnalyzer';
import { IntentAnalysis, ActionPlan, PatternLocation } from '@core/interfaces';
import { PatternLibrary, PatternDefinition, getAllCategories } from './PatternLibrary';
import { parse } from '@babel/parser';
import { Node } from '@babel/types';

/**
 * Pattern match result with location information
 */
interface PatternMatch {
  patternName: string;
  definition: PatternDefinition;
  matches: RegExpMatchArray[];
  locations: PatternLocation[];
  totalScore: number;
}

/**
 * AST-based pattern match result
 */
interface ASTPatternMatch {
  patternName: string;
  nodes: Node[];
  locations: PatternLocation[];
  score: number;
}

/**
 * Pattern Intent Analyzer using AST and regex pattern matching
 * Provides deep code pattern understanding for intent detection
 */
export class PatternIntentAnalyzer extends AbstractIntentAnalyzer {
  private readonly categoryWeights: Record<string, number> = {
    'performance': 0.9,
    'security': 1.0,
    'async': 0.8,
    'error-handling': 0.7,
    'maintainability': 0.6,
    'functional': 0.5,
    'modern': 0.4,
    'debugging': 0.8,
    'safety': 0.7
  };

  /**
   * Analyze code to detect structural and semantic patterns
   * @param code - The code to analyze
   * @returns Promise resolving to intent analysis with pattern information
   */
  async analyzeIntent(code: string): Promise<IntentAnalysis> {
    if (!code || code.trim().length === 0) {
      return this.createUnknownIntent();
    }

    try {
      // Scan for regex-based patterns
      const regexMatches = this.scanForPatterns(code);
      
      // Scan for AST-based patterns
      const astMatches = this.scanForASTPatterns(code);
      
      // Combine both types of matches
      const allMatches = [...regexMatches];
      
      // Add AST matches as pattern matches for consistency
      for (const astMatch of astMatches) {
        const existingMatch = allMatches.find(m => m.patternName === astMatch.patternName);
        if (existingMatch) {
          // Merge with existing regex match
          existingMatch.locations.push(...astMatch.locations);
          existingMatch.totalScore += astMatch.score;
        } else {
          // Create new pattern match from AST match
          const definition = PatternLibrary[astMatch.patternName];
          if (definition) {
            allMatches.push({
              patternName: astMatch.patternName,
              definition,
              matches: [], // AST matches don't have regex matches
              locations: astMatch.locations,
              totalScore: astMatch.score
            });
          }
        }
      }
      
      if (allMatches.length === 0) {
        return this.createUnknownIntent();
      }

      // Determine the primary intent based on pattern analysis
      const primaryIntent = this.determinePrimaryIntent(allMatches);
      
      // Calculate overall confidence based on pattern matches
      const confidence = this.calculatePatternConfidence(allMatches, code);
      
      // Collect all pattern locations
      const allLocations = allMatches.flatMap(match => match.locations);
      
      // Determine the most significant pattern type
      const dominantPattern = allMatches.reduce((prev, current) => 
        current.totalScore > prev.totalScore ? current : prev
      );

      return this.createIntent(
        primaryIntent,
        confidence,
        allMatches.map(match => match.patternName),
        {
          analysisMethod: 'hybrid-pattern-matching',
          patternType: dominantPattern.patternName,
          patternLocation: allLocations,
          codeLength: code.length,
          matchCount: allMatches.reduce((sum, match) => sum + match.matches.length + match.locations.length, 0),
          detectedPatterns: allMatches.map(match => ({
            name: match.patternName,
            category: match.definition.metadata.category,
            count: Math.max(match.matches.length, match.locations.length),
            score: match.totalScore
          }))
        }
      );

    } catch (error) {
      console.error('Error in pattern analysis:', error);
      return this.createUnknownIntent();
    }
  }

  /**
   * Suggest actions based on detected patterns
   * @param intent - The analyzed intent with pattern information
   * @returns Array of suggested action plans
   */
  suggestNextActions(intent: IntentAnalysis): ActionPlan[] {
    const plans: ActionPlan[] = [];

    if (!this.isConfidentIntent(intent) || !intent.context?.detectedPatterns) {
      plans.push({
        description: 'Code patterns detected but confidence is low - manual review recommended',
        priority: 2,
        parameters: {
          confidence: intent.confidence,
          reason: 'Low confidence in pattern detection'
        }
      });
      return plans;
    }

    // Generate actions based on detected patterns
    const detectedPatterns = intent.context.detectedPatterns as any[];
    
    for (const pattern of detectedPatterns) {
      const patternDef = PatternLibrary[pattern.name];
      if (!patternDef) continue;

      const action = this.createActionForPattern(pattern, patternDef);
      if (action) {
        plans.push(action);
      }
    }

    // Add category-specific recommendations
    const categories = [...new Set(detectedPatterns.map((p: any) => p.category))];
    for (const category of categories) {
      const categoryAction = this.createCategoryAction(category, intent);
      if (categoryAction) {
        plans.push(categoryAction);
      }
    }

    // Sort by priority and severity
    return plans.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Scan code for all patterns in the pattern library
   * @param code - Code to scan
   * @returns Array of pattern matches with locations
   */
  private scanForPatterns(code: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [patternName, definition] of Object.entries(PatternLibrary)) {
      const regexMatches = Array.from(code.matchAll(definition.regex));
      
      if (regexMatches.length > 0) {
        const locations: PatternLocation[] = regexMatches.map(match => {
          const location = definition.extractLocation 
            ? definition.extractLocation(match, code)
            : this.getLocationFromMatch(match, code);
          
          return {
            ...location,
            patternName
          };
        });

        const totalScore = regexMatches.length * definition.metadata.severityScore;

        matches.push({
          patternName,
          definition,
          matches: regexMatches,
          locations,
          totalScore
        });
      }
    }

    return matches.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Determine primary intent based on pattern matches
   * @param patternMatches - Array of pattern matches
   * @returns Primary intent type
   */
  private determinePrimaryIntent(patternMatches: PatternMatch[]): string {
    if (patternMatches.length === 0) return 'unknown';

    // Group patterns by category and calculate weighted scores
    const categoryScores: Record<string, number> = {};
    
    for (const match of patternMatches) {
      const category = match.definition.metadata.category;
      const weight = this.categoryWeights[category] || 0.5;
      const score = match.totalScore * weight;
      
      categoryScores[category] = (categoryScores[category] || 0) + score;
    }

    // Find the dominant category
    const dominantCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Map categories to intent types
    const categoryToIntent: Record<string, string> = {
      'performance': 'optimize',
      'security': 'secure',
      'async': 'refactor',
      'error-handling': 'debug',
      'maintainability': 'refactor',
      'functional': 'refactor',
      'modern': 'refactor',
      'debugging': 'debug',
      'safety': 'secure'
    };

    return categoryToIntent[dominantCategory] || 'refactor';
  }

  /**
   * Calculate confidence based on pattern matches
   * @param patternMatches - Array of pattern matches
   * @param code - Original code
   * @returns Confidence score between 0 and 1
   */
  private calculatePatternConfidence(patternMatches: PatternMatch[], code: string): number {
    if (patternMatches.length === 0) return 0;

    // Base confidence from pattern detection
    let confidence = 0.6;

    // Boost confidence based on number of patterns
    confidence += Math.min(0.2, patternMatches.length * 0.05);

    // Boost confidence based on total severity scores
    const totalScore = patternMatches.reduce((sum, match) => sum + match.totalScore, 0);
    const normalizedScore = Math.min(1.0, totalScore / 3.0); // Normalize to reasonable range
    confidence += normalizedScore * 0.2;

    // Boost confidence for high-severity patterns
    const hasHighSeverityPattern = patternMatches.some(match => 
      match.definition.metadata.severityScore >= 0.8
    );
    if (hasHighSeverityPattern) {
      confidence += 0.1;
    }

    // Slight penalty for very short code
    if (code.length < 100) {
      confidence -= 0.05;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Create action plan for a specific pattern
   * @param pattern - Pattern information
   * @param definition - Pattern definition
   * @returns Action plan or null
   */
  private createActionForPattern(pattern: any, definition: PatternDefinition): ActionPlan | null {
    const priority = this.getPriorityFromSeverity(definition.metadata.severityScore);
    
    return {
      description: definition.metadata.suggestedAction,
      priority,
      parameters: {
        patternName: pattern.name,
        category: pattern.category,
        matchCount: pattern.count,
        severityScore: definition.metadata.severityScore,
        patternLocations: pattern.locations
      },
      estimatedTime: this.getEstimatedTimeForPattern(definition.metadata.category)
    };
  }

  /**
   * Create category-specific action
   * @param category - Pattern category
   * @param intent - Intent analysis
   * @returns Action plan or null
   */
  private createCategoryAction(category: string, intent: IntentAnalysis): ActionPlan | null {
    const categoryActions: Record<string, ActionPlan> = {
      'performance': {
        description: 'Run performance profiling and optimization analysis',
        priority: 1,
        parameters: { 
          category,
          tool: 'performance-profiler',
          patterns: intent.context?.detectedPatterns
        },
        estimatedTime: 15000
      },
      'security': {
        description: 'Conduct security audit and vulnerability assessment',
        priority: 1,
        parameters: { 
          category,
          tools: ['eslint-security', 'audit'],
          patterns: intent.context?.detectedPatterns
        },
        estimatedTime: 20000
      },
      'async': {
        description: 'Review async/await patterns and Promise handling',
        priority: 2,
        parameters: { 
          category,
          focus: 'async-patterns',
          patterns: intent.context?.detectedPatterns
        },
        estimatedTime: 10000
      },
      'error-handling': {
        description: 'Analyze error handling coverage and exception paths',
        priority: 2,
        parameters: { 
          category,
          focus: 'error-coverage',
          patterns: intent.context?.detectedPatterns
        },
        estimatedTime: 8000
      }
    };

    return categoryActions[category] || null;
  }

  /**
   * Get priority based on severity score
   * @param severityScore - Severity score (0-1)
   * @returns Priority level (1-3)
   */
  private getPriorityFromSeverity(severityScore: number): number {
    if (severityScore >= 0.8) return 1; // High priority
    if (severityScore >= 0.5) return 2; // Medium priority
    return 3; // Low priority
  }

  /**
   * Get estimated time for pattern category
   * @param category - Pattern category
   * @returns Estimated time in milliseconds
   */
  private getEstimatedTimeForPattern(category: string): number {
    const timeMap: Record<string, number> = {
      'performance': 12000,
      'security': 15000,
      'async': 8000,
      'error-handling': 6000,
      'maintainability': 10000,
      'functional': 5000,
      'modern': 3000,
      'debugging': 4000,
      'safety': 7000
    };

    return timeMap[category] || 5000;
  }

  /**
   * Scan code for AST-based patterns
   * @param code - Code to scan
   * @returns Array of AST pattern matches
   */
  private scanForASTPatterns(code: string): ASTPatternMatch[] {
    const matches: ASTPatternMatch[] = [];

    try {
      // Parse the code into an AST
      const ast = parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'typescript',
          'jsx',
          'asyncGenerators',
          'bigInt',
          'classProperties',
          'decorators-legacy',
          'doExpressions',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'functionSent',
          'importMeta',
          'nullishCoalescingOperator',
          'numericSeparator',
          'objectRestSpread',
          'optionalCatchBinding',
          'optionalChaining',
          'throwExpressions',
          'topLevelAwait'
        ]
      });

      // Walk the AST to find patterns
      this.walkAST(ast, matches, code);

    } catch (error) {
      // If AST parsing fails, fall back to regex-only analysis
      console.debug('AST parsing failed, using regex-only analysis:', error);
    }

    return matches;
  }

  /**
   * Walk the AST to detect patterns
   * @param node - Current AST node
   * @param matches - Array to collect matches
   * @param code - Original code for location calculation
   */
  private walkAST(node: any, matches: ASTPatternMatch[], code: string): void {
    if (!node || typeof node !== 'object') return;

    // Check for specific AST patterns
    this.checkASTPatterns(node, matches, code);

    // Recursively walk child nodes
    for (const key in node) {
      if (key === 'parent' || key === 'leadingComments' || key === 'trailingComments') {
        continue; // Skip parent references and comments to avoid cycles
      }
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walkAST(item, matches, code));
      } else if (child && typeof child === 'object') {
        this.walkAST(child, matches, code);
      }
    }
  }

  /**
   * Check for specific AST patterns
   * @param node - AST node to check
   * @param matches - Array to collect matches
   * @param code - Original code
   */
  private checkASTPatterns(node: any, matches: ASTPatternMatch[], code: string): void {
    if (!node.type) return;

    const location = this.getLocationFromASTNode(node, code);

    switch (node.type) {
      case 'ForStatement':
        this.addASTMatch(matches, 'for-loop', [node], [location]);
        
        // Check for nested loops
        if (this.hasNestedLoop(node)) {
          this.addASTMatch(matches, 'nested-loops', [node], [location]);
        }
        break;

      case 'WhileStatement':
        this.addASTMatch(matches, 'while-loop', [node], [location]);
        break;

      case 'FunctionDeclaration':
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        if (node.async) {
          this.addASTMatch(matches, 'async-function', [node], [location]);
        }
        break;

      case 'AwaitExpression':
        this.addASTMatch(matches, 'await-usage', [node], [location]);
        break;

      case 'TryStatement':
        this.addASTMatch(matches, 'try-catch', [node], [location]);
        break;

      case 'ThrowStatement':
        this.addASTMatch(matches, 'throw-statement', [node], [location]);
        break;

      case 'CallExpression':
        if (this.isEvalCall(node)) {
          this.addASTMatch(matches, 'eval-usage', [node], [location]);
        } else if (this.isConsoleErrorCall(node)) {
          this.addASTMatch(matches, 'console-error', [node], [location]);
        } else if (this.isArrayMethod(node, 'map')) {
          this.addASTMatch(matches, 'array-map', [node], [location]);
        } else if (this.isArrayMethod(node, 'filter')) {
          this.addASTMatch(matches, 'array-filter', [node], [location]);
        }
        break;

      case 'OptionalMemberExpression':
      case 'MemberExpression':
        if (node.optional) {
          this.addASTMatch(matches, 'optional-chaining', [node], [location]);
        }
        break;

      case 'LogicalExpression':
        if (node.operator === '??') {
          this.addASTMatch(matches, 'nullish-coalescing', [node], [location]);
        }
        break;

      case 'BinaryExpression':
        if (this.isNullCheck(node)) {
          this.addASTMatch(matches, 'null-check-equality', [node], [location]);
        } else if (this.isUndefinedCheck(node)) {
          this.addASTMatch(matches, 'undefined-check', [node], [location]);
        }
        break;
    }
  }

  /**
   * Add an AST match to the matches array
   */
  private addASTMatch(matches: ASTPatternMatch[], patternName: string, nodes: Node[], locations: PatternLocation[]): void {
    const definition = PatternLibrary[patternName];
    if (!definition) return;

    const existingMatch = matches.find(m => m.patternName === patternName);
    if (existingMatch) {
      existingMatch.nodes.push(...nodes);
      existingMatch.locations.push(...locations);
      existingMatch.score += definition.metadata.severityScore;
    } else {
      matches.push({
        patternName,
        nodes,
        locations: locations.map(loc => ({ ...loc, patternName })),
        score: definition.metadata.severityScore
      });
    }
  }

  /**
   * Check if a for loop has nested loops
   */
  private hasNestedLoop(forNode: any): boolean {
    // Simple check for nested for/while statements
    const body = forNode.body;
    if (!body) return false;

    const statements = body.type === 'BlockStatement' ? body.body : [body];
    return statements.some((stmt: any) => 
      stmt.type === 'ForStatement' || 
      stmt.type === 'WhileStatement' ||
      stmt.type === 'DoWhileStatement'
    );
  }

  /**
   * Check if a call expression is eval()
   */
  private isEvalCall(node: any): boolean {
    return node.callee && node.callee.type === 'Identifier' && node.callee.name === 'eval';
  }

  /**
   * Check if a call expression is console.error/warn
   */
  private isConsoleErrorCall(node: any): boolean {
    return node.callee && 
           node.callee.type === 'MemberExpression' &&
           node.callee.object && 
           node.callee.object.name === 'console' &&
           node.callee.property &&
           (node.callee.property.name === 'error' || node.callee.property.name === 'warn');
  }

  /**
   * Check if a call expression is an array method
   */
  private isArrayMethod(node: any, methodName: string): boolean {
    return node.callee && 
           node.callee.type === 'MemberExpression' &&
           node.callee.property &&
           node.callee.property.name === methodName;
  }

  /**
   * Check if a binary expression is a null check
   */
  private isNullCheck(node: any): boolean {
    if (node.operator !== '===' && node.operator !== '!==' && 
        node.operator !== '==' && node.operator !== '!=') {
      return false;
    }
    
    return (node.left && node.left.type === 'Literal' && node.left.value === null) ||
           (node.right && node.right.type === 'Literal' && node.right.value === null);
  }

  /**
   * Check if a binary expression is an undefined check
   */
  private isUndefinedCheck(node: any): boolean {
    if (node.operator !== '===' && node.operator !== '!==' && 
        node.operator !== '==' && node.operator !== '!=') {
      return false;
    }
    
    return (node.left && node.left.type === 'Identifier' && node.left.name === 'undefined') ||
           (node.right && node.right.type === 'Identifier' && node.right.name === 'undefined');
  }

  /**
   * Get location from AST node
   * @param node - AST node
   * @param code - Original code
   * @returns Location information
   */
  private getLocationFromASTNode(node: any, code: string): { line: number; column: number } {
    if (node.loc && node.loc.start) {
      return {
        line: node.loc.start.line,
        column: node.loc.start.column + 1
      };
    }
    
    // Fallback to start position if available
    if (node.start !== undefined) {
      return this.getLocationFromIndex(code, node.start);
    }
    
    return { line: 1, column: 1 };
  }

  /**
   * Get location from character index
   * @param code - Original code
   * @param index - Character index
   * @returns Location information
   */
  private getLocationFromIndex(code: string, index: number): { line: number; column: number } {
    const lines = code.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  /**
   * Get location from regex match
   * @param match - Regex match array
   * @param code - Original code
   * @returns Location information
   */
  private getLocationFromMatch(match: RegExpMatchArray, code: string): { line: number; column: number } {
    const index = match.index || 0;
    const lines = code.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }
}