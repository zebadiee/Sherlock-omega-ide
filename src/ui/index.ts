/**
 * Intent-Driven UI System for Sherlock Ω
 * Main entry point for UI components and manager
 */

// Export all types
export * from './types';

// Export components
export { ActionPlanSidebar } from './components/ActionPlanSidebar';

// Export manager
export { IntentDrivenUIManager, UIStats } from './IntentDrivenUIManager';

// Import dependencies
import { IntentDrivenUIManager } from './IntentDrivenUIManager';
import { UIConfig, DEFAULT_UI_CONFIG } from './types';
import { SimpleZeroFrictionProtocol } from '../friction/SimpleZeroFrictionProtocol';

/**
 * Setup options for the intent-driven UI
 */
export interface SetupOptions {
  parentElement?: HTMLElement;
  config?: Partial<UIConfig>;
  protocol?: SimpleZeroFrictionProtocol;
  autoConnect?: boolean;
}

/**
 * Factory function to setup the complete intent-driven UI system
 * This is the main entry point for integrating Sherlock Ω UI
 */
export function setupIntentDrivenUI(options: SetupOptions = {}): IntentDrivenUIManager {
  const {
    parentElement = document.body,
    config = {},
    protocol,
    autoConnect = true
  } = options;

  console.log('🎨 Setting up Sherlock Ω Intent-Driven UI...');

  // Create the UI manager
  const uiManager = new IntentDrivenUIManager(parentElement, config);

  // Connect to protocol if provided
  if (protocol && autoConnect) {
    uiManager.connectProtocol(protocol);
    console.log('🔗 Auto-connected to friction detection protocol');
  }

  // Add global CSS styles if not already present
  if (!document.getElementById('sherlock-ui-styles')) {
    injectGlobalStyles(config.theme || DEFAULT_UI_CONFIG.theme);
  }

  console.log('✅ Intent-Driven UI setup complete');
  return uiManager;
}

/**
 * Create a minimal UI setup for testing or simple use cases
 */
export function createMinimalUI(parentElement?: HTMLElement): IntentDrivenUIManager {
  return setupIntentDrivenUI({
    parentElement,
    config: {
      sidebar: {
        enabled: true,
        position: 'right',
        width: 300,
        collapsible: true,
        autoHide: false,
        groupBy: 'severity',
        sortBy: 'severity',
        maxItems: 20
      },
      notifications: {
        enabled: true,
        position: 'top-right',
        duration: 2000,
        showFor: {
          completed: true,
          failed: true,
          dismissed: false
        }
      }
    },
    autoConnect: false
  });
}

/**
 * Create a full-featured UI setup with all options enabled
 */
export function createFullFeaturedUI(
  parentElement?: HTMLElement,
  protocol?: SimpleZeroFrictionProtocol
): IntentDrivenUIManager {
  return setupIntentDrivenUI({
    parentElement,
    protocol,
    config: {
      sidebar: {
        enabled: true,
        position: 'right',
        width: 400,
        collapsible: true,
        autoHide: false,
        groupBy: 'severity',
        sortBy: 'severity',
        maxItems: 100
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
          confidenceThreshold: 0.95,
          severityThreshold: 'low' as any
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
        duration: 4000,
        showFor: {
          completed: true,
          failed: true,
          dismissed: false
        }
      }
    },
    autoConnect: true
  });
}

/**
 * Inject global CSS styles for the UI components
 */
function injectGlobalStyles(theme: any): void {
  const styleElement = document.createElement('style');
  styleElement.id = 'sherlock-ui-styles';
  styleElement.textContent = `
    /* Sherlock Ω UI Global Styles */
    .sherlock-sidebar {
      font-family: ${theme.fonts.primary};
      box-sizing: border-box;
    }
    
    .sherlock-sidebar *,
    .sherlock-sidebar *::before,
    .sherlock-sidebar *::after {
      box-sizing: inherit;
    }
    
    .sherlock-sidebar::-webkit-scrollbar {
      width: 8px;
    }
    
    .sherlock-sidebar::-webkit-scrollbar-track {
      background: ${theme.colors.background};
    }
    
    .sherlock-sidebar::-webkit-scrollbar-thumb {
      background: ${theme.colors.secondary}60;
      border-radius: 4px;
    }
    
    .sherlock-sidebar::-webkit-scrollbar-thumb:hover {
      background: ${theme.colors.secondary}80;
    }
    
    .sherlock-action-item {
      transition: all 0.2s ease;
    }
    
    .sherlock-action-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .sherlock-notification {
      font-family: ${theme.fonts.primary};
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .sherlock-sidebar {
        width: 100% !important;
        left: 0 !important;
        right: 0 !important;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .sherlock-sidebar {
        border: 2px solid currentColor;
      }
      
      .sherlock-action-item {
        border: 1px solid currentColor;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .sherlock-sidebar,
      .sherlock-action-item,
      .sherlock-notification {
        transition: none !important;
        animation: none !important;
      }
    }
    
    /* Focus styles for accessibility */
    .sherlock-sidebar button:focus,
    .sherlock-action-item:focus {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: 2px;
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * Remove global styles (useful for cleanup)
 */
export function removeGlobalStyles(): void {
  const styleElement = document.getElementById('sherlock-ui-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * Utility function to check if the UI is supported in the current environment
 */
export function isUISupported(): boolean {
  return typeof document !== 'undefined' && 
         typeof window !== 'undefined' && 
         'addEventListener' in document;
}

/**
 * Get version information
 */
export function getUIVersion(): string {
  return '1.0.0';
}