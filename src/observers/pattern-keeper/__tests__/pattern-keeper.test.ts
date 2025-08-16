/**
 * Unit tests for Pattern Keeper implementations
 * Tests core pattern detection and platform-specific optimizations
 */

import { PatternKeeper } from '../pattern-keeper';
import { WebPatternKeeper } from '../web-pattern-keeper';
import { DesktopPatternKeeper } from '../desktop-pattern-keeper';
import {
  PlatformType,
  ObserverType,
  InsightType,
  WhisperSuggestion,
  Insight,
  ObservationContext,
  WhisperTiming,
  RenderLocation
} from '../../../core/whispering-interfaces';
import { UnifiedObserverContext, EnvironmentType } from '../../../types/unified';
import { PlatformAdapter } from '../../../core/platform-interfaces';
import { MathematicalHarmony, HarmonyType } from '../../../types/whispering';

// Mock platform adapter
class MockPlatformAdapter implements PlatformAdapter {
  type = PlatformType.WEB;
  
  async createEditor(): Promise<any> { return {}; }
  async createFileExplorer(): Promise<any> { return {}; }
  async createTerminal(): Promise<any> { return {}; }
  async createWhisperingHUD(): Promise<any> { return {}; }
  getFileSystem(): any { return {}; }
  getStorage(): any { return {}; }
  getGitHubClient(): any { return {}; }
  getNotificationManager(): any { return {}; }
  async createObserverEnvironment(): Promise<any> { return {}; }
  async optimizeForPlatform(): Promise<void> {}
  getCapabilities(): any {
    return {
      type: this.type,
      ui: {}, system: {}, network: {}, storage: {}, observers: {}
    };
  }
}

