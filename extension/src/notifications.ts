/**
 * Notification System for Sherlock Ω
 * Manages user notifications and feedback
 */

import * as vscode from 'vscode';

export class SherlockOmegaNotifications {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
    }

    /**
     * Show information notification
     */
    public showInfo(message: string, ...actions: string[]): Thenable<string | undefined> {
        if (!this.shouldShowNotifications()) {
            return Promise.resolve(undefined);
        }

        return vscode.window.showInformationMessage(message, ...actions);
    }

    /**
     * Show warning notification
     */
    public showWarning(message: string, ...actions: string[]): Thenable<string | undefined> {
        if (!this.shouldShowNotifications()) {
            return Promise.resolve(undefined);
        }

        return vscode.window.showWarningMessage(message, ...actions);
    }

    /**
     * Show error notification
     */
    public showError(message: string, ...actions: string[]): Thenable<string | undefined> {
        // Always show errors regardless of settings
        return vscode.window.showErrorMessage(message, ...actions);
    }

    /**
     * Show progress notification for long operations
     */
    public async showProgress<T>(
        title: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable: false
        }, task);
    }

    /**
     * Show friction elimination success
     */
    public showFrictionEliminated(actionTitle: string, duration: number): void {
        const message = `✅ ${actionTitle} (${duration}ms)`;
        this.showInfo(message);
    }

    /**
     * Show friction elimination failure
     */
    public showFrictionEliminationFailed(actionTitle: string, error: string): void {
        const message = `❌ Failed to execute: ${actionTitle}`;
        this.showError(message, 'Show Details').then(selection => {
            if (selection === 'Show Details') {
                vscode.window.showErrorMessage(error);
            }
        });
    }

    /**
     * Show zero-friction achievement
     */
    public showZeroFrictionAchieved(): void {
        const messages = [
            '✨ Perfect flow state achieved!',
            '🎉 Zero friction detected!',
            '🧠 Computational consciousness active!',
            '⚡ Development friction eliminated!'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.showInfo(message);
    }

    /**
     * Show dependency installation success
     */
    public showDependencyInstalled(packageName: string, packageManager: string): void {
        const message = `📦 Installed ${packageName} via ${packageManager}`;
        this.showInfo(message);
    }

    /**
     * Show batch operation completion
     */
    public showBatchOperationComplete(operationType: string, count: number, successCount: number): void {
        if (successCount === count) {
            this.showInfo(`✅ ${operationType}: ${count} items completed successfully`);
        } else {
            this.showWarning(`⚠️ ${operationType}: ${successCount}/${count} items completed`);
        }
    }

    /**
     * Show welcome message for first-time users
     */
    public showWelcomeMessage(): void {
        const message = '🧠 Welcome to Sherlock Ω! Zero-friction development is now active.';
        this.showInfo(message, 'Show Action Plan', 'Settings').then(selection => {
            switch (selection) {
                case 'Show Action Plan':
                    vscode.commands.executeCommand('sherlock-omega.showActionPlan');
                    break;
                case 'Settings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'sherlock-omega');
                    break;
            }
        });
    }

    /**
     * Show configuration change notification
     */
    public showConfigurationChanged(setting: string, newValue: any): void {
        const message = `🔧 Sherlock Ω: ${setting} updated to ${newValue}`;
        this.showInfo(message);
    }

    /**
     * Show performance metrics
     */
    public showPerformanceMetrics(detectionTime: number, eliminationRate: number): void {
        const message = `📊 Detection: ${detectionTime}ms • Elimination: ${(eliminationRate * 100).toFixed(1)}%`;
        this.showInfo(message);
    }

    /**
     * Ask for user confirmation
     */
    public async askConfirmation(message: string, confirmText: string = 'Yes'): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            confirmText,
            'Cancel'
        );
        return result === confirmText;
    }

    /**
     * Show input box for user input
     */
    public async askForInput(prompt: string, placeholder?: string): Promise<string | undefined> {
        return vscode.window.showInputBox({
            prompt,
            placeHolder: placeholder
        });
    }

    /**
     * Show quick pick for user selection
     */
    public async askForSelection<T extends vscode.QuickPickItem>(
        items: T[],
        options?: vscode.QuickPickOptions
    ): Promise<T | undefined> {
        return vscode.window.showQuickPick(items, options);
    }

    /**
     * Check if notifications should be shown
     */
    private shouldShowNotifications(): boolean {
        // Refresh config in case it changed
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
        return this.config.get<boolean>('showNotifications', true);
    }

    /**
     * Update configuration reference
     */
    public updateConfiguration(): void {
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
    }
}