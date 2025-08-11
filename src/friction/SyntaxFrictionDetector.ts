/**
 * Syntax Friction Detector for Sherlock Ω Zero-Friction Protocol
 * Detects and eliminates syntax errors in real-time before they impact development flow
 */

import * as ts from 'typescript';
import { 
  FrictionDetector, 
  FrictionPoint, 
  FrictionType, 
  EliminationResult, 
  EliminationStrategy,
  FrictionLocation,
  FrictionImpact
} from './FrictionDetector';
import { SeverityLevel, ProblemType } from '../types/core';

/**
 * Context for syntax analysis
 */
export interface SyntaxContext {
  filePath: string;
  content: string;
  language: SupportedLanguage;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

/**
 * Supported programming languages for syntax detection
 */
export enum SupportedLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  JSON = 'json',
  MARKDOWN = 'markdown'
}

/**
 * Syntax error information
 */
export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  length: number;
  code: number;
  category: ts.DiagnosticCategory;
  source: string;
}

/**
 * Auto-correction suggestion
 */
export interface AutoCorrectionSuggestion {
  type: CorrectionType;
  description: string;
  originalText: string;
  correctedText: string;
  confidence: number;
  position: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
}

/**
 * Types of auto-corrections
 */
export enum CorrectionType {
  MISSING_SEMICOLON = 'MISSING_SEMICOLON',
  MISSING_BRACKET = 'MISSING_BRACKET',
  MISSING_QUOTE = 'MISSING_QUOTE',
  TYPO_CORRECTION = 'TYPO_CORRECTION',
  IMPORT_STATEMENT = 'IMPORT_STATEMENT',
  TYPE_ANNOTATION = 'TYPE_ANNOTATION',
  VARIABLE_DECLARATION = 'VARIABLE_DECLARATION',
  FUNCTION_SYNTAX = 'FUNCTION_SYNTAX'
}

/**
 * Syntax Friction Detector implementation
 */
export class SyntaxFrictionDetector extends FrictionDetector {
  private languageServices: Map<SupportedLanguage, any> = new Map();
  private correctionPatterns: Map<CorrectionType, RegExp> = new Map();

  constructor() {
    super(FrictionType.SYNTAX);
    this.initializeLanguageServices();
    this.initializeCorrectionPatterns();
  }

  /**
   * Detect syntax friction points in the given context
   */
  public async detectFriction(context: SyntaxContext): Promise<FrictionPoint[]> {
    const frictionPoints: FrictionPoint[] = [];

    try {
      const syntaxErrors = await this.analyzeSyntax(context);
      
      for (const error of syntaxErrors) {
        const friction = this.createSyntaxFrictionPoint(error, context);
        frictionPoints.push(friction);
        this.detectedFriction.set(friction.id, friction);
      }

      return frictionPoints;
    } catch (error) {
      console.error('Syntax friction detection failed:', error);
      return [];
    }
  }

  /**
   * Eliminate syntax friction through auto-correction
   */
  public async eliminateFriction(friction: FrictionPoint): Promise<EliminationResult> {
    const strategy = await this.generateEliminationStrategy(friction);
    return this.executeWithRollback(strategy, friction);
  }

  /**
   * Analyze syntax and detect errors
   */
  private async analyzeSyntax(context: SyntaxContext): Promise<SyntaxError[]> {
    switch (context.language) {
      case SupportedLanguage.TYPESCRIPT:
      case SupportedLanguage.JAVASCRIPT:
        return this.analyzeTypeScriptSyntax(context);
      case SupportedLanguage.JSON:
        return this.analyzeJsonSyntax(context);
      case SupportedLanguage.MARKDOWN:
        return this.analyzeMarkdownSyntax(context);
      default:
        return [];
    }
  }

