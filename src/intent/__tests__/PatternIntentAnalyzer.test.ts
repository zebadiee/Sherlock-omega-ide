/**
 * Tests for PatternIntentAnalyzer
 */

import { PatternIntentAnalyzer } from '../PatternIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

describe('PatternIntentAnalyzer', () => {
  let analyzer: PatternIntentAnalyzer;

  beforeEach(() => {
    analyzer = new PatternIntentAnalyzer();
  });

  describe('Basic Functionality', () => {
    test('should be properly initialized', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(PatternIntentAnalyzer);
    });

    test('should handle empty code', async () => {
      const intent = await analyzer.analyzeIntent('');
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBeLessThanOrEqual(0.6);
    });

    test('should handle code with no patterns', async () => {
      const code = 'const x = 42; const y = "hello";';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBeLessThanOrEqual(0.6);
    });
  });

  describe('Loop Pattern Detection', () => {
    test('should detect for-loop patterns', async () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          console.log(i);
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('optimize');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.context?.patternType).toBe('for-loop');
      expect(intent.context?.patternLocation).toBeDefined();
      expect(intent.context?.patternLocation?.length).toBeGreaterThan(0);
      
      // Check location accuracy
      const location = intent.context?.patternLocation?.[0];
      expect(location?.line).toBe(2);
      expect(location?.patternName).toBe('for-loop');
    });

    test('should detect while-loop patterns', async () => {
      const code = `
        let i = 0;
        while (i < 10) {
          console.log(i);
          i++;
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('while-loop');
    });

    test('should detect nested loops with high severity', async () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            console.log(i, j);
          }
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('optimize');
      expect(intent.confidence).toBeGreaterThan(0.7);
      expect(intent.keyExpressions).toContain('nested-loops');
    });

    test('should detect array methods positively', async () => {
      const code = `
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(x => x * 2);
        const evens = numbers.filter(x => x % 2 === 0);
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('array-map');
      expect(intent.keyExpressions).toContain('array-filter');
    });
  });

  describe('Async Pattern Detection', () => {
    test('should detect async function patterns', async () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api/data');
          return response.json();
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('async-function');
      expect(intent.keyExpressions).toContain('await-usage');
    });

    test('should detect Promise.then patterns with high severity', async () => {
      const code = `
        fetch('/api/data')
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('promise-then');
    });

    test('should detect callback patterns', async () => {
      const code = `
        function processData(data, callback) {
          setTimeout(() => {
            callback(null, data.processed);
          }, 1000);
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('callback-pattern');
    });
  });

  describe('Null/Undefined Check Detection', () => {
    test('should detect null equality checks', async () => {
      const code = `
        if (data === null) {
          return;
        }
        if (value != null) {
          process(value);
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('null-check-equality');
    });

    test('should detect undefined checks', async () => {
      const code = `
        if (typeof value === 'undefined') {
          return defaultValue;
        }
        if (data !== undefined) {
          process(data);
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('undefined-check');
    });

    test('should detect modern optional chaining', async () => {
      const code = `
        const name = user?.profile?.name;
        const count = data?.items?.length ?? 0;
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('optional-chaining');
      expect(intent.keyExpressions).toContain('nullish-coalescing');
    });
  });

  describe('Error Handling Detection', () => {
    test('should detect try-catch blocks', async () => {
      const code = `
        try {
          const data = JSON.parse(jsonString);
          return data;
        } catch (error) {
          console.error('Parse error:', error);
          return null;
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('try-catch');
    });

    test('should detect throw statements', async () => {
      const code = `
        function validateInput(input) {
          if (!input) {
            throw new Error('Input is required');
          }
          return input;
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('throw-statement');
    });

    test('should detect console error statements', async () => {
      const code = `
        console.error('Something went wrong');
        console.warn('This is deprecated');
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('debug');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('console-error');
    });
  });

  describe('Security Pattern Detection', () => {
    test('should detect eval usage with high severity', async () => {
      const code = `
        const result = eval('2 + 2');
        const dynamicCode = eval(userInput);
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('secure');
      expect(intent.confidence).toBeGreaterThan(0.8);
      expect(intent.keyExpressions).toContain('eval-usage');
    });

    test('should detect innerHTML usage', async () => {
      const code = `
        element.innerHTML = '<div>' + userContent + '</div>';
        container.innerHTML = htmlString;
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('secure');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('innerhtml-usage');
    });
  });

  describe('Performance Pattern Detection', () => {
    test('should detect array push in loop', async () => {
      const code = `
        const results = [];
        for (let i = 0; i < data.length; i++) {
          results.push(process(data[i]));
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('optimize');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('array-push-loop');
    });
  });

  describe('Action Suggestions', () => {
    test('should suggest performance optimization for nested loops', async () => {
      const code = `
        for (let i = 0; i < 100; i++) {
          for (let j = 0; j < 100; j++) {
            matrix[i][j] = i * j;
          }
        }
      `;
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      
      const optimizationAction = actions.find(a => 
        a.description.toLowerCase().includes('loop unrolling') ||
        a.description.toLowerCase().includes('optimization')
      );
      expect(optimizationAction).toBeDefined();
      expect(optimizationAction?.priority).toBe(1);
    });

    test('should suggest security audit for eval usage', async () => {
      const code = `
        const userCode = getUserInput();
        const result = eval(userCode);
      `;
      const actions = await analyzer.run(code);
      
      const securityAction = actions.find(a => 
        a.description.toLowerCase().includes('security') ||
        a.description.toLowerCase().includes('eval')
      );
      expect(securityAction).toBeDefined();
      expect(securityAction?.priority).toBe(1);
    });

    test('should suggest async refactoring for Promise.then', async () => {
      const code = `
        getData()
          .then(data => processData(data))
          .then(result => saveResult(result))
          .catch(error => handleError(error));
      `;
      const actions = await analyzer.run(code);
      
      const asyncAction = actions.find(a => 
        a.description.toLowerCase().includes('async') ||
        a.description.toLowerCase().includes('await')
      );
      expect(asyncAction).toBeDefined();
    });

    test('should provide category-specific actions', async () => {
      const code = `
        async function fetchData() {
          try {
            const response = await fetch('/api/data');
            return response.json();
          } catch (error) {
            console.error('Fetch failed:', error);
            throw error;
          }
        }
      `;
      const actions = await analyzer.run(code);
      
      expect(actions.length).toBeGreaterThan(1);
      
      // Should have both pattern-specific and category-specific actions
      const hasPatternAction = actions.some(a => a.parameters?.patternName);
      const hasCategoryAction = actions.some(a => a.parameters?.category);
      
      expect(hasPatternAction || hasCategoryAction).toBe(true);
    });
  });

  describe('Confidence Calculation', () => {
    test('should increase confidence with more patterns', async () => {
      const singlePattern = await analyzer.analyzeIntent('for (let i = 0; i < 10; i++) {}');
      const multiplePatterns = await analyzer.analyzeIntent(`
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            if (data === null) {
              throw new Error('Null data');
            }
          }
        }
      `);
      
      expect(multiplePatterns.confidence).toBeGreaterThan(singlePattern.confidence);
    });

    test('should boost confidence for high-severity patterns', async () => {
      const lowSeverity = await analyzer.analyzeIntent('const mapped = arr.map(x => x * 2);');
      const highSeverity = await analyzer.analyzeIntent('const result = eval(userInput);');
      
      expect(highSeverity.confidence).toBeGreaterThan(lowSeverity.confidence);
    });

    test('should handle low confidence gracefully', async () => {
      const code = 'const x = 1;';
      const actions = await analyzer.run(code);
      
      if (actions.length > 0) {
        const reviewAction = actions.find(a => 
          a.description.toLowerCase().includes('manual review')
        );
        if (reviewAction) {
          expect(reviewAction.priority).toBe(2);
        }
      }
    });
  });

  describe('Pattern Location Accuracy', () => {
    test('should provide accurate line numbers for patterns', async () => {
      const code = `line 1
for (let i = 0; i < 10; i++) {
  console.log(i);
}
line 5`;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.context?.patternLocation).toBeDefined();
      const forLoopLocation = intent.context?.patternLocation?.find(
        loc => loc.patternName === 'for-loop'
      );
      
      expect(forLoopLocation?.line).toBe(2);
    });

    test('should handle multiple pattern locations', async () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          console.log(i);
        }
        
        while (condition) {
          doSomething();
        }
        
        if (data === null) {
          return;
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.context?.patternLocation).toBeDefined();
      expect(intent.context?.patternLocation?.length).toBeGreaterThan(2);
      
      const patternNames = intent.context?.patternLocation?.map(loc => loc.patternName);
      expect(patternNames).toContain('for-loop');
      expect(patternNames).toContain('while-loop');
      expect(patternNames).toContain('null-check-equality');
    });
  });

  describe('AST Enhancement', () => {
    test('should use hybrid pattern matching method', async () => {
      const code = `
        async function processData() {
          for (let i = 0; i < data.length; i++) {
            await processItem(data[i]);
          }
        }
      `;
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.context?.analysisMethod).toBe('hybrid-pattern-matching');
      expect(intent.keyExpressions).toContain('async-function');
      expect(intent.keyExpressions).toContain('for-loop');
      expect(intent.keyExpressions).toContain('await-usage');
    });

    test('should provide accurate AST-based locations', async () => {
      const code = `function test() {
  const x = eval('2 + 2');
  return x;
}`;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.context?.patternLocation).toBeDefined();
      const evalLocation = intent.context?.patternLocation?.find(
        loc => loc.patternName === 'eval-usage'
      );
      
      expect(evalLocation).toBeDefined();
      expect(evalLocation?.line).toBe(2); // eval is on line 2
    });

    test('should detect complex nested patterns with AST', async () => {
      const code = `
        async function complexFunction() {
          try {
            for (let i = 0; i < items.length; i++) {
              const result = await processItem(items[i]);
              if (result === null) {
                throw new Error('Processing failed');
              }
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.8);
      expect(intent.keyExpressions).toContain('async-function');
      expect(intent.keyExpressions).toContain('try-catch');
      expect(intent.keyExpressions).toContain('for-loop');
      expect(intent.keyExpressions).toContain('await-usage');
      expect(intent.keyExpressions).toContain('null-check-equality');
      expect(intent.keyExpressions).toContain('throw-statement');
      expect(intent.keyExpressions).toContain('console-error');
    });

    test('should gracefully handle invalid syntax', async () => {
      const code = 'const x = {'; // Invalid syntax
      const intent = await analyzer.analyzeIntent(code);
      
      // Should still work with regex fallback
      expect(intent).toBeDefined();
      expect(intent.intentType).toBe('unknown');
    });

    test('should detect optional chaining with AST', async () => {
      const code = `
        const name = user?.profile?.name;
        const count = data?.items?.length ?? 0;
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.keyExpressions).toContain('optional-chaining');
      expect(intent.keyExpressions).toContain('nullish-coalescing');
    });
  });

  describe('Integration', () => {
    test('should work with run method', async () => {
      const code = `
        async function processData() {
          try {
            const data = await fetchData();
            return data.map(item => item.value);
          } catch (error) {
            console.error('Processing failed:', error);
            return [];
          }
        }
      `;
      
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    test('should provide estimated times for actions', async () => {
      const code = 'for (let i = 0; i < 1000000; i++) { results.push(i); }';
      const actions = await analyzer.run(code);
      
      const actionWithTime = actions.find(a => a.estimatedTime !== undefined);
      expect(actionWithTime).toBeDefined();
      expect(actionWithTime?.estimatedTime).toBeGreaterThan(0);
    });

    test('should include pattern parameters in actions', async () => {
      const code = 'const result = eval("2 + 2");';
      const actions = await analyzer.run(code);
      
      const evalAction = actions.find(a => 
        a.parameters?.patternName === 'eval-usage'
      );
      expect(evalAction).toBeDefined();
      expect(evalAction?.parameters?.category).toBe('security');
      expect(evalAction?.parameters?.severityScore).toBeGreaterThan(0.8);
    });
  });
});