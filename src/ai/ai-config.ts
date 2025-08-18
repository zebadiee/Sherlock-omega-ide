/**
 * SHERLOCK Ω AI CONFIGURATION
 * 
 * Manages API keys, model selection, and AI behavior settings
 */

export interface AIConfig {
  openRouter: {
    apiKey: string;
    enabled: boolean;
  };
  models: {
    chat: string;
    codeGeneration: string;
    codeReview: string;
    debugging: string;
    explanation: string;
  };
  behavior: {
    autoImplement: boolean;
    safetyChecks: boolean;
    maxTokens: number;
    temperature: number;
    confidenceThreshold: number;
  };
  safety: {
    blockUnsafeCode: boolean;
    requireTests: boolean;
    validateSyntax: boolean;
    scanForVulnerabilities: boolean;
  };
}

export class AIConfigManager {
  private config: AIConfig;
  private readonly STORAGE_KEY = 'sherlock-omega-ai-config';

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from localStorage or use defaults
   */
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultConfig(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load AI config from storage:', error);
    }

    return this.getDefaultConfig();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AIConfig {
    return {
      openRouter: {
        apiKey: '',
        enabled: false
      },
      models: {
        chat: 'anthropic/claude-3-haiku',
        codeGeneration: 'anthropic/claude-3-sonnet',
        codeReview: 'openai/gpt-4-turbo',
        debugging: 'anthropic/claude-3-sonnet',
        explanation: 'anthropic/claude-3-haiku'
      },
      behavior: {
        autoImplement: true,
        safetyChecks: true,
        maxTokens: 4000,
        temperature: 0.7,
        confidenceThreshold: 0.8
      },
      safety: {
        blockUnsafeCode: true,
        requireTests: true,
        validateSyntax: true,
        scanForVulnerabilities: true
      }
    };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Set OpenRouter API key
   */
  setOpenRouterKey(apiKey: string): void {
    this.config.openRouter.apiKey = apiKey;
    this.config.openRouter.enabled = !!apiKey;
    this.saveConfig();
  }

  /**
   * Check if AI is properly configured
   */
  isConfigured(): boolean {
    return this.config.openRouter.enabled && !!this.config.openRouter.apiKey;
  }

  /**
   * Get model for specific task
   */
  getModelForTask(task: string): string {
    return this.config.models[task] || this.config.models.chat;
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.openRouter.apiKey && this.config.openRouter.enabled) {
      errors.push('OpenRouter API key is required when OpenRouter is enabled');
    }

    if (this.config.behavior.maxTokens < 100 || this.config.behavior.maxTokens > 8000) {
      errors.push('Max tokens must be between 100 and 8000');
    }

    if (this.config.behavior.temperature < 0 || this.config.behavior.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (this.config.behavior.confidenceThreshold < 0 || this.config.behavior.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
  }

  /**
   * Export configuration
   */
  exportConfig(): string {
    const exportData = { ...this.config };
    // Remove sensitive data
    exportData.openRouter.apiKey = '';
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration
   */
  importConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const imported = JSON.parse(configJson);
      const validation = this.validateConfig();
      
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      this.config = { ...this.getDefaultConfig(), ...imported };
      this.saveConfig();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid configuration format' };
    }
  }
}

// Global configuration instance
export const aiConfig = new AIConfigManager();