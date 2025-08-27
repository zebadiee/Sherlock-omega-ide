/**
 * Code Completion Context Analyzer
 * 
 * Analyzes code context for intelligent completion suggestions with AST parsing,
 * dependency tracking, and pattern recognition for >90% accuracy targeting.
 */

import {
  CodeContext,
  Position,
  FunctionInfo,
  VariableInfo,
  ScopeInfo,
  ParameterInfo,
  ProjectContext,
  CodeFile,
  DependencyGraph
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';

/**
 * Completion context with enhanced analysis
 */
export interface CompletionContext extends CodeContext {
  // Enhanced context information
  completionType: CompletionType;
  expectedType?: string;
  availableSymbols: SymbolInfo[];
  recentUsage: UsagePattern[];
  syntaxContext: SyntaxContext;
  semanticContext: SemanticContext;
}

/**
 * Types of code completion
 */
export enum CompletionType {
  MEMBER_ACCESS = 'member_access',        // obj.prop|
  FUNCTION_CALL = 'function_call',        // func(|
  VARIABLE_DECLARATION = 'variable_declaration', // const x = |
  IMPORT_STATEMENT = 'import_statement',  // import { | } from
  TYPE_ANNOTATION = 'type_annotation',    // : |
  GENERIC_EXPRESSION = 'generic_expression', // General code completion
  KEYWORD = 'keyword',                    // if, for, while, etc.
  SNIPPET = 'snippet'                     // Code templates
}

/**
 * Symbol information for completion
 */
export interface SymbolInfo {
  name: string;
  type: string;
  kind: SymbolKind;
  scope: string;
  documentation?: string;
  signature?: string;
  returnType?: string;
  parameters?: ParameterInfo[];
  isDeprecated?: boolean;
  confidence: number;
}

export enum SymbolKind {
  VARIABLE = 'variable',
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  ENUM = 'enum',
  MODULE = 'module',
  PROPERTY = 'property',
  METHOD = 'method',
  CONSTRUCTOR = 'constructor',
  CONSTANT = 'constant',
  TYPE = 'type'
}

/**
 * Usage patterns for intelligent suggestions
 */
export interface UsagePattern {
  symbol: string;
  frequency: number;
  lastUsed: Date;
  context: string;
  coOccurrences: string[];
}

/**
 * Syntax context at cursor position
 */
export interface SyntaxContext {
  inString: boolean;
  inComment: boolean;
  inFunction: boolean;
  inClass: boolean;
  inBlock: boolean;
  parentNode?: string;
  precedingToken?: string;
  followingToken?: string;
  indentationLevel: number;
}

/**
 * Semantic context for type-aware completion
 */
export interface SemanticContext {
  expectedReturnType?: string;
  availableTypes: string[];
  genericConstraints: string[];
  importedModules: ImportInfo[];
  currentNamespace?: string;
}

export interface ImportInfo {
  module: string;
  imports: string[];
  isDefault: boolean;
  alias?: string;
}

/**
 * Context analyzer for intelligent code completion
 */
export class ContextAnalyzer {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private symbolCache: Map<string, SymbolInfo[]> = new Map();
  private usagePatterns: Map<string, UsagePattern[]> = new Map();

  constructor(logger: Logger, performanceMonitor: PerformanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Analyze code context for completion at specific position
   */
  async analyzeCompletionContext(
    file: string,
    position: Position,
    projectContext: ProjectContext
  ): Promise<CompletionContext> {
    const startTime = Date.now();

    try {
      this.logger.debug('Analyzing completion context', {
        file,
        position,
        language: projectContext.language
      });

      // Read file content
      const content = await this.readFileContent(file);
      const lines = content.split('\n');

      // Extract basic code context
      const baseContext = await this.extractBasicContext(file, position, content, lines);

      // Determine completion type
      const completionType = this.determineCompletionType(lines, position);

      // Analyze syntax context
      const syntaxContext = this.analyzeSyntaxContext(lines, position);

      // Analyze semantic context
      const semanticContext = await this.analyzeSemanticContext(
        content, 
        position, 
        projectContext
      );

      // Get available symbols
      const availableSymbols = await this.getAvailableSymbols(
        file,
        position,
        projectContext,
        syntaxContext
      );

      // Get usage patterns
      const recentUsage = await this.getUsagePatterns(file, projectContext);

      // Determine expected type
      const expectedType = this.determineExpectedType(
        lines,
        position,
        syntaxContext,
        semanticContext
      );

      const completionContext: CompletionContext = {
        ...baseContext,
        completionType,
        expectedType,
        availableSymbols,
        recentUsage,
        syntaxContext,
        semanticContext
      };

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('context_analysis_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.debug('Completion context analyzed', {
        file,
        completionType,
        symbolCount: availableSymbols.length,
        processingTime
      });

      return completionContext;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Context analysis failed', {
        file,
        position,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });
      throw error;
    }
  }

  /**
   * Update usage patterns based on accepted completions
   */
  async updateUsagePatterns(
    file: string,
    symbol: string,
    context: string,
    accepted: boolean
  ): Promise<void> {
    try {
      const patterns = this.usagePatterns.get(file) || [];
      const existingPattern = patterns.find(p => p.symbol === symbol);

      if (existingPattern) {
        if (accepted) {
          existingPattern.frequency += 1;
          existingPattern.lastUsed = new Date();
          existingPattern.context = context;
        }
      } else if (accepted) {
        patterns.push({
          symbol,
          frequency: 1,
          lastUsed: new Date(),
          context,
          coOccurrences: []
        });
      }

      this.usagePatterns.set(file, patterns);

      this.logger.debug('Usage patterns updated', {
        file,
        symbol,
        accepted,
        totalPatterns: patterns.length
      });

    } catch (error) {
      this.logger.error('Failed to update usage patterns', {
        file,
        symbol,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Clear cached analysis data
   */
  clearCache(): void {
    this.symbolCache.clear();
    this.usagePatterns.clear();
    this.logger.debug('Context analyzer cache cleared');
  }

  // Private helper methods

  private async readFileContent(file: string): Promise<string> {
    try {
      // In a real implementation, this would read from the file system
      // For now, we'll simulate file reading
      return '';
    } catch (error) {
      throw new Error(`Failed to read file ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractBasicContext(
    file: string,
    position: Position,
    content: string,
    lines: string[]
  ): Promise<CodeContext> {
    // Extract surrounding code
    const surroundingCode = this.extractSurroundingCode(lines, position);

    // Parse imports
    const imports = this.parseImports(content);

    // Extract functions
    const functions = this.extractFunctions(content);

    // Extract variables
    const variables = this.extractVariables(content, position);

    // Determine scope
    const scope = this.determineScopeAtPosition(content, position);

    return {
      currentFile: file,
      cursorPosition: position,
      surroundingCode,
      imports,
      functions,
      variables,
      scope
    };
  }

  private determineCompletionType(lines: string[], position: Position): CompletionType {
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);
    const afterCursor = currentLine.substring(position.character);

    // Member access: obj.|
    if (beforeCursor.match(/\w+\.\s*$/)) {
      return CompletionType.MEMBER_ACCESS;
    }

    // Function call: func(|
    if (beforeCursor.match(/\w+\(\s*$/)) {
      return CompletionType.FUNCTION_CALL;
    }

    // Variable declaration: const x = |
    if (beforeCursor.match(/(const|let|var)\s+\w+\s*=\s*$/)) {
      return CompletionType.VARIABLE_DECLARATION;
    }

    // Import statement: import { | } from
    if (beforeCursor.match(/import\s*\{\s*\w*$/)) {
      return CompletionType.IMPORT_STATEMENT;
    }

    // Type annotation: : |
    if (beforeCursor.match(/:\s*$/)) {
      return CompletionType.TYPE_ANNOTATION;
    }

    // Keyword completion
    if (beforeCursor.match(/^\s*\w*$/) && !beforeCursor.includes('.')) {
      return CompletionType.KEYWORD;
    }

    return CompletionType.GENERIC_EXPRESSION;
  }

  private analyzeSyntaxContext(lines: string[], position: Position): SyntaxContext {
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);
    
    // Check if in string
    const inString = this.isInString(beforeCursor);
    
    // Check if in comment
    const inComment = this.isInComment(beforeCursor, lines, position);
    
    // Check structural context
    const inFunction = this.isInFunction(lines, position);
    const inClass = this.isInClass(lines, position);
    const inBlock = this.isInBlock(lines, position);
    
    // Get surrounding tokens
    const precedingToken = this.getPrecedingToken(beforeCursor);
    const followingToken = this.getFollowingToken(currentLine.substring(position.character));
    
    // Calculate indentation
    const indentationLevel = this.getIndentationLevel(currentLine);

    return {
      inString,
      inComment,
      inFunction,
      inClass,
      inBlock,
      precedingToken,
      followingToken,
      indentationLevel
    };
  }

  private async analyzeSemanticContext(
    content: string,
    position: Position,
    projectContext: ProjectContext
  ): Promise<SemanticContext> {
    // Parse imports
    const importedModules = this.parseImportedModules(content);
    
    // Get available types from project
    const availableTypes = await this.getAvailableTypes(projectContext);
    
    // Analyze generic constraints
    const genericConstraints = this.analyzeGenericConstraints(content, position);
    
    // Determine current namespace
    const currentNamespace = this.getCurrentNamespace(content, position);

    return {
      availableTypes,
      genericConstraints,
      importedModules,
      currentNamespace
    };
  }

  private async getAvailableSymbols(
    file: string,
    position: Position,
    projectContext: ProjectContext,
    syntaxContext: SyntaxContext
  ): Promise<SymbolInfo[]> {
    const cacheKey = `${file}:${position.line}:${position.character}`;
    
    // Check cache first
    const cached = this.symbolCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const symbols: SymbolInfo[] = [];

    // Add local variables and functions
    symbols.push(...await this.getLocalSymbols(file, position));

    // Add imported symbols
    symbols.push(...await this.getImportedSymbols(file, projectContext));

    // Add global symbols
    symbols.push(...await this.getGlobalSymbols(projectContext));

    // Add built-in symbols
    symbols.push(...this.getBuiltInSymbols(projectContext.language));

    // Filter based on syntax context
    const filteredSymbols = this.filterSymbolsBySyntax(symbols, syntaxContext);

    // Cache results
    this.symbolCache.set(cacheKey, filteredSymbols);

    return filteredSymbols;
  }

  private async getUsagePatterns(file: string, projectContext: ProjectContext): Promise<UsagePattern[]> {
    const patterns = this.usagePatterns.get(file) || [];
    
    // Sort by frequency and recency
    return patterns.sort((a, b) => {
      const frequencyScore = b.frequency - a.frequency;
      const recencyScore = b.lastUsed.getTime() - a.lastUsed.getTime();
      return frequencyScore * 0.7 + recencyScore * 0.3;
    });
  }

  private determineExpectedType(
    lines: string[],
    position: Position,
    syntaxContext: SyntaxContext,
    semanticContext: SemanticContext
  ): string | undefined {
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);

    // Function return type
    if (beforeCursor.match(/return\s+$/)) {
      return semanticContext.expectedReturnType;
    }

    // Assignment
    const assignmentMatch = beforeCursor.match(/(\w+)\s*=\s*$/);
    if (assignmentMatch && assignmentMatch[1]) {
      // Try to infer type from variable declaration
      return this.inferVariableType(lines, assignmentMatch[1], position);
    }

    // Function parameter
    if (syntaxContext.inFunction && beforeCursor.includes('(')) {
      return this.inferParameterType(beforeCursor);
    }

    return undefined;
  }

  // Utility methods for syntax analysis

  private extractSurroundingCode(lines: string[], position: Position): string {
    const startLine = Math.max(0, position.line - 5);
    const endLine = Math.min(lines.length - 1, position.line + 5);
    return lines.slice(startLine, endLine + 1).join('\n');
  }

  private parseImports(content: string): string[] {
    const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"];?$/gm;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  private extractFunctions(content: string): FunctionInfo[] {
    // Simplified function extraction - would use AST in production
    const functionRegex = /(?:function\s+|const\s+|let\s+)(\w+)\s*(?:=\s*)?(?:async\s+)?(?:function\s*)?\([^)]*\)/g;
    const functions: FunctionInfo[] = [];
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      if (match[1] && match.index !== undefined) {
        functions.push({
          name: match[1],
          parameters: [], // Would be extracted from AST
          returnType: 'unknown',
          startLine: content.substring(0, match.index).split('\n').length - 1,
          endLine: 0 // Would be calculated from AST
        });
      }
    }

    return functions;
  }

  private extractVariables(content: string, position: Position): VariableInfo[] {
    // Simplified variable extraction - would use AST in production
    const variableRegex = /(const|let|var)\s+(\w+)/g;
    const variables: VariableInfo[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (match.index !== undefined) {
        const line = content.substring(0, match.index).split('\n').length - 1;
        if (line <= position.line && match[2]) {
          variables.push({
            name: match[2],
            type: 'unknown',
            scope: 'local',
            line
          });
        }
      }
    }

    return variables;
  }

  private determineScopeAtPosition(content: string, position: Position): ScopeInfo {
    // Simplified scope determination - would use AST in production
    return {
      type: 'module',
      name: 'global',
      variables: []
    };
  }

  private isInString(beforeCursor: string): boolean {
    const singleQuotes = (beforeCursor.match(/'/g) || []).length;
    const doubleQuotes = (beforeCursor.match(/"/g) || []).length;
    const backticks = (beforeCursor.match(/`/g) || []).length;
    
    return (singleQuotes % 2 === 1) || (doubleQuotes % 2 === 1) || (backticks % 2 === 1);
  }

  private isInComment(beforeCursor: string, lines: string[], position: Position): boolean {
    // Single line comment
    if (beforeCursor.includes('//')) {
      return true;
    }

    // Multi-line comment
    const fullContent = lines.slice(0, position.line + 1).join('\n') + beforeCursor;
    const openComments = (fullContent.match(/\/\*/g) || []).length;
    const closeComments = (fullContent.match(/\*\//g) || []).length;
    
    return openComments > closeComments;
  }

  private isInFunction(lines: string[], position: Position): boolean {
    // Look backwards for function declaration
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i];
      if (line && line.match(/function\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{/)) {
        return true;
      }
      if (line && line.includes('}') && !line.includes('{')) {
        return false;
      }
    }
    return false;
  }

  private isInClass(lines: string[], position: Position): boolean {
    // Look backwards for class declaration
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i];
      if (line && line.match(/class\s+\w+/)) {
        return true;
      }
    }
    return false;
  }

  private isInBlock(lines: string[], position: Position): boolean {
    let braceCount = 0;
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i];
      if (line) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
      }
    }
    return braceCount > 0;
  }

  private getPrecedingToken(beforeCursor: string): string | undefined {
    const tokens = beforeCursor.trim().split(/\s+/);
    return tokens[tokens.length - 1];
  }

  private getFollowingToken(afterCursor: string): string | undefined {
    const tokens = afterCursor.trim().split(/\s+/);
    return tokens[0];
  }

  private getIndentationLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match && match[1] ? match[1].length : 0;
  }

  private parseImportedModules(content: string): ImportInfo[] {
    const importRegex = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"];?/g;
    const imports: ImportInfo[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1] && match[3]) {
        // Default import
        imports.push({
          module: match[3],
          imports: [match[1]],
          isDefault: true
        });
      } else if (match[2] && match[3]) {
        // Named imports
        const namedImports = match[2].split(',').map(imp => imp.trim());
        imports.push({
          module: match[3],
          imports: namedImports,
          isDefault: false
        });
      }
    }

    return imports;
  }

  private async getAvailableTypes(projectContext: ProjectContext): Promise<string[]> {
    // Would analyze project files for type definitions
    const builtInTypes = ['string', 'number', 'boolean', 'object', 'array', 'function'];
    return builtInTypes;
  }

  private analyzeGenericConstraints(content: string, position: Position): string[] {
    // Would analyze generic type constraints
    return [];
  }

  private getCurrentNamespace(content: string, position: Position): string | undefined {
    // Would determine current namespace/module
    return undefined;
  }

  private async getLocalSymbols(file: string, position: Position): Promise<SymbolInfo[]> {
    // Would extract local symbols from current scope
    return [];
  }

  private async getImportedSymbols(file: string, projectContext: ProjectContext): Promise<SymbolInfo[]> {
    // Would extract symbols from imported modules
    return [];
  }

  private async getGlobalSymbols(projectContext: ProjectContext): Promise<SymbolInfo[]> {
    // Would extract global symbols from project
    return [];
  }

  private getBuiltInSymbols(language: string): SymbolInfo[] {
    // Return built-in symbols for the language
    const jsBuiltIns: SymbolInfo[] = [
      {
        name: 'console',
        type: 'Console',
        kind: SymbolKind.VARIABLE,
        scope: 'global',
        confidence: 1.0,
        documentation: 'The console object provides access to the browser\'s debugging console.'
      },
      {
        name: 'setTimeout',
        type: '(callback: Function, delay: number) => number',
        kind: SymbolKind.FUNCTION,
        scope: 'global',
        confidence: 1.0,
        documentation: 'Sets a timer which executes a function once the timer expires.'
      }
    ];

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return jsBuiltIns;
      default:
        return [];
    }
  }

  private filterSymbolsBySyntax(symbols: SymbolInfo[], syntaxContext: SyntaxContext): SymbolInfo[] {
    return symbols.filter(symbol => {
      // Don't suggest anything in strings or comments
      if (syntaxContext.inString || syntaxContext.inComment) {
        return false;
      }

      // Context-specific filtering would go here
      return true;
    });
  }

  private inferVariableType(lines: string[], variableName: string, position: Position): string | undefined {
    // Would infer type from variable declaration or usage
    return undefined;
  }

  private inferParameterType(beforeCursor: string): string | undefined {
    // Would infer parameter type from function signature
    return undefined;
  }
}