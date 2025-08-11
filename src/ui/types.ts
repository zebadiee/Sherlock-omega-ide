/**
 * UI Type Definitions for Sherlock Ω Intent-Driven UI Augmentation
 * Defines interfaces for action plans, UI components, and user interactions
 */

import { FrictionPoint } from '../friction/BaseFrictionDetector';

/**
 * Action plan item representing a friction point with actionable suggestions
 */
export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  severity: ActionSeverity;
  confidence: number; // 0.0 to 1.0
  source: string; // detector name
  location?: ActionLocation;
  actions: ActionSuggestion[];
  metadata: ActionMetadata;
  status: ActionStatus;
}

/**
 * Severity levels for action plan items
 */
export enum ActionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Status of an action plan item
 */
export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  SNOOZED = 'snoozed',
  FAILED = 'failed'
}

/**
 * Location information for action items
 */
export interface ActionLocation {
  file?: string;
  line?: number;
  column?: number;
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Suggested action for resolving friction
 */
export interface ActionSuggestion {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  confidence: number;
  autoExecutable: boolean;
  command?: string;
  parameters?: Record<string, any>;
}

/**
 * Types of actions that can be suggested
 */
export enum ActionType {
  AUTO_FIX = 'auto_fix',
  REFACTOR = 'refactor',
  ADD_IMPORT = 'add_import',
  INSTALL_PACKAGE = 'install_package',
  UPDATE_CONFIG = 'update_config',
  MANUAL_REVIEW = 'manual_review',
  DOCUMENTATION = 'documentation'
}

/**
 * Metadata for action plan items
 */
export interface ActionMetadata {
  detectedAt: number;
  lastUpdated: number;
  attemptCount: number;
  tags: string[];
  relatedItems?: string[];
  estimatedTime?: number; // seconds
  impact?: ActionImpact;
}

/**
 * Impact assessment for actions
 */
export interface ActionImpact {
  codeChanges: number; // estimated lines of code affected
  testingRequired: boolean;
  breakingChange: boolean;
  performanceImpact: 'positive' | 'negative' | 'neutral';
}

/**
 * UI configuration for the intent-driven interface
 */
export interface UIConfig {
  sidebar: SidebarConfig;
  theme: ThemeConfig;
  interactions: InteractionConfig;
  notifications: NotificationConfig;
}

/**
 * Sidebar configuration
 */
export interface SidebarConfig {
  enabled: boolean;
  position: 'left' | 'right';
  width: number; // pixels
  collapsible: boolean;
  autoHide: boolean;
  groupBy: 'severity' | 'source' | 'file' | 'none';
  sortBy: 'severity' | 'confidence' | 'time' | 'alphabetical';
  maxItems: number;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  fonts: {
    primary: string;
    monospace: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  keyboardShortcuts: {
    toggleSidebar: string;
    executeAction: string;
    dismissAction: string;
    snoozeAction: string;
  };
  autoExecute: {
    enabled: boolean;
    confidenceThreshold: number;
    severityThreshold: ActionSeverity;
  };
  confirmations: {
    autoFix: boolean;
    refactor: boolean;
    install: boolean;
  };
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number; // milliseconds
  showFor: {
    completed: boolean;
    failed: boolean;
    dismissed: boolean;
  };
}

/**
 * Default UI configuration
 */
export const DEFAULT_UI_CONFIG: UIConfig = {
  sidebar: {
    enabled: true,
    position: 'right',
    width: 350,
    collapsible: true,
    autoHide: false,
    groupBy: 'severity',
    sortBy: 'severity',
    maxItems: 50
  },
  theme: {
    mode: 'dark',
    colors: {
      primary: '#007acc',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      background: '#1e1e1e',
      surface: '#252526',
      text: '#cccccc',
      textSecondary: '#969696'
    },
    fonts: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
      size: {
        small: '12px',
        medium: '14px',
        large: '16px'
      }
    }
  },
  interactions: {
    keyboardShortcuts: {
      toggleSidebar: 'Ctrl+Shift+S',
      executeAction: 'Enter',
      dismissAction: 'Delete',
      snoozeAction: 'Ctrl+D'
    },
    autoExecute: {
      enabled: false,
      confidenceThreshold: 0.9,
      severityThreshold: ActionSeverity.LOW
    },
    confirmations: {
      autoFix: false,
      refactor: true,
      install: true
    }
  },
  notifications: {
    enabled: true,
    position: 'top-right',
    duration: 3000,
    showFor: {
      completed: true,
      failed: true,
      dismissed: false
    }
  }
};

/**
 * Event types for UI interactions
 */
export enum UIEventType {
  ACTION_EXECUTED = 'action_executed',
  ACTION_DISMISSED = 'action_dismissed',
  ACTION_SNOOZED = 'action_snoozed',
  SIDEBAR_TOGGLED = 'sidebar_toggled',
  ITEM_SELECTED = 'item_selected',
  FILTER_CHANGED = 'filter_changed',
  SORT_CHANGED = 'sort_changed'
}

/**
 * UI event data
 */
export interface UIEvent {
  type: UIEventType;
  timestamp: number;
  data: any;
}

/**
 * UI event handler function type
 */
export type UIEventHandler = (event: UIEvent) => void;

/**
 * Utility function to convert friction points to action plan items
 */
export function frictionPointToActionPlanItem(
  frictionPoint: FrictionPoint,
  detectorName: string
): ActionPlanItem {
  return {
    id: frictionPoint.id,
    title: frictionPoint.description,
    description: frictionPoint.description,
    severity: mapSeverityToActionSeverity(frictionPoint.severity),
    confidence: frictionPoint.metadata?.confidence || 0.8,
    source: detectorName,
    location: frictionPoint.location ? {
      file: frictionPoint.location.file,
      line: frictionPoint.location.line,
      column: frictionPoint.location.column
    } : undefined,
    actions: generateDefaultActions(frictionPoint),
    metadata: {
      detectedAt: frictionPoint.timestamp || Date.now(),
      lastUpdated: Date.now(),
      attemptCount: frictionPoint.attempted ? 1 : 0,
      tags: frictionPoint.metadata?.tags || [],
      estimatedTime: 30 // default 30 seconds
    },
    status: frictionPoint.eliminated ? ActionStatus.COMPLETED : 
            frictionPoint.attempted ? ActionStatus.FAILED : 
            ActionStatus.PENDING
  };
}

/**
 * Map numeric severity to action severity enum
 */
function mapSeverityToActionSeverity(severity: number): ActionSeverity {
  if (severity >= 0.8) return ActionSeverity.CRITICAL;
  if (severity >= 0.6) return ActionSeverity.HIGH;
  if (severity >= 0.4) return ActionSeverity.MEDIUM;
  return ActionSeverity.LOW;
}

/**
 * Generate default actions for a friction point
 */
function generateDefaultActions(frictionPoint: FrictionPoint): ActionSuggestion[] {
  const actions: ActionSuggestion[] = [];
  
  // Auto-fix action if the friction point was successfully eliminated
  if (frictionPoint.eliminated) {
    actions.push({
      id: `auto-fix-${frictionPoint.id}`,
      title: 'Auto-fix applied',
      description: 'This issue was automatically resolved',
      type: ActionType.AUTO_FIX,
      confidence: 1.0,
      autoExecutable: false
    });
  } else {
    // Manual review action
    actions.push({
      id: `manual-review-${frictionPoint.id}`,
      title: 'Manual review required',
      description: 'This issue requires manual attention',
      type: ActionType.MANUAL_REVIEW,
      confidence: 0.8,
      autoExecutable: false
    });
  }
  
  return actions;
}