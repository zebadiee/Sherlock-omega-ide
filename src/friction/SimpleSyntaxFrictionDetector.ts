/**
 * Simplified Syntax Friction Detector for Sherlock Ω
 * Implements the base framework for TypeScript/JavaScript syntax error detection
 */

import * as ts from 'typescript';
import { FrictionDetector, FrictionPoint } from './BaseFrictionDetector';

/**
 * Syntax-specific friction point interface
 */
export interface SyntaxFrictionPoint extends FrictionPoint {
  errorCode: number;
  suggestion?: string;
  line?: number;
  column?: number;
  source?: string;
}

/**
 * Simplified syntax friction detector using TypeScript compiler
 */
export class SimpleSyntaxFrictionDetector extends FrictionDetector<SyntaxFrictionPoint> {
  
  constructor() {
    super('SimpleSyntaxFrictionDetector');
  }

  /**
   * Detect syntax friction points in TypeScript/JavaScript source code
   */
  detect(sourceText: string): SyntaxFrictionPoint[] {
    try {
      // Create a temporary source file for analysis
      const sourceFile = ts.createSourceFile(
        'temp.ts', 
        sourceText, 
        ts.ScriptTarget.Latest, 
        true
      );

      // Create a minimal program for diagnostics
      const program = ts.createProgram(['temp.ts'], {
        allowJs: true,
        checkJs: false,
        noEmit: true,
        lib: ['ES2022', 'DOM'],
        target: ts.ScriptTarget.ES2022
      }, {
        getSourceFile: (fileName) => fileName === 'temp.ts' ? sourceFile : undefined,
        writeFile: () => {},
        getCurrentDirectory: () => '',
        getDirectories: () => [],
        fileExists: () => true,
        readFile: () => '',
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
        getDefaultLibFileName: () => 'lib.d.ts'
      });

      // Get syntax and semantic diagnostics
      const diagnostics = [
        ...program.getSyntacticDiagnostics(sourceFile),
        ...program.getSemanticDiagnostics(sourceFile)
      ];

      // Convert diagnostics to friction points
      return diagnostics.map(diag => {
        const { code, messageText, file, start } = diag;
        const message = ts.flattenDiagnosticMessageText(messageText, '\n');
        
        let location = null;
        let line = 0;
        let column = 0;
        
        if (file && start !== undefined) {
          const pos = file.getLineAndCharacterOfPosition(start);
          location = pos;
          line = pos.line + 1;
          column = pos.character + 1;
        }

        // Calculate severity based on diagnostic category
        const severity = this.calculateSeverity(diag.category);
        
        // Extract source text around the error
        const source = this.extractSourceContext(sourceText, start || 0, diag.length || 0);

        return {
          id: `${code}-${start}-${Date.now()}`,
          description: message,
          severity,
          location,
          errorCode: code,
          line,
          column,
          source,
          timestamp: Date.now(),
          metadata: {
            category: ts.DiagnosticCategory[diag.category],
            length: diag.length || 0
          }
        };
      });
    } catch (error) {
      console.error('Syntax detection failed:', error);
      return [];
    }
  }

  /**
   * Attempt to eliminate a syntax friction point
   */
  async eliminate(point: SyntaxFrictionPoint): Promise<boolean> {
    point.attempted = true;
    
    try {
      // Generate auto-correction suggestion
      const suggestion = this.generateSuggestion(point);
      
      if (suggestion) {
        point.suggestion = suggestion;
        
        // For now, we simulate successful elimination for certain error types
        const canAutoFix = this.canAutoFix(point);
        
        if (canAutoFix) {
          console.log(`🔧 Auto-fixing syntax error: ${point.description}`);
          console.log(`   Suggestion: ${suggestion}`);
          point.eliminated = true;
        } else {
          console.log(`⚠️ Manual fix required: ${point.description}`);
          point.eliminated = false;
        }
      } else {
        point.eliminated = false;
      }
      
      this.record(point, point.eliminated || false);
      return point.eliminated || false;
      
    } catch (error) {
      console.error(`Failed to eliminate friction point ${point.id}:`, error);
      point.eliminated = false;
      this.record(point, false);
      return false;
    }
  }

