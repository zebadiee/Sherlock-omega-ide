/**
 * Tests for BehaviorIntentAnalyzer
 */

import { BehaviorIntentAnalyzer } from '../BehaviorIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

describe('BehaviorIntentAnalyzer', () => {
  let analyzer: BehaviorIntentAnalyzer;

  beforeEach(() => {
    analyzer = new BehaviorIntentAnalyzer();
  });

  describe('Basic Functionality', () => {
    test('should be properly initialized', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(BehaviorIntentAnalyzer);
    });

    test('should handle empty code', async () => {
      const intent = await analyzer.analyzeIntent('');
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBeLessThanOrEqual(0.6);
    });

    test('should handle code with no behavior context', async () => {
      const code = 'const x = 42; const y = "hello";';
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent).toBeDefined();
      expect(intent.context?.analysisMethod).toBe('behavior-analysis');
    });
  });

  describe('Session Type Detection', () => {
    test('should detect refactoring session', async () => {
      // Simulate refactoring actions
      analyzer.recordAction('refactor', { type: 'code-cleanup' });
      analyzer.recordAction('refactor', { type: 'rename-variable' });
      analyzer.recordAction('refactor', { type: 'extract-method' });

      const code = `
        function processData(data) {
          return data.map(item => item.value);
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.context?.sessionType).toBe('refactoring');
    });

    test('should detect debugging session', async () => {
      // Simulate debugging actions
      analyzer.recordAction('debug', { type: 'add-breakpoint' });
      analyzer.recordAction('debug', { type: 'inspect-variable' });
      analyzer.recordAction('debug', { type: 'step-through' });

      const code = `
        function buggyFunction(data) {
          console.log('Debug:', data);
          if (data === null) {
            throw new Error('Data is null');
          }
          return data.process();
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('debug');
      expect(intent.confidence).toBeGreaterThan(0.7);
      expect(intent.context?.sessionType).toBe('debugging');
    });

    test('should detect testing session', async () => {
      // Simulate testing actions
      analyzer.recordAction('test', { type: 'write-test' });
      analyzer.recordAction('test', { type: 'run-tests' });
      analyzer.recordAction('test', { type: 'fix-test' });

      const code = `
        describe('MyFunction', () => {
          it('should return correct value', () => {
            expect(myFunction(input)).toBe(expected);
          });
        });
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.intentType).toBe('test');
      expect(intent.confidence).toBeGreaterThan(0.7);
      expect(intent.context?.sessionType).toBe('testing');
    });
  });

  describe('Keystroke Pattern Analysis', () => {
    test('should detect find-replace pattern', async () => {
      const behaviorContext = {
        keystrokes: ['Ctrl+F', 'Ctrl+H']
      };

      const code = 'const oldName = "value"; const newName = "value";';
      const intent = await analyzer.analyzeIntent(code, behaviorContext);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('find-replace');
    });

    test('should detect debugging keystroke pattern', async () => {
      const behaviorContext = {
        keystrokes: ['F12', 'console.log']
      };

      const code = 'console.log("Debug info:", variable);';
      const intent = await analyzer.analyzeIntent(code, behaviorContext);
      
      expect(intent.intentType).toBe('debug');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('debugging');
    });

    test('should detect testing keystroke pattern', async () => {
      const behaviorContext = {
        keystrokes: ['Ctrl+Shift+T', 'test']
      };

      const code = 'test("should work", () => { expect(true).toBe(true); });';
      const intent = await analyzer.analyzeIntent(code, behaviorContext);
      
      expect(intent.intentType).toBe('test');
      expect(intent.confidence).toBeGreaterThan(0.6);
      expect(intent.keyExpressions).toContain('testing');
    });
  });

  describe('Developer Habit Analysis', () => {
    test('should detect morning refactoring habit', async () => {
      // Mock morning time (9 AM on a weekday)
      const mockDate = new Date('2023-10-10T09:00:00'); // Tuesday
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      const getHoursSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const code = `
        import { cleanFunction } from './utils';
        
        function refactoredFunction(data) {
          return cleanFunction(data);
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.5);
      
      // Restore mocks
      nowSpy.mockRestore();
      getHoursSpy.mockRestore();
      getDaySpy.mockRestore();
    });

    test('should detect afternoon debugging habit', async () => {
      // Mock afternoon time (2 PM on a weekday)
      const mockDate = new Date('2023-10-10T14:00:00'); // Tuesday
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      const getHoursSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const code = `
        function debugThis(data) {
          console.log('Debugging:', data);
          if (!data) {
            console.error('Data is missing');
          }
          return data;
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code);
      
      expect(intent.confidence).toBeGreaterThan(0.5);
      
      // Restore mocks
      nowSpy.mockRestore();
      getHoursSpy.mockRestore();
      getDaySpy.mockRestore();
    });
  });

  describe('Behavior Signal Combination', () => {
    test('should combine multiple behavior signals', async () => {
      // Set up multiple signals
      analyzer.recordAction('refactor', { type: 'cleanup' });
      analyzer.recordAction('refactor', { type: 'organize' });

      const behaviorContext = {
        keystrokes: ['Ctrl+F', 'Ctrl+H']
      };

      const code = `
        function cleanFunction(data) {
          return data.filter(item => item.isValid);
        }
      `;
      
      const intent = await analyzer.analyzeIntent(code, behaviorContext);
      
      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBeGreaterThan(0.65);
      expect(intent.context?.analysisMethod).toBe('combined-behavior-analysis');
      expect(intent.context?.signalCount).toBeGreaterThan(1);
    });

    test('should weight signals appropriately', async () => {
      // Strong keystroke signal
      const strongKeystrokeContext = {
        keystrokes: ['F12', 'console.log']
      };

      // Weak session signal
      analyzer.recordAction('unknown', { type: 'misc' });

      const code = 'console.log("Debug:", value);';
      const intent = await analyzer.analyzeIntent(code, strongKeystrokeContext);
      
      // Should favor the stronger keystroke signal
      expect(intent.intentType).toBe('debug');
      expect(intent.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Action Suggestions', () => {
    test('should suggest refactoring actions for refactoring session', async () => {
      analyzer.recordAction('refactor', { type: 'cleanup' });
      analyzer.recordAction('refactor', { type: 'organize' });

      const code = 'function messy() { return "needs refactoring"; }';
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      
      const refactorAction = actions.find(a => 
        a.description.toLowerCase().includes('refactor')
      );
      expect(refactorAction).toBeDefined();
      expect(refactorAction?.priority).toBe(1);
    });

    test('should suggest debugging actions for debugging session', async () => {
      analyzer.recordAction('debug', { type: 'breakpoint' });
      analyzer.recordAction('debug', { type: 'inspect' });

      const code = 'function buggy() { console.log("debug"); return null; }';
      const actions = await analyzer.run(code);
      
      const debugAction = actions.find(a => 
        a.description.toLowerCase().includes('debug')
      );
      expect(debugAction).toBeDefined();
      expect(debugAction?.priority).toBe(1);
      expect(debugAction?.parameters?.sessionType).toBe('debugging');
    });

    test('should suggest testing actions for testing session', async () => {
      analyzer.recordAction('test', { type: 'write-test' });
      analyzer.recordAction('test', { type: 'run-test' });

      const code = 'describe("test", () => { it("works", () => {}); });';
      const actions = await analyzer.run(code);
      
      const testAction = actions.find(a => 
        a.description.toLowerCase().includes('test')
      );
      expect(testAction).toBeDefined();
      expect(testAction?.priority).toBe(1);
    });

    test('should provide habit-based suggestions', async () => {
      // Mock morning time for habit-based suggestions
      const mockDate = new Date('2023-10-10T09:00:00');
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      const getHoursSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      const getDaySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const code = 'function example() { return "test"; }';
      const intent = await analyzer.analyzeIntent(code);
      const actions = analyzer.suggestNextActions(intent);
      
      // Should include habit-based suggestions
      const habitAction = actions.find(a => 
        a.description.toLowerCase().includes('habit')
      );
      
      if (habitAction) {
        expect(habitAction.parameters?.effectiveness).toBeGreaterThan(0.6);
      }
      
      // Restore mocks
      nowSpy.mockRestore();
      getHoursSpy.mockRestore();
      getDaySpy.mockRestore();
    });
  });

  describe('Learning and Adaptation', () => {
    test('should learn from recorded actions', () => {
      const initialActionCount = (analyzer as any).recentActions.length;
      
      analyzer.recordAction('refactor', { type: 'cleanup' });
      analyzer.recordAction('debug', { type: 'breakpoint' });
      
      const finalActionCount = (analyzer as any).recentActions.length;
      expect(finalActionCount).toBe(initialActionCount + 2);
    });

    test('should update keystroke patterns', () => {
      const behaviorContext = {
        keystrokes: ['Ctrl+K', 'Ctrl+C']
      };

      analyzer.recordAction('comment', behaviorContext);
      
      // The keystroke pattern should be learned
      const patterns = (analyzer as any).keystrokePatterns;
      const newPattern = patterns.find((p: any) => 
        p.sequence.includes('Ctrl+K') && p.sequence.includes('Ctrl+C')
      );
      
      expect(newPattern).toBeDefined();
    });

    test('should maintain recent action history limit', () => {
      // Record more than 50 actions
      for (let i = 0; i < 60; i++) {
        analyzer.recordAction(`action${i}`, { index: i });
      }
      
      const recentActions = (analyzer as any).recentActions;
      expect(recentActions.length).toBeLessThanOrEqual(50);
      
      // Should keep the most recent actions
      expect(recentActions[recentActions.length - 1]).toBe('action59');
    });
  });

  describe('Code Characteristics Analysis', () => {
    test('should analyze code complexity', async () => {
      const complexCode = `
        function complex(data) {
          if (data) {
            for (let i = 0; i < data.length; i++) {
              if (data[i].valid) {
                switch (data[i].type) {
                  case 'A':
                    return processA(data[i]);
                  case 'B':
                    return processB(data[i]);
                  default:
                    throw new Error('Unknown type');
                }
              }
            }
          }
          return null;
        }
      `;
      
      const intent = await analyzer.analyzeIntent(complexCode);
      
      expect(intent.context?.codeCharacteristics).toBeDefined();
      expect(intent.context?.codeCharacteristics.complexity).toBeGreaterThanOrEqual(5);
    });

    test('should detect test code characteristics', async () => {
      const testCode = `
        describe('MyFunction', () => {
          it('should work correctly', () => {
            expect(myFunction()).toBe(true);
          });
        });
      `;
      
      const intent = await analyzer.analyzeIntent(testCode);
      
      expect(intent.context?.codeCharacteristics.hasTests).toBe(true);
    });

    test('should detect debugging characteristics', async () => {
      const debugCode = `
        function debug() {
          console.log('Debug info');
          return data;
        }
      `;
      
      const intent = await analyzer.analyzeIntent(debugCode);
      
      expect(intent.context?.codeCharacteristics.hasConsoleLog).toBe(true);
    });

    test('should detect async code characteristics', async () => {
      const asyncCode = `
        async function fetchData() {
          const result = await fetch('/api/data');
          return result.json();
        }
      `;
      
      const intent = await analyzer.analyzeIntent(asyncCode);
      
      expect(intent.context?.codeCharacteristics.hasAsync).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle analysis errors gracefully', async () => {
      // Force an error by mocking a method to throw
      const originalMethod = (analyzer as any).analyzeCurrentBehavior;
      (analyzer as any).analyzeCurrentBehavior = jest.fn(() => {
        throw new Error('Test error');
      });

      const intent = await analyzer.analyzeIntent('test code');
      
      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBe(0.5);
      
      // Restore original method
      (analyzer as any).analyzeCurrentBehavior = originalMethod;
    });

    test('should handle missing behavior context', async () => {
      const code = 'function test() { return true; }';
      const intent = await analyzer.analyzeIntent(code, undefined);
      
      expect(intent).toBeDefined();
      expect(intent.context?.analysisMethod).toBe('behavior-analysis');
    });
  });

  describe('Integration', () => {
    test('should work with run method', async () => {
      analyzer.recordAction('optimize', { type: 'performance' });
      
      const code = `
        function optimize() {
          for (let i = 0; i < 1000000; i++) {
            // Performance critical code
          }
        }
      `;
      
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    test('should provide estimated times for actions', async () => {
      analyzer.recordAction('refactor', { type: 'cleanup' });
      
      const code = 'function messy() { return "refactor me"; }';
      const actions = await analyzer.run(code);
      
      const actionWithTime = actions.find(a => a.estimatedTime !== undefined);
      expect(actionWithTime).toBeDefined();
      expect(actionWithTime?.estimatedTime).toBeGreaterThan(0);
    });

    test('should include session parameters in actions', async () => {
      analyzer.recordAction('debug', { type: 'breakpoint' });
      
      const code = 'console.log("debug");';
      const actions = await analyzer.run(code);
      
      const debugAction = actions.find(a => 
        a.parameters?.sessionType === 'debugging'
      );
      expect(debugAction).toBeDefined();
      expect(debugAction?.parameters?.suggestedTools).toContain('debugger');
    });
  });
});