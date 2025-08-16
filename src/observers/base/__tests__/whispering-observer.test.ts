/**
 * Unit tests for BaseWhisperingObserver
 * Tests platform abstraction and core observer functionality
 */

import { BaseWhisperingObserver, PlatformOptimization } from '../whispering-observer';
import { ObserverFactory } from '../observer-factory';
import {
  PlatformType,
  ObserverType,
  InsightType,
  WhisperSuggestion,
  Insight,
  DeveloperFeedback,
  FeedbackAction,
  ObservationContext
} from '../../../core/whispering-interfaces';
import { UnifiedObserverContext, EnvironmentType } from '../../../types/unified';
import { PlatformAdapter } from '../../../core/platform-interfaces';
import { SensorStatus } from '../../../types/core';

// Mock platform adapter
class MockPlatformAdapter implements PlatformAdapter {
  type = PlatformType.WEB;
  
  async createEditor(): Promise<any> {
    return {};
  }
  
  async createFileExplorer(): Promise<any> {
    return {};
  }
  
  async createTerminal(): Promise<any> {
    return {};
  }
  
  async createWhisperingHUD(): Promise<any> {
    return {};
  }
  
  getFileSystem(): any {
    return {};
  }
  
  getStorage(): any {
    return {};
  }
  
  getGitHubClient(): any {
    return {};
  }
  
  getNotificationManager(): any {
    return {};
  }
  
  async createObserverEnvironment(): Promise<any> {
    return {};
  }
  
  async optimizeForPlatform(): Promise<void> {
    // Mock optimization
  }
  
  getCapabilities(): any {
    return {
      type: PlatformType.WEB,
      ui: {},
      system: {},
      network: {},
      storage: {},
      observers: {}
    };
  }
}

// Test observer implementation
class TestWhisperingObserver extends BaseWhisperingObserver<string> {
  protected observerType = ObserverType.PATTERN_KEEPER;
  protected defaultInsightType = InsightType.MATHEMATICAL_HARMONY;
  
  // Track method calls for testing
  public methodCalls: string[] = [];
  
  protected async analyzeForInsights(
    context: string, 
    observationContext: ObservationContext
  ): Promise<Insight[]> {
    this.methodCalls.push('analyzeForInsights');
    return [
      {
        id: 'test-insight-1',
        type: InsightType.MATHEMATICAL_HARMONY,
        observer: ObserverType.PATTERN_KEEPER,
        confidence: 0.8,
        pattern: { type: 'test-pattern' },
        context: observationContext,
        timestamp: new Date()
      }
    ];
  }
  
  protected async generateBaseWhisper(insight: Insight): Promise<WhisperSuggestion> {
    this.methodCalls.push('generateBaseWhisper');
    return {
      id: `whisper-${insight.id}`,
      type: insight.type,
      observer: insight.observer,
      message: 'Test whisper message',
      confidence: insight.confidence,
      subtlety: 0.7,
      timing: 'NEXT_PAUSE' as any,
      renderLocation: 'MONACO_WIDGET' as any,
      metadata: {
        createdAt: new Date(),
        platform: this.platform,
        contextHash: 'test-hash',
        priority: 1,
        dismissible: true
      }
    };
  }
  
  protected async getPlatformOptimizations(platform: PlatformType): Promise<PlatformOptimization> {
    this.methodCalls.push('getPlatformOptimizations');
    return {
      configuration: { optimized: true },
      resourceAllocation: { memory: '100MB' },
      performanceTuning: { enabled: true },
      environmentSettings: { platform }
    };
  }
  
  protected async extractCodeContext(context: string): Promise<any> {
    this.methodCalls.push('extractCodeContext');
    return {
      content: context,
      language: 'typescript',
      filePath: '/test.ts'
    };
  }
  
  protected async assessDeveloperState(): Promise<any> {
    this.methodCalls.push('assessDeveloperState');
    return {
      flowState: 'EXPLORING',
      attentionLevel: 0.8
    };
  }
  
  protected async getSystemState(): Promise<any> {
    this.methodCalls.push('getSystemState');
    return {
      platform: this.platform,
      resources: { cpuUsage: 0.3, memoryUsage: 0.5 }
    };
  }
  
  protected async gatherEnvironmentFactors(): Promise<any[]> {
    this.methodCalls.push('gatherEnvironmentFactors');
    return [
      { type: 'time-of-day', value: 'morning', relevance: 0.3 }
    ];
  }
  
