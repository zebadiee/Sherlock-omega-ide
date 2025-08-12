/**
 * Action Plan Tree Data Provider for VS Code
 * Displays actionable friction elimination items in the sidebar
 */
import * as vscode from 'vscode';
import { ActionableItem, IntegratedFrictionProtocol } from 'sherlock-omega-ide';
export declare class SherlockOmegaActionPlanProvider implements vscode.TreeDataProvider<ActionPlanItem> {
    private protocol;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<ActionPlanItem | undefined | null | void>;
    private actions;
    constructor(protocol: IntegratedFrictionProtocol);
    /**
     * Update actions and refresh tree view
     */
    updateActions(actions: ActionableItem[]): void;
    /**
     * Get current actions
     */
    getActions(): ActionableItem[];
    /**
     * Get tree item for display
     */
    getTreeItem(element: ActionPlanItem): vscode.TreeItem;
    /**
     * Get children for tree structure
     */
    getChildren(element?: ActionPlanItem): Thenable<ActionPlanItem[]>;
    /**
     * Get root level items (categories)
     */
    private getRootItems;
    /**
     * Get actions for a specific category
     */
    private getActionsForCategory;
    /**
     * Group actions by category
     */
    private groupActionsByCategory;
    /**
     * Get category for an action
     */
    private getActionCategory;
    /**
     * Get icon for category
     */
    private getCategoryIcon;
    /**
     * Get icon for action
     */
    private getActionIcon;
    /**
     * Get detailed tooltip for action
     */
    private getActionTooltip;
}
/**
 * Tree item for action plan display
 */
export declare class ActionPlanItem extends vscode.TreeItem {
    readonly label: string;
    readonly description: string;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    readonly contextValue: string;
    constructor(label: string, description: string, collapsibleState: vscode.TreeItemCollapsibleState, contextValue: string);
}
//# sourceMappingURL=actionPlanProvider.d.ts.map