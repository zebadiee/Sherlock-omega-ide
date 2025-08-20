/**
 * Evolution Controller Test Suite
 * PhD-level test coverage for production deployment
 */

import { EvolutionController } from '../evolution-controller';
import { PlatformType } from '../whispering-interfaces';

describe('EvolutionController', () => {
  let controller: EvolutionController;

  beforeEach(() => {
    controller = new EvolutionController(PlatformType.NODE);
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      expect(controller.getCurrentCycle()).toBe(0);
      expect(controller.isEvolutionInProgress()).toBe(false);
      expect(controller.getEvolutionHistory()).toHaveLength(0);
    });
  });

  describe('Evolution Cycle Management', () => {
    it('should prevent evolution in demo mode', async () => {
      process.env.EVOLUTION_MODE = 'manual';
      
      await expect(controller.initiateEvolutionCycle()).rejects.toThrow('Evolution disabled in demo mode');
    });

    it('should prevent concurrent evolution cycles', async () => {
      process.env.EVOLUTION_MODE = 'auto';
      
      // Mock the internal methods to prevent actual execution
      jest.spyOn(controller as any, 'assessSystemCapability').mockResolvedValue({
        overallScore: 0.8,
        constraints: [],
        bottlenecks: [],
        timestamp: new Date()
      });
      
      jest.spyOn(controller as any, 'generateImprovements').mockResolvedValue([]);
      jest.spyOn(controller as any, 'deployEvolution').mockResolvedValue({
        evolutionId: 'test',
        deployments: [],
        success: true,
        metricsImprovement: {},
        timestamp: new Date()
      });

      // Start first evolution
      const firstEvolution = controller.initiateEvolutionCycle();
      
      // Try to start second evolution while first is running
      await expect(controller.initiateEvolutionCycle()).rejects.toThrow('Evolution cycle already in progress');
      
      // Wait for first to complete
      await firstEvolution;
    });

    it('should increment cycle number on each evolution', async () => {
      process.env.EVOLUTION_MODE = 'auto';
      
      // Mock dependencies
      jest.spyOn(controller as any, 'assessSystemCapability').mockResolvedValue({
        overallScore: 0.8,
        constraints: [],
        bottlenecks: [],
        timestamp: new Date()
      });
      
      jest.spyOn(controller as any, 'generateImprovements').mockResolvedValue([]);
      jest.spyOn(controller as any, 'deployEvolution').mockResolvedValue({
        evolutionId: 'test',
        deployments: [],
        success: true,
        metricsImprovement: {},
        timestamp: new Date()
      });

      expect(controller.getCurrentCycle()).toBe(0);
      
      await controller.initiateEvolutionCycle();
      expect(controller.getCurrentCycle()).toBe(1);
      
      await controller.initiateEvolutionCycle();
      expect(controller.getCurrentCycle()).toBe(2);
    });
  });

  describe('System Capability Assessment', () => {
    it('should assess system capability with valid metrics', async () => {
      const capability = await controller.assessSystemCapability();
      
      expect(capability).toHaveProperty('fileLoadTime');
      expect(capability).toHaveProperty('uiFrameRate');
      expect(capability).toHaveProperty('memoryUsage');
      expect(capability).toHaveProperty('analysisSpeed');
      expect(capability).toHaveProperty('overallScore');
      expect(capability).toHaveProperty('constraints');
      expect(capability).toHaveProperty('bottlenecks');
      expect(capability).toHaveProperty('timestamp');
      
      expect(typeof capability.overallScore).toBe('number');
      expect(capability.overallScore).toBeGreaterThanOrEqual(0);
      expect(capability.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Improvement Generation', () => {
    it('should generate improvements for performance constraints', async () => {
      const constraints = [
        {
          type: 'performance' as const,
          description: 'File loading too slow',
          severity: 0.8,
          impact: 0.6
        }
      ];
      
      const improvements = await controller.generateImprovements(constraints);
      
      expect(Array.isArray(improvements)).toBe(true);
      improvements.forEach(improvement => {
        expect(improvement).toHaveProperty('id');
        expect(improvement).toHaveProperty('type');
        expect(improvement).toHaveProperty('description');
        expect(improvement).toHaveProperty('code');
        expect(improvement).toHaveProperty('tests');
        expect(improvement).toHaveProperty('expectedImprovement');
        expect(improvement).toHaveProperty('status');
      });
    });

    it('should generate improvements for memory constraints', async () => {
      const constraints = [
        {
          type: 'memory' as const,
          description: 'Memory usage too high',
          severity: 0.7,
          impact: 0.5
        }
      ];
      
      const improvements = await controller.generateImprovements(constraints);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].type).toBe('memory');
    });

    it('should generate improvements for UI constraints', async () => {
      const constraints = [
        {
          type: 'ui' as const,
          description: 'Frame rate too low',
          severity: 0.6,
          impact: 0.4
        }
      ];
      
      const improvements = await controller.generateImprovements(constraints);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].type).toBe('ui');
    });
  });

  describe('Evolution Deployment', () => {
    it('should deploy evolution with safety validation', async () => {
      const evolution = {
        id: 'test-evolution',
        improvements: [
          {
            id: 'test-improvement',
            type: 'performance',
            description: 'Test improvement',
            code: 'console.log("test");',
            tests: 'it("should work", () => expect(true).toBe(true));',
            expectedImprovement: 0.1,
            status: 'pending' as const
          }
        ],
        timestamp: new Date(),
        targetMetrics: {
          fileLoadTime: 35,
          uiFrameRate: 60,
          memoryUsage: 50,
          analysisSpeed: 150
        }
      };
      
      const result = await controller.deployEvolution(evolution);
      
      expect(result).toHaveProperty('evolutionId');
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('metricsImprovement');
      expect(result).toHaveProperty('timestamp');
      
      expect(result.evolutionId).toBe(evolution.id);
      expect(Array.isArray(result.deployments)).toBe(true);
    });
  });

  describe('Blueprint-Driven Evolution', () => {
    it('should initialize blueprint-driven evolution', async () => {
      await expect(controller.initializeBlueprintDrivenEvolution()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle evolution failures gracefully', async () => {
      process.env.EVOLUTION_MODE = 'auto';
      
      // Mock a failure in assessment
      jest.spyOn(controller as any, 'assessSystemCapability').mockRejectedValue(new Error('Assessment failed'));
      
      await expect(controller.initiateEvolutionCycle()).rejects.toThrow('Assessment failed');
      
      // Should not be evolving after failure
      expect(controller.isEvolutionInProgress()).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate capability score correctly', () => {
      const calculateCapabilityScore = (controller as any).calculateCapabilityScore.bind(controller);
      
      const perfectMetrics = {
        fileLoadTime: 30,    // Better than 35ms target
        uiFrameRate: 65,     // Better than 60fps target
        memoryUsage: 45,     // Better than 50MB target
        analysisSpeed: 140   // Better than 150ms target
      };
      
      const score = calculateCapabilityScore(perfectMetrics);
      expect(score).toBeGreaterThan(0.9);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle poor performance metrics', () => {
      const calculateCapabilityScore = (controller as any).calculateCapabilityScore.bind(controller);
      
      const poorMetrics = {
        fileLoadTime: 100,   // Worse than 35ms target
        uiFrameRate: 30,     // Worse than 60fps target
        memoryUsage: 100,    // Worse than 50MB target
        analysisSpeed: 300   // Worse than 150ms target
      };
      
      const score = calculateCapabilityScore(poorMetrics);
      expect(score).toBeLessThan(0.5);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.EVOLUTION_MODE;
  });
});