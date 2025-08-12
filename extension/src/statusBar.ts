/**
 * Status Bar Integration for Sherlock Ω
 * Shows real-time friction detection status
 */

import * as vscode from 'vscode';

export type StatusBarState = 'clean' | 'friction' | 'detecting' | 'executing' | 'error';

export class SherlockOmegaStatusBar {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        
        this.statusBarItem.command = 'sherlock-omega.showActionPlan';
        this.statusBarItem.tooltip = 'Click to show Sherlock Ω Action Plan';
    }

    /**
     * Show the status bar item
     */
    public show(): void {
        this.setStatus('clean', 'Sherlock Ω Active');
        this.statusBarItem.show();
    }

    /**
     * Hide the status bar item
     */
    public hide(): void {
        this.statusBarItem.hide();
    }

    /**
     * Set status bar state and text
     */
    public setStatus(state: StatusBarState, text: string): void {
        const { icon, color } = this.getStatusDisplay(state);
        
        this.statusBarItem.text = `${icon} ${text}`;
        this.statusBarItem.color = color;
        
        // Update tooltip based on state
        switch (state) {
            case 'clean':
                this.statusBarItem.tooltip = '✨ Zero friction detected - Perfect flow state!';
                break;
            case 'friction':
                this.statusBarItem.tooltip = '🔍 Friction points detected - Click to view action plan';
                break;
            case 'detecting':
                this.statusBarItem.tooltip = '🔄 Analyzing code for friction points...';
                break;
            case 'executing':
                this.statusBarItem.tooltip = '⚡ Executing friction elimination...';
                break;
            case 'error':
                this.statusBarItem.tooltip = '❌ Error in friction detection - Check output';
                break;
        }
    }

    /**
     * Get display properties for status state
     */
    private getStatusDisplay(state: StatusBarState): { icon: string; color?: string } {
        switch (state) {
            case 'clean':
                return { icon: '🧠', color: '#4ade80' }; // Green
            case 'friction':
                return { icon: '🔍', color: '#f59e0b' }; // Amber
            case 'detecting':
                return { icon: '🔄', color: '#3b82f6' }; // Blue
            case 'executing':
                return { icon: '⚡', color: '#8b5cf6' }; // Purple
            case 'error':
                return { icon: '❌', color: '#ef4444' }; // Red
            default:
                return { icon: '🧠' };
        }
    }

    /**
     * Update with friction count
     */
    public updateFrictionCount(count: number): void {
        if (count === 0) {
            this.setStatus('clean', 'Zero Friction');
        } else {
            this.setStatus('friction', `${count} friction point${count > 1 ? 's' : ''}`);
        }
    }

    /**
     * Show progress for long-running operations
     */
    public showProgress(message: string): void {
        this.setStatus('executing', message);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}