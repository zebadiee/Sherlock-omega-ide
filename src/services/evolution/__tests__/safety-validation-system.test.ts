/**
 * Safety Validation System Tests
 * 
 * Comprehensive tests for autonomous evolution safety validation
 * ensuring ≥95% coverage enforcement and rollback capability.
 */

import { SafetyValidationSystem, Evolution, CodeChange, SystemSnapshot } from '../safety-validation-system';
import { PlatformType } from '../../../core/whispering-interfaces';
import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';

// Mock dependencies
jest.mock('../../../logging/logger');
jest.mock('../../../monitoring/performance-monitor');

describe('SafetyValidationSystem', () => {
  let safetySystem: SafetyValidationSystem;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    mockPerformanceMonitor = {
      recordMetric: jest.fn()
    } as any;

    (Logger as jest.Mock).mockImplementation(() => mockLogger);
    (PerformanceMonitor as jest.Mock).mockImplementation(() => mockPerformanceMonitor);

    safetySystem = new SafetyValidationSystem(PlatformType.WEB);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEvolutionSafety', () => {
    it('should validate evolution with sufficient test coverage', async () => {
      const evolution: Evolution = {
        id: 'evo-001',
        type: 'feature',
        description: 'Add new feature',
        affectedFiles: ['src/feature.ts'],
        codeChanges: [{
          filePath: 'src/feature.ts',
          changeType: 'create',
          linesAdded: 100,
          linesRemoved: 0,
          complexity: 5,
          hasTests: true
        }],
        testFiles: ['src/__tests__/feature.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.coverageMetrics.overall).toBe(1.0); // 100% coverage
      expect(result.riskAssessment.overallRisk).toBe('low');
      expect(result.issues).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting safety validation'),
        expect.any(Object)
      );
    });

    it('should reject evolution with insufficient test coverage', async () => {
      const evolution: Evolution = {
        id: 'evo-002',
        type: 'feature',
        description: 'Add untested feature',
        affectedFiles: ['src/untested.ts'],
        codeChanges: [{
          filePath: 'src/untested.ts',
          changeType: 'create',
          linesAdded: 100,
          linesRemoved: 0,
          complexity: 3,
          hasTests: false // No tests!
        }],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'medium'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.coverageMetrics.overall).toBe(0); // 0% coverage
      expect(result.issues).toHaveLength(2); // Coverage + risk issues
      expect(result.issues[0].type).toBe('coverage');
      expect(result.issues[0].blocking).toBe(true);
      expect(result.recommendations.some(r => r.includes('Generate'))).toBe(true);
    });

    it('should handle high complexity code changes', async () => {
      const evolution: Evolution = {
        id: 'evo-003',
        type: 'refactor',
        description: 'Complex refactoring',
        affectedFiles: ['src/complex.ts'],
        codeChanges: [{
          filePath: 'src/complex.ts',
          changeType: 'modify',
          linesAdded: 50,
          linesRemoved: 30,
          complexity: 15, // High complexity
          hasTests: true
        }],
        testFiles: ['src/__tests__/complex.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'high'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.isValid).toBe(false); // High risk should block
      expect(result.riskAssessment.overallRisk).toBe('high');
      expect(result.issues.some(issue => issue.type === 'complexity')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'security')).toBe(true);
    });

    it('should handle wide-impact changes', async () => {
      const manyFiles = Array.from({ length: 15 }, (_, i) => `src/file${i}.ts`);
      const manyChanges: CodeChange[] = manyFiles.map(filePath => ({
        filePath,
        changeType: 'modify' as const,
        linesAdded: 10,
        linesRemoved: 5,
        complexity: 3,
        hasTests: true
      }));

      const evolution: Evolution = {
        id: 'evo-004',
        type: 'optimization',
        description: 'Wide-impact optimization',
        affectedFiles: manyFiles,
        codeChanges: manyChanges,
        testFiles: manyFiles.map(f => f.replace('src/', 'src/__tests__/').replace('.ts', '.test.ts')),
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'medium'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.riskAssessment.factors.some(f => f.type === 'wide_impact')).toBe(true);
      expect(result.riskAssessment.rollbackComplexity).toBeGreaterThan(0.5);
      expect(result.recommendations.some(r => r.includes('phased deployment'))).toBe(true);
    });

    it('should handle validation system errors gracefully', async () => {
      const evolution: Evolution = {
        id: 'evo-error',
        type: 'feature',
        description: 'Test error handling',
        affectedFiles: ['src/test.ts'],
        codeChanges: [{
          filePath: 'src/test.ts',
          changeType: 'create',
          linesAdded: 50,
          linesRemoved: 0,
          complexity: 5,
          hasTests: true
        }],
        testFiles: ['src/__tests__/test.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      // Mock an error in coverage calculation
      jest.spyOn(safetySystem, 'calculateTestCoverage' as any)
        .mockRejectedValue(new Error('Coverage calculation failed'));

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].description).toContain('Safety validation system error');
      expect(result.riskAssessment.overallRisk).toBe('critical');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Safety validation failed'),
        expect.any(Object)
      );
    });
  });

  describe('calculateTestCoverage', () => {
    it('should calculate coverage correctly for fully tested code', async () => {
      const evolution: Evolution = {
        id: 'evo-coverage-full',
        type: 'feature',
        description: 'Fully tested feature',
        affectedFiles: ['src/tested.ts'],
        codeChanges: [
          {
            filePath: 'src/tested.ts',
            changeType: 'create',
            linesAdded: 100,
            linesRemoved: 0,
            complexity: 5,
            hasTests: true
          },
          {
            filePath: 'src/helper.ts',
            changeType: 'create',
            linesAdded: 50,
            linesRemoved: 0,
            complexity: 3,
            hasTests: true
          }
        ],
        testFiles: ['src/__tests__/tested.test.ts', 'src/__tests__/helper.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const coverage = await safetySystem.calculateTestCoverage(evolution);

      expect(coverage.overall).toBe(1.0); // 100% coverage
      expect(coverage.branches).toBe(100);
      expect(coverage.functions).toBe(100);
      expect(coverage.lines).toBe(100);
      expect(coverage.statements).toBe(100);
      expect(coverage.uncoveredSegments).toHaveLength(0);
      expect(coverage.testFiles).toHaveLength(2);
    });

    it('should calculate coverage correctly for partially tested code', async () => {
      const evolution: Evolution = {
        id: 'evo-coverage-partial',
        type: 'feature',
        description: 'Partially tested feature',
        affectedFiles: ['src/partial.ts'],
        codeChanges: [
          {
            filePath: 'src/tested.ts',
            changeType: 'create',
            linesAdded: 60,
            linesRemoved: 0,
            complexity: 4,
            hasTests: true
          },
          {
            filePath: 'src/untested.ts',
            changeType: 'create',
            linesAdded: 40,
            linesRemoved: 0,
            complexity: 6,
            hasTests: false
          }
        ],
        testFiles: ['src/__tests__/tested.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'medium'
      };

      const coverage = await safetySystem.calculateTestCoverage(evolution);

      expect(coverage.overall).toBe(0.6); // 60% coverage (60/100)
      expect(coverage.uncoveredSegments).toHaveLength(1);
      expect(coverage.uncoveredSegments[0].filePath).toBe('src/untested.ts');
      expect(coverage.uncoveredSegments[0].complexity).toBe(6);
    });

    it('should handle coverage calculation errors', async () => {
      const evolution: Evolution = {
        id: 'evo-coverage-error',
        type: 'feature',
        description: 'Error test',
        affectedFiles: [],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const coverage = await safetySystem.calculateTestCoverage(evolution);

      expect(coverage.overall).toBe(1.0); // Empty changes = 100% coverage
      expect(coverage.uncoveredSegments).toHaveLength(0);
    });
  });

  describe('blockDeploymentForInsufficientCoverage', () => {
    it('should block deployment and log warning', () => {
      const evolution: Evolution = {
        id: 'evo-blocked',
        type: 'feature',
        description: 'Blocked feature',
        affectedFiles: ['src/blocked.ts'],
        codeChanges: [{
          filePath: 'src/blocked.ts',
          changeType: 'create',
          linesAdded: 100,
          linesRemoved: 0,
          complexity: 5,
          hasTests: false
        }],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'high'
      };

      expect(() => {
        safetySystem.blockDeploymentForInsufficientCoverage(evolution);
      }).toThrow('Deployment blocked: Evolution evo-blocked does not meet safety requirements');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Deployment blocked'),
        expect.objectContaining({
          evolutionId: 'evo-blocked',
          reason: 'Insufficient test coverage'
        })
      );
    });
  });

  describe('enterSafeMode', () => {
    it('should enter safe mode successfully', async () => {
      await safetySystem.enterSafeMode();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('ENTERING SAFE MODE')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Safe mode activated successfully')
      );
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'safe_mode_activations',
        1,
        expect.any(String)
      );
    });

    it('should handle safe mode activation errors', async () => {
      // Mock an error in performance monitor
      mockPerformanceMonitor.recordMetric.mockImplementation(() => {
        throw new Error('Performance monitor error');
      });

      await expect(safetySystem.enterSafeMode()).rejects.toThrow('Performance monitor error');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to enter safe mode'),
        expect.any(Object)
      );
    });
  });

  describe('getValidationStatistics', () => {
    it('should return validation statistics', () => {
      const stats = safetySystem.getValidationStatistics();

      expect(stats).toHaveProperty('totalValidations');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('blockedDeployments');
      expect(typeof stats.totalValidations).toBe('number');
      expect(typeof stats.successRate).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
      expect(typeof stats.blockedDeployments).toBe('number');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty evolution gracefully', async () => {
      const evolution: Evolution = {
        id: 'evo-empty',
        type: 'bugfix',
        description: 'Empty evolution',
        affectedFiles: [],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.isValid).toBe(true);
      expect(result.coverageMetrics.overall).toBe(1.0); // No code = 100% coverage
      expect(result.riskAssessment.overallRisk).toBe('low');
    });

    it('should handle evolution with mixed test coverage', async () => {
      const evolution: Evolution = {
        id: 'evo-mixed',
        type: 'feature',
        description: 'Mixed coverage feature',
        affectedFiles: ['src/mixed1.ts', 'src/mixed2.ts', 'src/mixed3.ts'],
        codeChanges: [
          {
            filePath: 'src/mixed1.ts',
            changeType: 'create',
            linesAdded: 30,
            linesRemoved: 0,
            complexity: 3,
            hasTests: true
          },
          {
            filePath: 'src/mixed2.ts',
            changeType: 'create',
            linesAdded: 40,
            linesRemoved: 0,
            complexity: 5,
            hasTests: true
          },
          {
            filePath: 'src/mixed3.ts',
            changeType: 'create',
            linesAdded: 30,
            linesRemoved: 0,
            complexity: 4,
            hasTests: false
          }
        ],
        testFiles: ['src/__tests__/mixed1.test.ts', 'src/__tests__/mixed2.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'medium'
      };

      const result = await safetySystem.validateEvolutionSafety(evolution);

      expect(result.coverageMetrics.overall).toBe(0.7); // 70/100 = 70%
      expect(result.isValid).toBe(false); // Below 95% threshold
      expect(result.issues.some(issue => issue.type === 'coverage')).toBe(true);
    });

    it('should calculate confidence scores correctly', async () => {
      const highConfidenceEvolution: Evolution = {
        id: 'evo-high-confidence',
        type: 'bugfix',
        description: 'Simple bugfix',
        affectedFiles: ['src/simple.ts'],
        codeChanges: [{
          filePath: 'src/simple.ts',
          changeType: 'modify',
          linesAdded: 5,
          linesRemoved: 3,
          complexity: 2,
          hasTests: true
        }],
        testFiles: ['src/__tests__/simple.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      const result = await safetySystem.validateEvolutionSafety(highConfidenceEvolution);

      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.isValid).toBe(true);
      expect(result.riskAssessment.overallRisk).toBe('low');
    });
  });

  describe('performance monitoring', () => {
    it('should record performance metrics for validation', async () => {
      const evolution: Evolution = {
        id: 'evo-perf',
        type: 'feature',
        description: 'Performance test',
        affectedFiles: ['src/perf.ts'],
        codeChanges: [{
          filePath: 'src/perf.ts',
          changeType: 'create',
          linesAdded: 50,
          linesRemoved: 0,
          complexity: 4,
          hasTests: true
        }],
        testFiles: ['src/__tests__/perf.test.ts'],
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: 'low'
      };

      await safetySystem.validateEvolutionSafety(evolution);

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'safety_validation_time',
        expect.any(Number),
        expect.any(String)
      );
    });
  });
});