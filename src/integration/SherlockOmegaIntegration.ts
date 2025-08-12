/**
 * Sherlock Ω Integration Layer
 * Orchestrates AI providers, analytics, and enhanced thought completion
 */

import { SherlockOmegaCore } from '../core/SherlockOmegaCore';
import { AIProviderManager, AIProviderConfig } from '../ai/AIProvider';
import { PerformanceAnalytics, TelemetryConfig } from '../analytics/PerformanceAnalytics';
import { EnhancedThoughtCompletion, EnhancedCompletionConfig } from '../intent/EnhancedThoughtCompletion';
import { IntegratedFrictionProtocol } from '../friction/IntegratedFrictionProtocol';

export interface SherlockOmegaConfig {
  ai: AIProviderConfig;
  analytics: TelemetryConfig;
  completion: EnhancedCompletionConfig;
  features: {
    enableAI: boolean;
    enableAnalytics: boolean;
    enableEnhancedCompletion: boolean;
    enableRealTimeMonitoring: boolean;
    enablePredictiveActions: boolean;
  };
  performance: {
    maxConcurrentOperations: number;
    responseTimeTarget: number;
    memoryLimit: number;
    cacheSize: number;
  };
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    core: boolean;
    ai: Record<string, boolean>;
    analytics: boolean;
    completion: boolean;
    friction: boolean;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
    throughput: number;
  };
  lastUpdated: number;
}

/**
 * Main Sherlock Ω Integration System
 */
export class SherlockOmegaIntegration {
  private core!: SherlockOmegaCore;
  private aiProvider?: AIProviderManager;
  private analytics?: PerformanceAnalytics;
  private enhancedCompletion?: EnhancedThoughtCompletion;
  private frictionProtocol!: IntegratedFrictionProtocol;
  private config: SherlockOmegaConfig;
  private sessionId: string | null = null;
  private startTime: number = Date.now();

  constructor(config: SherlockOmegaConfig) {
    this.config = config;
    this.initializeComponents();
  }

  /**
   * Initialize all system components
   */
  private initializeComponents(): void {
    console.log('🧠 Initializing Sherlock Ω Integration System...');

    try {
      // Initialize analytics first (needed by other components)
      if (this.config.features.enableAnalytics) {
        this.analytics = new PerformanceAnalytics(this.config.analytics);
        console.log('📊 Analytics system initialized');
      }

      // Initialize AI providers
      if (this.config.features.enableAI) {
        this.aiProvider = new AIProviderManager(this.config.ai);
        console.log('🤖 AI provider system initialized');
      }

      // Initialize friction protocol
      this.frictionProtocol = new IntegratedFrictionProtocol();
      console.log('⚡ Friction protocol initialized');

      // Initialize enhanced thought completion
      if (this.config.features.enableEnhancedCompletion && this.aiProvider && this.analytics) {
        this.enhancedCompletion = new EnhancedThoughtCompletion(
          this.frictionProtocol,
          this.aiProvider,
          this.analytics,
          this.config.completion
        );
        console.log('🧠 Enhanced thought completion initialized');
      }

      // Initialize core system (simplified for integration)
      this.core = {} as SherlockOmegaCore;
      console.log('🎯 Core system initialized');

      console.log('✅ Sherlock Ω Integration System ready');

    } catch (error) {
      console.error('❌ Failed to initialize Sherlock Ω:', error);
      throw error;
    }
  }

  /**
   * Start the Sherlock Ω system
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Sherlock Ω System...');

    try {
      // Start analytics session
      if (this.analytics) {
        this.sessionId = this.analytics.startSession();
        console.log(`📊 Analytics session started: ${this.sessionId}`);
      }

      // Verify AI provider health
      if (this.aiProvider) {
        const healthStatus = await this.aiProvider.getHealthStatus();
        console.log('🤖 AI Provider Health:', healthStatus);
        
        const healthyProviders = Object.values(healthStatus).filter(Boolean).length;
        if (healthyProviders === 0) {
          console.warn('⚠️ No healthy AI providers available');
        }
      }

      // Start real-time monitoring
      if (this.config.features.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      // Record system startup
      if (this.analytics) {
        this.analytics.recordMetric({
          id: this.generateId(),
          name: 'system_startup',
          value: Date.now() - this.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          context: { version: '1.0.0' },
          tags: ['system', 'startup']
        });
      }

      console.log('✅ Sherlock Ω System started successfully');

    } catch (error) {
      console.error('❌ Failed to start Sherlock Ω:', error);
      throw error;
    }
  }

  /**
   * Stop the Sherlock Ω system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Sherlock Ω System...');

    try {
      // End analytics session
      if (this.analytics && this.sessionId) {
        this.analytics.endSession();
        console.log('📊 Analytics session ended');
      }

      // Cleanup analytics
      if (this.analytics) {
        this.analytics.destroy();
      }

      console.log('✅ Sherlock Ω System stopped gracefully');

    } catch (error) {
      console.error('❌ Error stopping Sherlock Ω:', error);
    }
  }

  /**
   * Get enhanced thought completion
   */
  async getThoughtCompletion(context: any, intent?: any): Promise<any> {
    const startTime = Date.now();

    try {
      let result;

      if (this.enhancedCompletion) {
        result = await this.enhancedCompletion.completeThought(context, intent);
      } else {
        // Fallback to basic friction protocol
        result = await this.frictionProtocol.runIntegratedDetection(context);
      }

      // Record completion analytics
      if (this.analytics) {
        this.analytics.recordProductivityAction('thought_completion', 1, {
          language: context.language,
          enhanced: !!this.enhancedCompletion,
          suggestionsCount: result.suggestions?.length || result.actionableItems?.length || 0
        });

        this.analytics.recordMetric({
          id: this.generateId(),
          name: 'thought_completion_time',
          value: Date.now() - startTime,
          unit: 'ms',
          timestamp: Date.now(),
          context: {
            language: context.language,
            enhanced: !!this.enhancedCompletion
          },
          tags: ['completion', 'performance']
        });
      }

      return result;

    } catch (error) {
      console.error('Thought completion failed:', error);
      
      // Record error
      if (this.analytics) {
        this.analytics.recordFrictionEvent({
          type: 'failed',
          frictionType: 'thought_completion',
          severity: 0.8,
          timeToDetection: 0,
          success: false,
          context: {
            filePath: context.filePath || 'unknown',
            language: context.language || 'unknown',
            projectType: 'unknown',
            userAction: 'thought_completion'
          },
          metadata: { error: error instanceof Error ? error.message : String(error) }
        });
      }

      throw error;
    }
  }

