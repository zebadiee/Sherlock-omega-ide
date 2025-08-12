"use strict";
/**
 * Language Server Client for Sherlock Ω
 * Provides LSP integration for real-time friction detection
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
exports.SherlockOmegaLanguageClient = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const node_1 = require("vscode-languageclient/node");
class SherlockOmegaLanguageClient {
    /**
     * Start the language server
     */
    async start() {
        try {
            // Path to the language server
            const serverModule = path.join(__dirname, '..', 'server', 'server.js');
            // Server options
            const serverOptions = {
                run: { module: serverModule, transport: node_1.TransportKind.ipc },
                debug: {
                    module: serverModule,
                    transport: node_1.TransportKind.ipc,
                    options: { execArgv: ['--nolazy', '--inspect=6009'] }
                }
            };
            // Client options
            const clientOptions = {
                documentSelector: [
                    { scheme: 'file', language: 'typescript' },
                    { scheme: 'file', language: 'javascript' },
                    { scheme: 'file', language: 'typescriptreact' },
                    { scheme: 'file', language: 'javascriptreact' }
                ],
                synchronize: {
                    fileEvents: [
                        vscode.workspace.createFileSystemWatcher('**/package.json'),
                        vscode.workspace.createFileSystemWatcher('**/package-lock.json'),
                        vscode.workspace.createFileSystemWatcher('**/yarn.lock'),
                        vscode.workspace.createFileSystemWatcher('**/pnpm-lock.yaml')
                    ]
                },
                initializationOptions: {
                    sherlockOmega: {
                        enabled: true,
                        autoInstallDependencies: vscode.workspace.getConfiguration('sherlock-omega').get('autoInstallDependencies', true),
                        packageManager: vscode.workspace.getConfiguration('sherlock-omega').get('packageManager', 'auto'),
                        confidenceThreshold: vscode.workspace.getConfiguration('sherlock-omega').get('confidenceThreshold', 0.8)
                    }
                }
            };
            // Create and start the client
            this.client = new node_1.LanguageClient('sherlock-omega-lsp', 'Sherlock Ω Language Server', serverOptions, clientOptions);
            // Register custom handlers
            this.registerCustomHandlers();
            // Start the client
            await this.client.start();
            console.log('🧠 Sherlock Ω Language Server started');
        }
        catch (error) {
            console.error('Failed to start Sherlock Ω Language Server:', error);
            vscode.window.showErrorMessage('Failed to start Sherlock Ω Language Server');
        }
    }
    /**
     * Stop the language server
     */
    async stop() {
        if (this.client) {
            await this.client.stop();
            this.client = undefined;
            console.log('🧠 Sherlock Ω Language Server stopped');
        }
    }
    /**
     * Send custom request to language server
     */
    async sendRequest(method, params) {
        if (!this.client) {
            throw new Error('Language server not started');
        }
        return this.client.sendRequest(method, params);
    }
    /**
     * Send custom notification to language server
     */
    sendNotification(method, params) {
        if (this.client) {
            this.client.sendNotification(method, params);
        }
    }
    /**
     * Register custom request/notification handlers
     */
    registerCustomHandlers() {
        if (!this.client)
            return;
        // Handle friction detection results
        this.client.onNotification('sherlock-omega/frictionDetected', (params) => {
            this.handleFrictionDetected(params);
        });
        // Handle dependency installation requests
        this.client.onRequest('sherlock-omega/installDependency', (params) => {
            return this.handleInstallDependency(params);
        });
        // Handle configuration updates
        this.client.onNotification('sherlock-omega/configurationChanged', (params) => {
            this.handleConfigurationChanged(params);
        });
    }
    /**
     * Handle friction detection notification from server
     */
    handleFrictionDetected(params) {
        const { uri, frictionPoints } = params;
        // Update diagnostics
        this.updateDiagnostics(uri, frictionPoints);
        // Trigger action plan update
        vscode.commands.executeCommand('sherlock-omega.updateActionPlan', frictionPoints);
    }
    /**
     * Handle dependency installation request from server
     */
    async handleInstallDependency(params) {
        const { packageName, packageManager, options } = params;
        try {
            // Execute installation command
            const result = await vscode.commands.executeCommand('sherlock-omega.installDependency', packageName, packageManager, options);
            return { success: true, result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Handle configuration change notification from server
     */
    handleConfigurationChanged(params) {
        const { setting, value } = params;
        // Update VS Code configuration
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        config.update(setting, value, vscode.ConfigurationTarget.Workspace);
    }
    /**
     * Update diagnostics for friction points
     */
    updateDiagnostics(uri, frictionPoints) {
        const diagnostics = frictionPoints.map(point => {
            const range = new vscode.Range(point.line - 1, point.column - 1, point.line - 1, point.column + (point.length || 1) - 1);
            const diagnostic = new vscode.Diagnostic(range, point.description, this.getSeverity(point.severity));
            diagnostic.source = 'Sherlock Ω';
            diagnostic.code = point.type;
            // Add related information
            if (point.suggestions && point.suggestions.length > 0) {
                diagnostic.relatedInformation = point.suggestions.map((suggestion) => new vscode.DiagnosticRelatedInformation(new vscode.Location(vscode.Uri.parse(uri), range), suggestion));
            }
            return diagnostic;
        });
        // Update diagnostics collection
        const collection = vscode.languages.createDiagnosticCollection('sherlock-omega');
        collection.set(vscode.Uri.parse(uri), diagnostics);
    }
    /**
     * Convert severity to VS Code diagnostic severity
     */
    getSeverity(severity) {
        switch (severity.toLowerCase()) {
            case 'high':
                return vscode.DiagnosticSeverity.Error;
            case 'medium':
                return vscode.DiagnosticSeverity.Warning;
            case 'low':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Hint;
        }
    }
    /**
     * Get client status
     */
    isRunning() {
        return this.client !== undefined && this.client.state === 2; // Running state
    }
    /**
     * Restart the language server
     */
    async restart() {
        await this.stop();
        await this.start();
    }
}
exports.SherlockOmegaLanguageClient = SherlockOmegaLanguageClient;
//# sourceMappingURL=languageClient.js.map