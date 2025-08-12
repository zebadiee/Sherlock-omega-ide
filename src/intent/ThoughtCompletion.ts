/**
 * Thought Completion System for Sherlock Ω
 * Provides predictive code stubbing with function signatures, tests, and comments
 * Integrates with Zero-Friction Protocol for proactive suggestions
 */

import { DeveloperIntent, Goal, GoalType, IntentConstraint, DeveloperPreference } from '../types/core';
import { ActionableItem, IntegratedFrictionProtocol } from '../friction/IntegratedFrictionProtocol';

/**
 * Completion suggestion with metadata
 */
export interface CompletionSuggestion {
  id: string;
  type: CompletionType;
  content: string;
  description: string;
  confidence: number;
  intentAlignment: number;
  priority: number;
  metadata: CompletionMetadata;
}

/**
 * Types of completions that can be generated
 */
export enum CompletionType {
  FUNCTION_SIGNATURE = 'function_signature',
  FUNCTION_IMPLEMENTATION = 'function_implementation',
  TEST_CASE = 'test_case',
  COMMENT = 'comment',
  IMPORT_STATEMENT = 'import_statement',
  TYPE_DEFINITION = 'type_definition',
  CLASS_DEFINITION = 'class_definition',
  INTERFACE_DEFINITION = 'interface_definition',
  VARIABLE_DECLARATION = 'variable_declaration',
  ERROR_HANDLING = 'error_handling'
}

/**
 * Metadata for completion suggestions
 */
export interface CompletionMetadata {
  language: string;
  paradigm: string;
  estimatedTime: number; // seconds to implement
  dependencies: string[];
  relatedFiles: string[];
  testCoverage: number;
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Context for thought completion
 */
export interface CompletionContext {
  filePath: string;
  content: string;
  cursorPosition: {
    line: number;
    column: number;
  };
  selectedText?: string;
  language: string;
  projectContext?: {
    dependencies: string[];
    testFramework?: string;
    codeStyle?: string;
  };
}

/**
 * Result of thought completion analysis
 */
export interface ThoughtCompletionResult {
  suggestions: CompletionSuggestion[];
  intentAlignment: number;
  confidence: number;
  executionTime: number;
  metadata: {
    totalSuggestions: number;
    highConfidenceSuggestions: number;
    frictionPointsAddressed: number;
    proactiveActions: ActionableItem[];
  };
}

/**
 * Thought Completion Engine
 * Provides predictive code stubbing integrated with Zero-Friction Protocol
 */
export class ThoughtCompletion {
  private frictionProtocol: IntegratedFrictionProtocol;
  private completionHistory: Map<string, CompletionSuggestion[]> = new Map();
  private intentCache: Map<string, DeveloperIntent> = new Map();

  constructor(frictionProtocol: IntegratedFrictionProtocol) {
    this.frictionProtocol = frictionProtocol;
  }

  /**
   * Complete developer thoughts with intent-aligned suggestions
   */
  async completeThought(
    context: CompletionContext,
    intent?: DeveloperIntent
  ): Promise<ThoughtCompletionResult> {
    const startTime = Date.now();

    try {
      // Analyze current context and infer intent if not provided
      const resolvedIntent = intent || await this.inferIntent(context);

      // Generate completion suggestions based on context and intent
      const suggestions = await this.generateCompletions(context, resolvedIntent);

      // Integrate with friction protocol for proactive suggestions
      const frictionActions = await this.generateProactiveActions(context, suggestions);

      // Rank suggestions by intent alignment and confidence
      const rankedSuggestions = this.rankSuggestions(suggestions, resolvedIntent);

      // Calculate overall metrics
      const intentAlignment = this.calculateIntentAlignment(rankedSuggestions, resolvedIntent);
      const confidence = this.calculateOverallConfidence(rankedSuggestions);

      const result: ThoughtCompletionResult = {
        suggestions: rankedSuggestions,
        intentAlignment,
        confidence,
        executionTime: Date.now() - startTime,
        metadata: {
          totalSuggestions: rankedSuggestions.length,
          highConfidenceSuggestions: rankedSuggestions.filter(s => s.confidence > 0.8).length,
          frictionPointsAddressed: frictionActions.length,
          proactiveActions: frictionActions
        }
      };

      // Cache results for learning
      this.cacheCompletionResult(context, result);

      return result;

    } catch (error) {
      console.error('Thought completion failed:', error);
      return {
        suggestions: [],
        intentAlignment: 0,
        confidence: 0,
        executionTime: Date.now() - startTime,
        metadata: {
          totalSuggestions: 0,
          highConfidenceSuggestions: 0,
          frictionPointsAddressed: 0,
          proactiveActions: []
        }
      };
    }
  }

