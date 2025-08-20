#!/usr/bin/env node

/**
 * Ultra CLI Entry Point
 * Command line interface for the Ultra-Polished Evolution Manager
 */

import { program } from '../evolution/ultra-simple-manager';
import { Logger } from '../logging/logger';
import chalk from 'chalk';

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

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}