/**
 * Tests for Dependency Friction Detector
 * Validates dependency friction detection and elimination capabilities
 */

import { 
  DependencyFrictionDetector, 
  DependencyFrictionPoint,
  NpmPackageManager,
  YarnPackageManager,
  DependencyDetectionContext
} from '../DependencyFrictionDetector';
import { DependencySensor } from '../../sensors/DependencySensor';
import { ComputationalIssue, ProblemType, SeverityLevel } from '../../types/core';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn()
}));

describe('DependencyFrictionDetector', () => {
  let detector: DependencyFrictionDetector;
  let mockDependencySensor: jest.Mocked<DependencySensor>;

  beforeEach(() => {
    // Create mock dependency sensor
    mockDependencySensor = {
      addFile: jest.fn(),
      getDependencyIssues: jest.fn(),
      setPackageInfo: jest.fn()
    } as any;

    detector = new DependencyFrictionDetector(mockDependencySensor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Package Manager Detection', () => {
    it('should detect yarn when yarn.lock exists', async () => {
      const fs = require('fs/promises');
      fs.access.mockImplementation((path: string) => {
        if (path === 'yarn.lock') return Promise.resolve();
        return Promise.reject(new Error('File not found'));
      });

      const yarnManager = new YarnPackageManager();
      const hasYarnLock = await yarnManager.detectLockFile();
      
      expect(hasYarnLock).toBe(true);
    });

    it('should detect npm when package-lock.json exists', async () => {
      const fs = require('fs/promises');
      fs.access.mockImplementation((path: string) => {
        if (path === 'package-lock.json') return Promise.resolve();
        return Promise.reject(new Error('File not found'));
      });

      const npmManager = new NpmPackageManager();
      const hasNpmLock = await npmManager.detectLockFile();
      
      expect(hasNpmLock).toBe(true);
    });
  });

  describe('Friction Detection', () => {
    it('should detect missing dependency friction from computational issues', async () => {
      const mockIssue: ComputationalIssue = {
        id: 'test-issue-1',
        type: ProblemType.DEPENDENCY_MISSING,
        severity: SeverityLevel.HIGH,
        context: {
          file: 'src/test.ts',
          line: 1,
          column: 1,
          scope: ['dependency'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: 'DEPENDENCY' as any,
          confidence: 0.9,
          tags: ['missing-dependency', 'lodash']
        }
      };

      mockDependencySensor.getDependencyIssues.mockResolvedValue([mockIssue]);

      const context: DependencyDetectionContext = {
        filePath: 'src/test.ts',
        content: 'import _ from "lodash";'
      };

      const frictionPoints = await detector.detect(context);

      expect(frictionPoints).toHaveLength(1);
      expect(frictionPoints[0].dependencyName).toBe('lodash');
      expect(frictionPoints[0].dependencyType).toBe('missing');
      expect(frictionPoints[0].autoInstallable).toBe(true);
    });

    it('should generate appropriate suggestions for missing dependencies', async () => {
      const mockIssue: ComputationalIssue = {
        id: 'test-issue-2',
        type: ProblemType.DEPENDENCY_MISSING,
        severity: SeverityLevel.HIGH,
        context: {
          file: 'src/test.ts',
          line: 1,
          column: 1,
          scope: ['dependency'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: 'DEPENDENCY' as any,
          confidence: 0.9,
          tags: ['missing-dependency', 'moment']
        }
      };

      mockDependencySensor.getDependencyIssues.mockResolvedValue([mockIssue]);

      const context: DependencyDetectionContext = {
        filePath: 'src/test.ts',
        content: 'import moment from "moment";'
      };

      const frictionPoints = await detector.detect(context);

      expect(frictionPoints[0].suggestions).toContain('npm install moment');
      expect(frictionPoints[0].suggestions).toContain('Consider using dayjs instead');
      expect(frictionPoints[0].suggestions).toContain('Consider using date-fns instead');
    });

    it('should mark certain dependencies as non-auto-installable', async () => {
      const mockIssue: ComputationalIssue = {
        id: 'test-issue-3',
        type: ProblemType.DEPENDENCY_MISSING,
        severity: SeverityLevel.HIGH,
        context: {
          file: 'src/test.ts',
          line: 1,
          column: 1,
          scope: ['dependency'],
          relatedFiles: []
        },
        preconditions: [],
        postconditions: [],
        constraints: [],
        metadata: {
          detectedAt: Date.now(),
          detectedBy: 'DEPENDENCY' as any,
          confidence: 0.9,
          tags: ['missing-dependency', '@types/node']
        }
      };

      mockDependencySensor.getDependencyIssues.mockResolvedValue([mockIssue]);

      const context: DependencyDetectionContext = {
        filePath: 'src/test.ts',
        content: 'import { Buffer } from "buffer";'
      };

      const frictionPoints = await detector.detect(context);

      expect(frictionPoints[0].dependencyName).toBe('@types/node');
      expect(frictionPoints[0].autoInstallable).toBe(false);
    });
  });

  describe('Friction Elimination', () => {
    it('should successfully eliminate friction for auto-installable dependencies', async () => {
      const frictionPoint: DependencyFrictionPoint = {
        id: 'test-friction-1',
        description: 'Missing dependency: lodash',
        severity: 0.8,
        dependencyName: 'lodash',
        dependencyType: 'missing',
        suggestions: ['npm install lodash'],
        autoInstallable: true,
        installCommand: 'npm install lodash',
        packageManager: 'npm',
        filePath: 'src/test.ts',
        line: 1,
        column: 1,
        timestamp: Date.now()
      };

      // Mock package manager methods
      const mockPackageManager = {
        name: 'npm',
        checkInstalled: jest.fn().mockResolvedValue(false),
        install: jest.fn().mockResolvedValue({
          success: true,
          packageName: 'lodash',
          version: '4.17.21',
          duration: 1000
        })
      };

      (detector as any).activePackageManager = mockPackageManager;

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(true);
      expect(frictionPoint.eliminated).toBe(true);
      expect(mockPackageManager.install).toHaveBeenCalledWith('lodash', {
        save: true,
        version: undefined
      });
    });

    it('should skip elimination if dependency is already installed', async () => {
      const frictionPoint: DependencyFrictionPoint = {
        id: 'test-friction-2',
        description: 'Missing dependency: react',
        severity: 0.9,
        dependencyName: 'react',
        dependencyType: 'missing',
        suggestions: ['npm install react'],
        autoInstallable: true,
        installCommand: 'npm install react',
        packageManager: 'npm',
        filePath: 'src/test.tsx',
        line: 1,
        column: 1,
        timestamp: Date.now()
      };

      const mockPackageManager = {
        name: 'npm',
        checkInstalled: jest.fn().mockResolvedValue(true),
        install: jest.fn()
      };

      (detector as any).activePackageManager = mockPackageManager;

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(true);
      expect(frictionPoint.eliminated).toBe(true);
      expect(mockPackageManager.install).not.toHaveBeenCalled();
    });

    it('should not auto-install non-auto-installable dependencies', async () => {
      const frictionPoint: DependencyFrictionPoint = {
        id: 'test-friction-3',
        description: 'Missing dependency: @types/node',
        severity: 0.6,
        dependencyName: '@types/node',
        dependencyType: 'missing',
        suggestions: ['npm install --save-dev @types/node'],
        autoInstallable: false,
        installCommand: 'npm install --save-dev @types/node',
        packageManager: 'npm',
        filePath: 'src/test.ts',
        line: 1,
        column: 1,
        timestamp: Date.now()
      };

      const mockPackageManager = {
        name: 'npm',
        checkInstalled: jest.fn().mockResolvedValue(false),
        install: jest.fn()
      };

      (detector as any).activePackageManager = mockPackageManager;

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(false);
      expect(frictionPoint.eliminated).toBe(false);
      expect(mockPackageManager.install).not.toHaveBeenCalled();
    });

    it('should install dev dependencies with correct flags', async () => {
      const frictionPoint: DependencyFrictionPoint = {
        id: 'test-friction-4',
        description: 'Missing dependency: jest',
        severity: 0.5,
        dependencyName: 'jest',
        dependencyType: 'missing',
        suggestions: ['npm install --save-dev jest'],
        autoInstallable: true,
        installCommand: 'npm install --save-dev jest',
        packageManager: 'npm',
        filePath: 'src/test.spec.ts',
        line: 1,
        column: 1,
        timestamp: Date.now()
      };

      const mockPackageManager = {
        name: 'npm',
        checkInstalled: jest.fn().mockResolvedValue(false),
        install: jest.fn().mockResolvedValue({
          success: true,
          packageName: 'jest',
          version: '29.0.0',
          duration: 1500
        })
      };

      (detector as any).activePackageManager = mockPackageManager;

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(true);
      expect(mockPackageManager.install).toHaveBeenCalledWith('jest', {
        save: true,
        version: undefined,
        dev: true
      });
    });
  });

  describe('Statistics and Reporting', () => {
    it('should provide comprehensive dependency friction statistics', () => {
      // Add some test friction points to history
      const testPoints: DependencyFrictionPoint[] = [
        {
          id: 'test-1',
          description: 'Missing lodash',
          severity: 0.8,
          dependencyName: 'lodash',
          dependencyType: 'missing',
          suggestions: [],
          autoInstallable: true,
          packageManager: 'npm',
          filePath: 'src/test1.ts',
          line: 1,
          column: 1,
          eliminated: true,
          attempted: true,
          timestamp: Date.now()
        },
        {
          id: 'test-2',
          description: 'Missing @types/node',
          severity: 0.6,
          dependencyName: '@types/node',
          dependencyType: 'missing',
          suggestions: [],
          autoInstallable: false,
          packageManager: 'yarn',
          filePath: 'src/test2.ts',
          line: 1,
          column: 1,
          eliminated: false,
          attempted: true,
          timestamp: Date.now()
        }
      ];

      (detector as any).history = testPoints;

      const stats = detector.getDependencyStats();

      expect(stats.totalDetected).toBe(2);
      expect(stats.totalAttempted).toBe(2);
      expect(stats.totalEliminated).toBe(1);
      expect(stats.eliminationRate).toBe(0.5);
      expect(stats.autoInstallableCount).toBe(1);
      expect(stats.frictionByType.missing).toBe(2);
      expect(stats.frictionByPackageManager.npm).toBe(1);
      expect(stats.frictionByPackageManager.yarn).toBe(1);
    });
  });

  describe('Package Manager Implementations', () => {
    describe('NpmPackageManager', () => {
      let npmManager: NpmPackageManager;

      beforeEach(() => {
        npmManager = new NpmPackageManager();
      });

      it('should generate correct install commands', async () => {
        const result = await npmManager.install('lodash', { save: true });
        expect(result.success).toBe(true);
        expect(result.packageName).toBe('lodash');
      });

      it('should generate correct dev dependency install commands', async () => {
        const result = await npmManager.install('jest', { dev: true });
        expect(result.success).toBe(true);
        expect(result.packageName).toBe('jest');
      });

      it('should handle version specifications', async () => {
        const result = await npmManager.install('react', { version: '18.0.0', exact: true });
        expect(result.success).toBe(true);
        expect(result.version).toBe('18.0.0');
      });
    });

    describe('YarnPackageManager', () => {
      let yarnManager: YarnPackageManager;

      beforeEach(() => {
        yarnManager = new YarnPackageManager();
      });

      it('should generate correct install commands', async () => {
        const result = await yarnManager.install('lodash');
        expect(result.success).toBe(true);
        expect(result.packageName).toBe('lodash');
      });

      it('should handle dev dependencies correctly', async () => {
        const result = await yarnManager.install('typescript', { dev: true });
        expect(result.success).toBe(true);
        expect(result.packageName).toBe('typescript');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully during detection', async () => {
      mockDependencySensor.getDependencyIssues.mockRejectedValue(new Error('Sensor error'));

      const context: DependencyDetectionContext = {
        filePath: 'src/test.ts',
        content: 'import _ from "lodash";'
      };

      const frictionPoints = await detector.detect(context);

      expect(frictionPoints).toHaveLength(0);
    });

    it('should handle installation failures gracefully', async () => {
      const frictionPoint: DependencyFrictionPoint = {
        id: 'test-friction-error',
        description: 'Missing dependency: nonexistent-package',
        severity: 0.8,
        dependencyName: 'nonexistent-package',
        dependencyType: 'missing',
        suggestions: [],
        autoInstallable: true,
        installCommand: 'npm install nonexistent-package',
        packageManager: 'npm',
        filePath: 'src/test.ts',
        line: 1,
        column: 1,
        timestamp: Date.now()
      };

      const mockPackageManager = {
        name: 'npm',
        checkInstalled: jest.fn().mockResolvedValue(false),
        install: jest.fn().mockResolvedValue({
          success: false,
          packageName: 'nonexistent-package',
          error: 'Package not found',
          duration: 500
        })
      };

      (detector as any).activePackageManager = mockPackageManager;

      const result = await detector.eliminate(frictionPoint);

      expect(result).toBe(false);
      expect(frictionPoint.eliminated).toBe(false);
    });
  });
});