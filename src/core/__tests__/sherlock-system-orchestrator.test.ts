/**
 * Integration Tests for SherlockOmegaSystem
 * 
 * Verifies that the master system correctly integrates all components
 * and handles evolution requests with safety validation.
 */

import { SherlockOmegaSystem, DEFAULT_CONFIG } from '../sherlock-omega-system';
import { SafetyValidationSystem } from '../../services/evolution/safety-validation-system';
import { SelfEvolutionEngine } from '../../services/evolution/self-evolution-engine';
import { EnhancedAIOrchestrator } from '../../ai/enhanced-ai-orchestrator';
import { MonitoringService } from '../../monitoring/monitoring-service';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import { Logger } from '../../logging/logger';
import { PlatformType } from '../whispering-interfaces';

// Mock dependencies
jest.mock('../../services/evolution/safety-validation-system');
jest.mock('../../services/evolution/self-evolution-engine');
jest.mock('../../ai/enhanced-ai-orchestrator');
jest.mock('../../monitoring/monitoring-service');
jest.mock('../../monitoring/performance-monitor');
jest.mock('../../logging/logger');

describe('SherlockOmegaSystem Integration Tests', () => {
  let system: SherlockOmegaSystem;
  let mockAIOrchestrator: jest.Mocked<EnhancedAIOrchestrator>;
  let mockSafetyValidator: jest.Mocked<SafetyValidationSystem>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mocks
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    mockAIOrchestrator = {
      processEnhancedRequest: jest.fn()
    } as any;

    mockSafetyValidator = {
      validateEvolutionSafety: jest.fn()
    } as any;

    // Mock constructors
    (Logger as jest.Mock).mockImplementation(() => mockLogger);
    (EnhancedAIOrchestrator as jest.Mock).mockImplementation(() => mockAIOrchestrator);
    (SafetyValidationSystem as jest.Mock).mockImplementation(() => mockSafetyValidator);

    // Create orchestrator
    orchestrator = new SherlockSystemOrchestrator(PlatformType.WEB);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('System Initialization', () => {
    it('should initialize all components correctly', () => {
      expect(Logger).toHaveBeenCalledWith(PlatformType.WEB);
      expect(EnhancedAIOrchestrator).toHaveBeenCalledWith(PlatformType.WEB);
      expect(SafetyValidationSystem).toHaveBeenCalledWith(PlatformType.WEB);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '👑 Sherlock System Orchestrator Initialized. All systems online.'
      );
    });

    it('should create orchestrator with correct platform type', () => {
      const desktopOrchestrator = new SherlockSystemOrchestrator(PlatformType.DESKTOP);
      
      expect(Logger).toHaveBeenCalledWith(PlatformType.DESKTOP);
      expect(EnhancedAIOrchestrator).toHaveBeenCalledWith(PlatformType.DESKTOP);
      expect(SafetyValidationSystem).toHaveBeenCalledWith(PlatformType.DESKTOP);
    });
  });

  describe('AI Request Routing', () => {
    it('should route AI requests to EnhancedAIOrchestrator', async () => {
      const mockRequest = {
        id: 'ai-req-001',
        type: 'code-analysis',
        code: 'const x = 1;',
        context: { language: 'typescript' }
      };

      const mockResponse = {
        id: 'ai-req-001',
        result: 'Analysis complete',
        confidence: 0.95,
        processingTime: 150
      };

      mockAIOrchestrator.processEnhancedRequest.mockResolvedValue(mockResponse as any);

      const result = await orchestrator.handleAIRequest(mockRequest as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Orchestrator: Routing AI request ai-req-001 to AI engine.'
      );
      expect(mockAIOrchestrator.processEnhancedRequest).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle AI request errors gracefully', async () => {
      const mockRequest = {
        id: 'ai-req-error',
        type: 'code-analysis',
        code: 'invalid code',
        context: {}
      };

      const error = new Error('AI processing failed');
      mockAIOrchestrator.processEnhancedRequest.mockRejectedValue(error);

      await expect(orchestrator.handleAIRequest(mockRequest as any))
        .rejects.toThrow('AI processing failed');

      expect(mockAIOrchestrator.processEnhancedRequest).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle multiple concurrent AI requests', async () => {
      const requests = [
        { id: 'req-1', type: 'explanation', code: 'code1', context: {} },
        { id: 'req-2', type: 'completion', code: 'code2', context: {} },
        { id: 'req-3', type: 'refactor', code: 'code3', context: {} }
      ];

      const responses = requests.map(req => ({
        id: req.id,
        result: `Result for ${req.id}`,
        confidence: 0.9,
        processingTime: 100
      }));

      mockAIOrchestrator.processEnhancedRequest
        .mockResolvedValueOnce(responses[0] as any)
        .mockResolvedValueOnce(responses[1] as any)
        .mockResolvedValueOnce(responses[2] as any);

      const results = await Promise.all(
        requests.map(req => orchestrator.handleAIRequest(req as any))
      );

      expect(results).toHaveLength(3);
      expect(mockAIOrchestrator.processEnhancedRequest).toHaveBeenCalledTimes(3);
      results.forEach((result, index) => {
        expect(result.id).toBe(requests[index].id);
      });
    });
  });

  describe('Evolution Safety Validation', () => {
    it('should validate and approve safe evolutions', async () => {
      const mockEvolution = {
        id: 'evo-safe-001',
        type: 'optimization',
        description: 'Safe code optimization',
        affectedFiles: ['src/utils.ts'],
        codeChanges: [{
          filePath: 'src/utils.ts',
          changeType: 'modify',
          linesAdded: 10,
          linesRemoved: 5,
          complexity: 3,
          hasTests: true
        }],
        testFiles: ['src/__tests__/utils.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const mockValidationResult = {
        isValid: true,
        confidence: 0.95,
        issues: [],
        recommendations: ['Monitor deployment'],
        coverageMetrics: { overall: 1.0 },
        riskAssessment: { overallRisk: 'low' },
        timestamp: new Date()
      };

      mockSafetyValidator.validateEvolutionSafety.mockResolvedValue(mockValidationResult as any);

      await orchestrator.proposeAndExecuteEvolution(mockEvolution as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Orchestrator: Proposing new evolution evo-safe-001.'
      );
      expect(mockSafetyValidator.validateEvolutionSafety).toHaveBeenCalledWith(mockEvolution);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '✅ Evolution evo-safe-001 approved. Proceeding with deployment.'
      );
    });

    it('should block unsafe evolutions', async () => {
      const mockEvolution = {
        id: 'evo-unsafe-002',
        type: 'feature',
        description: 'Risky feature without tests',
        affectedFiles: ['src/payment.ts'],
        codeChanges: [{
          filePath: 'src/payment.ts',
          changeType: 'create',
          linesAdded: 200,
          linesRemoved: 0,
          complexity: 15,
          hasTests: false
        }],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'high'
      };

      const mockValidationResult = {
        isValid: false,
        confidence: 0.1,
        issues: [
          {
            severity: 'critical',
            type: 'coverage',
            description: 'Insufficient test coverage',
            blocking: true
          },
          {
            severity: 'high',
            type: 'complexity',
            description: 'High complexity without adequate testing',
            blocking: true
          }
        ],
        recommendations: ['Add comprehensive tests', 'Reduce complexity'],
        coverageMetrics: { overall: 0.0 },
        riskAssessment: { overallRisk: 'critical' },
        timestamp: new Date()
      };

      mockSafetyValidator.validateEvolutionSafety.mockResolvedValue(mockValidationResult as any);

      await orchestrator.proposeAndExecuteEvolution(mockEvolution as any);

      expect(mockSafetyValidator.validateEvolutionSafety).toHaveBeenCalledWith(mockEvolution);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '❌ Evolution evo-unsafe-002 BLOCKED due to safety concerns.',
        {
          issues: ['Insufficient test coverage', 'High complexity without adequate testing']
        }
      );
    });

    it('should handle safety validation errors', async () => {
      const mockEvolution = {
        id: 'evo-error-003',
        type: 'bugfix',
        description: 'Test error handling',
        affectedFiles: ['src/test.ts'],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const error = new Error('Safety validation system error');
      mockSafetyValidator.validateEvolutionSafety.mockRejectedValue(error);

      await expect(orchestrator.proposeAndExecuteEvolution(mockEvolution as any))
        .rejects.toThrow('Safety validation system error');

      expect(mockSafetyValidator.validateEvolutionSafety).toHaveBeenCalledWith(mockEvolution);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle mixed AI and evolution requests', async () => {
      // Setup AI request
      const aiRequest = {
        id: 'ai-mixed-001',
        type: 'code-generation',
        code: 'generate auth function',
        context: {}
      };

      const aiResponse = {
        id: 'ai-mixed-001',
        result: 'Generated auth function',
        confidence: 0.9,
        processingTime: 200
      };

      mockAIOrchestrator.processEnhancedRequest.mockResolvedValue(aiResponse as any);

      // Setup evolution request
      const evolution = {
        id: 'evo-mixed-001',
        type: 'feature',
        description: 'Add generated auth function',
        affectedFiles: ['src/auth.ts'],
        codeChanges: [{
          filePath: 'src/auth.ts',
          changeType: 'create',
          linesAdded: 50,
          linesRemoved: 0,
          complexity: 6,
          hasTests: true
        }],
        testFiles: ['src/__tests__/auth.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'medium'
      };

      const validationResult = {
        isValid: true,
        confidence: 0.85,
        issues: [],
        recommendations: ['Monitor deployment'],
        coverageMetrics: { overall: 1.0 },
        riskAssessment: { overallRisk: 'low' },
        timestamp: new Date()
      };

      mockSafetyValidator.validateEvolutionSafety.mockResolvedValue(validationResult as any);

      // Execute both requests
      const aiResult = await orchestrator.handleAIRequest(aiRequest as any);
      await orchestrator.proposeAndExecuteEvolution(evolution as any);

      // Verify both systems were called
      expect(mockAIOrchestrator.processEnhancedRequest).toHaveBeenCalledWith(aiRequest);
      expect(mockSafetyValidator.validateEvolutionSafety).toHaveBeenCalledWith(evolution);
      expect(aiResult).toBe(aiResponse);
    });

    it('should maintain system state across multiple operations', async () => {
      // Process multiple requests to verify state consistency
      const requests = [
        { id: 'req-1', type: 'analysis' },
        { id: 'req-2', type: 'completion' },
        { id: 'req-3', type: 'refactor' }
      ];

      mockAIOrchestrator.processEnhancedRequest.mockResolvedValue({
        id: 'response',
        result: 'success',
        confidence: 0.9,
        processingTime: 100
      } as any);

      // Process all requests
      for (const request of requests) {
        await orchestrator.handleAIRequest(request as any);
      }

      // Verify all requests were processed
      expect(mockAIOrchestrator.processEnhancedRequest).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledTimes(4); // 1 init + 3 requests
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle component initialization failures', () => {
      (SafetyValidationSystem as jest.Mock).mockImplementation(() => {
        throw new Error('Safety system initialization failed');
      });

      expect(() => new SherlockSystemOrchestrator(PlatformType.WEB))
        .toThrow('Safety system initialization failed');
    });

    it('should isolate AI and safety system failures', async () => {
      // AI failure should not affect safety validation
      mockAIOrchestrator.processEnhancedRequest.mockRejectedValue(new Error('AI failed'));
      
      const aiRequest = { id: 'ai-fail', type: 'analysis', code: 'test', context: {} };
      await expect(orchestrator.handleAIRequest(aiRequest as any)).rejects.toThrow('AI failed');

      // Safety validation should still work
      const evolution = {
        id: 'evo-after-ai-fail',
        type: 'bugfix',
        description: 'Test after AI failure',
        affectedFiles: [],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      mockSafetyValidator.validateEvolutionSafety.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
        recommendations: [],
        coverageMetrics: { overall: 1.0 },
        riskAssessment: { overallRisk: 'low' },
        timestamp: new Date()
      } as any);

      await expect(orchestrator.proposeAndExecuteEvolution(evolution as any))
        .resolves.not.toThrow();
    });
  });
});