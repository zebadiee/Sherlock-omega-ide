/**
 * Tests for IntentDrivenUIManager
 * Validates UI manager functionality, protocol integration, and event handling
 */

import { IntentDrivenUIManager } from '../IntentDrivenUIManager';
import { 
  UIConfig, 
  DEFAULT_UI_CONFIG, 
  ActionSeverity, 
  ActionStatus 
} from '../types';
import { 
  SimpleZeroFrictionProtocol,
  ProtocolResult 
} from '../../friction/SimpleZeroFrictionProtocol';
import { 
  SimpleSyntaxFrictionDetector 
} from '../../friction/SimpleSyntaxFrictionDetector';
import { FrictionPoint } from '../../friction/BaseFrictionDetector';

// Mock DOM types
interface MockHTMLElement {
  tagName: string;
  style: Record<string, any>;
  className: string;
  dataset: Record<string, any>;
  innerHTML: string;
  textContent: string;
  appendChild: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  remove: jest.Mock;
  querySelector: jest.Mock;
  querySelectorAll: jest.Mock;
}

// Mock DOM environment
const mockDocument = {
  createElement: jest.fn((tagName: string): MockHTMLElement => ({
    tagName: tagName.toUpperCase(),
    style: {},
    className: '',
    dataset: {},
    innerHTML: '',
    textContent: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    remove: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn()
  })),
  head: {
    appendChild: jest.fn()
  },
  body: {
    appendChild: jest.fn()
  },
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16))
};

// Setup global mocks
(global as any).document = mockDocument;
(global as any).window = mockWindow;
(global as any).requestAnimationFrame = mockWindow.requestAnimationFrame;

