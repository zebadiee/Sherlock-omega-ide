/**
 * Syntax Sensor for Sherlock Ω Omniscient Monitoring System
 * Monitors code syntax in real-time with AST parsing and validation
 */

import { BaseSensor, SensorConfig } from './BaseSensor';
import { 
  SensorType, 
  SensorResult, 
  ComputationalIssue, 
  ProblemType, 
  SeverityLevel,
  ProblemContext,
  ProblemMetadata 
} from '@types/core';

/**
 * Language-specific syntax parser interface
 */
export interface SyntaxParser {
  language: string;
  extensions: string[];
  parse(code: string, filename: string): Promise<SyntaxParseResult>;
  validate(ast: any): SyntaxValidationResult[];
}

/**
 * Result of syntax parsing
 */
export interface SyntaxParseResult {
  success: boolean;
  ast?: any;
  errors: SyntaxError[];
  warnings: SyntaxWarning[];
}

/**
 * Syntax error with position information
 */
export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  code?: string;
  suggestion?: string;
}

/**
 * Syntax warning
 */
export interface SyntaxWarning {
  message: string;
  line: number;
  column: number;
  code?: string;
  suggestion?: string;
}

/**
 * Syntax validation result
 */
export interface SyntaxValidationResult {
  type: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  rule: string;
  suggestion?: string;
}

/**
 * File monitoring information
 */
export interface FileMonitorInfo {
  path: string;
  content: string;
  lastModified: number;
  language: string;
  isActive: boolean; // Currently being edited
}

/**
 * TypeScript/JavaScript syntax parser implementation
 */
export class TypeScriptParser implements SyntaxParser {
  public readonly language = 'typescript';
  public readonly extensions = ['.ts', '.tsx', '.js', '.jsx'];

  async parse(code: string, filename: string): Promise<SyntaxParseResult> {
    try {
      // Simulate TypeScript parsing (in real implementation, would use TypeScript compiler API)
      const ast = this.parseWithTypeScript(code, filename);
      const errors = this.extractSyntaxErrors(code);
      const warnings = this.extractSyntaxWarnings(code);

      return {
        success: errors.length === 0,
        ast,
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          message: (error as Error).message,
          line: 1,
          column: 1,
          severity: 'error' as const
        }],
        warnings: []
      };
    }
  }

  validate(ast: any): SyntaxValidationResult[] {
    const results: SyntaxValidationResult[] = [];
    
    // Simulate AST validation rules
    if (ast && ast.type === 'Program') {
      // Check for common issues
      results.push(...this.validateVariableDeclarations(ast));
      results.push(...this.validateFunctionDeclarations(ast));
      results.push(...this.validateImportStatements(ast));
    }

    return results;
  }

  private parseWithTypeScript(code: string, filename: string): any {
    // Simplified AST structure for demonstration
    // In real implementation, would use TypeScript compiler API
    return {
      type: 'Program',
      body: [],
      sourceType: 'module',
      filename
    };
  }

  private extractSyntaxErrors(code: string): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for common syntax errors
      if (line.includes('function') && !line.includes('(')) {
        errors.push({
          message: 'Expected "(" after function name',
          line: lineNumber,
          column: line.indexOf('function') + 8,
          severity: 'error',
          code: 'TS1005',
          suggestion: 'Add parentheses after function name'
        });
      }

      // Check for missing semicolons (simplified)
      if (line.trim().match(/^(let|const|var)\s+\w+\s*=.*[^;]$/)) {
        errors.push({
          message: 'Missing semicolon',
          line: lineNumber,
          column: line.length,
          severity: 'warning',
          code: 'TS1005',
          suggestion: 'Add semicolon at end of statement'
        });
      }

      // Check for unmatched brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push({
          message: 'Unmatched brackets',
          line: lineNumber,
          column: line.lastIndexOf(openBrackets > closeBrackets ? '{' : '}') + 1,
          severity: 'error',
          code: 'TS1005',
          suggestion: 'Check bracket matching'
        });
      }
    });

    return errors;
  }

  private extractSyntaxWarnings(code: string): SyntaxWarning[] {
    const warnings: SyntaxWarning[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for unused variables (simplified)
      if (line.includes('let ') || line.includes('const ')) {
        const match = line.match(/(let|const)\s+(\w+)/);
        if (match && !code.includes(match[2] + '.') && !code.includes(match[2] + '(')) {
          warnings.push({
            message: `Variable '${match[2]}' is declared but never used`,
            line: lineNumber,
            column: line.indexOf(match[2]),
            code: 'TS6133',
            suggestion: `Remove unused variable '${match[2]}'`
          });
        }
      }
    });

    return warnings;
  }

  private validateVariableDeclarations(ast: any): SyntaxValidationResult[] {
    // Simulate variable declaration validation
    return [];
  }

  private validateFunctionDeclarations(ast: any): SyntaxValidationResult[] {
    // Simulate function declaration validation
    return [];
  }

  private validateImportStatements(ast: any): SyntaxValidationResult[] {
    // Simulate import statement validation
    return [];
  }
}

