/**
 * Project Analyzer
 * 
 * Analyzes project structure, dependencies, and patterns to provide
 * intelligent context for code completion with caching optimization.
 */

import {
  ProjectContext,
  Codebase,
  CodeFile,
  ProjectStructure,
  DependencyGraph,
  CodebaseMetrics,
  CodePattern,
  IdentifiedPattern
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Project analysis result
 */
export interface ProjectAnalysis {
  structure: ProjectStructure;
  dependencies: DependencyGraph;
  metrics: CodebaseMetrics;
  patterns: IdentifiedPattern[];
  symbols: ProjectSymbol[];
  types: TypeDefinition[];
}

/**
 * Project symbol information
 */
export interface ProjectSymbol {
  name: string;
  type: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'constant' | 'enum';
  file: string;
  line: number;
  scope: 'public' | 'private' | 'protected' | 'internal';
  documentation?: string;
  signature?: string;
  isExported: boolean;
  usageCount: number;
}

/**
 * Type definition information
 */
export interface TypeDefinition {
  name: string;
  kind: 'interface' | 'type' | 'class' | 'enum';
  file: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  isGeneric: boolean;
  genericConstraints?: string[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  documentation?: string;
}

export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  isStatic: boolean;
  documentation?: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

/**
 * Project analyzer for understanding codebase structure and patterns
 */
export class ProjectAnalyzer {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private analysisCache: Map<string, ProjectAnalysis> = new Map();
  private symbolCache: Map<string, ProjectSymbol[]> = new Map();
  private readonly CACHE_TTL = 600000; // 10 minutes

  constructor(logger: Logger, performanceMonitor: PerformanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Analyze complete project structure and patterns
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting project analysis', { projectPath });

      // Check cache first
      const cached = this.getCachedAnalysis(projectPath);
      if (cached) {
        this.logger.debug('Returning cached project analysis', { projectPath });
        return cached;
      }

      // Analyze project structure
      const structure = await this.analyzeProjectStructure(projectPath);
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(projectPath, structure);
      
      // Calculate metrics
      const metrics = await this.calculateCodebaseMetrics(structure);
      
      // Identify patterns
      const patterns = await this.identifyCodePatterns(structure);
      
      // Extract symbols
      const symbols = await this.extractProjectSymbols(structure);
      
      // Extract type definitions
      const types = await this.extractTypeDefinitions(structure);

      const analysis: ProjectAnalysis = {
        structure,
        dependencies,
        metrics,
        patterns,
        symbols,
        types
      };

      // Cache the analysis
      this.cacheAnalysis(projectPath, analysis);

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('project_analysis_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.info('Project analysis completed', {
        projectPath,
        fileCount: structure.files.length,
        symbolCount: symbols.length,
        typeCount: types.length,
        processingTime
      });

      return analysis;

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
   * Get symbols available in project scope
   */
  async getProjectSymbols(projectPath: string, filter?: {
    kind?: string[];
    scope?: string[];
    exported?: boolean;
  }): Promise<ProjectSymbol[]> {
    try {
      const cacheKey = `${projectPath}:symbols`;
      let symbols = this.symbolCache.get(cacheKey);

      if (!symbols) {
        const analysis = await this.analyzeProject(projectPath);
        symbols = analysis.symbols;
        this.symbolCache.set(cacheKey, symbols);
      }

      // Apply filters
      if (filter) {
        symbols = symbols.filter(symbol => {
          if (filter.kind && !filter.kind.includes(symbol.kind)) {
            return false;
          }
          if (filter.scope && !filter.scope.includes(symbol.scope)) {
            return false;
          }
          if (filter.exported !== undefined && symbol.isExported !== filter.exported) {
            return false;
          }
          return true;
        });
      }

      return symbols;

    } catch (error) {
      this.logger.error('Failed to get project symbols', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Get type definitions available in project
   */
  async getTypeDefinitions(projectPath: string): Promise<TypeDefinition[]> {
    try {
      const analysis = await this.analyzeProject(projectPath);
      return analysis.types;
    } catch (error) {
      this.logger.error('Failed to get type definitions', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Find symbols by name or pattern
   */
  async findSymbols(
    projectPath: string, 
    query: string, 
    options?: {
      fuzzy?: boolean;
      limit?: number;
      includePrivate?: boolean;
    }
  ): Promise<ProjectSymbol[]> {
    try {
      const symbols = await this.getProjectSymbols(projectPath);
      const { fuzzy = true, limit = 50, includePrivate = false } = options || {};

      let filtered = symbols.filter(symbol => {
        if (!includePrivate && symbol.scope === 'private') {
          return false;
        }

        if (fuzzy) {
          return this.fuzzyMatch(symbol.name, query);
        } else {
          return symbol.name.toLowerCase().includes(query.toLowerCase());
        }
      });

      // Sort by relevance
      filtered = filtered.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, query);
        const bScore = this.calculateRelevanceScore(b, query);
        return bScore - aScore;
      });

      return filtered.slice(0, limit);

    } catch (error) {
      this.logger.error('Failed to find symbols', {
        projectPath,
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Invalidate analysis cache
   */
  invalidateCache(projectPath?: string): void {
    if (projectPath) {
      this.analysisCache.delete(projectPath);
      this.symbolCache.delete(`${projectPath}:symbols`);
    } else {
      this.analysisCache.clear();
      this.symbolCache.clear();
    }
    
    this.logger.debug('Project analysis cache invalidated', { projectPath });
  }

  // Private helper methods

  private async analyzeProjectStructure(projectPath: string): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      rootPath: projectPath,
      directories: [],
      files: [],
      packageInfo: await this.loadPackageInfo(projectPath)
    };

    try {
      await this.scanDirectory(projectPath, structure);
    } catch (error) {
      this.logger.warn('Failed to scan project directory', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return structure;
  }

  private async scanDirectory(dirPath: string, structure: ProjectStructure): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(structure.rootPath, fullPath);

        // Skip node_modules and other ignored directories
        if (this.shouldIgnorePath(entry.name, relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const dirInfo = {
            path: relativePath,
            name: entry.name,
            children: []
          };
          structure.directories.push(dirInfo);
          
          // Recursively scan subdirectory
          await this.scanDirectory(fullPath, structure);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const fileInfo = {
            path: relativePath,
            name: entry.name,
            extension: path.extname(entry.name),
            size: stats.size,
            type: this.determineFileType(entry.name)
          };
          structure.files.push(fileInfo);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to scan directory', {
        dirPath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private shouldIgnorePath(name: string, relativePath: string): boolean {
    const ignoredDirs = [
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      'coverage',
      '.nyc_output'
    ];

    const ignoredPatterns = [
      /^\..*/, // Hidden files/directories
      /.*\.log$/,
      /.*\.tmp$/
    ];

    return ignoredDirs.includes(name) || 
           ignoredPatterns.some(pattern => pattern.test(name));
  }

  private determineFileType(filename: string): 'source' | 'test' | 'config' | 'documentation' | 'asset' {
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext).toLowerCase();

    // Test files
    if (basename.includes('test') || basename.includes('spec') || 
        filename.includes('.test.') || filename.includes('.spec.')) {
      return 'test';
    }

    // Configuration files
    if (['.json', '.yaml', '.yml', '.toml', '.ini'].includes(ext) ||
        ['package.json', 'tsconfig.json', '.eslintrc', '.prettierrc'].includes(filename)) {
      return 'config';
    }

    // Documentation
    if (['.md', '.txt', '.rst'].includes(ext) || basename === 'readme') {
      return 'documentation';
    }

    // Source files
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
      return 'source';
    }

    return 'asset';
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

  private async analyzeDependencies(
    projectPath: string, 
    structure: ProjectStructure
  ): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
      cycles: [],
      depth: 0
    };

    try {
      // Analyze package.json dependencies
      if (structure.packageInfo) {
        const deps = {
          ...structure.packageInfo.dependencies,
          ...structure.packageInfo.devDependencies
        };

        for (const [name, version] of Object.entries(deps)) {
          graph.nodes.push({
            id: name,
            name,
            version: version as string,
            type: 'external',
            size: 0
          });
        }
      }

      // Analyze internal dependencies
      const sourceFiles = structure.files.filter(f => f.type === 'source');
      for (const file of sourceFiles) {
        await this.analyzeFileDependencies(projectPath, file, graph);
      }

      // Calculate depth and detect cycles
      graph.depth = this.calculateDependencyDepth(graph);
      graph.cycles = this.detectDependencyCycles(graph);

    } catch (error) {
      this.logger.error('Failed to analyze dependencies', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return graph;
  }

  private async analyzeFileDependencies(
    projectPath: string,
    file: any,
    graph: DependencyGraph
  ): Promise<void> {
    try {
      const filePath = path.join(projectPath, file.path);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Add file as node
      graph.nodes.push({
        id: file.path,
        name: file.name,
        version: '1.0.0',
        type: 'internal',
        size: file.size
      });

      // Parse imports
      const imports = this.parseFileImports(content);
      for (const importPath of imports) {
        graph.edges.push({
          from: file.path,
          to: importPath,
          type: 'import',
          weight: 1
        });
      }

    } catch (error) {
      this.logger.warn('Failed to analyze file dependencies', {
        file: file.path,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private parseFileImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+.*?from\s+['"]([^'"]+)['"];?/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private calculateDependencyDepth(graph: DependencyGraph): number {
    // Simple depth calculation - would use proper graph algorithms in production
    return Math.max(0, ...graph.nodes.map(() => 1));
  }

  private detectDependencyCycles(graph: DependencyGraph): string[][] {
    // Simplified cycle detection - would use proper algorithms in production
    return [];
  }

  private async calculateCodebaseMetrics(structure: ProjectStructure): Promise<CodebaseMetrics> {
    let totalFiles = 0;
    let totalLines = 0;
    let averageComplexity = 0;
    let testCoverage = 0;
    let duplicateCode = 0;

    const sourceFiles = structure.files.filter(f => f.type === 'source');
    totalFiles = sourceFiles.length;

    // Calculate metrics for each source file
    for (const file of sourceFiles) {
      try {
        const metrics = await this.calculateFileMetrics(structure.rootPath, file);
        totalLines += metrics.lines;
        averageComplexity += metrics.complexity;
      } catch (error) {
        this.logger.warn('Failed to calculate file metrics', {
          file: file.path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (totalFiles > 0) {
      averageComplexity = averageComplexity / totalFiles;
    }

    return {
      totalFiles,
      totalLines,
      averageComplexity,
      testCoverage,
      duplicateCode,
      technicalDebt: {
        totalMinutes: 0,
        categories: {},
        hotspots: []
      }
    };
  }

  private async calculateFileMetrics(projectPath: string, file: any): Promise<{
    lines: number;
    complexity: number;
  }> {
    try {
      const filePath = path.join(projectPath, file.path);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      // Simple complexity calculation
      const complexity = this.calculateCyclomaticComplexity(content);
      
      return { lines, complexity };
    } catch (error) {
      return { lines: 0, complexity: 0 };
    }
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Simplified complexity calculation
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    let complexity = 1; // Base complexity

    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private async identifyCodePatterns(structure: ProjectStructure): Promise<IdentifiedPattern[]> {
    const patterns: IdentifiedPattern[] = [];

    try {
      // Analyze architectural patterns
      const archPatterns = await this.identifyArchitecturalPatterns(structure);
      patterns.push(...archPatterns);

      // Analyze design patterns
      const designPatterns = await this.identifyDesignPatterns(structure);
      patterns.push(...designPatterns);

    } catch (error) {
      this.logger.error('Failed to identify code patterns', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return patterns;
  }

  private async identifyArchitecturalPatterns(structure: ProjectStructure): Promise<IdentifiedPattern[]> {
    const patterns: IdentifiedPattern[] = [];

    // Check for MVC pattern
    const hasControllers = structure.directories.some(d => d.name.includes('controller'));
    const hasModels = structure.directories.some(d => d.name.includes('model'));
    const hasViews = structure.directories.some(d => d.name.includes('view'));

    if (hasControllers && hasModels && hasViews) {
      patterns.push({
        id: 'mvc-pattern',
        name: 'Model-View-Controller',
        type: 'design_pattern',
        confidence: 0.8,
        frequency: 1,
        impact: 'positive',
        occurrences: [],
        description: 'MVC architectural pattern detected',
        suggestions: ['Consider using dependency injection', 'Ensure proper separation of concerns']
      });
    }

    return patterns;
  }

  private async identifyDesignPatterns(structure: ProjectStructure): Promise<IdentifiedPattern[]> {
    // Would analyze code for design patterns like Singleton, Factory, Observer, etc.
    return [];
  }

  private async extractProjectSymbols(structure: ProjectStructure): Promise<ProjectSymbol[]> {
    const symbols: ProjectSymbol[] = [];

    const sourceFiles = structure.files.filter(f => f.type === 'source');
    for (const file of sourceFiles) {
      try {
        const fileSymbols = await this.extractFileSymbols(structure.rootPath, file);
        symbols.push(...fileSymbols);
      } catch (error) {
        this.logger.warn('Failed to extract symbols from file', {
          file: file.path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return symbols;
  }

  private async extractFileSymbols(projectPath: string, file: any): Promise<ProjectSymbol[]> {
    const symbols: ProjectSymbol[] = [];

    try {
      const filePath = path.join(projectPath, file.path);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract functions
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        symbols.push({
          name: match[1],
          type: 'function',
          kind: 'function',
          file: file.path,
          line,
          scope: match[0].includes('export') ? 'public' : 'private',
          isExported: match[0].includes('export'),
          usageCount: 0
        });
      }

      // Extract classes
      const classRegex = /(?:export\s+)?class\s+(\w+)/g;
      while ((match = classRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        symbols.push({
          name: match[1],
          type: 'class',
          kind: 'class',
          file: file.path,
          line,
          scope: match[0].includes('export') ? 'public' : 'private',
          isExported: match[0].includes('export'),
          usageCount: 0
        });
      }

      // Extract interfaces (TypeScript)
      const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
      while ((match = interfaceRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        symbols.push({
          name: match[1],
          type: 'interface',
          kind: 'interface',
          file: file.path,
          line,
          scope: match[0].includes('export') ? 'public' : 'private',
          isExported: match[0].includes('export'),
          usageCount: 0
        });
      }

    } catch (error) {
      this.logger.warn('Failed to read file for symbol extraction', {
        file: file.path,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return symbols;
  }

  private async extractTypeDefinitions(structure: ProjectStructure): Promise<TypeDefinition[]> {
    const types: TypeDefinition[] = [];

    const sourceFiles = structure.files.filter(f => 
      f.type === 'source' && (f.extension === '.ts' || f.extension === '.tsx')
    );

    for (const file of sourceFiles) {
      try {
        const fileTypes = await this.extractFileTypes(structure.rootPath, file);
        types.push(...fileTypes);
      } catch (error) {
        this.logger.warn('Failed to extract types from file', {
          file: file.path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return types;
  }

  private async extractFileTypes(projectPath: string, file: any): Promise<TypeDefinition[]> {
    // Would extract TypeScript type definitions
    // This is a simplified implementation
    return [];
  }

  private getCachedAnalysis(projectPath: string): ProjectAnalysis | null {
    const cached = this.analysisCache.get(projectPath);
    if (cached) {
      // Check if cache is still valid (simplified check)
      return cached;
    }
    return null;
  }

  private cacheAnalysis(projectPath: string, analysis: ProjectAnalysis): void {
    this.analysisCache.set(projectPath, analysis);
  }

  private fuzzyMatch(text: string, query: string): boolean {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let textIndex = 0;
    let queryIndex = 0;
    
    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }
    
    return queryIndex === queryLower.length;
  }

  private calculateRelevanceScore(symbol: ProjectSymbol, query: string): number {
    let score = 0;
    
    // Exact match bonus
    if (symbol.name.toLowerCase() === query.toLowerCase()) {
      score += 100;
    }
    
    // Starts with bonus
    if (symbol.name.toLowerCase().startsWith(query.toLowerCase())) {
      score += 50;
    }
    
    // Usage frequency bonus
    score += Math.min(symbol.usageCount, 20);
    
    // Export bonus (public symbols are more relevant)
    if (symbol.isExported) {
      score += 10;
    }
    
    return score;
  }
}