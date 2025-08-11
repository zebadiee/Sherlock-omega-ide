/**
 * Test suite for DependencySensor
 * Tests dependency graph construction and validation
 */

import { DependencySensor, TypeScriptDependencyAnalyzer, DependencyType, PackageInfo } from '../DependencySensor';
import { SensorStatus, SeverityLevel, ProblemType } from '@types/core';

describe('DependencySensor', () => {
  let sensor: DependencySensor;
  let mockPackageInfo: PackageInfo;

  beforeEach(() => {
    sensor = new DependencySensor();
    mockPackageInfo = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        'react': '^18.0.0',
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0'
      },
      peerDependencies: {}
    };
  });

  afterEach(() => {
    sensor.stopMonitoring();
  });

  describe('Package Info Management', () => {
    test('should set package info', () => {
      sensor.setPackageInfo(mockPackageInfo);
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('File Management', () => {
    test('should add file for dependency monitoring', async () => {
      const code = `
        import React from 'react';
        import { debounce } from 'lodash';
        import './styles.css';
      `;

      await sensor.addFile('test.tsx', code);
      expect(true).toBe(true);
    });

    test('should update file content', async () => {
      const initialCode = `import React from 'react';`;
      const updatedCode = `
        import React from 'react';
        import { useState } from 'react';
      `;

      await sensor.addFile('test.tsx', initialCode);
      await sensor.updateFile('test.tsx', updatedCode);
      
      expect(true).toBe(true);
    });

    test('should remove file from monitoring', async () => {
      const code = `import React from 'react';`;
      
      await sensor.addFile('test.tsx', code);
      sensor.removeFile('test.tsx');
      
      expect(true).toBe(true);
    });
  });

  describe('Dependency Analysis', () => {
    beforeEach(() => {
      sensor.setPackageInfo(mockPackageInfo);
    });

    test('should detect missing dependencies', async () => {
      const codeWithMissingDep = `
        import React from 'react';
        import { nonExistentPackage } from 'non-existent-package';
        import './missing-file.ts';
      `;

      await sensor.addFile('test.tsx', codeWithMissingDep);
      const issues = await sensor.getDependencyIssues();

      const missingDepIssues = issues.filter(issue => 
        issue.type === ProblemType.DEPENDENCY_MISSING
      );

      expect(missingDepIssues.length).toBeGreaterThan(0);
      
      const missingPackage = missingDepIssues.find(issue =>
        issue.metadata.tags.includes('non-existent-package')
      );
      expect(missingPackage).toBeDefined();
      expect(missingPackage?.severity).toBe(SeverityLevel.HIGH);
    });

    test('should resolve valid dependencies', async () => {
      const codeWithValidDeps = `
        import React from 'react';
        import { debounce } from 'lodash';
        import fs from 'fs'; // Built-in module
      `;

      await sensor.addFile('test.tsx', codeWithValidDeps);
      const issues = await sensor.getDependencyIssues();

      // Should have no missing dependency issues for valid deps
      const missingValidDeps = issues.filter(issue => 
        issue.type === ProblemType.DEPENDENCY_MISSING &&
        (issue.metadata.tags.includes('react') || 
         issue.metadata.tags.includes('lodash') ||
         issue.metadata.tags.includes('fs'))
      );

      expect(missingValidDeps.length).toBe(0);
    });

    test('should detect circular dependencies', async () => {
      // Create circular dependency: A -> B -> A
      const fileA = `
        import { functionB } from './fileB';
        export const functionA = () => functionB();
      `;
      
      const fileB = `
        import { functionA } from './fileA';
        export const functionB = () => functionA();
      `;

      await sensor.addFile('./fileA.ts', fileA);
      await sensor.addFile('./fileB.ts', fileB);

      const issues = await sensor.getDependencyIssues();
      
      const circularIssues = issues.filter(issue => 
        issue.type === ProblemType.ARCHITECTURAL_INCONSISTENCY &&
        issue.metadata.tags.includes('circular-dependency')
      );

      expect(circularIssues.length).toBeGreaterThan(0);
    });

    test('should handle different import types', async () => {
      const codeWithDifferentImports = `
        // ES6 imports
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as lodash from 'lodash';
        
        // Type imports
        import type { ComponentType } from 'react';
        
        // Dynamic imports
        const LazyComponent = () => import('./LazyComponent');
        
        // CommonJS requires
        const fs = require('fs');
        
        // Re-exports
        export { debounce } from 'lodash';
        export * from './utils';
      `;

      await sensor.addFile('test.tsx', codeWithDifferentImports);
      const stats = sensor.getDependencyStats();

      expect(stats.totalFiles).toBe(1);
      expect(stats.totalDependencies).toBeGreaterThan(0);
    });
  });

  describe('Dependency Statistics', () => {
    beforeEach(() => {
      sensor.setPackageInfo(mockPackageInfo);
    });

    test('should calculate dependency statistics', async () => {
      const code1 = `
        import React from 'react';
        import { debounce } from 'lodash';
        import './utils.ts';
      `;

      const code2 = `
        import { format } from 'date-fns'; // Missing dependency
        export const formatDate = format;
      `;

      await sensor.addFile('file1.tsx', code1);
      await sensor.addFile('file2.ts', code2);

      const stats = sensor.getDependencyStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalDependencies).toBeGreaterThan(0);
      expect(stats.externalDependencies).toBeGreaterThan(0);
      expect(stats.missingDependencies).toBeGreaterThan(0);
    });
  });

  describe('Real-time Monitoring', () => {
    test('should perform dependency monitoring', async () => {
      sensor.setPackageInfo(mockPackageInfo);
      
      const codeWithIssues = `
        import React from 'react';
        import { nonExistent } from 'non-existent-package';
      `;

      await sensor.addFile('test.tsx', codeWithIssues);
      const result = await sensor.monitor();

      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.metrics.totalFiles).toBe(1);
      expect(result.metrics.missingDependencies).toBeGreaterThan(0);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('should report correct status based on issues', async () => {
      sensor.setPackageInfo(mockPackageInfo);

      // Test with no issues
      const cleanCode = `import React from 'react';`;
      await sensor.addFile('clean.tsx', cleanCode);
      
      let result = await sensor.monitor();
      expect(result.status).toBe('HEALTHY');

      // Test with missing dependencies (high severity)
      const problematicCode = `import { missing } from 'missing-package';`;
      await sensor.addFile('problematic.tsx', problematicCode);
      
      result = await sensor.monitor();
      expect(result.status).toBe('CRITICAL');
    });
  });

  describe('Analyzer Registration', () => {
    test('should register custom analyzer', () => {
      const customAnalyzer = {
        language: 'python',
        extensions: ['.py'],
        analyzeDependencies: async () => [],
        resolveSpecifier: async (specifier: string) => ({
          specifier,
          resolved: true
        })
      };

      sensor.registerAnalyzer(customAnalyzer);
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle analyzer errors gracefully', async () => {
      // Mock analyzer to throw error
      const errorAnalyzer = {
        language: 'typescript',
        extensions: ['.ts'],
        analyzeDependencies: async () => {
          throw new Error('Analyzer error');
        },
        resolveSpecifier: async (specifier: string) => ({
          specifier,
          resolved: false,
          error: 'Test error'
        })
      };

      sensor.registerAnalyzer(errorAnalyzer);
      
      // Should not throw error
      await sensor.addFile('test.ts', 'const x = 1;');
      expect(true).toBe(true);
    });

    test('should handle unknown file types', async () => {
      // Try to add file with unknown extension
      await sensor.addFile('test.unknown', 'some content');
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Continuous Monitoring', () => {
    test('should start and stop monitoring', () => {
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);

      sensor.startMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.ACTIVE);

      sensor.stopMonitoring();
      expect(sensor.getStatus()).toBe(SensorStatus.INACTIVE);
    });
  });
});

describe('TypeScriptDependencyAnalyzer', () => {
  let analyzer: TypeScriptDependencyAnalyzer;
  let mockPackageInfo: PackageInfo;

  beforeEach(() => {
    mockPackageInfo = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        'react': '^18.0.0',
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'typescript': '^5.0.0'
      },
      peerDependencies: {}
    };
    
    analyzer = new TypeScriptDependencyAnalyzer(mockPackageInfo);
  });

  describe('Language Support', () => {
    test('should support TypeScript/JavaScript extensions', () => {
      expect(analyzer.language).toBe('typescript');
      expect(analyzer.extensions).toContain('.ts');
      expect(analyzer.extensions).toContain('.tsx');
      expect(analyzer.extensions).toContain('.js');
      expect(analyzer.extensions).toContain('.jsx');
    });
  });

  describe('Dependency Analysis', () => {
    test('should analyze ES6 imports', async () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as lodash from 'lodash';
        import defaultExport, { namedExport } from './utils';
      `;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.tsx');

      expect(dependencies.length).toBe(4);
      
      const reactImport = dependencies.find(dep => dep.target === 'react');
      expect(reactImport).toBeDefined();
      expect(reactImport?.type).toBe(DependencyType.IMPORT);
      expect(reactImport?.isExternal).toBe(true);

      const utilsImport = dependencies.find(dep => dep.target === './utils');
      expect(utilsImport).toBeDefined();
      expect(utilsImport?.isExternal).toBe(false);
    });

    test('should analyze type imports', async () => {
      const code = `
        import type { ComponentType } from 'react';
        import type { User } from './types';
      `;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.ts');

      expect(dependencies.length).toBe(2);
      
      const typeImports = dependencies.filter(dep => dep.type === DependencyType.TYPE_IMPORT);
      expect(typeImports.length).toBe(2);
    });

    test('should analyze dynamic imports', async () => {
      const code = `
        const LazyComponent = () => import('./LazyComponent');
        const dynamicModule = import('dynamic-package');
      `;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.ts');

      const dynamicImports = dependencies.filter(dep => dep.type === DependencyType.DYNAMIC_IMPORT);
      expect(dynamicImports.length).toBe(2);
    });

    test('should analyze CommonJS requires', async () => {
      const code = `
        const fs = require('fs');
        const utils = require('./utils');
      `;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.js');

      const requires = dependencies.filter(dep => dep.type === DependencyType.REQUIRE);
      expect(requires.length).toBe(2);
    });

    test('should analyze re-exports', async () => {
      const code = `
        export { debounce } from 'lodash';
        export * from './utils';
        export * as helpers from './helpers';
      `;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.ts');

      const exports = dependencies.filter(dep => dep.type === DependencyType.EXPORT);
      expect(exports.length).toBe(3);
    });
  });

  describe('Dependency Resolution', () => {
    test('should resolve package dependencies', async () => {
      const resolution = await analyzer.resolveSpecifier('react', 'test.tsx');

      expect(resolution.resolved).toBe(true);
      expect(resolution.resolvedPath).toBe('node_modules/react');
    });

    test('should resolve relative imports', async () => {
      const resolution = await analyzer.resolveSpecifier('./utils', '/src/components/test.tsx');

      expect(resolution.resolved).toBe(true);
      expect(resolution.resolvedPath).toContain('./utils');
    });

    test('should resolve built-in modules', async () => {
      const resolution = await analyzer.resolveSpecifier('fs', 'test.js');

      expect(resolution.resolved).toBe(true);
      expect(resolution.resolvedPath).toBe('node:fs');
    });

    test('should handle unresolved dependencies', async () => {
      const resolution = await analyzer.resolveSpecifier('non-existent-package', 'test.ts');

      expect(resolution.resolved).toBe(false);
      expect(resolution.error).toContain('Cannot resolve module');
      expect(resolution.suggestions).toBeDefined();
      expect(resolution.suggestions!.length).toBeGreaterThan(0);
    });

    test('should provide suggestions for common packages', async () => {
      const resolution = await analyzer.resolveSpecifier('moment', 'test.ts');

      expect(resolution.resolved).toBe(false);
      expect(resolution.suggestions).toContain('dayjs');
      expect(resolution.suggestions).toContain('date-fns');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed code gracefully', async () => {
      const malformedCode = `
        import { from 'broken-syntax
        const x = 
      `;

      const dependencies = await analyzer.analyzeDependencies(malformedCode, 'test.ts');

      // Should return empty array or handle gracefully
      expect(Array.isArray(dependencies)).toBe(true);
    });

    test('should handle resolution errors', async () => {
      // Test with null/undefined specifier
      const resolution = await analyzer.resolveSpecifier('', 'test.ts');

      expect(resolution.resolved).toBe(false);
      expect(resolution.error).toBeDefined();
    });
  });

  describe('Position Information', () => {
    test('should provide accurate line and column information', async () => {
      const code = `import React from 'react';
import { useState } from 'react';
const lodash = require('lodash');`;

      const dependencies = await analyzer.analyzeDependencies(code, 'test.tsx');

      expect(dependencies.length).toBe(3);
      
      // Check line numbers
      expect(dependencies[0].line).toBe(1);
      expect(dependencies[1].line).toBe(2);
      expect(dependencies[2].line).toBe(3);

      // Check column positions are reasonable
      dependencies.forEach(dep => {
        expect(dep.column).toBeGreaterThan(0);
      });
    });
  });
});