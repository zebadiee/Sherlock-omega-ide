/**
 * Real Pattern Keeper - Actual Code Analysis Implementation
 * Detects real patterns, syntax errors, and optimization opportunities
 */

import { Logger } from '../../logging/logger';
import { PlatformType } from '../../core/whispering-interfaces';

export interface CodePattern {
  type: 'syntax-error' | 'optimization' | 'best-practice' | 'complexity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  confidence: number;
}

export interface AnalysisResult {
  patterns: CodePattern[];
  overallScore: number;
  suggestions: string[];
}

export class RealPatternKeeper {
  private logger: Logger;
  private platform: PlatformType;

  constructor(platform: PlatformType) {
    this.platform = platform;
    this.logger = new Logger(platform);
  }

  async analyzeCode(code: string, language: string = 'typescript'): Promise<AnalysisResult> {
    this.logger.info('🔍 Analyzing code for patterns and issues');
    
    const patterns: CodePattern[] = [];
    
    try {
      // Detect syntax errors
      patterns.push(...this.detectSyntaxErrors(code));
      
      // Detect optimization opportunities
      patterns.push(...this.detectOptimizations(code));
      
      // Detect best practice violations
      patterns.push(...this.detectBestPractices(code));
      
      // Detect complexity issues
      patterns.push(...this.detectComplexityIssues(code));
      
      const overallScore = this.calculateOverallScore(patterns);
      const suggestions = this.generateSuggestions(patterns);
      
      this.logger.info(`📊 Analysis complete: ${patterns.length} patterns found, score: ${overallScore}`);
      
      return {
        patterns,
        overallScore,
        suggestions
      };
      
    } catch (error) {
      this.logger.error('Pattern analysis failed:', {}, error as Error);
      return {
        patterns: [],
        overallScore: 0.5,
        suggestions: ['Analysis failed - please check code syntax']
      };
    }
  }

