/**
 * Context Engine Implementation
 * 
 * Handles project analysis, code context extraction, and pattern recognition
 * for intelligent AI assistance with caching optimization.
 */

import {
  ContextEngine as IContextEngine,
  ProjectContext,
  CodeContext,
  Position,
  Codebase,
  CodePattern,
  Interaction,
  CodeFile,
  ProjectStructure,
  DependencyGraph,
  CodebaseMetrics,
  FunctionInfo,
  VariableInfo,
  ScopeInfo,
  ParameterInfo,
  IdentifiedPattern,
  PatternOccurrence
} from './interfaces';
import { Logger } from '../logging/logger';
import { PerformanceMonitor, MetricType } from '../monitoring/performance-monitor';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ContextEngine implements IContextEngine {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private contextCache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private projectContexts: Map<string, ProjectContext> = new Map();
  private patternDatabase: Map<string, CodePattern[]> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(logger: Logger, performanceMonitor: PerformanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Analyze project structure and extract comprehensive context
   */
  async analyzeProject(projectPath: string): Promise<ProjectContext> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting project analysis', { projectPath });

      // Check cache first
      const cached = await this.getCachedContext(`project_${projectPath}`);
      if (cached) {
        this.logger.debug('Returning cached project context', { projectPath });
        return cached as ProjectContext;
      }

      // Analyze project structure
      const structure = await this.analyzeProjectStructure(projectPath);
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(projectPath);
      
      // Calculate code metrics
      const codeMetrics = await this.calculateCodeMetrics(structure);
      
      // Detect primary language and framework
      const { language, framework } = await this.detectLanguageAndFramework(structure);
      
      // Detect architecture pattern
      const architecture = await this.detectArchitecturePattern(structure);

      const context: ProjectContext = {
        projectId: this.generateProjectId(projectPath),
        language,
        framework,
        dependencies,
        architecture,
        codeMetrics,
        userPreferences: await this.loadUserPreferences(projectPath)
      };

      // Cache the context
      await this.cacheContext(`project_${projectPath}`, context);
      
      // Store in memory for quick access
      this.projectContexts.set(projectPath, context);

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('project_analysis_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.info('Project analysis completed', {
        projectPath,
        language,
        framework,
        dependencyCount: dependencies.length,
        processingTime
      });

      return context;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Project analysis failed', {
        projectPath,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });
      throw error;
    }
  }

  /**
   * Extract code context at specific position for AI assistance
   */
  async extractCodeContext(file: string, position: Position): Promise<CodeContext> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Extracting code context', { file, position });

      // Read file content
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      // Extract surrounding code
      const surroundingCode = this.extractSurroundingCode(lines, position);
      
      // Parse imports
      const imports = await this.parseImports(content);
      
      // Extract functions
      const functions = await this.extractFunctions(content);
      
      // Extract variables
      const variables = await this.extractVariables(content, position);
      
      // Determine scope
      const scope = await this.determineScopeAtPosition(content, position);

      const context: CodeContext = {
        currentFile: file,
        cursorPosition: position,
        surroundingCode,
        imports,
        functions,
        variables,
        scope
      };

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('code_context_extraction_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.debug('Code context extracted', {
        file,
        importsCount: imports.length,
        functionsCount: functions.length,
        variablesCount: variables.length,
        processingTime
      });

      return context;

    } catch (error) {
      this.logger.error('Code context extraction failed', {
        file,
        position,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update project context with new information
   */
  async updateContext(context: ProjectContext): Promise<void> {
    try {
      this.logger.debug('Updating project context', { projectId: context.projectId });

      // Update in-memory cache
      const projectPath = this.getProjectPathFromId(context.projectId);
      if (projectPath) {
        this.projectContexts.set(projectPath, context);
        
        // Update persistent cache
        await this.cacheContext(`project_${projectPath}`, context);
      }

      this.logger.debug('Project context updated successfully', { 
        projectId: context.projectId 
      });

    } catch (error) {
      this.logger.error('Failed to update project context', {
        projectId: context.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Identify code patterns in the codebase
   */
  async identifyPatterns(codebase: Codebase): Promise<CodePattern[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Identifying code patterns', {
        fileCount: codebase.files.length
      });

      const patterns: CodePattern[] = [];

      // Check cache first
      const cacheKey = `patterns_${this.generateCodebaseHash(codebase)}`;
      const cached = await this.getCachedContext(cacheKey);
      if (cached) {
        return cached as CodePattern[];
      }

      // Identify design patterns
      const designPatterns = await this.identifyDesignPatterns(codebase);
      patterns.push(...designPatterns);

      // Identify anti-patterns
      const antiPatterns = await this.identifyAntiPatterns(codebase);
      patterns.push(...antiPatterns);

      // Identify coding idioms
      const idioms = await this.identifyIdioms(codebase);
      patterns.push(...idioms);

      // Identify conventions
      const conventions = await this.identifyConventions(codebase);
      patterns.push(...conventions);

      // Cache results
      await this.cacheContext(cacheKey, patterns);

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('pattern_identification_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.info('Pattern identification completed', {
        patternCount: patterns.length,
        designPatterns: designPatterns.length,
        antiPatterns: antiPatterns.length,
        processingTime
      });

      return patterns;

    } catch (error) {
      this.logger.error('Pattern identification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Learn from user interactions to improve context understanding
   */
  async learnFromInteractions(interactions: Interaction[]): Promise<void> {
    try {
      this.logger.info('Learning from interactions', {
        interactionCount: interactions.length
      });

      // Analyze accepted vs rejected suggestions
      const acceptedInteractions = interactions.filter(i => i.accepted);
      const rejectedInteractions = interactions.filter(i => !i.accepted);

      // Update pattern confidence based on user feedback
      await this.updatePatternConfidence(acceptedInteractions, rejectedInteractions);

      // Learn new patterns from accepted interactions
      await this.learnNewPatterns(acceptedInteractions);

      // Update user preferences based on interactions
      await this.updateUserPreferencesFromInteractions(interactions);

      this.logger.info('Learning from interactions completed', {
        acceptedCount: acceptedInteractions.length,
        rejectedCount: rejectedInteractions.length
      });

    } catch (error) {
      this.logger.error('Failed to learn from interactions', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Cache context data with TTL
   */
  async cacheContext(key: string, context: unknown): Promise<void> {
    try {
      this.contextCache.set(key, {
        data: context,
        timestamp: Date.now()
      });

      this.logger.debug('Context cached', { key });

    } catch (error) {
      this.logger.warn('Failed to cache context', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get cached context if still valid
   */
  async getCachedContext(key: string): Promise<unknown | null> {
    try {
      const cached = this.contextCache.get(key);
      
      if (!cached) {
        return null;
      }

      // Check if cache is still valid
      if (Date.now() - cached.timestamp > this.CACHE_TTL) {
        this.contextCache.delete(key);
        return null;
      }

      this.logger.debug('Cache hit', { key });
      return cached.data;

    } catch (error) {
      this.logger.warn('Failed to get cached context', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const key of this.contextCache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.contextCache.delete(key);
      }

      this.logger.debug('Cache invalidated', {
        pattern,
        deletedKeys: keysToDelete.length
      });

    } catch (error) {
      this.logger.warn('Failed to invalidate cache', {
        pattern,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Private helper methods

  private async analyzeProjectStructure(projectPath: string): Promise<ProjectStructure> {
    // Implementation for analyzing project structure
    // This is a simplified version - full implementation would use AST parsing
    const structure: ProjectStructure = {
      rootPath: projectPath,
      directories: [],
      files: [],
      packageInfo: await this.loadPackageInfo(projectPath)
    };

    return structure;
  }

  private async analyzeDependencies(projectPath: string): Promise<any[]> {
    // Implementation for dependency analysis
    return [];
  }

  private async calculateCodeMetrics(structure: ProjectStructure): Promise<any> {
    // Implementation for code metrics calculation
    return {
      linesOfCode: 0,
      complexity: 0,
      testCoverage: 0,
      technicalDebt: 0,
      maintainabilityIndex: 0
    };
  }

  private async detectLanguageAndFramework(structure: ProjectStructure): Promise<{ language: string; framework?: string }> {
    // Implementation for language and framework detection
    return { language: 'typescript', framework: 'node' };
  }

  private async detectArchitecturePattern(structure: ProjectStructure): Promise<any> {
    // Implementation for architecture pattern detection
    return 'unknown';
  }

  private async loadUserPreferences(projectPath: string): Promise<any> {
    // Implementation for loading user preferences
    return {
      codingStyle: {
        indentation: 'spaces',
        indentSize: 2,
        lineLength: 100,
        namingConvention: 'camelCase',
        bracketStyle: 'same-line'
      },
      preferredPatterns: [],
      completionSettings: {
        enabled: true,
        triggerCharacters: ['.', '(', '['],
        maxSuggestions: 10,
        minConfidence: 0.7,
        showDocumentation: true
      },
      privacyLevel: 'internal',
      modelPreferences: {
        preferredProviders: ['openai', 'ollama'],
        fallbackStrategy: 'most_accurate',
        maxCostPerRequest: 0.01,
        localOnly: false
      }
    };
  }

  private generateProjectId(projectPath: string): string {
    // Generate unique project ID based on path
    return Buffer.from(projectPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private getProjectPathFromId(projectId: string): string | null {
    // Reverse lookup project path from ID
    for (const [path, context] of this.projectContexts.entries()) {
      if (context.projectId === projectId) {
        return path;
      }
    }
    return null;
  }

  private extractSurroundingCode(lines: string[], position: Position): string {
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(lines.length - 1, position.line + 10);
    return lines.slice(startLine, endLine + 1).join('\n');
  }

  private async parseImports(content: string): Promise<string[]> {
    // Simple regex-based import parsing - would use AST in production
    const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"];?$/gm;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private async extractFunctions(content: string): Promise<FunctionInfo[]> {
    // Simple function extraction - would use AST in production
    const functionRegex = /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*)?(?:async\s+)?(?:function\s*)?\([^)]*\)/g;
    const functions: FunctionInfo[] = [];
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        parameters: [], // Would be extracted from AST
        returnType: 'unknown',
        startLine: content.substring(0, match.index).split('\n').length - 1,
        endLine: 0 // Would be calculated from AST
      });
    }

    return functions;
  }

  private async extractVariables(content: string, position: Position): Promise<VariableInfo[]> {
    // Simple variable extraction - would use AST in production
    return [];
  }

  private async determineScopeAtPosition(content: string, position: Position): Promise<ScopeInfo> {
    // Simple scope determination - would use AST in production
    return {
      type: 'module',
      name: 'global',
      variables: []
    };
  }

  private async loadPackageInfo(projectPath: string): Promise<any> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private generateCodebaseHash(codebase: Codebase): string {
    // Generate hash based on codebase structure for caching
    const hashInput = codebase.files.map(f => `${f.path}:${f.size}:${f.lastModified.getTime()}`).join('|');
    return Buffer.from(hashInput).toString('base64').substring(0, 16);
  }

  private async identifyDesignPatterns(codebase: Codebase): Promise<CodePattern[]> {
    // Implementation for design pattern identification
    return [];
  }

  private async identifyAntiPatterns(codebase: Codebase): Promise<CodePattern[]> {
    // Implementation for anti-pattern identification
    return [];
  }

  private async identifyIdioms(codebase: Codebase): Promise<CodePattern[]> {
    // Implementation for idiom identification
    return [];
  }

  private async identifyConventions(codebase: Codebase): Promise<CodePattern[]> {
    // Implementation for convention identification
    return [];
  }

  private async updatePatternConfidence(
    accepted: Interaction[], 
    rejected: Interaction[]
  ): Promise<void> {
    // Implementation for updating pattern confidence based on user feedback
  }

  private async learnNewPatterns(interactions: Interaction[]): Promise<void> {
    // Implementation for learning new patterns from user interactions
  }

  private async updateUserPreferencesFromInteractions(interactions: Interaction[]): Promise<void> {
    // Implementation for updating user preferences based on interactions
  }
}