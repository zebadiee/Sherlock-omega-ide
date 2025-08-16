/**
 * Web Pattern Keeper - Browser-Optimized Mathematical Harmony Detection
 * Optimized for Web Workers and browser constraints
 */

import { PatternKeeper } from './pattern-keeper';
import { PlatformOptimization } from '../base/whispering-observer';
import {
  PlatformType,
  ObservationContext,
  WhisperSuggestion,
  RenderLocation,
  WhisperTiming
} from '../../core/whispering-interfaces';
import { UnifiedObserverContext, EnvironmentType } from '../../types/unified';
import { PlatformAdapter } from '../../core/platform-interfaces';
import { MathematicalHarmony } from '../../types/whispering';

/**
 * Web-optimized Pattern Keeper implementation
 * Uses Web Workers for background analysis and browser-specific optimizations
 */
export class WebPatternKeeper extends PatternKeeper {
  private worker: any | null = null;
  private analysisQueue: AnalysisTask[] = [];
  private isWorkerReady = false;
  private workerTimeout = 30000; // 30 seconds
  private fallbackToMainThread = false;

  constructor(adapter: PlatformAdapter, context: UnifiedObserverContext) {
    super(adapter, context);
    this.initializeWebWorker();
  }

  // Web-specific initialization
  protected async initializeWebEnvironment(): Promise<void> {
    await super.initializeWebEnvironment();
    
    if (this.observerContext.environment.type === EnvironmentType.WEB_WORKER) {
      await this.setupWebWorker();
    } else {
      console.log('🌙 Pattern Keeper: Web Worker not available, using main thread');
      this.fallbackToMainThread = true;
    }
  }

  protected async performWebMonitoring(): Promise<any> {
    const baseMonitoring = await super.performWebMonitoring();
    
    return {
      ...baseMonitoring,
      webSpecific: {
        workerStatus: this.isWorkerReady ? 'ready' : 'not-ready',
        queueLength: this.analysisQueue.length,
        memoryUsage: this.getWebMemoryUsage(),
        performanceMetrics: this.getWebPerformanceMetrics()
      }
    };
  }

