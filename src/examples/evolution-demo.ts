/**
 * Evolution System Demo
 * Demonstrates the autonomous evolution capabilities of Sherlock Ω IDE
 */

import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { EvolutionManager, EvolutionTask } from '../evolution/evolution-manager';
import { QuantumBotBuilder } from '../ai/quantum/quantum-bot-builder';
import { AIBotManager } from '../ai/ai-bot-manager';

async function runEvolutionDemo(): Promise<void> {
  console.log('🧬 Sherlock Ω Evolution System Demo\n');

  // Initialize components
  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const quantumBuilder = new QuantumBotBuilder(logger, performanceMonitor);
  const botManager = new AIBotManager(logger, performanceMonitor);
  
  // Use in-memory MongoDB for demo (in production, use real MongoDB)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sherlock_evolution_demo';
  
  const evolutionManager = new EvolutionManager(
    logger,
    performanceMonitor,
    quantumBuilder,
    botManager,
    mongoUri
  );

  // Set up event listeners for demo
  evolutionManager.on('evolution-started', (event) => {
    console.log(`🚀 Evolution started: ${event.task.description}`);
  });

  evolutionManager.on('evolution-completed', (event) => {
    const { task, result } = event;
    console.log(`✅ Evolution completed: ${task.description}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`   Security Score: ${(result.metrics.securityScore * 100).toFixed(1)}%`);
    console.log(`   Test Coverage: ${(result.metrics.testCoverage * 100).toFixed(1)}%`);
    console.log(`   Performance: ${(result.metrics.performance * 100).toFixed(1)}%`);
    
    if (result.metrics.quantumAdvantage && result.metrics.quantumAdvantage > 1) {
      console.log(`   🚀 Quantum Advantage: ${result.metrics.quantumAdvantage.toFixed(2)}x`);
    }
    console.log('');
  });

  evolutionManager.on('evolution-failed', (event) => {
    console.log(`❌ Evolution failed: ${event.task.description}`);
    console.log(`   Error: ${event.error.message}\n`);
  });

  try {
    console.log('📋 Queuing evolution tasks...\n');

    // Task 1: Add new quantum algorithm
    const quantumTask: EvolutionTask = {
      id: 'demo-quantum-001',
      description: 'Add Shor\'s factorization algorithm to quantum strategies',
      priority: 'high',
      category: 'quantum',
      estimatedComplexity: 8,
      requiredCapabilities: ['quantum-computing', 'number-theory', 'cryptography']
    };

    // Task 2: Security enhancement
    const securityTask: EvolutionTask = {
      id: 'demo-security-001',
      description: 'Implement advanced input validation and sanitization',
      priority: 'critical',
      category: 'security',
      estimatedComplexity: 6,
      requiredCapabilities: ['security-analysis', 'input-validation']
    };

    // Task 3: Performance optimization
    const performanceTask: EvolutionTask = {
      id: 'demo-performance-001',
      description: 'Optimize quantum circuit simulation performance',
      priority: 'medium',
      category: 'optimization',
      estimatedComplexity: 7,
      requiredCapabilities: ['performance-optimization', 'quantum-simulation']
    };

    // Task 4: Test coverage improvement
    const testingTask: EvolutionTask = {
      id: 'demo-testing-001',
      description: 'Generate comprehensive test suite for evolution system',
      priority: 'high',
      category: 'testing',
      estimatedComplexity: 5,
      requiredCapabilities: ['test-generation', 'coverage-analysis']
    };

    // Queue all tasks
    const tasks = [quantumTask, securityTask, performanceTask, testingTask];
    
    for (const task of tasks) {
      await evolutionManager.queueEvolution(task);
      console.log(`✓ Queued: ${task.description}`);
    }

    console.log('\n🔍 Evolution system status:');
    const status = evolutionManager.getEvolutionStatus();
    console.log(`   Queue Length: ${status.queueLength}`);
    console.log(`   Max Concurrent: ${status.maxConcurrent}`);
    console.log(`   System Status: ${status.enabled ? 'ENABLED' : 'DISABLED'}`);

    console.log('\n⏳ Waiting for evolutions to complete...\n');

    // Wait for all evolutions to complete (in a real system, this would be handled by the event loop)
    await new Promise(resolve => {
      let completedCount = 0;
      const totalTasks = tasks.length;

      const checkCompletion = () => {
        completedCount++;
        if (completedCount >= totalTasks) {
          resolve(void 0);
        }
      };

      evolutionManager.on('evolution-completed', checkCompletion);
      evolutionManager.on('evolution-failed', checkCompletion);

      // Timeout after 2 minutes
      setTimeout(() => {
        console.log('⏰ Demo timeout reached');
        resolve(void 0);
      }, 120000);
    });

    console.log('📊 Final Evolution History:');
    const history = evolutionManager.getEvolutionHistory();
    
    if (history.length === 0) {
      console.log('   No completed evolutions (this is expected in demo mode)');
    } else {
      history.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${result.taskId}`);
        console.log(`      Duration: ${(result.duration / 1000).toFixed(2)}s`);
        console.log(`      Quality: Security ${(result.metrics.securityScore * 100).toFixed(1)}% | Coverage ${(result.metrics.testCoverage * 100).toFixed(1)}% | Performance ${(result.metrics.performance * 100).toFixed(1)}%`);
      });
    }

    console.log('\n🎯 Evolution Demo Summary:');
    const finalStatus = evolutionManager.getEvolutionStatus();
    console.log(`   Total Completed: ${finalStatus.totalCompleted}`);
    console.log(`   Success Rate: ${(finalStatus.successRate * 100).toFixed(1)}%`);
    console.log(`   System Health: ${finalStatus.enabled ? '🟢 HEALTHY' : '🔴 DISABLED'}`);

  } catch (error) {
    console.error('❌ Evolution demo failed:', error);
  } finally {
    await evolutionManager.cleanup();
    console.log('\n🧹 Demo cleanup completed');
  }
}

