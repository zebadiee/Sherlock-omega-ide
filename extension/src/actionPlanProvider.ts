/**
 * Action Plan Tree Data Provider for VS Code
 * Displays actionable friction elimination items in the sidebar
 */

import * as vscode from 'vscode';
// Temporarily use local interfaces until main library is fully built
interface ActionableItem {
  id: string;
  type: 'install' | 'update' | 'fix' | 'refactor';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  command?: string;
  filePath?: string;
  line?: number;
  column?: number;
  metadata: {
    frictionType: string;
    confidence: number;
    estimatedTime: number;
    dependencies?: string[];
  };
}

class IntegratedFrictionProtocol {
  async runIntegratedDetection(context: any) {
    return { actionableItems: [] as ActionableItem[], success: true };
  }
  async executeAction(actionId: string) {
    return { success: true, message: 'Action executed', error: undefined };
  }
  getUIStats() {
    return {
      overall: { totalDetected: 0, totalEliminated: 0, eliminationRate: 0, averageExecutionTime: 0 },
      dependencies: { packageManager: 'npm' }
    };
  }
}

export class SherlockOmegaActionPlanProvider implements vscode.TreeDataProvider<ActionPlanItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionPlanItem | undefined | null | void> = new vscode.EventEmitter<ActionPlanItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionPlanItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private actions: ActionableItem[] = [];

    constructor(private protocol: IntegratedFrictionProtocol) {}

    /**
     * Update actions and refresh tree view
     */
    public updateActions(actions: ActionableItem[]): void {
        this.actions = actions;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get current actions
     */
    public getActions(): ActionableItem[] {
        return this.actions;
    }

    /**
     * Get tree item for display
     */
    getTreeItem(element: ActionPlanItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree structure
     */
    getChildren(element?: ActionPlanItem): Thenable<ActionPlanItem[]> {
        if (!element) {
            // Root level - show categories
            return Promise.resolve(this.getRootItems());
        } else if (element.contextValue === 'category') {
            // Category level - show actions in category
            return Promise.resolve(this.getActionsForCategory(element.label as string));
        } else {
            // Action level - no children
            return Promise.resolve([]);
        }
    }

    /**
     * Get root level items (categories)
     */
    private getRootItems(): ActionPlanItem[] {
        if (this.actions.length === 0) {
            return [new ActionPlanItem(
                '✨ No friction detected',
                'Perfect flow state achieved!',
                vscode.TreeItemCollapsibleState.None,
                'empty'
            )];
        }

        const categories = this.groupActionsByCategory();
        const items: ActionPlanItem[] = [];

        // Add summary item
        const totalActions = this.actions.length;
        const autoExecutable = this.actions.filter(a => a.autoExecutable).length;
        const highPriority = this.actions.filter(a => a.severity === 'high').length;

        items.push(new ActionPlanItem(
            `📊 ${totalActions} friction points`,
            `${autoExecutable} auto-fixable • ${highPriority} high priority`,
            vscode.TreeItemCollapsibleState.None,
            'summary'
        ));

        // Add category items
        for (const [category, actions] of categories.entries()) {
            const icon = this.getCategoryIcon(category);
            const item = new ActionPlanItem(
                `${icon} ${category} (${actions.length})`,
                `${actions.filter(a => a.autoExecutable).length} auto-fixable`,
                vscode.TreeItemCollapsibleState.Expanded,
                'category'
            );
            items.push(item);
        }

        return items;
    }

    /**
     * Get actions for a specific category
     */
    private getActionsForCategory(categoryName: string): ActionPlanItem[] {
        const category = categoryName.split(' ')[1]; // Remove icon
        const categoryActions = this.actions.filter(action => 
            this.getActionCategory(action) === category
        );

        return categoryActions.map(action => {
            const contextValue = action.autoExecutable ? 'executable-action' : 'manual-action';
            const item = new ActionPlanItem(
                action.title,
                action.description,
                vscode.TreeItemCollapsibleState.None,
                contextValue
            );

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
    private groupActionsByCategory(): Map<string, ActionableItem[]> {
        const categories = new Map<string, ActionableItem[]>();

        for (const action of this.actions) {
            const category = this.getActionCategory(action);
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(action);
        }

        return categories;
    }

    /**
     * Get category for an action
     */
    private getActionCategory(action: ActionableItem): string {
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
    private getCategoryIcon(category: string): string {
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
    private getActionIcon(action: ActionableItem): string {
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
    private getActionTooltip(action: ActionableItem): vscode.MarkdownString {
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

/**
 * Tree item for action plan display
 */
export class ActionPlanItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.contextValue = contextValue;
    }
}