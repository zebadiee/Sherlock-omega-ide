import { EnhancedPluginSystem, BotTemplate, AIBot, BotCapability } from '../core/enhanced-plugin-system';

export interface BotBuilderStep {
  id: string;
  title: string;
  description: string;
  component: string;
  validation?: (data: any) => string | null;
}

export interface BotBuilderConfig {
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  customPrompts: Record<string, string>;
  configuration: Record<string, any>;
  template?: string;
}

export class AIBotBuilder {
  private pluginSystem: EnhancedPluginSystem;
  private currentStep = 0;
  private config: Partial<BotBuilderConfig> = {};

  private steps: BotBuilderStep[] = [
    {
      id: 'template-selection',
      title: 'Choose Template',
      description: 'Select a template or start from scratch',
      component: 'TemplateSelector'
    },
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Name and describe your bot',
      component: 'BasicInfoForm',
      validation: (data) => {
        if (!data.name?.trim()) return 'Bot name is required';
        if (data.name.length < 3) return 'Bot name must be at least 3 characters';
        return null;
      }
    },
    {
      id: 'capabilities',
      title: 'Select Capabilities',
      description: 'Choose what your bot can do',
      component: 'CapabilitySelector',
      validation: (data) => {
        if (!data.capabilities?.length) return 'At least one capability is required';
        return null;
      }
    },
    {
      id: 'prompts',
      title: 'Customize Prompts',
      description: 'Define how your bot communicates',
      component: 'PromptEditor'
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Set up bot parameters',
      component: 'ConfigurationForm'
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review your bot configuration',
      component: 'ReviewStep'
    }
  ];

  constructor(pluginSystem: EnhancedPluginSystem) {
    this.pluginSystem = pluginSystem;
  }

  // Wizard Navigation
  getCurrentStep(): BotBuilderStep {
    return this.steps[this.currentStep];
  }

  getSteps(): BotBuilderStep[] {
    return this.steps;
  }

  canGoNext(): boolean {
    const step = this.getCurrentStep();
    if (step.validation) {
      return step.validation(this.config) === null;
    }
    return true;
  }

  canGoPrevious(): boolean {
    return this.currentStep > 0;
  }

  nextStep(): boolean {
    if (this.canGoNext() && this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    if (this.canGoPrevious()) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  // Configuration Management
  updateConfig(updates: Partial<BotBuilderConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): Partial<BotBuilderConfig> {
    return { ...this.config };
  }

  resetConfig(): void {
    this.config = {};
    this.currentStep = 0;
  }

  // Template Operations
  getAvailableTemplates(): BotTemplate[] {
    return this.pluginSystem.getBotTemplates();
  }

  getTemplatesByCategory(category: string): BotTemplate[] {
    return this.pluginSystem.getBotTemplatesByCategory(category);
  }

  selectTemplate(templateId: string): void {
    const template = this.getAvailableTemplates().find(t => t.id === templateId);
    if (template) {
      this.config = {
        ...this.config,
        template: templateId,
        category: template.category,
        capabilities: template.capabilities.map(c => c.id),
        customPrompts: { ...template.promptTemplates },
        configuration: { ...template.configuration }
      };
    }
  }

  // Capability Management
  getAvailableCapabilities(): BotCapability[] {
    const allTemplates = this.getAvailableTemplates();
    const capabilities = new Map<string, BotCapability>();
    
    for (const template of allTemplates) {
      for (const capability of template.capabilities) {
        capabilities.set(capability.id, capability);
      }
    }
    
    return Array.from(capabilities.values());
  }

  getCapabilitiesByCategory(category: string): BotCapability[] {
    return this.getAvailableCapabilities().filter(c => c.category === category);
  }

  // Bot Creation
  async createBot(): Promise<AIBot> {
    if (!this.isConfigValid()) {
      throw new Error('Invalid bot configuration');
    }

    const config = this.config as BotBuilderConfig;
    
    // If using a template, create from template
    if (config.template) {
      return await this.pluginSystem.createBot(config.template, {
        name: config.name,
        description: config.description,
        customConfig: config.configuration
      });
    }
    
    // Otherwise, create custom bot
    return await this.createCustomBot(config);
  }

  private async createCustomBot(config: BotBuilderConfig): Promise<AIBot> {
    // Create a custom template
    const customTemplate: BotTemplate = {
      id: `custom_${Date.now()}`,
      name: `${config.name} Template`,
      description: config.description,
      category: config.category,
      capabilities: this.getSelectedCapabilities(config.capabilities),
      promptTemplates: config.customPrompts,
      codeScaffolding: this.generateCodeScaffolding(config),
      configuration: config.configuration
    };

    // Register the template temporarily
    const pluginSystem = this.pluginSystem as any;
    pluginSystem.botTemplates.set(customTemplate.id, customTemplate);

    // Create bot from custom template
    return await this.pluginSystem.createBot(customTemplate.id, {
      name: config.name,
      description: config.description,
      customConfig: config.configuration
    });
  }

  private getSelectedCapabilities(capabilityIds: string[]): BotCapability[] {
    const allCapabilities = this.getAvailableCapabilities();
    return allCapabilities.filter(c => capabilityIds.includes(c.id));
  }

  private generateCodeScaffolding(config: BotBuilderConfig): any {
    return {
      files: [
        {
          path: 'bots/{{bot.id}}/index.ts',
          content: this.generateBotCode(config),
          template: true
        },
        {
          path: 'bots/{{bot.id}}/config.json',
          content: JSON.stringify(config.configuration, null, 2),
          template: false
        }
      ],
      dependencies: ['@types/node', 'rxjs']
    };
  }

  private generateBotCode(config: BotBuilderConfig): string {
    const capabilities = this.getSelectedCapabilities(config.capabilities);
    
    return `// Generated Bot: {{bot.name}}
// Description: {{bot.description}}
// Created: ${new Date().toISOString()}

export class {{bot.name}}Bot {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  // Bot capabilities
${capabilities.map(cap => this.generateCapabilityMethod(cap)).join('\n\n')}

  // Custom prompts
${Object.entries(config.customPrompts || {}).map(([key, prompt]) => 
  `  private get${key.charAt(0).toUpperCase() + key.slice(1)}Prompt(): string {
    return \`${prompt}\`;
  }`
).join('\n\n')}

  async processRequest(request: string, context?: any): Promise<string> {
    // Main bot processing logic
    console.log('Processing request:', request);
    return 'Bot response placeholder';
  }
}`;
  }

  private generateCapabilityMethod(capability: BotCapability): string {
    const methodName = capability.id.replace(/-/g, '');
    return `  // ${capability.name}: ${capability.description}
  async ${methodName}(input: any): Promise<any> {
    // Implementation for ${capability.name}
    console.log('Executing ${capability.name}:', input);
    return null;
  }`;
  }

  private isConfigValid(): boolean {
    const config = this.config;
    return !!(
      config.name?.trim() &&
      config.description?.trim() &&
      config.category &&
      config.capabilities?.length
    );
  }

  // Validation helpers
  validateStep(stepId: string, data: any): string | null {
    const step = this.steps.find(s => s.id === stepId);
    if (step?.validation) {
      return step.validation(data);
    }
    return null;
  }

  // Export/Import configurations
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      this.config = config;
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }

  // Preset configurations
  getPresetConfigurations(): Array<{ name: string; config: Partial<BotBuilderConfig> }> {
    return [
      {
        name: 'Code Assistant',
        config: {
          category: 'code-generation',
          capabilities: ['generate-function', 'explain-code', 'refactor-code'],
          customPrompts: {
            generate: 'Generate clean, well-documented code for: {{request}}',
            explain: 'Explain this code in simple terms: {{code}}',
            refactor: 'Refactor this code for better readability: {{code}}'
          },
          configuration: {
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1500
          }
        }
      },
      {
        name: 'Test Generator',
        config: {
          category: 'testing',
          capabilities: ['generate-tests', 'analyze-coverage'],
          customPrompts: {
            generateTests: 'Generate comprehensive unit tests for: {{code}}',
            analyzeCoverage: 'Analyze test coverage and suggest improvements for: {{testSuite}}'
          },
          configuration: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 2000,
            testFramework: 'jest'
          }
        }
      },
      {
        name: 'Documentation Bot',
        config: {
          category: 'documentation',
          capabilities: ['generate-docs', 'update-readme'],
          customPrompts: {
            generateDocs: 'Generate comprehensive documentation for: {{code}}',
            updateReadme: 'Update README.md with: {{changes}}'
          },
          configuration: {
            model: 'gpt-4',
            temperature: 0.4,
            maxTokens: 2500,
            format: 'markdown'
          }
        }
      }
    ];
  }

  applyPreset(presetName: string): void {
    const preset = this.getPresetConfigurations().find(p => p.name === presetName);
    if (preset) {
      this.updateConfig(preset.config);
    }
  }
}