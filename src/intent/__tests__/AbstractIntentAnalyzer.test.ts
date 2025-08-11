/**
 * Tests for AbstractIntentAnalyzer
 */

import { AbstractIntentAnalyzer } from '../AbstractIntentAnalyzer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

// Test implementation of AbstractIntentAnalyzer
class TestIntentAnalyzer extends AbstractIntentAnalyzer {
  async analyzeIntent(code: string): Promise<IntentAnalysis> {
    if (code.includes('test')) {
      return this.createIntent('test', 0.9, ['test'], { method: 'test-analyzer' });
    }
    return this.createUnknownIntent(['unknown']);
  }

  suggestNextActions(intent: IntentAnalysis): ActionPlan[] {
    if (intent.intentType === 'test') {
      return [{
        description: 'Run test suite',
        priority: 1,
        parameters: { framework: 'jest' }
      }];
    }
    return [{
      description: 'Manual review required',
      priority: 2
    }];
  }
}

describe('AbstractIntentAnalyzer', () => {
  let analyzer: TestIntentAnalyzer;

  beforeEach(() => {
    analyzer = new TestIntentAnalyzer();
  });

  describe('Base Functionality', () => {
    test('should be properly initialized', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(AbstractIntentAnalyzer);
    });

    test('should have default threshold of 0.6', () => {
      expect((analyzer as any).threshold).toBe(0.6);
    });

    test('should implement run method', async () => {
      const code = 'test code';
      const actions = await analyzer.run(code);
      
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  describe('Intent Creation Helpers', () => {
    test('createIntent should create valid intent', () => {
      const intent = (analyzer as any).createIntent(
        'refactor',
        0.8,
        ['refactor', 'cleanup'],
        { method: 'test' }
      );

      expect(intent.intentType).toBe('refactor');
      expect(intent.confidence).toBe(0.8);
      expect(intent.keyExpressions).toEqual(['refactor', 'cleanup']);
      expect(intent.context?.method).toBe('test');
      expect(intent.timestamp).toBeDefined();
      expect(typeof intent.timestamp).toBe('number');
    });

    test('createIntent should clamp confidence values', () => {
      const lowIntent = (analyzer as any).createIntent('test', -0.5, []);
      const highIntent = (analyzer as any).createIntent('test', 1.5, []);

      expect(lowIntent.confidence).toBe(0);
      expect(highIntent.confidence).toBe(1);
    });

    test('createUnknownIntent should create unknown intent', () => {
      const intent = (analyzer as any).createUnknownIntent(['some', 'expressions']);

      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBe(0.5);
      expect(intent.keyExpressions).toEqual(['some', 'expressions']);
      expect(intent.timestamp).toBeDefined();
    });

    test('createUnknownIntent should handle empty expressions', () => {
      const intent = (analyzer as any).createUnknownIntent();

      expect(intent.intentType).toBe('unknown');
      expect(intent.confidence).toBe(0.5);
      expect(intent.keyExpressions).toEqual([]);
    });
  });

  describe('Confidence Checking', () => {
    test('isConfidentIntent should return true for high confidence', () => {
      const highConfidenceIntent: IntentAnalysis = {
        intentType: 'test',
        confidence: 0.8,
        keyExpressions: [],
        timestamp: Date.now()
      };

      const result = (analyzer as any).isConfidentIntent(highConfidenceIntent);
      expect(result).toBe(true);
    });

    test('isConfidentIntent should return false for low confidence', () => {
      const lowConfidenceIntent: IntentAnalysis = {
        intentType: 'test',
        confidence: 0.4,
        keyExpressions: [],
        timestamp: Date.now()
      };

      const result = (analyzer as any).isConfidentIntent(lowConfidenceIntent);
      expect(result).toBe(false);
    });

    test('isConfidentIntent should handle threshold boundary', () => {
      const thresholdIntent: IntentAnalysis = {
        intentType: 'test',
        confidence: 0.6,
        keyExpressions: [],
        timestamp: Date.now()
      };

      const result = (analyzer as any).isConfidentIntent(thresholdIntent);
      expect(result).toBe(true);
    });
  });

  describe('Logging', () => {
    test('logAnalysis should not throw errors', () => {
      const intent: IntentAnalysis = {
        intentType: 'test',
        confidence: 0.8,
        keyExpressions: ['test'],
        timestamp: Date.now()
      };

      // Mock console.debug to capture logs
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      expect(() => {
        (analyzer as any).logAnalysis(intent);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('[IntentAnalyzer]', expect.objectContaining({
        type: 'test',
        confidence: 0.8,
        expressions: ['test'],
        timestamp: expect.any(String)
      }));

      consoleSpy.mockRestore();
    });
  });

  describe('Workflow Integration', () => {
    test('run should call analyzeIntent and suggestNextActions', async () => {
      const analyzeIntentSpy = jest.spyOn(analyzer, 'analyzeIntent');
      const suggestActionsSpy = jest.spyOn(analyzer, 'suggestNextActions');

      const code = 'test code';
      await analyzer.run(code);

      expect(analyzeIntentSpy).toHaveBeenCalledWith(code);
      expect(suggestActionsSpy).toHaveBeenCalledWith(expect.objectContaining({
        intentType: 'test',
        confidence: 0.9
      }));

      analyzeIntentSpy.mockRestore();
      suggestActionsSpy.mockRestore();
    });

    test('run should log analysis results', async () => {
      const logSpy = jest.spyOn(analyzer as any, 'logAnalysis');

      const code = 'test code';
      await analyzer.run(code);

      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
        intentType: 'test',
        confidence: 0.9
      }));

      logSpy.mockRestore();
    });

    test('run should return actions from suggestNextActions', async () => {
      const code = 'test code';
      const actions = await analyzer.run(code);

      expect(actions).toEqual([{
        description: 'Run test suite',
        priority: 1,
        parameters: { framework: 'jest' }
      }]);
    });

    test('run should handle unknown intent', async () => {
      const code = 'unknown code';
      const actions = await analyzer.run(code);

      expect(actions).toEqual([{
        description: 'Manual review required',
        priority: 2
      }]);
    });
  });

  describe('Abstract Method Requirements', () => {
    test('concrete implementation must implement analyzeIntent', async () => {
      const result = await analyzer.analyzeIntent('test');
      expect(result).toBeDefined();
      expect(result.intentType).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.keyExpressions).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('concrete implementation must implement suggestNextActions', () => {
      const intent: IntentAnalysis = {
        intentType: 'test',
        confidence: 0.8,
        keyExpressions: [],
        timestamp: Date.now()
      };

      const actions = analyzer.suggestNextActions(intent);
      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
    });
  });
});