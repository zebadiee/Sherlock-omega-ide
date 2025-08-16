/**
 * AI Dependency Injection Container
 * 
 * Manages dependencies and provides service location for AI components
 * with proper lifecycle management and configuration injection.
 */

import { 
  AIOrchestrator as IAIOrchestrator,
  ModelRouter as IModelRouter,
  ContextEngine as IContextEngine,
  AIConfiguration,
  OrchestratorConfig
} from './interfaces';
import { ModelRouter } from './model-router';
import { ContextEngine } from './context-engine';
import { AIConfigManager } from './config';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../core/whispering-interfaces';

/**
 * Service registration interface
 */
interface ServiceRegistration<T = any> {
  factory: () => T | Promise<T>;
  singleton: boolean;
  instance?: T;
  dependencies?: string[];
}

/**
 * Dependency injection container for AI services
 */
export class AIContainer {
  private services: Map<string, ServiceRegistration> = new Map();
  private instances: Map<string, any> = new Map();
  private initializing: Set<string> = new Set();

  constructor() {
    this.registerDefaultServices();
  }

  /**
   * Register a service with the container
   */
  register<T>(
    name: string, 
    factory: () => T | Promise<T>, 
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): void {
    this.services.set(name, {
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? []
    });
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    name: string, 
    factory: () => T | Promise<T>,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service (new instance each time)
   */
  registerTransient<T>(
    name: string, 
    factory: () => T | Promise<T>,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: false, dependencies });
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(name: string, instance: T): void {
    this.instances.set(name, instance);
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      instance
    });
  }

  /**
   * Resolve a service by name
   */
  async resolve<T>(name: string): Promise<T> {
    // Check if we have a cached instance
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Check for circular dependencies
    if (this.initializing.has(name)) {
      throw new Error(`Circular dependency detected for service: ${name}`);
    }

    const registration = this.services.get(name);
    if (!registration) {
      throw new Error(`Service not registered: ${name}`);
    }

    // If singleton and already has instance, return it
    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    this.initializing.add(name);

    try {
      // Resolve dependencies first
      const dependencies: any[] = [];
      if (registration.dependencies) {
        for (const dep of registration.dependencies) {
          dependencies.push(await this.resolve(dep));
        }
      }

      // Create instance
      const instance = await registration.factory();

      // Cache singleton instances
      if (registration.singleton) {
        registration.instance = instance;
        this.instances.set(name, instance);
      }

      return instance;

    } finally {
      this.initializing.delete(name);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services and instances
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.initializing.clear();
  }

  /**
   * Initialize all singleton services
   */
  async initializeAll(): Promise<void> {
    const singletonServices = Array.from(this.services.entries())
      .filter(([_, registration]) => registration.singleton)
      .map(([name]) => name);

    await Promise.all(singletonServices.map(name => this.resolve(name)));
  }

  /**
   * Create a child container with inherited services
   */
  createChild(): AIContainer {
    const child = new AIContainer();
    
    // Copy service registrations (not instances)
    for (const [name, registration] of this.services.entries()) {
      child.services.set(name, { ...registration, instance: undefined });
    }

    return child;
  }

  /**
   * Register default AI services
   */
  private registerDefaultServices(): void {
    // Configuration Manager
    this.registerSingleton('configManager', () => {
      return new AIConfigManager();
    });

    // Logger
    this.registerSingleton('logger', () => {
      return new Logger(PlatformType.WEB); // Default platform
    });

    // Performance Monitor
    this.registerSingleton('performanceMonitor', () => {
      return new PerformanceMonitor(PlatformType.WEB); // Default platform
    });

    // Model Router
    this.registerSingleton('modelRouter', async () => {
      const logger = await this.resolve<Logger>('logger');
      const performanceMonitor = await this.resolve<PerformanceMonitor>('performanceMonitor');
      return new (await import('./model-router')).ModelRouter(logger, performanceMonitor);
    }, ['logger', 'performanceMonitor']);

    // Context Engine
    this.registerSingleton('contextEngine', async () => {
      const logger = await this.resolve<Logger>('logger');
      const performanceMonitor = await this.resolve<PerformanceMonitor>('performanceMonitor');
      return new (await import('./context-engine')).ContextEngine(logger, performanceMonitor);
    }, ['logger', 'performanceMonitor']);

    // AI Orchestrator
    this.registerSingleton('orchestrator', async () => {
      const modelRouter = await this.resolve<ModelRouter>('modelRouter');
      const contextEngine = await this.resolve<ContextEngine>('contextEngine');
      const logger = await this.resolve<Logger>('logger');
      const performanceMonitor = await this.resolve<PerformanceMonitor>('performanceMonitor');
      const configManager = await this.resolve<AIConfigManager>('configManager');
      
      const orchestratorConfig = configManager.getOrchestratorConfig();
      
      return new (await import('./orchestrator')).AIOrchestrator(
        modelRouter,
        contextEngine,
        logger,
        performanceMonitor,
        orchestratorConfig
      );
    }, ['modelRouter', 'contextEngine', 'logger', 'performanceMonitor', 'configManager']);
  }
}

/**
 * Global AI container instance
 */
export const aiContainer = new AIContainer();

/**
 * Convenience functions for common service resolutions
 */
export const AIServices = {
  async getOrchestrator(): Promise<IAIOrchestrator> {
    return await aiContainer.resolve<IAIOrchestrator>('orchestrator');
  },

  async getModelRouter(): Promise<ModelRouter> {
    return await aiContainer.resolve<ModelRouter>('modelRouter');
  },

  async getContextEngine(): Promise<ContextEngine> {
    return await aiContainer.resolve<ContextEngine>('contextEngine');
  },

  async getConfigManager(): Promise<AIConfigManager> {
    return await aiContainer.resolve<AIConfigManager>('configManager');
  },

  async getLogger(): Promise<Logger> {
    return await aiContainer.resolve<Logger>('logger');
  },

  async getPerformanceMonitor(): Promise<PerformanceMonitor> {
    return await aiContainer.resolve<PerformanceMonitor>('performanceMonitor');
  }
};

/**
 * Configure container for specific platform
 */
export function configureAIContainer(platform: PlatformType, config?: Partial<AIConfiguration>): void {
  // Update logger platform
  aiContainer.registerInstance('logger', new Logger(platform));
  
  // Update performance monitor platform
  aiContainer.registerInstance('performanceMonitor', new PerformanceMonitor(platform));
  
  // Update configuration if provided
  if (config) {
    const configManager = new AIConfigManager(config as AIConfiguration);
    aiContainer.registerInstance('configManager', configManager);
  }
}

/**
 * Initialize AI container with all services
 */
export async function initializeAIContainer(
  platform: PlatformType, 
  config?: Partial<AIConfiguration>
): Promise<void> {
  configureAIContainer(platform, config);
  await aiContainer.initializeAll();
}