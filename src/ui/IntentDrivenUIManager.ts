/**
 * Intent-Driven UI Manager for Sherlock Ω
 * Coordinates between friction detection systems and UI components
 */

import { ActionPlanSidebar } from './components/ActionPlanSidebar';
import { 
  UIConfig, 
  DEFAULT_UI_CONFIG, 
  ActionPlanItem, 
  UIEvent, 
  UIEventType,
  frictionPointToActionPlanItem,
  ActionStatus,
  ActionSuggestion,
  ActionType
} from './types';
import { 
  SimpleZeroFrictionProtocol, 
  ProtocolResult 
} from '../friction/SimpleZeroFrictionProtocol';
import { FrictionPoint } from '../friction/BaseFrictionDetector';

/**
 * Notification system for user feedback
 */
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  timestamp: number;
}

/**
 * Main UI manager that orchestrates all intent-driven UI components
 */
export class IntentDrivenUIManager {
  private sidebar: ActionPlanSidebar;
  private config: UIConfig;
  private protocol: SimpleZeroFrictionProtocol | null = null;
  private parentElement: HTMLElement;
  private keyboardShortcuts: Map<string, () => void> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private notificationContainer: HTMLElement;
  private isInitialized: boolean = false;

  constructor(
    parentElement: HTMLElement,
    config: Partial<UIConfig> = {}
  ) {
    this.parentElement = parentElement;
    this.config = { ...DEFAULT_UI_CONFIG, ...config };
    
    this.notificationContainer = this.createNotificationContainer();
    this.sidebar = new ActionPlanSidebar(
      parentElement, 
      this.config.sidebar, 
      this.config.theme
    );
    
    this.setupEventHandlers();
    this.setupKeyboardShortcuts();
    this.isInitialized = true;
    
    console.log('🎨 Intent-Driven UI Manager initialized');
  }

  /**
   * Connect to a friction detection protocol
   */
  public connectProtocol(protocol: SimpleZeroFrictionProtocol): void {
    this.protocol = protocol;
    console.log('🔗 Connected to Zero-Friction Protocol');
  }

  /**
   * Process friction detection results and update UI
   */
  public async processFrictionResults(result: ProtocolResult): Promise<void> {
    console.log(`📊 Processing ${result.totalFriction} friction points`);
    
    // Clear existing items
    this.sidebar.clearItems();
    
    // Process each detector result
    for (const detectorResult of result.detectorResults) {
      // Get friction points from detector history
      if (this.protocol) {
        const detectors = this.protocol.getDetectors();
        const detector = detectors.find(d => d.getName() === detectorResult.detectorName);
        
        if (detector) {
          const recentFriction = detector.getRecentFriction(10);
          
          for (const frictionPoint of recentFriction) {
            const actionItem = frictionPointToActionPlanItem(
              frictionPoint, 
              detectorResult.detectorName
            );
            
            // Enhance action item with better suggestions
            actionItem.actions = this.generateEnhancedActions(frictionPoint, detectorResult.detectorName);
            
            this.sidebar.addItem(actionItem);
          }
        }
      }
    }
    
    // Show notification if enabled
    if (this.config.notifications.enabled && result.totalFriction > 0) {
      this.showNotification({
        title: 'Friction Detected',
        message: `Found ${result.totalFriction} friction points, ${result.eliminatedFriction} auto-resolved`,
        type: result.eliminatedFriction === result.totalFriction ? 'success' : 'warning',
        duration: this.config.notifications.duration
      });
    }
  }

  /**
   * Add a single friction point to the UI
   */
  public addFrictionPoint(frictionPoint: FrictionPoint, detectorName: string): void {
    try {
      if (!frictionPoint || !detectorName) {
        console.warn('Invalid friction point or detector name provided');
        return;
      }
      
      const actionItem = frictionPointToActionPlanItem(frictionPoint, detectorName);
      actionItem.actions = this.generateEnhancedActions(frictionPoint, detectorName);
      this.sidebar.addItem(actionItem);
    } catch (error) {
      console.error('Failed to add friction point to UI:', error);
    }
  }

  /**
   * Remove a friction point from the UI
   */
  public removeFrictionPoint(frictionPointId: string): void {
    this.sidebar.removeItem(frictionPointId);
  }

  /**
   * Update a friction point in the UI
   */
  public updateFrictionPoint(frictionPoint: FrictionPoint, detectorName: string): void {
    const actionItem = frictionPointToActionPlanItem(frictionPoint, detectorName);
    actionItem.actions = this.generateEnhancedActions(frictionPoint, detectorName);
    this.sidebar.updateItem(actionItem);
  }

  /**
   * Show the sidebar
   */
  public showSidebar(): void {
    this.sidebar.show();
  }

  /**
   * Hide the sidebar
   */
  public hideSidebar(): void {
    this.sidebar.hide();
  }

  /**
   * Toggle sidebar visibility
   */
  public toggleSidebar(): void {
    this.sidebar.toggle();
  }

  /**
   * Update UI configuration
   */
  public updateConfig(config: Partial<UIConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.sidebar) {
      this.sidebar.updateConfig(config.sidebar);
    }
    
