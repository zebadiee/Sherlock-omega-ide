/**
 * SHERLOCK Ω ENHANCED AI ORCHESTRATOR
 * Advanced autonomous AI system with context-aware routing and deep analysis
 * "Nothing is truly impossible—only unconceived."
 */

import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';
import { CostAwareAIOrchestrator } from './cost-aware-orchestrator';

export class EnhancedAIOrchestrator extends CostAwareAIOrchestrator {
  private contextAnalyzer: ContextAnalyzer;
  private privacyDetector: PrivacyDetector;
  private astAnalyzer: ASTAnalyzer;
  private learningEngine: LearningEngine;

  constructor(platform: PlatformType) {
    super(platform);
    this.contextAnalyzer = new ContextAnalyzer();
    this.privacyDetector = new PrivacyDetector();
    this.astAnalyzer = new ASTAnalyzer();
    this.learningEngine = new LearningEngine();
  }

  async processEnhancedRequest(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const operationName = `processEnhancedRequest:${request.type}`;
    return await this.logger.time(operationName, async () => {
      this.logger.info(`🧠 Processing enhanced AI request: ${request.type}`, { requestId: request.id });

      try {
        // Step 1: Analyze code context for better routing
        const contextAnalysis = await this.contextAnalyzer.analyzeContext(request.context);
        
        // Step 2: Check for privacy-sensitive content
        const privacyAnalysis = await this.privacyDetector.analyzeSensitivity(request);
        
        // Step 3: Perform AST analysis if code is involved
        const astAnalysis = request.code ? await this.astAnalyzer.analyzeCode(request.code) : null;
        
        // Step 4: Enhanced model selection with context awareness
        const modelSelection = await this.selectContextAwareModel(request, contextAnalysis, privacyAnalysis);
        this.logger.info(`🤖 Model selected: ${modelSelection.modelId}. Reason: ${modelSelection.reason}`, { requestId: request.id });
        
        // Step 5: Execute with enhanced processing
        const response = await this.executeEnhancedRequest(request, modelSelection, astAnalysis);
        
        // Step 6: Learn from interaction
        await this.learningEngine.recordInteraction(request, response, contextAnalysis);
        
        return response;
      } catch (error) {
        this.logger.error(`❌ Error processing enhanced request ${request.id}`, { error: error as Error, requestType: request.type });
        // Implement graceful fallback or re-throw with more context
        throw error;
      }
    }, { requestId: request.id });
  }

  private async selectContextAwareModel(
    request: EnhancedAIRequest,
    contextAnalysis: ContextAnalysis,
    privacyAnalysis: PrivacyAnalysis
  ): Promise<ModelSelection> {
    // Force local model if privacy-sensitive content detected
    if (privacyAnalysis.isSensitive || request.privacyMode) {
      this.logger.info('🔒 Privacy-sensitive content detected - routing to local model');
      return {
        modelId: 'ollama/local',
        reason: 'Privacy protection',
        confidence: 1.0
      };
    }

    // Context-aware routing based on code complexity and task type
    const complexity = contextAnalysis.complexity;
    const taskType = request.type;

    if (taskType === 'code-completion' && complexity < 0.3) {
      return {
        modelId: 'groq/llama-3-70b',
        reason: 'Fast completion for simple code',
        confidence: 0.9
      };
    }

    if (taskType === 'code-analysis' && complexity > 0.7) {
      return {
        modelId: 'openrouter/gpt-4-turbo',
        reason: 'Complex analysis requires advanced reasoning',
        confidence: 0.95
      };
    }

    if (taskType === 'code-generation' && contextAnalysis.language === 'typescript') {
      return {
        modelId: 'openrouter/deepseek-coder',
        reason: 'Specialized for TypeScript code generation',
        confidence: 0.85
      };
    }

    // Fallback to cost-aware selection
    return {
      modelId: 'openrouter/fallback-model',
      reason: 'Fallback selection',
      confidence: 0.8
    };
  }

