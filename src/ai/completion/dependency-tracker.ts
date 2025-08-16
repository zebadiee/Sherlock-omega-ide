/**
 * Dependency Tracker
 * 
 * Tracks and analyzes project dependencies, imports, and API usage
 * for intelligent code completion and suggestion ranking.
 */

import {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  ProjectContext
} from '../interfaces';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor, MetricType } from '../../monitoring/performance-monitor';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Import analysis result
 */
export interface ImportAnalysis {
  module: string;
  importedSymbols: ImportedSymbol[];
  importType: ImportType;
  usageFrequency: number;
  lastUsed: Date;
  apiUsage: APIUsage[];
}

/**
 * Imported symbol information
 */
export interface ImportedSymbol {
  name: string;
  alias?: string;
  type: 'default' | 'named' | 'namespace' | 'side-effect';
  usageCount: number;
  usageContexts: string[];
  documentation?: string;
  signature?: string;
}

/**
 * Import type classification
 */
export enum ImportType {
  LIBRARY = 'library',           // External npm package
  RELATIVE = 'relative',         // ./file or ../file
  ABSOLUTE = 'absolute',         // /src/file
  NODE_BUILTIN = 'node_builtin', // fs, path, etc.
  TYPE_ONLY = 'type_only'        // TypeScript type imports
}

/**
 * API usage pattern
 */
export interface APIUsage {
  symbol: string;
  method?: string;
  pattern: string;
  frequency: number;
  examples: string[];
  commonMistakes: string[];
}

/**
 * Dependency recommendation
 */
export interface DependencyRecommendation {
  module: string;
  reason: string;
  confidence: number;
  usage: string;
  alternatives: string[];
}

/**
 * Dependency tracker for analyzing imports and API usage
 */
export class DependencyTracker {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private importCache: Map<string, ImportAnalysis[]> = new Map();
  private usageCache: Map<string, APIUsage[]> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(logger: Logger, performanceMonitor: PerformanceMonitor) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * Analyze imports and dependencies for a file
   */
  async analyzeFileImports(
    filePath: string,
    projectContext: ProjectContext
  ): Promise<ImportAnalysis[]> {
    const startTime = Date.now();

    try {
      this.logger.debug('Analyzing file imports', { filePath });

      // Check cache first
      const cached = this.importCache.get(filePath);
      if (cached && this.isCacheValid(filePath)) {
        return cached;
      }

      // Read file content
      const content = await this.readFileContent(filePath);
      
      // Parse imports
      const imports = this.parseImports(content);
      
      // Analyze each import
      const analyses: ImportAnalysis[] = [];
      for (const importInfo of imports) {
        const analysis = await this.analyzeImport(
          importInfo,
          content,
          filePath,
          projectContext
        );
        analyses.push(analysis);
      }

      // Cache results
      this.importCache.set(filePath, analyses);

      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('import_analysis_time', processingTime, MetricType.EXECUTION_TIME);

      this.logger.debug('File imports analyzed', {
        filePath,
        importCount: analyses.length,
        processingTime
      });

      return analyses;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Import analysis failed', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });
      return [];
    }
  }

