/**
 * Action Plan Sidebar for Sherlock Ω IDE Integration
 * Displays actionable friction elimination items with one-click execution
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActionableItem, 
  IntegratedFrictionProtocol, 
  UIStats, 
  ActionExecutionResult 
} from '../friction/IntegratedFrictionProtocol';

/**
 * Props for the ActionPlan sidebar component
 */
interface ActionPlanSidebarProps {
  protocol: IntegratedFrictionProtocol;
  onActionExecuted?: (result: ActionExecutionResult) => void;
  onRefresh?: () => void;
  className?: string;
}

/**
 * ActionPlan Sidebar Component
 */
export const ActionPlanSidebar: React.FC<ActionPlanSidebarProps> = ({
  protocol,
  onActionExecuted,
  onRefresh,
  className = ''
}) => {
  const [actions, setActions] = useState<ActionableItem[]>([]);
  const [stats, setStats] = useState<UIStats | null>(null);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'high' | 'auto'>('all');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Refresh actions and stats
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, would get current context from IDE
      const mockContext = {
        filePath: 'src/example.ts',
        content: `
import _ from 'lodash';
import moment from 'moment';
import { Request, Response } from 'express';

const users = _.map([1, 2, 3], (id) => ({ id, name: \`User \${id}\` }));
const now = moment().format('YYYY-MM-DD');
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(mockContext);
      const currentStats = protocol.getUIStats();

      setActions(result.actionableItems.filter(action => !dismissedActions.has(action.id)));
      setStats(currentStats);
    } catch (error) {
      console.error('Failed to refresh action plan:', error);
    } finally {
      setIsLoading(false);
    }
  }, [protocol, dismissedActions]);

  /**
   * Execute an action
   */
  const executeAction = useCallback(async (actionId: string) => {
    setExecutingActions(prev => new Set(prev).add(actionId));
    
    try {
      const result = await protocol.executeAction(actionId);
      
      if (result.success) {
        // Remove successful action from the list
        setActions(prev => prev.filter(action => action.id !== actionId));
      }
      
      onActionExecuted?.(result);
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  }, [protocol, onActionExecuted]);

  /**
   * Dismiss an action
   */
  const dismissAction = useCallback((actionId: string) => {
    setDismissedActions(prev => new Set(prev).add(actionId));
    setActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  /**
   * Filter actions based on current filter
   */
  const filteredActions = actions.filter(action => {
    if (filter === 'high') return action.severity === 'high';
    if (filter === 'auto') return action.autoExecutable;
    return true;
  });

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  /**
   * Get action type icon
   */
  const getActionIcon = (type: string): string => {
    switch (type) {
      case 'install': return '📦';
      case 'update': return '🔄';
      case 'fix': return '🔧';
      case 'refactor': return '♻️';
      default: return '⚡';
    }
  };

  // Auto-refresh on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className={`action-plan-sidebar ${className}`}>
      {/* Header */}
      <div className="sidebar-header p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Action Plan</h2>
          <button
            onClick={() => { refreshData(); onRefresh?.(); }}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Refresh"
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="stats-summary text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Total Issues:</span>
              <span className="font-medium">{stats.overall.totalDetected}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Auto-fixable:</span>
              <span className="font-medium text-green-600">
                {actions.filter(a => a.autoExecutable).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Est. Time:</span>
              <span className="font-medium">
                {Math.ceil(actions.reduce((sum, a) => sum + a.metadata.estimatedTime, 0) / 60)}m
              </span>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="filter-buttons flex gap-1 mt-3">
          {(['all', 'high', 'auto'] as const).map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' ? 'All' : filterType === 'high' ? 'High Priority' : 'Auto-fixable'}
            </button>
          ))}
        </div>
      </div>

      {/* Actions List */}
      <div className="actions-list flex-1 overflow-y-auto">
        {filteredActions.length === 0 ? (
          <div className="empty-state p-4 text-center text-gray-500">
            {isLoading ? (
              <div>Loading actions...</div>
            ) : (
              <div>
                <div className="text-2xl mb-2">✨</div>
                <div>No friction detected!</div>
                <div className="text-sm mt-1">Your code is in perfect flow state.</div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredActions.map(action => (
              <ActionItem
                key={action.id}
                action={action}
                isExecuting={executingActions.has(action.id)}
                onExecute={() => executeAction(action.id)}
                onDismiss={() => dismissAction(action.id)}
                getSeverityColor={getSeverityColor}
                getActionIcon={getActionIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Sherlock Ω • Zero-Friction Protocol
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Action Item Component
 */
interface ActionItemProps {
  action: ActionableItem;
  isExecuting: boolean;
  onExecute: () => void;
  onDismiss: () => void;
  getSeverityColor: (severity: string) => string;
  getActionIcon: (type: string) => string;
}

const ActionItem: React.FC<ActionItemProps> = ({
  action,
  isExecuting,
  onExecute,
  onDismiss,
  getSeverityColor,
  getActionIcon
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="action-item mb-2 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Action Header */}
      <div className="action-header p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <span className="text-lg">{getActionIcon(action.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">{action.title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(action.severity)}`}>
                  {action.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{action.description}</p>
              
              {/* Location info */}
              {action.filePath && (
                <div className="text-xs text-gray-500 mt-1">
                  {action.filePath}
                  {action.line && `:${action.line}`}
                  {action.column && `:${action.column}`}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Show details"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={onDismiss}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Execute Button */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onExecute}
            disabled={isExecuting || !action.autoExecutable}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              action.autoExecutable
                ? isExecuting
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Executing...
              </span>
            ) : action.autoExecutable ? (
              `${action.type === 'install' ? 'Install' : action.type === 'update' ? 'Update' : 'Fix'} Now`
            ) : (
              'Manual Fix Required'
            )}
          </button>
          
          {action.command && (
            <button
              onClick={() => navigator.clipboard.writeText(action.command!)}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              title="Copy command"
            >
              📋
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="action-details p-3 pt-0 border-t border-gray-100">
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium text-gray-700">Confidence:</span>
              <span className="ml-2 text-gray-600">
                {Math.round(action.metadata.confidence * 100)}%
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Estimated Time:</span>
              <span className="ml-2 text-gray-600">
                {action.metadata.estimatedTime}s
              </span>
            </div>
            
            {action.command && (
              <div>
                <span className="font-medium text-gray-700">Command:</span>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                  {action.command}
                </code>
              </div>
            )}
            
            {action.metadata.dependencies && (
              <div>
                <span className="font-medium text-gray-700">Dependencies:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {action.metadata.dependencies.map(dep => (
                    <span key={dep} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPlanSidebar;