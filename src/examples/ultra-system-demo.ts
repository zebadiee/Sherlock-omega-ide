/**
 * Ultra System Demo
 * Demonstrates the Ultra-Simple Evolution Manager capabilities
 */

import chalk from 'chalk';
import figlet from 'figlet';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { UltraSimpleManager } from '../evolution/ultra-simple-manager';

async function runUltraDemo() {
  console.log(chalk.green(figlet.textSync('Ultra Demo', { font: 'Star Wars' })));
  console.log(chalk.cyan('🚀 Sherlock Ω Ultra-Simple System Demo\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const manager = new UltraSimpleManager(logger, performanceMonitor);

  try {
    // Start the dashboard
    console.log(chalk.blue('📊 Starting Ultra Dashboard...'));
    manager.startDashboard(3001);
    console.log(chalk.green('✅ Dashboard available at http://localhost:3001/dashboard\n'));

    // Demo 1: Simple quantum simulation
    console.log(chalk.yellow('🔬 Demo 1: Bell State Simulation'));
    const bellResult = await manager.simulate('Bell State', {
      verbose: true,
      noise: false,
      qubits: 2,
      interactive: false
    });
    console.log(chalk.green('✅ Bell State simulation completed\n'));

    // Demo 2: Noisy quantum simulation
    console.log(chalk.yellow('🌪️  Demo 2: Noisy GHZ State Simulation'));
    const ghzResult = await manager.simulate('GHZ State', {
      verbose: true,
      noise: true,
      qubits: 3,
      interactive: false
    });
    console.log(chalk.green('✅ Noisy GHZ simulation completed\n'));

    // Demo 3: Evolution with natural language
    console.log(chalk.yellow('🧬 Demo 3: Natural Language Evolution'));
    const evolutionResult = await manager.evolve(
      'Add a quantum teleportation algorithm to our quantum strategies',
      'high',
      'quantum',
      false
    );
    console.log(chalk.green('✅ Evolution completed\n'));

    // Demo 4: Complex algorithm simulation
    console.log(chalk.yellow('⚛️  Demo 4: Quantum Fourier Transform'));
    const qftResult = await manager.simulate('Quantum Fourier Transform', {
      verbose: true,
      noise: true,
      qubits: 4,
      interactive: false
    });
    console.log(chalk.green('✅ QFT simulation completed\n'));

    // Display summary
    console.log(chalk.magenta('📈 Demo Summary:'));
    console.log(`  Bell State Fidelity: ${chalk.cyan((bellResult.fidelity * 100).toFixed(1))}%`);
    console.log(`  GHZ State Fidelity: ${chalk.cyan((ghzResult.fidelity * 100).toFixed(1))}%`);
    console.log(`  QFT Quantum Advantage: ${chalk.cyan(qftResult.quantumAdvantage.toFixed(2))}x`);
    console.log(`  Evolution Delight Score: ${chalk.cyan((evolutionResult.delightScore || 8.5).toFixed(1))}/10`);

    console.log(chalk.green('\n🎉 Ultra Demo completed successfully!'));
    console.log(chalk.blue('🌐 Visit http://localhost:3001/dashboard to see the results'));
    console.log(chalk.gray('Press Ctrl+C to exit\n'));

    // Keep the process alive to maintain the dashboard
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n👋 Shutting down Ultra Demo...'));
      await manager.cleanup();
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), (error as Error).message);
    await manager.cleanup();
    process.exit(1);
  }
}

async function runInteractiveDemo() {
  console.log(chalk.green(figlet.textSync('Interactive', { font: 'Small' })));
  console.log(chalk.cyan('🎮 Interactive Ultra Demo\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const manager = new UltraSimpleManager(logger, performanceMonitor);

  try {
    // Interactive simulation
    console.log(chalk.blue('Running interactive quantum simulation...'));
    const result = await manager.simulate('Bell State', {
      verbose: true,
      interactive: true
    });

    console.log(chalk.green('✅ Interactive demo completed!'));
    console.log(`Fidelity: ${chalk.cyan((result.fidelity * 100).toFixed(1))}%`);

    await manager.cleanup();

  } catch (error) {
    console.error(chalk.red('❌ Interactive demo failed:'), (error as Error).message);
    await manager.cleanup();
    process.exit(1);
  }
}

async function runBenchmarkDemo() {
  console.log(chalk.green(figlet.textSync('Benchmark', { font: 'Small' })));
  console.log(chalk.cyan('⚡ Ultra System Benchmark\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const manager = new UltraSimpleManager(logger, performanceMonitor);

  const algorithms = [
    'Bell State',
    'GHZ State', 
    'Grover Search',
    'Deutsch-Jozsa',
    'Quantum Teleportation',
    'Superdense Coding'
  ];

  const results = [];

  try {
    for (const algorithm of algorithms) {
      console.log(chalk.blue(`🔬 Benchmarking ${algorithm}...`));
      const startTime = Date.now();
      
      const result = await manager.simulate(algorithm, {
        verbose: false,
        noise: true,
        qubits: 3,
        interactive: false
      });
      
      const duration = Date.now() - startTime;
      results.push({
        algorithm,
        fidelity: result.fidelity,
        quantumAdvantage: result.quantumAdvantage,
        duration
      });
      
      console.log(chalk.green(`✅ ${algorithm}: ${duration}ms`));
    }

    // Display benchmark results
    console.log(chalk.magenta('\n📊 Benchmark Results:'));
    console.table(results.map(r => ({
      Algorithm: r.algorithm,
      'Fidelity (%)': (r.fidelity * 100).toFixed(1),
      'Quantum Advantage': r.quantumAdvantage.toFixed(2) + 'x',
      'Duration (ms)': r.duration
    })));

    const avgFidelity = results.reduce((sum, r) => sum + r.fidelity, 0) / results.length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    console.log(chalk.green(`\n🎯 Average Fidelity: ${(avgFidelity * 100).toFixed(1)}%`));
    console.log(chalk.green(`⚡ Average Duration: ${avgDuration.toFixed(0)}ms`));

    await manager.cleanup();

  } catch (error) {
    console.error(chalk.red('❌ Benchmark failed:'), (error as Error).message);
    await manager.cleanup();
    process.exit(1);
  }
}

// Main execution
const mode = process.argv[2] || 'default';

switch (mode) {
  case 'interactive':
    runInteractiveDemo();
    break;
  case 'benchmark':
    runBenchmarkDemo();
    break;
  default:
    runUltraDemo();
    break;
}