  protected async startWebObservation(): Promise<void> {
    await super.startWebObservation();
    
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({
        type: 'START_OBSERVATION',
        config: {
          harmonyThreshold: (this as any).harmonyThreshold,
          platform: PlatformType.WEB
        }
      });
    }
  }

  protected async stopWebObservation(): Promise<void> {
    await super.stopWebObservation();
    
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_OBSERVATION' });
    }
    
    // Clear analysis queue
    this.analysisQueue = [];
  }

  protected async cleanupWebResources(): Promise<void> {
    await super.cleanupWebResources();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isWorkerReady = false;
    }
  }

  // Enhanced analysis for web environment
  protected async analyzeForInsights(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    // Use Web Worker for analysis if available
    if (this.worker && this.isWorkerReady && !this.fallbackToMainThread) {
      return this.analyzeWithWebWorker(code, observationContext);
    } else {
      // Fallback to main thread with optimizations
      return this.analyzeOnMainThread(code, observationContext);
    }
  }

  private async analyzeWithWebWorker(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const taskId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const timeout = setTimeout(() => {
        reject(new Error('Web Worker analysis timeout'));
      }, this.workerTimeout);

      const handleMessage = (event: MessageEvent) => {
        if (event.data.taskId === taskId) {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          
          if (event.data.type === 'ANALYSIS_COMPLETE') {
            resolve(event.data.insights);
          } else if (event.data.type === 'ANALYSIS_ERROR') {
            reject(new Error(event.data.error));
          }
        }
      };

      this.worker?.addEventListener('message', handleMessage);
      this.worker?.postMessage({
        type: 'ANALYZE_CODE',
        taskId,
        data: {
          code,
          context: this.serializeContext(observationContext),
          options: {
            maxAnalysisTime: 5000, // 5 seconds max
            enableOptimizations: true,
            webOptimized: true
          }
        }
      });
    });
  }

  private async analyzeOnMainThread(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    // Use requestIdleCallback for non-blocking analysis
    return new Promise((resolve) => {
      const performAnalysis = async () => {
        try {
          // Limit analysis time to avoid blocking UI
          const startTime = performance.now();
          const maxTime = 100; // 100ms max on main thread
          
          const insights = await super.analyzeForInsights(code, observationContext);
          
          const elapsed = performance.now() - startTime;
          if (elapsed > maxTime) {
            console.warn(`🌙 Pattern Keeper: Main thread analysis took ${elapsed.toFixed(2)}ms`);
          }
          
          resolve(insights);
        } catch (error) {
          console.error('🌙 Pattern Keeper: Main thread analysis error:', error);
          resolve([]);
        }
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if (typeof (globalThis as any).window !== 'undefined' && 'requestIdleCallback' in (globalThis as any).window) {
        ((globalThis as any).window as any).requestIdleCallback(performAnalysis, { timeout: 1000 });
      } else {
        setTimeout(performAnalysis, 0);
      }
    });
  }

  // Web Worker setup and management
  protected async initializeWebWorker(): Promise<void> {
    try {
      // Create Web Worker for pattern analysis
      const workerScript = this.generateWorkerScript();
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new (globalThis as any).Worker(workerUrl);
      this.setupWorkerEventHandlers();
      
      // Test worker readiness
      await this.testWorkerReadiness();
      
      // Cleanup blob URL
      URL.revokeObjectURL(workerUrl);
      
    } catch (error) {
      console.warn('🌙 Pattern Keeper: Failed to initialize Web Worker:', error);
      this.fallbackToMainThread = true;
    }
  }

  private async setupWebWorker(): Promise<void> {
    if (!this.worker) {
      await this.initializeWebWorker();
    }
  }

  private setupWorkerEventHandlers(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: any) => {
      this.handleWorkerMessage(event.data);
    };

    this.worker.onerror = (error: any) => {
      console.error('🌙 Pattern Keeper: Web Worker error:', error);
      this.fallbackToMainThread = true;
      this.isWorkerReady = false;
    };

    this.worker.onmessageerror = (error: any) => {
      console.error('🌙 Pattern Keeper: Web Worker message error:', error);
    };
  }

  private async testWorkerReadiness(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker readiness test timeout'));
      }, 5000);

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'READY') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          this.isWorkerReady = true;
          resolve();
        }
      };

      this.worker?.addEventListener('message', handleMessage);
      this.worker?.postMessage({ type: 'PING' });
    });
  }

  private handleWorkerMessage(data: any): void {
    switch (data.type) {
      case 'READY':
        this.isWorkerReady = true;
        console.log('🌙 Pattern Keeper: Web Worker ready');
        break;
      
      case 'ANALYSIS_COMPLETE':
        // Handled by individual analysis promises
        break;
      
      case 'ANALYSIS_ERROR':
        console.error('🌙 Pattern Keeper: Worker analysis error:', data.error);
        break;
      
      case 'PERFORMANCE_METRICS':
        this.updateWorkerPerformanceMetrics(data.metrics);
        break;
      
      default:
        console.warn('🌙 Pattern Keeper: Unknown worker message type:', data.type);
    }
  }

  private generateWorkerScript(): string {
    return `
      // Pattern Keeper Web Worker
      let isReady = false;
      let analysisConfig = {};
      
      // Simple pattern detection algorithms for Web Worker
      function detectPatterns(code) {
        const patterns = [];
        
        // Detect functional patterns
        if (/\\.map\\(.*\\)\\.filter\\(.*\\)|\\.filter\\(.*\\)\\.map\\(/s.test(code)) {
          patterns.push({
            type: 'FUNCTIONAL_COMPOSITION',
            strength: 0.8,
            location: { file: 'current', startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
            suggestion: 'Functional pipeline detected',
            confidence: 0.85
          });
        }
        
        // Detect optimization opportunities
        if (/\\.includes\\(.*\\)\\.includes\\(/s.test(code)) {
          patterns.push({
            type: 'DATA_STRUCTURE_OPTIMIZATION',
            strength: 0.9,
            location: { file: 'current', startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
            suggestion: 'Consider using Set for O(1) lookups',
            confidence: 0.9
          });
        }
        
        // Detect complexity issues
        if (/for.*for.*{|nested.*loop/s.test(code)) {
          patterns.push({
            type: 'COMPLEXITY_REDUCTION',
            strength: 0.95,
            location: { file: 'current', startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
            suggestion: 'Nested loops detected - consider optimization',
            confidence: 0.92
          });
        }
        
        return patterns;
      }
      
      function calculateHarmony(patterns) {
        if (patterns.length === 0) return { elegance: 0.5, efficiency: 0.5, symmetry: 0.5, resonance: 0.5 };
        
        const avgStrength = patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length;
        return {
          elegance: avgStrength,
          efficiency: avgStrength * 0.9,
          symmetry: avgStrength * 0.8,
          resonance: avgStrength * 0.7,
          patterns
        };
      }
      
      function analyzeCode(code, context, options) {
        const startTime = performance.now();
        const patterns = detectPatterns(code);
        const harmony = calculateHarmony(patterns);
        const analysisTime = performance.now() - startTime;
        
        const insights = [];
        if (harmony.elegance >= (analysisConfig.harmonyThreshold || 0.7)) {
          insights.push({
            id: 'harmony-' + Date.now(),
            type: 'MATHEMATICAL_HARMONY',
            observer: 'PATTERN_KEEPER',
            confidence: harmony.elegance,
            pattern: harmony,
            context: context,
            timestamp: new Date().toISOString()
          });
        }
        
        // Send performance metrics
        self.postMessage({
          type: 'PERFORMANCE_METRICS',
          metrics: {
            analysisTime,
            patternCount: patterns.length,
            harmonyScore: harmony.elegance
          }
        });
        
        return insights;
      }
      
      self.onmessage = function(event) {
        const { type, data, taskId } = event.data;
        
        switch (type) {
          case 'PING':
            self.postMessage({ type: 'READY' });
            break;
          
          case 'START_OBSERVATION':
            analysisConfig = data?.config || {};
            isReady = true;
            break;
          
          case 'STOP_OBSERVATION':
            isReady = false;
            break;
          
          case 'ANALYZE_CODE':
            try {
              if (!isReady) {
                self.postMessage({
                  type: 'ANALYSIS_ERROR',
                  taskId,
                  error: 'Worker not ready'
                });
                return;
              }
              
              const insights = analyzeCode(data.code, data.context, data.options);
              self.postMessage({
                type: 'ANALYSIS_COMPLETE',
                taskId,
                insights
              });
            } catch (error) {
              self.postMessage({
                type: 'ANALYSIS_ERROR',
                taskId,
                error: error.message
              });
            }
            break;
          
          default:
            console.warn('Unknown message type:', type);
        }
      };
    `;
  }

  // Web-specific optimizations
  protected async getPlatformOptimizations(platform: PlatformType): Promise<PlatformOptimization> {
    const baseOptimizations = await super.getPlatformOptimizations(platform);
    
    return {
      ...baseOptimizations,
      configuration: {
        ...baseOptimizations.configuration,
        webWorkerEnabled: this.isWorkerReady,
        fallbackMode: this.fallbackToMainThread,
        queueSize: this.analysisQueue.length,
        browserOptimized: true
      },
      resourceAllocation: {
        memory: '25MB', // Conservative for web
        cpu: '8%',
        workerMemory: '15MB'
      },
      performanceTuning: {
        ...baseOptimizations.performanceTuning,
        idleCallbackAnalysis: true,
        batchProcessing: true,
        memoryOptimization: true,
        cacheAggressive: true
      },
      environmentSettings: {
        ...baseOptimizations.environmentSettings,
        webWorkerSupport: !!this.worker,
        browserFeatures: this.detectBrowserFeatures()
      }
    };
  }

  // Web-specific whisper formatting
  protected formatWhisperForPlatform(
    baseWhisper: WhisperSuggestion, 
    platform: PlatformType
  ): WhisperSuggestion {
    const webWhisper = super.formatWhisperForPlatform(baseWhisper, platform);
    
    // Web-specific adjustments
    webWhisper.renderLocation = this.selectWebRenderLocation(baseWhisper);
    webWhisper.timing = this.selectWebTiming(baseWhisper);
    
    // Add web-specific metadata (extend the metadata object)
    (webWhisper.metadata as any).webOptimized = true;
    (webWhisper.metadata as any).workerGenerated = this.isWorkerReady && !this.fallbackToMainThread;
    (webWhisper.metadata as any).browserCompatible = true;
    
    return webWhisper;
  }

  private selectWebRenderLocation(whisper: WhisperSuggestion): RenderLocation {
    const harmony = (whisper as any).pattern as MathematicalHarmony;
    
    if (harmony?.optimization && harmony.optimization.performanceGain > 30) {
      return RenderLocation.MONACO_WIDGET; // Show important optimizations in Monaco
    } else if (harmony?.elegance > 0.9) {
      return RenderLocation.HUD_OVERLAY; // Show high elegance in HUD
    } else {
      return RenderLocation.STATUS_BAR; // Show minor insights in status bar
    }
  }

  private selectWebTiming(whisper: WhisperSuggestion): WhisperTiming {
    // Be more conservative with timing in web environment
    return WhisperTiming.WHEN_CURIOUS; // Wait for user to be curious
  }

  // Web-specific helper methods
  private serializeContext(context: ObservationContext): any {
    // Serialize context for Web Worker (remove non-serializable parts)
    return {
      timestamp: context.timestamp.toISOString(),
      platform: context.platform,
      codeContext: {
        content: context.codeContext.content,
        language: context.codeContext.language,
        filePath: context.codeContext.filePath
      },
      developerState: {
        flowState: context.developerState.flowState,
        attentionLevel: context.developerState.attentionLevel
      }
    };
  }

  private getWebMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return { available: false };
  }

  private getWebPerformanceMetrics(): any {
    return {
      timing: performance.now(),
      navigation: (performance as any).getEntriesByType?.('navigation')?.[0] || {},
      workerActive: this.isWorkerReady,
      fallbackMode: this.fallbackToMainThread
    };
  }

  private updateWorkerPerformanceMetrics(metrics: any): void {
    // Update performance metrics from worker
    (this as any).performanceMetrics = {
      ...(this as any).performanceMetrics,
      workerAnalysisTime: metrics.analysisTime,
      workerPatternCount: metrics.patternCount,
      workerHarmonyScore: metrics.harmonyScore
    };
  }

  private detectBrowserFeatures(): any {
    const hasWindow = typeof (globalThis as any).window !== 'undefined';
    const win = (globalThis as any).window;
    return {
      webWorkers: typeof (globalThis as any).Worker !== 'undefined',
      requestIdleCallback: hasWindow && 'requestIdleCallback' in win,
      performanceMemory: 'memory' in performance,
      intersectionObserver: hasWindow && 'IntersectionObserver' in win,
      resizeObserver: hasWindow && 'ResizeObserver' in win
    };
  }

  // Web-specific delivery methods
  protected async deliverWebWhisper(whisper: WhisperSuggestion, context: ObservationContext): Promise<void> {
    // Enhanced web whisper delivery
    console.log(`🌙 Web Pattern Keeper whisper: ${whisper.message}`);
    console.log(`🔍 Context: ${context.codeContext.filePath} at ${context.timestamp.toISOString()}`);
    
    // Could integrate with Monaco Editor, React components, etc.
    if (whisper.renderLocation === RenderLocation.MONACO_WIDGET) {
      await this.deliverMonacoWhisper(whisper);
    } else if (whisper.renderLocation === RenderLocation.HUD_OVERLAY) {
      await this.deliverHUDWhisper(whisper);
    } else {
      await this.deliverStatusBarWhisper(whisper);
    }
  }

  private async deliverMonacoWhisper(whisper: WhisperSuggestion): Promise<void> {
    // Integration point for Monaco Editor
    console.log(`📝 Monaco whisper: ${whisper.message}`);
    // TODO: Implement Monaco Editor integration
    // This would integrate with the Monaco Editor widget system
  }

  private async deliverHUDWhisper(whisper: WhisperSuggestion): Promise<void> {
    // Integration point for Whispering HUD
    console.log(`🎯 HUD whisper: ${whisper.message}`);
    // TODO: Implement HUD overlay integration
    // This would show whispers in the heads-up display
  }

  private async deliverStatusBarWhisper(whisper: WhisperSuggestion): Promise<void> {
    // Integration point for status bar
    console.log(`📊 Status whisper: ${whisper.message}`);
    // TODO: Implement status bar integration
    // This would show whispers in the IDE status bar
  }

  // Web-specific optimization method implementations
  protected generateLoopOptimization(code: string): string {
    return WebPatternKeeperHelpers.generateLoopOptimization(code);
  }

  protected generateDataAccessOptimization(code: string): string {
    return WebPatternKeeperHelpers.generateDataAccessOptimization(code);
  }

  protected async createOptimizationInsight(
    optimization: OptimizationOpportunity, 
    context: ObservationContext
  ): Promise<any> {
    return {
      id: `web-optimization-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: 'PATTERN_OPTIMIZATION',
      observer: 'PATTERN_KEEPER',
      confidence: optimization.confidence,
      pattern: {
        type: optimization.type,
        description: optimization.description,
        implementation: optimization.implementation,
        webOptimized: true
      },
      context: context,
      timestamp: new Date().toISOString()
    };
  }
}

// Supporting interfaces
interface AnalysisTask {
  id: string;
  code: string;
  context: ObservationContext;
  timestamp: Date;
  priority: number;
}

interface OptimizationOpportunity {
  type: OptimizationType;
  confidence: number;
  description: string;
  implementation: string;
}

// Import missing types from parent
enum OptimizationType {
  ALGORITHMIC_APPROACH = 'ALGORITHMIC_APPROACH',
  DATA_STRUCTURE_CHOICE = 'DATA_STRUCTURE_CHOICE',
  TIME_COMPLEXITY = 'TIME_COMPLEXITY',
  SPACE_COMPLEXITY = 'SPACE_COMPLEXITY',
  FUNCTIONAL_REFACTOR = 'FUNCTIONAL_REFACTOR'
}

// Web-specific optimization implementations
export class WebPatternKeeperHelpers {
  static generateLoopOptimization(code: string): string {
    // Web-optimized loop patterns
    if (code.includes('for (') && code.includes('.length')) {
      return `// Web-optimized loop with cached length
for (let i = 0, len = items.length; i < len; i++) {
  // Process items[i] - cached length improves performance
  // Consider using requestAnimationFrame for large datasets
}`;
    }
    return `// Consider using modern iteration methods
items.forEach((item, index) => {
  // Functional approach - more readable and often faster in modern browsers
});`;
  }

  static generateDataAccessOptimization(code: string): string {
    // Web-optimized data access patterns
    if (code.includes('[') && code.includes('][')) {
      return `// Web-optimized data access with destructuring
const { prop1, prop2, nested: { deepProp } } = object;
// Destructuring reduces property lookups and improves readability`;
    }
    return `// Consider using Map for frequent lookups
const dataMap = new Map(Object.entries(data));
// O(1) lookups vs O(n) for object property access`;
  }
}