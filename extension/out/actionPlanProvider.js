"use strict";
/**
 * Action Plan Tree Data Provider for VS Code
 * Displays actionable friction elimination items in the sidebar
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
exports.ActionPlanItem = exports.SherlockOmegaActionPlanProvider = void 0;
const vscode = __importStar(require("vscode"));
class IntegratedFrictionProtocol {
    async runIntegratedDetection(context) {
        return { actionableItems: [], success: true };
    }
    async executeAction(actionId) {
        return { success: true, message: 'Action executed', error: undefined };
    }
    getUIStats() {
        return {
            overall: { totalDetected: 0, totalEliminated: 0, eliminationRate: 0, averageExecutionTime: 0 },
            dependencies: { packageManager: 'npm' }
        };
    }
}
class SherlockOmegaActionPlanProvider {
    constructor(protocol) {
        this.protocol = protocol;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.actions = [];
    }
    /**
     * Update actions and refresh tree view
     */
    updateActions(actions) {
        this.actions = actions;
        this._onDidChangeTreeData.fire();
    }
    /**
     * Get current actions
     */
    getActions() {
        return this.actions;
    }
    /**
     * Get tree item for display
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get children for tree structure
     */
    getChildren(element) {
        if (!element) {
            // Root level - show categories
            return Promise.resolve(this.getRootItems());
        }
        else if (element.contextValue === 'category') {
            // Category level - show actions in category
            return Promise.resolve(this.getActionsForCategory(element.label));
        }
        else {
            // Action level - no children
            return Promise.resolve([]);
        }
    }
    /**
     * Get root level items (categories)
     */
    getRootItems() {
        if (this.actions.length === 0) {
            return [new ActionPlanItem('✨ No friction detected', 'Perfect flow state achieved!', vscode.TreeItemCollapsibleState.None, 'empty')];
        }
        const categories = this.groupActionsByCategory();
        const items = [];
        // Add summary item
        const totalActions = this.actions.length;
        const autoExecutable = this.actions.filter(a => a.autoExecutable).length;
        const highPriority = this.actions.filter(a => a.severity === 'high').length;
        items.push(new ActionPlanItem(`📊 ${totalActions} friction points`, `${autoExecutable} auto-fixable • ${highPriority} high priority`, vscode.TreeItemCollapsibleState.None, 'summary'));
        // Add category items
        for (const [category, actions] of categories.entries()) {
            const icon = this.getCategoryIcon(category);
            const item = new ActionPlanItem(`${icon} ${category} (${actions.length})`, `${actions.filter(a => a.autoExecutable).length} auto-fixable`, vscode.TreeItemCollapsibleState.Expanded, 'category');
            items.push(item);
        }
        return items;
    }
    /**
     * Get actions for a specific category
     */
    getActionsForCategory(categoryName) {
        const category = categoryName.split(' ')[1]; // Remove icon
        const categoryActions = this.actions.filter(action => this.getActionCategory(action) === category);
        return categoryActions.map(action => {
            const contextValue = action.autoExecutable ? 'executable-action' : 'manual-action';
            const item = new ActionPlanItem(action.title, action.description, vscode.TreeItemCollapsibleState.None, contextValue);
            // Set icon based on action type and severity
            item.iconPath = new vscode.ThemeIcon(this.getActionIcon(action));
            // Set tooltip with detailed information
            item.tooltip = this.getActionTooltip(action);
            // Add command for execution
            if (action.autoExecutable) {
                item.command = {
                    command: 'sherlock-omega.executeAction',
                    title: 'Execute Action',
                    arguments: [action.id]
                };
            }
            return item;
        });
    }
    /**
     * Group actions by category
     */
    groupActionsByCategory() {
        const categories = new Map();
        for (const action of this.actions) {
            const category = this.getActionCategory(action);
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(action);
        }
        return categories;
    }
    /**
     * Get category for an action
     */
    getActionCategory(action) {
        switch (action.metadata.frictionType) {
            case 'dependency':
                return 'Dependencies';
            case 'syntax':
                return 'Syntax';
            case 'performance':
                return 'Performance';
            case 'architecture':
                return 'Architecture';
            default:
                return 'Other';
        }
    }
    /**
     * Get icon for category
     */
    getCategoryIcon(category) {
        switch (category) {
            case 'Dependencies':
                return '📦';
            case 'Syntax':
                return '🔧';
            case 'Performance':
                return '⚡';
            case 'Architecture':
                return '🏗️';
            default:
                return '📋';
        }
    }
    /**
     * Get icon for action
     */
    getActionIcon(action) {
        if (!action.autoExecutable) {
            return 'warning';
        }
        switch (action.type) {
            case 'install':
                return 'package';
            case 'update':
                return 'sync';
            case 'fix':
                return 'tools';
            case 'refactor':
                return 'symbol-class';
            default:
                return 'lightbulb';
        }
    }
    /**
     * Get detailed tooltip for action
     */
    getActionTooltip(action) {
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${action.title}**\n\n`);
        tooltip.appendMarkdown(`${action.description}\n\n`);
        tooltip.appendMarkdown(`**Details:**\n`);
        tooltip.appendMarkdown(`• Severity: ${action.severity.toUpperCase()}\n`);
        tooltip.appendMarkdown(`• Auto-executable: ${action.autoExecutable ? '✅ Yes' : '❌ No'}\n`);
        tooltip.appendMarkdown(`• Confidence: ${Math.round(action.metadata.confidence * 100)}%\n`);
        tooltip.appendMarkdown(`• Estimated time: ${action.metadata.estimatedTime}s\n`);
        if (action.command) {
            tooltip.appendMarkdown(`\n**Command:** \`${action.command}\`\n`);
        }
        if (action.filePath) {
            tooltip.appendMarkdown(`\n**File:** ${action.filePath}`);
            if (action.line) {
                tooltip.appendMarkdown(`:${action.line}`);
                if (action.column) {
                    tooltip.appendMarkdown(`:${action.column}`);
                }
            }
        }
        return tooltip;
    }
}
exports.SherlockOmegaActionPlanProvider = SherlockOmegaActionPlanProvider;
/**
 * Tree item for action plan display
 */
class ActionPlanItem extends vscode.TreeItem {
    constructor(label, description, collapsibleState, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.description = description;
        this.contextValue = contextValue;
    }
}
exports.ActionPlanItem = ActionPlanItem;
//# sourceMappingURL=actionPlanProvider.js.map