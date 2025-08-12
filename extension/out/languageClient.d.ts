/**
 * Language Server Client for Sherlock Ω
 * Provides LSP integration for real-time friction detection
 */
export declare class SherlockOmegaLanguageClient {
    private client;
    /**
     * Start the language server
     */
    start(): Promise<void>;
    /**
     * Stop the language server
     */
    stop(): Promise<void>;
    /**
     * Send custom request to language server
     */
    sendRequest<T>(method: string, params?: any): Promise<T>;
    /**
     * Send custom notification to language server
     */
    sendNotification(method: string, params?: any): void;
    /**
     * Register custom request/notification handlers
     */
    private registerCustomHandlers;
    /**
     * Handle friction detection notification from server
     */
    private handleFrictionDetected;
    /**
     * Handle dependency installation request from server
     */
    private handleInstallDependency;
    /**
     * Handle configuration change notification from server
     */
    private handleConfigurationChanged;
    /**
     * Update diagnostics for friction points
     */
    private updateDiagnostics;
    /**
     * Convert severity to VS Code diagnostic severity
     */
    private getSeverity;
    /**
     * Get client status
     */
    isRunning(): boolean;
    /**
     * Restart the language server
     */
    restart(): Promise<void>;
}
//# sourceMappingURL=languageClient.d.ts.map