  /**
   * Get API usage patterns for imported modules
   */
  async getAPIUsagePatterns(
    module: string,
    projectContext: ProjectContext
  ): Promise<APIUsage[]> {
    try {
      const cacheKey = `${module}:${projectContext.projectId}`;
      const cached = this.usageCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Analyze usage patterns across project
      const patterns = await this.analyzeModuleUsage(module, projectContext);
      
      // Cache results
      this.usageCache.set(cacheKey, patterns);

      return patterns;

    } catch (error) {
      this.logger.error('Failed to get API usage patterns', {
        module,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Get dependency recommendations based on current context
   */
  async getDependencyRecommendations(
    currentCode: string,
    projectContext: ProjectContext
  ): Promise<DependencyRecommendation[]> {
    try {
      const recommendations: DependencyRecommendation[] = [];

      // Analyze current code for potential dependencies
      const potentialDeps = this.identifyPotentialDependencies(currentCode);
      
      for (const dep of potentialDeps) {
        const recommendation = await this.createRecommendation(dep, projectContext);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Sort by confidence
      recommendations.sort((a, b) => b.confidence - a.confidence);

      return recommendations.slice(0, 5); // Top 5 recommendations

    } catch (error) {
      this.logger.error('Failed to get dependency recommendations', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Track usage of imported symbols
   */
  async trackSymbolUsage(
    filePath: string,
    symbol: string,
    context: string
  ): Promise<void> {
    try {
      const imports = this.importCache.get(filePath) || [];
      
      for (const importAnalysis of imports) {
        const importedSymbol = importAnalysis.importedSymbols.find(s => s.name === symbol);
        if (importedSymbol) {
          importedSymbol.usageCount++;
          importedSymbol.usageContexts.push(context);
          importAnalysis.usageFrequency++;
          importAnalysis.lastUsed = new Date();
          break;
        }
      }

      this.logger.debug('Symbol usage tracked', {
        filePath,
        symbol,
        context: context.substring(0, 50)
      });

    } catch (error) {
      this.logger.error('Failed to track symbol usage', {
        filePath,
        symbol,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get import suggestions for current context
   */
  async getImportSuggestions(
    currentCode: string,
    filePath: string,
    projectContext: ProjectContext
  ): Promise<ImportSuggestion[]> {
    try {
      const suggestions: ImportSuggestion[] = [];

      // Analyze undefined symbols in current code
      const undefinedSymbols = this.findUndefinedSymbols(currentCode);
      
      for (const symbol of undefinedSymbols) {
        const suggestion = await this.findImportForSymbol(
          symbol,
          filePath,
          projectContext
        );
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      return suggestions;

    } catch (error) {
      this.logger.error('Failed to get import suggestions', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Clear dependency tracking cache
   */
  clearCache(): void {
    this.importCache.clear();
    this.usageCache.clear();
    this.logger.debug('Dependency tracker cache cleared');
  }

  // Private helper methods

  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseImports(content: string): ParsedImport[] {
    const imports: ParsedImport[] = [];

    // ES6 imports
    const es6ImportRegex = /import\s+(?:([\w\s{},*]+)\s+from\s+)?['"]([^'"]+)['"];?/g;
    let match;

    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importClause = match[1];
      const modulePath = match[2];

      if (!importClause) {
        // Side-effect import: import 'module'
        imports.push({
          module: modulePath,
          type: ImportType.LIBRARY,
          symbols: [],
          raw: match[0]
        });
      } else {
        const symbols = this.parseImportClause(importClause);
        imports.push({
          module: modulePath,
          type: this.classifyImportType(modulePath),
          symbols,
          raw: match[0]
        });
      }
    }

    // CommonJS requires
    const requireRegex = /(?:const|let|var)\s+([\w{},\s]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const variableClause = match[1];
      const modulePath = match[2];
      const symbols = this.parseRequireClause(variableClause);

      imports.push({
        module: modulePath,
        type: this.classifyImportType(modulePath),
        symbols,
        raw: match[0]
      });
    }

    return imports;
  }

  private parseImportClause(clause: string): ParsedSymbol[] {
    const symbols: ParsedSymbol[] = [];
    
    // Default import: import React from 'react'
    const defaultMatch = clause.match(/^\s*(\w+)\s*$/);
    if (defaultMatch) {
      symbols.push({
        name: defaultMatch[1],
        type: 'default'
      });
      return symbols;
    }

    // Namespace import: import * as React from 'react'
    const namespaceMatch = clause.match(/^\s*\*\s+as\s+(\w+)\s*$/);
    if (namespaceMatch) {
      symbols.push({
        name: namespaceMatch[1],
        type: 'namespace'
      });
      return symbols;
    }

    // Named imports: import { Component, useState } from 'react'
    const namedMatch = clause.match(/\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      const namedImports = namedMatch[1].split(',');
      for (const namedImport of namedImports) {
        const trimmed = namedImport.trim();
        const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
        
        if (aliasMatch) {
          symbols.push({
            name: aliasMatch[1],
            alias: aliasMatch[2],
            type: 'named'
          });
        } else {
          symbols.push({
            name: trimmed,
            type: 'named'
          });
        }
      }
    }

    // Mixed import: import React, { Component } from 'react'
    const mixedMatch = clause.match(/^\s*(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s*$/);
    if (mixedMatch) {
      symbols.push({
        name: mixedMatch[1],
        type: 'default'
      });
      
      const namedImports = mixedMatch[2].split(',');
      for (const namedImport of namedImports) {
        symbols.push({
          name: namedImport.trim(),
          type: 'named'
        });
      }
    }

    return symbols;
  }

  private parseRequireClause(clause: string): ParsedSymbol[] {
    const symbols: ParsedSymbol[] = [];
    
    // Destructuring: const { readFile, writeFile } = require('fs')
    const destructureMatch = clause.match(/\{\s*([^}]+)\s*\}/);
    if (destructureMatch) {
      const destructuredVars = destructureMatch[1].split(',');
      for (const variable of destructuredVars) {
        symbols.push({
          name: variable.trim(),
          type: 'named'
        });
      }
    } else {
      // Simple assignment: const fs = require('fs')
      const simpleMatch = clause.match(/^\s*(\w+)\s*$/);
      if (simpleMatch) {
        symbols.push({
          name: simpleMatch[1],
          type: 'default'
        });
      }
    }

    return symbols;
  }

  private classifyImportType(modulePath: string): ImportType {
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return ImportType.RELATIVE;
    }
    
    if (modulePath.startsWith('/')) {
      return ImportType.ABSOLUTE;
    }
    
    if (this.isNodeBuiltin(modulePath)) {
      return ImportType.NODE_BUILTIN;
    }
    
    return ImportType.LIBRARY;
  }

  private isNodeBuiltin(modulePath: string): boolean {
    const builtins = [
      'fs', 'path', 'http', 'https', 'url', 'querystring', 'crypto',
      'os', 'util', 'events', 'stream', 'buffer', 'child_process',
      'cluster', 'net', 'tls', 'dgram', 'dns', 'readline', 'repl',
      'vm', 'zlib', 'assert', 'timers'
    ];
    
    return builtins.includes(modulePath) || modulePath.startsWith('node:');
  }

  private async analyzeImport(
    importInfo: ParsedImport,
    content: string,
    filePath: string,
    projectContext: ProjectContext
  ): Promise<ImportAnalysis> {
    const importedSymbols: ImportedSymbol[] = [];
    
    for (const symbol of importInfo.symbols) {
      const usageCount = this.countSymbolUsage(content, symbol.name, symbol.alias);
      const usageContexts = this.extractUsageContexts(content, symbol.name, symbol.alias);
      
      importedSymbols.push({
        name: symbol.name,
        alias: symbol.alias,
        type: symbol.type,
        usageCount,
        usageContexts
      });
    }

    const apiUsage = await this.analyzeAPIUsage(importInfo.module, content);

    return {
      module: importInfo.module,
      importedSymbols,
      importType: importInfo.type,
      usageFrequency: importedSymbols.reduce((sum, s) => sum + s.usageCount, 0),
      lastUsed: new Date(),
      apiUsage
    };
  }

  private countSymbolUsage(content: string, symbolName: string, alias?: string): number {
    const name = alias || symbolName;
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = content.match(regex);
    return matches ? matches.length - 1 : 0; // Subtract 1 for the import declaration
  }

  private extractUsageContexts(content: string, symbolName: string, alias?: string): string[] {
    const name = alias || symbolName;
    const lines = content.split('\n');
    const contexts: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(name) && !line.includes('import') && !line.includes('require')) {
        contexts.push(line.trim());
      }
    }
    
    return contexts.slice(0, 5); // Limit to 5 contexts
  }

  private async analyzeAPIUsage(module: string, content: string): Promise<APIUsage[]> {
    // Simplified API usage analysis
    // In production, this would analyze common patterns for specific libraries
    return [];
  }

  private async analyzeModuleUsage(
    module: string,
    projectContext: ProjectContext
  ): Promise<APIUsage[]> {
    // Would analyze usage patterns across the entire project
    return [];
  }

  private identifyPotentialDependencies(code: string): string[] {
    const potentialDeps: string[] = [];
    
    // Look for common patterns that suggest missing dependencies
    const patterns = [
      { pattern: /axios\./g, dependency: 'axios' },
      { pattern: /lodash\./g, dependency: 'lodash' },
      { pattern: /moment\(/g, dependency: 'moment' },
      { pattern: /React\./g, dependency: 'react' },
      { pattern: /useState|useEffect/g, dependency: 'react' }
    ];
    
    for (const { pattern, dependency } of patterns) {
      if (pattern.test(code)) {
        potentialDeps.push(dependency);
      }
    }
    
    return [...new Set(potentialDeps)];
  }

  private async createRecommendation(
    dependency: string,
    projectContext: ProjectContext
  ): Promise<DependencyRecommendation | null> {
    // Check if already installed
    const isInstalled = projectContext.dependencies.some(dep => dep.name === dependency);
    if (isInstalled) {
      return null;
    }

    // Create recommendation based on dependency
    const recommendations: Record<string, Partial<DependencyRecommendation>> = {
      'axios': {
        reason: 'HTTP client for making API requests',
        confidence: 0.9,
        usage: 'npm install axios',
        alternatives: ['fetch', 'node-fetch']
      },
      'lodash': {
        reason: 'Utility library for common programming tasks',
        confidence: 0.8,
        usage: 'npm install lodash',
        alternatives: ['ramda', 'native ES6 methods']
      },
      'react': {
        reason: 'JavaScript library for building user interfaces',
        confidence: 0.95,
        usage: 'npm install react react-dom',
        alternatives: ['vue', 'angular', 'svelte']
      }
    };

    const rec = recommendations[dependency];
    if (rec) {
      return {
        module: dependency,
        reason: rec.reason!,
        confidence: rec.confidence!,
        usage: rec.usage!,
        alternatives: rec.alternatives!
      };
    }

    return null;
  }

  private findUndefinedSymbols(code: string): string[] {
    // Simplified undefined symbol detection
    // In production, this would use AST analysis
    const symbols: string[] = [];
    
    // Look for common undefined patterns
    const undefinedRegex = /(\w+)\s+is\s+not\s+defined/g;
    let match;
    
    while ((match = undefinedRegex.exec(code)) !== null) {
      symbols.push(match[1]);
    }
    
    return [...new Set(symbols)];
  }

  private async findImportForSymbol(
    symbol: string,
    filePath: string,
    projectContext: ProjectContext
  ): Promise<ImportSuggestion | null> {
    // Would search for the symbol in available modules
    return null;
  }

  private isCacheValid(key: string): boolean {
    // Simplified cache validation
    return true;
  }
}

// Supporting interfaces

interface ParsedImport {
  module: string;
  type: ImportType;
  symbols: ParsedSymbol[];
  raw: string;
}

interface ParsedSymbol {
  name: string;
  alias?: string;
  type: 'default' | 'named' | 'namespace' | 'side-effect';
}

export interface ImportSuggestion {
  symbol: string;
  module: string;
  importStatement: string;
  confidence: number;
  description?: string;
}