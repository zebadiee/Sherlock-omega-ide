import * as monaco from 'monaco-editor';
import { IDEPlugin, PluginMetadata, PluginConfig, PluginContext, PluginStatus, PluginEvent } from './plugin-system';
import { PlatformType } from '../core/whispering-interfaces';

/**
 * Monaco Editor configuration options
 */
export interface MonacoEditorConfig {
  /** Theme to use */
  theme: 'vs' | 'vs-dark' | 'hc-black';
  /** Language to use */
  language: string;
  /** Whether to enable minimap */
  minimap: boolean;
  /** Whether to enable line numbers */
  lineNumbers: boolean;
  /** Whether to enable word wrap */
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  /** Font size */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Tab size */
  tabSize: number;
  /** Whether to insert spaces instead of tabs */
  insertSpaces: boolean;
  /** Whether to enable auto save */
  autoSave: boolean;
  /** Auto save interval in milliseconds */
  autoSaveInterval: number;
}

/**
 * Monaco Editor instance wrapper
 */
export interface MonacoEditorInstance {
  /** Monaco editor instance */
  editor: monaco.editor.IStandaloneCodeEditor;
  /** Container element */
  container: any; // Using any for cross-platform compatibility
  /** Current content */
  content: string;
  /** Current language */
  language: string;
  /** Whether the content has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Monaco Editor Plugin for Sherlock Omega IDE
 * 
 * Provides professional code editing capabilities with:
 * - Syntax highlighting for 100+ languages
 * - IntelliSense and autocompletion
 * - Error detection and validation
 * - Multiple themes and customization
 * - Auto-save and file management
 * - Performance optimization
 */
export class MonacoEditorPlugin implements IDEPlugin {
  readonly metadata: PluginMetadata = {
    id: 'monaco-editor',
    name: 'Monaco Editor',
    version: '1.0.0',
    description: 'Professional code editor with syntax highlighting, IntelliSense, and advanced features',
    author: 'Sherlock Omega IDE Team',
    homepage: 'https://microsoft.github.io/monaco-editor/',
    license: 'MIT',
    keywords: ['editor', 'code', 'syntax-highlighting', 'intellisense'],
    platformRequirements: [PlatformType.WEB, PlatformType.DESKTOP],
    dependencies: []
  };

  readonly config: PluginConfig = {
    enabled: true,
    settings: {
      theme: 'vs-dark',
      language: 'typescript',
      minimap: true,
      lineNumbers: true,
      wordWrap: 'on',
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      tabSize: 2,
      insertSpaces: true,
      autoSave: true,
      autoSaveInterval: 30000
    },
    priority: 10,
    autoLoad: true
  };

  private context?: PluginContext;
  private editors: Map<string, MonacoEditorInstance> = new Map();
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private performanceMonitor?: any;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.performanceMonitor = context.performance;
    
    // Initialize Monaco editor
    await this.initializeMonaco();
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.context.logger.info('Monaco Editor plugin initialized successfully');
  }

  async cleanup(): Promise<void> {
    // Clean up all editors
    for (const [id, instance] of this.editors) {
      this.destroyEditor(id);
    }
    
    // Clear auto-save timers
    for (const timer of this.autoSaveTimers.values()) {
      clearTimeout(timer);
    }
    
    this.context?.logger.info('Monaco Editor plugin cleaned up');
  }

  onEvent(event: PluginEvent, data: unknown): void {
    switch (event) {
      case PluginEvent.FILE_OPENED:
        this.handleFileOpened(data as { filePath: string; content: string; language?: string });
        break;
      case PluginEvent.CODE_CHANGED:
        this.handleCodeChanged(data as { filePath: string; content: string });
        break;
      case PluginEvent.USER_ACTION:
        this.handleUserAction(data as { action: string; context: unknown });
        break;
    }
  }

  getStatus(): PluginStatus {
    return {
      active: this.config.enabled,
      health: this.editors.size > 0 ? 'healthy' : 'degraded',
      lastActivity: new Date(),
      errorCount: 0,
      performance: {
        activeEditors: this.editors.size,
        totalMemory: this.getTotalMemoryUsage(),
        averageResponseTime: this.getAverageResponseTime()
      },
      custom: {
        supportedLanguages: this.getSupportedLanguages(),
        activeThemes: this.getActiveThemes(),
        editorCount: this.editors.size
      }
    };
  }

