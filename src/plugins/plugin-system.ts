import { PlatformType } from '../core/whispering-interfaces';

/**
 * Plugin lifecycle events that can be listened to
 */
export enum PluginEvent {
  // System events
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  CONFIGURATION_CHANGED = 'configuration_changed',
  
  // Observer events
  OBSERVER_STARTED = 'observer_started',
  OBSERVER_STOPPED = 'observer_stopped',
  INSIGHT_GENERATED = 'insight_generated',
  WHISPER_DELIVERED = 'whisper_delivered',
  
  // Evolution events
  EVOLUTION_CYCLE_STARTED = 'evolution_cycle_started',
  EVOLUTION_CYCLE_COMPLETED = 'evolution_cycle_completed',
  LEARNING_EVENT = 'learning_event',
  ADAPTATION_OCCURRED = 'adaptation_occurred',
  
  // User interaction events
  USER_ACTION = 'user_action',
  FILE_OPENED = 'file_opened',
  CODE_CHANGED = 'code_changed',
  SUGGESTION_ACCEPTED = 'suggestion_accepted',
  SUGGESTION_REJECTED = 'suggestion_rejected',
  
  // Performance events
  PERFORMANCE_ALERT = 'performance_alert',
  RESOURCE_USAGE_HIGH = 'resource_usage_high',
  
  // Custom events (plugins can define their own)
  CUSTOM = 'custom'
}

/**
 * Plugin metadata and configuration
 */
export interface PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version (semantic versioning) */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author: string;
  /** Plugin homepage or repository */
  homepage?: string;
  /** License information */
  license?: string;
  /** Keywords for discovery */
  keywords?: string[];
  /** Required platform capabilities */
  platformRequirements?: PlatformType[];
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin configuration schema */
  configSchema?: Record<string, unknown>;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Plugin-specific configuration */
  settings: Record<string, unknown>;
  /** Plugin priority (higher = earlier execution) */
  priority: number;
  /** Whether the plugin should be loaded on startup */
  autoLoad: boolean;
}

/**
 * Plugin interface that all plugins must implement
 */
export interface IDEPlugin {
  /** Plugin metadata */
  readonly metadata: PluginMetadata;
  
  /** Plugin configuration */
  readonly config: PluginConfig;
  
  /**
   * Called when the plugin is loaded
   * @param context - Plugin context with access to IDE services
   */
  initialize(context: PluginContext): Promise<void>;
  
  /**
   * Called when the plugin is unloaded
   */
  cleanup(): Promise<void>;
  
  /**
   * Called when a plugin event occurs
   * @param event - The event that occurred
   * @param data - Event data
   */
  onEvent(event: PluginEvent, data: unknown): void;
  
  /**
   * Gets the plugin's current status
   */
  getStatus(): PluginStatus;
}

/**
 * Plugin context providing access to IDE services
 */
export interface PluginContext {
  /** Platform type */
  platform: PlatformType;
  /** Configuration manager */
  config: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    update: (updates: Record<string, unknown>) => void;
  };
  /** Storage manager */
  storage: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  /** Event emitter for custom events */
  events: {
    emit: (event: string, data: unknown) => void;
    on: (event: string, handler: (data: unknown) => void) => void;
    off: (event: string, handler: (data: unknown) => void) => void;
  };
  /** Performance monitoring */
  performance: {
    recordMetric: (name: string, value: number, type: string) => void;
    timeAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
    timeSync: <T>(name: string, fn: () => T) => T;
  };
  /** Logger */
  logger: {
    debug: (message: string, context?: Record<string, unknown>) => void;
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
  };
}

/**
 * Plugin status information
 */
export interface PluginStatus {
  /** Whether the plugin is currently active */
  active: boolean;
  /** Plugin health status */
  health: 'healthy' | 'degraded' | 'unhealthy';
  /** Last activity timestamp */
  lastActivity: Date;
  /** Error count */
  errorCount: number;
  /** Performance metrics */
  performance: Record<string, number>;
  /** Custom status data */
  custom: Record<string, unknown>;
}

/**
 * Plugin loading result
 */
