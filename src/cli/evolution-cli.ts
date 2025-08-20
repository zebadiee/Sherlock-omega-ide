/**
 * Evolution CLI - Command line interface for autonomous evolution system
 */

import { Command } from 'commander';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { EvolutionManager, EvolutionTask } from '../evolution/evolution-manager';
import { QuantumBotBuilder } from '../ai/quantum/quantum-bot-builder';
import { AIBotManager } from '../ai/ai-bot-manager';

export class EvolutionCLI {
  private evolutionManager: EvolutionManager;
  private program: Command;

  constructor(
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    quantumBuilder: QuantumBotBuilder,
    botManager: AIBotManager,
    mongoUri: string
  ) {
    this.evolutionManager = new EvolutionManager(
      logger,
      performanceMonitor,
      quantumBuilder,
      botManager,
      mongoUri
    );

    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('sherlock-evolve')
      .description('Sherlock Ω Autonomous Evolution System')
      .version('1.0.0');

    // Evolution command
    this.program
      .command('evolve')
      .description('Queue a new evolution task')
      .argument('<description>', 'Description of what to evolve')
      .option('-p, --priority <priority>', 'Task priority (low|medium|high|critical)', 'medium')
      .option('-c, --category <category>', 'Task category (feature|optimization|security|quantum|testing)', 'feature')
      .option('-x, --complexity <complexity>', 'Estimated complexity (1-10)', '5')
      .option('--capabilities <capabilities>', 'Required capabilities (comma-separated)')
      .option('--deadline <deadline>', 'Task deadline (ISO date)')
      .action(async (description, options) => {
        try {
          const task: EvolutionTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description,
            priority: options.priority as any,
            category: options.category as any,
            estimatedComplexity: parseInt(options.complexity),
            requiredCapabilities: options.capabilities ? options.capabilities.split(',').map((s: string) => s.trim()) : [],
            deadline: options.deadline ? new Date(options.deadline) : undefined
          };

          const taskId = await this.evolutionManager.queueEvolution(task);
          
          console.log(`✅ Evolution task queued successfully!`);
          console.log(`Task ID: ${taskId}`);
          console.log(`Description: ${description}`);
          console.log(`Priority: ${task.priority}`);
          console.log(`Category: ${task.category}`);
          
          // Monitor progress
          this.monitorEvolution(taskId);
          
        } catch (error) {
          console.error('❌ Failed to queue evolution task:', error);
          process.exit(1);
        }
      });