// CLI Integration Example
async function runCLIExample(): Promise<void> {
  console.log('\n🖥️ CLI Integration Example\n');
  
  console.log('Available CLI commands:');
  console.log('  npm run evolve -- evolve "Add new quantum algorithm"');
  console.log('  npm run evolve -- status');
  console.log('  npm run evolve -- history');
  console.log('  npm run evolve -- quick quantum-algorithm');
  console.log('  npm run evolve -- quick security-audit');
  console.log('  npm run evolve -- quick performance-boost');
  console.log('  npm run evolve -- quick test-coverage');
  console.log('');
  
  console.log('Quick evolution shortcuts:');
  console.log('  npm run evolve:quantum     # Add quantum algorithm');
  console.log('  npm run evolve:security    # Security audit');
  console.log('  npm run evolve:performance # Performance boost');
  console.log('  npm run evolve:tests       # Improve test coverage');
  console.log('');
}

// Integration with Bot Colony Example
async function runBotColonyIntegration(): Promise<void> {
  console.log('🤖 Bot Colony Integration Example\n');
  
  console.log('The evolution system integrates with your existing bot colony:');
  console.log('');
  console.log('1. 🧬 Evolution Manager queues autonomous improvement tasks');
  console.log('2. 🤖 Bots execute evolution tasks using LangGraph workflows');
  console.log('3. 🔒 Security agents validate all generated code');
  console.log('4. ⚡ Quantum enhancement agents add quantum capabilities');
  console.log('5. 🎯 Optimization agents improve performance and quality');
  console.log('6. 📊 Results are deployed with automatic rollback capability');
  console.log('');
  console.log('This creates a self-improving system that gets better over time!');
  console.log('');
}

// Main demo runner
async function main(): Promise<void> {
  console.log('🌟 Welcome to Sherlock Ω Evolution System Demo\n');
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'full';

  switch (mode) {
    case 'evolution':
      await runEvolutionDemo();
      break;
    case 'cli':
      await runCLIExample();
      break;
    case 'integration':
      await runBotColonyIntegration();
      break;
    case 'full':
    default:
      await runEvolutionDemo();
      await runCLIExample();
      await runBotColonyIntegration();
      break;
  }

  console.log('✨ Demo completed! The future of autonomous development is here.\n');
}

// Run demo if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runEvolutionDemo, runCLIExample, runBotColonyIntegration };