  /**
   * Generate specific type of completion
   */
  async generateSpecificCompletion(
    type: CompletionType,
    context: CompletionContext,
    intent?: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const resolvedIntent = intent || await this.inferIntent(context);

    switch (type) {
      case CompletionType.FUNCTION_SIGNATURE:
        return this.generateFunctionSignatures(context, resolvedIntent);
      case CompletionType.FUNCTION_IMPLEMENTATION:
        return this.generateFunctionImplementations(context, resolvedIntent);
      case CompletionType.TEST_CASE:
        return this.generateTestCases(context, resolvedIntent);
      case CompletionType.COMMENT:
        return this.generateComments(context, resolvedIntent);
      case CompletionType.IMPORT_STATEMENT:
        return this.generateImportStatements(context, resolvedIntent);
      case CompletionType.TYPE_DEFINITION:
        return this.generateTypeDefinitions(context, resolvedIntent);
      default:
        return [];
    }
  }

  /**
   * Get completion statistics for performance monitoring
   */
  getCompletionStats(): {
    totalCompletions: number;
    averageConfidence: number;
    averageIntentAlignment: number;
    mostUsedTypes: CompletionType[];
    successRate: number;
  } {
    const allCompletions = Array.from(this.completionHistory.values()).flat();
    
    if (allCompletions.length === 0) {
      return {
        totalCompletions: 0,
        averageConfidence: 0,
        averageIntentAlignment: 0,
        mostUsedTypes: [],
        successRate: 0
      };
    }

    const averageConfidence = allCompletions.reduce((sum, c) => sum + c.confidence, 0) / allCompletions.length;
    const averageIntentAlignment = allCompletions.reduce((sum, c) => sum + c.intentAlignment, 0) / allCompletions.length;
    
    // Count completion types
    const typeCounts = new Map<CompletionType, number>();
    allCompletions.forEach(completion => {
      typeCounts.set(completion.type, (typeCounts.get(completion.type) || 0) + 1);
    });

    const mostUsedTypes = Array.from(typeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    return {
      totalCompletions: allCompletions.length,
      averageConfidence,
      averageIntentAlignment,
      mostUsedTypes,
      successRate: allCompletions.filter(c => c.confidence > 0.7).length / allCompletions.length
    };
  }

  // Private helper methods

  /**
   * Infer developer intent from context
   */
  private async inferIntent(context: CompletionContext): Promise<DeveloperIntent> {
    const cacheKey = this.generateContextKey(context);
    const cached = this.intentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Analyze context to infer intent
    const intent: DeveloperIntent = {
      primaryGoal: this.inferPrimaryGoal(context),
      subGoals: this.inferSecondaryGoals(context),
      constraints: this.inferConstraints(context),
      preferences: this.inferPreferences(context),
      confidence: 0.7,
      contextualFactors: [{
        type: 'PROJECT_TYPE' as any,
        value: context.language,
        relevance: 0.8
      }]
    };

    this.intentCache.set(cacheKey, intent);
    return intent;
  }

  /**
   * Generate completion suggestions based on context and intent
   */
  private async generateCompletions(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Generate different types of completions based on context
    const generators = [
      () => this.generateFunctionSignatures(context, intent),
      () => this.generateFunctionImplementations(context, intent),
      () => this.generateTestCases(context, intent),
      () => this.generateComments(context, intent),
      () => this.generateImportStatements(context, intent),
      () => this.generateTypeDefinitions(context, intent)
    ];

    // Run generators in parallel
    const results = await Promise.all(generators.map(gen => gen().catch(() => [])));
    results.forEach(result => suggestions.push(...result));

    return suggestions;
  }

  /**
   * Generate proactive actions using friction protocol
   */
  private async generateProactiveActions(
    context: CompletionContext,
    suggestions: CompletionSuggestion[]
  ): Promise<ActionableItem[]> {
    try {
      const frictionContext = {
        filePath: context.filePath,
        content: context.content,
        language: context.language,
        checkPackageJson: true
      };

      const result = await this.frictionProtocol.runIntegratedDetection(frictionContext);
      return result.actionableItems;
    } catch (error) {
      console.error('Failed to generate proactive actions:', error);
      return [];
    }
  }

  /**
   * Generate function signatures
   */
  private async generateFunctionSignatures(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Analyze context for function signature patterns
    const currentLine = this.getCurrentLine(context);
    
    if (this.shouldSuggestFunction(currentLine, context)) {
      const functionName = this.extractFunctionName(currentLine) || 'newFunction';
      const parameters = this.inferParameters(context, intent);
      const returnType = this.inferReturnType(context, intent);

      const signature = this.buildFunctionSignature(functionName, parameters, returnType, context.language);

      suggestions.push({
        id: `func_sig_${Date.now()}`,
        type: CompletionType.FUNCTION_SIGNATURE,
        content: signature,
        description: `Function signature for ${functionName}`,
        confidence: 0.8,
        intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'function'),
        priority: 1,
        metadata: {
          language: context.language,
          paradigm: 'functional',
          estimatedTime: 30,
          dependencies: [],
          relatedFiles: [],
          testCoverage: 0,
          complexity: 'low',
          riskLevel: 'low'
        }
      });
    }

    return suggestions;
  }

