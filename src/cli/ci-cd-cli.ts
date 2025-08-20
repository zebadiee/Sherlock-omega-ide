#!/usr/bin/env node

/**
 * CI/CD CLI Entry Point
 * Command line interface for CI/CD build automation
 */

import { program } from '../automation/ci-cd-build-manager';
import { Logger } from '../logging/logger';
import chalk from 'chalk';
import figlet from 'figlet';

// Welcome banner
function showWelcome() {
  console.clear();
  console.log(chalk.green(figlet.textSync('CI/CD Pipeline', { font: 'Small' })));
  console.log(chalk.cyan('🚀 Continuous Integration & Deployment'));
  console.log(chalk.gray('Automated build pipelines for quantum algorithms\n'));
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Initialize logger
const logger = new Logger();

// Add global error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  logger.error('CLI Error:', err);
  process.exit(1);
});

// Show welcome banner
showWelcome();

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}