/**
 * Example demonstrating the Friction Detection Framework
 * Shows how to use the base framework with multiple detectors
 */

import { 
  SimpleSyntaxFrictionDetector 
} from '../SimpleSyntaxFrictionDetector';
import { 
  SimpleZeroFrictionProtocol 
} from '../SimpleZeroFrictionProtocol';
import { 
  FrictionDetector, 
  FrictionPoint 
} from '../BaseFrictionDetector';

/**
 * Example custom friction detector for code style issues
 */
class CodeStyleFrictionDetector extends FrictionDetector<FrictionPoint> {
  
  constructor() {
    super('CodeStyleFrictionDetector');
  }

  detect(sourceCode: string): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];
    const lines = sourceCode.split('\n');
    
    lines.forEach((line, index) => {
      // Check for inconsistent indentation (mixing tabs and spaces)
      if (line.includes('\t') && line.includes('  ')) {
        frictionPoints.push({
          id: `style-indent-${index}-${Date.now()}`,
          description: 'Mixed tabs and spaces for indentation',
          severity: 0.3,
          location: { line: index + 1, column: 1 },
          timestamp: Date.now(),
          metadata: { type: 'indentation', line: line.trim() }
        });
      }
      
      // Check for long lines (over 100 characters)
      if (line.length > 100) {
        frictionPoints.push({
          id: `style-length-${index}-${Date.now()}`,
          description: `Line too long (${line.length} characters)`,
          severity: 0.2,
          location: { line: index + 1, column: line.length },
          timestamp: Date.now(),
          metadata: { type: 'line-length', length: line.length }
        });
      }
      
      // Check for missing spaces around operators
      const operatorPattern = /[a-zA-Z0-9][+\-*/=][a-zA-Z0-9]/;
      if (operatorPattern.test(line)) {
        frictionPoints.push({
          id: `style-spacing-${index}-${Date.now()}`,
          description: 'Missing spaces around operators',
          severity: 0.1,
          location: { line: index + 1, column: line.search(operatorPattern) },
          timestamp: Date.now(),
          metadata: { type: 'operator-spacing', line: line.trim() }
        });
      }
    });
    
    return frictionPoints;
  }

  async eliminate(point: FrictionPoint): Promise<boolean> {
    point.attempted = true;
    
    const type = point.metadata?.type;
    let success = false;
    
    switch (type) {
      case 'indentation':
        console.log(`🔧 Auto-fixing indentation: ${point.description}`);
        success = true; // Simulate successful fix
        break;
        
      case 'operator-spacing':
        console.log(`🔧 Auto-fixing operator spacing: ${point.description}`);
        success = true; // Simulate successful fix
        break;
        
      case 'line-length':
        console.log(`⚠️ Manual fix needed for line length: ${point.description}`);
        success = false; // Requires manual intervention
        break;
        
      default:
        success = false;
    }
    
    point.eliminated = success;
    this.record(point, success);
    return success;
  }
}

/**
 * Example performance friction detector
 */
class PerformanceFrictionDetector extends FrictionDetector<FrictionPoint> {
  
  constructor() {
    super('PerformanceFrictionDetector');
  }

  detect(sourceCode: string): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];
    const lines = sourceCode.split('\n');
    
    lines.forEach((line, index) => {
      // Check for inefficient string concatenation in loops
      if (line.includes('for') && line.includes('+')) {
        frictionPoints.push({
          id: `perf-concat-${index}-${Date.now()}`,
          description: 'Potential inefficient string concatenation in loop',
          severity: 0.6,
          location: { line: index + 1, column: line.indexOf('+') },
          timestamp: Date.now(),
          metadata: { type: 'string-concatenation', line: line.trim() }
        });
      }
      
      // Check for synchronous operations that could be async
      if (line.includes('readFileSync') || line.includes('writeFileSync')) {
        frictionPoints.push({
          id: `perf-sync-${index}-${Date.now()}`,
          description: 'Synchronous file operation blocks event loop',
          severity: 0.8,
          location: { line: index + 1, column: line.indexOf('Sync') },
          timestamp: Date.now(),
          metadata: { type: 'sync-operation', line: line.trim() }
        });
      }
      
      // Check for console.log in production-like code
      if (line.includes('console.log') && !line.includes('//')) {
        frictionPoints.push({
          id: `perf-console-${index}-${Date.now()}`,
          description: 'Console.log statement may impact performance',
          severity: 0.4,
          location: { line: index + 1, column: line.indexOf('console.log') },
          timestamp: Date.now(),
          metadata: { type: 'console-log', line: line.trim() }
        });
      }
    });
    
    return frictionPoints;
  }

  async eliminate(point: FrictionPoint): Promise<boolean> {
    point.attempted = true;
    
    const type = point.metadata?.type;
    let success = false;
    
    switch (type) {
      case 'console-log':
        console.log(`🔧 Removing console.log: ${point.description}`);
        success = true; // Can be automatically removed
        break;
        
      case 'sync-operation':
        console.log(`💡 Suggesting async alternative: ${point.description}`);
        success = false; // Requires code refactoring
        break;
        
      case 'string-concatenation':
        console.log(`💡 Suggesting array join or template literals: ${point.description}`);
        success = false; // Requires code refactoring
        break;
        
      default:
        success = false;
    }
    
    point.eliminated = success;
    this.record(point, success);
    return success;
  }
}

/**
 * Demonstrate the friction detection framework
 */