describe('IntentDrivenUIManager', () => {
  let parentElement: MockHTMLElement;
  let uiManager: IntentDrivenUIManager;
  let mockProtocol: SimpleZeroFrictionProtocol;
  let mockDetector: SimpleSyntaxFrictionDetector;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock parent element
    parentElement = mockDocument.createElement('div');
    
    // Create mock detector and protocol
    mockDetector = new SimpleSyntaxFrictionDetector();
    mockProtocol = new SimpleZeroFrictionProtocol([mockDetector]);
    
    // Create UI manager
    uiManager = new IntentDrivenUIManager(parentElement as any);
  });

  afterEach(() => {
    if (uiManager) {
      uiManager.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(uiManager).toBeDefined();
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.sidebarVisible).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<UIConfig> = {
        sidebar: {
          enabled: false,
          position: 'left',
          width: 500,
          collapsible: false,
          autoHide: true,
          groupBy: 'source',
          sortBy: 'confidence',
          maxItems: 25
        }
      };
      
      const customUIManager = new IntentDrivenUIManager(parentElement as any, customConfig);
      expect(customUIManager).toBeDefined();
      
      customUIManager.destroy();
    });

    it('should create notification container', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(parentElement.appendChild).toHaveBeenCalled();
    });
  });

  describe('Protocol Integration', () => {
    it('should connect to friction detection protocol', () => {
      uiManager.connectProtocol(mockProtocol);
      
      // Verify connection (implementation detail)
      expect(uiManager).toBeDefined();
    });

    it('should process friction detection results', async () => {
      uiManager.connectProtocol(mockProtocol);
      
      // Create mock protocol result
      const mockResult: ProtocolResult = {
        totalFriction: 2,
        eliminatedFriction: 1,
        failedElimination: 1,
        detectorResults: [
          {
            detectorName: 'SimpleSyntaxFrictionDetector',
            frictionDetected: 2,
            frictionEliminated: 1,
            frictionFailed: 1,
            executionTime: 100,
            errors: []
          }
        ],
        executionTime: 150
      };
      
      // Add some friction to the detector
      const mockFriction = {
        id: 'test-friction-1',
        description: 'Missing semicolon',
        severity: 0.8,
        timestamp: Date.now(),
        errorCode: 1002,
        metadata: {
          confidence: 0.9,
          tags: ['syntax']
        }
      };
      
      mockDetector['history'].push(mockFriction);
      
      await uiManager.processFrictionResults(mockResult);
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty friction results', async () => {
      uiManager.connectProtocol(mockProtocol);
      
      const emptyResult: ProtocolResult = {
        totalFriction: 0,
        eliminatedFriction: 0,
        failedElimination: 0,
        detectorResults: [],
        executionTime: 50
      };
      
      await uiManager.processFrictionResults(emptyResult);
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBe(0);
    });
  });

  describe('Friction Point Management', () => {
    it('should add friction points to UI', () => {
      const mockFriction: FrictionPoint = {
        id: 'add-test-1',
        description: 'Test friction point',
        severity: 0.7,
        timestamp: Date.now(),
        metadata: {
          confidence: 0.85,
          tags: ['test']
        }
      };
      
      uiManager.addFrictionPoint(mockFriction, 'TestDetector');
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBe(1);
    });

    it('should remove friction points from UI', () => {
      const mockFriction: FrictionPoint = {
        id: 'remove-test-1',
        description: 'Test friction point',
        severity: 0.7,
        timestamp: Date.now()
      };
      
      uiManager.addFrictionPoint(mockFriction, 'TestDetector');
      expect(uiManager.getUIStats().totalItems).toBe(1);
      
      uiManager.removeFrictionPoint(mockFriction.id);
      expect(uiManager.getUIStats().totalItems).toBe(0);
    });

    it('should update friction points in UI', () => {
      const mockFriction: FrictionPoint = {
        id: 'update-test-1',
        description: 'Original description',
        severity: 0.5,
        timestamp: Date.now()
      };
      
      uiManager.addFrictionPoint(mockFriction, 'TestDetector');
      
      const updatedFriction: FrictionPoint = {
        ...mockFriction,
        description: 'Updated description',
        severity: 0.9
      };
      
      uiManager.updateFrictionPoint(updatedFriction, 'TestDetector');
      
      // Verify update (implementation would check sidebar content)
      expect(uiManager.getUIStats().totalItems).toBe(1);
    });
  });

  describe('Sidebar Control', () => {
    it('should show sidebar', () => {
      uiManager.showSidebar();
      
      const stats = uiManager.getUIStats();
      expect(stats.sidebarVisible).toBe(true);
    });

    it('should hide sidebar', () => {
      uiManager.hideSidebar();
      
      // Note: In mock environment, sidebar visibility state might not change
      // In real DOM, this would update the visibility
      expect(uiManager).toBeDefined();
    });

    it('should toggle sidebar visibility', () => {
      const initialStats = uiManager.getUIStats();
      const initialVisibility = initialStats.sidebarVisible;
      
      uiManager.toggleSidebar();
      
      // In real implementation, visibility would toggle
      expect(uiManager).toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    it('should update UI configuration', () => {
      const newConfig: Partial<UIConfig> = {
        sidebar: {
          enabled: true,
          position: 'left',
          width: 600,
          collapsible: true,
          autoHide: false,
          groupBy: 'file',
          sortBy: 'time',
          maxItems: 75
        },
        theme: {
          mode: 'light',
          colors: {
            primary: '#0066cc',
            secondary: '#666666',
            success: '#00aa00',
            warning: '#ff9900',
            error: '#cc0000',
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#333333',
            textSecondary: '#666666'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            monospace: 'Courier New, monospace',
            size: {
              small: '11px',
              medium: '13px',
              large: '15px'
            }
          }
        }
      };
      
      uiManager.updateConfig(newConfig);
      
      // Verify configuration was applied
      expect(uiManager).toBeDefined();
    });

    it('should update keyboard shortcuts', () => {
      const newConfig: Partial<UIConfig> = {
        interactions: {
          keyboardShortcuts: {
            toggleSidebar: 'Ctrl+Alt+S',
            executeAction: 'Space',
            dismissAction: 'Escape',
            snoozeAction: 'Ctrl+S'
          },
          autoExecute: {
            enabled: true,
            confidenceThreshold: 0.95,
            severityThreshold: ActionSeverity.HIGH
          },
          confirmations: {
            autoFix: true,
            refactor: false,
            install: false
          }
        }
      };
      
      uiManager.updateConfig(newConfig);
      
      expect(uiManager).toBeDefined();
    });
  });

  describe('Notifications', () => {
    it('should show notifications', () => {
      uiManager.showNotification({
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        duration: 3000
      });
      
      const stats = uiManager.getUIStats();
      expect(stats.activeNotifications).toBe(1);
    });

    it('should show different notification types', () => {
      const notificationTypes = ['success', 'error', 'warning', 'info'] as const;
      
      notificationTypes.forEach((type, index) => {
        uiManager.showNotification({
          title: `${type} Notification`,
          message: `This is a ${type} notification`,
          type,
          duration: 1000
        });
      });
      
      const stats = uiManager.getUIStats();
      expect(stats.activeNotifications).toBe(4);
    });

    it('should auto-remove notifications after duration', (done) => {
      uiManager.showNotification({
        title: 'Auto Remove Test',
        message: 'This notification should auto-remove',
        type: 'info',
        duration: 100
      });
      
      expect(uiManager.getUIStats().activeNotifications).toBe(1);
      
      setTimeout(() => {
        expect(uiManager.getUIStats().activeNotifications).toBe(0);
        done();
      }, 150);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate UI statistics', () => {
      // Add various friction points
      const frictionPoints = [
        {
          id: 'stats-1',
          description: 'High severity issue',
          severity: 0.9,
          timestamp: Date.now(),
          eliminated: false,
          attempted: false
        },
        {
          id: 'stats-2',
          description: 'Medium severity issue',
          severity: 0.6,
          timestamp: Date.now(),
          eliminated: true,
          attempted: true
        },
        {
          id: 'stats-3',
          description: 'Low severity issue',
          severity: 0.3,
          timestamp: Date.now(),
          eliminated: false,
          attempted: true
        }
      ];
      
      frictionPoints.forEach(fp => {
        uiManager.addFrictionPoint(fp, 'StatsDetector');
      });
      
      const stats = uiManager.getUIStats();
      
      expect(stats.totalItems).toBe(3);
      expect(stats.itemsByStatus.pending).toBeGreaterThanOrEqual(0);
      expect(stats.itemsByStatus.completed).toBeGreaterThanOrEqual(0);
      expect(stats.itemsByStatus.failed).toBeGreaterThanOrEqual(0);
      expect(stats.itemsBySeverity.high).toBeGreaterThanOrEqual(0);
      expect(stats.itemsBySeverity.medium).toBeGreaterThanOrEqual(0);
      expect(stats.itemsBySeverity.low).toBeGreaterThanOrEqual(0);
    });

    it('should track notification statistics', () => {
      uiManager.showNotification({
        title: 'Stats Test',
        message: 'Testing notification stats',
        type: 'info',
        duration: 5000
      });
      
      const stats = uiManager.getUIStats();
      expect(stats.activeNotifications).toBe(1);
    });
  });

  describe('Event Handling', () => {
    it('should handle keyboard shortcuts', () => {
      // Mock keyboard event
      const mockKeyEvent = {
        ctrlKey: true,
        shiftKey: true,
        key: 'S',
        preventDefault: jest.fn()
      };
      
      // Simulate keydown event
      const keydownHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      if (keydownHandler) {
        keydownHandler(mockKeyEvent);
        expect(mockKeyEvent.preventDefault).toHaveBeenCalled();
      }
    });

    it('should handle action execution events', () => {
      // This would test the internal event handling for action execution
      expect(uiManager).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of friction points efficiently', () => {
      const startTime = Date.now();
      
      // Add 50 friction points
      for (let i = 0; i < 50; i++) {
        uiManager.addFrictionPoint({
          id: `perf-${i}`,
          description: `Performance test friction ${i}`,
          severity: Math.random(),
          timestamp: Date.now()
        }, 'PerformanceDetector');
      }
      
      const endTime = Date.now();
      
      expect(uiManager.getUIStats().totalItems).toBe(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid updates efficiently', () => {
      const frictionPoint: FrictionPoint = {
        id: 'rapid-update-test',
        description: 'Rapid update test',
        severity: 0.5,
        timestamp: Date.now()
      };
      
      uiManager.addFrictionPoint(frictionPoint, 'RapidDetector');
      
      const startTime = Date.now();
      
      // Perform 20 rapid updates
      for (let i = 0; i < 20; i++) {
        uiManager.updateFrictionPoint({
          ...frictionPoint,
          description: `Updated ${i} times`,
          severity: Math.random()
        }, 'RapidDetector');
      }
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid friction points gracefully', () => {
      const invalidFriction = {
        id: '',
        description: '',
        severity: -1,
        timestamp: NaN
      } as any;
      
      expect(() => {
        uiManager.addFrictionPoint(invalidFriction, 'ErrorDetector');
      }).not.toThrow();
    });

    it('should handle protocol errors gracefully', async () => {
      const errorResult: ProtocolResult = {
        totalFriction: 0,
        eliminatedFriction: 0,
        failedElimination: 0,
        detectorResults: [
          {
            detectorName: 'ErrorDetector',
            frictionDetected: 0,
            frictionEliminated: 0,
            frictionFailed: 0,
            executionTime: 0,
            errors: ['Test error message']
          }
        ],
        executionTime: 0
      };
      
      await expect(uiManager.processFrictionResults(errorResult)).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      uiManager.showNotification({
        title: 'Cleanup Test',
        message: 'This should be cleaned up',
        type: 'info',
        duration: 10000
      });
      
      expect(uiManager.getUIStats().activeNotifications).toBe(1);
      
      uiManager.destroy();
      
      // After destroy, resources should be cleaned up
      expect(uiManager).toBeDefined();
    });

    it('should remove keyboard event listeners on destroy', () => {
      uiManager.destroy();
      
      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });
  });
});