  private getRequiredCapabilities(taskType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'code-completion': ['code-generation', 'fast-inference'],
      'code-analysis': ['reasoning', 'analysis'],
      'explanation': ['reasoning', 'writing'],
      'debugging': ['debugging', 'reasoning'],
      'refactoring': ['code-generation', 'reasoning']
    };

    return capabilityMap[taskType] || ['general'];
  }

  private async executeEnhancedRequest(
    request: EnhancedAIRequest,
    modelSelection: ModelSelection,
    astAnalysis: ASTAnalysis | null
  ): Promise<EnhancedAIResponse> {
    const startTime = Date.now();

    // Enhance request with AST insights
    const enhancedPayload = {
      ...request.payload,
      astInsights: astAnalysis ? {
        complexity: astAnalysis.cyclomaticComplexity,
        patterns: astAnalysis.detectedPatterns,
        suggestions: astAnalysis.optimizationSuggestions
      } : undefined
    };

    // Execute with selected model - mock implementation for now
    const baseResponse = {
      id: `res-${Date.now()}`,
      requestId: request.id,
      result: 'Enhanced AI response',
      confidence: modelSelection.confidence,
      modelUsed: modelSelection.modelId,
      tokens: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
    };

    // Enhance response with additional insights
    const enhancedResponse: EnhancedAIResponse = {
      ...baseResponse,
      modelSelection,
      astAnalysis,
      contextInsights: {
        codeComplexity: astAnalysis?.cyclomaticComplexity || 0,
        detectedPatterns: astAnalysis?.detectedPatterns || [],
        confidenceScore: modelSelection.confidence
      },
      processingTime: Date.now() - startTime
    };

    return enhancedResponse;
  }
}

// Context Analysis System
class ContextAnalyzer {
  async analyzeContext(context: ProjectContext): Promise<ContextAnalysis> {
    return {
      complexity: this.calculateComplexity(context),
      language: this.detectLanguage(context),
      framework: this.detectFramework(context),
      patterns: this.identifyPatterns(context),
      dependencies: this.analyzeDependencies(context)
    };
  }

  private calculateComplexity(context: ProjectContext): number {
    // Simple complexity calculation based on file size and structure
    const fileCount = context.files?.length || 1;
    const totalSize = context.files?.reduce((sum, f) => sum + f.size, 0) || 100;
    const avgFileSize = totalSize / fileCount;
    
    return Math.min(1, (fileCount * avgFileSize) / 10000);
  }

  private detectLanguage(context: ProjectContext): string {
    // Detect primary language from file extensions
    const extensions = context.files?.map(f => f.extension) || [];
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp'
    };

    const mostCommon = extensions.reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryExt = Object.keys(mostCommon).reduce((a, b) => 
      mostCommon[a] > mostCommon[b] ? a : b, '.js');

    return langMap[primaryExt] || 'unknown';
  }

  private detectFramework(context: ProjectContext): string {
    // Detect framework from dependencies or file patterns
    const dependencies = context.dependencies || [];
    
    if (dependencies.includes('react')) return 'react';
    if (dependencies.includes('vue')) return 'vue';
    if (dependencies.includes('angular')) return 'angular';
    if (dependencies.includes('express')) return 'express';
    
    return 'none';
  }

  private identifyPatterns(context: ProjectContext): string[] {
    // Identify common architectural patterns
    const patterns: string[] = [];
    
    if (context.files?.some(f => f.name.includes('controller'))) {
      patterns.push('mvc');
    }
    
    if (context.files?.some(f => f.name.includes('service'))) {
      patterns.push('service-layer');
    }
    
    if (context.files?.some(f => f.name.includes('component'))) {
      patterns.push('component-based');
    }
    
    return patterns;
  }

  private analyzeDependencies(context: ProjectContext): DependencyAnalysis {
    const deps = context.dependencies || [];
    
    return {
      count: deps.length,
      categories: this.categorizeDependencies(deps),
      riskLevel: this.assessDependencyRisk(deps)
    };
  }

  private categorizeDependencies(deps: string[]): Record<string, number> {
    const categories: Record<string, number> = {
      ui: 0,
      backend: 0,
      testing: 0,
      build: 0,
      utility: 0
    };

    deps.forEach(dep => {
      if (['react', 'vue', 'angular'].includes(dep)) categories.ui++;
      else if (['express', 'fastify', 'koa'].includes(dep)) categories.backend++;
      else if (['jest', 'mocha', 'cypress'].includes(dep)) categories.testing++;
      else if (['webpack', 'vite', 'rollup'].includes(dep)) categories.build++;
      else categories.utility++;
    });

    return categories;
  }

  private assessDependencyRisk(deps: string[]): 'low' | 'medium' | 'high' {
    if (deps.length > 100) return 'high';
    if (deps.length > 50) return 'medium';
    return 'low';
  }
}

