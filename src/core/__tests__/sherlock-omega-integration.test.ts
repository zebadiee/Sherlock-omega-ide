/**
 * Integration Tests for SherlockOmegaSystem
 * 
 * Tests the complete integrated system including:
 * - System startup and shutdown
 * - Evolution request processing
 * - Safety validation integration
 * - Component health monitoring
 * - Safe mode handling
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

describe('SherlockOmegaSystem Integration', () => {
  let system: SherlockOmegaSystem;
  let mockConfig: typeof DEFAULT_CONFIG;

  beforeEach(() => {
    mockConfig = {
      ...DEFAULT_CONFIG,
      platform: PlatformType.WEB
    };
    
    system = new SherlockOmegaSystem(mockConfig);
  });

  afterEach(async () => {
    if (system.running) {
      await system.stop();
    }
    jest.clearAllMocks();
  });

  describe('System Lifecycle', () => {
    it('should initialize system with correct configuration', () => {
      expect(system).toBeDefined();
      expect(system.running).toBe(false);
      expect(system.safeMode).toBe(false);
    });

    it('should start system successfully', async () => {
      await system.start();
      
      expect(system.running).toBe(true);
      expect(system.safeMode).toBe(false);
    });

    it('should stop system gracefully', async () => {
      await system.start();
      expect(system.running).toBe(true);
      
      await system.stop();
      expect(system.running).toBe(false);
    });

    it('should handle multiple start calls gracefully', async () => {
      await system.start();
      expect(system.running).toBe(true);
      
      // Second start should not throw
      await system.start();
      expect(system.running).toBe(true);
    });

    it('should handle stop when not running', async () => {
      expect(system.running).toBe(false);
      
      // Stop when not running should not throw
      await system.stop();
      expect(system.running).toBe(false);
    });
  });

  describe('Evolution Request Processing', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should process safe evolution requests successfully', async () => {
      const request: EvolutionRequest = {
        id: 'safe-test-001',
        type: 'feature',
        description: 'Add safe feature with comprehensive tests',
        priority: 'medium',
        requestedBy: 'test-system',
        targetFiles: ['src/feature.ts'],
        requirements: ['95% test coverage', 'security validation']
      };

      // Mock safety validation to approve
      const mockSafetyResult = {
        isValid: true,
        confidence: 0.95,
        issues: [],
        recommendations: ['Monitor deployment'],
        coverageMetrics: { overall: 1.0 },
        riskAssessment: { overallRisk: 'low' },
        timestamp: new Date()
      };

      // Mock evolution engine success
      const mockEvolutionResult = {
        success: true,
        evolutionId: 'evo-safe-test-001',
        changes: []
      };

      jest.spyOn(system.safety, 'validateEvolutionSafety').mockResolvedValue(mockSafetyResult as any);
      jest.spyOn(system.evolution, 'processEvolution').mockResolvedValue(mockEvolutionResult as any);

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(true);
      expect(result.evolutionId).toBeDefined();
      expect(system.safety.validateEvolutionSafety).toHaveBeenCalled();
      expect(system.evolution.processEvolution).toHaveBeenCalled();
    });

    it('should block unsafe evolution requests', async () => {
      const request: EvolutionRequest = {
        id: 'unsafe-test-002',
        type: 'feature',
        description: 'Add risky feature without tests',
        priority: 'high',
        requestedBy: 'test-system',
        targetFiles: ['src/payment.ts'],
        requirements: ['fast implementation']
      };

      // Mock safety validation to reject
      const mockSafetyResult = {
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
        recommendations: ['Add comprehensive tests'],
        coverageMetrics: { overall: 0.0 },
        riskAssessment: { overallRisk: 'critical' },
        timestamp: new Date()
      };

      jest.spyOn(system.safety, 'validateEvolutionSafety').mockResolvedValue(mockSafetyResult as any);

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Safety validation failed');
      expect(system.safety.validateEvolutionSafety).toHaveBeenCalled();
    });

    it('should reject requests when system not running', async () => {
      await system.stop();
      
      const request: EvolutionRequest = {
        id: 'test-not-running',
        type: 'bugfix',
        description: 'Test when system not running',
        priority: 'low',
        requestedBy: 'test-system'
      };

      const result = await system.requestEvolution(request);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('System not running');
    });

    it('should reject requests in safe mode', async () => {
      await system.enterSafeMode();
      
      const request: EvolutionRequest = {
        id: 'test-safe-mode',
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

  describe('System Health Monitoring', () => {
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
      expect(status.components).toHaveProperty('safetyValidation');
      expect(status.components).toHaveProperty('evolutionEngine');
      expect(status.components).toHaveProperty('aiOrchestrator');
      expect(status.components).toHaveProperty('monitoring');
    });

    it('should track evolution metrics', async () => {
      // Process some evolutions to generate metrics
      const requests = [
        {
          id: 'metrics-1',
          type: 'feature' as const,
          description: 'Test metrics 1',
          priority: 'low' as const,
          requestedBy: 'test'
        },
        {
          id: 'metrics-2',
          type: 'bugfix' as const,
          description: 'Test metrics 2',
          priority: 'medium' as const,
          requestedBy: 'test'
        }
      ];

      // Mock one success, one failure
      jest.spyOn(system.safety, 'validateEvolutionSafety')
        .mockResolvedValueOnce({ isValid: true, confidence: 0.9 } as any)
        .mockResolvedValueOnce({ isValid: false, confidence: 0.1, issues: [{ blocking: true }] } as any);
      
      jest.spyOn(system.evolution, 'processEvolution')
        .mockResolvedValue({ success: true } as any);

      await system.requestEvolution(requests[0]);
      await system.requestEvolution(requests[1]);

      const status = await system.getSystemStatus();
      
      expect(status.metrics.totalEvolutions).toBe(2);
      expect(status.metrics.blockedEvolutions).toBe(1);
      expect(status.metrics.successRate).toBe(0.5);
    });
  });

  describe('Safe Mode Operations', () => {
    beforeEach(async () => {
      await system.start();
    });

    it('should enter safe mode successfully', async () => {
      expect(system.safeMode).toBe(false);
      
      await system.enterSafeMode();
      
      expect(system.safeMode).toBe(true);
    });

    it('should exit safe mode successfully', async () => {
      await system.enterSafeMode();
      expect(system.safeMode).toBe(true);
      
      await system.exitSafeMode();
      
      expect(system.safeMode).toBe(false);
    });

    it('should handle multiple safe mode entries gracefully', async () => {
      await system.enterSafeMode();
      expect(system.safeMode).toBe(true);
      
      // Second entry should not throw
      await system.enterSafeMode();
      expect(system.safeMode).toBe(true);
    });

    it('should handle safe mode exit when not in safe mode', async () => {
      expect(system.safeMode).toBe(false);
      
      // Exit when not in safe mode should not throw
      await system.exitSafeMode();
      expect(system.safeMode).toBe(false);
    });

    it('should show safe mode in system status', async () => {
      await system.enterSafeMode();
      
      const status = await system.getSystemStatus();
      
      expect(status.overall).toBe('safe_mode');
    });
  });

  describe('Component Access', () => {
    it('should provide access to all components', () => {
      expect(system.safety).toBeDefined();
      expect(system.evolution).toBeDefined();
      expect(system.ai).toBeDefined();
      expect(system.monitoring).toBeDefined();
      expect(system.performance).toBeDefined();
    });

    it('should provide system state properties', () => {
      expect(typeof system.running).toBe('boolean');
      expect(typeof system.safeMode).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle component initialization errors', () => {
      // Mock a component to throw during initialization
      const badConfig = {
        ...DEFAULT_CONFIG,
        platform: 'INVALID' as any
      };

      expect(() => new SherlockOmegaSystem(badConfig)).not.toThrow();
    });

    it('should handle evolution processing errors gracefully', async () => {
      await system.start();
      
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