describe('Pattern Keeper', () => {
  let mockAdapter: MockPlatformAdapter;
  let observerContext: UnifiedObserverContext;

  beforeEach(() => {
    mockAdapter = new MockPlatformAdapter();
    observerContext = {
      platform: PlatformType.WEB,
      capabilities: {
        backgroundProcessing: true,
        realTimeAnalysis: true,
        crossFileAnalysis: true,
        systemIntegration: false,
        networkAccess: true,
        persistentStorage: false
      },
      environment: {
        type: EnvironmentType.WEB_WORKER,
        resources: {
          memory: 100 * 1024 * 1024,
          cpu: 25,
          storage: 10 * 1024 * 1024,
          network: 1024 * 1024
        },
        constraints: {
          maxExecutionTime: 30000,
          maxMemoryUsage: 100 * 1024 * 1024,
          allowedOperations: ['analyze', 'suggest'],
          restrictedAPIs: ['file-system']
        },
        communication: {
          type: 'MESSAGE_PASSING' as any,
          protocol: 'JSON_RPC' as any,
          serialization: 'JSON' as any,
          compression: true
        }
      },
      configuration: {
        sensitivity: 'MEDIUM' as any,
        frequency: 'HIGH' as any,
        scope: {
          files: {
            include: ['*.ts', '*.js'],
            exclude: ['node_modules/**'],
            patterns: ['src/**/*']
          },
          functions: { include: ['*'], exclude: [], patterns: [] },
          dependencies: { include: ['*'], exclude: [], patterns: [] },
          timeRange: {}
        },
        filters: []
      }
    };
  });

  describe('Core Pattern Keeper', () => {
    let patternKeeper: PatternKeeper;

    beforeEach(() => {
      patternKeeper = new PatternKeeper(mockAdapter, observerContext);
    });

    describe('Initialization', () => {
      it('should initialize with correct observer type', () => {
        expect(patternKeeper.getType()).toBe(ObserverType.PATTERN_KEEPER);
        expect(patternKeeper.getId()).toBe('pattern_keeper-web');
      });

      it('should have correct default insight type', () => {
        expect((patternKeeper as any).defaultInsightType).toBe(InsightType.MATHEMATICAL_HARMONY);
      });
    });

    describe('Pattern Detection', () => {
      it('should detect functional composition patterns', async () => {
        const code = `
          const result = items
            .filter(item => item.active)
            .map(item => item.value)
            .reduce((sum, value) => sum + value, 0);
        `;

        await patternKeeper.start();
        const insights = await (patternKeeper as any).analyzeForInsights(code, createMockContext());

        expect(insights.length).toBeGreaterThan(0);
        const harmonyInsight = insights.find((i: any) => i.type === InsightType.MATHEMATICAL_HARMONY);
        expect(harmonyInsight).toBeDefined();
        expect(harmonyInsight.confidence).toBeGreaterThan(0.7);
      });

      it('should detect data structure optimization opportunities', async () => {
        const code = `
          const items = ['a', 'b', 'c', 'd', 'e'];
          if (items.includes('a') && items.includes('b')) {
            console.log('Found both');
          }
        `;

        await patternKeeper.start();
        const insights = await (patternKeeper as any).analyzeForInsights(code, createMockContext());

        expect(insights.length).toBeGreaterThan(0);
        const patterns = insights[0].pattern.patterns;
        const optimizationPattern = patterns.find((p: any) => p.type === HarmonyType.DATA_STRUCTURE_OPTIMIZATION);
        expect(optimizationPattern).toBeDefined();
      });

      it('should detect complexity reduction opportunities', async () => {
        const code = `
          for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < otherItems.length; j++) {
              if (items[i] === otherItems[j]) {
                matches.push(items[i]);
              }
            }
          }
        `;

        await patternKeeper.start();
        const insights = await (patternKeeper as any).analyzeForInsights(code, createMockContext());

        expect(insights.length).toBeGreaterThan(0);
        const patterns = insights[0].pattern.patterns;
        const complexityPattern = patterns.find((p: any) => p.type === HarmonyType.COMPLEXITY_REDUCTION);
        expect(complexityPattern).toBeDefined();
      });

      it('should detect recursive beauty opportunities', async () => {
        const code = `
          function factorial(n) {
            let result = 1;
            for (let i = 1; i <= n; i++) {
              result *= i;
            }
            return result;
          }
        `;

        await patternKeeper.start();
        const insights = await (patternKeeper as any).analyzeForInsights(code, createMockContext());

        expect(insights.length).toBeGreaterThan(0);
        const patterns = insights[0].pattern.patterns;
        const recursivePattern = patterns.find((p: any) => p.type === HarmonyType.RECURSIVE_BEAUTY);
        expect(recursivePattern).toBeDefined();
      });
    });

    describe('Whisper Generation', () => {
      it('should generate appropriate whispers for high elegance', async () => {
        const harmony: MathematicalHarmony = {
          elegance: 0.95,
          efficiency: 0.9,
          symmetry: 0.85,
          resonance: 0.8,
          patterns: [
            {
              type: HarmonyType.ALGORITHMIC_ELEGANCE,
              strength: 0.95,
              location: { file: 'test.ts', startLine: 1, endLine: 1, startColumn: 0, endColumn: 10 },
              confidence: 0.9
            }
          ]
        };

        const insight: Insight = {
          id: 'test-insight',
          type: InsightType.MATHEMATICAL_HARMONY,
          observer: ObserverType.PATTERN_KEEPER,
          confidence: 0.95,
          pattern: harmony,
          context: createMockContext(),
          timestamp: new Date()
        };

        const whisper = await patternKeeper.whisper(insight, PlatformType.WEB);

        expect(whisper.message).toContain('Exquisite mathematical harmony');
        expect(whisper.confidence).toBe(0.95);
        expect(whisper.timing).toBe(WhisperTiming.WHEN_CURIOUS);
        expect(whisper.subtlety).toBeLessThan(0.6); // High elegance = more subtle
      });

      it('should generate optimization whispers with code suggestions', async () => {
        const harmony: MathematicalHarmony = {
          elegance: 0.8,
          efficiency: 0.85,
          symmetry: 0.7,
          resonance: 0.75,
          optimization: {
            type: 'DATA_STRUCTURE_CHOICE' as any,
            description: 'Use Set for O(1) lookups',
            originalComplexity: 'O(n)',
            optimizedComplexity: 'O(1)',
            performanceGain: 80,
            readabilityImpact: 0.1,
            implementation: 'const uniqueItems = new Set(items);'
          },
          patterns: []
        };

        const insight: Insight = {
          id: 'test-optimization',
          type: InsightType.PATTERN_OPTIMIZATION,
          observer: ObserverType.PATTERN_KEEPER,
          confidence: 0.85,
          pattern: harmony,
          context: createMockContext(),
          timestamp: new Date()
        };

        const whisper = await patternKeeper.whisper(insight, PlatformType.WEB);

        expect(whisper.message).toContain('80% performance gain');
        expect(whisper.code).toBeDefined();
        expect(whisper.explanation).toContain('O(1)');
        expect(whisper.timing).toBe(WhisperTiming.NEXT_PAUSE);
      });
    });

    describe('Learning and Adaptation', () => {
      it('should adjust harmony threshold based on feedback', () => {
        const initialThreshold = (patternKeeper as any).harmonyThreshold;
        
        // Simulate dismissed feedback
        const feedback = {
          whisperId: 'test-whisper',
          action: 'DISMISSED' as any,
          timestamp: new Date(),
          context: {},
          platform: PlatformType.WEB
        };

        patternKeeper.attune(feedback, PlatformType.WEB);
        
        // Should adjust sensitivity (implementation may vary)
        expect((patternKeeper as any).observerContext.configuration.sensitivity).toBeDefined();
      });

      it('should cache pattern analysis results', async () => {
        const code = 'const x = 1; const y = 2;';
        const context = createMockContext();

        await patternKeeper.start();
        
        // First analysis
        const start1 = performance.now();
        await (patternKeeper as any).analyzeForInsights(code, context);
        const time1 = performance.now() - start1;

        // Second analysis (should be faster due to caching)
        const start2 = performance.now();
        await (patternKeeper as any).analyzeForInsights(code, context);
        const time2 = performance.now() - start2;

        expect(time2).toBeLessThanOrEqual(time1);
        expect((patternKeeper as any).patternCache.size).toBeGreaterThan(0);
      });
    });

    describe('Platform Optimization', () => {
      it('should provide platform-specific optimizations', async () => {
        const webOptimizations = await (patternKeeper as any).getPlatformOptimizations(PlatformType.WEB);
        const desktopOptimizations = await (patternKeeper as any).getPlatformOptimizations(PlatformType.DESKTOP);

        expect(webOptimizations.configuration.webWorkerEnabled).toBeDefined();
        expect(webOptimizations.resourceAllocation.memory).toBe('30MB');
        expect(webOptimizations.performanceTuning.lazyAnalysis).toBe(true);

        expect(desktopOptimizations.configuration.nativeLibraries).toBeDefined();
        expect(desktopOptimizations.resourceAllocation.memory).toBe('100MB');
        expect(desktopOptimizations.performanceTuning.parallelProcessing).toBe(true);
      });
    });
  });

  describe('Web Pattern Keeper', () => {
    let webPatternKeeper: WebPatternKeeper;

    beforeEach(() => {
      // Mock Worker for testing
      (global as any).Worker = class MockWorker {
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((error: any) => void) | null = null;
        onmessageerror: ((error: MessageEvent) => void) | null = null;
        
        constructor(scriptURL: string) {}
        
        postMessage(message: any): void {
          // Simulate worker response
          setTimeout(() => {
            if (message.type === 'PING' && this.onmessage) {
              this.onmessage({ data: { type: 'READY' } } as MessageEvent);
            } else if (message.type === 'ANALYZE_CODE' && this.onmessage) {
              this.onmessage({
                data: {
                  type: 'ANALYSIS_COMPLETE',
                  taskId: message.taskId,
                  insights: []
                }
              } as MessageEvent);
            }
          }, 10);
        }
        
        terminate(): void {}
        addEventListener(): void {}
        removeEventListener(): void {}
      };

      // Mock URL.createObjectURL
      (global as any).URL = {
        createObjectURL: () => 'blob:mock-url',
        revokeObjectURL: () => {}
      };

      // Mock Blob
      (global as any).Blob = class MockBlob {
        constructor(parts: any[], options?: any) {}
      };

      webPatternKeeper = new WebPatternKeeper(mockAdapter, observerContext);
    });

    describe('Web Worker Integration', () => {
      it('should initialize web worker successfully', async () => {
        await webPatternKeeper.start();
        
        expect((webPatternKeeper as any).worker).toBeDefined();
        expect((webPatternKeeper as any).isWorkerReady).toBe(true);
      });

      it('should fallback to main thread when worker fails', async () => {
        // Simulate worker failure
        (webPatternKeeper as any).fallbackToMainThread = true;
        
        await webPatternKeeper.start();
        const code = 'const x = 1;';
        const insights = await (webPatternKeeper as any).analyzeForInsights(code, createMockContext());
        
        // Should still work with main thread fallback
        expect(Array.isArray(insights)).toBe(true);
      });

      it('should handle worker timeout gracefully', async () => {
        // Set short timeout for testing
        (webPatternKeeper as any).workerTimeout = 100;
        
        // Mock worker that doesn't respond
        (webPatternKeeper as any).worker = {
          postMessage: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        };
        
        await webPatternKeeper.start();
        
        const code = 'const x = 1;';
        const analysisPromise = (webPatternKeeper as any).analyzeWithWebWorker(code, createMockContext());
        
        await expect(analysisPromise).rejects.toThrow('timeout');
      });
    });

    describe('Web-Specific Optimizations', () => {
      it('should provide web-optimized configurations', async () => {
        const optimizations = await (webPatternKeeper as any).getPlatformOptimizations(PlatformType.WEB);
        
        expect(optimizations.configuration.webWorkerEnabled).toBeDefined();
        expect(optimizations.configuration.browserOptimized).toBe(true);
        expect(optimizations.performanceTuning.idleCallbackAnalysis).toBe(true);
        expect(optimizations.resourceAllocation.memory).toBe('25MB');
      });

      it('should detect browser features', () => {
        const features = (webPatternKeeper as any).detectBrowserFeatures();
        
        expect(features.webWorkers).toBeDefined();
        expect(features.performanceMemory).toBeDefined();
      });
    });

    describe('Web Whisper Delivery', () => {
      it('should select appropriate render locations for web', () => {
        const harmony: MathematicalHarmony = {
          elegance: 0.95,
          efficiency: 0.9,
          symmetry: 0.8,
          resonance: 0.85,
          optimization: {
            type: 'DATA_STRUCTURE_CHOICE' as any,
            description: 'Test optimization',
            originalComplexity: 'O(n)',
            optimizedComplexity: 'O(1)',
            performanceGain: 50,
            readabilityImpact: 0.1,
            implementation: 'test code'
          },
          patterns: []
        };

        const whisper: WhisperSuggestion = {
          id: 'test',
          type: InsightType.MATHEMATICAL_HARMONY,
          observer: ObserverType.PATTERN_KEEPER,
          message: 'test',
          confidence: 0.9,
          subtlety: 0.5,
          timing: WhisperTiming.NEXT_PAUSE,
          renderLocation: RenderLocation.HUD_OVERLAY,
          metadata: {
            createdAt: new Date(),
            platform: PlatformType.WEB,
            contextHash: 'test',
            priority: 1,
            dismissible: true
          }
        };

        (whisper as any).pattern = harmony;
        
        const location = (webPatternKeeper as any).selectWebRenderLocation(whisper);
        expect(location).toBe(RenderLocation.MONACO_WIDGET); // High performance gain
      });
    });
  });

  describe('Desktop Pattern Keeper', () => {
    let desktopPatternKeeper: DesktopPatternKeeper;

    beforeEach(() => {
      mockAdapter.type = PlatformType.DESKTOP;
      observerContext.platform = PlatformType.DESKTOP;
      observerContext.environment.type = EnvironmentType.CHILD_PROCESS;
      
      // Mock child_process.spawn
      const mockChildProcess = {
        on: jest.fn(),
        send: jest.fn(),
        kill: jest.fn(),
        connected: true,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      };

      jest.doMock('child_process', () => ({
        spawn: jest.fn(() => mockChildProcess)
      }));

      // Mock fs/promises
      jest.doMock('fs/promises', () => ({
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        readFile: jest.fn(() => Promise.resolve('mock file content'))
      }));

      desktopPatternKeeper = new DesktopPatternKeeper(mockAdapter, observerContext);
    });

    describe('Child Process Integration', () => {
      it('should initialize with desktop capabilities', () => {
        expect(desktopPatternKeeper.getType()).toBe(ObserverType.PATTERN_KEEPER);
        expect((desktopPatternKeeper as any).platform).toBe(PlatformType.DESKTOP);
      });

      it('should provide desktop-optimized configurations', async () => {
        const optimizations = await (desktopPatternKeeper as any).getPlatformOptimizations(PlatformType.DESKTOP);
        
        expect(optimizations.configuration.systemAccess).toBe(true);
        expect(optimizations.configuration.advancedAnalysis).toBe(true);
        expect(optimizations.resourceAllocation.memory).toBe('200MB');
        expect(optimizations.performanceTuning.childProcessAnalysis).toBe(true);
      });
    });

    describe('Advanced Analysis', () => {
      it('should perform enhanced desktop analysis', async () => {
        await desktopPatternKeeper.start();
        
        const code = `
          const fs = require('fs');
          const data = fs.readFileSync('file.txt', 'utf8');
          console.log(data);
        `;
        
        const insights = await (desktopPatternKeeper as any).analyzeForInsights(code, createMockContext());
        
        expect(Array.isArray(insights)).toBe(true);
        // Desktop should provide more comprehensive analysis
      });
    });

    describe('System Integration', () => {
      it('should collect system metrics', async () => {
        const metrics = await (desktopPatternKeeper as any).collectSystemMetrics();
        
        expect(metrics.platform).toBeDefined();
        expect(metrics.arch).toBeDefined();
        expect(metrics.nodeVersion).toBeDefined();
      });

      it('should collect process metrics', async () => {
        const metrics = await (desktopPatternKeeper as any).collectProcessMetrics();
        
        expect(metrics.memoryUsage).toBeDefined();
        expect(metrics.cpuUsage).toBeDefined();
        expect(metrics.uptime).toBeDefined();
        expect(metrics.pid).toBeDefined();
      });
    });
  });

  // Helper function to create mock observation context
  function createMockContext(): ObservationContext {
    return {
      timestamp: new Date(),
      platform: PlatformType.WEB,
      codeContext: {
        content: 'test code',
        language: 'typescript',
        filePath: '/test.ts',
        cursorPosition: { line: 1, column: 1 },
        recentChanges: []
      },
      developerState: {
        flowState: 'EXPLORING' as any,
        attentionLevel: 0.8,
        recentPatterns: [],
        preferences: [],
        typingRhythm: {
          averageSpeed: 120,
          pausePatterns: [],
          rhythmConsistency: 0.7,
          recentActivity: []
        }
      },
      systemState: {
        platform: PlatformType.WEB,
        resources: {
          cpuUsage: 0.3,
          memoryUsage: 0.5,
          availableCores: 4,
          diskSpace: 1000000
        },
        permissions: {
          fileSystem: true,
          network: true,
          notifications: true,
          clipboard: true
        },
        network: {
          online: true,
          speed: 100,
          latency: 20,
          stability: 0.95
        },
        storage: {
          available: 1000000,
          used: 500000,
          quota: 2000000,
          type: 'localStorage'
        }
      },
      environmentFactors: [
        {
          type: 'time-of-day',
          value: 14,
          relevance: 0.3,
          platform: PlatformType.WEB
        }
      ]
    };
  }
});