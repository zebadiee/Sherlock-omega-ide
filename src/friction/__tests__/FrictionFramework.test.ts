/**
 * Tests for Friction Detection Framework
 * Validates the foundational friction detection and elimination system
 */

import { 
  SimpleSyntaxFrictionDetector, 
  SyntaxFrictionPoint 
} from '../SimpleSyntaxFrictionDetector';
import { 
  SimpleZeroFrictionProtocol,
  DEFAULT_PROTOCOL_CONFIG 
} from '../SimpleZeroFrictionProtocol';
import { 
  FrictionDetector, 
  FrictionPoint,
  DEFAULT_FRICTION_DETECTOR_CONFIG 
} from '../BaseFrictionDetector';

describe('Friction Detection Framework', () => {
  
  describe('BaseFrictionDetector', () => {
    // Create a mock detector for testing the base functionality
    class MockFrictionDetector extends FrictionDetector<FrictionPoint> {
      constructor() {
        super('MockDetector');
      }

      detect(context: string): FrictionPoint[] {
        // Mock detection: create friction for strings containing "error"
        if (context.includes('error')) {
          return [{
            id: 'mock-1',
            description: 'Mock error detected',
            severity: 0.8,
            location: { line: 1, column: 1 },
            timestamp: Date.now()
          }];
        }
        return [];
      }

      async eliminate(point: FrictionPoint): Promise<boolean> {
        point.attempted = true;
        // Mock elimination: succeed for severity < 0.9
        const success = point.severity < 0.9;
        point.eliminated = success;
        this.record(point, success);
        return success;
      }
    }

    let detector: MockFrictionDetector;

    beforeEach(() => {
      detector = new MockFrictionDetector();
    });

    it('should detect friction points correctly', () => {
      const friction = detector.detect('this has an error');
      expect(friction).toHaveLength(1);
      expect(friction[0].description).toBe('Mock error detected');
      expect(friction[0].severity).toBe(0.8);
    });

    it('should return empty array when no friction detected', () => {
      const friction = detector.detect('clean code');
      expect(friction).toHaveLength(0);
    });

    it('should eliminate friction and record results', async () => {
      const friction = detector.detect('this has an error')[0];
      const success = await detector.eliminate(friction);
      
      expect(success).toBe(true);
      expect(friction.attempted).toBe(true);
      expect(friction.eliminated).toBe(true);
      
      const history = detector.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].eliminated).toBe(true);
    });

    it('should track statistics correctly', async () => {
      // Detect and eliminate some friction
      const friction1 = detector.detect('error 1')[0];
      const friction2 = detector.detect('error 2')[0];
      
      await detector.eliminate(friction1);
      await detector.eliminate(friction2);
      
      const stats = detector.getStats();
      expect(stats.totalDetected).toBe(2);
      expect(stats.totalAttempted).toBe(2);
      expect(stats.totalEliminated).toBe(2);
      expect(stats.eliminationRate).toBe(1.0);
    });

    it('should filter high severity friction', async () => {
      // Create high severity friction
      const highSeverityFriction: FrictionPoint = {
        id: 'high-1',
        description: 'High severity error',
        severity: 0.9,
        timestamp: Date.now()
      };
      
      detector['history'].push(highSeverityFriction);
      
      const highSeverity = detector.getHighSeverityFriction(0.8);
      expect(highSeverity).toHaveLength(1);
      expect(highSeverity[0].severity).toBe(0.9);
    });
  });

  describe('SimpleSyntaxFrictionDetector', () => {
    let detector: SimpleSyntaxFrictionDetector;

    beforeEach(() => {
      detector = new SimpleSyntaxFrictionDetector();
    });

    it('should detect missing semicolon', () => {
      const sampleCode = `function test() { console.log("hello") }`; // missing semicolon
      const points = detector.detect(sampleCode);
      
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toHaveProperty('errorCode');
      expect(points[0]).toHaveProperty('description');
      expect(points[0].severity).toBeGreaterThan(0);
    });

    it('should detect missing closing bracket', () => {
      const sampleCode = `function test() { console.log("hello");`; // missing }
      const points = detector.detect(sampleCode);
      
      expect(points.length).toBeGreaterThan(0);
      const bracketError = points.find(p => 
        p.description.toLowerCase().includes('expected') && 
        p.description.includes('}')
      );
      expect(bracketError).toBeDefined();
    });

    it('should detect unterminated string', () => {
      const sampleCode = `const message = "hello world`; // missing closing quote
      const points = detector.detect(sampleCode);
      
      expect(points.length).toBeGreaterThan(0);
      const stringError = points.find(p => 
        p.description.toLowerCase().includes('unterminated')
      );
      expect(stringError).toBeDefined();
    });

    it('should handle valid code without errors', () => {
      const sampleCode = `function test() { return "hello"; }`;
      const points = detector.detect(sampleCode);
      
      // Filter out library-related errors
      const syntaxErrors = points.filter(p => 
        !p.description.includes('Cannot find name') && 
        !p.description.includes('target library')
      );
      
      expect(syntaxErrors).toHaveLength(0);
    });

    it('should generate appropriate suggestions', async () => {
      const sampleCode = `function test() { console.log("hello") }`; // missing semicolon
      const points = detector.detect(sampleCode);
      
      if (points.length > 0) {
        await detector.eliminate(points[0]);
        expect(points[0].attempted).toBe(true);
        
        if (points[0].suggestion) {
          expect(typeof points[0].suggestion).toBe('string');
          expect(points[0].suggestion.length).toBeGreaterThan(0);
        }
      }
    });

    it('should calculate severity correctly', () => {
      const sampleCode = `function test() { console.log("hello") }`;
      const points = detector.detect(sampleCode);
      
      for (const point of points) {
        expect(point.severity).toBeGreaterThanOrEqual(0);
        expect(point.severity).toBeLessThanOrEqual(1);
      }
    });

    it('should provide syntax-specific statistics', async () => {
      const sampleCode = `function test() { console.log("hello") }`;
      const points = detector.detect(sampleCode);
      
      // Attempt elimination on detected points
      for (const point of points) {
        await detector.eliminate(point);
      }
      
      const stats = detector.getSyntaxStats();
      expect(stats).toHaveProperty('errorsByCode');
      expect(stats).toHaveProperty('errorsByCategory');
      expect(stats).toHaveProperty('autoFixableCount');
      expect(typeof stats.autoFixableCount).toBe('number');
    });
  });

  describe('SimpleZeroFrictionProtocol', () => {
    let detector: SimpleSyntaxFrictionDetector;
    let protocol: SimpleZeroFrictionProtocol;

    beforeEach(() => {
      detector = new SimpleSyntaxFrictionDetector();
      protocol = new SimpleZeroFrictionProtocol([detector]);
    });

    it('should run protocol and return results', async () => {
      const sampleCode = `function test() { console.log("hello") }`; // missing semicolon
      const result = await protocol.run(sampleCode);
      
      expect(result).toHaveProperty('totalFriction');
      expect(result).toHaveProperty('eliminatedFriction');
      expect(result).toHaveProperty('failedElimination');
      expect(result).toHaveProperty('detectorResults');
      expect(result).toHaveProperty('executionTime');
      
      expect(result.detectorResults).toHaveLength(1);
      expect(result.detectorResults[0].detectorName).toBe('SimpleSyntaxFrictionDetector');
    });

    it('should handle multiple detectors', async () => {
      // Create a second mock detector
      class SecondMockDetector extends FrictionDetector<FrictionPoint> {
        constructor() {
          super('SecondMockDetector');
        }

        detect(): FrictionPoint[] {
          return [{
            id: 'second-1',
            description: 'Second detector friction',
            severity: 0.5,
            timestamp: Date.now()
          }];
        }

        async eliminate(point: FrictionPoint): Promise<boolean> {
          point.attempted = true;
          point.eliminated = true;
          this.record(point, true);
          return true;
        }
      }

      const secondDetector = new SecondMockDetector();
      protocol.addDetector(secondDetector);
      
      const result = await protocol.run('test code');
      expect(result.detectorResults).toHaveLength(2);
      
      const detectorNames = result.detectorResults.map(dr => dr.detectorName);
      expect(detectorNames).toContain('SimpleSyntaxFrictionDetector');
      expect(detectorNames).toContain('SecondMockDetector');
    });

    it('should track execution history', async () => {
      await protocol.run('test code 1');
      await protocol.run('test code 2');
      
      const history = protocol.getExecutionHistory();
      expect(history).toHaveLength(2);
      
      for (const result of history) {
        expect(result).toHaveProperty('executionTime');
        expect(result.executionTime).toBeGreaterThan(0);
      }
    });

    it('should provide protocol statistics', async () => {
      await protocol.run('function test() { console.log("hello") }');
      await protocol.run('const x = 5');
      
      const stats = protocol.getProtocolStats();
      expect(stats.totalExecutions).toBe(2);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats).toHaveProperty('detectorPerformance');
      expect(stats.detectorPerformance).toHaveProperty('SimpleSyntaxFrictionDetector');
    });

    it('should handle detector errors gracefully', async () => {
      // Create a detector that throws errors
      class ErrorDetector extends FrictionDetector<FrictionPoint> {
        constructor() {
          super('ErrorDetector');
        }

        detect(): FrictionPoint[] {
          throw new Error('Detection failed');
        }

        async eliminate(): Promise<boolean> {
          return false;
        }
      }

      const errorDetector = new ErrorDetector();
      protocol.addDetector(errorDetector);
      
      const result = await protocol.run('test code');
      
      // Should still complete execution
      expect(result).toBeDefined();
      expect(result.detectorResults).toHaveLength(2);
      
      // Error detector should have errors recorded
      const errorResult = result.detectorResults.find(dr => dr.detectorName === 'ErrorDetector');
      expect(errorResult).toBeDefined();
      expect(errorResult!.errors.length).toBeGreaterThan(0);
    });

    it('should support parallel execution', async () => {
      const parallelConfig = {
        ...DEFAULT_PROTOCOL_CONFIG,
        parallelExecution: true,
        maxConcurrentDetectors: 2
      };
      
      const parallelProtocol = new SimpleZeroFrictionProtocol([detector], parallelConfig);
      const result = await parallelProtocol.run('test code');
      
      expect(result).toBeDefined();
      expect(result.detectorResults).toHaveLength(1);
    });

    it('should support sequential execution', async () => {
      const sequentialConfig = {
        ...DEFAULT_PROTOCOL_CONFIG,
        parallelExecution: false
      };
      
      const sequentialProtocol = new SimpleZeroFrictionProtocol([detector], sequentialConfig);
      const result = await sequentialProtocol.run('test code');
      
      expect(result).toBeDefined();
      expect(result.detectorResults).toHaveLength(1);
    });

    it('should manage detectors correctly', () => {
      const initialCount = protocol.getDetectors().length;
      
      // Add detector
      class TestDetector extends FrictionDetector<FrictionPoint> {
        constructor() {
          super('TestDetector');
        }
        detect(): FrictionPoint[] { return []; }
        async eliminate(): Promise<boolean> { return true; }
      }
      
      const testDetector = new TestDetector();
      protocol.addDetector(testDetector);
      expect(protocol.getDetectors()).toHaveLength(initialCount + 1);
      
      // Remove detector
      const removed = protocol.removeDetector('TestDetector');
      expect(removed).toBe(true);
      expect(protocol.getDetectors()).toHaveLength(initialCount);
      
      // Try to remove non-existent detector
      const notRemoved = protocol.removeDetector('NonExistentDetector');
      expect(notRemoved).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with real syntax errors', async () => {
      const detector = new SimpleSyntaxFrictionDetector();
      const protocol = new SimpleZeroFrictionProtocol([detector]);
      
      const codeWithErrors = `
        function greet(name) {
          console.log("Hello, " + name)  // missing semicolon
          return "greeting"
        }  // missing semicolon
      `;
      
      const result = await protocol.run(codeWithErrors);
      
      expect(result.totalFriction).toBeGreaterThan(0);
      expect(result.detectorResults).toHaveLength(1);
      expect(result.detectorResults[0].frictionDetected).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should maintain consistent state across multiple runs', async () => {
      const detector = new SimpleSyntaxFrictionDetector();
      const protocol = new SimpleZeroFrictionProtocol([detector]);
      
      // Run multiple times
      await protocol.run('const x = 5');
      await protocol.run('function test() { return 42; }');
      await protocol.run('let y = "hello"');
      
      const history = protocol.getExecutionHistory();
      expect(history).toHaveLength(3);
      
      const stats = protocol.getProtocolStats();
      expect(stats.totalExecutions).toBe(3);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });
  });
});