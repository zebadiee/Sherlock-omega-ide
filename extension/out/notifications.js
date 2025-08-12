"use strict";
/**
 * Notification System for Sherlock Ω
 * Manages user notifications and feedback
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
exports.SherlockOmegaNotifications = void 0;
const vscode = __importStar(require("vscode"));
class SherlockOmegaNotifications {
    constructor() {
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
    }
    /**
     * Show information notification
     */
    showInfo(message, ...actions) {
        if (!this.shouldShowNotifications()) {
            return Promise.resolve(undefined);
        }
        return vscode.window.showInformationMessage(message, ...actions);
    }
    /**
     * Show warning notification
     */
    showWarning(message, ...actions) {
        if (!this.shouldShowNotifications()) {
            return Promise.resolve(undefined);
        }
        return vscode.window.showWarningMessage(message, ...actions);
    }
    /**
     * Show error notification
     */
    showError(message, ...actions) {
        // Always show errors regardless of settings
        return vscode.window.showErrorMessage(message, ...actions);
    }
    /**
     * Show progress notification for long operations
     */
    async showProgress(title, task) {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable: false
        }, task);
    }
    /**
     * Show friction elimination success
     */
    showFrictionEliminated(actionTitle, duration) {
        const message = `✅ ${actionTitle} (${duration}ms)`;
        this.showInfo(message);
    }
    /**
     * Show friction elimination failure
     */
    showFrictionEliminationFailed(actionTitle, error) {
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
    showZeroFrictionAchieved() {
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
    showDependencyInstalled(packageName, packageManager) {
        const message = `📦 Installed ${packageName} via ${packageManager}`;
        this.showInfo(message);
    }
    /**
     * Show batch operation completion
     */
    showBatchOperationComplete(operationType, count, successCount) {
        if (successCount === count) {
            this.showInfo(`✅ ${operationType}: ${count} items completed successfully`);
        }
        else {
            this.showWarning(`⚠️ ${operationType}: ${successCount}/${count} items completed`);
        }
    }
    /**
     * Show welcome message for first-time users
     */
    showWelcomeMessage() {
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
    showConfigurationChanged(setting, newValue) {
        const message = `🔧 Sherlock Ω: ${setting} updated to ${newValue}`;
        this.showInfo(message);
    }
    /**
     * Show performance metrics
     */
    showPerformanceMetrics(detectionTime, eliminationRate) {
        const message = `📊 Detection: ${detectionTime}ms • Elimination: ${(eliminationRate * 100).toFixed(1)}%`;
        this.showInfo(message);
    }
    /**
     * Ask for user confirmation
     */
    async askConfirmation(message, confirmText = 'Yes') {
        const result = await vscode.window.showWarningMessage(message, { modal: true }, confirmText, 'Cancel');
        return result === confirmText;
    }
    /**
     * Show input box for user input
     */
    async askForInput(prompt, placeholder) {
        return vscode.window.showInputBox({
            prompt,
            placeHolder: placeholder
        });
    }
    /**
     * Show quick pick for user selection
     */
    async askForSelection(items, options) {
        return vscode.window.showQuickPick(items, options);
    }
    /**
     * Check if notifications should be shown
     */
    shouldShowNotifications() {
        // Refresh config in case it changed
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
        return this.config.get('showNotifications', true);
    }
    /**
     * Update configuration reference
     */
    updateConfiguration() {
        this.config = vscode.workspace.getConfiguration('sherlock-omega');
    }
}
exports.SherlockOmegaNotifications = SherlockOmegaNotifications;
//# sourceMappingURL=notifications.js.map