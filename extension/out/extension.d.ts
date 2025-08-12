/**
 * Sherlock Ω VS Code Extension
 * Revolutionary Zero-Friction Development Environment
 */
import * as vscode from 'vscode';
export declare class SherlockOmegaExtension {
    private context;
    private protocol;
    private actionPlanProvider;
    private languageClient;
    private statusBar;
    private notifications;
    private isActive;
    private detectionTimeout;
    constructor(context: vscode.ExtensionContext);
    /**
     * Activate the Sherlock Ω extension
     */
    activate(): Promise<void>;
    /**
     * Deactivate the extension
     */
    deactivate(): Promise<void>;
    /**
     * Register VS Code commands
     */
    private registerCommands;
    /**
     * Register tree data providers and other providers
     */
    private registerProviders;
    /**
     * Setup event listeners for real-time friction detection
     */
    private setupEventListeners;
    /**
     * Schedule friction detection with debouncing
     */
    private scheduleDetection;
    /**
     * Run friction detection for a specific document
     */
    private runFrictionDetection;
    /**
     * Run friction detection for the currently active editor
     */
    private runFrictionDetectionForActiveEditor;
    /**
     * Auto-execute high confidence actions
     */
    private autoExecuteHighConfidenceActions;
    /**
     * Execute a specific action
     */
    private executeAction;
    /**
     * Show action plan in a webview
     */
    private showActionPlan;
    /**
     * Install all missing dependencies
     */
    private installAllDependencies;
    /**
     * Toggle zero-friction mode
     */
    private toggleZeroFriction;
    /**
     * Show zero-friction metrics
     */
    private showMetrics;
    /**
     * Check if document should be processed
     */
    private shouldProcessDocument;
    /**
     * Handle configuration changes
     */
    private handleConfigurationChange;
    /**
     * Provide hover information for dependencies
     */
    private provideDependencyHover;
    /**
     * Provide code actions for quick fixes
     */
    private provideCodeActions;
    /**
     * Get webview content for action plan
     */
    private getActionPlanWebviewContent;
}
/**
 * Extension activation function
 */
export declare function activate(context: vscode.ExtensionContext): SherlockOmegaExtension;
/**
 * Extension deactivation function
 */
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map