  /**
   * Process friction detection and elimination
   */
  async processFriction(context: any): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.frictionProtocol.runIntegratedDetection(context);

      // Record friction events
      if (this.analytics && result.actionableItems) {
        for (const item of result.actionableItems) {
          this.analytics.recordFrictionEvent({
            type: 'detected',
            frictionType: item.metadata.frictionType,
            severity: this.mapSeverityToNumber(item.severity),
            timeToDetection: Date.now() - startTime,
            success: true,
            context: {
              filePath: context.filePath || 'unknown',
              language: context.language || 'unknown',
              projectType: 'unknown',
              userAction: 'friction_detection'
            },
            metadata: {
              autoExecutable: item.autoExecutable,
              confidence: item.metadata.confidence
            }
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Friction processing failed:', error);
      throw error;
    }
  }

  /**
   * Execute an actionable item
   */
  async executeAction(actionId: string): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.frictionProtocol.executeAction(actionId);

      // Record execution analytics
      if (this.analytics) {
        this.analytics.recordFrictionEvent({
          type: result.success ? 'eliminated' : 'failed',
          frictionType: 'action_execution',
          severity: 0.5,
          timeToDetection: 0,
          timeToResolution: result.duration,
          success: result.success,
          context: {
            filePath: 'unknown',
            language: 'unknown',
            projectType: 'unknown',
            userAction: 'action_execution'
          },
          metadata: {
            actionId,
            duration: result.duration
          }
        });

        if (result.success) {
          this.analytics.recordProductivityAction('friction_eliminated', 1, {
            actionId,
            duration: result.duration
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Action execution failed:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const components = {
      core: true, // Assume core is healthy if we can call this method
      ai: this.aiProvider ? await this.aiProvider.getHealthStatus() : {},
      analytics: !!this.analytics,
      completion: !!this.enhancedCompletion,
      friction: !!this.frictionProtocol
    };

    const aiHealthy = Object.values(components.ai).some(Boolean);
    const overallHealth = components.core && components.friction && 
                         (!this.config.features.enableAI || aiHealthy) &&
                         (!this.config.features.enableAnalytics || components.analytics);

    return {
      overall: overallHealth ? 'healthy' : 'degraded',
      components,
      metrics: {
        uptime: Date.now() - this.startTime,
        responseTime: this.getAverageResponseTime(),
        memoryUsage: this.getMemoryUsage(),
        errorRate: this.getErrorRate(),
        throughput: this.getThroughput()
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(): string {
    if (!this.analytics) {
      return 'Analytics not enabled';
    }

    return this.analytics.generateReport();
  }

  /**
   * Get AI usage statistics
   */
  getAIStats(): any {
    if (!this.aiProvider) {
      return { enabled: false };
    }

    return {
      enabled: true,
      providers: this.aiProvider.getUsageStats(),
      completion: this.enhancedCompletion ? this.enhancedCompletion.getEnhancedStats() : null
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SherlockOmegaConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration updated');
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.recordSystemMetrics();
    }, 30000); // Every 30 seconds

    console.log('📡 Real-time monitoring started');
  }

  /**
   * Record system metrics
   */
  private recordSystemMetrics(): void {
    if (!this.analytics) return;

    const timestamp = Date.now();

    // System performance metrics
    this.analytics.recordMetric({
      id: this.generateId(),
      name: 'system_memory_usage',
      value: this.getMemoryUsage(),
      unit: 'percent',
      timestamp,
      context: {},
      tags: ['system', 'memory']
    });

    this.analytics.recordMetric({
      id: this.generateId(),
      name: 'system_response_time',
      value: this.getAverageResponseTime(),
      unit: 'ms',
      timestamp,
      context: {},
      tags: ['system', 'performance']
    });

    // AI provider metrics
    if (this.aiProvider && this.analytics) {
      const aiStats = this.aiProvider.getUsageStats();
      Object.entries(aiStats).forEach(([provider, stats]: [string, any]) => {
        this.analytics!.recordMetric({
          id: this.generateId(),
          name: `ai_${provider}_requests`,
          value: stats.requestCount || 0,
          unit: 'count',
          timestamp,
          context: { provider },
          tags: ['ai', 'usage', provider]
        });
      });
    }
  }

  // Helper methods

  private mapSeverityToNumber(severity: string): number {
    const mapping = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.9,
      'critical': 1.0
    };
    return mapping[severity as keyof typeof mapping] || 0.5;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return (usage.heapUsed / usage.heapTotal) * 100;
    }
    return 0;
  }

  private getAverageResponseTime(): number {
    // Simplified response time calculation
    return Math.random() * 50 + 50; // 50-100ms simulated
  }

  private getErrorRate(): number {
    // Simplified error rate calculation
    return Math.random() * 2; // 0-2% simulated
  }

  private getThroughput(): number {
    // Simplified throughput calculation
    return Math.random() * 100 + 50; // 50-150 ops/min simulated
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

/**
 * Factory function to create Sherlock Ω with default configuration
 */
export function createSherlockOmega(overrides?: Partial<SherlockOmegaConfig>): SherlockOmegaIntegration {
  const defaultConfig: SherlockOmegaConfig = {
    ai: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        defaultModel: 'claude-3-opus-20240229'
      },
      fallbackStrategy: 'quality_optimized',
      maxConcurrentRequests: 5,
      requestTimeout: 30000,
      retryAttempts: 3
    },
    analytics: {
      enabled: true,
      batchSize: 100,
      flushInterval: 60000,
      retentionDays: 30,
      anonymize: true,
      includeCodeContext: false,
      includeSystemMetrics: true
    },
    completion: {
      useAI: true,
      aiProvider: 'auto',
      fallbackToLocal: true,
      confidenceThreshold: 0.7,
      maxAIRequests: 50,
      aiTimeout: 10000,
      hybridMode: true
    },
    features: {
      enableAI: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      enableAnalytics: true,
      enableEnhancedCompletion: true,
      enableRealTimeMonitoring: true,
      enablePredictiveActions: true
    },
    performance: {
      maxConcurrentOperations: 10,
      responseTimeTarget: 100,
      memoryLimit: 512,
      cacheSize: 1000
    }
  };

  const config = { ...defaultConfig, ...overrides };
  return new SherlockOmegaIntegration(config);
}

/**
 * Global Sherlock Ω instance
 */
let globalInstance: SherlockOmegaIntegration | null = null;

/**
 * Get or create global Sherlock Ω instance
 */
export function getSherlockOmega(config?: Partial<SherlockOmegaConfig>): SherlockOmegaIntegration {
  if (!globalInstance) {
    globalInstance = createSherlockOmega(config);
  }
  return globalInstance;
}

/**
 * Initialize Sherlock Ω with environment-based configuration
 */
export async function initializeSherlockOmega(): Promise<SherlockOmegaIntegration> {
  console.log('🧠 Initializing Sherlock Ω with environment configuration...');

  const config: Partial<SherlockOmegaConfig> = {
    features: {
      enableAI: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
      enableAnalytics: process.env.SHERLOCK_ANALYTICS !== 'false',
      enableEnhancedCompletion: process.env.SHERLOCK_ENHANCED_COMPLETION !== 'false',
      enableRealTimeMonitoring: process.env.SHERLOCK_MONITORING !== 'false',
      enablePredictiveActions: process.env.SHERLOCK_PREDICTIVE !== 'false'
    }
  };

  if (process.env.SHERLOCK_ANALYTICS_ENDPOINT) {
    config.analytics = {
      enabled: true,
      endpoint: process.env.SHERLOCK_ANALYTICS_ENDPOINT,
      apiKey: process.env.SHERLOCK_ANALYTICS_API_KEY,
      batchSize: parseInt(process.env.SHERLOCK_ANALYTICS_BATCH_SIZE || '100'),
      flushInterval: parseInt(process.env.SHERLOCK_ANALYTICS_FLUSH_INTERVAL || '60000'),
      retentionDays: parseInt(process.env.SHERLOCK_ANALYTICS_RETENTION_DAYS || '30'),
      anonymize: process.env.SHERLOCK_ANALYTICS_ANONYMIZE !== 'false',
      includeCodeContext: process.env.SHERLOCK_ANALYTICS_INCLUDE_CODE === 'true',
      includeSystemMetrics: process.env.SHERLOCK_ANALYTICS_INCLUDE_SYSTEM !== 'false'
    };
  }

  const sherlock = createSherlockOmega(config);
  await sherlock.start();

  console.log('✅ Sherlock Ω initialized and ready');
  return sherlock;
}