  private detectSyntaxErrors(code: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // Check for common syntax errors
      
      // Missing semicolons (basic check)
      if (this.isMissingSemicolon(line)) {
        patterns.push({
          type: 'syntax-error',
          severity: 'medium',
          message: 'Missing semicolon',
          line: index + 1,
          suggestion: 'Add semicolon at end of statement',
          confidence: 0.8
        });
      }
      
      // Unmatched brackets
      if (this.hasUnmatchedBrackets(line)) {
        patterns.push({
          type: 'syntax-error',
          severity: 'high',
          message: 'Unmatched brackets',
          line: index + 1,
          suggestion: 'Check bracket pairing',
          confidence: 0.9
        });
      }
      
      // Undefined variables (basic check)
      if (this.hasUndefinedVariable(line)) {
        patterns.push({
          type: 'syntax-error',
          severity: 'high',
          message: 'Potentially undefined variable',
          line: index + 1,
          suggestion: 'Declare variable before use',
          confidence: 0.7
        });
      }
    });
    
    return patterns;
  }

  private detectOptimizations(code: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // Detect inefficient array operations
    if (code.includes('.indexOf(') && code.includes('!== -1')) {
      patterns.push({
        type: 'optimization',
        severity: 'medium',
        message: 'Use .includes() instead of .indexOf() !== -1',
        suggestion: 'Replace .indexOf() !== -1 with .includes()',
        confidence: 0.9
      });
    }
    
    // Detect potential Set usage
    const includesMatches = code.match(/\.includes\([^)]+\)/g);
    if (includesMatches && includesMatches.length > 2) {
      patterns.push({
        type: 'optimization',
        severity: 'medium',
        message: 'Consider using Set for frequent lookups',
        suggestion: 'Use Set data structure for O(1) lookups',
        confidence: 0.8
      });
    }
    
    // Detect nested loops
    if (code.match(/for\s*\([^}]*for\s*\(/s)) {
      patterns.push({
        type: 'optimization',
        severity: 'high',
        message: 'Nested loops detected - potential O(n²) complexity',
        suggestion: 'Consider optimizing algorithm or using different data structures',
        confidence: 0.85
      });
    }
    
    // Detect string concatenation in loops
    if (code.match(/for\s*\([^}]*\+=/s) && code.includes('string')) {
      patterns.push({
        type: 'optimization',
        severity: 'medium',
        message: 'String concatenation in loop',
        suggestion: 'Use array.join() or template literals for better performance',
        confidence: 0.8
      });
    }
    
    return patterns;
  }

  private detectBestPractices(code: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // Detect var usage
    if (code.includes('var ')) {
      patterns.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Use let or const instead of var',
        suggestion: 'Replace var with let or const for better scoping',
        confidence: 0.9
      });
    }
    
    // Detect == instead of ===
    if (code.includes('==') && !code.includes('===')) {
      patterns.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Use strict equality (===) instead of loose equality (==)',
        suggestion: 'Replace == with === for type-safe comparisons',
        confidence: 0.85
      });
    }
    
    // Detect missing error handling
    if (code.includes('async ') && !code.includes('try') && !code.includes('catch')) {
      patterns.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Async function without error handling',
        suggestion: 'Add try-catch block for async operations',
        confidence: 0.7
      });
    }
    
    // Detect console.log in production-like code
    if (code.includes('console.log') && code.length > 500) {
      patterns.push({
        type: 'best-practice',
        severity: 'low',
        message: 'Console.log statements found',
        suggestion: 'Consider using proper logging or removing debug statements',
        confidence: 0.6
      });
    }
    
    return patterns;
  }

  private detectComplexityIssues(code: string): CodePattern[] {
    const patterns: CodePattern[] = [];
    const lines = code.split('\n');
    
    // Detect long functions
    const functionMatches = code.match(/function\s+\w+[^}]*{[^}]*}/gs) || [];
    functionMatches.forEach(func => {
      const funcLines = func.split('\n').length;
      if (funcLines > 20) {
        patterns.push({
          type: 'complexity',
          severity: 'medium',
          message: `Function is ${funcLines} lines long`,
          suggestion: 'Consider breaking down into smaller functions',
          confidence: 0.8
        });
      }
    });
    
    // Detect high cyclomatic complexity
    const complexity = this.calculateCyclomaticComplexity(code);
    if (complexity > 10) {
      patterns.push({
        type: 'complexity',
        severity: 'high',
        message: `High cyclomatic complexity: ${complexity}`,
        suggestion: 'Simplify control flow and reduce branching',
        confidence: 0.9
      });
    }
    
    // Detect deeply nested code
    lines.forEach((line, index) => {
      const indentLevel = (line.match(/^\s*/)?.[0].length || 0) / 2;
      if (indentLevel > 4) {
        patterns.push({
          type: 'complexity',
          severity: 'medium',
          message: 'Deeply nested code',
          line: index + 1,
          suggestion: 'Consider extracting nested logic into separate functions',
          confidence: 0.7
        });
      }
    });
    
    return patterns;
  }

  private isMissingSemicolon(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return false;
    }
    
    // Check if line should end with semicolon
    const shouldHaveSemicolon = /^(let|const|var|return|throw|break|continue)\s+/.test(trimmed) ||
                               /=\s*[^{]+$/.test(trimmed) ||
                               /\w+\([^)]*\)$/.test(trimmed);
    
    return shouldHaveSemicolon && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}');
  }

  private hasUnmatchedBrackets(line: string): boolean {
    let count = 0;
    for (const char of line) {
      if (char === '(' || char === '[' || char === '{') count++;
      if (char === ')' || char === ']' || char === '}') count--;
    }
    return count !== 0;
  }

  private hasUndefinedVariable(line: string): boolean {
    // Very basic check - look for variables that might not be defined
    const match = line.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[^=]/);
    if (!match) return false;
    
    const variable = match[1];
    const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const', 'true', 'false', 'null', 'undefined'];
    
    return !keywords.includes(variable) && !line.includes(`${variable} =`) && !line.includes(`let ${variable}`) && !line.includes(`const ${variable}`);
  }

  private calculateCyclomaticComplexity(code: string): number {
    const decisionPoints = (code.match(/if|else|while|for|switch|case|\?|&&|\|\||catch/g) || []).length;
    return decisionPoints + 1;
  }

  private calculateOverallScore(patterns: CodePattern[]): number {
    if (patterns.length === 0) return 1.0;
    
    let totalDeduction = 0;
    patterns.forEach(pattern => {
      const severityWeight = pattern.severity === 'high' ? 0.3 : pattern.severity === 'medium' ? 0.2 : 0.1;
      totalDeduction += severityWeight * pattern.confidence;
    });
    
    return Math.max(0, 1.0 - totalDeduction);
  }

  private generateSuggestions(patterns: CodePattern[]): string[] {
    const suggestions: string[] = [];
    
    // Group patterns by type
    const syntaxErrors = patterns.filter(p => p.type === 'syntax-error');
    const optimizations = patterns.filter(p => p.type === 'optimization');
    const bestPractices = patterns.filter(p => p.type === 'best-practice');
    const complexity = patterns.filter(p => p.type === 'complexity');
    
    if (syntaxErrors.length > 0) {
      suggestions.push(`Fix ${syntaxErrors.length} syntax error(s) first`);
    }
    
    if (optimizations.length > 0) {
      suggestions.push(`${optimizations.length} optimization opportunity(ies) found`);
    }
    
    if (bestPractices.length > 0) {
      suggestions.push(`Consider ${bestPractices.length} best practice improvement(s)`);
    }
    
    if (complexity.length > 0) {
      suggestions.push(`Simplify ${complexity.length} complex code section(s)`);
    }
    
    if (patterns.length === 0) {
      suggestions.push('Code looks good! No major issues detected.');
    }
    
    return suggestions;
  }

  // Public API for integration
  async quickAnalysis(code: string): Promise<string[]> {
    const result = await this.analyzeCode(code);
    return result.suggestions;
  }

  async findIssues(code: string): Promise<CodePattern[]> {
    const result = await this.analyzeCode(code);
    return result.patterns.filter(p => p.severity === 'high' || p.type === 'syntax-error');
  }

  async getScore(code: string): Promise<number> {
    const result = await this.analyzeCode(code);
    return result.overallScore;
  }
}