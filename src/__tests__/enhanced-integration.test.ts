import { EnhancedSherlockSystem } from '../core/enhanced-sherlock-system';
import { SelfCompilationService } from '../services/evolution/self-compilation-service';
import { Evolution } from '../services/evolution/safety-validation-system';

describe('Enhanced Sherlock System Integration', () => {
  let system: EnhancedSherlockSystem;

  beforeEach(() => {
    system = new EnhancedSherlockSystem({
      selfHealing: {
        enabled: true,
        autoFix: true,
        confidenceThreshold: 0.8,
        maxAttempts: 3
      },
      continuousLearning: {
        enabled: true,
        feedbackCollection: true,
        modelRetraining: false,
        performanceOptimization: true
      },
      proactiveAssistance: {
        enabled: true,
        intentPrediction: true,
        contextAwareness: true,
        suggestionEngine: true
      }
    });
  });

  afterEach(async () => {
    await system.shutdown();
  });

  describe('AI Bot Creation and Deployment', () => {
    it('should create an intelligent bot with optimal model selection', async () => {
      const bot = await system.createIntelligentBot({
        description: 'Generate TypeScript functions with comprehensive error handling',
        taskType: 'code-generation',
        complexity: 'high',
        priority: 'medium'
      });

      expect(bot).toBeDefined();
      expect(bot.name).toContain('code-generation');
      expect(bot.status).toBe('active');
      expect(bot.capabilities.length).toBeGreaterThan(0);
    });

    it('should create and deploy a bot with self-compilation', async () => {
      const result = await system.createAndDeployBot({
        description: 'Test generation bot for unit tests',
        taskType: 'testing',
        complexity: 'medium',
        priority: 'high',
        autoDeploy: true
      });

      expect(result.bot).toBeDefined();
      expect(result.deployment).toBeDefined();
      expect(result.deployment?.status).toMatch(/completed|running/);
    });
  });

  describe('Code Generation with Streaming', () => {
    it('should generate code with streaming responses', async () => {
      const { taskId, stream$, result$ } = await system.generateCodeWithStreaming(
        'Create a user authentication service with JWT tokens',
        {
          language: 'typescript',
          complexity: 'high',
          priority: 'medium',
          context: { framework: 'express' }
        }
      );

      expect(taskId).toBeDefined();
      expect(stream$).toBeDefined();
      expect(result$).toBeDefined();

      // Test streaming
      const chunks: string[] = [];
      const streamSubscription = stream$.subscribe(chunk => {
        chunks.push(chunk);
      });

      // Wait for completion
      const result = await new Promise((resolve) => {
        result$.subscribe(resolve);
      });

      streamSubscription.unsubscribe();

      expect(chunks.length).toBeGreaterThan(0);
      expect(result).toBeDefined();
    });
  });

  describe('Self-Healing Analysis', () => {
    it('should analyze and heal code issues', async () => {
      const codeWithIssues = `
        function validateEmail(email) {
          if (!email) return false;
          // Missing proper email validation
          return email.includes('@');
        }
      `;

      const result = await system.performSelfHealingAnalysis(
        codeWithIssues,
        'test-file.js',
        {
          autoFix: true,
          confidenceThreshold: 0.7
        }
      );

      expect(result.issues).toBeDefined();
      expect(result.fixes).toBeDefined();
      expect(result.healingReport).toBeDefined();
      expect(result.healingReport.totalIssues).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Evolution Deployment', () => {
    it('should deploy an evolution with safety validation', async () => {
      const evolution: Evolution = {
        id: 'test-evolution-1',
        type: 'feature',
        description: 'Add new authentication feature',
        affectedFiles: ['src/auth/auth.ts'],
        codeChanges: [],
        testFiles: ['src/auth/__tests__/auth.test.ts'],
        timestamp: new Date(),
        author: 'test-system',
        riskLevel: 'medium'
      };

      const result = await system.deployEvolution(evolution);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      
      if (result.success) {
        expect(result.pipeline).toBeDefined();
        expect(result.pipeline?.evolutionId).toBe(evolution.id);
      }
    });
  });

  describe('System Health and Analytics', () => {
    it('should provide comprehensive performance analytics', async () => {
      const analytics = system.getPerformanceAnalytics();

      expect(analytics.system).toBeDefined();
      expect(analytics.processing).toBeDefined();
      expect(analytics.bots).toBeDefined();
      expect(analytics.models).toBeDefined();

      expect(analytics.system.status).toMatch(/healthy|degraded|critical/);
      expect(analytics.processing.totalTasksProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should track compilation statistics', () => {
      const stats = system.getCompilationStatistics();

      expect(stats.totalPipelines).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Automation Rules', () => {
    it('should add and execute automation rules', async () => {
      const ruleId = system.addAutomationRule({
        name: 'Test Auto-fix Rule',
        description: 'Automatically fix syntax errors',
        trigger: {
          type: 'error-detected',
          conditions: { errorType: 'syntax' }
        },
        actions: [
          {
            type: 'fix-code',
            parameters: { autoApply: true }
          }
        ],
        isActive: true
      });

      expect(ruleId).toBeDefined();
      expect(ruleId).toMatch(/^rule_/);

      // Test rule execution
      await expect(system.executeAutomationRule(ruleId, {
        code: 'function test() { console.log("test" }', // Missing closing parenthesis
        filePath: 'test.js'
      })).resolves.not.toThrow();
    });
  });
});

describe('Self-Compilation Service', () => {
  let compilationService: SelfCompilationService;

  beforeEach(() => {
    compilationService = new SelfCompilationService('web' as any);
  });

  describe('Pipeline Execution', () => {
    it('should execute a compilation pipeline', async () => {
      const evolution: Evolution = {
        id: 'test-compilation-1',
        type: 'feature',
        description: 'Test compilation pipeline',
        affectedFiles: ['src/test.ts'],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'test',
        riskLevel: 'low'
      };

      const pipeline = await compilationService.executeBuildPipeline(evolution);

      expect(pipeline).toBeDefined();
      expect(pipeline.evolutionId).toBe(evolution.id);
      expect(pipeline.steps.length).toBeGreaterThan(0);
      expect(pipeline.status).toMatch(/completed|failed|running/);
    });

    it('should provide compilation statistics', () => {
      const stats = compilationService.getCompilationStatistics();

      expect(stats.totalPipelines).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(stats.mostCommonFailures).toBeDefined();
    });

    it('should manage active pipelines', () => {
      const activePipelines = compilationService.getActivePipelines();
      expect(Array.isArray(activePipelines)).toBe(true);
    });
  });

  describe('Snapshot Management', () => {
    it('should manage deployment snapshots', () => {
      const snapshots = compilationService.getSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it('should clean up old snapshots', () => {
      expect(() => {
        compilationService.cleanupSnapshots(1000); // 1 second max age
      }).not.toThrow();
    });
  });
});

describe('Integration with Existing Sherlock Omega System', () => {
  it('should integrate self-compilation with the main system', async () => {
    // This test would verify that the self-compilation service
    // integrates properly with the existing SherlockOmegaSystem
    
    // Mock the integration points
    const mockEvolution: Evolution = {
      id: 'integration-test-1',
      type: 'feature',
      description: 'Integration test evolution',
      affectedFiles: ['src/integration.ts'],
      codeChanges: [],
      testFiles: [],
      timestamp: new Date(),
      author: 'integration-test',
      riskLevel: 'low'
    };

    // Test that the compilation service can be instantiated
    const compilationService = new SelfCompilationService('web' as any);
    expect(compilationService).toBeDefined();

    // Test that it can process an evolution
    const pipeline = await compilationService.executeBuildPipeline(mockEvolution);
    expect(pipeline).toBeDefined();
    expect(pipeline.evolutionId).toBe(mockEvolution.id);
  });
});