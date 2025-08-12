"use strict";
/**
 * Sherlock Ω VS Code Extension
 * Revolutionary Zero-Friction Development Environment
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.SherlockOmegaExtension = void 0;
const vscode = __importStar(require("vscode"));
// Mock protocol for now
class IntegratedFrictionProtocol {
    async runIntegratedDetection(context) {
        return {
            actionableItems: [],
            success: true
        };
    }
    async executeAction(actionId) {
        return { success: true, message: 'Action executed', error: undefined };
    }
    getUIStats() {
        return {
            overall: {
                totalDetected: 0,
                totalEliminated: 0,
                eliminationRate: 0,
                averageExecutionTime: 0
            },
            dependencies: {
                packageManager: 'npm'
            }
        };
    }
}
const actionPlanProvider_1 = require("./actionPlanProvider");
const languageClient_1 = require("./languageClient");
const statusBar_1 = require("./statusBar");
const notifications_1 = require("./notifications");
class SherlockOmegaExtension {
    constructor(context) {
        this.context = context;
        this.isActive = false;
        this.protocol = new IntegratedFrictionProtocol();
        this.actionPlanProvider = new actionPlanProvider_1.SherlockOmegaActionPlanProvider(this.protocol);
        this.languageClient = new languageClient_1.SherlockOmegaLanguageClient();
        this.statusBar = new statusBar_1.SherlockOmegaStatusBar();
        this.notifications = new notifications_1.SherlockOmegaNotifications();
    }
    /**
     * Activate the Sherlock Ω extension
     */
    async activate() {
        console.log('🧠 Activating Sherlock Ω - Zero-Friction Development Environment');
        // Set context for when clauses
        await vscode.commands.executeCommand('setContext', 'sherlock-omega.activated', true);
        // Register commands
        this.registerCommands();
        // Register providers
        this.registerProviders();
        // Setup event listeners
        this.setupEventListeners();
        // Initialize status bar
        this.statusBar.show();
        // Start language server
        await this.languageClient.start();
        this.isActive = true;
        this.notifications.showInfo('🧠 Sherlock Ω activated! Zero-friction development is now active.');
        // Run initial friction detection
        await this.runFrictionDetectionForActiveEditor();
    }
    /**
     * Deactivate the extension
     */
    async deactivate() {
        console.log('🧠 Deactivating Sherlock Ω');
        this.isActive = false;
        await vscode.commands.executeCommand('setContext', 'sherlock-omega.activated', false);
        // Clean up resources
        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
        }
        this.statusBar.hide();
        await this.languageClient.stop();
    }
    /**
     * Register VS Code commands
     */
    registerCommands() {
        const commands = [
            vscode.commands.registerCommand('sherlock-omega.activate', () => this.activate()),
            vscode.commands.registerCommand('sherlock-omega.runFrictionDetection', () => this.runFrictionDetectionForActiveEditor()),
            vscode.commands.registerCommand('sherlock-omega.showActionPlan', () => this.showActionPlan()),
            vscode.commands.registerCommand('sherlock-omega.installAllDependencies', () => this.installAllDependencies()),
            vscode.commands.registerCommand('sherlock-omega.toggleZeroFriction', () => this.toggleZeroFriction()),
            vscode.commands.registerCommand('sherlock-omega.showMetrics', () => this.showMetrics()),
            vscode.commands.registerCommand('sherlock-omega.executeAction', (actionId) => this.executeAction(actionId))
        ];
        commands.forEach(command => this.context.subscriptions.push(command));
    }
    /**
     * Register tree data providers and other providers
     */
    registerProviders() {
        // Register action plan tree view
        const actionPlanView = vscode.window.createTreeView('sherlock-omega-action-plan', {
            treeDataProvider: this.actionPlanProvider,
            showCollapseAll: true
        });
        this.context.subscriptions.push(actionPlanView);
        // Register hover provider for dependency information
        const hoverProvider = vscode.languages.registerHoverProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
            provideHover: (document, position) => this.provideDependencyHover(document, position)
        });
        this.context.subscriptions.push(hoverProvider);
        // Register code action provider for quick fixes
        const codeActionProvider = vscode.languages.registerCodeActionsProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
            provideCodeActions: (document, range, context) => this.provideCodeActions(document, range, context)
        });
        this.context.subscriptions.push(codeActionProvider);
    }
    /**
     * Setup event listeners for real-time friction detection
     */
    setupEventListeners() {
        // Document change listener for real-time detection
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive && this.shouldProcessDocument(event.document)) {
                this.scheduleDetection(event.document);
            }
        });
        // Active editor change listener
        const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (this.isActive && editor && this.shouldProcessDocument(editor.document)) {
                this.scheduleDetection(editor.document);
            }
        });
        // Configuration change listener
        const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('sherlock-omega')) {
                this.handleConfigurationChange();
            }
        });
        this.context.subscriptions.push(onDidChangeTextDocument, onDidChangeActiveTextEditor, onDidChangeConfiguration);
    }
    /**
     * Schedule friction detection with debouncing
     */
    scheduleDetection(document) {
        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
        }
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        const delay = config.get('detectionDelay', 500);
        this.detectionTimeout = setTimeout(() => {
            this.runFrictionDetection(document);
        }, delay);
    }
    /**
     * Run friction detection for a specific document
     */
    async runFrictionDetection(document) {
        try {
            this.statusBar.setStatus('detecting', 'Detecting friction...');
            const result = await this.protocol.runIntegratedDetection({
                filePath: document.fileName,
                content: document.getText(),
                checkPackageJson: true,
                language: document.languageId
            });
            // Update action plan
            this.actionPlanProvider.updateActions(result.actionableItems);
            // Update status bar
            const frictionCount = result.actionableItems.length;
            if (frictionCount === 0) {
                this.statusBar.setStatus('clean', '✨ Zero friction detected');
            }
            else {
                this.statusBar.setStatus('friction', `${frictionCount} friction points detected`);
            }
            // Auto-execute if enabled and confidence is high
            await this.autoExecuteHighConfidenceActions(result.actionableItems);
        }
        catch (error) {
            console.error('Sherlock Ω friction detection failed:', error);
            this.statusBar.setStatus('error', 'Detection failed');
        }
    }
    /**
     * Run friction detection for the currently active editor
     */
    async runFrictionDetectionForActiveEditor() {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.shouldProcessDocument(editor.document)) {
            await this.runFrictionDetection(editor.document);
        }
    }
    /**
     * Auto-execute high confidence actions
     */
    async autoExecuteHighConfidenceActions(actions) {
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        const autoInstall = config.get('autoInstallDependencies', true);
        const confidenceThreshold = config.get('confidenceThreshold', 0.8);
        if (!autoInstall)
            return;
        const highConfidenceActions = actions.filter(action => action.autoExecutable &&
            action.metadata.confidence >= confidenceThreshold);
        for (const action of highConfidenceActions) {
            try {
                const result = await this.protocol.executeAction(action.id);
                if (result.success) {
                    this.notifications.showInfo(`✅ Auto-executed: ${action.title}`);
                }
            }
            catch (error) {
                console.error('Auto-execution failed:', error);
            }
        }
        // Refresh action plan after auto-execution
        if (highConfidenceActions.length > 0) {
            setTimeout(() => this.runFrictionDetectionForActiveEditor(), 1000);
        }
    }
    /**
     * Execute a specific action
     */
    async executeAction(actionId) {
        try {
            this.statusBar.setStatus('executing', 'Executing action...');
            const result = await this.protocol.executeAction(actionId);
            if (result.success) {
                this.notifications.showInfo(`✅ ${result.message || 'Action executed successfully'}`);
                this.statusBar.setStatus('clean', 'Action completed');
                // Refresh friction detection
                setTimeout(() => this.runFrictionDetectionForActiveEditor(), 500);
            }
            else {
                this.notifications.showError(`❌ Action failed: ${result.error}`);
                this.statusBar.setStatus('error', 'Action failed');
            }
        }
        catch (error) {
            this.notifications.showError(`❌ Execution error: ${error}`);
            this.statusBar.setStatus('error', 'Execution error');
        }
    }
    /**
     * Show action plan in a webview
     */
    async showActionPlan() {
        const panel = vscode.window.createWebviewPanel('sherlock-omega-action-plan', '🧠 Sherlock Ω Action Plan', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.getActionPlanWebviewContent();
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'executeAction':
                    await this.executeAction(message.actionId);
                    break;
                case 'refreshActions':
                    await this.runFrictionDetectionForActiveEditor();
                    break;
            }
        });
    }
    /**
     * Install all missing dependencies
     */
    async installAllDependencies() {
        const actions = this.actionPlanProvider.getActions();
        const installActions = actions.filter(action => action.type === 'install' && action.autoExecutable);
        if (installActions.length === 0) {
            this.notifications.showInfo('No dependencies to install');
            return;
        }
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Installing dependencies...',
            cancellable: false
        }, async (progress) => {
            let completed = 0;
            for (const action of installActions) {
                progress.report({
                    message: `Installing ${action.title}...`,
                    increment: (completed / installActions.length) * 100
                });
                await this.executeAction(action.id);
                completed++;
            }
        });
        this.notifications.showInfo(`✅ Installed ${installActions.length} dependencies`);
    }
    /**
     * Toggle zero-friction mode
     */
    async toggleZeroFriction() {
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        const enabled = config.get('enabled', true);
        await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        if (!enabled) {
            this.notifications.showInfo('🧠 Zero-friction mode enabled');
            await this.activate();
        }
        else {
            this.notifications.showInfo('⏸️ Zero-friction mode disabled');
            await this.deactivate();
        }
    }
    /**
     * Show zero-friction metrics
     */
    async showMetrics() {
        const stats = this.protocol.getUIStats();
        const message = `
📊 Zero-Friction Metrics:
• Total Detected: ${stats.overall.totalDetected}
• Total Eliminated: ${stats.overall.totalEliminated}
• Elimination Rate: ${(stats.overall.eliminationRate * 100).toFixed(1)}%
• Avg Execution Time: ${stats.overall.averageExecutionTime.toFixed(2)}ms
• Package Manager: ${stats.dependencies.packageManager}
        `.trim();
        vscode.window.showInformationMessage(message, { modal: true });
    }
    /**
     * Check if document should be processed
     */
    shouldProcessDocument(document) {
        const supportedLanguages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];
        return supportedLanguages.includes(document.languageId) &&
            document.uri.scheme === 'file';
    }
    /**
     * Handle configuration changes
     */
    handleConfigurationChange() {
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        const enabled = config.get('enabled', true);
        if (enabled && !this.isActive) {
            this.activate();
        }
        else if (!enabled && this.isActive) {
            this.deactivate();
        }
    }
    /**
     * Provide hover information for dependencies
     */
    async provideDependencyHover(document, position) {
        const line = document.lineAt(position);
        const importMatch = line.text.match(/from\s+['"`]([^'"`]+)['"`]/);
        if (importMatch) {
            const dependencyName = importMatch[1];
            return new vscode.Hover([
                `**Sherlock Ω Dependency Info**`,
                `📦 ${dependencyName}`,
                `🔍 Click to analyze dependency health`
            ]);
        }
    }
    /**
     * Provide code actions for quick fixes
     */
    async provideCodeActions(document, range, context) {
        const actions = [];
        // Add Sherlock Ω quick fix action
        const quickFix = new vscode.CodeAction('🧠 Run Sherlock Ω Friction Detection', vscode.CodeActionKind.QuickFix);
        quickFix.command = {
            command: 'sherlock-omega.runFrictionDetection',
            title: 'Run Friction Detection'
        };
        actions.push(quickFix);
        return actions;
    }
    /**
     * Get webview content for action plan
     */
    getActionPlanWebviewContent() {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω Action Plan</title>
    <style>
        body { 
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .action-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .action-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .action-description {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Sherlock Ω Action Plan</h1>
        <button class="btn" onclick="refreshActions()">🔄 Refresh</button>
    </div>
    
    <div id="actions-container">
        <p>Loading actions...</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function executeAction(actionId) {
            vscode.postMessage({
                command: 'executeAction',
                actionId: actionId
            });
        }
        
        function refreshActions() {
            vscode.postMessage({
                command: 'refreshActions'
            });
        }
    </script>
</body>
</html>
        `;
    }
}
exports.SherlockOmegaExtension = SherlockOmegaExtension;
/**
 * Extension activation function
 */
function activate(context) {
    const extension = new SherlockOmegaExtension(context);
    // Auto-activate if enabled
    const config = vscode.workspace.getConfiguration('sherlock-omega');
    if (config.get('enabled', true)) {
        extension.activate();
    }
    return extension;
}
exports.activate = activate;
/**
 * Extension deactivation function
 */
function deactivate() {
    // Cleanup handled by extension instance
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map