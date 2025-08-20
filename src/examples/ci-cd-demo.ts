/**
 * CI/CD Build System Demo
 * Demonstrates the complete CI/CD pipeline with MongoDB and Docker integration
 */

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { SimpleCiCdManager } from '../automation/simple-ci-cd-manager';

async function runCiCdDemo() {
  console.log(chalk.green(figlet.textSync('CI/CD Demo', { font: 'Star Wars' })));
  console.log(chalk.cyan('🚀 Sherlock Ω CI/CD Build System Demo\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const manager = new SimpleCiCdManager(logger, performanceMonitor);

  try {
    // Show available pipelines
    console.log(chalk.blue('📋 Available CI/CD Pipelines:'));
    const pipelines = manager.getPipelines();
    
    pipelines.forEach((pipeline, index) => {
      console.log(chalk.cyan(`${index + 1}. ${pipeline.name}`));
      console.log(chalk.gray(`   Stages: ${pipeline.stages.map(s => s.name).join(' → ')}`));
      console.log(chalk.gray(`   Triggers: ${pipeline.triggers.join(', ')}\n`));
    });

    // Let user choose pipeline and task
    const choices = await inquirer.prompt([
      {
        type: 'list',
        name: 'pipeline',
        message: 'Select a CI/CD pipeline:',
        choices: pipelines.map(p => ({
          name: `${p.name} - ${p.stages.length} stages`,
          value: p.id
        }))
      },
      {
        type: 'list',
        name: 'task',
        message: 'Select a quantum algorithm to build:',
        choices: [
          { name: 'Bell State - Quantum Entanglement', value: 'Bell State quantum entanglement algorithm' },
          { name: 'Grover Search - Database Search', value: 'Grover quantum search algorithm' },
          { name: 'Shor Algorithm - Integer Factorization', value: 'Shor quantum factorization algorithm' },
          { name: 'QFT - Quantum Fourier Transform', value: 'Quantum Fourier Transform algorithm' },
          { name: 'Custom Algorithm', value: 'Custom quantum algorithm implementation' }
        ]
      },
      {
        type: 'confirm',
        name: 'interactive',
        message: 'Run in interactive mode?',
        default: true
      }
    ]);

    console.log(chalk.yellow('\n🚀 Starting CI/CD Pipeline Execution...\n'));

    // Execute the pipeline
    const startTime = Date.now();
    const result = await manager.buildWithPipeline(
      choices.task,
      choices.pipeline,
      'high',
      'demo',
      choices.interactive
    );

    const duration = Date.now() - startTime;

    // Display results
    console.log(chalk.magenta('\n' + '='.repeat(60)));
    console.log(chalk.magenta('📊 CI/CD Pipeline Results'));
    console.log(chalk.magenta('='.repeat(60)));

    if (result.success) {
      console.log(chalk.green('✅ Pipeline Status: SUCCESS'));
      console.log(`⏱️  Total Duration: ${chalk.cyan((result.duration / 1000).toFixed(1))}s`);
      console.log(`🏗️  Build Version: ${chalk.cyan(result.version)}`);
      console.log(`📊 Pipeline: ${chalk.cyan(result.pipeline)}`);
      
      console.log(`🧪 Tests: ${chalk.green(result.tests.passed)} passed, ${result.tests.failed > 0 ? chalk.red(result.tests.failed) : chalk.gray(result.tests.failed)} failed`);
      console.log(`📈 Coverage: ${chalk.cyan((result.tests.coverage * 100).toFixed(1))}%`);
      console.log(`⚛️  Quantum Fidelity: ${chalk.cyan((result.simulation.fidelity * 100).toFixed(1))}%`);
      console.log(`🚀 Quantum Advantage: ${chalk.cyan(result.simulation.quantumAdvantage.toFixed(2))}x`);
      
      if (result.deployment.dockerImage) {
        console.log(`🐳 Docker Image: ${chalk.cyan(result.deployment.dockerImage)}`);
      }
      
      if (result.deployment.url) {
        console.log(`🌐 Deployment URL: ${chalk.blue(result.deployment.url)}`);
      }

      // Show stage details
      if (result.stages.length > 0) {
        console.log(chalk.blue('\n📝 Stage Results:'));
        result.stages.forEach((stage, index) => {
          const icon = stage.success ? '✅' : '❌';
          const duration = (stage.duration / 1000).toFixed(1);
          console.log(`  ${icon} ${stage.name} (${duration}s)`);
        });
      }

    } else {
      console.log(chalk.red('❌ Pipeline Status: FAILED'));
      console.log(`⏱️  Duration: ${chalk.cyan((result.duration / 1000).toFixed(1))}s`);
      
      if (result.errors.length > 0) {
        console.log(chalk.red('\n🚨 Errors:'));
        result.errors.forEach((error, index) => {
          console.log(chalk.red(`  ${index + 1}. ${error}`));
        });
      }

      if (result.suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Suggestions:'));
        result.suggestions.forEach((suggestion, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${suggestion}`));
        });
      }
    }

    // Show next steps
    console.log(chalk.yellow('\n🎯 Next Steps:'));
    if (result.success) {
      console.log(chalk.yellow('  • Visit the deployment URL to test your quantum algorithm'));
      console.log(chalk.yellow('  • Check the MongoDB health dashboard for metrics'));
      console.log(chalk.yellow('  • Run another pipeline with different parameters'));
    } else {
      console.log(chalk.yellow('  • Review the error messages above'));
      console.log(chalk.yellow('  • Check Docker and MongoDB are running'));
      console.log(chalk.yellow('  • Try the pipeline again with different settings'));
    }

    console.log(chalk.gray('\n💡 Tips:'));
    console.log(chalk.gray('  • Use "npm run ci-cd:pipelines" to see all available pipelines'));
    console.log(chalk.gray('  • Use "npm run ci-cd:interactive" for guided pipeline execution'));
    console.log(chalk.gray('  • Use "npm run ci-cd:stats" to view build statistics'));

    // Ask if user wants to run another pipeline
    const runAnother = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Would you like to run another CI/CD pipeline?',
        default: false
      }
    ]);

    if (runAnother.continue) {
      await runCiCdDemo();
    } else {
      console.log(chalk.green('\n🎉 CI/CD Demo completed!'));
      console.log(chalk.cyan('Thanks for exploring the Sherlock Ω CI/CD system!'));
    }

    await manager.cleanup();

  } catch (error) {
    console.error(chalk.red('\n❌ Demo failed:'), (error as Error).message);
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.yellow('  • Make sure Docker is installed and running'));
    console.log(chalk.yellow('  • Check that ports 27017 and 3000+ are available'));
    console.log(chalk.yellow('  • Ensure you have sufficient disk space for Docker images'));
    
    await manager.cleanup();
    process.exit(1);
  }
}

async function runQuickDemo() {
  console.log(chalk.green(figlet.textSync('Quick CI/CD', { font: 'Small' })));
  console.log(chalk.cyan('⚡ Quick CI/CD Pipeline Demo\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const manager = new SimpleCiCdManager(logger, performanceMonitor);

  try {
    // Run fast development pipeline
    console.log(chalk.blue('🚀 Running fast development pipeline...'));
    
    const result = await manager.buildWithPipeline(
      'Quick Bell State algorithm build',
      'dev-fast',
      'high',
      'demo',
      false
    );

    if (result.success) {
      console.log(chalk.green('✅ Quick build completed successfully!'));
      console.log(`⏱️  Duration: ${chalk.cyan((result.duration / 1000).toFixed(1))}s`);
      console.log(`🏗️  Version: ${chalk.cyan(result.version)}`);
      console.log(`⚛️  Fidelity: ${chalk.cyan((result.simulation.fidelity * 100).toFixed(1))}%`);
    } else {
      console.log(chalk.red('❌ Quick build failed'));
      if (result.errors.length > 0) {
        console.log(chalk.red('Errors:'), result.errors.join(', '));
      }
    }

    await manager.cleanup();

  } catch (error) {
    console.error(chalk.red('Quick demo failed:'), (error as Error).message);
    await manager.cleanup();
    process.exit(1);
  }
}

// Main execution
const mode = process.argv[2] || 'full';

switch (mode) {
  case 'quick':
    runQuickDemo();
    break;
  case 'full':
  default:
    runCiCdDemo();
    break;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n👋 Shutting down CI/CD demo...'));
  process.exit(0);
});