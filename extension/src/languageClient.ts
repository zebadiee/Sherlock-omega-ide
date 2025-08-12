/**
 * Language Server Client for Sherlock Ω
 * Provides LSP integration for real-time friction detection
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

export class SherlockOmegaLanguageClient {
    private client: LanguageClient | undefined;

    /**
     * Start the language server
     */
    public async start(): Promise<void> {
        try {
            // Path to the language server
            const serverModule = path.join(__dirname, '..', 'server', 'server.js');
            
            // Server options
            const serverOptions: ServerOptions = {
                run: { module: serverModule, transport: TransportKind.ipc },
                debug: {
                    module: serverModule,
                    transport: TransportKind.ipc,
                    options: { execArgv: ['--nolazy', '--inspect=6009'] }
                }
            };

            // Client options
            const clientOptions: LanguageClientOptions = {
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
            this.client = new LanguageClient(
                'sherlock-omega-lsp',
                'Sherlock Ω Language Server',
                serverOptions,
                clientOptions
            );

            // Register custom handlers
            this.registerCustomHandlers();

            // Start the client
            await this.client.start();
            
            console.log('🧠 Sherlock Ω Language Server started');

        } catch (error) {
            console.error('Failed to start Sherlock Ω Language Server:', error);
            vscode.window.showErrorMessage('Failed to start Sherlock Ω Language Server');
        }
    }

    /**
     * Stop the language server
     */
    public async stop(): Promise<void> {
        if (this.client) {
            await this.client.stop();
            this.client = undefined;
            console.log('🧠 Sherlock Ω Language Server stopped');
        }
    }

    /**
     * Send custom request to language server
     */
    public async sendRequest<T>(method: string, params?: any): Promise<T> {
        if (!this.client) {
            throw new Error('Language server not started');
        }

        return this.client.sendRequest(method, params);
    }

    /**
     * Send custom notification to language server
     */
    public sendNotification(method: string, params?: any): void {
        if (this.client) {
            this.client.sendNotification(method, params);
        }
    }

    /**
     * Register custom request/notification handlers
     */
    private registerCustomHandlers(): void {
        if (!this.client) return;

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
    private handleFrictionDetected(params: any): void {
        const { uri, frictionPoints } = params;
        
        // Update diagnostics
        this.updateDiagnostics(uri, frictionPoints);
        
        // Trigger action plan update
        vscode.commands.executeCommand('sherlock-omega.updateActionPlan', frictionPoints);
    }

    /**
     * Handle dependency installation request from server
     */
    private async handleInstallDependency(params: any): Promise<any> {
        const { packageName, packageManager, options } = params;
        
        try {
            // Execute installation command
            const result = await vscode.commands.executeCommand(
                'sherlock-omega.installDependency',
                packageName,
                packageManager,
                options
            );
            
            return { success: true, result };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Handle configuration change notification from server
     */
    private handleConfigurationChanged(params: any): void {
        const { setting, value } = params;
        
        // Update VS Code configuration
        const config = vscode.workspace.getConfiguration('sherlock-omega');
        config.update(setting, value, vscode.ConfigurationTarget.Workspace);
    }

    /**
     * Update diagnostics for friction points
     */
    private updateDiagnostics(uri: string, frictionPoints: any[]): void {
        const diagnostics: vscode.Diagnostic[] = frictionPoints.map(point => {
            const range = new vscode.Range(
                point.line - 1,
                point.column - 1,
                point.line - 1,
                point.column + (point.length || 1) - 1
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                point.description,
                this.getSeverity(point.severity)
            );

            diagnostic.source = 'Sherlock Ω';
            diagnostic.code = point.type;
            
            // Add related information
            if (point.suggestions && point.suggestions.length > 0) {
                diagnostic.relatedInformation = point.suggestions.map((suggestion: string) => 
                    new vscode.DiagnosticRelatedInformation(
                        new vscode.Location(vscode.Uri.parse(uri), range),
                        suggestion
                    )
                );
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
    private getSeverity(severity: string): vscode.DiagnosticSeverity {
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
    public isRunning(): boolean {
        return this.client !== undefined && this.client.state === 2; // Running state
    }

    /**
     * Restart the language server
     */
    public async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }
}