import { PlatformType } from '../core/whispering-interfaces';

/**
 * Configuration interface for the Sherlock Omega IDE.
 * All settings are environment-aware and can be customized per platform.
 */
export interface IDEConfig {
  /** General IDE settings */
  general: GeneralConfig;
  /** Platform-specific settings */
  platform: PlatformConfig;
  /** Observer and analysis settings */
  observers: ObserverConfig;
  /** Evolution and learning settings */
  evolution: EvolutionConfig;
  /** Security and ethical settings */
  security: SecurityConfig;
  /** Performance and resource settings */
  performance: PerformanceConfig;
}

export interface GeneralConfig {
  /** IDE name and version */
  name: string;
  version: string;
  /** Theme and appearance */
  theme: 'light' | 'dark' | 'auto';
  /** Language and localization */
  language: string;
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  /** Maximum file size for analysis (bytes) */
  maxFileSize: number;
}

export interface PlatformConfig {
  /** Current platform type */
  type: PlatformType;
  /** Platform-specific features */
  features: string[];
  /** Storage configuration */
  storage: StorageConfig;
  /** Network configuration */
  network: NetworkConfig;
}

export interface StorageConfig {
  /** Storage type for this platform */
  type: 'localStorage' | 'indexedDB' | 'filesystem' | 'database';
  /** Maximum storage size in bytes */
  maxSize: number;
  /** Storage encryption enabled */
  encrypted: boolean;
  /** Backup frequency in milliseconds */
  backupInterval: number;
}

export interface NetworkConfig {
  /** Network requests enabled */
  enabled: boolean;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Retry attempts for failed requests */
  retryAttempts: number;
  /** Rate limiting (requests per minute) */
  rateLimit: number;
}

export interface ObserverConfig {
  /** Observer sensitivity level */
  sensitivity: 'minimal' | 'low' | 'medium' | 'high' | 'maximum';
  /** Analysis frequency */
  frequency: 'real-time' | 'high' | 'medium' | 'low' | 'on-demand';
  /** Maximum concurrent observers */
  maxConcurrent: number;
  /** Observer timeout in milliseconds */
  timeout: number;
  /** Enable background processing */
  backgroundProcessing: boolean;
}

export interface EvolutionConfig {
  /** Evolution cycles enabled */
  enabled: boolean;
  /** Evolution cycle interval in milliseconds */
  cycleInterval: number;
  /** Learning rate for adaptations */
  learningRate: number;
  /** Maximum evolution iterations */
  maxIterations: number;
  /** Enable autonomous improvements */
  autonomousImprovements: boolean;
}

export interface SecurityConfig {
  /** Input validation enabled */
  inputValidation: boolean;
  /** Code execution sandboxing */
  sandboxing: boolean;
  /** Secure storage for credentials */
  secureStorage: boolean;
  /** Audit logging enabled */
  auditLogging: boolean;
}

export interface PerformanceConfig {
  /** Memory usage limit in bytes */
  memoryLimit: number;
  /** CPU usage limit (0-1) */
  cpuLimit: number;
  /** Enable performance monitoring */
  monitoring: boolean;
  /** Performance optimization level */
  optimizationLevel: 'none' | 'basic' | 'aggressive';
}

/**
 * Default configuration for the Sherlock Omega IDE.
 * This configuration is environment-aware and will be adjusted based on the platform.
 */
export function getDefaultConfig(platform: PlatformType): IDEConfig {
  const isWeb = platform === PlatformType.WEB;
  const isDesktop = platform === PlatformType.DESKTOP;
  
  return {
    general: {
      name: 'Sherlock Omega IDE',
      version: '1.0.0',
      theme: 'auto',
      language: 'en',
      autoSaveInterval: isWeb ? 30000 : 10000, // 30s web, 10s desktop
      maxFileSize: isWeb ? 1024 * 1024 : 100 * 1024 * 1024 // 1MB web, 100MB desktop
    },
    platform: {
      type: platform,
      features: isWeb 
        ? ['web_workers', 'local_storage', 'service_workers']
        : ['filesystem', 'child_processes', 'native_apis'],
      storage: {
        type: isWeb ? 'localStorage' : 'filesystem',
        maxSize: isWeb ? 50 * 1024 * 1024 : 1024 * 1024 * 1024, // 50MB web, 1GB desktop
        encrypted: false,
        backupInterval: 24 * 60 * 60 * 1000 // 24 hours
      },
      network: {
        enabled: true,
        timeout: 10000,
        retryAttempts: 3,
        rateLimit: isWeb ? 60 : 120 // 60/min web, 120/min desktop
      }
    },
    observers: {
      sensitivity: 'medium',
      frequency: 'real-time',
      maxConcurrent: isWeb ? 5 : 10,
      timeout: 30000,
      backgroundProcessing: isWeb ? false : true
    },
    evolution: {
      enabled: true,
      cycleInterval: 30 * 60 * 1000, // 30 minutes
      learningRate: 0.1,
      maxIterations: 1000,
      autonomousImprovements: true
    },
    security: {
      inputValidation: true,
      sandboxing: isWeb ? true : false,
      secureStorage: true,
      auditLogging: true
    },
    performance: {
      memoryLimit: isWeb ? 256 * 1024 * 1024 : 1024 * 1024 * 1024, // 256MB web, 1GB desktop
      cpuLimit: 0.8,
      monitoring: true,
      optimizationLevel: 'basic'
    }
  };
}

/**
 * Configuration manager for the Sherlock Omega IDE.
 * Handles loading, saving, and updating configuration settings.
 */
export class ConfigurationManager {
  private config: IDEConfig;
  private platform: PlatformType;

  constructor(platform: PlatformType) {
    this.platform = platform;
    this.config = getDefaultConfig(platform);
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): IDEConfig {
    return { ...this.config };
  }

  /**
   * Updates a specific configuration section.
   * @param section - The configuration section to update
   * @param updates - Partial updates for the section
   */
  updateConfig<K extends keyof IDEConfig>(
    section: K, 
    updates: Partial<IDEConfig[K]>
  ): void {
    this.config[section] = { ...this.config[section], ...updates };
  }

  /**
   * Gets a specific configuration value using dot notation.
   * @param path - Dot notation path to the configuration value
   * @returns The configuration value or undefined if not found
   */
  getConfigValue(path: string): unknown {
    return path.split('.').reduce((obj, key) => {
      return obj && typeof obj === 'object' ? (obj as any)[key] : undefined;
    }, this.config as any);
  }

  /**
   * Sets a specific configuration value using dot notation.
   * @param path - Dot notation path to the configuration value
   * @param value - The value to set
   */
  setConfigValue(path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const obj = keys.reduce((obj, key) => {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      return obj[key];
    }, this.config as any);
    
    obj[lastKey] = value;
  }

  /**
   * Resets the configuration to default values.
   */
  resetToDefaults(): void {
    this.config = getDefaultConfig(this.platform);
  }

  /**
   * Validates the current configuration.
   * @returns Array of validation errors, empty if valid
   */
  validateConfig(): string[] {
    const errors: string[] = [];
    
    if (this.config.general.autoSaveInterval < 1000) {
      errors.push('Auto-save interval must be at least 1000ms');
    }
    
    if (this.config.evolution.learningRate <= 0 || this.config.evolution.learningRate > 1) {
      errors.push('Learning rate must be between 0 and 1');
    }
    
    if (this.config.performance.memoryLimit <= 0) {
      errors.push('Memory limit must be positive');
    }
    
    return errors;
  }
}