    if (config.theme) {
      this.sidebar.updateTheme(config.theme);
    }
    
    if (config.interactions?.keyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
  }

  /**
   * Show a notification to the user
   */
  public showNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now()
    };
    
    this.notifications.set(id, fullNotification);
    this.renderNotification(fullNotification);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(id);
    }, notification.duration);
  }

  /**
   * Get current UI statistics
   */
  public getUIStats(): UIStats {
    const items = this.sidebar.getItems();
    
    return {
      totalItems: items.length,
      itemsByStatus: {
        pending: items.filter(i => i.status === ActionStatus.PENDING).length,
        inProgress: items.filter(i => i.status === ActionStatus.IN_PROGRESS).length,
        completed: items.filter(i => i.status === ActionStatus.COMPLETED).length,
        dismissed: items.filter(i => i.status === ActionStatus.DISMISSED).length,
        snoozed: items.filter(i => i.status === ActionStatus.SNOOZED).length,
        failed: items.filter(i => i.status === ActionStatus.FAILED).length
      },
      itemsBySeverity: {
        low: items.filter(i => i.severity === 'low').length,
        medium: items.filter(i => i.severity === 'medium').length,
        high: items.filter(i => i.severity === 'high').length,
        critical: items.filter(i => i.severity === 'critical').length
      },
      sidebarVisible: this.sidebar['isVisible'],
      activeNotifications: this.notifications.size
    };
  }

  /**
   * Destroy the UI manager and clean up resources
   */
  public destroy(): void {
    this.sidebar.destroy();
    this.notificationContainer.remove();
    this.removeKeyboardShortcuts();
    this.notifications.clear();
    this.isInitialized = false;
    
    console.log('🗑️ Intent-Driven UI Manager destroyed');
  }

  /**
   * Setup event handlers for UI components
   */
  private setupEventHandlers(): void {
    // Sidebar events
    this.sidebar.addEventListener(UIEventType.ACTION_EXECUTED, (event) => {
      this.handleActionExecution(event);
    });
    
    this.sidebar.addEventListener(UIEventType.ITEM_SELECTED, (event) => {
      console.log(`📋 Selected item: ${event.data.itemId}`);
    });
    
    this.sidebar.addEventListener(UIEventType.SIDEBAR_TOGGLED, (event) => {
      console.log(`👁️ Sidebar ${event.data.visible ? 'shown' : 'hidden'}`);
    });
  }

  /**
   * Handle action execution from the sidebar
   */
  private async handleActionExecution(event: UIEvent): Promise<void> {
    const { item, action } = event.data as { item: ActionPlanItem; action: ActionSuggestion };
    
    console.log(`🚀 Executing action: ${action.title} for item: ${item.title}`);
    
    // Update item status
    item.status = ActionStatus.IN_PROGRESS;
    item.metadata.lastUpdated = Date.now();
    item.metadata.attemptCount++;
    this.sidebar.updateItem(item);
    
    try {
      // Execute the action based on its type
      const success = await this.executeAction(item, action);
      
      // Update status based on result
      item.status = success ? ActionStatus.COMPLETED : ActionStatus.FAILED;
      item.metadata.lastUpdated = Date.now();
      this.sidebar.updateItem(item);
      
      // Show notification
      this.showNotification({
        title: success ? 'Action Completed' : 'Action Failed',
        message: `${action.title}: ${success ? 'Success' : 'Failed'}`,
        type: success ? 'success' : 'error',
        duration: this.config.notifications.duration
      });
      
      // Remove completed items after a delay
      if (success) {
        setTimeout(() => {
          this.sidebar.removeItem(item.id);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Action execution failed:', error);
      
      item.status = ActionStatus.FAILED;
      item.metadata.lastUpdated = Date.now();
      this.sidebar.updateItem(item);
      
      this.showNotification({
        title: 'Action Failed',
        message: `${action.title}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        duration: this.config.notifications.duration
      });
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(item: ActionPlanItem, action: ActionSuggestion): Promise<boolean> {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (action.type) {
      case ActionType.AUTO_FIX:
        console.log(`🔧 Auto-fixing: ${item.title}`);
        return Math.random() > 0.2; // 80% success rate
        
      case ActionType.MANUAL_REVIEW:
        console.log(`👁️ Opening for manual review: ${item.title}`);
        return true;
        
      case ActionType.ADD_IMPORT:
        console.log(`📦 Adding import for: ${item.title}`);
        return Math.random() > 0.1; // 90% success rate
        
      case ActionType.INSTALL_PACKAGE:
        console.log(`📥 Installing package for: ${item.title}`);
        return Math.random() > 0.3; // 70% success rate
        
      default:
        console.log(`❓ Unknown action type: ${action.type}`);
        return false;
    }
  }

  /**
   * Generate enhanced actions for a friction point
   */
  private generateEnhancedActions(frictionPoint: FrictionPoint, detectorName: string): ActionSuggestion[] {
    const actions: ActionSuggestion[] = [];
    
    // Auto-fix action for eliminated friction
    if (frictionPoint.eliminated) {
      actions.push({
        id: `auto-fix-${frictionPoint.id}`,
        title: 'Auto-fixed',
        description: 'This issue was automatically resolved',
        type: ActionType.AUTO_FIX,
        confidence: 1.0,
        autoExecutable: false
      });
      return actions;
    }
    
    // Generate actions based on detector type and friction description
    const description = frictionPoint.description.toLowerCase();
    
    if (detectorName.includes('Syntax')) {
      if (description.includes('missing') && description.includes('semicolon')) {
        actions.push({
          id: `fix-semicolon-${frictionPoint.id}`,
          title: 'Add Semicolon',
          description: 'Automatically add the missing semicolon',
          type: ActionType.AUTO_FIX,
          confidence: 0.95,
          autoExecutable: true
        });
      }
      
      if (description.includes('missing') && description.includes('bracket')) {
        actions.push({
          id: `fix-bracket-${frictionPoint.id}`,
          title: 'Add Bracket',
          description: 'Automatically add the missing bracket',
          type: ActionType.AUTO_FIX,
          confidence: 0.9,
          autoExecutable: true
        });
      }
      
      if (description.includes('cannot find name')) {
        actions.push({
          id: `add-import-${frictionPoint.id}`,
          title: 'Add Import',
          description: 'Add missing import statement',
          type: ActionType.ADD_IMPORT,
          confidence: 0.8,
          autoExecutable: true
        });
      }
    }
    
    // Always add manual review option
    actions.push({
      id: `manual-review-${frictionPoint.id}`,
      title: 'Review',
      description: 'Open for manual review',
      type: ActionType.MANUAL_REVIEW,
      confidence: 1.0,
      autoExecutable: false
    });
    
    return actions;
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.removeKeyboardShortcuts();
    
    const shortcuts = this.config.interactions.keyboardShortcuts;
    
    // Toggle sidebar
    this.keyboardShortcuts.set(shortcuts.toggleSidebar, () => {
      this.toggleSidebar();
    });
    
    // Global keyboard event listener
    const handleKeydown = (event: KeyboardEvent) => {
      const key = this.getKeyString(event);
      const handler = this.keyboardShortcuts.get(key);
      
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    // Store reference for cleanup
    (this as any)._keydownHandler = handleKeydown;
  }

  /**
   * Remove keyboard shortcuts
   */
  private removeKeyboardShortcuts(): void {
    if ((this as any)._keydownHandler) {
      document.removeEventListener('keydown', (this as any)._keydownHandler);
      delete (this as any)._keydownHandler;
    }
    this.keyboardShortcuts.clear();
  }

  /**
   * Get key string from keyboard event
   */
  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }

  /**
   * Create notification container
   */
  private createNotificationContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sherlock-notifications';
    container.style.cssText = `
      position: fixed;
      ${this.config.notifications.position.includes('top') ? 'top: 20px' : 'bottom: 20px'};
      ${this.config.notifications.position.includes('right') ? 'right: 20px' : 'left: 20px'};
      z-index: 2000;
      pointer-events: none;
    `;
    
    this.parentElement.appendChild(container);
    return container;
  }

  /**
   * Render a notification
   */
  private renderNotification(notification: Notification): void {
    const element = document.createElement('div');
    element.className = 'sherlock-notification';
    element.style.cssText = `
      background: ${this.getNotificationColor(notification.type)};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      transform: translateX(${this.config.notifications.position.includes('right') ? '100%' : '-100%'});
      opacity: 0;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
      font-weight: 600;
      margin-bottom: 4px;
      font-size: ${this.config.theme.fonts.size.medium};
    `;
    title.textContent = notification.title;
    
    const message = document.createElement('div');
    message.style.cssText = `
      font-size: ${this.config.theme.fonts.size.small};
      opacity: 0.9;
    `;
    message.textContent = notification.message;
    
    element.appendChild(title);
    element.appendChild(message);
    
    // Click to dismiss
    element.addEventListener('click', () => {
      this.removeNotification(notification.id);
    });
    
    this.notificationContainer.appendChild(element);
    
    // Animate in
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });
  }

  /**
   * Remove a notification
   */
  private removeNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    const element = this.notificationContainer.querySelector(`[data-id="${id}"]`) as HTMLElement;
    if (element) {
      element.style.transform = `translateX(${this.config.notifications.position.includes('right') ? '100%' : '-100%'})`;
      element.style.opacity = '0';
      
      setTimeout(() => {
        element.remove();
      }, 300);
    }
    
    this.notifications.delete(id);
  }

  /**
   * Get notification color based on type
   */
  private getNotificationColor(type: string): string {
    switch (type) {
      case 'success':
        return this.config.theme.colors.success;
      case 'error':
        return this.config.theme.colors.error;
      case 'warning':
        return this.config.theme.colors.warning;
      case 'info':
      default:
        return this.config.theme.colors.primary;
    }
  }
}

/**
 * UI statistics interface
 */
export interface UIStats {
  totalItems: number;
  itemsByStatus: Record<string, number>;
  itemsBySeverity: Record<string, number>;
  sidebarVisible: boolean;
  activeNotifications: number;
}