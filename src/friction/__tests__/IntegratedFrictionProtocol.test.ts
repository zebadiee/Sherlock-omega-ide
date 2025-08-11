/**
 * Tests for Integrated Friction Protocol
 * Validates the complete workflow from detection to UI integration
 */

import { IntegratedFrictionProtocol, IntegratedContext } from '../IntegratedFrictionProtocol';

describe('IntegratedFrictionProtocol', () => {
  let protocol: IntegratedFrictionProtocol;

  beforeEach(() => {
    protocol = new IntegratedFrictionProtocol();
  });

  describe('Integrated Detection', () => {
    it('should detect both syntax and dependency friction', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: `
import _ from 'lodash'; // Missing dependency
import moment from 'moment'; // Missing dependency

const users = _.map([1, 2, 3], (id) => ({
  id,
  name: \`User \${id}\`,
  createdAt: moment().toISOString()
}));

// Syntax error: missing closing brace
const processData = (data: any) => {
  return {
    processed: true,
    data
  // Missing closing brace
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);

      expect(result.actionableItems.length).toBeGreaterThan(0);
      expect(result.uiMetadata.totalActions).toBe(result.actionableItems.length);
      expect(result.uiMetadata.categories.dependencies).toBeGreaterThan(0);
      
      // Should have dependency actions
      const dependencyActions = result.actionableItems.filter(a => a.type === 'install');
      expect(dependencyActions.length).toBeGreaterThan(0);
      
      // Check action structure
      const firstAction = result.actionableItems[0];
      expect(firstAction).toHaveProperty('id');
      expect(firstAction).toHaveProperty('type');
      expect(firstAction).toHaveProperty('title');
      expect(firstAction).toHaveProperty('description');
      expect(firstAction).toHaveProperty('severity');
      expect(firstAction).toHaveProperty('autoExecutable');
      expect(firstAction).toHaveProperty('metadata');
    });

    it('should generate UI metadata correctly', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: `
import lodash from 'lodash';
import moment from 'moment';
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);

      expect(result.uiMetadata).toHaveProperty('totalActions');
      expect(result.uiMetadata).toHaveProperty('autoExecutableActions');
      expect(result.uiMetadata).toHaveProperty('highPriorityActions');
      expect(result.uiMetadata).toHaveProperty('estimatedTotalTime');
      expect(result.uiMetadata).toHaveProperty('lastUpdated');
      expect(result.uiMetadata).toHaveProperty('categories');
      
      expect(result.uiMetadata.categories).toHaveProperty('syntax');
      expect(result.uiMetadata.categories).toHaveProperty('dependencies');
      expect(result.uiMetadata.categories).toHaveProperty('performance');
      expect(result.uiMetadata.categories).toHaveProperty('architecture');
    });

    it('should categorize actions by severity', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: `
import react from 'react'; // High severity - core dependency
import lodash from 'lodash'; // Medium severity
import jest from 'jest'; // Low severity - dev dependency
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      
      const severities = result.actionableItems.map(a => a.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
      
      // High priority actions should be counted
      const highPriorityCount = result.actionableItems.filter(a => a.severity === 'high').length;
      expect(result.uiMetadata.highPriorityActions).toBe(highPriorityCount);
    });
  });

  describe('Action Execution', () => {
    it('should execute install actions successfully', async () => {
      const mockActionId = 'test-action-123';
      
      const result = await protocol.executeAction(mockActionId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('actionId', mockActionId);
      expect(result).toHaveProperty('duration');
      expect(typeof result.duration).toBe('number');
      
      if (result.success) {
        expect(result).toHaveProperty('message');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('should handle non-existent actions gracefully', async () => {
      const result = await protocol.executeAction('non-existent-action');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should track execution time', async () => {
      const result = await protocol.executeAction('test-action');
      
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('UI Statistics', () => {
    it('should provide comprehensive UI statistics', () => {
      const stats = protocol.getUIStats();
      
      expect(stats).toHaveProperty('overall');
      expect(stats).toHaveProperty('syntax');
      expect(stats).toHaveProperty('dependencies');
      
      expect(stats.overall).toHaveProperty('totalDetected');
      expect(stats.overall).toHaveProperty('totalEliminated');
      expect(stats.overall).toHaveProperty('eliminationRate');
      expect(stats.overall).toHaveProperty('averageExecutionTime');
      
      expect(stats.syntax).toHaveProperty('detected');
      expect(stats.syntax).toHaveProperty('eliminated');
      expect(stats.syntax).toHaveProperty('eliminationRate');
      
      expect(stats.dependencies).toHaveProperty('detected');
      expect(stats.dependencies).toHaveProperty('eliminated');
      expect(stats.dependencies).toHaveProperty('eliminationRate');
      expect(stats.dependencies).toHaveProperty('autoInstallable');
      expect(stats.dependencies).toHaveProperty('packageManager');
    });

    it('should calculate elimination rates correctly', () => {
      const stats = protocol.getUIStats();
      
      // Elimination rate should be between 0 and 1
      expect(stats.overall.eliminationRate).toBeGreaterThanOrEqual(0);
      expect(stats.overall.eliminationRate).toBeLessThanOrEqual(1);
      
      expect(stats.syntax.eliminationRate).toBeGreaterThanOrEqual(0);
      expect(stats.syntax.eliminationRate).toBeLessThanOrEqual(1);
      
      expect(stats.dependencies.eliminationRate).toBeGreaterThanOrEqual(0);
      expect(stats.dependencies.eliminationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Action Conversion', () => {
    it('should convert dependency friction to install actions', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: 'import lodash from "lodash";',
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      const installActions = result.actionableItems.filter(a => a.type === 'install');
      
      expect(installActions.length).toBeGreaterThan(0);
      
      const lodashAction = installActions.find(a => a.title.includes('lodash'));
      if (lodashAction) {
        expect(lodashAction.type).toBe('install');
        expect(lodashAction.metadata.frictionType).toBe('dependency');
        expect(lodashAction.metadata.dependencies).toContain('lodash');
        expect(lodashAction.command).toContain('lodash');
      }
    });

    it('should set auto-executable flag correctly', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: `
import lodash from 'lodash'; // Should be auto-installable
import '@types/node' from '@types/node'; // Should not be auto-installable
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      
      const lodashAction = result.actionableItems.find(a => a.title.includes('lodash'));
      const typesAction = result.actionableItems.find(a => a.title.includes('@types/node'));
      
      if (lodashAction) {
        expect(lodashAction.autoExecutable).toBe(true);
      }
      
      if (typesAction) {
        expect(typesAction.autoExecutable).toBe(false);
      }
    });

    it('should estimate execution time appropriately', async () => {
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: 'import lodash from "lodash";',
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      
      for (const action of result.actionableItems) {
        expect(action.metadata.estimatedTime).toBeGreaterThan(0);
        expect(action.metadata.estimatedTime).toBeLessThan(300); // Should be reasonable
        
        // Install actions should have longer estimated time than fix actions
        if (action.type === 'install') {
          expect(action.metadata.estimatedTime).toBeGreaterThanOrEqual(30);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed code gracefully', async () => {
      const context: IntegratedContext = {
        filePath: 'src/malformed.ts',
        content: 'import from invalid syntax here',
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      
      // Should not throw, should return result even with errors
      expect(result).toHaveProperty('actionableItems');
      expect(result).toHaveProperty('uiMetadata');
      expect(Array.isArray(result.actionableItems)).toBe(true);
    });

    it('should handle missing context gracefully', async () => {
      const context: IntegratedContext = {};

      const result = await protocol.runIntegratedDetection(context);
      
      expect(result).toHaveProperty('actionableItems');
      expect(result).toHaveProperty('uiMetadata');
      expect(Array.isArray(result.actionableItems)).toBe(true);
    });

    it('should handle execution errors gracefully', async () => {
      // Try to execute an action that will fail
      const result = await protocol.executeAction('failing-action-id');
      
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete detection within reasonable time', async () => {
      const startTime = Date.now();
      
      const context: IntegratedContext = {
        filePath: 'src/test.ts',
        content: `
import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';
import react from 'react';
import express from 'express';
        `,
        checkPackageJson: true
      };

      const result = await protocol.runIntegratedDetection(context);
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(5000);
    });

    it('should handle large files efficiently', async () => {
      // Generate a large file with many imports
      const imports = Array.from({ length: 50 }, (_, i) => 
        `import lib${i} from 'library-${i}';`
      ).join('\n');
      
      const context: IntegratedContext = {
        filePath: 'src/large-file.ts',
        content: imports,
        checkPackageJson: true
      };

      const startTime = Date.now();
      const result = await protocol.runIntegratedDetection(context);
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(10000); // Should handle large files within 10 seconds
      expect(result.actionableItems.length).toBeGreaterThan(0);
    });
  });
});