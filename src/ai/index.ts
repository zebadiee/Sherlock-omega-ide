/**
 * AI Integration Module Entry Point
 * 
 * Exports all AI integration components and provides a unified interface
 * for initializing and managing AI services in Sherlock Ω IDE.
 */

// Core interfaces and types
export * from './interfaces';

// Main components
export { AIOrchestrator } from './orchestrator';
export { ModelRouter } from './model-router';
export { ContextEngine } from './context-engine';

// Configuration management
export { 
  AIConfigManager, 
  aiConfig, 
  validateAIConfig, 
  DEFAULT_AI_CONFIG 
} from './config';

// Dependency injection container
export { AIContainer } from './container';

// Utility functions
export * from './utils';

/**
 * AI Integration Factory
 * 
 * Provides a simple way to initialize the complete AI integration system
 * with proper dependency injection and configuration.
 */
import { AIOrchestrator } from './orchestrator';
import { ModelRouter } from './model-router';
import { ContextEngine } from './context-engine';
import { AIConfigManager, DEFAULT_AI_CONFIG } from './config';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../core/whispering-interfaces';
import { AIConfiguration } from './interfaces';

export interface AIIntegrationSystem {
  orchestrator: AIOrchestrator;
  modelRouter: ModelRouter;
  contextEngine: ContextEngine;
  configManager: AIConfigManager;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Health check
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }>;
}

export class AIIntegrationFactory {
  /**
   * Create a complete AI integration system
   */
  static async create(
    platform: PlatformType,
    config?: Partial<AIConfiguration>
  ): Promise<AIIntegrationSystem> {
    
    // Initialize configuration
    const configManager = new AIConfigManager(
      config ? { ...DEFAULT_AI_CONFIG, ...config } : DEFAULT_AI_CONFIG
    );

    // Validate configuration
    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Invalid AI configuration: ${validation.errors.join(', ')}`);
    }

    // Initialize core dependencies
    const logger = new Logger(platform);
    const performanceMonitor = new PerformanceMonitor(platform);

    // Initialize AI components
    const modelRouter = new ModelRouter(logger, performanceMonitor);
    const contextEngine = new ContextEngine(logger, performanceMonitor);
    const orchestrator = new AIOrchestrator(
      modelRouter,
      contextEngine,
      logger,
      performanceMonitor,
      configManager.getOrchestratorConfig()
    );

    // Register default models
    const modelConfigs = configManager.getModelConfigurations();
    for (const modelConfig of modelConfigs) {
      await modelRouter.registerModel(modelConfig);
    }

    return new AIIntegrationSystemImpl(
      orchestrator,
      modelRouter,
      contextEngine,
      configManager,
      logger,
      performanceMonitor
    );
  }

  /**
   * Create AI integration system with custom dependencies
   */
  static async createWithDependencies(
    orchestrator: AIOrchestrator,
    modelRouter: ModelRouter,
    contextEngine: ContextEngine,
    configManager: AIConfigManager
  ): Promise<AIIntegrationSystem> {
    
    return new AIIntegrationSystemImpl(
      orchestrator,
      modelRouter,
      contextEngine,
      configManager
    );
  }
}

/**
 * Implementation of AI Integration System
 */
class AIIntegrationSystemImpl implements AIIntegrationSystem {
  constructor(
    public orchestrator: AIOrchestrator,
    public modelRouter: ModelRouter,
    public contextEngine: ContextEngine,
    public configManager: AIConfigManager,
    private logger?: Logger,
    private performanceMonitor?: PerformanceMonitor
  ) {}

  async initialize(): Promise<void> {
    try {
      this.logger?.info('Initializing AI Integration System');

      // Perform health checks on all registered models
      const modelConfigs = this.configManager.getModelConfigurations();
      const healthChecks = await Promise.allSettled(
        modelConfigs.map(model => this.modelRouter.healthCheck(model.modelId))
      );

      const healthyModels = healthChecks
        .map((result, index) => ({ result, model: modelConfigs[index] }))
        .filter(({ result }) => result.status === 'fulfilled' && result.value.status !== 'unhealthy')
        .map(({ model }) => model);

      this.logger?.info('AI Integration System initialized', {
        totalModels: modelConfigs.length,
        healthyModels: healthyModels.length,
        unhealthyModels: modelConfigs.length - healthyModels.length
      });

      if (healthyModels.length === 0) {
        throw new Error('No healthy AI models available');
      }

    } catch (error) {
      this.logger?.error('Failed to initialize AI Integration System', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger?.info('Shutting down AI Integration System');

      // Cleanup resources
      await this.contextEngine.invalidateCache('*');
      
      this.logger?.info('AI Integration System shutdown completed');

    } catch (error) {
      this.logger?.error('Error during AI Integration System shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const modelConfigs = this.configManager.getModelConfigurations();
      const healthChecks = await Promise.allSettled(
        modelConfigs.map(async model => ({
          modelId: model.modelId,
          health: await this.modelRouter.healthCheck(model.modelId)
        }))
      );

      const results = healthChecks
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      const healthyCount = results.filter(r => r.health.status === 'healthy').length;
      const degradedCount = results.filter(r => r.health.status === 'degraded').length;
      const unhealthyCount = results.filter(r => r.health.status === 'unhealthy').length;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      
      if (unhealthyCount === results.length) {
        overallStatus = 'unhealthy';
      } else if (healthyCount === results.length) {
        overallStatus = 'healthy';
      } else {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        details: {
          totalModels: modelConfigs.length,
          healthyModels: healthyCount,
          degradedModels: degradedCount,
          unhealthyModels: unhealthyCount,
          modelHealth: results
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}

/**
 * Convenience function to create and initialize AI integration system
 */
export async function initializeAIIntegration(
  platform: PlatformType,
  config?: Partial<AIConfiguration>
): Promise<AIIntegrationSystem> {
  const system = await AIIntegrationFactory.create(platform, config);
  await system.initialize();
  return system;
}