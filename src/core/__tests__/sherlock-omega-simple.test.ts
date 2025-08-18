/**
 * Simple Integration Tests for SherlockOmegaSystem
 * 
 * Tests the basic functionality of the integrated system
 */

import { SherlockOmegaSystem, DEFAULT_CONFIG, EvolutionRequest } from '../sherlock-omega-system';
import { PlatformType } from '../whispering-interfaces';

// Mock all dependencies
jest.mock('../../services/evolution/safety-validation-system');
jest.mock('../../services/evolution/self-evolution-engine');
jest.mock('../../ai/enhanced-ai-orchestrator');
jest.mock('../../monitoring/monitoring-service');
jest.mock('../../monitoring/performance-monitor');
jest.mock('../../logging/logger');

describe('SherlockOmegaSystem Simple Integration', () => {
  let system: SherlockOmegaSystem;

  beforeEach(() => {
    const config = {
      ...DEFAULT_CONFIG,
      platform: PlatformType.WEB
    };
    
    system = new SherlockOmegaSystem(config);
  });

  afterEach(async () => {
    if (system.running) {
      await system.stop();
    }
    jest.clearAllMocks();
  });

  describe('Basic System Operations', () => {
    it('should create system instance', () => {
      expect(system).toBeDefined();
      expect(system.running).toBe(false);
      expect(system.safeMode).toBe(false);
    });

    it('should start and stop system', async () => {
      // Start system
      await system.start();
      expect(system.running).toBe(true);
      
      // Stop system
      await system.stop();
      expect(system.running).toBe(false);
    });

    it('should provide component access', () => {
      expect(system.safety).toBeDefined();
      expect(system.evolution).toBeDefined();
      expect(system.ai).toBeDefined();
      expect(system.monitoring).toBeDefined();
      expect(system.performance).toBeDefined();
    });
  });

  describe('Evolution Request Handling', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should handle evolution requests when system running', async () => {
      const request: EvolutionRequest = {
        id: 'test-001',
        type: 'feature',
        description: 'Test feature',
        priority: 'medium',
        requestedBy: 'test-system'
      };

      // Mock safety validation to approve
      jest.spyOn(system.safety, 'validateEvolutionSafety').mockResolvedValue({
        isValid: true,
        confidence: 0.9,
        issues: [],
        recommendations: [],
        coverageMetrics: { overall: 1.0 },
        riskAssessment: { overallRisk: 'low' },
        timestamp: new Date()
      } as any);

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(true);
      expect(result.evolutionId).toBeDefined();
    });

    it('should reject evolution when system not running', async () => {
      await system.stop();
      
      const request: EvolutionRequest = {
        id: 'test-002',
        type: 'bugfix',
        description: 'Test bugfix',
        priority: 'low',
        requestedBy: 'test-system'
      };

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('System not running');
    });

    it('should block unsafe evolutions', async () => {
      const request: EvolutionRequest = {
        id: 'unsafe-001',
        type: 'feature',
        description: 'Unsafe feature',
        priority: 'high',
        requestedBy: 'test-system'
      };

      // Mock safety validation to reject
      jest.spyOn(system.safety, 'validateEvolutionSafety').mockResolvedValue({
        isValid: false,
        confidence: 0.1,
        issues: [
          {
            severity: 'critical',
            type: 'coverage',
            description: 'Insufficient test coverage',
            blocking: true
          }
        ],
        recommendations: ['Add tests'],
        coverageMetrics: { overall: 0.0 },
        riskAssessment: { overallRisk: 'critical' },
        timestamp: new Date()
      } as any);

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Safety validation failed');
    });
  });

  describe('Safe Mode Operations', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should enter and exit safe mode', async () => {
      expect(system.safeMode).toBe(false);
      
      await system.enterSafeMode();
      expect(system.safeMode).toBe(true);
      
      await system.exitSafeMode();
      expect(system.safeMode).toBe(false);
    });

    it('should reject evolutions in safe mode', async () => {
      await system.enterSafeMode();
      
      const request: EvolutionRequest = {
        id: 'safe-mode-test',
        type: 'bugfix',
        description: 'Test in safe mode',
        priority: 'low',
        requestedBy: 'test-system'
      };

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('System in safe mode - manual intervention required');
    });
  });

  describe('System Status', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should return system status', async () => {
      const status = await system.getSystemStatus();

      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('components');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('lastHealthCheck');
      
      expect(status.overall).toBe('healthy');
      expect(status.metrics.totalEvolutions).toBe(0);
      expect(status.metrics.blockedEvolutions).toBe(0);
      expect(status.metrics.successRate).toBe(1.0);
    });

    it('should show safe mode in status', async () => {
      await system.enterSafeMode();
      
      const status = await system.getSystemStatus();
      
      expect(status.overall).toBe('safe_mode');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should handle safety validation errors', async () => {
      const request: EvolutionRequest = {
        id: 'error-test',
        type: 'feature',
        description: 'Test error handling',
        priority: 'medium',
        requestedBy: 'test-system'
      };

      // Mock safety validation to throw
      jest.spyOn(system.safety, 'validateEvolutionSafety')
        .mockRejectedValue(new Error('Safety system error'));

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('System error');
    });
  });
});