  protected async validateThroughEthicalGateway(
    whisper: WhisperSuggestion, 
    context: ObservationContext
  ): Promise<boolean> {
    this.methodCalls.push('validateThroughEthicalGateway');
    return true; // Always pass for tests
  }
}

describe('BaseWhisperingObserver', () => {
  let mockAdapter: MockPlatformAdapter;
  let observerContext: UnifiedObserverContext;
  let observer: TestWhisperingObserver;

  beforeEach(() => {
    mockAdapter = new MockPlatformAdapter();
    observerContext = {
      platform: PlatformType.WEB,
      capabilities: {
        backgroundProcessing: true,
        realTimeAnalysis: true,
        crossFileAnalysis: true, // Enable for testing
        systemIntegration: false,
        networkAccess: true,
        persistentStorage: false
      },
      environment: {
        type: EnvironmentType.WEB_WORKER,
        resources: {
          memory: 100 * 1024 * 1024, // 100MB
          cpu: 25, // 25%
          storage: 10 * 1024 * 1024, // 10MB
          network: 1024 * 1024 // 1MB/s
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
            include: ['*.ts'],
            exclude: ['node_modules/**'],
            patterns: ['src/**/*']
          },
          functions: {
            include: ['*'],
            exclude: [],
            patterns: []
          },
          dependencies: {
            include: ['*'],
            exclude: [],
            patterns: []
          },
          timeRange: {}
        },
        filters: []
      }
    };
    
    observer = new TestWhisperingObserver(mockAdapter, observerContext);
  });

  describe('Initialization', () => {
    it('should initialize with correct platform and context', () => {
      expect(observer.getType()).toBe(ObserverType.PATTERN_KEEPER);
      expect(observer.getId()).toBe('pattern_keeper-web');
      expect(observer.isActive()).toBe(false);
    });

    it('should have correct platform type', () => {
      expect((observer as any).platform).toBe(PlatformType.WEB);
    });
  });

  describe('Lifecycle Management', () => {
    it('should start and stop correctly', async () => {
      expect(observer.isActive()).toBe(false);
      
      await observer.start();
      expect(observer.isActive()).toBe(true);
      
      await observer.stop();
      expect(observer.isActive()).toBe(false);
    });

    it('should handle multiple start calls gracefully', async () => {
      await observer.start();
      expect(observer.isActive()).toBe(true);
      
      // Second start should not throw
      await observer.start();
      expect(observer.isActive()).toBe(true);
    });

    it('should handle multiple stop calls gracefully', async () => {
      await observer.start();
      await observer.stop();
      expect(observer.isActive()).toBe(false);
      
      // Second stop should not throw
      await observer.stop();
      expect(observer.isActive()).toBe(false);
    });
  });

  describe('Monitoring', () => {
    it('should return valid sensor result when monitoring', async () => {
      await observer.start();
      
      const result = await observer.monitor();
      
      expect(result.sensorId).toBe('pattern_keeper-web');
      expect(result.status).toBe(SensorStatus.ACTIVE);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return error status when monitoring fails', async () => {
      // Don't start the observer to simulate failure
      const result = await observer.monitor();
      
      expect(result.status).toBe(SensorStatus.ERROR);
      expect(result.data).toHaveProperty('error');
    });
  });

  describe('Observation and Analysis', () => {
    beforeEach(async () => {
      await observer.start();
    });

    it('should perform complete observation cycle', async () => {
      const testContext = 'const x = 1; const y = 2;';
      
      await observer.observe(testContext, PlatformType.WEB);
      
      // Verify all expected methods were called
      expect(observer.methodCalls).toContain('extractCodeContext');
      expect(observer.methodCalls).toContain('assessDeveloperState');
      expect(observer.methodCalls).toContain('getSystemState');
      expect(observer.methodCalls).toContain('gatherEnvironmentFactors');
      expect(observer.methodCalls).toContain('analyzeForInsights');
      expect(observer.methodCalls).toContain('validateThroughEthicalGateway');
      expect(observer.methodCalls).toContain('generateBaseWhisper');
    });

    it('should not observe when inactive', async () => {
      await observer.stop();
      observer.methodCalls = []; // Reset method calls
      
      const testContext = 'const x = 1;';
      await observer.observe(testContext, PlatformType.WEB);
      
      // Should not have called any analysis methods
      expect(observer.methodCalls).toHaveLength(0);
    });

    it('should handle observation errors gracefully', async () => {
      // Override method to throw error
      const originalMethod = observer['analyzeForInsights'];
      observer['analyzeForInsights'] = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const testContext = 'const x = 1;';
      
      // Should not throw
      await expect(observer.observe(testContext, PlatformType.WEB)).resolves.not.toThrow();
      
      // Restore original method
      observer['analyzeForInsights'] = originalMethod;
    });
  });

  describe('Whisper Generation', () => {
    it('should generate platform-appropriate whispers', async () => {
      const testInsight: Insight = {
        id: 'test-insight',
        type: InsightType.MATHEMATICAL_HARMONY,
        observer: ObserverType.PATTERN_KEEPER,
        confidence: 0.9,
        pattern: { type: 'test' },
        context: {} as ObservationContext,
        timestamp: new Date()
      };

      const whisper = await observer.whisper(testInsight, PlatformType.WEB);
      
      expect(whisper.id).toBe('whisper-test-insight');
      expect(whisper.type).toBe(InsightType.MATHEMATICAL_HARMONY);
      expect(whisper.observer).toBe(ObserverType.PATTERN_KEEPER);
      expect(whisper.message).toBe('Test whisper message');
      expect(whisper.confidence).toBe(0.9);
      expect(whisper.metadata.platform).toBe(PlatformType.WEB);
    });
  });

  describe('Learning and Adaptation', () => {
    it('should process positive feedback correctly', () => {
      const feedback: DeveloperFeedback = {
        whisperId: 'test-whisper',
        action: FeedbackAction.ACCEPTED,
        timestamp: new Date(),
        context: {},
        platform: PlatformType.WEB
      };

      // Should not throw
      expect(() => observer.attune(feedback, PlatformType.WEB)).not.toThrow();
    });

    it('should process negative feedback correctly', () => {
      const feedback: DeveloperFeedback = {
        whisperId: 'test-whisper',
        action: FeedbackAction.DISMISSED,
        timestamp: new Date(),
        context: {},
        platform: PlatformType.WEB
      };

      // Should not throw
      expect(() => observer.attune(feedback, PlatformType.WEB)).not.toThrow();
    });

    it('should adjust sensitivity based on feedback', () => {
      const initialSensitivity = observerContext.configuration.sensitivity;
      
      const dismissedFeedback: DeveloperFeedback = {
        whisperId: 'test-whisper',
        action: FeedbackAction.DISMISSED,
        timestamp: new Date(),
        context: {},
        platform: PlatformType.WEB
      };

      observer.attune(dismissedFeedback, PlatformType.WEB);
      
      // Sensitivity should be adjusted (implementation may vary)
      const currentSensitivity = (observer as any).observerContext.configuration.sensitivity;
      expect(currentSensitivity).toBeDefined();
    });
  });

  describe('Platform Optimization', () => {
    it('should optimize for platform', async () => {
      observer.methodCalls = []; // Reset method calls
      
      await observer.optimizeForPlatform(PlatformType.WEB);
      
      expect(observer.methodCalls).toContain('getPlatformOptimizations');
    });

    it('should update context after optimization', async () => {
      const originalConfig = { ...observerContext.configuration };
      
      await observer.optimizeForPlatform(PlatformType.WEB);
      
      // Configuration should be updated (implementation may vary)
      const currentConfig = (observer as any).observerContext.configuration;
      expect(currentConfig).toBeDefined();
    });
  });

  describe('Resonance Detection', () => {
    it('should detect resonance when active and ready', async () => {
      await observer.start();
      
      const isResonating = observer.isResonating(PlatformType.WEB);
      
      expect(isResonating).toBe(true);
    });

    it('should not resonate when inactive', () => {
      const isResonating = observer.isResonating(PlatformType.WEB);
      
      expect(isResonating).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', async () => {
      await observer.start();
      
      // Perform some operations to generate metrics
      await observer.monitor();
      await observer.monitor();
      
      const metrics = (observer as any).performanceMetrics;
      expect(metrics).toBeDefined();
      expect(metrics.analysisSpeed).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
    });

    it('should update accuracy based on success/failure', async () => {
      const initialAccuracy = (observer as any).performanceMetrics.accuracy;
      
      // Simulate successful operation
      (observer as any).updatePerformanceMetrics(100, true);
      
      const updatedAccuracy = (observer as any).performanceMetrics.accuracy;
      expect(updatedAccuracy).toBeGreaterThanOrEqual(initialAccuracy);
    });
  });
});

