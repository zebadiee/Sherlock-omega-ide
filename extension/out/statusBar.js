"use strict";
/**
 * Status Bar Integration for Sherlock Ω
 * Shows real-time friction detection status
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
exports.SherlockOmegaStatusBar = void 0;
const vscode = __importStar(require("vscode"));
class SherlockOmegaStatusBar {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'sherlock-omega.showActionPlan';
        this.statusBarItem.tooltip = 'Click to show Sherlock Ω Action Plan';
    }
    /**
     * Show the status bar item
     */
    show() {
        this.setStatus('clean', 'Sherlock Ω Active');
        this.statusBarItem.show();
    }
    /**
     * Hide the status bar item
     */
    hide() {
        this.statusBarItem.hide();
    }
    /**
     * Set status bar state and text
     */
    setStatus(state, text) {
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
    getStatusDisplay(state) {
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
    updateFrictionCount(count) {
        if (count === 0) {
            this.setStatus('clean', 'Zero Friction');
        }
        else {
            this.setStatus('friction', `${count} friction point${count > 1 ? 's' : ''}`);
        }
    }
    /**
     * Show progress for long-running operations
     */
    showProgress(message) {
        this.setStatus('executing', message);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.SherlockOmegaStatusBar = SherlockOmegaStatusBar;
//# sourceMappingURL=statusBar.js.map