export interface PluginLoadResult {
  /** Whether the plugin loaded successfully */
  success: boolean;
  /** Plugin instance if successful */
  plugin?: IDEPlugin;
  /** Error message if failed */
  error?: string;
  /** Load time in milliseconds */
  loadTime: number;
}

/**
 * Plugin manager for the Sherlock Omega IDE
 * 
 * Manages the lifecycle of all plugins including:
 * - Loading and unloading plugins
 * - Event broadcasting
 * - Plugin dependency resolution
 * - Plugin health monitoring
 * - Configuration management
 * 
 * @example
 * ```typescript
 * const pluginManager = new PluginManager(PlatformType.WEB);
 * 
 * // Load a plugin
 * const result = await pluginManager.loadPlugin('./plugins/my-plugin.js');
 * 
 * // Broadcast an event
 * pluginManager.broadcast(PluginEvent.USER_ACTION, { action: 'save' });
 * 
 * // Get plugin status
 * const status = pluginManager.getPluginStatus('my-plugin');
 * ```
 */
export class PluginManager {
  private plugins: Map<string, IDEPlugin> = new Map();
  private eventHandlers: Map<PluginEvent, Set<(data: unknown) => void>> = new Map();
  private pluginContexts: Map<string, PluginContext> = new Map();
  private platform: PlatformType;
  private config: PluginManagerConfig;
  private performanceMonitor: any; // Will be injected

  constructor(platform: PlatformType, config?: Partial<PluginManagerConfig>) {
    this.platform = platform;
    this.config = {
      autoLoadPlugins: true,
      pluginDirectory: './plugins',
      maxPlugins: 50,
      enableHotReload: false,
      ...config
    };

    // Initialize event handlers for all events
    Object.values(PluginEvent).forEach(event => {
      this.eventHandlers.set(event, new Set());
    });
  }

  /**
   * Loads a plugin from a file or module
   * @param pluginPath - Path to the plugin file or module
   * @param config - Plugin configuration
   * @returns Plugin load result
   */
  async loadPlugin(pluginPath: string, config?: Partial<PluginConfig>): Promise<PluginLoadResult> {
    const startTime = Date.now();
    
    try {
      // Check if we've reached the maximum number of plugins
      if (this.plugins.size >= this.config.maxPlugins) {
        return {
          success: false,
          error: `Maximum number of plugins (${this.config.maxPlugins}) reached`,
          loadTime: Date.now() - startTime
        };
      }

      // Load the plugin module
      const pluginModule = await this.loadPluginModule(pluginPath);
      
      // Validate plugin structure
      if (!this.validatePlugin(pluginModule)) {
        return {
          success: false,
          error: 'Invalid plugin structure',
          loadTime: Date.now() - startTime
        };
      }

      // Create plugin instance
      const plugin = pluginModule.default || pluginModule;
      
      // Check platform compatibility
      if (!this.isPlatformCompatible(plugin.metadata)) {
        return {
          success: false,
          error: `Plugin not compatible with platform ${this.platform}`,
          loadTime: Date.now() - startTime
        };
      }

      // Check dependencies
      if (!(await this.checkDependencies(plugin.metadata))) {
        return {
          success: false,
          error: 'Plugin dependencies not satisfied',
          loadTime: Date.now() - startTime
        };
      }

      // Create plugin context
      const context = this.createPluginContext(plugin.metadata.id);
      this.pluginContexts.set(plugin.metadata.id, context);

      // Initialize plugin
      await plugin.initialize(context);

      // Store plugin
      this.plugins.set(plugin.metadata.id, plugin);

      // Register event handlers
      this.registerPluginEventHandlers(plugin);

      // Broadcast plugin loaded event
      this.broadcast(PluginEvent.CUSTOM, {
        type: 'plugin_loaded',
        pluginId: plugin.metadata.id,
        pluginName: plugin.metadata.name
      });

      return {
        success: true,
        plugin,
        loadTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime
      };
    }
  }

