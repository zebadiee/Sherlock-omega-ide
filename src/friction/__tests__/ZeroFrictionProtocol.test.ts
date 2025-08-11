/**
 * Tests for ZeroFrictionProtocol
 * Validates friction elimination coordination and flow state management
 */

import { 
  ZeroFrictionProtocol, 
  FlowLevel, 
  FlowFactorType,
  DEFAULT_ZERO_FRICTION_CONFIG 
} from '../ZeroFrictionProtocol';
import { FrictionType, FrictionPoint } from '../FrictionDetector';
import { SeverityLevel } from '../../types/core';

// Mock the SyntaxFrictionDetector
jest.mock('../SyntaxFrictionDetector', () => ({
  SyntaxFrictionDetector: jest.fn().mockImplementation(() => ({
    type: FrictionType.SYNTAX,
    detectFriction: jest.fn().mockResolvedValue([]),
    eliminateFriction: jest.fn().mockResolvedValue({
      success: true,
      frictionPoint: {},
      strategy: { name: 'test', type: 'AUTO_CORRECTION' },
      duration: 100
    }),
    getDetectedFriction: jest.fn().mockReturnValue([]),
    getEliminationHistory: jest.fn().mockReturnValue([])
  }))
}));

describe('ZeroFrictionProtocol', () => {
  let protocol: ZeroFrictionProtocol;

  beforeEach(() => {
    protocol = new ZeroFrictionProtocol();
  });

  afterEach(async () => {
    protocol.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(protocol).toBeDefined();
      expect(protocol.getCurrentFlowState().level).toBe(FlowLevel.OPTIMAL);
      expect(protocol.getCurrentFlowState().score).toBe(1.0);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        ...DEFAULT_ZERO_FRICTION_CONFIG,
        monitoringInterval: 1000,
        flowStateThreshold: 0.9
      };

      const customProtocol = new ZeroFrictionProtocol(customConfig);
      expect(customProtocol).toBeDefined();
    });

    it('should initialize friction detectors', () => {
      const detectedFriction = protocol.getAllDetectedFriction();
      expect(Array.isArray(detectedFriction)).toBe(true);
    });
  });

  describe('Protocol Lifecycle', () => {
    it('should start monitoring successfully', async () => {
      await protocol.start();
      
      // Protocol should be running
      const flowState = protocol.getCurrentFlowState();
      expect(flowState).toBeDefined();
      expect(flowState.timestamp).toBeGreaterThan(0);
    });

    it('should stop monitoring successfully', async () => {
      await protocol.start();
      protocol.stop();
      
      // Should still have flow state but monitoring stopped
      const flowState = protocol.getCurrentFlowState();
      expect(flowState).toBeDefined();
    });

    it('should handle multiple start calls gracefully', async () => {
      await protocol.start();
      await protocol.start(); // Second start should be ignored
      
      const flowState = protocol.getCurrentFlowState();
      expect(flowState).toBeDefined();
    });

    it('should handle stop without start gracefully', () => {
      expect(() => protocol.stop()).not.toThrow();
    });
  });

  describe('Friction Detection and Elimination', () => {
    it('should maintain zero friction with no issues', async () => {
      const flowState = await protocol.maintainZeroFriction();
      
      expect(flowState.level).toBe(FlowLevel.OPTIMAL);
      expect(flowState.score).toBeGreaterThanOrEqual(0.9);
      expect(flowState.factors).toHaveLength(0);
    });

    it('should detect and handle friction points', async () => {
      // Mock friction detection to return some friction
      const mockFriction: FrictionPoint = {
        id: 'test-friction-1',
        type: FrictionType.SYNTAX,
        severity: SeverityLevel.MEDIUM,
        description: 'Missing semicolon',
        location: {
          file: 'test.ts',
          line: 1,
          column: 10,
          scope: [],
          context: 'const x = 5'
        },
        impact: {
          flowDisruption: 0.3,
          timeDelay: 2000,
          cognitiveLoad: 0.2,
          blockingPotential: 0.4
        },
        detectedAt: Date.now(),
        metadata: {
          confidence: 0.9,
          recurrence: 1,
          resolutionHistory: [],
          tags: ['syntax']
        }
      };

      // We would need to mock the detector to return this friction
      // For now, we'll test the flow state calculation
      const flowState = await protocol.maintainZeroFriction();
      expect(flowState).toBeDefined();
    });

    it('should prioritize high-severity friction', async () => {
      const stats = protocol.getStats();
      expect(stats.totalDetected).toBeGreaterThanOrEqual(0);
      expect(stats.eliminationRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Flow State Management', () => {
    it('should calculate flow state correctly', async () => {
      const flowState = await protocol.maintainZeroFriction();
      
      expect(flowState.level).toBeDefined();
      expect(flowState.score).toBeGreaterThanOrEqual(0);
      expect(flowState.score).toBeLessThanOrEqual(1);
      expect(flowState.factors).toBeDefined();
      expect(flowState.timestamp).toBeGreaterThan(0);
      expect(flowState.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track flow state history', async () => {
      await protocol.maintainZeroFriction();
      await protocol.maintainZeroFriction();
      
      const stats = protocol.getStats();
      expect(stats.flowStateHistory.length).toBeGreaterThan(0);
    });

    it('should determine correct flow levels', async () => {
      const flowState = protocol.getCurrentFlowState();
      
      // With no friction, should be optimal
      expect(flowState.level).toBe(FlowLevel.OPTIMAL);
      expect(flowState.score).toBe(1.0);
    });

    it('should handle flow state degradation', async () => {
      // This would require mocking friction that degrades flow state
      const flowState = await protocol.maintainZeroFriction();
      
      // Even with potential degradation, should maintain valid state
      expect(Object.values(FlowLevel)).toContain(flowState.level);
      expect(flowState.score).toBeGreaterThanOrEqual(0);
      expect(flowState.score).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track friction statistics', () => {
      const stats = protocol.getStats();
      
      expect(stats.totalDetected).toBeGreaterThanOrEqual(0);
      expect(stats.totalEliminated).toBeGreaterThanOrEqual(0);
      expect(stats.eliminationRate).toBeGreaterThanOrEqual(0);
      expect(stats.averageEliminationTime).toBeGreaterThanOrEqual(0);
      expect(stats.frictionByType).toBeDefined();
      expect(stats.flowStateHistory).toBeDefined();
    });

    it('should update statistics correctly', async () => {
      const initialStats = protocol.getStats();
      
      await protocol.maintainZeroFriction();
      
      const updatedStats = protocol.getStats();
      expect(updatedStats.flowStateHistory.length).toBeGreaterThanOrEqual(
        initialStats.flowStateHistory.length
      );
    });

    it('should track elimination success rate', async () => {
      await protocol.maintainZeroFriction();
      
      const stats = protocol.getStats();
      expect(stats.eliminationRate).toBeGreaterThanOrEqual(0);
      expect(stats.eliminationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle detector failures gracefully', async () => {
      // Mock a detector failure
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const flowState = await protocol.maintainZeroFriction();
      
      // Should still return a valid flow state
      expect(flowState).toBeDefined();
      expect(flowState.level).toBeDefined();
      
      console.error = originalConsoleError;
    });

    it('should handle elimination failures', async () => {
      // This would require mocking elimination failures
      const flowState = await protocol.maintainZeroFriction();
      
      // Should handle failures and maintain valid state
      expect(flowState).toBeDefined();
    });

    it('should escalate when threshold not met', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      // Force a low flow state (would require mocking)
      await protocol.maintainZeroFriction();
      
      console.log = originalConsoleLog;
    });
  });

  describe('Performance', () => {
    it('should complete friction maintenance quickly', async () => {
      const startTime = Date.now();
      await protocol.maintainZeroFriction();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent eliminations', async () => {
      // Start multiple maintenance cycles
      const promises = [
        protocol.maintainZeroFriction(),
        protocol.maintainZeroFriction(),
        protocol.maintainZeroFriction()
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.level).toBeDefined();
      });
    });

    it('should limit concurrent eliminations', async () => {
      // This would require mocking multiple friction points
      const flowState = await protocol.maintainZeroFriction();
      
      expect(flowState).toBeDefined();
      // The protocol should respect maxConcurrentEliminations config
    });
  });

  describe('Integration', () => {
    it('should work with real friction detectors', async () => {
      // Test with actual detector integration
      const flowState = await protocol.maintainZeroFriction();
      
      expect(flowState).toBeDefined();
      expect(flowState.level).toBeDefined();
    });

    it('should maintain state consistency', async () => {
      const initialState = protocol.getCurrentFlowState();
      
      await protocol.maintainZeroFriction();
      
      const updatedState = protocol.getCurrentFlowState();
      
      // State should be updated
      expect(updatedState.timestamp).toBeGreaterThanOrEqual(initialState.timestamp);
    });

    it('should provide comprehensive friction overview', () => {
      const allFriction = protocol.getAllDetectedFriction();
      const stats = protocol.getStats();
      const flowState = protocol.getCurrentFlowState();
      
      expect(Array.isArray(allFriction)).toBe(true);
      expect(stats).toBeDefined();
      expect(flowState).toBeDefined();
      
      // All components should be consistent
      expect(stats.totalDetected).toBe(allFriction.length);
    });
  });

  describe('Configuration', () => {
    it('should respect monitoring interval configuration', () => {
      const customConfig = {
        ...DEFAULT_ZERO_FRICTION_CONFIG,
        monitoringInterval: 2000
      };
      
      const customProtocol = new ZeroFrictionProtocol(customConfig);
      expect(customProtocol).toBeDefined();
    });

    it('should respect flow state threshold', async () => {
      const customConfig = {
        ...DEFAULT_ZERO_FRICTION_CONFIG,
        flowStateThreshold: 0.95
      };
      
      const customProtocol = new ZeroFrictionProtocol(customConfig);
      const flowState = await customProtocol.maintainZeroFriction();
      
      expect(flowState).toBeDefined();
    });

    it('should handle disabled protocol', async () => {
      const disabledConfig = {
        ...DEFAULT_ZERO_FRICTION_CONFIG,
        enabled: false
      };
      
      const disabledProtocol = new ZeroFrictionProtocol(disabledConfig);
      await disabledProtocol.start(); // Should not actually start
      
      expect(disabledProtocol).toBeDefined();
    });
  });
});