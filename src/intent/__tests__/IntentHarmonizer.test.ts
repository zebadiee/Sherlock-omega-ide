/**
 * Tests for IntentHarmonizer
 */

import { IntentHarmonizer, IntentProfile, AnalyzerType, ConflictStrategy } from '../IntentHarmonizer';
import { IntentAnalysis, ActionPlan } from '@core/interfaces';

describe('IntentHarmonizer', () => {
  let harmonizer: IntentHarmonizer;

  beforeEach(() => {
    harmonizer = new IntentHarmonizer();
  });

  describe('Basic Functionality', () => {
    test('should be properly initialized', () => {
      expect(harmonizer).toBeDefined();
      expect(harmonizer).toBeInstanceOf(IntentHarmonizer);
    });

    test('should have default analyzer weights', () => {
      const weights = harmonizer.getAnalyzerWeights();
      
      expect(weights[AnalyzerType.SIMPLE]).toBeDefined();
      expect(weights[AnalyzerType.PATTERN]).toBeDefined();
      expect(weights[AnalyzerType.BEHAVIOR]).toBeDefined();
      
      // Weights should sum to approximately 1
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1.0, 1);
    });

    test('should handle empty code', async () => {
      const profile = await harmonizer.harmonizeIntent('');
      
      expect(profile).toBeDefined();
      expect(profile.primaryIntent).toBe('unknown');
      expect(profile.contributingAnalyzers).toHaveLength(3);
    });
  });

  describe('Intent Harmonization', () => {
    test('should harmonize consistent intents from all analyzers', async () => {
      const code = `
        for (let i = 0; i < data.length; i++) {
          console.log(data[i]);
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.primaryIntent).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0.5);
      expect(profile.consensusLevel).toBeGreaterThan(0.3);
      expect(profile.contributingAnalyzers).toHaveLength(3);
      expect(profile.harmonizedActions.length).toBeGreaterThan(0);
    });

    test('should handle conflicting intents from analyzers', async () => {
      const code = `
        // TODO: refactor this function
        function debugFunction() {
          console.log('debug info');
          eval('some code');
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.primaryIntent).toBeDefined();
      expect(profile.conflictResolution).toBeDefined();
      expect(profile.conflictResolution.conflictLevel).toBeGreaterThanOrEqual(0);
      
      // If there's conflict, there should be alternative intents
      if (profile.conflictResolution.conflictLevel > 0) {
        expect(profile.conflictResolution.alternativeIntents.length).toBeGreaterThan(0);
        expect(profile.consensusLevel).toBeLessThan(1.0);
      } else {
        // If no conflict, consensus should be reasonable
        expect(profile.consensusLevel).toBeGreaterThan(0.3);
      }
    });

    test('should use weighted consensus for low conflict', async () => {
      const code = `
        function cleanCode() {
          return data.map(item => item.value);
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      if (profile.conflictResolution.conflictLevel < 0.3) {
        expect(profile.conflictResolution.strategy).toBe(ConflictStrategy.WEIGHTED_CONSENSUS);
      }
      
      expect(profile.confidence).toBeGreaterThan(0.4);
    });

    test('should use highest confidence for medium conflict', async () => {
      const code = `
        // Mixed signals code
        const test = () => {
          console.log('testing');
          if (data === null) return;
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.conflictResolution).toBeDefined();
      expect(profile.conflictResolution.resolvedBy).toBeDefined();
    });
  });

  describe('Analyzer Contributions', () => {
    test('should include contributions from all analyzers', async () => {
      const code = 'function example() { return true; }';
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.contributingAnalyzers).toHaveLength(3);
      
      const analyzerTypes = profile.contributingAnalyzers.map(c => c.analyzerType);
      expect(analyzerTypes).toContain(AnalyzerType.SIMPLE);
      expect(analyzerTypes).toContain(AnalyzerType.PATTERN);
      expect(analyzerTypes).toContain(AnalyzerType.BEHAVIOR);
    });

    test('should calculate reliability scores for each analyzer', async () => {
      const code = `
        async function processData() {
          for (let i = 0; i < items.length; i++) {
            await processItem(items[i]);
          }
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      profile.contributingAnalyzers.forEach(contrib => {
        expect(contrib.reliability).toBeGreaterThan(0);
        expect(contrib.reliability).toBeLessThanOrEqual(1);
        expect(contrib.weight).toBeGreaterThan(0);
        expect(contrib.intent).toBeDefined();
      });
    });

    test('should boost pattern analyzer reliability for multiple patterns', async () => {
      const code = `
        async function complexFunction() {
          try {
            for (let i = 0; i < data.length; i++) {
              const result = await processItem(data[i]);
              if (result === null) {
                throw new Error('Processing failed');
              }
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      const patternContrib = profile.contributingAnalyzers.find(c => c.analyzerType === AnalyzerType.PATTERN);
      expect(patternContrib).toBeDefined();
      expect(patternContrib?.reliability).toBeGreaterThan(0.6);
    });
  });

  describe('Conflict Resolution', () => {
    test('should detect high consensus when analyzers agree', async () => {
      const code = `
        describe('test suite', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      // Test-related code should have high consensus
      expect(profile.consensusLevel).toBeGreaterThan(0.5);
      expect(profile.conflictResolution.conflictLevel).toBeLessThan(0.5);
    });

    test('should resolve conflicts using analyzer priority for high conflict', async () => {
      const code = `
        // Very mixed signals
        TODO: optimize this
        function debug() {
          test('something', () => {});
          eval('code');
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      if (profile.conflictResolution.conflictLevel >= 0.7) {
        expect(profile.conflictResolution.strategy).toBe(ConflictStrategy.ANALYZER_PRIORITY);
        expect([AnalyzerType.BEHAVIOR, AnalyzerType.PATTERN, AnalyzerType.SIMPLE])
          .toContain(profile.conflictResolution.resolvedBy);
      }
    });

    test('should provide alternative intents when conflicts exist', async () => {
      const code = `
        // Refactor this debug function
        function debugRefactor() {
          console.log('debug');
          return optimizedValue;
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      if (profile.conflictResolution.conflictLevel > 0.3) {
        expect(profile.conflictResolution.alternativeIntents.length).toBeGreaterThan(0);
        expect(profile.conflictResolution.alternativeIntents).not.toContain(profile.primaryIntent);
      }
    });
  });

  describe('Action Harmonization', () => {
    test('should combine and deduplicate actions from all analyzers', async () => {
      const code = `
        function needsWork() {
          for (let i = 0; i < 1000; i++) {
            console.log(i);
          }
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.harmonizedActions.length).toBeGreaterThan(0);
      expect(profile.harmonizedActions.length).toBeLessThanOrEqual(5); // Limited to top 5
      
      // Actions should have priorities
      profile.harmonizedActions.forEach(action => {
        expect(action.priority).toBeDefined();
        expect(action.description).toBeDefined();
      });
    });

    test('should prioritize actions based on primary intent', async () => {
      const code = `
        // Security issue
        const result = eval(userInput);
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      if (profile.primaryIntent === 'secure') {
        const securityActions = profile.harmonizedActions.filter(action =>
          action.description.toLowerCase().includes('security') ||
          action.description.toLowerCase().includes('eval')
        );
        
        if (securityActions.length > 0) {
          expect(securityActions[0].priority).toBeLessThanOrEqual(2);
        }
      }
    });

    test('should include estimated times for actions', async () => {
      const code = 'function example() { return "test"; }';
      const profile = await harmonizer.harmonizeIntent(code);
      
      const actionsWithTime = profile.harmonizedActions.filter(a => a.estimatedTime !== undefined);
      expect(actionsWithTime.length).toBeGreaterThan(0);
    });
  });

  describe('Behavior Context Integration', () => {
    test('should use behavior context when provided', async () => {
      const behaviorContext = {
        keystrokes: ['Ctrl+F', 'Ctrl+H'],
        sessionType: 'refactoring'
      };
      
      const code = 'function oldName() { return value; }';
      const profile = await harmonizer.harmonizeIntent(code, behaviorContext);
      
      const behaviorContrib = profile.contributingAnalyzers.find(c => c.analyzerType === AnalyzerType.BEHAVIOR);
      expect(behaviorContrib).toBeDefined();
      
      // Behavior analyzer should have higher confidence with context
      if (behaviorContrib) {
        expect(behaviorContrib.intent.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should boost behavior analyzer reliability with multiple signals', async () => {
      const behaviorContext = {
        keystrokes: ['F12', 'console.log'],
        sessionType: 'debugging',
        recentActions: ['debug', 'debug', 'debug']
      };
      
      const code = 'console.log("debug info");';
      const profile = await harmonizer.harmonizeIntent(code, behaviorContext);
      
      const behaviorContrib = profile.contributingAnalyzers.find(c => c.analyzerType === AnalyzerType.BEHAVIOR);
      expect(behaviorContrib?.reliability).toBeGreaterThan(0.6);
    });
  });

  describe('Quality Assessment', () => {
    test('should calculate quality score based on multiple factors', async () => {
      const code = `
        async function wellStructured() {
          try {
            const data = await fetchData();
            return data.map(item => item.value);
          } catch (error) {
            console.error('Error:', error);
            throw error;
          }
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.metadata.qualityScore).toBeGreaterThan(0.5);
      expect(profile.metadata.qualityScore).toBeLessThanOrEqual(1.0);
    });

    test('should include comprehensive metadata', async () => {
      const code = 'function test() { return true; }';
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.metadata.analysisTimestamp).toBeDefined();
      expect(profile.metadata.totalAnalyzers).toBe(3);
      expect(profile.metadata.harmonizationMethod).toBeDefined();
      expect(profile.metadata.contextFactors).toBeDefined();
      expect(Array.isArray(profile.metadata.contextFactors)).toBe(true);
    });

    test('should extract relevant context factors', async () => {
      const code = `
        for (let i = 0; i < data.length; i++) {
          console.log(data[i]);
        }
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.metadata.contextFactors.length).toBeGreaterThan(0);
      
      // Should include analysis methods
      const hasAnalysisMethod = profile.metadata.contextFactors.some(factor =>
        factor.includes('pattern') || factor.includes('behavior') || factor.includes('analysis')
      );
      expect(hasAnalysisMethod).toBe(true);
    });
  });

  describe('Weight Management', () => {
    test('should allow updating analyzer weights', () => {
      const initialWeights = harmonizer.getAnalyzerWeights();
      
      harmonizer.updateAnalyzerWeight(AnalyzerType.PATTERN, 0.9);
      
      const updatedWeights = harmonizer.getAnalyzerWeights();
      expect(updatedWeights[AnalyzerType.PATTERN]).toBeGreaterThan(initialWeights[AnalyzerType.PATTERN]);
      
      // Weights should still sum to approximately 1
      const total = Object.values(updatedWeights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1.0, 1);
    });

    test('should normalize weights after updates', () => {
      harmonizer.updateAnalyzerWeight(AnalyzerType.SIMPLE, 0.1);
      harmonizer.updateAnalyzerWeight(AnalyzerType.PATTERN, 0.9);
      harmonizer.updateAnalyzerWeight(AnalyzerType.BEHAVIOR, 0.8);
      
      const weights = harmonizer.getAnalyzerWeights();
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      
      expect(total).toBeCloseTo(1.0, 2);
      expect(weights[AnalyzerType.PATTERN]).toBeGreaterThan(weights[AnalyzerType.SIMPLE]);
    });

    test('should enforce weight bounds', () => {
      harmonizer.updateAnalyzerWeight(AnalyzerType.SIMPLE, 0.0); // Should be clamped to 0.1
      harmonizer.updateAnalyzerWeight(AnalyzerType.PATTERN, 1.0); // Should be clamped to 0.8
      
      const weights = harmonizer.getAnalyzerWeights();
      
      expect(weights[AnalyzerType.SIMPLE]).toBeGreaterThanOrEqual(0.1);
      expect(weights[AnalyzerType.PATTERN]).toBeLessThanOrEqual(0.8);
    });
  });

  describe('Error Handling', () => {
    test('should handle harmonization errors gracefully', async () => {
      // Mock one of the analyzers to throw an error
      const originalMethod = (harmonizer as any).simpleAnalyzer.analyzeIntent;
      (harmonizer as any).simpleAnalyzer.analyzeIntent = jest.fn().mockRejectedValue(new Error('Test error'));

      const profile = await harmonizer.harmonizeIntent('test code');
      
      expect(profile).toBeDefined();
      expect(profile.primaryIntent).toBe('unknown');
      expect(profile.metadata.harmonizationMethod).toBe('fallback');
      expect(profile.harmonizedActions[0].description).toContain('failed');
      
      // Restore original method
      (harmonizer as any).simpleAnalyzer.analyzeIntent = originalMethod;
    });

    test('should provide fallback profile with low quality score', async () => {
      // Force an error by mocking all analyzers to fail
      const originalSimple = (harmonizer as any).simpleAnalyzer.analyzeIntent;
      const originalPattern = (harmonizer as any).patternAnalyzer.analyzeIntent;
      const originalBehavior = (harmonizer as any).behaviorAnalyzer.analyzeIntent;

      (harmonizer as any).simpleAnalyzer.analyzeIntent = jest.fn().mockRejectedValue(new Error('Error'));
      (harmonizer as any).patternAnalyzer.analyzeIntent = jest.fn().mockRejectedValue(new Error('Error'));
      (harmonizer as any).behaviorAnalyzer.analyzeIntent = jest.fn().mockRejectedValue(new Error('Error'));

      const profile = await harmonizer.harmonizeIntent('test');
      
      expect(profile.confidence).toBeLessThan(0.5);
      expect(profile.metadata.qualityScore).toBeLessThan(0.5);
      expect(profile.contributingAnalyzers).toHaveLength(0);
      
      // Restore original methods
      (harmonizer as any).simpleAnalyzer.analyzeIntent = originalSimple;
      (harmonizer as any).patternAnalyzer.analyzeIntent = originalPattern;
      (harmonizer as any).behaviorAnalyzer.analyzeIntent = originalBehavior;
    });
  });

  describe('Integration', () => {
    test('should work with complex real-world code', async () => {
      const code = `
        import React, { useState, useEffect } from 'react';
        
        // TODO: optimize this component
        function UserProfile({ userId }) {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);
          
          useEffect(() => {
            async function fetchUser() {
              try {
                const response = await fetch(\`/api/users/\${userId}\`);
                const userData = await response.json();
                setUser(userData);
              } catch (error) {
                console.error('Failed to fetch user:', error);
              } finally {
                setLoading(false);
              }
            }
            
            fetchUser();
          }, [userId]);
          
          if (loading) return <div>Loading...</div>;
          if (!user) return <div>User not found</div>;
          
          return (
            <div>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
            </div>
          );
        }
        
        export default UserProfile;
      `;
      
      const profile = await harmonizer.harmonizeIntent(code);
      
      expect(profile.primaryIntent).toBeDefined();
      expect(profile.confidence).toBeGreaterThan(0.4);
      expect(profile.harmonizedActions.length).toBeGreaterThan(0);
      expect(profile.metadata.qualityScore).toBeGreaterThan(0.3);
    });

    test('should handle different programming languages/frameworks', async () => {
      const pythonLikeCode = `
        def process_data(data):
            # TODO: refactor this function
            for item in data:
                if item is None:
                    continue
                print(f"Processing: {item}")
                result = expensive_operation(item)
                if result:
                    yield result
      `;
      
      const profile = await harmonizer.harmonizeIntent(pythonLikeCode);
      
      expect(profile).toBeDefined();
      expect(profile.primaryIntent).toBeDefined();
      expect(profile.contributingAnalyzers.length).toBe(3);
    });
  });
});