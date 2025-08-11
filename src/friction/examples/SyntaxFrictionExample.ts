/**
 * Example demonstrating Syntax Friction Elimination in action
 * Shows how the system detects and auto-corrects syntax errors in real-time
 */

import { 
  SyntaxFrictionDetector, 
  SyntaxContext, 
  SupportedLanguage 
} from '../SyntaxFrictionDetector';
import { ZeroFrictionProtocol } from '../ZeroFrictionProtocol';

/**
 * Demonstrates syntax friction detection and elimination
 */
export async function demonstrateSyntaxFrictionElimination(): Promise<void> {
  console.log('🔍 Sherlock Ω Syntax Friction Elimination Demo');
  console.log('='.repeat(50));

  // Initialize the syntax friction detector
  const detector = new SyntaxFrictionDetector();

  // Example 1: Missing semicolon
  console.log('\n📝 Example 1: Missing Semicolon');
  const context1: SyntaxContext = {
    filePath: 'example1.ts',
    content: 'const message = "Hello, World"\nconsole.log(message);',
    language: SupportedLanguage.TYPESCRIPT
  };

  const friction1 = await detector.detectFriction(context1);
  console.log(`   Detected ${friction1.length} friction points`);
  
  for (const f of friction1) {
    console.log(`   - ${f.description} at line ${f.location.line}`);
    console.log(`     Impact: ${(f.impact.flowDisruption * 100).toFixed(1)}% flow disruption`);
    
    // Attempt elimination
    const result = await detector.eliminateFriction(f);
    console.log(`     Elimination: ${result.success ? '✅ Success' : '❌ Failed'}`);
  }

  // Example 2: Missing closing bracket
  console.log('\n📝 Example 2: Missing Closing Bracket');
  const context2: SyntaxContext = {
    filePath: 'example2.ts',
    content: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n',
    language: SupportedLanguage.TYPESCRIPT
  };

  const friction2 = await detector.detectFriction(context2);
  console.log(`   Detected ${friction2.length} friction points`);
  
  for (const f of friction2) {
    console.log(`   - ${f.description} at line ${f.location.line}`);
    console.log(`     Severity: ${f.severity}/5`);
    console.log(`     Blocking potential: ${(f.impact.blockingPotential * 100).toFixed(1)}%`);
    
    // Attempt elimination
    const result = await detector.eliminateFriction(f);
    console.log(`     Elimination: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.success) {
      console.log(`     Strategy: ${result.strategy.name}`);
      console.log(`     Duration: ${result.duration}ms`);
    }
  }

  // Example 3: JSON syntax error
  console.log('\n📝 Example 3: JSON Syntax Error');
  const context3: SyntaxContext = {
    filePath: 'config.json',
    content: '{"name": "test", "version": 1.0, "active": }',
    language: SupportedLanguage.JSON
  };

  const friction3 = await detector.detectFriction(context3);
  console.log(`   Detected ${friction3.length} friction points`);
  
  for (const f of friction3) {
    console.log(`   - ${f.description}`);
    console.log(`     Cognitive load: ${(f.impact.cognitiveLoad * 100).toFixed(1)}%`);
    console.log(`     Estimated delay: ${f.impact.timeDelay}ms`);
  }

  // Example 4: Markdown syntax issues
  console.log('\n📝 Example 4: Markdown Syntax Issues');
  const context4: SyntaxContext = {
    filePath: 'README.md',
    content: '# Project\n\nCheck out [this link]() for details.\n\n```typescript\nconst x = 5;\n\nMore content...',
    language: SupportedLanguage.MARKDOWN
  };

  const friction4 = await detector.detectFriction(context4);
  console.log(`   Detected ${friction4.length} friction points`);
  
  for (const f of friction4) {
    console.log(`   - ${f.description} at line ${f.location.line}`);
    console.log(`     Tags: ${f.metadata.tags.join(', ')}`);
  }

  console.log('\n🎯 Zero-Friction Protocol Integration');
  console.log('-'.repeat(40));

  // Demonstrate integration with Zero-Friction Protocol
  const protocol = new ZeroFrictionProtocol({
    enabled: true,
    monitoringInterval: 1000,
    proactiveMode: true,
    flowStateThreshold: 0.8,
    maxConcurrentEliminations: 3,
    escalationThreshold: 2
  });

  // Start the protocol
  await protocol.start();
  
  // Let it run for a few cycles
  console.log('   Protocol started - monitoring for friction...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check flow state
  const flowState = protocol.getCurrentFlowState();
  console.log(`   Current flow state: ${flowState.level} (${(flowState.score * 100).toFixed(1)}%)`);
  console.log(`   Flow factors: ${flowState.factors.length}`);
  
  // Get statistics
  const stats = protocol.getStats();
  console.log(`   Total friction detected: ${stats.totalDetected}`);
  console.log(`   Total friction eliminated: ${stats.totalEliminated}`);
  console.log(`   Elimination rate: ${(stats.eliminationRate * 100).toFixed(1)}%`);
  
  // Stop the protocol
  protocol.stop();
  console.log('   Protocol stopped');

  console.log('\n✨ Demo completed! Syntax friction elimination is working.');
  console.log('   The system can detect and auto-correct syntax errors in real-time,');
  console.log('   maintaining optimal development flow state.');
}

/**
 * Run the demonstration if this file is executed directly
 */
if (require.main === module) {
  demonstrateSyntaxFrictionElimination().catch(console.error);
}