// Privacy Detection System
class PrivacyDetector {
  private sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /credential/i,
    /private[_-]?key/i,
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  ];

  async analyzeSensitivity(request: EnhancedAIRequest): Promise<PrivacyAnalysis> {
    const content = this.extractContent(request);
    const isSensitive = this.detectSensitiveContent(content);
    
    return {
      isSensitive,
      sensitivityScore: isSensitive ? 0.8 : 0.1,
      detectedPatterns: isSensitive ? ['credentials'] : [],
      recommendation: isSensitive ? 'use-local-model' : 'cloud-safe'
    };
  }

  private extractContent(request: EnhancedAIRequest): string {
    let content = '';
    
    if (request.code) content += request.code;
    if (request.payload && typeof request.payload === 'string') content += request.payload;
    if (request.context?.currentFile) content += request.context.currentFile;
    
    return content;
  }

  private detectSensitiveContent(content: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(content));
  }
}

// AST Analysis System
class ASTAnalyzer {
  async analyzeCode(code: string): Promise<ASTAnalysis> {
    // Mock AST analysis - in real implementation would use actual parser
    return {
      cyclomaticComplexity: this.calculateComplexity(code),
      detectedPatterns: this.detectPatterns(code),
      optimizationSuggestions: this.generateOptimizations(code),
      structuralMetrics: this.calculateMetrics(code)
    };
  }

  private calculateComplexity(code: string): number {
    // Simple complexity calculation
    const conditions = (code.match(/if|while|for|switch|catch/g) || []).length;
    const functions = (code.match(/function|=>/g) || []).length;
    
    return Math.max(1, conditions + functions);
  }

  private detectPatterns(code: string): string[] {
    const patterns: string[] = [];
    
    if (code.includes('recursive') || /function.*function/.test(code)) {
      patterns.push('recursion');
    }
    
    if ((code.match(/for/g) || []).length > 1) {
      patterns.push('nested-loops');
    }
    
    if (code.includes('async') && code.includes('await')) {
      patterns.push('async-pattern');
    }
    
    return patterns;
  }

  private generateOptimizations(code: string): string[] {
    const suggestions: string[] = [];
    
    if (code.includes('var ')) {
      suggestions.push('Replace var with let/const for better scoping');
    }
    
    if ((code.match(/for/g) || []).length > 1) {
      suggestions.push('Consider optimizing nested loops');
    }
    
    if (code.includes('==') && !code.includes('===')) {
      suggestions.push('Use strict equality (===) instead of loose equality (==)');
    }
    
    return suggestions;
  }

  private calculateMetrics(code: string): StructuralMetrics {
    return {
      linesOfCode: code.split('\n').length,
      functionCount: (code.match(/function|=>/g) || []).length,
      classCount: (code.match(/class /g) || []).length,
      commentRatio: this.calculateCommentRatio(code)
    };
  }

