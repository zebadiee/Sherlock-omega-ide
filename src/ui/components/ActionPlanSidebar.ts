/**
 * Action Plan Sidebar Component for Sherlock Ω Intent-Driven UI
 * Displays friction points and actionable suggestions in a collapsible sidebar
 */

import { 
  ActionPlanItem, 
  ActionSeverity, 
  ActionStatus, 
  ActionSuggestion,
  SidebarConfig,
  ThemeConfig,
  UIEvent,
  UIEventType,
  UIEventHandler
} from '../types';

/**
 * Sidebar component for displaying action plan items
 */
export class ActionPlanSidebar {
  private container: HTMLElement;
  private itemsContainer: HTMLElement;
  private headerElement: HTMLElement;
  private items: Map<string, ActionPlanItem> = new Map();
  private eventHandlers: Map<UIEventType, UIEventHandler[]> = new Map();
  private config: SidebarConfig;
  private theme: ThemeConfig;
  private isVisible: boolean = true;
  private selectedItemId: string | null = null;

  constructor(
    parentElement: HTMLElement,
    config: SidebarConfig,
    theme: ThemeConfig
  ) {
    this.config = config;
    this.theme = theme;
    this.container = this.createSidebarContainer(parentElement);
    this.headerElement = this.createHeader();
    this.itemsContainer = this.createItemsContainer();
    
    this.setupEventListeners();
    this.applyTheme();
    
    if (!config.enabled) {
      this.hide();
    }
  }

  /**
   * Add or update an action plan item
   */
  public addItem(item: ActionPlanItem): void {
    this.items.set(item.id, item);
    this.renderItems();
    this.updateHeader();
  }

  /**
   * Remove an action plan item
   */
  public removeItem(itemId: string): void {
    this.items.delete(itemId);
    this.renderItems();
    this.updateHeader();
  }

  /**
   * Update an existing action plan item
   */
  public updateItem(item: ActionPlanItem): void {
    if (this.items.has(item.id)) {
      this.items.set(item.id, item);
      this.renderItems();
    }
  }

  /**
   * Clear all items
   */
  public clearItems(): void {
    this.items.clear();
    this.renderItems();
    this.updateHeader();
  }

