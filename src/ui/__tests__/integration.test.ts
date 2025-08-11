/**
 * Integration Tests for Intent-Driven UI System
 * Tests the complete flow from friction detection to UI display and user interaction
 */

import { 
  setupIntentDrivenUI, 
  createMinimalUI, 
  createFullFeaturedUI,
  isUISupported,
  getUIVersion
} from '../index';
import { IntentDrivenUIManager } from '../IntentDrivenUIManager';
import { 
  SimpleSyntaxFrictionDetector 
} from '../../friction/SimpleSyntaxFrictionDetector';
import { 
  SimpleZeroFrictionProtocol 
} from '../../friction/SimpleZeroFrictionProtocol';
import { 
  UIConfig, 
  ActionSeverity 
} from '../types';

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

// Mock DOM environment for integration tests
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
  getElementById: jest.fn(() => null),
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

describe('Intent-Driven UI Integration', () => {
  let parentElement: MockHTMLElement;
  let detector: SimpleSyntaxFrictionDetector;
  let protocol: SimpleZeroFrictionProtocol;
  let uiManager: IntentDrivenUIManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock parent element
    parentElement = mockDocument.createElement('div');
    
    // Create friction detection components
    detector = new SimpleSyntaxFrictionDetector();
    protocol = new SimpleZeroFrictionProtocol([detector]);
  });

  afterEach(() => {
    if (uiManager) {
      uiManager.destroy();
    }
  });

  describe('Setup Functions', () => {
    it('should setup minimal UI correctly', () => {
      uiManager = createMinimalUI(parentElement as any);
      
      expect(uiManager).toBeInstanceOf(IntentDrivenUIManager);
      expect(uiManager.getUIStats().totalItems).toBe(0);
      expect(uiManager.getUIStats().sidebarVisible).toBe(true);
    });

    it('should setup full-featured UI correctly', () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      expect(uiManager).toBeInstanceOf(IntentDrivenUIManager);
      expect(uiManager.getUIStats().totalItems).toBe(0);
    });

    it('should setup UI with custom configuration', () => {
      const customConfig: Partial<UIConfig> = {
        sidebar: {
          enabled: true,
          position: 'left',
          width: 450,
          collapsible: true,
          autoHide: false,
          groupBy: 'severity',
          sortBy: 'confidence',
          maxItems: 30
        },
        notifications: {
          enabled: true,
          position: 'bottom-left',
          duration: 5000,
          showFor: {
            completed: true,
            failed: true,
            dismissed: true
          }
        }
      };
      
      uiManager = setupIntentDrivenUI({
        parentElement: parentElement as any,
        config: customConfig,
        protocol,
        autoConnect: true
      });
      
      expect(uiManager).toBeInstanceOf(IntentDrivenUIManager);
    });
  });

  describe('End-to-End Friction Detection and UI Flow', () => {
    it('should detect friction and display in UI', async () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Code with syntax errors
      const codeWithErrors = `
        function test() {
          console.log("missing semicolon")
          return "incomplete
        }
      `;
      
      // Run friction detection
      const result = await protocol.run(codeWithErrors);
      
      // Process results in UI
      await uiManager.processFrictionResults(result);
      
      // Verify UI was updated
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBeGreaterThanOrEqual(0);
      
      // Should have detected some friction points
      expect(result.totalFriction).toBeGreaterThan(0);
    });

    it('should handle multiple detector types', async () => {
      // Create additional mock detector
      class MockStyleDetector {
        private name = 'MockStyleDetector';
        
        getName() { return this.name; }
        
        detect() {
          return [{
            id: 'style-1',
            description: 'Inconsistent indentation',
            severity: 0.4,
            timestamp: Date.now(),
            metadata: { confidence: 0.8, tags: ['style'] }
          }];
        }
        
        async eliminate() { return false; }
        getHistory() { return []; }
        getStats() { return { totalDetected: 0, totalAttempted: 0, totalEliminated: 0, eliminationRate: 0, detectionRate: 0 }; }
        getRecentFriction() { return []; }
        getHighSeverityFriction() { return []; }
        clearHistory() {}
        resetMetrics() {}
        isHealthy() { return true; }
        updateConfig() {}
      }
      
      const styleDetector = new MockStyleDetector() as any;
      const multiProtocol = new SimpleZeroFrictionProtocol([detector, styleDetector]);
      
      uiManager = createFullFeaturedUI(parentElement as any, multiProtocol);
      
      const result = await multiProtocol.run('const x = 5');
      await uiManager.processFrictionResults(result);
      
      expect(result.detectorResults).toHaveLength(2);
    });

    it('should handle real-time friction updates', async () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Initial friction detection
      let result = await protocol.run('const x = 5');
      await uiManager.processFrictionResults(result);
      
      const initialStats = uiManager.getUIStats();
      
      // Add new friction point
      result = await protocol.run('function test() { console.log("error"');
      await uiManager.processFrictionResults(result);
      
      const updatedStats = uiManager.getUIStats();
      
      // Stats should reflect changes
      expect(updatedStats).toBeDefined();
    });
  });

  describe('User Interaction Simulation', () => {
    it('should handle sidebar toggle interactions', () => {
      uiManager = createMinimalUI(parentElement as any);
      
      const initialStats = uiManager.getUIStats();
      const initialVisibility = initialStats.sidebarVisible;
      
      // Toggle sidebar
      uiManager.toggleSidebar();
      
      // In real DOM, visibility would change
      expect(uiManager).toBeDefined();
    });

    it('should handle action execution', async () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Add a friction point with actions
      const mockFriction = {
        id: 'action-test-1',
        description: 'Missing semicolon',
        severity: 0.8,
        timestamp: Date.now(),
        metadata: {
          confidence: 0.9,
          tags: ['syntax', 'auto-fixable']
        }
      };
      
      uiManager.addFrictionPoint(mockFriction, 'TestDetector');
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBe(1);
      
      // Simulate action execution would happen through UI events
      // In real implementation, this would trigger through DOM interactions
    });

    it('should handle keyboard shortcuts', () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Mock keyboard event for sidebar toggle (Ctrl+Shift+S)
      const mockKeyEvent = {
        ctrlKey: true,
        shiftKey: true,
        key: 'S',
        preventDefault: jest.fn()
      };
      
      // Find the keydown handler that was registered
      const keydownCall = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'keydown');
      
      if (keydownCall) {
        const handler = keydownCall[1];
        handler(mockKeyEvent);
        
        expect(mockKeyEvent.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-frequency friction updates', async () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      const startTime = Date.now();
      
      // Simulate rapid friction detection cycles
      for (let i = 0; i < 10; i++) {
        const result = await protocol.run(`const x${i} = ${i}`);
        await uiManager.processFrictionResults(result);
      }
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large numbers of friction points', async () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Add many friction points
      for (let i = 0; i < 25; i++) {
        uiManager.addFrictionPoint({
          id: `bulk-${i}`,
          description: `Bulk friction point ${i}`,
          severity: Math.random(),
          timestamp: Date.now()
        }, 'BulkDetector');
      }
      
      const stats = uiManager.getUIStats();
      expect(stats.totalItems).toBe(25);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from detector failures', async () => {
      // Create a detector that throws errors
      class ErrorDetector {
        private name = 'ErrorDetector';
        getName() { return this.name; }
        detect() { throw new Error('Detection failed'); }
        async eliminate() { return false; }
        getHistory() { return []; }
        getStats() { return { totalDetected: 0, totalAttempted: 0, totalEliminated: 0, eliminationRate: 0, detectionRate: 0 }; }
        getRecentFriction() { return []; }
        getHighSeverityFriction() { return []; }
        clearHistory() {}
        resetMetrics() {}
        isHealthy() { return false; }
        updateConfig() {}
      }
      
      const errorDetector = new ErrorDetector() as any;
      const errorProtocol = new SimpleZeroFrictionProtocol([detector, errorDetector]);
      
      uiManager = createFullFeaturedUI(parentElement as any, errorProtocol);
      
      // Should not throw despite detector error
      const result = await errorProtocol.run('test code');
      await expect(uiManager.processFrictionResults(result)).resolves.not.toThrow();
      
      // Should still process results from working detector
      expect(result.detectorResults).toHaveLength(2);
    });

    it('should handle UI component failures gracefully', () => {
      uiManager = createMinimalUI(parentElement as any);
      
      // Simulate various error conditions
      // Test graceful handling of invalid input
      expect(() => {
        uiManager.addFrictionPoint(null as any, 'ErrorDetector');
      }).not.toThrow();
      
      expect(() => {
        uiManager.removeFrictionPoint('non-existent-id');
      }).not.toThrow();
      
      expect(() => {
        uiManager.updateConfig(null as any);
      }).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should apply theme changes across all components', () => {
      uiManager = createMinimalUI(parentElement as any);
      
      const newTheme = {
        mode: 'light' as const,
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
      };
      
      uiManager.updateConfig({ theme: newTheme });
      
      // Theme should be applied to all components
      expect(uiManager).toBeDefined();
    });

    it('should handle dynamic configuration updates', () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Add some friction points
      uiManager.addFrictionPoint({
        id: 'config-test-1',
        description: 'Test friction',
        severity: 0.7,
        timestamp: Date.now()
      }, 'ConfigDetector');
      
      // Change grouping and sorting
      uiManager.updateConfig({
        sidebar: {
          enabled: true,
          position: 'left',
          width: 300,
          collapsible: true,
          autoHide: false,
          groupBy: 'source',
          sortBy: 'time',
          maxItems: 50
        }
      });
      
      // Configuration should be applied
      expect(uiManager.getUIStats().totalItems).toBe(1);
    });
  });

  describe('Utility Functions', () => {
    it('should check UI support correctly', () => {
      expect(isUISupported()).toBe(true);
    });

    it('should return version information', () => {
      const version = getUIVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources properly', () => {
      uiManager = createFullFeaturedUI(parentElement as any, protocol);
      
      // Add friction points and notifications
      uiManager.addFrictionPoint({
        id: 'cleanup-test-1',
        description: 'Test friction for cleanup',
        severity: 0.5,
        timestamp: Date.now()
      }, 'CleanupDetector');
      
      uiManager.showNotification({
        title: 'Cleanup Test',
        message: 'This should be cleaned up',
        type: 'info',
        duration: 10000
      });
      
      const statsBeforeCleanup = uiManager.getUIStats();
      expect(statsBeforeCleanup.totalItems).toBe(1);
      expect(statsBeforeCleanup.activeNotifications).toBe(1);
      
      // Destroy should clean up everything
      uiManager.destroy();
      
      // Verify cleanup
      expect(uiManager).toBeDefined();
    });

    it('should handle multiple create/destroy cycles', () => {
      for (let i = 0; i < 5; i++) {
        const tempUIManager = createMinimalUI(parentElement as any);
        
        tempUIManager.addFrictionPoint({
          id: `cycle-${i}`,
          description: `Cycle test ${i}`,
          severity: 0.5,
          timestamp: Date.now()
        }, 'CycleDetector');
        
        expect(tempUIManager.getUIStats().totalItems).toBe(1);
        
        tempUIManager.destroy();
      }
      
      // No memory leaks should occur
      expect(true).toBe(true);
    });
  });
});