export async function demonstrateFrictionFramework(): Promise<void> {
  console.log('🔍 Sherlock Ω Friction Detection Framework Demo');
  console.log('='.repeat(55));

  // Sample code with various types of friction
  const sampleCode = `
function processData(data) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result = result + data[i].toString();  // Inefficient concatenation
    }
    
    const config = readFileSync('./config.json', 'utf8');  // Sync operation
    console.log("Processing complete");  // Console.log
    
    // Mixed indentation (tabs and spaces)
	  const veryLongLineOfCodeThatExceedsTheRecommendedLengthAndShouldBeRefactoredForBetterReadability = true;
    
    return result+config;  // Missing spaces around operator
}

function test() {
    console.log("hello")  // Missing semicolon
    return processData([1, 2, 3])
}
`;

  // Create detectors
  const syntaxDetector = new SimpleSyntaxFrictionDetector();
  const styleDetector = new CodeStyleFrictionDetector();
  const performanceDetector = new PerformanceFrictionDetector();

  // Create protocol with all detectors
  const protocol = new SimpleZeroFrictionProtocol([
    syntaxDetector,
    styleDetector,
    performanceDetector
  ], {
    autoEliminate: true,
    parallelExecution: true,
    maxConcurrentDetectors: 3,
    timeoutMs: 10000
  });

  console.log('\n📊 Running friction detection across all detectors...\n');

  // Run the protocol
  const result = await protocol.run(sampleCode);

  // Display detailed results
  console.log('📈 Detailed Results by Detector:');
  console.log('-'.repeat(40));

  for (const detectorResult of result.detectorResults) {
    console.log(`\n🔍 ${detectorResult.detectorName}:`);
    console.log(`   Friction detected: ${detectorResult.frictionDetected}`);
    console.log(`   Friction eliminated: ${detectorResult.frictionEliminated}`);
    console.log(`   Failed eliminations: ${detectorResult.frictionFailed}`);
    console.log(`   Execution time: ${detectorResult.executionTime}ms`);
    
    if (detectorResult.errors.length > 0) {
      console.log(`   Errors: ${detectorResult.errors.join(', ')}`);
    }
  }

  // Show individual detector statistics
  console.log('\n📊 Individual Detector Statistics:');
  console.log('-'.repeat(40));

  console.log('\n🔧 Syntax Detector:');
  const syntaxStats = syntaxDetector.getSyntaxStats();
  console.log(`   Total detected: ${syntaxStats.totalDetected}`);
  console.log(`   Auto-fixable: ${syntaxStats.autoFixableCount}`);
  console.log(`   Elimination rate: ${(syntaxStats.eliminationRate * 100).toFixed(1)}%`);

  console.log('\n🎨 Style Detector:');
  const styleStats = styleDetector.getStats();
  console.log(`   Total detected: ${styleStats.totalDetected}`);
  console.log(`   Elimination rate: ${(styleStats.eliminationRate * 100).toFixed(1)}%`);

  console.log('\n⚡ Performance Detector:');
  const perfStats = performanceDetector.getStats();
  console.log(`   Total detected: ${perfStats.totalDetected}`);
  console.log(`   Elimination rate: ${(perfStats.eliminationRate * 100).toFixed(1)}%`);

  // Show protocol-level statistics
  console.log('\n🎯 Protocol Statistics:');
  console.log('-'.repeat(40));
  const protocolStats = protocol.getProtocolStats();
  console.log(`   Total executions: ${protocolStats.totalExecutions}`);
  console.log(`   Average execution time: ${protocolStats.averageExecutionTime.toFixed(2)}ms`);
  console.log(`   Overall elimination rate: ${(protocolStats.overallEliminationRate * 100).toFixed(1)}%`);

  // Demonstrate detector management
  console.log('\n🔧 Detector Management Demo:');
  console.log('-'.repeat(40));
  
  console.log(`   Initial detectors: ${protocol.getDetectors().length}`);
  
  // Add a new detector
  class SimpleDetector extends FrictionDetector<FrictionPoint> {
    constructor() { super('SimpleDetector'); }
    detect(): FrictionPoint[] { return []; }
    async eliminate(): Promise<boolean> { return true; }
  }
  
  protocol.addDetector(new SimpleDetector());
  console.log(`   After adding detector: ${protocol.getDetectors().length}`);
  
  // Remove a detector
  const removed = protocol.removeDetector('SimpleDetector');
  console.log(`   After removing detector: ${protocol.getDetectors().length} (removed: ${removed})`);

  // Show execution history
  console.log('\n📚 Execution History:');
  console.log('-'.repeat(40));
  const history = protocol.getExecutionHistory();
  console.log(`   Total executions recorded: ${history.length}`);
  
  if (history.length > 0) {
    const lastExecution = history[history.length - 1];
    console.log(`   Last execution: ${lastExecution.totalFriction} friction points, ${lastExecution.eliminatedFriction} eliminated`);
  }

  console.log('\n✨ Framework Demo Complete!');
  console.log('   The friction detection framework successfully:');
  console.log('   • Detected multiple types of friction across different detectors');
  console.log('   • Attempted automatic elimination where possible');
  console.log('   • Provided comprehensive statistics and reporting');
  console.log('   • Demonstrated extensibility with custom detectors');
  console.log('   • Showed robust error handling and management capabilities');
}

/**
 * Run the demonstration if this file is executed directly
 */
if (require.main === module) {
  demonstrateFrictionFramework().catch(console.error);
}