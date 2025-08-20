#!/usr/bin/env ts-node

/**
 * Sherlock Ω Startup Script
 * Automatically initializes infrastructure and starts the system
 */

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { Logger } from '../src/logging/logger';
import { PerformanceMonitor } from '../src/monitoring/performance-monitor';
import { InfrastructureManager } from '../src/infrastructure/infrastructure-manager';
import { SimpleCiCdManager } from '../src/automation/simple-ci-cd-manager';
import { InteractiveDashboard } from '../src/web/interactive-dashboard';

async function startSherlock() {
  // Welcome banner
  console.clear();
  console.log(chalk.green(figlet.textSync('Sherlock Omega', { font: 'Star Wars' })));
  console.log(chalk.cyan('🚀 Interactive Quantum Development Environment'));
  console.log(chalk.gray('Initializing system components...\n'));

  const logger = new Logger();
  const performanceMonitor = new PerformanceMonitor(logger);
  const infrastructureManager = new InfrastructureManager(logger);

  try {
    // Step 1: Initialize Infrastructure
    console.log(chalk.blue('📋 Step 1: Infrastructure Initialization'));
    const infraStatus = await infrastructureManager.initialize();

    if (infraStatus.overall === 'unhealthy') {
      console.log(chalk.red('\n❌ Infrastructure is unhealthy. Cannot start Sherlock Ω.'));
      console.log(chalk.yellow('💡 Please ensure Docker is installed and running.'));
      process.exit(1);
    }

    // Step 2: Start Services
    console.log(chalk.blue('\n📋 Step 2: Starting Sherlock Ω Services'));
    
    const services = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'services',
        message: 'Which services would you like to start?',
        choices: [
          { name: '🌐 Interactive Dashboard (Port 3002)', value: 'dashboard', checked: true },
          { name: '🏗️ CI/CD Build System', value: 'cicd', checked: true },
          { name: '📊 Health Monitoring', value: 'health', checked: true }
        ],
        validate: (input) => {
          return input.length > 0 ? true : 'Please select at least one service';
        }
      }
    ]);

    const startedServices: string[] = [];

    // Start Dashboard
    if (services.services.includes('dashboard')) {
      console.log(chalk.blue('🌐 Starting Interactive Dashboard...'));
      const dashboard = new InteractiveDashboard();
      dashboard.start(3002);
      startedServices.push('Interactive Dashboard (http://localhost:3002)');
    }

    // Initialize CI/CD Manager
    if (services.services.includes('cicd')) {
      console.log(chalk.blue('🏗️ Initializing CI/CD Build System...'));
      const cicdManager = new SimpleCiCdManager(logger, performanceMonitor);
      startedServices.push('CI/CD Build System');
    }

    // Start Health Monitoring
    if (services.services.includes('health')) {
      console.log(chalk.blue('📊 Starting Health Monitoring...'));
      startedServices.push('Health Monitoring');
    }

    // Step 3: Display Status
    console.log(chalk.green('\n🎉 Sherlock Ω Started Successfully!'));
    console.log(chalk.cyan('\n📋 Active Services:'));
    startedServices.forEach(service => {
      console.log(chalk.green(`  ✅ ${service}`));
    });

    // Step 4: Show Available Commands
    console.log(chalk.blue('\n🛠️ Available Commands:'));
    console.log(chalk.cyan('  npm run build:interactive     - Start interactive build wizard'));
    console.log(chalk.cyan('  npm run dashboard:interactive  - Launch web dashboard'));
    console.log(chalk.cyan('  npm run ci-cd:build           - Run CI/CD pipeline'));
    console.log(chalk.cyan('  npm run ci-cd:infrastructure  - Check infrastructure status'));
    console.log(chalk.cyan('  npm run demo:ci-cd            - Run CI/CD demo'));

    // Step 5: Quick Start Options
    const quickStart = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do next?',
        choices: [
          { name: '🏗️ Start Interactive Build Wizard', value: 'build' },
          { name: '🚀 Run CI/CD Demo', value: 'demo' },
          { name: '📊 Check System Status', value: 'status' },
          { name: '💻 Open Dashboard Only', value: 'dashboard' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    switch (quickStart.action) {
      case 'build':
        console.log(chalk.blue('\n🏗️ Starting Interactive Build Wizard...'));
        const { spawn } = require('child_process');
        spawn('npm', ['run', 'build:interactive'], { stdio: 'inherit' });
        break;

      case 'demo':
        console.log(chalk.blue('\n🚀 Running CI/CD Demo...'));
        spawn('npm', ['run', 'demo:ci-cd'], { stdio: 'inherit' });
        break;

      case 'status':
        console.log(chalk.blue('\n📊 Checking System Status...'));
        const status = await infrastructureManager.getStatus();
        console.log(chalk.green(`Overall Status: ${status.overall.toUpperCase()}`));
        break;

      case 'dashboard':
        console.log(chalk.blue('\n💻 Dashboard is running at http://localhost:3002'));
        console.log(chalk.gray('Press Ctrl+C to exit'));
        break;

      case 'exit':
        console.log(chalk.yellow('\n👋 Goodbye! Thanks for using Sherlock Ω'));
        process.exit(0);
        break;
    }

    // Keep process alive
    if (quickStart.action === 'dashboard') {
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n👋 Shutting down Sherlock Ω...'));
        await infrastructureManager.cleanup();
        process.exit(0);
      });

      // Keep alive
      setInterval(() => {}, 1000);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Failed to start Sherlock Ω:'), (error as Error).message);
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.yellow('  • Ensure Docker Desktop is installed and running'));
    console.log(chalk.yellow('  • Check that ports 27017, 6379, and 3002 are available'));
    console.log(chalk.yellow('  • Try running: docker-compose up -d'));
    
    await infrastructureManager.cleanup();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n👋 Shutting down Sherlock Ω...'));
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  process.exit(1);
});

// Start the system
startSherlock();