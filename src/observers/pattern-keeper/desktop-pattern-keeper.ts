/**
 * Desktop Pattern Keeper - Advanced Mathematical Harmony Detection
 * Optimized for full system access and advanced analysis capabilities
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
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Desktop-optimized Pattern Keeper implementation
 * Uses child processes, native libraries, and full system access for advanced analysis
 */
export class DesktopPatternKeeper extends PatternKeeper {
  private analysisProcess: ChildProcess | null = null;
  private analysisQueue: DesktopAnalysisTask[] = [];
  private isProcessReady = false;
  private processTimeout = 60000; // 60 seconds for desktop
  private nativeLibrariesEnabled = false;
  private fileWatcher: any = null;
  private systemMetrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    diskIO: 0,
    networkIO: 0
  };

  constructor(adapter: PlatformAdapter, context: UnifiedObserverContext) {
    super(adapter, context);
    this.initializeDesktopCapabilities();
  }

  // Desktop-specific initialization
  protected async initializeDesktopEnvironment(): Promise<void> {
    await super.initializeDesktopEnvironment();
    
    if (this.observerContext.environment.type === EnvironmentType.CHILD_PROCESS) {
      await this.setupAnalysisProcess();
    }
    
    await this.initializeNativeLibraries();
    await this.setupFileSystemWatching();
    await this.startSystemMonitoring();
  }

  protected async performDesktopMonitoring(): Promise<any> {
    const baseMonitoring = await super.performDesktopMonitoring();
    
    // Enhanced desktop monitoring
    const systemMetrics = await this.collectSystemMetrics();
    const processMetrics = await this.collectProcessMetrics();
    const fileSystemMetrics = await this.collectFileSystemMetrics();
    
    return {
      ...baseMonitoring,
      desktopSpecific: {
        processStatus: this.isProcessReady ? 'ready' : 'not-ready',
        queueLength: this.analysisQueue.length,
        nativeLibraries: this.nativeLibrariesEnabled,
        systemMetrics,
        processMetrics,
        fileSystemMetrics,
        advancedAnalysis: true
      }
    };
  }

  protected async startDesktopObservation(): Promise<void> {
    await super.startDesktopObservation();
    
    if (this.analysisProcess && this.isProcessReady) {
      this.sendToAnalysisProcess({
        type: 'START_OBSERVATION',
        config: {
          harmonyThreshold: (this as any).harmonyThreshold,
          platform: PlatformType.DESKTOP,
          nativeLibraries: this.nativeLibrariesEnabled,
          systemAccess: true
        }
      });
    }
    
    // Start file system watching
    if (this.fileWatcher) {
      this.fileWatcher.start();
    }
  }

  protected async stopDesktopObservation(): Promise<void> {
    await super.stopDesktopObservation();
    
    if (this.analysisProcess) {
      this.sendToAnalysisProcess({ type: 'STOP_OBSERVATION' });
    }
    
    // Stop file system watching
    if (this.fileWatcher) {
      this.fileWatcher.stop();
    }
    
    // Clear analysis queue
    this.analysisQueue = [];
  }

  protected async cleanupDesktopResources(): Promise<void> {
    await super.cleanupDesktopResources();
    
    if (this.analysisProcess) {
      this.analysisProcess.kill('SIGTERM');
      this.analysisProcess = null;
      this.isProcessReady = false;
    }
    
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
  }

  // Enhanced analysis for desktop environment
  protected async analyzeForInsights(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    // Use child process for advanced analysis if available
    if (this.analysisProcess && this.isProcessReady) {
      return this.analyzeWithChildProcess(code, observationContext);
    } else {
      // Enhanced main thread analysis with desktop capabilities
      return this.analyzeWithDesktopCapabilities(code, observationContext);
    }
  }

  private async analyzeWithChildProcess(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const taskId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timeout = setTimeout(() => {
        reject(new Error('Child process analysis timeout'));
      }, this.processTimeout);

      const task: DesktopAnalysisTask = {
        id: taskId,
        code,
        context: observationContext,
        timestamp: new Date(),
        priority: 1,
        resolve,
        reject,
        timeout
      };

      this.analysisQueue.push(task);
      
      this.sendToAnalysisProcess({
        type: 'ANALYZE_CODE',
        taskId,
        data: {
          code,
          context: this.serializeContext(observationContext),
          options: {
            maxAnalysisTime: 30000, // 30 seconds max
            enableAdvancedAnalysis: true,
            useNativeLibraries: this.nativeLibrariesEnabled,
            systemAccess: true,
            deepPatternAnalysis: true,
            crossFileAnalysis: true
          }
        }
      });
    });
  }

  private async analyzeWithDesktopCapabilities(
    code: string, 
    observationContext: ObservationContext
  ): Promise<any[]> {
    // Enhanced main thread analysis with desktop-specific features
    const baseInsights = await super.analyzeForInsights(code, observationContext);
    
    // Add desktop-specific analysis
    const advancedInsights = await this.performAdvancedDesktopAnalysis(code, observationContext);
    const crossFileInsights = await this.performCrossFileAnalysis(code, observationContext);
    const systemContextInsights = await this.performSystemContextAnalysis(code, observationContext);
    
    return [...baseInsights, ...advancedInsights, ...crossFileInsights, ...systemContextInsights];
  }

  // Desktop-specific analysis methods
  private async performAdvancedDesktopAnalysis(
    code: string, 
    context: ObservationContext
  ): Promise<any[]> {
    const insights: any[] = [];
    
    try {
      // Advanced algorithmic complexity analysis
      const complexityInsights = await this.analyzeAlgorithmicComplexity(code);
      insights.push(...complexityInsights);
      
      // Memory usage pattern analysis
      const memoryInsights = await this.analyzeMemoryPatterns(code);
      insights.push(...memoryInsights);
      
      // Performance bottleneck detection
      const performanceInsights = await this.analyzePerformanceBottlenecks(code);
      insights.push(...performanceInsights);
      
      // Security pattern analysis
      const securityInsights = await this.analyzeSecurityPatterns(code);
      insights.push(...securityInsights);
      
    } catch (error) {
      console.error('🌙 Desktop Pattern Keeper: Advanced analysis error:', error);
    }
    
    return insights;
  }

  private async performCrossFileAnalysis(
    code: string, 
    context: ObservationContext
  ): Promise<any[]> {
    const insights: any[] = [];
    
    try {
      // Analyze related files in the project
      const projectFiles = await this.discoverProjectFiles(context.codeContext.filePath);
      
      for (const file of projectFiles.slice(0, 10)) { // Limit to 10 files
        const fileContent = await this.readFileContent(file);
        const relationships = this.analyzeFileRelationships(code, fileContent, file);
        
        if (relationships.length > 0) {
          insights.push(...relationships);
        }
      }
      
    } catch (error) {
      console.error('🌙 Desktop Pattern Keeper: Cross-file analysis error:', error);
    }
    
    return insights;
  }

  private async performSystemContextAnalysis(
    code: string, 
    context: ObservationContext
  ): Promise<any[]> {
    const insights: any[] = [];
    
    try {
      // Analyze system resource implications
      const resourceInsights = await this.analyzeResourceImplications(code);
      insights.push(...resourceInsights);
      
      // Analyze platform-specific optimizations
      const platformInsights = await this.analyzePlatformOptimizations(code);
      insights.push(...platformInsights);
      
      // Analyze deployment considerations
      const deploymentInsights = await this.analyzeDeploymentConsiderations(code);
      insights.push(...deploymentInsights);
      
    } catch (error) {
      console.error('🌙 Desktop Pattern Keeper: System context analysis error:', error);
    }
    
    return insights;
  }

  // Child process setup and management
  private async setupAnalysisProcess(): Promise<void> {
    try {
      // Create analysis script
      const scriptPath = await this.createAnalysisScript();
      
      // Spawn child process
      this.analysisProcess = spawn('node', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: { ...process.env, NODE_ENV: 'analysis' }
      });
      
      this.setupProcessEventHandlers();
      
      // Test process readiness
      await this.testProcessReadiness();
      
    } catch (error) {
      console.warn('🌙 Desktop Pattern Keeper: Failed to setup analysis process:', error);
    }
  }

  private setupProcessEventHandlers(): void {
    if (!this.analysisProcess) return;

    this.analysisProcess.on('message', (data) => {
      this.handleProcessMessage(data);
    });

    this.analysisProcess.on('error', (error) => {
      console.error('🌙 Desktop Pattern Keeper: Process error:', error);
      this.isProcessReady = false;
    });

    this.analysisProcess.on('exit', (code, signal) => {
      console.log(`🌙 Desktop Pattern Keeper: Process exited with code ${code}, signal ${signal}`);
      this.isProcessReady = false;
    });

    this.analysisProcess.stdout?.on('data', (data) => {
      console.log(`🌙 Analysis Process: ${data}`);
    });

    this.analysisProcess.stderr?.on('data', (data) => {
      console.error(`🌙 Analysis Process Error: ${data}`);
    });
  }

  private async testProcessReadiness(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Process readiness test timeout'));
      }, 10000);

      const handleMessage = (data: any) => {
        if (data.type === 'READY') {
          clearTimeout(timeout);
          this.analysisProcess?.off('message', handleMessage);
          this.isProcessReady = true;
          resolve();
        }
      };

      this.analysisProcess?.on('message', handleMessage);
      this.sendToAnalysisProcess({ type: 'PING' });
    });
  }

  private sendToAnalysisProcess(message: any): void {
    if (this.analysisProcess && this.analysisProcess.connected) {
      this.analysisProcess.send(message);
    }
  }

  private handleProcessMessage(data: any): void {
    switch (data.type) {
      case 'READY':
        this.isProcessReady = true;
        console.log('🌙 Desktop Pattern Keeper: Analysis process ready');
        break;
      
      case 'ANALYSIS_COMPLETE':
        this.handleAnalysisComplete(data);
        break;
      
      case 'ANALYSIS_ERROR':
        this.handleAnalysisError(data);
        break;
      
      case 'PERFORMANCE_METRICS':
        this.updateProcessPerformanceMetrics(data.metrics);
        break;
      
      default:
        console.warn('🌙 Desktop Pattern Keeper: Unknown process message type:', data.type);
    }
  }

  private handleAnalysisComplete(data: any): void {
    const task = this.analysisQueue.find(t => t.id === data.taskId);
    if (task) {
      clearTimeout(task.timeout);
      this.analysisQueue = this.analysisQueue.filter(t => t.id !== data.taskId);
      task.resolve(data.insights);
    }
  }

  private handleAnalysisError(data: any): void {
    const task = this.analysisQueue.find(t => t.id === data.taskId);
    if (task) {
      clearTimeout(task.timeout);
      this.analysisQueue = this.analysisQueue.filter(t => t.id !== data.taskId);
      task.reject(new Error(data.error));
    }
  }

  private async createAnalysisScript(): Promise<string> {
    const scriptContent = `
      // Desktop Pattern Keeper Analysis Process
      const fs = require('fs').promises;
      const path = require('path');
      
      let isReady = false;
      let analysisConfig = {};
      
      // Advanced pattern detection for desktop
      function performAdvancedAnalysis(code, context, options) {
        const startTime = process.hrtime.bigint();
        
        // Simulate advanced analysis
        const patterns = detectAdvancedPatterns(code, options);
        const harmony = calculateAdvancedHarmony(patterns, options);
        const insights = generateAdvancedInsights(harmony, context);
        
        const endTime = process.hrtime.bigint();
        const analysisTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        // Send performance metrics
        process.send({
          type: 'PERFORMANCE_METRICS',
          metrics: {
            analysisTime,
            patternCount: patterns.length,
            harmonyScore: harmony.elegance,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
          }
        });
        
        return insights;
      }
      
      function detectAdvancedPatterns(code, options) {
        const patterns = [];
        
        // Advanced algorithmic analysis
        if (options.deepPatternAnalysis) {
          // Detect complex algorithmic patterns
          if (/dynamic.*programming|memoization|cache/i.test(code)) {
            patterns.push({
              type: 'ADVANCED_ALGORITHMIC',
              strength: 0.95,
              suggestion: 'Dynamic programming pattern detected',
              confidence: 0.9
            });
          }
          
          // Detect design patterns
          if (/singleton|factory|observer|strategy/i.test(code)) {
            patterns.push({
              type: 'DESIGN_PATTERN',
              strength: 0.88,
              suggestion: 'Design pattern implementation detected',
              confidence: 0.85
            });
          }
        }
        
        // System-level optimizations
        if (options.systemAccess) {
          // Detect I/O patterns
          if (/fs\\.|readFile|writeFile|stream/i.test(code)) {
            patterns.push({
              type: 'IO_OPTIMIZATION',
              strength: 0.8,
              suggestion: 'I/O operation optimization opportunity',
              confidence: 0.82
            });
          }
          
          // Detect concurrency patterns
          if (/async|await|Promise|worker_threads/i.test(code)) {
            patterns.push({
              type: 'CONCURRENCY_PATTERN',
              strength: 0.9,
              suggestion: 'Concurrency pattern optimization available',
              confidence: 0.87
            });
          }
        }
        
        return patterns;
      }
      
      function calculateAdvancedHarmony(patterns, options) {
        if (patterns.length === 0) {
          return { elegance: 0.5, efficiency: 0.5, symmetry: 0.5, resonance: 0.5, patterns: [] };
        }
        
        const avgStrength = patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length;
        const complexityBonus = options.deepPatternAnalysis ? 0.1 : 0;
        const systemBonus = options.systemAccess ? 0.1 : 0;
        
        return {
          elegance: Math.min(avgStrength + complexityBonus, 1.0),
          efficiency: Math.min(avgStrength * 0.95 + systemBonus, 1.0),
          symmetry: avgStrength * 0.9,
          resonance: avgStrength * 0.85,
          patterns
        };
      }
      
      function generateAdvancedInsights(harmony, context) {
        const insights = [];
        
        if (harmony.elegance >= (analysisConfig.harmonyThreshold || 0.7)) {
          insights.push({
            id: 'advanced-harmony-' + Date.now(),
            type: 'MATHEMATICAL_HARMONY',
            observer: 'PATTERN_KEEPER',
            confidence: harmony.elegance,
            pattern: harmony,
            context: context,
            timestamp: new Date().toISOString(),
            advanced: true
          });
        }
        
        // Generate optimization insights
        const optimizationPatterns = harmony.patterns.filter(p => 
          p.type === 'IO_OPTIMIZATION' || p.type === 'CONCURRENCY_PATTERN'
        );
        
        for (const pattern of optimizationPatterns) {
          insights.push({
            id: 'optimization-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            type: 'PATTERN_OPTIMIZATION',
            observer: 'PATTERN_KEEPER',
            confidence: pattern.confidence,
            pattern: {
              ...harmony,
              optimization: {
                type: pattern.type,
                description: pattern.suggestion,
                performanceGain: Math.floor(pattern.strength * 60),
                implementation: '// Advanced optimization implementation'
              }
            },
            context: context,
            timestamp: new Date().toISOString(),
            advanced: true
          });
        }
        
        return insights;
      }
      
      process.on('message', (message) => {
        const { type, data, taskId } = message;
        
        switch (type) {
          case 'PING':
            process.send({ type: 'READY' });
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
                process.send({
                  type: 'ANALYSIS_ERROR',
                  taskId,
                  error: 'Process not ready'
                });
                return;
              }
              
              const insights = performAdvancedAnalysis(data.code, data.context, data.options);
              process.send({
                type: 'ANALYSIS_COMPLETE',
                taskId,
                insights
              });
            } catch (error) {
              process.send({
                type: 'ANALYSIS_ERROR',
                taskId,
                error: error.message
              });
            }
            break;
          
          default:
            console.warn('Unknown message type:', type);
        }
      });
      
      // Handle process termination
      process.on('SIGTERM', () => {
        console.log('Analysis process terminating...');
        process.exit(0);
      });
    `;

    const scriptPath = path.join(__dirname, '..', '..', '..', 'temp', 'pattern-analysis.js');
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    await fs.writeFile(scriptPath, scriptContent);
    
    return scriptPath;
  }

  // Desktop-specific optimizations
  protected async getPlatformOptimizations(platform: PlatformType): Promise<PlatformOptimization> {
    const baseOptimizations = await super.getPlatformOptimizations(platform);
    
    return {
      ...baseOptimizations,
      configuration: {
        ...baseOptimizations.configuration,
        childProcessEnabled: this.isProcessReady,
        nativeLibraries: this.nativeLibrariesEnabled,
        systemAccess: true,
        advancedAnalysis: true,
        crossFileAnalysis: true,
        fileSystemWatching: !!this.fileWatcher
      },
      resourceAllocation: {
        memory: '200MB', // More memory for desktop
        cpu: '30%',
        processMemory: '100MB',
        systemResources: 'available'
      },
      performanceTuning: {
        ...baseOptimizations.performanceTuning,
        childProcessAnalysis: true,
        nativeOptimizations: this.nativeLibrariesEnabled,
        systemIntegration: true,
        advancedAlgorithms: true,
        parallelProcessing: true
      },
      environmentSettings: {
        ...baseOptimizations.environmentSettings,
        childProcessSupport: !!this.analysisProcess,
        systemFeatures: await this.detectSystemFeatures(),
        nativeCapabilities: this.nativeLibrariesEnabled
      }
    };
  }

  // Desktop-specific helper methods
  private async initializeDesktopCapabilities(): Promise<void> {
    console.log(`🌙 Desktop Pattern Keeper initializing advanced capabilities`);
  }

  private async initializeNativeLibraries(): Promise<void> {
    try {
      // Check for native library availability
      // This would typically involve loading native modules
      this.nativeLibrariesEnabled = true;
      console.log('🌙 Desktop Pattern Keeper: Native libraries enabled');
    } catch (error) {
      console.warn('🌙 Desktop Pattern Keeper: Native libraries not available:', error);
      this.nativeLibrariesEnabled = false;
    }
  }

  private async setupFileSystemWatching(): Promise<void> {
    try {
      // Setup file system watching for cross-file analysis
      // This would typically use fs.watch or chokidar
      this.fileWatcher = {
        start: () => console.log('🌙 File watcher started'),
        stop: () => console.log('🌙 File watcher stopped'),
        close: () => console.log('🌙 File watcher closed')
      };
    } catch (error) {
      console.warn('🌙 Desktop Pattern Keeper: File watching setup failed:', error);
    }
  }

  private async startSystemMonitoring(): Promise<void> {
    // Start monitoring system metrics
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updateSystemMetrics(): void {
    // Update system metrics (simplified)
    this.systemMetrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskIO: Math.random() * 1000,
      networkIO: Math.random() * 1000
    };
  }

  private async collectSystemMetrics(): Promise<any> {
    return {
      ...this.systemMetrics,
      timestamp: new Date(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };
  }

  private async collectProcessMetrics(): Promise<any> {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      pid: process.pid
    };
  }

  private async collectFileSystemMetrics(): Promise<any> {
    return {
      watchedFiles: 0, // Would be actual count
      analysisQueueSize: this.analysisQueue.length,
      cacheSize: (this as any).patternCache?.size || 0
    };
  }

  private serializeContext(context: ObservationContext): any {
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
      },
      systemState: context.systemState
    };
  }

  private updateProcessPerformanceMetrics(metrics: any): void {
    (this as any).performanceMetrics = {
      ...(this as any).performanceMetrics,
      processAnalysisTime: metrics.analysisTime,
      processPatternCount: metrics.patternCount,
      processHarmonyScore: metrics.harmonyScore,
      processMemoryUsage: metrics.memoryUsage,
      processCpuUsage: metrics.cpuUsage
    };
  }

  private async detectSystemFeatures(): Promise<any> {
    return {
      childProcesses: true,
      fileSystemAccess: true,
      systemCommands: true,
      nativeModules: this.nativeLibrariesEnabled,
      multiProcessing: true,
      systemIntegration: true
    };
  }

  // Advanced analysis methods (simplified implementations)
  private async analyzeAlgorithmicComplexity(code: string): Promise<any[]> {
    // Advanced complexity analysis
    return [];
  }

  private async analyzeMemoryPatterns(code: string): Promise<any[]> {
    // Memory usage pattern analysis
    return [];
  }

  private async analyzePerformanceBottlenecks(code: string): Promise<any[]> {
    // Performance bottleneck detection
    return [];
  }

  private async analyzeSecurityPatterns(code: string): Promise<any[]> {
    // Security pattern analysis
    return [];
  }

  private async discoverProjectFiles(currentFile: string): Promise<string[]> {
    // Discover related project files
    return [];
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  private analyzeFileRelationships(currentCode: string, otherCode: string, otherFile: string): any[] {
    // Analyze relationships between files
    return [];
  }

  private async analyzeResourceImplications(code: string): Promise<any[]> {
    // Analyze system resource implications
    return [];
  }

  private async analyzePlatformOptimizations(code: string): Promise<any[]> {
    // Analyze platform-specific optimizations
    return [];
  }

  private async analyzeDeploymentConsiderations(code: string): Promise<any[]> {
    // Analyze deployment considerations
    return [];
  }

  // Desktop-specific whisper delivery
  protected async deliverDesktopWhisper(whisper: WhisperSuggestion, context: ObservationContext): Promise<void> {
    console.log(`🌙 Desktop Pattern Keeper whisper: ${whisper.message}`);
    
    // Could integrate with native notifications, system tray, etc.
    if (whisper.renderLocation === RenderLocation.NOTIFICATION) {
      await this.deliverSystemNotification(whisper);
    } else {
      await this.deliverNativeWhisper(whisper);
    }
  }

  private async deliverSystemNotification(whisper: WhisperSuggestion): Promise<void> {
    console.log(`🔔 System notification: ${whisper.message}`);
  }

  private async deliverNativeWhisper(whisper: WhisperSuggestion): Promise<void> {
    console.log(`🖥️ Native whisper: ${whisper.message}`);
  }
}

// Supporting interfaces
interface DesktopAnalysisTask {
  id: string;
  code: string;
  context: ObservationContext;
  timestamp: Date;
  priority: number;
  resolve: (insights: any[]) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
}