  /**
   * Get all items
   */
  public getItems(): ActionPlanItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Show the sidebar
   */
  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.emitEvent(UIEventType.SIDEBAR_TOGGLED, { visible: true });
  }

  /**
   * Hide the sidebar
   */
  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.emitEvent(UIEventType.SIDEBAR_TOGGLED, { visible: false });
  }

  /**
   * Toggle sidebar visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(type: UIEventType, handler: UIEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: UIEventType, handler: UIEventHandler): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<SidebarConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfig();
  }

  /**
   * Update theme
   */
  public updateTheme(theme: Partial<ThemeConfig>): void {
    this.theme = { ...this.theme, ...theme };
    this.applyTheme();
  }

  /**
   * Create the main sidebar container
   */
  private createSidebarContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sherlock-sidebar';
    container.style.cssText = `
      position: fixed;
      top: 0;
      ${this.config.position}: 0;
      width: ${this.config.width}px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      font-family: ${this.theme.fonts.primary};
      font-size: ${this.theme.fonts.size.medium};
      box-shadow: ${this.config.position === 'left' ? '2px' : '-2px'} 0 8px rgba(0,0,0,0.3);
      transition: transform 0.3s ease;
    `;
    
    parent.appendChild(container);
    return container;
  }

  /**
   * Create the sidebar header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'sherlock-sidebar-header';
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid ${this.theme.colors.secondary}40;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Action Plan';
    title.style.cssText = `
      margin: 0;
      font-size: ${this.theme.fonts.size.large};
      font-weight: 600;
      color: ${this.theme.colors.text};
    `;

    const badge = document.createElement('span');
    badge.className = 'sherlock-item-count';
    badge.style.cssText = `
      background: ${this.theme.colors.primary};
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: ${this.theme.fonts.size.small};
      font-weight: 500;
    `;

    if (this.config.collapsible) {
      const toggleButton = document.createElement('button');
      toggleButton.innerHTML = '×';
      toggleButton.style.cssText = `
        background: none;
        border: none;
        color: ${this.theme.colors.textSecondary};
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      `;
      
      toggleButton.addEventListener('click', () => this.toggle());
      toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.backgroundColor = `${this.theme.colors.secondary}40`;
      });
      toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.backgroundColor = 'transparent';
      });
      
      header.appendChild(toggleButton);
    }

    header.appendChild(title);
    header.appendChild(badge);
    this.container.appendChild(header);
    
    return header;
  }

  /**
   * Create the items container
   */
  private createItemsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sherlock-sidebar-items';
    container.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    `;
    
    this.container.appendChild(container);
    return container;
  }

  /**
   * Render all items
   */
  private renderItems(): void {
    this.itemsContainer.innerHTML = '';
    
    const sortedItems = this.getSortedItems();
    const groupedItems = this.getGroupedItems(sortedItems);
    
    for (const [groupName, items] of groupedItems) {
      if (groupName && groupedItems.size > 1) {
        const groupHeader = this.createGroupHeader(groupName);
        this.itemsContainer.appendChild(groupHeader);
      }
      
      for (const item of items) {
        const itemElement = this.createItemElement(item);
        this.itemsContainer.appendChild(itemElement);
      }
    }
    
    if (sortedItems.length === 0) {
      const emptyState = this.createEmptyState();
      this.itemsContainer.appendChild(emptyState);
    }
  }

  /**
   * Create a single item element
   */
  private createItemElement(item: ActionPlanItem): HTMLElement {
    const element = document.createElement('div');
    element.className = 'sherlock-action-item';
    element.dataset.itemId = item.id;
    
    const isSelected = this.selectedItemId === item.id;
    const severityColor = this.getSeverityColor(item.severity);
    
    element.style.cssText = `
      margin-bottom: 8px;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid ${severityColor};
      background: ${isSelected ? `${this.theme.colors.primary}20` : this.theme.colors.surface};
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    `;

    // Title and description
    const titleElement = document.createElement('div');
    titleElement.style.cssText = `
      font-weight: 500;
      color: ${this.theme.colors.text};
      margin-bottom: 4px;
      font-size: ${this.theme.fonts.size.medium};
      line-height: 1.4;
    `;
    titleElement.textContent = item.title;

    const descriptionElement = document.createElement('div');
    descriptionElement.style.cssText = `
      color: ${this.theme.colors.textSecondary};
      font-size: ${this.theme.fonts.size.small};
      line-height: 1.3;
      margin-bottom: 8px;
    `;
    descriptionElement.textContent = item.description;

    // Metadata row
    const metadataRow = document.createElement('div');
    metadataRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: ${this.theme.fonts.size.small};
      color: ${this.theme.colors.textSecondary};
    `;

    const sourceElement = document.createElement('span');
    sourceElement.textContent = item.source;
    sourceElement.style.cssText = `
      background: ${this.theme.colors.secondary}40;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    `;

    const confidenceElement = document.createElement('span');
    confidenceElement.textContent = `${Math.round(item.confidence * 100)}%`;
    confidenceElement.title = `Confidence: ${item.confidence.toFixed(2)}`;

    metadataRow.appendChild(sourceElement);
    metadataRow.appendChild(confidenceElement);

    // Actions
    if (item.actions.length > 0) {
      const actionsContainer = this.createActionsContainer(item);
      element.appendChild(titleElement);
      element.appendChild(descriptionElement);
      element.appendChild(metadataRow);
      element.appendChild(actionsContainer);
    } else {
      element.appendChild(titleElement);
      element.appendChild(descriptionElement);
      element.appendChild(metadataRow);
    }

    // Status indicator
    const statusIndicator = this.createStatusIndicator(item.status);
    element.appendChild(statusIndicator);

    // Event listeners
    element.addEventListener('click', () => {
      this.selectItem(item.id);
    });

    element.addEventListener('mouseenter', () => {
      if (!isSelected) {
        element.style.backgroundColor = `${this.theme.colors.surface}dd`;
      }
    });

    element.addEventListener('mouseleave', () => {
      if (!isSelected) {
        element.style.backgroundColor = this.theme.colors.surface;
      }
    });

    return element;
  }

  /**
   * Create actions container for an item
   */
  private createActionsContainer(item: ActionPlanItem): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-top: 8px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    `;

    for (const action of item.actions.slice(0, 3)) { // Show max 3 actions
      const button = document.createElement('button');
      button.textContent = action.title;
      button.style.cssText = `
        background: ${action.autoExecutable ? this.theme.colors.success : this.theme.colors.secondary};
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: ${this.theme.fonts.size.small};
        cursor: pointer;
        transition: opacity 0.2s;
      `;

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.executeAction(item, action);
      });

      button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.8';
      });

      button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
      });

      container.appendChild(button);
    }

    return container;
  }

  /**
   * Create status indicator
   */
  private createStatusIndicator(status: ActionStatus): HTMLElement {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${this.getStatusColor(status)};
    `;
    return indicator;
  }

  /**
   * Create group header
   */
  private createGroupHeader(groupName: string): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 4px;
      font-weight: 600;
      color: ${this.theme.colors.textSecondary};
      font-size: ${this.theme.fonts.size.small};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid ${this.theme.colors.secondary}20;
      margin-bottom: 8px;
    `;
    header.textContent = groupName;
    return header;
  }

  /**
   * Create empty state
   */
  private createEmptyState(): HTMLElement {
    const element = document.createElement('div');
    element.style.cssText = `
      text-align: center;
      padding: 40px 20px;
      color: ${this.theme.colors.textSecondary};
    `;
    
    element.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
      <div style="font-weight: 500; margin-bottom: 8px;">No friction detected</div>
      <div style="font-size: ${this.theme.fonts.size.small};">Your code is in perfect flow state!</div>
    `;
    
    return element;
  }

  /**
   * Update header with current item count
   */
  private updateHeader(): void {
    const badge = this.headerElement.querySelector('.sherlock-item-count') as HTMLElement;
    if (badge) {
      badge.textContent = this.items.size.toString();
    }
  }

  /**
   * Get sorted items based on configuration
   */
  private getSortedItems(): ActionPlanItem[] {
    const items = Array.from(this.items.values());
    
    return items.sort((a, b) => {
      switch (this.config.sortBy) {
        case 'severity':
          return this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity);
        case 'confidence':
          return b.confidence - a.confidence;
        case 'time':
          return b.metadata.detectedAt - a.metadata.detectedAt;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    }).slice(0, this.config.maxItems);
  }

  /**
   * Get grouped items based on configuration
   */
  private getGroupedItems(items: ActionPlanItem[]): Map<string, ActionPlanItem[]> {
    const groups = new Map<string, ActionPlanItem[]>();
    
    if (this.config.groupBy === 'none') {
      groups.set('', items);
      return groups;
    }
    
    for (const item of items) {
      let groupKey = '';
      
      switch (this.config.groupBy) {
        case 'severity':
          groupKey = item.severity.toUpperCase();
          break;
        case 'source':
          groupKey = item.source;
          break;
        case 'file':
          groupKey = item.location?.file || 'Unknown File';
          break;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }
    
    return groups;
  }

  /**
   * Select an item
   */
  private selectItem(itemId: string): void {
    this.selectedItemId = itemId;
    this.renderItems();
    this.emitEvent(UIEventType.ITEM_SELECTED, { itemId });
  }

  /**
   * Execute an action
   */
  private executeAction(item: ActionPlanItem, action: ActionSuggestion): void {
    this.emitEvent(UIEventType.ACTION_EXECUTED, { item, action });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Keyboard shortcuts would be handled by the parent manager
  }

  /**
   * Apply theme styles
   */
  private applyTheme(): void {
    this.container.style.backgroundColor = this.theme.colors.background;
    this.container.style.color = this.theme.colors.text;
    this.container.style.fontFamily = this.theme.fonts.primary;
  }

  /**
   * Apply configuration changes
   */
  private applyConfig(): void {
    this.container.style.width = `${this.config.width}px`;
    this.container.style[this.config.position] = '0';
    this.renderItems();
  }

  /**
   * Emit UI event
   */
  private emitEvent(type: UIEventType, data: any): void {
    const event: UIEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: ActionSeverity): string {
    switch (severity) {
      case ActionSeverity.CRITICAL:
        return this.theme.colors.error;
      case ActionSeverity.HIGH:
        return this.theme.colors.warning;
      case ActionSeverity.MEDIUM:
        return this.theme.colors.primary;
      case ActionSeverity.LOW:
        return this.theme.colors.success;
      default:
        return this.theme.colors.secondary;
    }
  }

  /**
   * Get color for status
   */
  private getStatusColor(status: ActionStatus): string {
    switch (status) {
      case ActionStatus.COMPLETED:
        return this.theme.colors.success;
      case ActionStatus.FAILED:
        return this.theme.colors.error;
      case ActionStatus.IN_PROGRESS:
        return this.theme.colors.warning;
      case ActionStatus.DISMISSED:
        return this.theme.colors.secondary;
      case ActionStatus.SNOOZED:
        return this.theme.colors.secondary;
      default:
        return this.theme.colors.primary;
    }
  }

  /**
   * Get numeric weight for severity (for sorting)
   */
  private getSeverityWeight(severity: ActionSeverity): number {
    switch (severity) {
      case ActionSeverity.CRITICAL:
        return 4;
      case ActionSeverity.HIGH:
        return 3;
      case ActionSeverity.MEDIUM:
        return 2;
      case ActionSeverity.LOW:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Destroy the sidebar and clean up resources
   */
  public destroy(): void {
    this.container.remove();
    this.eventHandlers.clear();
    this.items.clear();
  }
}