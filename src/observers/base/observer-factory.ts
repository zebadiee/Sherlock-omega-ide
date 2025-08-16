/**
 * Observer Factory for Platform-Specific Creation
 * Creates appropriate observer implementations based on platform capabilities
 */

import { PlatformType, ObserverType } from '../../core/whispering-interfaces';
import { UnifiedObserverContext } from '../../types/unified';
import { PlatformAdapter } from '../../core/platform-interfaces';
import { BaseWhisperingObserver } from './whispering-observer';

// Observer creation configuration
export interface ObserverCreationConfig {
  observerType: ObserverType;
  platform: PlatformType;
  adapter: PlatformAdapter;
  context: UnifiedObserverContext;
  customConfig?: Record<string, any>;
}

// Observer factory result
export interface ObserverCreationResult<T> {
  observer: BaseWhisperingObserver<T>;
  metadata: ObserverMetadata;
}

export interface ObserverMetadata {
  observerType: ObserverType;
  platform: PlatformType;
  capabilities: string[];
  limitations: string[];
  optimizations: string[];
  createdAt: Date;
}

/**
 * Factory class for creating platform-specific observer implementations
 */
export class ObserverFactory {
  private static instance: ObserverFactory;
  private observerRegistry: Map<string, ObserverConstructor> = new Map();
  private createdObservers: Map<string, BaseWhisperingObserver<any>> = new Map();

  private constructor() {
    this.registerDefaultObservers();
  }

  public static getInstance(): ObserverFactory {
    if (!ObserverFactory.instance) {
      ObserverFactory.instance = new ObserverFactory();
    }
    return ObserverFactory.instance;
  }

  /**
   * Create a platform-specific observer
   */
  async createObserver<T>(config: ObserverCreationConfig): Promise<ObserverCreationResult<T>> {
    const observerKey = this.generateObserverKey(config);
    
    // Check if observer already exists
    if (this.createdObservers.has(observerKey)) {
      const existingObserver = this.createdObservers.get(observerKey) as BaseWhisperingObserver<T>;
      return {
        observer: existingObserver,
        metadata: this.generateObserverMetadata(config, true)
      };
    }

    // Validate platform capabilities
    this.validatePlatformCapabilities(config);

    // Get appropriate observer constructor
    const ObserverConstructor = this.getObserverConstructor(config);

    // Create observer instance
    const observer = new ObserverConstructor(config.adapter, config.context);

    // Apply platform-specific optimizations
    await observer.optimizeForPlatform(config.platform);

    // Apply custom configuration if provided
    if (config.customConfig) {
      await this.applyCustomConfiguration(observer, config.customConfig);
    }

    // Register the created observer
    this.createdObservers.set(observerKey, observer);

    return {
      observer,
      metadata: this.generateObserverMetadata(config, false)
    };
  }

  /**
   * Create multiple observers for a platform
   */
  async createObserverSet<T>(
    platform: PlatformType,
    adapter: PlatformAdapter,
    context: UnifiedObserverContext,
    observerTypes: ObserverType[] = [
      ObserverType.PATTERN_KEEPER,
      ObserverType.SYSTEMS_PHILOSOPHER,
      ObserverType.COSMIC_CARTOGRAPHER
    ]
  ): Promise<Map<ObserverType, ObserverCreationResult<T>>> {
    const observers = new Map<ObserverType, ObserverCreationResult<T>>();

    for (const observerType of observerTypes) {
      try {
        const config: ObserverCreationConfig = {
          observerType,
          platform,
          adapter,
          context: this.createObserverSpecificContext(context, observerType)
        };

        const result = await this.createObserver<T>(config);
        observers.set(observerType, result);
      } catch (error) {
        console.error(`Failed to create ${observerType} for ${platform}:`, error);
        // Continue creating other observers even if one fails
      }
    }

    return observers;
  }

  /**
   * Register a custom observer implementation
   */
  registerObserver(
    observerType: ObserverType,
    platform: PlatformType,
    constructor: ObserverConstructor
  ): void {
    const key = this.generateRegistryKey(observerType, platform);
    this.observerRegistry.set(key, constructor);
  }

  /**
   * Get all created observers for a platform
   */
  getObserversForPlatform(platform: PlatformType): BaseWhisperingObserver<any>[] {
    const platformObservers: BaseWhisperingObserver<any>[] = [];
    
    for (const [key, observer] of this.createdObservers.entries()) {
      if (key.includes(platform.toLowerCase())) {
        platformObservers.push(observer);
      }
    }
    
    return platformObservers;
  }

  /**
   * Cleanup observers for a platform
   */
  async cleanupPlatformObservers(platform: PlatformType): Promise<void> {
    const platformObservers = this.getObserversForPlatform(platform);
    
    for (const observer of platformObservers) {
      try {
        await observer.stop();
        
        // Remove from registry
        const observerKey = this.findObserverKey(observer);
        if (observerKey) {
          this.createdObservers.delete(observerKey);
        }
      } catch (error) {
        console.error(`Failed to cleanup observer:`, error);
      }
    }
  }