/**
 * Syntax Sensor monitors code syntax in real-time
 * Provides immediate feedback on syntax errors and warnings
 */
export class SyntaxSensor extends BaseSensor {
  private parsers: Map<string, SyntaxParser> = new Map();
  private monitoredFiles: Map<string, FileMonitorInfo> = new Map();
  private activeFile: string | null = null;

  constructor(config?: Partial<SensorConfig>) {
    super(SensorType.SYNTAX, {
      monitoringInterval: 50, // Very fast for real-time syntax checking
      sensitivity: 0.9,
      ...config
    });

    // Register default parsers
    this.registerParser(new TypeScriptParser());
  }

  /**
   * Register a syntax parser for a specific language
   */
  public registerParser(parser: SyntaxParser): void {
    this.parsers.set(parser.language, parser);
    console.log(`📝 Registered ${parser.language} syntax parser`);
  }

  /**
   * Add a file to be monitored
   */
  public addFile(path: string, content: string, language?: string): void {
    const detectedLanguage = language || this.detectLanguage(path);
    
    this.monitoredFiles.set(path, {
      path,
      content,
      lastModified: Date.now(),
      language: detectedLanguage,
      isActive: false
    });

    console.log(`👁️ Added file to syntax monitoring: ${path} (${detectedLanguage})`);
  }

  /**
   * Update file content (called when file is modified)
   */
  public updateFile(path: string, content: string): void {
    const fileInfo = this.monitoredFiles.get(path);
    if (fileInfo) {
      fileInfo.content = content;
      fileInfo.lastModified = Date.now();
      console.log(`🔄 Updated file content: ${path}`);
    }
  }

  /**
   * Set the currently active file being edited
   */
  public setActiveFile(path: string): void {
    // Mark previous active file as inactive
    if (this.activeFile) {
      const prevFile = this.monitoredFiles.get(this.activeFile);
      if (prevFile) {
        prevFile.isActive = false;
      }
    }

    // Mark new file as active
    const fileInfo = this.monitoredFiles.get(path);
    if (fileInfo) {
      fileInfo.isActive = true;
      this.activeFile = path;
      console.log(`🎯 Set active file: ${path}`);
    }
  }

  /**
   * Remove file from monitoring
   */
  public removeFile(path: string): void {
    this.monitoredFiles.delete(path);
    if (this.activeFile === path) {
      this.activeFile = null;
    }
    console.log(`🗑️ Removed file from syntax monitoring: ${path}`);
  }

  /**
   * Get syntax errors for a specific file
   */
  public async getFileSyntaxErrors(path: string): Promise<ComputationalIssue[]> {
    const fileInfo = this.monitoredFiles.get(path);
    if (!fileInfo) {
      return [];
    }

    const parser = this.parsers.get(fileInfo.language);
    if (!parser) {
      return [];
    }

    const parseResult = await parser.parse(fileInfo.content, path);
    const issues: ComputationalIssue[] = [];

    // Convert syntax errors to computational issues
    for (const error of parseResult.errors) {
      issues.push(this.createSyntaxIssue(error, path, fileInfo.language));
    }

    // Convert syntax warnings to computational issues
    for (const warning of parseResult.warnings) {
      issues.push(this.createSyntaxIssue(warning, path, fileInfo.language, true));
    }

    // Add AST validation issues
    if (parseResult.ast) {
      const validationResults = parser.validate(parseResult.ast);
      for (const result of validationResults) {
        issues.push(this.createValidationIssue(result, path, fileInfo.language));
      }
    }

    return issues;
  }

