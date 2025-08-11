/**
 * Dependency Sensor for Sherlock Ω Omniscient Monitoring System
 * Monitors import/export relationships and dependency graph construction
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
} from '../types/core';

/**
 * Dependency information for a single import/export
 */
export interface DependencyInfo {
  source: string; // File that imports/exports
  target: string; // What is being imported/exported
  type: DependencyType;
  specifier: string; // The actual import/export specifier
  line: number;
  column: number;
  isResolved: boolean;
  resolvedPath?: string;
  version?: string;
  isExternal: boolean; // External package vs local file
}

export enum DependencyType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  DYNAMIC_IMPORT = 'DYNAMIC_IMPORT',
  REQUIRE = 'REQUIRE',
  TYPE_IMPORT = 'TYPE_IMPORT'
}

/**
 * Dependency graph node representing a module
 */
export interface DependencyNode {
  path: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  exports: Map<string, ExportInfo>;
  imports: Map<string, ImportInfo>;
  isExternal: boolean;
  lastModified: number;
  packageInfo?: PackageInfo;
}

/**
 * Import information
 */
export interface ImportInfo {
  specifier: string;
  imported: string[];
  line: number;
  column: number;
  type: DependencyType;
  isResolved: boolean;
  resolvedPath?: string;
}

/**
 * Export information
 */
export interface ExportInfo {
  exported: string[];
  line: number;
  column: number;
  isDefault: boolean;
  isReExport: boolean;
  source?: string;
}

/**
 * Package information from package.json
 */
export interface PackageInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

/**
 * Dependency resolution result
 */
export interface DependencyResolution {
  specifier: string;
  resolved: boolean;
  resolvedPath?: string;
  error?: string;
  suggestions?: string[];
}

/**
 * Dependency analyzer interface for different module systems
 */
export interface DependencyAnalyzer {
  language: string;
  extensions: string[];
  analyzeDependencies(code: string, filePath: string): Promise<DependencyInfo[]>;
  resolveSpecifier(specifier: string, fromPath: string): Promise<DependencyResolution>;
}

/**
 * TypeScript/JavaScript dependency analyzer
 */
export class TypeScriptDependencyAnalyzer implements DependencyAnalyzer {
  public readonly language = 'typescript';
  public readonly extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

  private packageInfo: PackageInfo | null = null;

  constructor(packageInfo?: PackageInfo) {
    this.packageInfo = packageInfo || null;
  }

