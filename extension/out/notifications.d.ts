/**
 * Notification System for Sherlock Ω
 * Manages user notifications and feedback
 */
import * as vscode from 'vscode';
export declare class SherlockOmegaNotifications {
    private config;
    constructor();
    /**
     * Show information notification
     */
    showInfo(message: string, ...actions: string[]): Thenable<string | undefined>;
    /**
     * Show warning notification
     */
    showWarning(message: string, ...actions: string[]): Thenable<string | undefined>;
    /**
     * Show error notification
     */
    showError(message: string, ...actions: string[]): Thenable<string | undefined>;
    /**
     * Show progress notification for long operations
     */
    showProgress<T>(title: string, task: (progress: vscode.Progress<{
        message?: string;
        increment?: number;
    }>) => Promise<T>): Promise<T>;
    /**
     * Show friction elimination success
     */
    showFrictionEliminated(actionTitle: string, duration: number): void;
    /**
     * Show friction elimination failure
     */
    showFrictionEliminationFailed(actionTitle: string, error: string): void;
    /**
     * Show zero-friction achievement
     */
    showZeroFrictionAchieved(): void;
    /**
     * Show dependency installation success
     */
    showDependencyInstalled(packageName: string, packageManager: string): void;
    /**
     * Show batch operation completion
     */
    showBatchOperationComplete(operationType: string, count: number, successCount: number): void;
    /**
     * Show welcome message for first-time users
     */
    showWelcomeMessage(): void;
    /**
     * Show configuration change notification
     */
    showConfigurationChanged(setting: string, newValue: any): void;
    /**
     * Show performance metrics
     */
    showPerformanceMetrics(detectionTime: number, eliminationRate: number): void;
    /**
     * Ask for user confirmation
     */
    askConfirmation(message: string, confirmText?: string): Promise<boolean>;
    /**
     * Show input box for user input
     */
    askForInput(prompt: string, placeholder?: string): Promise<string | undefined>;
    /**
     * Show quick pick for user selection
     */
    askForSelection<T extends vscode.QuickPickItem>(items: T[], options?: vscode.QuickPickOptions): Promise<T | undefined>;
    /**
     * Check if notifications should be shown
     */
    private shouldShowNotifications;
    /**
     * Update configuration reference
     */
    updateConfiguration(): void;
}
//# sourceMappingURL=notifications.d.ts.map