  /**
   * Unloads a plugin
   * @param pluginId - Plugin identifier
   * @returns Whether the plugin was unloaded successfully
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // Cleanup plugin
      await plugin.cleanup();

      // Remove event handlers
      this.unregisterPluginEventHandlers(plugin);

      // Remove plugin and context
      this.plugins.delete(pluginId);
      this.pluginContexts.delete(pluginId);

      // Broadcast plugin unloaded event
      this.broadcast(PluginEvent.CUSTOM, {
        type: 'plugin_unloaded',
        pluginId,
        pluginName: plugin.metadata.name
      });

      return true;
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Broadcasts an event to all plugins
   * @param event - Event to broadcast
   * @param data - Event data
   */
  broadcast(event: PluginEvent, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in plugin event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Gets a plugin by ID
   * @param pluginId - Plugin identifier
   * @returns Plugin instance or undefined
   */
  getPlugin(pluginId: string): IDEPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Gets all loaded plugins
   * @returns Array of plugin instances
   */
  getAllPlugins(): IDEPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Gets plugin status information
   * @param pluginId - Plugin identifier
   * @returns Plugin status or undefined
   */
  getPluginStatus(pluginId: string): PluginStatus | undefined {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return undefined;

    return plugin.getStatus();
  }

  /**
   * Gets status for all plugins
   * @returns Map of plugin statuses
   */
  getAllPluginStatuses(): Map<string, PluginStatus> {
    const statuses = new Map<string, PluginStatus>();
    
    for (const [id, plugin] of this.plugins) {
      statuses.set(id, plugin.getStatus());
    }
    
    return statuses;
  }

  /**
   * Updates plugin configuration
   * @param pluginId - Plugin identifier
   * @param updates - Configuration updates
   */
  updatePluginConfig(pluginId: string, updates: Partial<PluginConfig>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Update configuration
    Object.assign(plugin.config, updates);

    // Broadcast configuration change
    this.broadcast(PluginEvent.CONFIGURATION_CHANGED, {
      pluginId,
      changes: updates
    });
  }

  /**
   * Enables or disables a plugin
   * @param pluginId - Plugin identifier
   * @param enabled - Whether to enable the plugin
   */
  setPluginEnabled(pluginId: string, enabled: boolean): void {
    this.updatePluginConfig(pluginId, { enabled });
  }

  /**
   * Gets plugin statistics
   * @returns Plugin statistics
   */
  getPluginStats(): {
    total: number;
    enabled: number;
    disabled: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  } {
    const plugins = Array.from(this.plugins.values());
    
    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.config.enabled).length,
      disabled: plugins.filter(p => !p.config.enabled).length,
      healthy: plugins.filter(p => p.getStatus().health === 'healthy').length,
      degraded: plugins.filter(p => p.getStatus().health === 'degraded').length,
      unhealthy: plugins.filter(p => p.getStatus().health === 'unhealthy').length
    };
  }

  /**
   * Reloads all plugins
   */
  async reloadAllPlugins(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys());
    
    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId);
    }
    
    // Reload plugins from configuration
    // This would typically read from a config file
    console.log('All plugins reloaded');
  }

  private async loadPluginModule(pluginPath: string): Promise<any> {
    // In a real implementation, this would load the plugin module
    // For now, we'll return a mock plugin
    return {
      default: {
        metadata: {
          id: 'mock-plugin',
          name: 'Mock Plugin',
          version: '1.0.0',
          description: 'A mock plugin for testing',
          author: 'Test Author'
        },
        config: {
          enabled: true,
          settings: {},
          priority: 1,
          autoLoad: true
        },
        async initialize(context: PluginContext) {
          console.log('Mock plugin initialized');
        },
        async cleanup() {
          console.log('Mock plugin cleaned up');
        },
        onEvent(event: PluginEvent, data: unknown) {
          console.log('Mock plugin received event:', event, data);
        },
        getStatus(): PluginStatus {
          return {
            active: true,
            health: 'healthy',
            lastActivity: new Date(),
            errorCount: 0,
            performance: {},
            custom: {}
          };
        }
      }
    };
  }

  private validatePlugin(pluginModule: any): boolean {
    const plugin = pluginModule.default || pluginModule;
    
    return !!(
      plugin &&
      plugin.metadata &&
      plugin.metadata.id &&
      plugin.metadata.name &&
      plugin.metadata.version &&
      plugin.initialize &&
      plugin.cleanup &&
      plugin.onEvent &&
      plugin.getStatus
    );
  }

  private isPlatformCompatible(metadata: PluginMetadata): boolean {
    if (!metadata.platformRequirements || metadata.platformRequirements.length === 0) {
      return true; // No platform requirements specified
    }
    
    return metadata.platformRequirements.includes(this.platform);
  }

  private async checkDependencies(metadata: PluginMetadata): Promise<boolean> {
    if (!metadata.dependencies || metadata.dependencies.length === 0) {
      return true; // No dependencies
    }
    
    // Check if all required plugins are loaded
    for (const dependency of metadata.dependencies) {
      if (!this.plugins.has(dependency)) {
        return false;
      }
    }
    
    return true;
  }

  private createPluginContext(pluginId: string): PluginContext {
    return {
      platform: this.platform,
      config: {
        get: (key: string) => {
          const plugin = this.plugins.get(pluginId);
          return plugin?.config.settings[key];
        },
        set: (key: string, value: unknown) => {
          const plugin = this.plugins.get(pluginId);
          if (plugin) {
            plugin.config.settings[key] = value;
          }
        },
        update: (updates: Record<string, unknown>) => {
          const plugin = this.plugins.get(pluginId);
          if (plugin) {
            Object.assign(plugin.config.settings, updates);
          }
        }
      },
      storage: {
        get: async <T>(key: string): Promise<T | null> => {
          // In a real implementation, this would use the storage system
          return null;
        },
        set: async <T>(key: string, value: T): Promise<void> => {
          // In a real implementation, this would use the storage system
        },
        delete: async (key: string): Promise<void> => {
          // In a real implementation, this would use the storage system
        }
      },
      events: {
        emit: (event: string, data: unknown) => {
          this.broadcast(PluginEvent.CUSTOM, { type: event, data });
        },
        on: (event: string, handler: (data: unknown) => void) => {
          // In a real implementation, this would register custom event handlers
        },
        off: (event: string, handler: (data: unknown) => void) => {
          // In a real implementation, this would unregister custom event handlers
        }
      },
      performance: {
        recordMetric: (name: string, value: number, type: string) => {
          if (this.performanceMonitor) {
            this.performanceMonitor.recordMetric(name, value, type as any);
          }
        },
        timeAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
          if (this.performanceMonitor) {
            return this.performanceMonitor.timeAsync(name, fn);
          }
          return fn();
        },
        timeSync: <T>(name: string, fn: () => T): T => {
          if (this.performanceMonitor) {
            return this.performanceMonitor.timeSync(name, fn);
          }
          return fn();
        }
      },
      logger: {
        debug: (message: string, context?: Record<string, unknown>) => {
          console.debug(`[Plugin ${pluginId}] ${message}`, context);
        },
        info: (message: string, context?: Record<string, unknown>) => {
          console.info(`[Plugin ${pluginId}] ${message}`, context);
        },
        warn: (message: string, context?: Record<string, unknown>) => {
          console.warn(`[Plugin ${pluginId}] ${message}`, context);
        },
        error: (message: string, context?: Record<string, unknown>) => {
          console.error(`[Plugin ${pluginId}] ${message}`, context);
        }
      }
    };
  }

  private registerPluginEventHandlers(plugin: IDEPlugin): void {
    // In a real implementation, this would register the plugin's event handlers
    // For now, we'll just log that it happened
    console.log(`Registered event handlers for plugin: ${plugin.metadata.name}`);
  }

  private unregisterPluginEventHandlers(plugin: IDEPlugin): void {
    // In a real implementation, this would unregister the plugin's event handlers
    console.log(`Unregistered event handlers for plugin: ${plugin.metadata.name}`);
  }
}

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Whether to automatically load plugins on startup */
  autoLoadPlugins: boolean;
  /** Directory to scan for plugins */
  pluginDirectory: string;
  /** Maximum number of plugins that can be loaded */
  maxPlugins: number;
  /** Whether to enable hot reloading of plugins */
  enableHotReload: boolean;
}