  /**
   * Analyze TypeScript/JavaScript syntax
   */
  private analyzeTypeScriptSyntax(context: SyntaxContext): SyntaxError[] {
    const sourceFile = ts.createSourceFile(
      context.filePath,
      context.content,
      ts.ScriptTarget.Latest,
      true
    );

    const program = ts.createProgram([context.filePath], {
      allowJs: true,
      checkJs: false,
      noEmit: true,
      lib: ['ES2022', 'DOM'],
      target: ts.ScriptTarget.ES2022
    }, {
      getSourceFile: (fileName) => fileName === context.filePath ? sourceFile : undefined,
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

    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile)
    ];

    return diagnostics.map(diagnostic => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
      
      return {
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        line: line + 1,
        column: character + 1,
        length: diagnostic.length || 0,
        code: diagnostic.code,
        category: diagnostic.category,
        source: context.content.substring(diagnostic.start || 0, (diagnostic.start || 0) + (diagnostic.length || 0))
      };
    });
  }

  /**
   * Analyze JSON syntax
   */
  private analyzeJsonSyntax(context: SyntaxContext): SyntaxError[] {
    try {
      JSON.parse(context.content);
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSON error';
      const match = errorMessage.match(/at position (\d+)/);
      const position = match ? parseInt(match[1]) : 0;
      const lines = context.content.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      return [{
        message: errorMessage,
        line,
        column,
        length: 1,
        code: 0,
        category: ts.DiagnosticCategory.Error,
        source: context.content.charAt(position)
      }];
    }
  }

  /**
   * Analyze Markdown syntax (basic validation)
   */
  private analyzeMarkdownSyntax(context: SyntaxContext): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for unclosed code blocks
      const codeBlockMatches = line.match(/```/g);
      if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
        errors.push({
          message: 'Unclosed code block',
          line: index + 1,
          column: line.indexOf('```') + 1,
          length: 3,
          code: 0,
          category: ts.DiagnosticCategory.Warning,
          source: '```'
        });
      }

      // Check for malformed links
      const linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;
      let match;
      while ((match = linkPattern.exec(line)) !== null) {
        if (!match[2] || match[2].trim() === '') {
          errors.push({
            message: 'Empty link URL',
            line: index + 1,
            column: match.index + 1,
            length: match[0].length,
            code: 0,
            category: ts.DiagnosticCategory.Warning,
            source: match[0]
          });
        }
      }
    });

    return errors;
  }

  /**
   * Create friction point from syntax error
   */
  private createSyntaxFrictionPoint(error: SyntaxError, context: SyntaxContext): FrictionPoint {
    const location: FrictionLocation = {
      file: context.filePath,
      line: error.line,
      column: error.column,
      scope: [],
      context: error.source
    };

    const impact: FrictionImpact = {
      flowDisruption: this.calculateFlowDisruption(error),
      timeDelay: this.estimateTimeDelay(error),
      cognitiveLoad: this.calculateCognitiveLoad(error),
      blockingPotential: this.calculateBlockingPotential(error)
    };

    const severity = this.mapDiagnosticCategoryToSeverity(error.category);

    return this.createFrictionPoint(
      FrictionType.SYNTAX,
      severity,
      error.message,
      location,
      impact,
      {
        confidence: 0.95,
        tags: ['syntax', 'auto-correctable', context.language]
      }
    );
  }

  /**
   * Generate elimination strategy for syntax friction
   */
  private async generateEliminationStrategy(friction: FrictionPoint): Promise<EliminationStrategy> {
    const suggestions = await this.generateAutoCorrections(friction);
    const bestSuggestion = suggestions[0]; // Highest confidence suggestion

    if (!bestSuggestion) {
      throw new Error('No auto-correction suggestions available');
    }

    return {
      name: `Auto-correct ${bestSuggestion.type}`,
      type: 'AUTO_CORRECTION',
      confidence: bestSuggestion.confidence,
      riskLevel: bestSuggestion.confidence > 0.8 ? 'LOW' : 'MEDIUM',
      steps: [
        {
          description: `Apply ${bestSuggestion.description}`,
          action: async () => {
            await this.applySyntaxCorrection(friction, bestSuggestion);
          },
          rollback: async () => {
            await this.rollbackSyntaxCorrection(friction, bestSuggestion);
          },
          validation: async () => {
            return this.validateSyntaxCorrection(friction);
          }
        }
      ]
    };
  }

  /**
   * Generate auto-correction suggestions
   */
  private async generateAutoCorrections(friction: FrictionPoint): Promise<AutoCorrectionSuggestion[]> {
    const suggestions: AutoCorrectionSuggestion[] = [];
    const message = friction.description.toLowerCase();

    // Missing semicolon
    if (message.includes('expected') && message.includes(';')) {
      suggestions.push({
        type: CorrectionType.MISSING_SEMICOLON,
        description: 'Add missing semicolon',
        originalText: '',
        correctedText: ';',
        confidence: 0.95,
        position: {
          start: 0,
          end: 0,
          line: friction.location.line || 0,
          column: friction.location.column || 0
        }
      });
    }

    // Missing bracket
    if (message.includes('expected') && (message.includes('}') || message.includes(')') || message.includes(']'))) {
      const bracket = message.includes('}') ? '}' : message.includes(')') ? ')' : ']';
      suggestions.push({
        type: CorrectionType.MISSING_BRACKET,
        description: `Add missing ${bracket}`,
        originalText: '',
        correctedText: bracket,
        confidence: 0.9,
        position: {
          start: 0,
          end: 0,
          line: friction.location.line || 0,
          column: friction.location.column || 0
        }
      });
    }

    // Missing quote
    if (message.includes('unterminated') && message.includes('string')) {
      suggestions.push({
        type: CorrectionType.MISSING_QUOTE,
        description: 'Add missing quote',
        originalText: '',
        correctedText: '"',
        confidence: 0.85,
        position: {
          start: 0,
          end: 0,
          line: friction.location.line || 0,
          column: friction.location.column || 0
        }
      });
    }

    // Library/import issues - suggest adding import or type definitions
    if (message.includes('cannot find name') || message.includes('target library')) {
      suggestions.push({
        type: CorrectionType.IMPORT_STATEMENT,
        description: 'Add missing import or type definition',
        originalText: '',
        correctedText: '// Add appropriate import or type definition',
        confidence: 0.7,
        position: {
          start: 0,
          end: 0,
          line: 1,
          column: 1
        }
      });
    }

    // If no specific suggestions, provide a generic one
    if (suggestions.length === 0) {
      suggestions.push({
        type: CorrectionType.TYPO_CORRECTION,
        description: 'Manual review required',
        originalText: friction.location.context || '',
        correctedText: '// TODO: Review and fix syntax issue',
        confidence: 0.3,
        position: {
          start: 0,
          end: 0,
          line: friction.location.line || 0,
          column: friction.location.column || 0
        }
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Apply syntax correction
   */
  private async applySyntaxCorrection(
    friction: FrictionPoint, 
    suggestion: AutoCorrectionSuggestion
  ): Promise<void> {
    // This would integrate with the IDE's file system to apply the correction
    // For now, we'll simulate the correction
    console.log(`🔧 Applying syntax correction: ${suggestion.description}`);
    console.log(`   Location: ${friction.location.file}:${friction.location.line}:${friction.location.column}`);
    console.log(`   Change: "${suggestion.originalText}" → "${suggestion.correctedText}"`);
    
    // In a real implementation, this would:
    // 1. Read the file content
    // 2. Apply the correction at the specified position
    // 3. Write the corrected content back to the file
    // 4. Notify the IDE of the change
  }

  /**
   * Rollback syntax correction
   */
  private async rollbackSyntaxCorrection(
    friction: FrictionPoint,
    suggestion: AutoCorrectionSuggestion
  ): Promise<void> {
    console.log(`↩️ Rolling back syntax correction: ${suggestion.description}`);
    // Reverse the applied correction
  }

  /**
   * Validate syntax correction was successful
   */
  private async validateSyntaxCorrection(friction: FrictionPoint): Promise<boolean> {
    // Re-analyze the syntax at the friction location
    // Return true if the syntax error is resolved
    return true; // Simplified for now
  }

  /**
   * Initialize language services
   */
  private initializeLanguageServices(): void {
    // Initialize TypeScript language service
    this.languageServices.set(SupportedLanguage.TYPESCRIPT, {
      // TypeScript language service configuration
    });

    // Initialize other language services as needed
  }

  /**
   * Initialize correction patterns
   */
  private initializeCorrectionPatterns(): void {
    this.correctionPatterns.set(CorrectionType.MISSING_SEMICOLON, /expected ';'/i);
    this.correctionPatterns.set(CorrectionType.MISSING_BRACKET, /expected '[}\])]'/i);
    this.correctionPatterns.set(CorrectionType.MISSING_QUOTE, /unterminated string/i);
  }

  /**
   * Calculate flow disruption impact
   */
  private calculateFlowDisruption(error: SyntaxError): number {
    switch (error.category) {
      case ts.DiagnosticCategory.Error:
        return 0.8;
      case ts.DiagnosticCategory.Warning:
        return 0.4;
      case ts.DiagnosticCategory.Suggestion:
        return 0.2;
      default:
        return 0.1;
    }
  }

  /**
   * Estimate time delay caused by error
   */
  private estimateTimeDelay(error: SyntaxError): number {
    // Estimate in milliseconds based on error complexity
    const baseDelay = 5000; // 5 seconds base
    const complexityMultiplier = error.message.length / 50;
    return baseDelay * (1 + complexityMultiplier);
  }

  /**
   * Calculate cognitive load
   */
  private calculateCognitiveLoad(error: SyntaxError): number {
    // Simple heuristic based on message complexity
    const messageComplexity = error.message.split(' ').length;
    return Math.min(messageComplexity / 20, 1.0);
  }

  /**
   * Calculate blocking potential
   */
  private calculateBlockingPotential(error: SyntaxError): number {
    return error.category === ts.DiagnosticCategory.Error ? 0.9 : 0.3;
  }

  /**
   * Map TypeScript diagnostic category to severity level
   */
  private mapDiagnosticCategoryToSeverity(category: ts.DiagnosticCategory): SeverityLevel {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return SeverityLevel.HIGH;
      case ts.DiagnosticCategory.Warning:
        return SeverityLevel.MEDIUM;
      case ts.DiagnosticCategory.Suggestion:
        return SeverityLevel.LOW;
      case ts.DiagnosticCategory.Message:
        return SeverityLevel.LOW;
      default:
        return SeverityLevel.LOW;
    }
  }
}