  /**
   * Get observer capabilities for a platform
   */
  getObserverCapabilities(
    observerType: ObserverType,
    platform: PlatformType
  ): ObserverCapabilityInfo {
    const capabilities: string[] = [];
    const limitations: string[] = [];
    const optimizations: string[] = [];

    switch (platform) {
      case PlatformType.WEB:
        capabilities.push('Web Worker processing', 'Browser API access', 'Real-time analysis');
        limitations.push('Limited file system access', 'Memory constraints', 'CORS restrictions');
        optimizations.push('Lazy loading', 'Incremental updates', 'Worker pooling');
        break;

      case PlatformType.DESKTOP:
        capabilities.push('Full system access', 'Child process spawning', 'File system monitoring');
        limitations.push('Platform-specific APIs', 'Resource management complexity');
        optimizations.push('Native libraries', 'Hardware acceleration', 'System integration');
        break;

      case PlatformType.HYBRID:
        capabilities.push('Best of both platforms', 'Adaptive behavior', 'Fallback mechanisms');
        limitations.push('Increased complexity', 'Resource overhead');
        optimizations.push('Dynamic platform selection', 'Resource sharing', 'Unified interfaces');
        break;
    }

    // Add observer-specific capabilities
    switch (observerType) {
      case ObserverType.PATTERN_KEEPER:
        capabilities.push('Mathematical harmony detection', 'Algorithm optimization');
        break;
      case ObserverType.SYSTEMS_PHILOSOPHER:
        capabilities.push('Architectural analysis', 'Dependency relationship mapping');
        break;
      case ObserverType.COSMIC_CARTOGRAPHER:
        capabilities.push('Cross-dimensional analysis', 'Emergent pattern detection');
        break;
    }

    return { capabilities, limitations, optimizations };
  }