  /**
   * Generate function implementations
   */
  private async generateFunctionImplementations(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Look for function signatures that need implementation
    const functionSignatures = this.extractFunctionSignatures(context.content);
    
    for (const signature of functionSignatures) {
      if (this.needsImplementation(signature, context.content)) {
        const implementation = this.generateImplementation(signature, intent, context);
        
        suggestions.push({
          id: `func_impl_${Date.now()}_${signature.name}`,
          type: CompletionType.FUNCTION_IMPLEMENTATION,
          content: implementation,
          description: `Implementation for ${signature.name}`,
          confidence: 0.7,
          intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'implementation'),
          priority: 2,
          metadata: {
            language: context.language,
            paradigm: this.inferParadigm(intent),
            estimatedTime: 120,
            dependencies: signature.dependencies || [],
            relatedFiles: [],
            testCoverage: 0,
            complexity: 'medium',
            riskLevel: 'medium'
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate test cases
   */
  private async generateTestCases(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Look for functions that need tests
    const functions = this.extractFunctions(context.content);
    const testFramework = context.projectContext?.testFramework || 'jest';

    for (const func of functions) {
      if (this.shouldGenerateTest(func, intent)) {
        const testCase = this.generateTestCase(func, testFramework, context);
        
        suggestions.push({
          id: `test_${Date.now()}_${func.name}`,
          type: CompletionType.TEST_CASE,
          content: testCase,
          description: `Test case for ${func.name}`,
          confidence: 0.75,
          intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'testing'),
          priority: 3,
          metadata: {
            language: context.language,
            paradigm: 'testing',
            estimatedTime: 90,
            dependencies: [testFramework],
            relatedFiles: [func.sourceFile || context.filePath],
            testCoverage: 1.0,
            complexity: 'medium',
            riskLevel: 'low'
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate comments
   */
  private async generateComments(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Analyze code for missing documentation
    const uncommentedFunctions = this.findUncommentedFunctions(context.content);
    
    for (const func of uncommentedFunctions) {
      const comment = this.generateFunctionComment(func, context);
      
      suggestions.push({
        id: `comment_${Date.now()}_${func.name}`,
        type: CompletionType.COMMENT,
        content: comment,
        description: `Documentation for ${func.name}`,
        confidence: 0.85,
        intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'documentation'),
        priority: 4,
        metadata: {
          language: context.language,
          paradigm: 'documentation',
          estimatedTime: 60,
          dependencies: [],
          relatedFiles: [],
          testCoverage: 0,
          complexity: 'low',
          riskLevel: 'low'
        }
      });
    }

    return suggestions;
  }

  /**
   * Generate import statements
   */
  private async generateImportStatements(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Analyze code for missing imports
    const missingImports = this.findMissingImports(context.content, context.language);
    
    for (const importInfo of missingImports) {
      const importStatement = this.generateImportStatement(importInfo, context.language);
      
      suggestions.push({
        id: `import_${Date.now()}_${importInfo.module}`,
        type: CompletionType.IMPORT_STATEMENT,
        content: importStatement,
        description: `Import ${importInfo.module}`,
        confidence: 0.9,
        intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'import'),
        priority: 1,
        metadata: {
          language: context.language,
          paradigm: 'modular',
          estimatedTime: 10,
          dependencies: [importInfo.module],
          relatedFiles: [],
          testCoverage: 0,
          complexity: 'low',
          riskLevel: 'low'
        }
      });
    }

    return suggestions;
  }

  /**
   * Generate type definitions
   */
  private async generateTypeDefinitions(
    context: CompletionContext,
    intent: DeveloperIntent
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    if (context.language === 'typescript') {
      // Look for untyped variables and functions
      const untypedElements = this.findUntypedElements(context.content);
      
      for (const element of untypedElements) {
        const typeDefinition = this.generateTypeDefinition(element, context);
        
        suggestions.push({
          id: `type_${Date.now()}_${element.name}`,
          type: CompletionType.TYPE_DEFINITION,
          content: typeDefinition,
          description: `Type definition for ${element.name}`,
          confidence: 0.7,
          intentAlignment: this.calculateIntentAlignmentForSuggestion(intent, 'typing'),
          priority: 2,
          metadata: {
            language: context.language,
            paradigm: 'typed',
            estimatedTime: 45,
            dependencies: [],
            relatedFiles: [],
            testCoverage: 0,
            complexity: 'medium',
            riskLevel: 'low'
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Rank suggestions by intent alignment and confidence
   */
  private rankSuggestions(
    suggestions: CompletionSuggestion[],
    intent: DeveloperIntent
  ): CompletionSuggestion[] {
    return suggestions.sort((a, b) => {
      // Primary sort by intent alignment
      const intentDiff = b.intentAlignment - a.intentAlignment;
      if (Math.abs(intentDiff) > 0.1) {
        return intentDiff;
      }
      
      // Secondary sort by confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) {
        return confidenceDiff;
      }
      
      // Tertiary sort by priority
      return a.priority - b.priority;
    });
  }

  /**
   * Calculate overall intent alignment
   */
  private calculateIntentAlignment(
    suggestions: CompletionSuggestion[],
    intent: DeveloperIntent
  ): number {
    if (suggestions.length === 0) return 0;
    
    const totalAlignment = suggestions.reduce((sum, s) => sum + s.intentAlignment, 0);
    return totalAlignment / suggestions.length;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(suggestions: CompletionSuggestion[]): number {
    if (suggestions.length === 0) return 0;
    
    const totalConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0);
    return totalConfidence / suggestions.length;
  }

  /**
   * Cache completion result for learning
   */
  private cacheCompletionResult(context: CompletionContext, result: ThoughtCompletionResult): void {
    const key = this.generateContextKey(context);
    this.completionHistory.set(key, result.suggestions);
    
    // Limit cache size
    if (this.completionHistory.size > 1000) {
      const firstKey = this.completionHistory.keys().next().value;
      if (firstKey) {
        this.completionHistory.delete(firstKey);
      }
    }
  }

  /**
   * Generate context key for caching
   */
  private generateContextKey(context: CompletionContext): string {
    return `${context.filePath}:${context.cursorPosition.line}:${context.cursorPosition.column}:${context.content.length}`;
  }

  // Utility methods for context analysis

  private getCurrentLine(context: CompletionContext): string {
    const lines = context.content.split('\n');
    return lines[context.cursorPosition.line] || '';
  }

  private shouldSuggestFunction(line: string, context: CompletionContext): boolean {
    // More permissive function detection
    return line.includes('function') || 
           /\w+\s*\(/.test(line) ||
           line.includes('const') ||
           line.includes('let') ||
           line.includes('var') ||
           context.content.includes('function');
  }

  private extractFunctionName(line: string): string | null {
    const match = line.match(/(?:function\s+|const\s+|let\s+|var\s+)?(\w+)/);
    return match ? match[1] : null;
  }

  private inferParameters(context: CompletionContext, intent: DeveloperIntent): string[] {
    // Simple parameter inference based on context
    const currentLine = this.getCurrentLine(context);
    const paramMatch = currentLine.match(/\(([^)]*)\)/);
    if (paramMatch && paramMatch[1].trim()) {
      return paramMatch[1].split(',').map(p => p.trim());
    }
    return [];
  }

  private inferReturnType(context: CompletionContext, intent: DeveloperIntent): string {
    if (context.language === 'typescript') {
      // Infer return type based on context and intent
      if (intent.primaryGoal.type === GoalType.TESTING) return 'boolean';
      if (intent.primaryGoal.type === GoalType.REFACTORING) return 'void';
      return 'any';
    }
    return '';
  }

  private buildFunctionSignature(name: string, params: string[], returnType: string, language: string): string {
    const paramStr = params.join(', ');
    if (language === 'typescript' && returnType) {
      return `function ${name}(${paramStr}): ${returnType} {\n  // TODO: Implement\n}`;
    }
    return `function ${name}(${paramStr}) {\n  // TODO: Implement\n}`;
  }

  private extractFunctionSignatures(content: string): Array<{name: string, params: string[], returnType?: string, dependencies?: string[]}> {
    // Simple function signature extraction
    const signatures: Array<{name: string, params: string[], returnType?: string, dependencies?: string[]}> = [];
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?\s*{/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      signatures.push({
        name: match[1],
        params: match[2] ? match[2].split(',').map(p => p.trim()) : [],
        returnType: match[3],
        dependencies: []
      });
    }
    
    return signatures;
  }

  private needsImplementation(signature: {name: string}, content: string): boolean {
    // Check if function has only TODO or empty implementation
    const functionRegex = new RegExp(`function\\s+${signature.name}\\s*\\([^)]*\\)\\s*{([^}]*)}`, 's');
    const match = content.match(functionRegex);
    if (!match) return false;
    
    const body = match[1].trim();
    return body === '' || body.includes('TODO') || body.includes('throw new Error');
  }

  private generateImplementation(signature: {name: string, params: string[], returnType?: string}, intent: DeveloperIntent, context: CompletionContext): string {
    // Generate basic implementation based on function name and intent
    const functionName = signature.name;
    const params = signature.params || [];
    
    if (functionName.includes('test') || functionName.includes('Test')) {
      return `  // Test implementation\n  expect(true).toBe(true);`;
    }
    
    if (functionName.includes('get') || functionName.includes('fetch')) {
      return `  // Getter implementation\n  return null; // TODO: Implement getter logic`;
    }
    
    if (functionName.includes('set') || functionName.includes('update')) {
      return `  // Setter implementation\n  // TODO: Implement setter logic`;
    }
    
    return `  // TODO: Implement ${functionName}\n  throw new Error('Not implemented');`;
  }

  private extractFunctions(content: string): Array<{name: string, params: string[], sourceFile?: string}> {
    return this.extractFunctionSignatures(content).map(sig => ({
      name: sig.name,
      params: sig.params,
      sourceFile: undefined
    }));
  }

  private shouldGenerateTest(func: {name: string}, intent: DeveloperIntent): boolean {
    return intent.primaryGoal.type === GoalType.TESTING || 
           intent.subGoals.some(g => g.type === GoalType.TESTING) ||
           !func.name.includes('test');
  }

  private generateTestCase(func: {name: string, params: string[]}, framework: string, context: CompletionContext): string {
    const testName = `should test ${func.name}`;
    
    if (framework === 'jest') {
      return `describe('${func.name}', () => {\n  test('${testName}', () => {\n    // TODO: Implement test\n    expect(${func.name}()).toBeDefined();\n  });\n});`;
    }
    
    return `// Test for ${func.name}\n// TODO: Implement test`;
  }

  private findUncommentedFunctions(content: string): Array<{name: string, params: string[]}> {
    const functions = this.extractFunctions(content);
    const commented = new Set<string>();
    
    // Find functions with comments
    const commentRegex = /\/\*\*[\s\S]*?\*\/\s*function\s+(\w+)|\/\/.*\n\s*function\s+(\w+)/g;
    let match;
    while ((match = commentRegex.exec(content)) !== null) {
      commented.add(match[1] || match[2]);
    }
    
    return functions.filter(f => !commented.has(f.name));
  }

  private generateFunctionComment(func: {name: string, params: string[]}, context: CompletionContext): string {
    const params = func.params || [];
    const paramDocs = params.map(p => ` * @param ${p} - Description of ${p}`).join('\n');
    
    return `/**\n * Description of ${func.name}\n${paramDocs}\n * @returns Description of return value\n */`;
  }

  private findMissingImports(content: string, language: string): Array<{module: string, items: string[]}> {
    // Simple missing import detection
    const missingImports: Array<{module: string, items: string[]}> = [];
    
    // Look for common undefined references
    const commonModules = ['lodash', 'moment', 'axios', 'fs', 'path'];
    
    for (const module of commonModules) {
      // Check if module is used but not imported
      const moduleUsed = content.includes(`_.`) || content.includes(`${module}.`) || content.includes(`${module}(`);
      const moduleImported = content.includes(`import`) && content.includes(module) || content.includes(`require('${module}')`);
      
      if (moduleUsed && !moduleImported) {
        missingImports.push({
          module,
          items: [module]
        });
      }
    }
    
    return missingImports;
  }

  private generateImportStatement(importInfo: {module: string, items: string[]}, language: string): string {
    if (language === 'typescript' || language === 'javascript') {
      if (importInfo.items.length === 1 && importInfo.items[0] === importInfo.module) {
        return `import ${importInfo.module} from '${importInfo.module}';`;
      }
      return `import { ${importInfo.items.join(', ')} } from '${importInfo.module}';`;
    }
    return `// Import ${importInfo.module}`;
  }

  private findUntypedElements(content: string): Array<{name: string, type: 'variable' | 'function' | 'parameter'}> {
    const untyped: Array<{name: string, type: 'variable' | 'function' | 'parameter'}> = [];
    
    // Find untyped variables
    const varRegex = /(?:let|const|var)\s+(\w+)\s*=/g;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      if (!content.includes(`${match[1]}:`)) {
        untyped.push({name: match[1], type: 'variable'});
      }
    }
    
    return untyped;
  }

  private generateTypeDefinition(element: {name: string, type: 'variable' | 'function' | 'parameter'}, context: CompletionContext): string {
    switch (element.type) {
      case 'variable':
        return `${element.name}: any`;
      case 'function':
        return `function ${element.name}(): any`;
      case 'parameter':
        return `${element.name}: any`;
      default:
        return `${element.name}: any`;
    }
  }

  private inferPrimaryGoal(context: CompletionContext): Goal {
    // Infer primary goal from context
    const content = context.content.toLowerCase();
    
    if (content.includes('test') || content.includes('spec')) {
      return { 
        type: GoalType.TESTING, 
        description: 'Writing tests', 
        priority: 1,
        measurable: true,
        criteria: ['Test coverage > 80%', 'All tests pass']
      };
    }
    
    if (content.includes('refactor') || context.filePath.includes('refactor')) {
      return { 
        type: GoalType.REFACTORING, 
        description: 'Refactoring code', 
        priority: 1,
        measurable: true,
        criteria: ['Code complexity reduced', 'Maintainability improved']
      };
    }
    
    if (content.includes('debug') || content.includes('console.log')) {
      return { 
        type: GoalType.DEBUGGING, 
        description: 'Debugging code', 
        priority: 1,
        measurable: true,
        criteria: ['Bug identified', 'Issue resolved']
      };
    }
    
    return { 
      type: GoalType.IMPLEMENTATION, 
      description: 'Implementing features', 
      priority: 1,
      measurable: true,
      criteria: ['Feature works correctly', 'Requirements met']
    };
  }

  private inferSecondaryGoals(context: CompletionContext): Goal[] {
    const goals: Goal[] = [];
    const content = context.content.toLowerCase();
    
    if (content.includes('performance') || content.includes('optimize')) {
      goals.push({ 
        type: GoalType.OPTIMIZATION, 
        description: 'Optimizing performance', 
        priority: 2,
        measurable: true,
        criteria: ['Performance improved', 'Benchmarks met']
      });
    }
    
    if (content.includes('document') || content.includes('comment')) {
      goals.push({ 
        type: GoalType.DOCUMENTATION, 
        description: 'Improving documentation', 
        priority: 2,
        measurable: true,
        criteria: ['Documentation complete', 'Code well-commented']
      });
    }
    
    return goals;
  }

  private inferConstraints(context: CompletionContext): IntentConstraint[] {
    const constraints: IntentConstraint[] = [];
    
    if (context.projectContext?.testFramework) {
      constraints.push({
        type: 'FRAMEWORK' as any,
        description: `Use ${context.projectContext.testFramework} for testing`,
        mandatory: true,
        weight: 1.0
      });
    }
    
    if (context.language === 'typescript') {
      constraints.push({
        type: 'TYPE_SAFETY' as any,
        description: 'Maintain type safety',
        mandatory: true,
        weight: 0.9
      });
    }
    
    return constraints;
  }

  private inferPreferences(context: CompletionContext): DeveloperPreference[] {
    const preferences: DeveloperPreference[] = [];
    
    if (context.projectContext?.codeStyle) {
      preferences.push({
        category: 'CODING_STYLE' as any,
        value: context.projectContext.codeStyle,
        strength: 0.8,
        learned: false
      });
    }
    
    preferences.push({
      category: 'CODING_STYLE' as any,
      value: context.language,
      strength: 1.0,
      learned: false
    });
    
    return preferences;
  }

  private calculateIntentAlignmentForSuggestion(intent: DeveloperIntent, suggestionType: string): number {
    // Calculate how well the suggestion aligns with developer intent
    const primaryGoalAlignment = this.getGoalAlignment(intent.primaryGoal, suggestionType);
    const secondaryGoalAlignment = intent.subGoals.length > 0 
      ? intent.subGoals.reduce((sum: number, goal: Goal) => sum + this.getGoalAlignment(goal, suggestionType), 0) / intent.subGoals.length
      : 0;
    
    return (primaryGoalAlignment * 0.7) + (secondaryGoalAlignment * 0.3);
  }

  private getGoalAlignment(goal: Goal, suggestionType: string): number {
    const alignments: Record<string, Record<string, number>> = {
      [GoalType.TESTING]: {
        'testing': 1.0,
        'function': 0.6,
        'implementation': 0.4,
        'documentation': 0.3
      },
      [GoalType.REFACTORING]: {
        'implementation': 1.0,
        'function': 0.8,
        'typing': 0.7,
        'documentation': 0.5
      },
      [GoalType.DEBUGGING]: {
        'implementation': 0.8,
        'function': 0.6,
        'testing': 0.9,
        'documentation': 0.4
      },
      [GoalType.IMPLEMENTATION]: {
        'function': 1.0,
        'implementation': 0.9,
        'typing': 0.7,
        'import': 0.8
      }
    };
    
    return alignments[goal.type]?.[suggestionType] || 0.5;
  }

  private inferParadigm(intent: DeveloperIntent): string {
    if (intent.primaryGoal.type === GoalType.TESTING) return 'testing';
    if (intent.primaryGoal.type === GoalType.OPTIMIZATION) return 'functional';
    return 'imperative';
  }
}