  async analyzeDependencies(code: string, filePath: string): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Analyze different types of dependencies
      dependencies.push(...this.analyzeImports(line, lineNumber, filePath));
      dependencies.push(...this.analyzeExports(line, lineNumber, filePath));
      dependencies.push(...this.analyzeDynamicImports(line, lineNumber, filePath));
      dependencies.push(...this.analyzeRequires(line, lineNumber, filePath));
    }

    // Resolve all dependencies
    for (const dep of dependencies) {
      const resolution = await this.resolveSpecifier(dep.target, filePath);
      dep.isResolved = resolution.resolved;
      dep.resolvedPath = resolution.resolvedPath;
    }

    return dependencies;
  }

  async resolveSpecifier(specifier: string, fromPath: string): Promise<DependencyResolution> {
    try {
      // Handle relative imports
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const resolvedPath = this.resolveRelativePath(specifier, fromPath);
        return {
          specifier,
          resolved: true,
          resolvedPath
        };
      }

      // Handle absolute imports
      if (specifier.startsWith('/')) {
        return {
          specifier,
          resolved: true,
          resolvedPath: specifier
        };
      }

      // Handle node_modules packages
      if (this.packageInfo) {
        const isInDependencies = 
          this.packageInfo.dependencies[specifier] ||
          this.packageInfo.devDependencies[specifier] ||
          this.packageInfo.peerDependencies[specifier];

        if (isInDependencies) {
          return {
            specifier,
            resolved: true,
            resolvedPath: `node_modules/${specifier}`
          };
        }
      }

      // Check if it's a built-in Node.js module
      if (this.isBuiltinModule(specifier)) {
        return {
          specifier,
          resolved: true,
          resolvedPath: `node:${specifier}`
        };
      }

      // Unresolved dependency
      return {
        specifier,
        resolved: false,
        error: `Cannot resolve module '${specifier}'`,
        suggestions: this.generateSuggestions(specifier)
      };

    } catch (error) {
      return {
        specifier,
        resolved: false,
        error: (error as Error).message
      };
    }
  }

  private analyzeImports(line: string, lineNumber: number, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    // ES6 imports: import { x } from 'module'
    const importMatch = line.match(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/);
    if (importMatch) {
      const specifier = importMatch[1];
      dependencies.push({
        source: filePath,
        target: specifier,
        type: DependencyType.IMPORT,
        specifier: line.trim(),
        line: lineNumber,
        column: line.indexOf('import') + 1,
        isResolved: false,
        isExternal: !specifier.startsWith('.') && !specifier.startsWith('/')
      });
    }

    // Type-only imports: import type { x } from 'module'
    const typeImportMatch = line.match(/import\s+type\s+(?:\{[^}]*\}|\w+)\s+from\s+['"`]([^'"`]+)['"`]/);
    if (typeImportMatch) {
      const specifier = typeImportMatch[1];
      dependencies.push({
        source: filePath,
        target: specifier,
        type: DependencyType.TYPE_IMPORT,
        specifier: line.trim(),
        line: lineNumber,
        column: line.indexOf('import') + 1,
        isResolved: false,
        isExternal: !specifier.startsWith('.') && !specifier.startsWith('/')
      });
    }

    return dependencies;
  }

  private analyzeExports(line: string, lineNumber: number, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    // Re-exports: export { x } from 'module'
    const reExportMatch = line.match(/export\s+(?:\{[^}]*\}|\*(?:\s+as\s+\w+)?)\s+from\s+['"`]([^'"`]+)['"`]/);
    if (reExportMatch) {
      const specifier = reExportMatch[1];
      dependencies.push({
        source: filePath,
        target: specifier,
        type: DependencyType.EXPORT,
        specifier: line.trim(),
        line: lineNumber,
        column: line.indexOf('export') + 1,
        isResolved: false,
        isExternal: !specifier.startsWith('.') && !specifier.startsWith('/')
      });
    }

    return dependencies;
  }

  private analyzeDynamicImports(line: string, lineNumber: number, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    // Dynamic imports: import('module')
    const dynamicImportMatch = line.match(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    if (dynamicImportMatch) {
      const specifier = dynamicImportMatch[1];
      dependencies.push({
        source: filePath,
        target: specifier,
        type: DependencyType.DYNAMIC_IMPORT,
        specifier: line.trim(),
        line: lineNumber,
        column: line.indexOf('import(') + 1,
        isResolved: false,
        isExternal: !specifier.startsWith('.') && !specifier.startsWith('/')
      });
    }

    return dependencies;
  }

  private analyzeRequires(line: string, lineNumber: number, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    // CommonJS requires: require('module')
    const requireMatch = line.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    if (requireMatch) {
      const specifier = requireMatch[1];
      dependencies.push({
        source: filePath,
        target: specifier,
        type: DependencyType.REQUIRE,
        specifier: line.trim(),
        line: lineNumber,
        column: line.indexOf('require(') + 1,
        isResolved: false,
        isExternal: !specifier.startsWith('.') && !specifier.startsWith('/')
      });
    }

    return dependencies;
  }

  private resolveRelativePath(specifier: string, fromPath: string): string {
    // Simplified path resolution (in real implementation, would use proper path resolution)
    const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/'));
    return `${fromDir}/${specifier}`;
  }

  private isBuiltinModule(specifier: string): boolean {
    const builtinModules = [
      'fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util',
      'events', 'stream', 'buffer', 'child_process', 'cluster'
    ];
    return builtinModules.includes(specifier);
  }

  private generateSuggestions(specifier: string): string[] {
    const suggestions: string[] = [];

    // Common typos and alternatives
    const commonAlternatives: Record<string, string[]> = {
      'react': ['@types/react'],
      'lodash': ['lodash-es'],
      'moment': ['dayjs', 'date-fns'],
      'axios': ['fetch', 'node-fetch']
    };

    if (commonAlternatives[specifier]) {
      suggestions.push(...commonAlternatives[specifier]);
    }

    // Suggest adding to package.json
    suggestions.push(`Add "${specifier}" to package.json dependencies`);

    return suggestions;
  }
}

/**
 * Dependency Sensor monitors import/export relationships and dependency graphs
 */
export class DependencySensor extends BaseSensor {
  private analyzers: Map<string, DependencyAnalyzer> = new Map();
  private dependencyGraph: Map<string, DependencyNode> = new Map();
  private packageInfo: PackageInfo | null = null;

  constructor(config?: Partial<SensorConfig>) {
    super(SensorType.DEPENDENCY, {
      monitoringInterval: 200, // Slightly slower than syntax for dependency analysis
      sensitivity: 0.8,
      ...config
    });

    // Register default analyzers
    this.registerAnalyzer(new TypeScriptDependencyAnalyzer());
  }

  /**
   * Register a dependency analyzer for a specific language
   */
  public registerAnalyzer(analyzer: DependencyAnalyzer): void {
    this.analyzers.set(analyzer.language, analyzer);
    console.log(`📦 Registered ${analyzer.language} dependency analyzer`);
  }

  /**
   * Set package.json information for dependency resolution
   */
  public setPackageInfo(packageInfo: PackageInfo): void {
    this.packageInfo = packageInfo;
    
    // Update analyzers with package info
    for (const analyzer of this.analyzers.values()) {
      if (analyzer instanceof TypeScriptDependencyAnalyzer) {
        (analyzer as any).packageInfo = packageInfo;
      }
    }

    console.log(`📋 Updated package info: ${packageInfo.name}@${packageInfo.version}`);
  }

  /**
   * Add file to dependency monitoring
   */
  public async addFile(filePath: string, content: string): Promise<void> {
    const language = this.detectLanguage(filePath);
    const analyzer = this.analyzers.get(language);

    if (!analyzer) {
      console.warn(`No analyzer found for language: ${language}`);
      return;
    }

    try {
      const dependencies = await analyzer.analyzeDependencies(content, filePath);
      await this.updateDependencyGraph(filePath, dependencies);
      console.log(`📦 Added ${filePath} to dependency monitoring (${dependencies.length} dependencies)`);
    } catch (error) {
      console.error(`Error analyzing dependencies for ${filePath}:`, error);
    }
  }

  /**
   * Update file content and re-analyze dependencies
   */
  public async updateFile(filePath: string, content: string): Promise<void> {
    await this.addFile(filePath, content); // Re-analyze the file
  }

  /**
   * Remove file from dependency monitoring
   */
  public removeFile(filePath: string): void {
    const node = this.dependencyGraph.get(filePath);
    if (node) {
      // Remove this node from dependents of its dependencies
      for (const depPath of node.dependencies) {
        const depNode = this.dependencyGraph.get(depPath);
        if (depNode) {
          depNode.dependents.delete(filePath);
        }
      }

      // Remove this node from dependencies of its dependents
      for (const depPath of node.dependents) {
        const depNode = this.dependencyGraph.get(depPath);
        if (depNode) {
          depNode.dependencies.delete(filePath);
        }
      }

      this.dependencyGraph.delete(filePath);
      console.log(`🗑️ Removed ${filePath} from dependency monitoring`);
    }
  }

  /**
   * Get dependency issues for the entire project
   */
  public async getDependencyIssues(): Promise<ComputationalIssue[]> {
    const issues: ComputationalIssue[] = [];

    for (const [filePath, node] of this.dependencyGraph) {
      // Check for missing dependencies
      for (const [specifier, importInfo] of node.imports) {
        if (!importInfo.isResolved) {
          issues.push(this.createMissingDependencyIssue(filePath, importInfo, specifier));
        }
      }

      // Check for circular dependencies
      const circularDeps = this.detectCircularDependencies(filePath);
      if (circularDeps.length > 0) {
        issues.push(this.createCircularDependencyIssue(filePath, circularDeps));
      }

      // Check for unused dependencies
      if (this.packageInfo) {
        const unusedDeps = this.detectUnusedDependencies(filePath);
        for (const unusedDep of unusedDeps) {
          issues.push(this.createUnusedDependencyIssue(filePath, unusedDep));
        }
      }
    }

    return issues;
  }

  /**
   * Get dependency graph statistics
   */
  public getDependencyStats(): {
    totalFiles: number;
    totalDependencies: number;
    externalDependencies: number;
    circularDependencies: number;
    missingDependencies: number;
  } {
    let totalDependencies = 0;
    let externalDependencies = 0;
    let circularDependencies = 0;
    let missingDependencies = 0;

    for (const node of this.dependencyGraph.values()) {
      totalDependencies += node.dependencies.size;
      
      for (const [, importInfo] of node.imports) {
        if (!importInfo.isResolved) {
          missingDependencies++;
        }
      }

      // Count external dependencies
      for (const depPath of node.dependencies) {
        if (depPath.startsWith('node_modules/') || depPath.startsWith('node:')) {
          externalDependencies++;
        }
      }
    }

    // Count circular dependencies
    for (const filePath of this.dependencyGraph.keys()) {
      if (this.detectCircularDependencies(filePath).length > 0) {
        circularDependencies++;
      }
    }

    return {
      totalFiles: this.dependencyGraph.size,
      totalDependencies,
      externalDependencies,
      circularDependencies,
      missingDependencies
    };
  }

  /**
   * Perform dependency monitoring
   */
  protected async performMonitoring(): Promise<SensorResult> {
    const startTime = Date.now();
    const issues = await this.getDependencyIssues();
    const stats = this.getDependencyStats();

    const metrics = {
      ...stats,
      analysisTime: Date.now() - startTime
    };

    const status = this.determineStatus(issues);
    return this.createSensorResult(status, issues, metrics);
  }

  // Private helper methods

  private detectLanguage(filePath: string): string {
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    
    for (const [language, analyzer] of this.analyzers) {
      if (analyzer.extensions.includes(extension)) {
        return language;
      }
    }

    return 'unknown';
  }

  private async updateDependencyGraph(filePath: string, dependencies: DependencyInfo[]): Promise<void> {
    // Create or update node for this file
    let node = this.dependencyGraph.get(filePath);
    if (!node) {
      node = {
        path: filePath,
        dependencies: new Set(),
        dependents: new Set(),
        exports: new Map(),
        imports: new Map(),
        isExternal: false,
        lastModified: Date.now()
      };
      this.dependencyGraph.set(filePath, node);
    }

    // Clear existing dependencies and imports
    node.dependencies.clear();
    node.imports.clear();
    node.lastModified = Date.now();

    // Process dependencies
    for (const dep of dependencies) {
      if (dep.type === DependencyType.IMPORT || 
          dep.type === DependencyType.REQUIRE || 
          dep.type === DependencyType.DYNAMIC_IMPORT ||
          dep.type === DependencyType.TYPE_IMPORT) {
        
        node.imports.set(dep.target, {
          specifier: dep.target,
          imported: [], // Would be parsed from the import statement
          line: dep.line,
          column: dep.column,
          type: dep.type,
          isResolved: dep.isResolved,
          resolvedPath: dep.resolvedPath
        });

        if (dep.resolvedPath) {
          node.dependencies.add(dep.resolvedPath);
          
          // Update dependent's dependents set
          let depNode = this.dependencyGraph.get(dep.resolvedPath);
          if (!depNode && !dep.isExternal) {
            depNode = {
              path: dep.resolvedPath,
              dependencies: new Set(),
              dependents: new Set(),
              exports: new Map(),
              imports: new Map(),
              isExternal: dep.isExternal,
              lastModified: 0
            };
            this.dependencyGraph.set(dep.resolvedPath, depNode);
          }
          
          if (depNode) {
            depNode.dependents.add(filePath);
          }
        }
      }
    }
  }

  private detectCircularDependencies(filePath: string, visited: Set<string> = new Set(), path: string[] = []): string[] {
    if (visited.has(filePath)) {
      const cycleStart = path.indexOf(filePath);
      return cycleStart >= 0 ? path.slice(cycleStart) : [];
    }

    visited.add(filePath);
    path.push(filePath);

    const node = this.dependencyGraph.get(filePath);
    if (node) {
      for (const depPath of node.dependencies) {
        const cycle = this.detectCircularDependencies(depPath, new Set(visited), [...path]);
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }

    return [];
  }

  private detectUnusedDependencies(filePath: string): string[] {
    // Simplified unused dependency detection
    // In real implementation, would check if package dependencies are actually imported
    return [];
  }

  private createMissingDependencyIssue(filePath: string, importInfo: ImportInfo, specifier: string): ComputationalIssue {
    return {
      id: `missing-dep-${filePath}-${specifier}-${Date.now()}`,
      type: ProblemType.DEPENDENCY_MISSING,
      severity: SeverityLevel.HIGH,
      context: {
        file: filePath,
        line: importInfo.line,
        column: importInfo.column,
        scope: ['dependency'],
        relatedFiles: []
      },
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: SensorType.DEPENDENCY,
        confidence: 0.95,
        tags: ['missing-dependency', specifier, importInfo.type.toLowerCase()]
      }
    };
  }

  private createCircularDependencyIssue(filePath: string, cycle: string[]): ComputationalIssue {
    return {
      id: `circular-dep-${filePath}-${Date.now()}`,
      type: ProblemType.ARCHITECTURAL_INCONSISTENCY,
      severity: SeverityLevel.MEDIUM,
      context: {
        file: filePath,
        scope: ['dependency', 'architecture'],
        relatedFiles: cycle
      },
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: SensorType.DEPENDENCY,
        confidence: 0.9,
        tags: ['circular-dependency', 'architecture']
      }
    };
  }

  private createUnusedDependencyIssue(filePath: string, dependency: string): ComputationalIssue {
    return {
      id: `unused-dep-${filePath}-${dependency}-${Date.now()}`,
      type: ProblemType.ARCHITECTURAL_INCONSISTENCY,
      severity: SeverityLevel.LOW,
      context: {
        file: filePath,
        scope: ['dependency'],
        relatedFiles: []
      },
      preconditions: [],
      postconditions: [],
      constraints: [],
      metadata: {
        detectedAt: Date.now(),
        detectedBy: SensorType.DEPENDENCY,
        confidence: 0.8,
        tags: ['unused-dependency', dependency]
      }
    };
  }
}