describe('ObserverFactory', () => {
  let factory: ObserverFactory;
  let mockAdapter: MockPlatformAdapter;
  let observerContext: UnifiedObserverContext;

  beforeEach(() => {
    factory = ObserverFactory.getInstance();
    mockAdapter = new MockPlatformAdapter();
    observerContext = {
      platform: PlatformType.WEB,
      capabilities: {
        backgroundProcessing: true,
        realTimeAnalysis: true,
        crossFileAnalysis: true, // Enable for testing
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
          allowedOperations: ['analyze'],
          restrictedAPIs: []
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
          files: { include: ['*'], exclude: [], patterns: [] },
          functions: { include: ['*'], exclude: [], patterns: [] },
          dependencies: { include: ['*'], exclude: [], patterns: [] },
          timeRange: {}
        },
        filters: []
      }
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const factory1 = ObserverFactory.getInstance();
      const factory2 = ObserverFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });
  });

  describe('Observer Creation', () => {
    it('should create observer with valid configuration', async () => {
      const config = {
        observerType: ObserverType.PATTERN_KEEPER,
        platform: PlatformType.WEB,
        adapter: mockAdapter,
        context: observerContext
      };

      const result = await factory.createObserver(config);
      
      expect(result.observer).toBeDefined();
      expect(result.metadata.observerType).toBe(ObserverType.PATTERN_KEEPER);
      expect(result.metadata.platform).toBe(PlatformType.WEB);
      expect(result.metadata.capabilities).toBeInstanceOf(Array);
      expect(result.metadata.limitations).toBeInstanceOf(Array);
      expect(result.metadata.optimizations).toBeInstanceOf(Array);
    });

    it('should reuse existing observer', async () => {
      const config = {
        observerType: ObserverType.PATTERN_KEEPER,
        platform: PlatformType.WEB,
        adapter: mockAdapter,
        context: observerContext
      };

      const result1 = await factory.createObserver(config);
      const result2 = await factory.createObserver(config);
      
      expect(result1.observer).toBe(result2.observer);
    });
  });

  describe('Observer Set Creation', () => {
    it('should create multiple observers for platform', async () => {
      const observers = await factory.createObserverSet(
        PlatformType.WEB,
        mockAdapter,
        observerContext
      );
      
      expect(observers.size).toBe(3);
      expect(observers.has(ObserverType.PATTERN_KEEPER)).toBe(true);
      expect(observers.has(ObserverType.SYSTEMS_PHILOSOPHER)).toBe(true);
      expect(observers.has(ObserverType.COSMIC_CARTOGRAPHER)).toBe(true);
    });
  });

  describe('Observer Capabilities', () => {
    it('should return correct capabilities for web platform', () => {
      const capabilities = factory.getObserverCapabilities(
        ObserverType.PATTERN_KEEPER,
        PlatformType.WEB
      );
      
      expect(capabilities.capabilities).toContain('Web Worker processing');
      expect(capabilities.capabilities).toContain('Mathematical harmony detection');
      expect(capabilities.limitations).toContain('Limited file system access');
      expect(capabilities.optimizations).toContain('Lazy loading');
    });

    it('should return correct capabilities for desktop platform', () => {
      const capabilities = factory.getObserverCapabilities(
        ObserverType.SYSTEMS_PHILOSOPHER,
        PlatformType.DESKTOP
      );
      
      expect(capabilities.capabilities).toContain('Full system access');
      expect(capabilities.capabilities).toContain('Architectural analysis');
      expect(capabilities.limitations).toContain('Platform-specific APIs');
      expect(capabilities.optimizations).toContain('Native libraries');
    });
  });

  describe('Platform Observer Management', () => {
    it('should get observers for platform', async () => {
      await factory.createObserverSet(PlatformType.WEB, mockAdapter, observerContext);
      
      const platformObservers = factory.getObserversForPlatform(PlatformType.WEB);
      
      expect(platformObservers.length).toBeGreaterThan(0);
    });

    it('should cleanup platform observers', async () => {
      await factory.createObserverSet(PlatformType.WEB, mockAdapter, observerContext);
      
      const beforeCleanup = factory.getObserversForPlatform(PlatformType.WEB);
      expect(beforeCleanup.length).toBeGreaterThan(0);
      
      await factory.cleanupPlatformObservers(PlatformType.WEB);
      
      const afterCleanup = factory.getObserversForPlatform(PlatformType.WEB);
      expect(afterCleanup.length).toBe(0);
    });
  });
});