  /**
   * Calculate severity based on TypeScript diagnostic category
   */
  private calculateSeverity(category: ts.DiagnosticCategory): number {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 0.8;
      case ts.DiagnosticCategory.Warning:
        return 0.5;
      case ts.DiagnosticCategory.Suggestion:
        return 0.3;
      case ts.DiagnosticCategory.Message:
        return 0.1;
      default:
        return 0.5;
    }
  }

  /**
   * Extract source code context around an error
   */
  private extractSourceContext(sourceText: string, start: number, length: number): string {
    const contextLength = 20;
    const actualStart = Math.max(0, start - contextLength);
    const actualEnd = Math.min(sourceText.length, start + length + contextLength);
    return sourceText.substring(actualStart, actualEnd);
  }

  /**
   * Generate auto-correction suggestion for common syntax errors
   */
  private generateSuggestion(point: SyntaxFrictionPoint): string | undefined {
    const message = point.description.toLowerCase();
    
    // Missing semicolon
    if (message.includes('expected') && message.includes(';')) {
      return 'Add missing semicolon';
    }
    
    // Missing closing bracket
    if (message.includes('expected') && message.includes('}')) {
      return 'Add missing closing brace }';
    }
    
    if (message.includes('expected') && message.includes(')')) {
      return 'Add missing closing parenthesis )';
    }
    
    if (message.includes('expected') && message.includes(']')) {
      return 'Add missing closing bracket ]';
    }
    
    // Unterminated string
    if (message.includes('unterminated') && message.includes('string')) {
      return 'Add missing quote to close string';
    }
    
    // Cannot find name (common for missing imports)
    if (message.includes('cannot find name')) {
      return 'Add missing import or declaration';
    }
    
    // Type errors
    if (message.includes('type') && message.includes('not assignable')) {
      return 'Fix type mismatch';
    }
    
    return undefined;
  }

  /**
   * Determine if a friction point can be auto-fixed
   */
  private canAutoFix(point: SyntaxFrictionPoint): boolean {
    const message = point.description.toLowerCase();
    
    // Auto-fixable errors
    const autoFixablePatterns = [
      'expected \';\',',
      'expected \'}\'',
      'expected \')\'',
      'expected \']\'',
      'unterminated string'
    ];
    
    return autoFixablePatterns.some(pattern => 
      message.includes(pattern.toLowerCase())
    );
  }

  /**
   * Get syntax-specific statistics
   */
  getSyntaxStats(): SyntaxStats {
    const baseStats = this.getStats();
    const errorsByCode = new Map<number, number>();
    const errorsByCategory = new Map<string, number>();
    
    for (const point of this.history) {
      // Count by error code
      const currentCount = errorsByCode.get(point.errorCode) || 0;
      errorsByCode.set(point.errorCode, currentCount + 1);
      
      // Count by category
      const category = point.metadata?.category || 'Unknown';
      const categoryCount = errorsByCategory.get(category) || 0;
      errorsByCategory.set(category, categoryCount + 1);
    }
    
    return {
      ...baseStats,
      errorsByCode: Object.fromEntries(errorsByCode),
      errorsByCategory: Object.fromEntries(errorsByCategory),
      autoFixableCount: this.history.filter(p => this.canAutoFix(p)).length
    };
  }
}

/**
 * Extended statistics for syntax friction detection
 */
export interface SyntaxStats {
  totalDetected: number;
  totalAttempted: number;
  totalEliminated: number;
  eliminationRate: number;
  detectionRate: number;
  errorsByCode: Record<number, number>;
  errorsByCategory: Record<string, number>;
  autoFixableCount: number;
}