  private calculateCommentRatio(code: string): number {
    const totalLines = code.split('\n').length;
    const commentLines = (code.match(/\/\/|\/\*|\*\//g) || []).length;
    
    return totalLines > 0 ? commentLines / totalLines : 0;
  }
}

// Learning Engine
class LearningEngine {
  private interactions: InteractionRecord[] = [];

  async recordInteraction(
    request: EnhancedAIRequest,
    response: EnhancedAIResponse,
    context: ContextAnalysis
  ): Promise<void> {
    const record: InteractionRecord = {
      timestamp: new Date(),
      requestType: request.type,
      modelUsed: response.modelSelection.modelId,
      contextComplexity: context.complexity,
      responseTime: response.processingTime,
      success: response.confidence > 0.7
    };

    this.interactions.push(record);
    
    // Keep only last 1000 interactions
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000);
    }
  }

  getPerformanceInsights(): PerformanceInsights {
    const totalInteractions = this.interactions.length;
    const successRate = this.interactions.filter(i => i.success).length / totalInteractions;
    const avgResponseTime = this.interactions.reduce((sum, i) => sum + i.responseTime, 0) / totalInteractions;

    const modelPerformance = new Map<string, ModelPerformance>();
    this.interactions.forEach(interaction => {
      const model = interaction.modelUsed;
      if (!modelPerformance.has(model)) {
        modelPerformance.set(model, { usage: 0, avgResponseTime: 0, successRate: 0 });
      }
      
      const perf = modelPerformance.get(model)!;
      perf.usage++;
      perf.avgResponseTime = (perf.avgResponseTime + interaction.responseTime) / 2;
      perf.successRate = interaction.success ? (perf.successRate + 1) / 2 : perf.successRate / 2;
    });

    return {
      totalInteractions,
      successRate,
      avgResponseTime,
      modelPerformance: Object.fromEntries(modelPerformance)
    };
  }
}

// Enhanced Interfaces
interface EnhancedAIRequest {
  id: string;
  type: string;
  code?: string;
  payload: any;
  context: ProjectContext;
  privacyMode?: boolean;
}

interface EnhancedAIResponse {
  id: string;
  requestId: string;
  result: any;
  confidence: number;
  modelUsed: string;
  processingTime: number;
  tokens: TokenUsage;
  modelSelection: ModelSelection;
  astAnalysis: ASTAnalysis | null;
  contextInsights: ContextInsights;
}

interface ProjectContext {
  files?: Array<{ name: string; extension: string; size: number }>;
  dependencies?: string[];
  currentFile?: string;
}

interface ContextAnalysis {
  complexity: number;
  language: string;
  framework: string;
  patterns: string[];
  dependencies: DependencyAnalysis;
}

interface PrivacyAnalysis {
  isSensitive: boolean;
  sensitivityScore: number;
  detectedPatterns: string[];
  recommendation: string;
}

interface ASTAnalysis {
  cyclomaticComplexity: number;
  detectedPatterns: string[];
  optimizationSuggestions: string[];
  structuralMetrics: StructuralMetrics;
}

interface ModelSelection {
  modelId: string;
  reason: string;
  confidence: number;
}

interface ContextInsights {
  codeComplexity: number;
  detectedPatterns: string[];
  confidenceScore: number;
}

interface DependencyAnalysis {
  count: number;
  categories: Record<string, number>;
  riskLevel: 'low' | 'medium' | 'high';
}

interface StructuralMetrics {
  linesOfCode: number;
  functionCount: number;
  classCount: number;
  commentRatio: number;
}

interface InteractionRecord {
  timestamp: Date;
  requestType: string;
  modelUsed: string;
  contextComplexity: number;
  responseTime: number;
  success: boolean;
}

interface PerformanceInsights {
  totalInteractions: number;
  successRate: number;
  avgResponseTime: number;
  modelPerformance: Record<string, ModelPerformance>;
}

interface ModelPerformance {
  usage: number;
  avgResponseTime: number;
  successRate: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}