    // Status command
    this.program
      .command('status')
      .description('Show evolution system status')
      .action(() => {
        const status = this.evolutionManager.getEvolutionStatus();
        
        console.log('\n🔬 Sherlock Ω Evolution System Status\n');
        console.log(`Status: ${status.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
        console.log(`Queue Length: ${status.queueLength}`);
        console.log(`Active Evolutions: ${status.activeEvolutions}/${status.maxConcurrent}`);
        console.log(`Total Completed: ${status.totalCompleted}`);
        console.log(`Success Rate: ${(status.successRate * 100).toFixed(1)}%`);
      });

    // History command
    this.program
      .command('history')
      .description('Show evolution history')
      .option('-l, --limit <limit>', 'Number of results to show', '10')
      .action((options) => {
        const history = this.evolutionManager.getEvolutionHistory(parseInt(options.limit));
        
        console.log('\n📊 Evolution History\n');
        
        if (history.length === 0) {
          console.log('No evolution history found.');
          return;
        }

        history.forEach((result, index) => {
          const status = result.success ? '✅' : '❌';
          const duration = (result.duration / 1000).toFixed(2);
          
          console.log(`${index + 1}. ${status} Task ${result.taskId}`);
          console.log(`   Duration: ${duration}s | Iterations: ${result.iterations}`);
          console.log(`   Security: ${(result.metrics.securityScore * 100).toFixed(1)}% | Coverage: ${(result.metrics.testCoverage * 100).toFixed(1)}% | Performance: ${(result.metrics.performance * 100).toFixed(1)}%`);
          
          if (result.metrics.quantumAdvantage && result.metrics.quantumAdvantage > 1) {
            console.log(`   🚀 Quantum Advantage: ${result.metrics.quantumAdvantage.toFixed(2)}x`);
          }
          
          console.log('');
        });
      });

    // Enable/disable commands
    this.program
      .command('enable')
      .description('Enable the evolution system')
      .action(() => {
        this.evolutionManager.setEvolutionEnabled(true);
        console.log('✅ Evolution system enabled');
      });

    this.program
      .command('disable')
      .description('Disable the evolution system')
      .action(() => {
        this.evolutionManager.setEvolutionEnabled(false);
        console.log('⏸️ Evolution system disabled');
      });

    // Configuration commands
    this.program
      .command('config')
      .description('Configure evolution system')
      .option('--max-concurrent <max>', 'Maximum concurrent evolutions')
      .action((options) => {
        if (options.maxConcurrent) {
          this.evolutionManager.setMaxConcurrentEvolutions(parseInt(options.maxConcurrent));
          console.log(`✅ Max concurrent evolutions set to ${options.maxConcurrent}`);
        }
      });

    // Quick evolution presets
    this.program
      .command('quick')
      .description('Quick evolution presets')
      .argument('<preset>', 'Preset name (quantum-algorithm|security-audit|performance-boost|test-coverage)')
      .action(async (preset) => {
        const presets = {
          'quantum-algorithm': {
            description: 'Add new quantum algorithm to quantum strategies',
            priority: 'high' as const,
            category: 'quantum' as const,
            complexity: 7,
            capabilities: ['quantum-computing', 'algorithm-design']
          },
          'security-audit': {
            description: 'Perform comprehensive security audit and hardening',
            priority: 'critical' as const,
            category: 'security' as const,
            complexity: 8,
            capabilities: ['security-analysis', 'vulnerability-assessment']
          },
          'performance-boost': {
            description: 'Optimize system performance and resource usage',
            priority: 'medium' as const,
            category: 'optimization' as const,
            complexity: 6,
            capabilities: ['performance-optimization', 'profiling']
          },
          'test-coverage': {
            description: 'Improve test coverage to 95%+ across all modules',
            priority: 'high' as const,
            category: 'testing' as const,
            complexity: 5,
            capabilities: ['test-generation', 'coverage-analysis']
          }
        };

        const presetConfig = presets[preset as keyof typeof presets];
        if (!presetConfig) {
          console.error(`❌ Unknown preset: ${preset}`);
          console.log('Available presets:', Object.keys(presets).join(', '));
          process.exit(1);
        }

        const task: EvolutionTask = {
          id: `preset-${preset}-${Date.now()}`,
          ...presetConfig,
          requiredCapabilities: presetConfig.capabilities,
          estimatedComplexity: presetConfig.complexity
        };

        try {
          const taskId = await this.evolutionManager.queueEvolution(task);
          console.log(`🚀 ${preset} evolution started!`);
          console.log(`Task ID: ${taskId}`);
          
          this.monitorEvolution(taskId);
          
        } catch (error) {
          console.error('❌ Failed to start preset evolution:', error);
          process.exit(1);
        }
      });
  }

  private monitorEvolution(taskId: string): void {
    console.log(`\n🔍 Monitoring evolution ${taskId}...\n`);
    
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerIndex = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${spinner[spinnerIndex]} Evolving... `);
      spinnerIndex = (spinnerIndex + 1) % spinner.length;
    }, 100);

    // Listen for completion
    this.evolutionManager.once('evolution-completed', (event) => {
      if (event.task.id === taskId) {
        clearInterval(interval);
        process.stdout.write('\r');
        
        if (event.result.success) {
          console.log('✅ Evolution completed successfully!');
          console.log(`Duration: ${(event.result.duration / 1000).toFixed(2)}s`);
          console.log(`Iterations: ${event.result.iterations}`);
          console.log(`Security Score: ${(event.result.metrics.securityScore * 100).toFixed(1)}%`);
          console.log(`Test Coverage: ${(event.result.metrics.testCoverage * 100).toFixed(1)}%`);
          console.log(`Performance: ${(event.result.metrics.performance * 100).toFixed(1)}%`);
          
          if (event.result.metrics.quantumAdvantage && event.result.metrics.quantumAdvantage > 1) {
            console.log(`🚀 Quantum Advantage: ${event.result.metrics.quantumAdvantage.toFixed(2)}x`);
          }
        } else {
          console.log('❌ Evolution failed');
        }
      }
    });

    this.evolutionManager.once('evolution-failed', (event) => {
      if (event.task.id === taskId) {
        clearInterval(interval);
        process.stdout.write('\r');
        console.log('❌ Evolution failed:', event.error.message);
      }
    });
  }

  run(args: string[]): void {
    this.program.parse(args);
  }
}

// CLI Entry Point
export function createEvolutionCLI(): EvolutionCLI {
  // These would be injected from your main application
  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const quantumBuilder = new QuantumBotBuilder(logger, performanceMonitor);
  const botManager = new AIBotManager(logger, performanceMonitor);
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sherlock_evolution';

  return new EvolutionCLI(logger, performanceMonitor, quantumBuilder, botManager, mongoUri);
}

// If run directly
if (require.main === module) {
  const cli = createEvolutionCLI();
  cli.run(process.argv);
}