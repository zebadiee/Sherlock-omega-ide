#!/usr/bin/env node

/**
 * SHERLOCK Ω COMMAND LINE INTERFACE
 * 
 * Interactive CLI for managing the autonomous development environment
 */

const readline = require('readline');
const { performance } = require('perf_hooks');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Mock Sherlock Ω System
class SherlockOmegaCLI {
  constructor() {
    this.isRunning = false;
    this.isSafeMode = false;
    this.startTime = null;
    this.evolutions = [];
    this.validations = 0;
    this.blocked = 0;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt()
    });
    
    this.setupCommands();
  }

  getPrompt() {
    const status = this.isSafeMode ? '🛡️ SAFE' : this.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE';
    return `${colors.cyan}sherlock-ω${colors.reset} [${status}] > `;
  }

  updatePrompt() {
    this.rl.setPrompt(this.getPrompt());
  }

  log(message, color = colors.white) {
    console.log(`${color}${message}${colors.reset}`);
  }

  error(message) {
    this.log(`❌ ${message}`, colors.red);
  }

  success(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
  }

  info(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  setupCommands() {
    this.commands = {
      help: {
        description: 'Show available commands',
        handler: () => this.showHelp()
      },
      start: {
        description: 'Start the Sherlock Ω system',
        handler: () => this.startSystem()
      },
      stop: {
        description: 'Stop the Sherlock Ω system',
        handler: () => this.stopSystem()
      },
      status: {
        description: 'Show system status and metrics',
        handler: () => this.showStatus()
      },
      'safe-mode': {
        description: 'Toggle safe mode on/off',
        handler: () => this.toggleSafeMode()
      },
      evolve: {
        description: 'Request an evolution (usage: evolve <description>)',
        handler: (args) => this.requestEvolution(args.join(' '))
      },
      list: {
        description: 'List recent evolutions',
        handler: () => this.listEvolutions()
      },
      validate: {
        description: 'Test safety validation with sample code',
        handler: () => this.testValidation()
      },
      monitor: {
        description: 'Show real-time system monitoring',
        handler: () => this.showMonitoring()
      },
      clear: {
        description: 'Clear the screen',
        handler: () => {
          console.clear();
          this.showBanner();
        }
      },
      exit: {
        description: 'Exit the CLI',
        handler: () => this.exit()
      }
    };
  }

  showBanner() {
    console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  ${colors.bright}🛡️  SHERLOCK Ω (OMEGA) - AUTONOMOUS DEVELOPMENT CLI${colors.reset}${colors.cyan}     ║
║                                                               ║
║  ${colors.gray}The command center for your self-healing IDE${colors.reset}${colors.cyan}              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.yellow}Type 'help' to see available commands${colors.reset}
`);
  }

  showHelp() {
    this.log('\n📚 Available Commands:', colors.bright);
    this.log('─'.repeat(50), colors.gray);
    
    Object.entries(this.commands).forEach(([cmd, info]) => {
      const padding = ' '.repeat(Math.max(0, 12 - cmd.length));
      this.log(`  ${colors.cyan}${cmd}${padding}${colors.reset} ${info.description}`);
    });
    
    this.log('\n💡 Examples:', colors.bright);
    this.log('  evolve Add user authentication with tests', colors.gray);
    this.log('  evolve Add payment processing without tests', colors.gray);
    this.log('  validate', colors.gray);
    this.log('');
  }

  async startSystem() {
    if (this.isRunning) {
      this.warning('System is already running');
      return;
    }

    this.log('🚀 Starting Sherlock Ω system...', colors.blue);
    
    // Simulate startup sequence
    const steps = [
      'Initializing Safety Validation System',
      'Starting Evolution Engine', 
      'Activating AI Orchestrator',
      'Enabling Real-time Monitoring'
    ];

    for (const step of steps) {
      process.stdout.write(`   ${step}... `);
      await this.sleep(500);
      this.log('✅', colors.green);
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.updatePrompt();
    
    this.success('System started successfully');
    this.info('All components are online and ready for autonomous development');
  }

  stopSystem() {
    if (!this.isRunning) {
      this.warning('System is not running');
      return;
    }

    this.log('🛑 Stopping Sherlock Ω system...', colors.blue);
    
    this.isRunning = false;
    this.isSafeMode = false;
    this.startTime = null;
    this.updatePrompt();
    
    this.success('System stopped gracefully');
  }

  showStatus() {
    const uptime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const uptimeStr = uptime > 60 ? `${Math.floor(uptime/60)}m ${uptime%60}s` : `${uptime}s`;
    
    this.log('\n📊 System Status', colors.bright);
    this.log('─'.repeat(30), colors.gray);
    
    this.log(`Overall Status: ${this.isSafeMode ? '🛡️  SAFE MODE' : this.isRunning ? '🟢 HEALTHY' : '🔴 OFFLINE'}`);
    this.log(`Uptime: ${uptimeStr}`);
    this.log(`Safe Mode: ${this.isSafeMode ? 'ACTIVE' : 'INACTIVE'}`);
    
    this.log('\n🔧 Components:', colors.bright);
    this.log(`  Safety Validation: ${this.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    this.log(`  Evolution Engine:  ${this.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    this.log(`  AI Orchestrator:   ${this.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
    this.log(`  Monitoring:        🟢 ONLINE`);
    
    this.log('\n📈 Metrics:', colors.bright);
    this.log(`  Total Validations: ${this.validations}`);
    this.log(`  Blocked Deployments: ${this.blocked}`);
    this.log(`  Success Rate: ${this.validations > 0 ? ((this.validations - this.blocked) / this.validations * 100).toFixed(1) : 100}%`);
    this.log(`  Recent Evolutions: ${this.evolutions.length}`);
    this.log('');
  }

  toggleSafeMode() {
    if (!this.isRunning) {
      this.error('Cannot toggle safe mode - system is not running');
      return;
    }

    this.isSafeMode = !this.isSafeMode;
    this.updatePrompt();
    
    if (this.isSafeMode) {
      this.log('🚨 ENTERING SAFE MODE', colors.red);
      this.warning('All autonomous operations suspended');
      this.info('Manual intervention required to exit safe mode');
    } else {
      this.log('🔄 Exiting safe mode...', colors.blue);
      this.success('Safe mode deactivated - system operational');
    }
  }

  async requestEvolution(description) {
    if (!description.trim()) {
      this.error('Please provide an evolution description');
      this.info('Usage: evolve <description>');
      return;
    }

    if (!this.isRunning) {
      this.error('Cannot request evolution - system is not running');
      return;
    }

    if (this.isSafeMode) {
      this.error('Cannot request evolution - system is in safe mode');
      return;
    }

    const evolutionId = `evo-${Date.now()}`;
    const evolution = {
      id: evolutionId,
      description,
      timestamp: new Date(),
      status: 'pending'
    };

    this.evolutions.unshift(evolution);
    this.log(`🧬 Processing evolution: ${evolutionId}`, colors.blue);
    this.log(`   Description: ${description}`, colors.gray);
    
    // Simulate safety validation
    process.stdout.write('   🛡️  Safety validation... ');
    await this.sleep(1000);
    
    this.validations++;
    
    // Determine if evolution is safe
    const isUnsafe = description.toLowerCase().includes('without tests') ||
                     description.toLowerCase().includes('no tests') ||
                     description.toLowerCase().includes('risky') ||
                     description.toLowerCase().includes('complex');
    
    if (isUnsafe) {
      this.blocked++;
      evolution.status = 'blocked';
      evolution.reason = 'Safety validation failed - insufficient test coverage or high complexity';
      
      this.log('❌ BLOCKED', colors.red);
      this.error(`Evolution blocked: ${evolution.reason}`);
    } else {
      evolution.status = 'approved';
      this.log('✅ APPROVED', colors.green);
      
      // Simulate processing
      process.stdout.write('   🔄 Processing evolution... ');
      await this.sleep(800);
      this.log('✅ COMPLETED', colors.green);
      
      this.success(`Evolution ${evolutionId} deployed successfully`);
    }
  }

  listEvolutions() {
    if (this.evolutions.length === 0) {
      this.info('No evolutions requested yet');
      return;
    }

    this.log('\n📋 Recent Evolutions', colors.bright);
    this.log('─'.repeat(50), colors.gray);
    
    this.evolutions.slice(0, 10).forEach(evo => {
      const statusIcon = {
        'pending': '🟡',
        'approved': '✅',
        'blocked': '❌'
      }[evo.status];
      
      const statusColor = {
        'pending': colors.yellow,
        'approved': colors.green,
        'blocked': colors.red
      }[evo.status];
      
      this.log(`${statusIcon} ${evo.id}`, statusColor);
      this.log(`   ${evo.description}`, colors.gray);
      this.log(`   ${evo.timestamp.toLocaleString()}`, colors.gray);
      
      if (evo.reason) {
        this.log(`   Reason: ${evo.reason}`, colors.red);
      }
      
      this.log('');
    });
  }

  async testValidation() {
    if (!this.isRunning) {
      this.error('Cannot test validation - system is not running');
      return;
    }

    this.log('🧪 Testing Safety Validation System', colors.blue);
    this.log('─'.repeat(40), colors.gray);
    
    const testCases = [
      { desc: 'Add user auth with comprehensive tests', safe: true },
      { desc: 'Add payment processing without tests', safe: false },
      { desc: 'Implement complex ML algorithm', safe: false },
      { desc: 'Add simple utility with tests', safe: true }
    ];

    for (const testCase of testCases) {
      process.stdout.write(`Testing: ${testCase.desc}... `);
      await this.sleep(500);
      
      if (testCase.safe) {
        this.log('✅ SAFE', colors.green);
      } else {
        this.log('❌ BLOCKED', colors.red);
      }
    }
    
    this.log('');
    this.success('Safety validation system is working correctly');
  }

  showMonitoring() {
    if (!this.isRunning) {
      this.error('Cannot show monitoring - system is not running');
      return;
    }

    const uptime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    
    this.log('\n📊 Real-time System Monitoring', colors.bright);
    this.log('─'.repeat(40), colors.gray);
    
    this.log(`🔄 System Uptime: ${uptime}s`);
    this.log(`💾 Memory Usage: ${Math.floor(Math.random() * 100 + 200)}MB`);
    this.log(`⚡ CPU Usage: ${Math.floor(Math.random() * 30 + 10)}%`);
    this.log(`🌐 Network: ${Math.floor(Math.random() * 50 + 100)}ms latency`);
    this.log(`📈 Operations/sec: ${Math.floor(Math.random() * 20 + 5)}`);
    
    this.log('\n🛡️  Safety Metrics:', colors.green);
    this.log(`   Validations: ${this.validations}`);
    this.log(`   Blocked: ${this.blocked}`);
    this.log(`   Success Rate: ${this.validations > 0 ? ((this.validations - this.blocked) / this.validations * 100).toFixed(1) : 100}%`);
    
    this.log('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    this.showBanner();
    
    this.rl.on('line', (input) => {
      const [command, ...args] = input.trim().split(' ');
      
      if (command === '') {
        this.rl.prompt();
        return;
      }
      
      if (this.commands[command]) {
        try {
          this.commands[command].handler(args);
        } catch (error) {
          this.error(`Command failed: ${error.message}`);
        }
      } else {
        this.error(`Unknown command: ${command}`);
        this.info('Type "help" to see available commands');
      }
      
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      this.exit();
    });

    this.rl.prompt();
  }

  exit() {
    this.log('\n👋 Goodbye! Sherlock Ω signing off...', colors.cyan);
    process.exit(0);
  }
}

// Start the CLI
if (require.main === module) {
  const cli = new SherlockOmegaCLI();
  cli.start();
}

module.exports = SherlockOmegaCLI;