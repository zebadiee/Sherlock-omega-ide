/**
 * Tests for SimpleIntentAnalyzer
 */

import { SimpleIntentAnalyzer } from '../SimpleIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

describe('SimpleIntentAnalyzer', () => {
  let analyzer: SimpleIntentAnalyzer;

  beforeEach(() => {
    analyzer = new SimpleIntentAnalyzer();
  });

  describe('Intent Detection', () => {
    test('detects refactor intent', async () => {
      const code = '// please refactor this function';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('refactor');
      expect(intent.timestamp).toBeDefined();
    });

    test('detects optimize intent', async () => {
      const code = 'function slowFunction() { /* optimize this for performance */ }';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('optimize');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toEqual(expect.arrayContaining(['optimize', 'performance']));
    });

    test('detects security intent', async () => {
      const code = 'const password = input; // need to encrypt this';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('secure');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('encrypt');
    });

    test('detects debug intent', async () => {
      const code = 'console.log("debug this issue");';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('debug');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('debug');
    });

    test('detects test intent from structural patterns', async () => {
      const code = `
        describe('MyComponent', () => {
          it('should render correctly', () => {
            expect(component).toBeDefined();
          });
        });
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('test');
      expect(intent.confidence).toBeGreaterThan(0.8);
      expect(intent.context?.analysisMethod).toBe('structural-pattern');
    });

    test('detects refactor intent from TODO comments', async () => {
      const code = 'function messy() { /* TODO: clean this up */ }';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.context?.pattern).toBe('todo-comments');
    });

    test('handles unknown intent with low confidence', async () => {
      const code = 'const x = 42;';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBeLessThanOrEqual(0.6);
      expect(intent.keyExpressions).toEqual([]);
    });

    test('handles empty code', async () => {
      const intent = await analyzer.analyzeIntent('');
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBeLessThanOrEqual(0.6);
    });
  });

  describe('Action Suggestions', () => {
    test('suggests auto-refactor action for refactor intent', async () => {
      const code = 'cleanup code';
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      
      const refactorAction = actions.find(a => a.description.toLowerCase().includes('refactor'));
      expect(refactorAction).toBeDefined();
      expect(refactorAction?.priority).toBe(1);
      expect(refactorAction?.parameters?.tool).toBe('prettier');
    });

    test('suggests performance profiling for optimize intent', async () => {
      const code = 'optimize this function for speed';
      const actions = await analyzer.run(code);
      
      const profileAction = actions.find(a => a.description.toLowerCase().includes('profile'));
      expect(profileAction).toBeDefined();
      expect(profileAction?.priority).toBe(1);
      expect(profileAction?.parameters?.profiler).toBe('node-profiler');
    });

    test('suggests security audit for secure intent', async () => {
      const code = 'validate user input for security';
      const actions = await analyzer.run(code);
      
      const securityAction = actions.find(a => a.description.toLowerCase().includes('security'));
      expect(securityAction).toBeDefined();
      expect(securityAction?.priority).toBe(1);
      expect(securityAction?.parameters?.tools).toContain('eslint-security');
    });

    test('suggests debugging setup for debug intent', async () => {
      const code = 'fix this bug in the function';
      const actions = await analyzer.run(code);
      
      const debugAction = actions.find(a => a.description.toLowerCase().includes('debug'));
      expect(debugAction).toBeDefined();
      expect(debugAction?.priority).toBe(1);
      expect(debugAction?.parameters?.debugger).toBe('node-inspector');
    });

    test('suggests test generation for test intent', async () => {
      const code = 'write unit tests for this module';
      const actions = await analyzer.run(code);
      
      const testAction = actions.find(a => a.description.toLowerCase().includes('test'));
      expect(testAction).toBeDefined();
      expect(testAction?.priority).toBe(1);
      expect(testAction?.parameters?.framework).toBe('jest');
    });

    test('suggests documentation generation for document intent', async () => {
      const code = 'document this API endpoint';
      const actions = await analyzer.run(code);
      
      const docAction = actions.find(a => a.description.toLowerCase().includes('documentation'));
      expect(docAction).toBeDefined();
      expect(docAction?.priority).toBe(1);
      expect(docAction?.parameters?.format).toBe('jsdoc');
    });

    test('suggests code formatting for style intent', async () => {
      const code = 'format this code properly';
      const actions = await analyzer.run(code);
      
      const styleAction = actions.find(a => a.description.toLowerCase().includes('formatting'));
      expect(styleAction).toBeDefined();
      expect(styleAction?.priority).toBe(1);
      expect(styleAction?.parameters?.formatter).toBe('prettier');
    });

    test('suggests dependency updates for upgrade intent', async () => {
      const code = 'upgrade dependencies to latest version';
      const actions = await analyzer.run(code);
      
      const upgradeAction = actions.find(a => a.description.toLowerCase().includes('dependency'));
      expect(upgradeAction).toBeDefined();
      expect(upgradeAction?.priority).toBe(1);
      expect(upgradeAction?.parameters?.manager).toBe('npm');
    });

    test('handles unknown intent with clarification request', async () => {
      const code = 'some random code';
      const actions = await analyzer.run(code);
      
      const clarificationAction = actions.find(a => a.description.toLowerCase().includes('clarification'));
      expect(clarificationAction).toBeDefined();
      expect(clarificationAction?.priority).toBe(2);
    });

    test('requests manual review for low confidence intent', async () => {
      const code = 'x = 1';
      const actions = await analyzer.run(code);
      
      const reviewAction = actions.find(a => a.description.toLowerCase().includes('manual'));
      expect(reviewAction).toBeDefined();
      expect(reviewAction?.priority).toBe(2);
      expect(reviewAction?.parameters?.reason).toContain('Low confidence');
    });
  });

  describe('Confidence Calculation', () => {
    test('increases confidence for multiple matches', async () => {
      const singleMatch = await analyzer.analyzeIntent('refactor this');
      const multipleMatches = await analyzer.analyzeIntent('refactor and cleanup this code');
      
      expect(multipleMatches.confidence).toBeGreaterThan(singleMatch.confidence);
    });

    test('increases confidence for comment matches', async () => {
      const codeMatch = await analyzer.analyzeIntent('refactor()');
      const commentMatch = await analyzer.analyzeIntent('// refactor this function');
      
      expect(commentMatch.confidence).toBeGreaterThan(codeMatch.confidence);
    });

    test('decreases confidence for very short code', async () => {
      const shortCode = await analyzer.analyzeIntent('fix');
      const longerCode = await analyzer.analyzeIntent('fix this complex function with multiple issues');
      
      expect(longerCode.confidence).toBeGreaterThan(shortCode.confidence);
    });
  });

  describe('Structural Pattern Analysis', () => {
    test('detects TODO patterns', async () => {
      const code = 'function test() { /* TODO: implement this */ }';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.context?.pattern).toBe('todo-comments');
    });

    test('detects FIXME patterns', async () => {
      const code = 'function broken() { /* FIXME: this is broken */ }';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.context?.pattern).toBe('todo-comments');
    });

    test('detects debug statements pattern', async () => {
      const code = `
        console.log('debug 1');
        console.warn('debug 2');
        console.error('debug 3');
        console.debug('debug 4');
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('debug');
      expect(intent.context?.pattern).toBe('debug-statements');
    });

    test('detects test function patterns', async () => {
      const code = `
        describe('Component', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('test');
      expect(intent.context?.pattern).toBe('test-functions');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Integration', () => {
    test('run method combines analysis and suggestions', async () => {
      const code = 'refactor this messy function';
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      
      // Should have high-priority refactor actions
      const highPriorityActions = actions.filter(a => a.priority === 1);
      expect(highPriorityActions.length).toBeGreaterThan(0);
    });

    test('provides estimated times for actions', async () => {
      const code = 'optimize performance of this algorithm';
      const actions = await analyzer.run(code);
      
      const actionWithTime = actions.find(a => a.estimatedTime !== undefined);
      expect(actionWithTime).toBeDefined();
      expect(actionWithTime?.estimatedTime).toBeGreaterThan(0);
    });

    test('includes parameters for tool configuration', async () => {
      const code = 'format this code with prettier';
      const actions = await analyzer.run(code);
      
      const formatAction = actions.find(a => a.parameters?.formatter);
      expect(formatAction).toBeDefined();
      expect(formatAction?.parameters?.formatter).toBe('prettier');
    });
  });
});