  // Private methods
  private registerDefaultObservers(): void {
    // Default observers will be registered here
    // For now, we'll use placeholder implementations
    
    // Pattern Keeper observers
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.PATTERN_KEEPER, PlatformType.WEB),
      MockWebPatternKeeper as any
    );
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.PATTERN_KEEPER, PlatformType.DESKTOP),
      MockDesktopPatternKeeper as any
    );

    // Systems Philosopher observers
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.SYSTEMS_PHILOSOPHER, PlatformType.WEB),
      MockWebSystemsPhilosopher as any
    );
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.SYSTEMS_PHILOSOPHER, PlatformType.DESKTOP),
      MockDesktopSystemsPhilosopher as any
    );

    // Cosmic Cartographer observers
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.COSMIC_CARTOGRAPHER, PlatformType.WEB),
      MockWebCosmicCartographer as any
    );
    this.observerRegistry.set(
      this.generateRegistryKey(ObserverType.COSMIC_CARTOGRAPHER, PlatformType.DESKTOP),
      MockDesktopCosmicCartographer as any
    );
  }

  private generateObserverKey(config: ObserverCreationConfig): string {
    return `${config.observerType.toLowerCase()}-${config.platform.toLowerCase()}`;
  }

  private generateRegistryKey(observerType: ObserverType, platform: PlatformType): string {
    return `${observerType}-${platform}`;
  }

  private validatePlatformCapabilities(config: ObserverCreationConfig): void {
    const requiredCapabilities = this.getRequiredCapabilities(config.observerType);
    const platformCapabilities = config.context.capabilities;

    for (const capability of requiredCapabilities) {
      if (!this.hasPlatformCapability(platformCapabilities, capability)) {
        throw new Error(
          `Platform ${config.platform} lacks required capability: ${capability} for ${config.observerType}`
        );
      }
    }
  }

  private getRequiredCapabilities(observerType: ObserverType): string[] {
    switch (observerType) {
      case ObserverType.PATTERN_KEEPER:
        return ['backgroundProcessing', 'realTimeAnalysis'];
      case ObserverType.SYSTEMS_PHILOSOPHER:
        return ['backgroundProcessing', 'crossFileAnalysis'];
      case ObserverType.COSMIC_CARTOGRAPHER:
        return ['backgroundProcessing', 'crossFileAnalysis', 'networkAccess'];
      default:
        return ['backgroundProcessing'];
    }
  }

  private hasPlatformCapability(capabilities: any, capability: string): boolean {
    return capabilities[capability] === true;
  }

  private getObserverConstructor(config: ObserverCreationConfig): ObserverConstructor {
    const primaryKey = this.generateRegistryKey(config.observerType, config.platform);
    let constructor = this.observerRegistry.get(primaryKey);

    if (!constructor) {
      // Try fallback to web implementation for hybrid
      if (config.platform === PlatformType.HYBRID) {
        const fallbackKey = this.generateRegistryKey(config.observerType, PlatformType.WEB);
        constructor = this.observerRegistry.get(fallbackKey);
      }
    }

    if (!constructor) {
      throw new Error(
        `No observer implementation found for ${config.observerType} on ${config.platform}`
      );
    }

    return constructor;
  }

  private createObserverSpecificContext(
    baseContext: UnifiedObserverContext,
    observerType: ObserverType
  ): UnifiedObserverContext {
    // Create observer-specific context with tailored configuration
    const observerContext = { ...baseContext };

    switch (observerType) {
      case ObserverType.PATTERN_KEEPER:
        observerContext.configuration.scope.files.patterns = ['**/*.ts', '**/*.js'];
        observerContext.configuration.filters = [
          {
            type: 'COMPLEXITY' as any,
            condition: 'medium',
            action: 'PRIORITIZE' as any
          }
        ];
        break;

      case ObserverType.SYSTEMS_PHILOSOPHER:
        observerContext.configuration.scope.files.patterns = ['**/src/**/*', '**/lib/**/*'];
        observerContext.configuration.filters = [
          {
            type: 'FILE_TYPE' as any,
            condition: 'architecture',
            action: 'PRIORITIZE' as any
          }
        ];
        break;

      case ObserverType.COSMIC_CARTOGRAPHER:
        observerContext.configuration.scope.files.patterns = ['**/*'];
        observerContext.configuration.filters = [
          {
            type: 'PATTERN' as any,
            condition: 'cross-cutting',
            action: 'PRIORITIZE' as any
          }
        ];
        break;
    }

    return observerContext;
  }

  private generateObserverMetadata(
    config: ObserverCreationConfig,
    isExisting: boolean
  ): ObserverMetadata {
    const capabilityInfo = this.getObserverCapabilities(config.observerType, config.platform);

    return {
      observerType: config.observerType,
      platform: config.platform,
      capabilities: capabilityInfo.capabilities,
      limitations: capabilityInfo.limitations,
      optimizations: capabilityInfo.optimizations,
      createdAt: isExisting ? new Date(0) : new Date() // Use epoch for existing observers
    };
  }

  private async applyCustomConfiguration(
    observer: BaseWhisperingObserver<any>,
    customConfig: Record<string, any>
  ): Promise<void> {
    // Apply custom configuration to the observer
    // This would typically involve calling observer-specific configuration methods
    console.log('Applying custom configuration:', customConfig);
  }

  private findObserverKey(observer: BaseWhisperingObserver<any>): string | undefined {
    for (const [key, registeredObserver] of this.createdObservers.entries()) {
      if (registeredObserver === observer) {
        return key;
      }
    }
    return undefined;
  }
}

// Type definitions
type ObserverConstructor = new (
  adapter: PlatformAdapter,
  context: UnifiedObserverContext
) => BaseWhisperingObserver<any>;

interface ObserverCapabilityInfo {
  capabilities: string[];
  limitations: string[];
  optimizations: string[];
}

// Mock observer implementations (placeholders for now)
class MockWebPatternKeeper extends BaseWhisperingObserver<string> {
  protected observerType = ObserverType.PATTERN_KEEPER;
  protected defaultInsightType = 'MATHEMATICAL_HARMONY' as any;

  protected async analyzeForInsights(): Promise<any[]> {
    return [];
  }

  protected async generateBaseWhisper(): Promise<any> {
    return {};
  }

  protected async getPlatformOptimizations(): Promise<any> {
    return {};
  }

  protected async extractCodeContext(): Promise<any> {
    return {};
  }

  protected async assessDeveloperState(): Promise<any> {
    return {};
  }

  protected async getSystemState(): Promise<any> {
    return {};
  }

  protected async gatherEnvironmentFactors(): Promise<any[]> {
    return [];
  }

  protected async validateThroughEthicalGateway(): Promise<boolean> {
    return true;
  }
}

class MockDesktopPatternKeeper extends MockWebPatternKeeper {}
class MockWebSystemsPhilosopher extends MockWebPatternKeeper {
  protected observerType = ObserverType.SYSTEMS_PHILOSOPHER;
  protected defaultInsightType = 'COMPUTATIONAL_POETRY' as any;
}
class MockDesktopSystemsPhilosopher extends MockWebSystemsPhilosopher {}
class MockWebCosmicCartographer extends MockWebPatternKeeper {
  protected observerType = ObserverType.COSMIC_CARTOGRAPHER;
  protected defaultInsightType = 'COSMIC_CONNECTION' as any;
}
class MockDesktopCosmicCartographer extends MockWebCosmicCartographer {}

// Export singleton instance
export const observerFactory = ObserverFactory.getInstance();