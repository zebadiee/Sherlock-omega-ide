/**
 * Status Bar Integration for Sherlock Ω
 * Shows real-time friction detection status
 */
export type StatusBarState = 'clean' | 'friction' | 'detecting' | 'executing' | 'error';
export declare class SherlockOmegaStatusBar {
    private statusBarItem;
    constructor();
    /**
     * Show the status bar item
     */
    show(): void;
    /**
     * Hide the status bar item
     */
    hide(): void;
    /**
     * Set status bar state and text
     */
    setStatus(state: StatusBarState, text: string): void;
    /**
     * Get display properties for status state
     */
    private getStatusDisplay;
    /**
     * Update with friction count
     */
    updateFrictionCount(count: number): void;
    /**
     * Show progress for long-running operations
     */
    showProgress(message: string): void;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=statusBar.d.ts.map