  /**
   * Perform syntax monitoring across all files
   */
  protected async performMonitoring(): Promise<SensorResult> {
    const allIssues: ComputationalIssue[] = [];
    const metrics: Record<string, number> = {
      totalFiles: this.monitoredFiles.size,
      activeFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
      parseTime: 0
    };

    const startTime = Date.now();

    // Monitor all files, prioritizing active file
    const filesToMonitor = Array.from(this.monitoredFiles.values())
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.lastModified - a.lastModified; // Most recently modified first
      });

    for (const fileInfo of filesToMonitor) {
      if (fileInfo.isActive) {
        metrics.activeFiles++;
      }

      try {
        const fileIssues = await this.getFileSyntaxErrors(fileInfo.path);
        allIssues.push(...fileIssues);

        // Count errors and warnings
        for (const issue of fileIssues) {
          if (issue.severity >= SeverityLevel.HIGH) {
            metrics.totalErrors++;
          } else {
            metrics.totalWarnings++;
          }
        }
      } catch (error) {
        console.error(`Error monitoring syntax for ${fileInfo.path}:`, error);
        
        // Create an issue for the monitoring error itself
        allIssues.push({
          id: `syntax-monitor-error-${Date.now()}`,
          type: ProblemType.SYNTAX_ERROR,
          severity: SeverityLevel.MEDIUM,
          context: {
            file: fileInfo.path,
            scope: ['monitoring'],
            relatedFiles: []
          },
          preconditions: [],
          postconditions: [],
          constraints: [],
          metadata: {
            detectedAt: Date.now(),
            detectedBy: SensorType.SYNTAX,
            confidence: 1.0,
            tags: ['monitoring-error']
          }
        });
      }
    }

    metrics.parseTime = Date.now() - startTime;

    const status = this.determineStatus(allIssues);
    return this.createSensorResult(status, allIssues, metrics);
  }

  // Private helper methods

  private detectLanguage(path: string): string {
    const extension = path.toLowerCase().substring(path.lastIndexOf('.'));
    
    for (const [language, parser] of this.parsers) {
      if (parser.extensions.includes(extension)) {
        return language;
      }
    }

    return 'unknown';
  }

  private createSyntaxIssue(
    error: SyntaxError | SyntaxWarning, 
    path: string, 
    language: string,
    isWarning: boolean = false
  ): ComputationalIssue {
    const severity = isWarning ? SeverityLevel.LOW : 
                    error.severity === 'error' ? SeverityLevel.HIGH : SeverityLevel.MEDIUM;

    return {
      id: `syntax-${path}-${error.line}-${error.column}-${Date.now()}`,
      type: ProblemType.SYNTAX_ERROR,
      severity,
      context: {
        file: path,
        line: error.line,
        column: error.column,
        scope: [language],
        relatedFiles: []
      },
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: SensorType.SYNTAX,
        confidence: 0.95,
        tags: [
          'syntax',
          language,
          error.code || 'unknown',
          ...(error.suggestion ? ['has-suggestion'] : [])
        ]
      }
    };
  }

  private createValidationIssue(
    result: SyntaxValidationResult,
    path: string,
    language: string
  ): ComputationalIssue {
    const severity = result.type === 'error' ? SeverityLevel.HIGH : SeverityLevel.LOW;

    return {
      id: `validation-${path}-${result.line}-${result.column}-${Date.now()}`,
      type: ProblemType.SYNTAX_ERROR,
      severity,
      context: {
        file: path,
        line: result.line,
        column: result.column,
        scope: [language, 'validation'],
        relatedFiles: []
      },
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: SensorType.SYNTAX,
        confidence: 0.9,
        tags: [
          'validation',
          language,
          result.rule,
          ...(result.suggestion ? ['has-suggestion'] : [])
        ]
      }
    };
  }
}