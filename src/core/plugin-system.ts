/**
 * SHERLOCK Ω PLUGIN SYSTEM
 * 
 * Modular architecture for extending IDE capabilities
 * Supports AI bots, code analyzers, and custom tools
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'ai-bot' | 'code-analyzer' | 'tool' | 'theme' | 'language-support';
  capabilities: string[];
  dependencies: string[];
  config: PluginConfig;
  main: string; // Entry point file
}

export interface PluginConfig {
  permissions: Permission[];
  settings: Record<string, any>;
  ui?: {
    icon?: string;
    position?: 'sidebar' | 'toolbar' | 'panel' | 'modal';
    shortcuts?: string[];
  };
}

export interface Permission {
  type: 'file-read' | 'file-write' | 'network' | 'ai-access' | 'system-commands';
  scope?: string; // File patterns, URLs, etc.
  description: string;
}

export interface PluginContext {
  ide: {
    createFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    openFile: (path: string) => Promise<void>;
    showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void;
  };
  ai: {
    query: (prompt: string, model?: string) => Promise<string>;
    generateCode: (description: string, language?: string) => Promise<string>;
  };
  ui: {
    addPanel: (id: string, title: string, content: HTMLElement) => void;
    addToolbarButton: (id: string, icon: string, callback: () => void) => void;
    showModal: (title: string, content: HTMLElement) => Promise<any>;
  };
}

export abstract class BasePlugin {
  protected context: PluginContext;
  protected config: PluginConfig;

  constructor(context: PluginContext, config: PluginConfig) {
    this.context = context;
    this.config = config;
  }

  abstract activate(): Promise<void>;
  abstract deactivate(): Promise<void>;
  abstract onMessage(message: any): Promise<any>;
}

export class PluginManager {
  private plugins = new Map<string, BasePlugin>();
  private pluginConfigs = new Map<string, Plugin>();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * Install a plugin from configuration
   */
  async installPlugin(pluginConfig: Plugin): Promise<void> {
    try {
      // Validate plugin
      this.validatePlugin(pluginConfig);
      
      // Check permissions
      await this.requestPermissions(pluginConfig);
      
      // Load plugin code
      const PluginClass = await this.loadPluginClass(pluginConfig);
      
      // Create instance
      const plugin = new PluginClass(this.context, pluginConfig.config);
      
      // Activate plugin
      await plugin.activate();
      
      // Store plugin
      this.plugins.set(pluginConfig.id, plugin);
      this.pluginConfigs.set(pluginConfig.id, pluginConfig);
      
      console.log(`✅ Plugin installed: ${pluginConfig.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to install plugin ${pluginConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      await plugin.deactivate();
      this.plugins.delete(pluginId);
      this.pluginConfigs.delete(pluginId);
      console.log(`🗑️ Plugin uninstalled: ${pluginId}`);
    }
  }

  /**
   * Get all installed plugins
   */
  getInstalledPlugins(): Plugin[] {
    return Array.from(this.pluginConfigs.values());
  }

  /**
   * Send message to plugin
   */
  async sendMessageToPlugin(pluginId: string, message: any): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      return await plugin.onMessage(message);
    }
    throw new Error(`Plugin not found: ${pluginId}`);
  }

  /**
   * Validate plugin configuration
   */
  private validatePlugin(plugin: Plugin): void {
    const required = ['id', 'name', 'version', 'type', 'main'];
    for (const field of required) {
      if (!plugin[field]) {
        throw new Error(`Plugin missing required field: ${field}`);
      }
    }
  }

  /**
   * Request user permission for plugin
   */
  private async requestPermissions(plugin: Plugin): Promise<void> {
    if (plugin.config.permissions.length === 0) return;
    
    // In a real implementation, this would show a permission dialog
    console.log(`🔐 Plugin ${plugin.name} requests permissions:`, plugin.config.permissions);
  }

  /**
   * Load plugin class dynamically
   */
  private async loadPluginClass(plugin: Plugin): Promise<typeof BasePlugin> {
    // In a real implementation, this would load the plugin code
    // For now, return a mock class
    return class MockPlugin extends BasePlugin {
      async activate() {
        console.log(`🚀 Activating ${plugin.name}`);
      }
      
      async deactivate() {
        console.log(`🛑 Deactivating ${plugin.name}`);
      }
      
      async onMessage(message: any) {
        return { status: 'ok', plugin: plugin.name, message };
      }
    };
  }
}

/**
 * Built-in AI Bot Plugin Template
 */
export class AIBotPlugin extends BasePlugin {
  private botName: string;
  private botPrompt: string;
  private model: string;

  constructor(context: PluginContext, config: PluginConfig & {
    botName: string;
    botPrompt: string;
    model?: string;
  }) {
    super(context, config);
    this.botName = config.botName;
    this.botPrompt = config.botPrompt;
    this.model = config.model || 'anthropic/claude-3-haiku';
  }

  async activate(): Promise<void> {
    // Add bot to UI
    this.context.ui.addPanel(
      `bot-${this.botName.toLowerCase()}`,
      `🤖 ${this.botName}`,
      this.createBotUI()
    );
  }

  async deactivate(): Promise<void> {
    // Remove bot from UI
    console.log(`Deactivating bot: ${this.botName}`);
  }

  async onMessage(message: any): Promise<any> {
    if (message.type === 'chat') {
      const response = await this.context.ai.query(
        `${this.botPrompt}\n\nUser: ${message.content}`,
        this.model
      );
      return { type: 'response', content: response };
    }
    return { type: 'error', content: 'Unknown message type' };
  }

  private createBotUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bot-container p-4';
    container.innerHTML = `
      <div class="bot-header mb-4">
        <h3 class="font-semibold">${this.botName}</h3>
        <p class="text-sm text-gray-400">Specialized AI assistant</p>
      </div>
      <div class="bot-chat flex-1 overflow-y-auto mb-4" style="height: 300px;">
        <div class="bot-message bg-gray-700 rounded p-3 mb-2">
          <p class="text-sm">Hello! I'm ${this.botName}. How can I help you today?</p>
        </div>
      </div>
      <div class="bot-input flex space-x-2">
        <input type="text" class="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm" placeholder="Ask ${this.botName}...">
        <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Send</button>
      </div>
    `;
    return container;
  }
}