  /**
   * Creates a new Monaco editor instance
   * @param containerId - HTML element ID to mount the editor
   * @param options - Editor configuration options
   * @returns Editor instance ID
   */
  createEditor(containerId: string, options?: Partial<MonacoEditorConfig>): string {
    try {
      // Cross-platform container resolution
      const container = (typeof globalThis !== 'undefined' && (globalThis as any).document) 
        ? (globalThis as any).document.getElementById(containerId) 
        : null;
      if (!container) {
        throw new Error(`Container element with ID '${containerId}' not found`);
      }

      const config = { ...this.getDefaultConfig(), ...options };
      const editorId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Monaco editor instance
      const editor = monaco.editor.create(container, {
        value: '',
        language: config.language,
        theme: config.theme,
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        tabSize: config.tabSize,
        insertSpaces: config.insertSpaces,
        minimap: { enabled: config.minimap },
        lineNumbers: config.lineNumbers ? 'on' : 'off',
        wordWrap: config.wordWrap,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        selectOnLineNumbers: true,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: true,
          horizontalHasArrows: true,
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 17,
          horizontalScrollbarSize: 17,
          arrowSize: 30
        }
      });

      // Create editor instance wrapper
      const instance: MonacoEditorInstance = {
        editor,
        container,
        content: '',
        language: config.language,
        hasUnsavedChanges: false
      };

      this.editors.set(editorId, instance);

      // Set up editor event listeners
      this.setupEditorEventListeners(editorId, instance);

      // Set up auto-save if enabled
      if (config.autoSave) {
        this.setupAutoSave(editorId, config.autoSaveInterval);
      }

      this.context?.logger.info(`Monaco editor created: ${editorId}`);
      return editorId;

    } catch (error) {
      this.context?.logger.error('Failed to create Monaco editor', { containerId, error });
      throw error;
    }
  }

  /**
   * Gets an editor instance by ID
   * @param editorId - Editor instance ID
   * @returns Editor instance or undefined
   */
  getEditor(editorId: string): MonacoEditorInstance | undefined {
    return this.editors.get(editorId);
  }

  /**
   * Sets content for an editor
   * @param editorId - Editor instance ID
   * @param content - Content to set
   * @param language - Language for syntax highlighting
   */
  setContent(editorId: string, content: string, language?: string): void {
    const instance = this.editors.get(editorId);
    if (!instance) {
      throw new Error(`Editor with ID '${editorId}' not found`);
    }

    instance.content = content;
    instance.language = language || instance.language;
    
    // Update Monaco editor
    monaco.editor.setModelLanguage(instance.editor.getModel()!, instance.language);
    instance.editor.setValue(content);
    instance.hasUnsavedChanges = false;

    this.context?.logger.debug('Editor content updated', { editorId, contentLength: content.length, language: instance.language });
  }

  /**
   * Gets content from an editor
   * @param editorId - Editor instance ID
   * @returns Current content
   */
  getContent(editorId: string): string {
    const instance = this.editors.get(editorId);
    if (!instance) {
      throw new Error(`Editor with ID '${editorId}' not found`);
    }

    return instance.editor.getValue();
  }

  /**
   * Changes the theme of an editor
   * @param editorId - Editor instance ID
   * @param theme - New theme
   */
  changeTheme(editorId: string, theme: 'vs' | 'vs-dark' | 'hc-black'): void {
    const instance = this.editors.get(editorId);
    if (!instance) {
      throw new Error(`Editor with ID '${editorId}' not found`);
    }

    monaco.editor.setTheme(theme);
    this.context?.logger.debug('Editor theme changed', { editorId, theme });
  }

  /**
   * Destroys an editor instance
   * @param editorId - Editor instance ID
   */
  destroyEditor(editorId: string): void {
    const instance = this.editors.get(editorId);
    if (!instance) return;

    // Clear auto-save timer
    const timer = this.autoSaveTimers.get(editorId);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(editorId);
    }

    // Dispose Monaco editor
    instance.editor.dispose();
    
    // Remove from tracking
    this.editors.delete(editorId);

    this.context?.logger.info(`Monaco editor destroyed: ${editorId}`);
  }

  /**
   * Gets all supported languages
   * @returns Array of supported language IDs
   */
  getSupportedLanguages(): string[] {
    return monaco.languages.getLanguages().map(lang => lang.id);
  }

  /**
   * Gets available themes
   * @returns Array of available themes
   */
  getAvailableThemes(): string[] {
    return ['vs', 'vs-dark', 'hc-black'];
  }

  private async initializeMonaco(): Promise<void> {
    // Monaco is already initialized when the script loads
    // We can add custom language configurations here if needed
    
    // Configure TypeScript/JavaScript
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });

    // Configure JSON
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true
    });

    this.context?.logger.debug('Monaco editor initialized with custom configurations');
  }

  private setupEventListeners(): void {
    // Listen for file operations
    this.context?.events.on('file_opened', (data: any) => {
      this.handleFileOpened(data);
    });

    this.context?.events.on('code_changed', (data: any) => {
      this.handleCodeChanged(data);
    });
  }

  private setupEditorEventListeners(editorId: string, instance: MonacoEditorInstance): void {
    // Content change events
    instance.editor.onDidChangeModelContent(() => {
      instance.hasUnsavedChanges = true;
      instance.content = instance.editor.getValue();
      
      this.context?.events.emit('editor_content_changed', {
        editorId,
        content: instance.content,
        hasUnsavedChanges: true
      });
    });

    // Focus events
    instance.editor.onDidFocusEditorWidget(() => {
      this.context?.events.emit('editor_focused', { editorId });
    });

    // Blur events
    instance.editor.onDidBlurEditorWidget(() => {
      this.context?.events.emit('editor_blurred', { editorId });
    });

    // Cursor position changes
    instance.editor.onDidChangeCursorPosition((e) => {
      this.context?.events.emit('cursor_position_changed', {
        editorId,
        position: e.position,
        lineNumber: e.position.lineNumber,
        column: e.position.column
      });
    });
  }

  private setupAutoSave(editorId: string, interval: number): void {
    const timer = setInterval(() => {
      const instance = this.editors.get(editorId);
      if (instance && instance.hasUnsavedChanges) {
        this.autoSave(editorId);
      }
    }, interval);

    this.autoSaveTimers.set(editorId, timer);
  }

  private async autoSave(editorId: string): Promise<void> {
    const instance = this.editors.get(editorId);
    if (!instance) return;

    try {
      const content = instance.editor.getValue();
      
      // Emit auto-save event
      this.context?.events.emit('editor_auto_saved', {
        editorId,
        content,
        timestamp: new Date()
      });

      instance.hasUnsavedChanges = false;
      this.context?.logger.debug('Editor auto-saved', { editorId });

    } catch (error) {
      this.context?.logger.error('Auto-save failed', { editorId, error });
    }
  }

  private handleFileOpened(data: { filePath: string; content: string; language?: string }): void {
    // Find an available editor or create a new one
    const editorId = this.findAvailableEditor() || this.createEditor('editor-container');
    
    if (editorId) {
      this.setContent(editorId, data.content, data.language);
      
      this.context?.logger.info('File opened in editor', { 
        filePath: data.filePath, 
        editorId,
        contentLength: data.content.length 
      });
    }
  }

  private handleCodeChanged(data: { filePath: string; content: string }): void {
    // Update all editors that might be showing this file
    for (const [editorId, instance] of this.editors) {
      // In a real implementation, you'd track which file each editor is showing
      // For now, we'll update the first editor we find
      this.setContent(editorId, data.content);
      break;
    }
  }

  private handleUserAction(data: { action: string; context: unknown }): void {
    switch (data.action) {
      case 'save':
        this.saveAllEditors();
        break;
      case 'undo':
        this.undoAllEditors();
        break;
      case 'redo':
        this.redoAllEditors();
        break;
    }
  }

  private findAvailableEditor(): string | null {
    for (const [id, instance] of this.editors) {
      if (!instance.hasUnsavedChanges) {
        return id;
      }
    }
    return null;
  }

  private saveAllEditors(): void {
    for (const [editorId, instance] of this.editors) {
      if (instance.hasUnsavedChanges) {
        this.autoSave(editorId);
      }
    }
  }

  private undoAllEditors(): void {
    for (const [editorId, instance] of this.editors) {
      instance.editor.trigger('keyboard', 'undo', {});
    }
  }

  private redoAllEditors(): void {
    for (const [editorId, instance] of this.editors) {
      instance.editor.trigger('keyboard', 'redo', {});
    }
  }

  private getDefaultConfig(): MonacoEditorConfig {
    return {
      theme: this.config.settings.theme as any,
      language: this.config.settings.language as string,
      minimap: this.config.settings.minimap as boolean,
      lineNumbers: this.config.settings.lineNumbers as boolean,
      wordWrap: this.config.settings.wordWrap as any,
      fontSize: this.config.settings.fontSize as number,
      fontFamily: this.config.settings.fontFamily as string,
      tabSize: this.config.settings.tabSize as number,
      insertSpaces: this.config.settings.insertSpaces as boolean,
      autoSave: this.config.settings.autoSave as boolean,
      autoSaveInterval: this.config.settings.autoSaveInterval as number
    };
  }

  private getTotalMemoryUsage(): number {
    let total = 0;
    for (const instance of this.editors.values()) {
      // Estimate memory usage based on content length
      total += instance.content.length * 2; // Rough estimate: 2 bytes per character
    }
    return total;
  }

  private getAverageResponseTime(): number {
    // In a real implementation, this would track actual response times
    return 0;
  }

  private getActiveThemes(): string[] {
    const themes = new Set<string>();
    for (const instance of this.editors.values()) {
      // Get current theme from Monaco
      themes.add('vs-dark'); // Default for now
    }
    return Array.from(themes);
  }
}
