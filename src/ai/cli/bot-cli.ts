#!/usr/bin/env node

/**
 * AI Bot Manager CLI
 * Command-line interface for managing bots
 */

import { Command } from 'commander';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import { PlatformType } from '../../types/core';
import { AIBotManager } from '../ai-bot-manager';
import * as readline from 'readline';

const program = new Command();

// Initialize dependencies
const logger = new Logger(PlatformType.NODE);
const performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
const botManager = new AIBotManager(logger, performanceMonitor, {
  enableAutoInstall: true,
  enableSandbox: true
});

program
  .name('sherlock-bot')
  .description('Sherlock Ω AI Bot Manager CLI')
  .version('1.0.0');

// Create bot command
program
  .command('create')
  .description('Create a new bot from description')
  .argument('<description>', 'Natural language description of the bot')
  .option('-o, --output <path>', 'Output directory for generated bot')
  .option('--no-install', 'Skip auto-installation')
  .option('-q, --quantum', 'Create a quantum-enhanced bot')
  .action(async (description, options) => {
    try {
      if (options.quantum) {
        console.log('⚛️ Creating quantum-enhanced bot from description...');
        console.log(`Description: ${description}\n`);

        const generatedBot = await botManager.createQuantumBot(description);
        
        console.log('✅ Quantum bot created successfully!');
        console.log(`Name: ${generatedBot.blueprint.name}`);
        console.log(`ID: ${generatedBot.blueprint.id}`);
        console.log(`Capabilities: ${generatedBot.blueprint.capabilities.length}`);
        console.log(`Confidence: ${(generatedBot.blueprint.confidence * 100).toFixed(1)}%`);
        console.log('⚛️ Quantum features: Enabled');
        
      } else {
        console.log('🤖 Creating bot from description...');
        console.log(`Description: ${description}\n`);

        const generatedBot = await botManager.createBotFromDescription(description);
        
        console.log('✅ Bot created successfully!');
        console.log(`Name: ${generatedBot.blueprint.name}`);
        console.log(`ID: ${generatedBot.blueprint.id}`);
        console.log(`Capabilities: ${generatedBot.blueprint.capabilities.length}`);
        console.log(`Confidence: ${(generatedBot.blueprint.confidence * 100).toFixed(1)}%`);
      }
      
      if (options.output) {
        // In a real implementation, we'd write files to the output directory
        console.log(`\nFiles would be written to: ${options.output}`);
        console.log('Generated files:');
        Object.keys(generatedBot.implementation.sourceFiles).forEach(file => {
          console.log(`  📄 ${file}`);
        });
      }

      console.log('\nSuggestions:');
      generatedBot.blueprint.suggestions.forEach(suggestion => {
        console.log(`  💡 ${suggestion.message}`);
      });

    } catch (error) {
      console.error('❌ Failed to create bot:', error);
      process.exit(1);
    }
  });

// Interactive builder command
program
  .command('build')
  .description('Start interactive bot builder')
  .action(async () => {
    try {
      console.log('💬 Starting interactive bot builder...\n');
      
      const session = await botManager.startInteractiveBotBuilder();
      console.log('Welcome to the Sherlock Ω Bot Builder!');
      console.log('Type your responses and press Enter. Type "quit" to exit.\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askQuestion = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
          rl.question(prompt, resolve);
        });
      };

      let sessionActive = true;
      
      while (sessionActive) {
        const input = await askQuestion('You: ');
        
        if (input.toLowerCase() === 'quit') {
          sessionActive = false;
          break;
        }

        if (input.toLowerCase() === 'generate' || input.toLowerCase() === 'done') {
          console.log('\n🔨 Generating your bot...');
          const generatedBot = await botManager.finalizeBotBuilder(session.id);
          
          console.log('✅ Bot generated successfully!');
          console.log(`Name: ${generatedBot.blueprint.name}`);
          console.log(`Capabilities: ${generatedBot.blueprint.capabilities.length}`);
          console.log('\nGenerated files:');
          Object.keys(generatedBot.implementation.sourceFiles).forEach(file => {
            console.log(`  📄 ${file}`);
          });
          
          sessionActive = false;
          break;
        }

        const response = await botManager.continueInteractiveSession(session.id, input);
        console.log(`Bot: ${response.message}`);
        
        if (response.suggestions.length > 0) {
          console.log('\nSuggestions:');
          response.suggestions.forEach(suggestion => {
            console.log(`  💡 ${suggestion}`);
          });
        }
        
        if (response.inputPrompt) {
          console.log(`\n${response.inputPrompt}`);
        }
        
        console.log();
      }

      rl.close();

    } catch (error) {
      console.error('❌ Interactive builder failed:', error);
      process.exit(1);
    }
  });

// List bots command
program
  .command('list')
  .description('List all bots in the registry')
  .option('-c, --category <category>', 'Filter by category')
  .option('-i, --installed', 'Show only installed bots')
  .option('-e, --enabled', 'Show only enabled bots')
  .action(async (options) => {
    try {
      let bots;
      
      if (options.installed) {
        const installedIds = botManager.getInstalledBots();
        bots = [];
        for (const id of installedIds) {
          const bot = await botManager.getBotById(id);
          if (bot) bots.push(bot.metadata);
        }
      } else if (options.enabled) {
        const enabledIds = botManager.getEnabledBots();
        bots = [];
        for (const id of enabledIds) {
          const bot = await botManager.getBotById(id);
          if (bot) bots.push(bot.metadata);
        }
      } else {
        bots = await botManager.listBots(options.category);
      }

      if (bots.length === 0) {
        console.log('No bots found.');
        return;
      }

      console.log(`Found ${bots.length} bot(s):\n`);
      
      bots.forEach(bot => {
        const status = botManager.isEnabled(bot.id) ? '🟢' : 
                     botManager.isInstalled(bot.id) ? '🟡' : '⚪';
        
        console.log(`${status} ${bot.name} (${bot.id})`);
        console.log(`   ${bot.description}`);
        console.log(`   Category: ${bot.category} | Version: ${bot.version} | Rating: ${bot.rating}/5`);
        console.log(`   Capabilities: ${bot.capabilities.length} | Author: ${bot.author}`);
        console.log();
      });

    } catch (error) {
      console.error('❌ Failed to list bots:', error);
      process.exit(1);
    }
  });

// Search bots command
program
  .command('search')
  .description('Search for bots')
  .argument('<query>', 'Search query')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('-a, --author <author>', 'Filter by author')
  .option('-r, --min-rating <rating>', 'Minimum rating', parseFloat)
  .action(async (query, options) => {
    try {
      const searchQuery: any = { query };
      
      if (options.category) searchQuery.category = options.category;
      if (options.tags) searchQuery.tags = options.tags.split(',').map((t: string) => t.trim());
      if (options.author) searchQuery.author = options.author;
      if (options.minRating) searchQuery.minRating = options.minRating;

      const results = await botManager.searchBots(searchQuery);

      if (results.length === 0) {
        console.log('No bots found matching your search.');
        return;
      }

      console.log(`Found ${results.length} bot(s) matching "${query}":\n`);
      
      results.forEach(bot => {
        const status = botManager.isEnabled(bot.id) ? '🟢' : 
                     botManager.isInstalled(bot.id) ? '🟡' : '⚪';
        
        console.log(`${status} ${bot.name} (${bot.id})`);
        console.log(`   ${bot.description}`);
        console.log(`   Category: ${bot.category} | Rating: ${bot.rating}/5 | Downloads: ${bot.downloads}`);
        console.log();
      });

    } catch (error) {
      console.error('❌ Search failed:', error);
      process.exit(1);
    }
  });

// Install bot command
program
  .command('install')
  .description('Install a bot')
  .argument('<bot-id>', 'Bot ID to install')
  .option('-v, --version <version>', 'Specific version to install')
  .action(async (botId, options) => {
    try {
      console.log(`📦 Installing bot: ${botId}${options.version ? `@${options.version}` : ''}...`);
      
      await botManager.installBot(botId, options.version);
      
      console.log('✅ Bot installed successfully!');
      console.log('Use "sherlock-bot enable <bot-id>" to enable it.');

    } catch (error) {
      console.error('❌ Installation failed:', error);
      process.exit(1);
    }
  });

// Enable bot command
program
  .command('enable')
  .description('Enable an installed bot')
  .argument('<bot-id>', 'Bot ID to enable')
  .action(async (botId) => {
    try {
      console.log(`🔌 Enabling bot: ${botId}...`);
      
      await botManager.enableBot(botId);
      
      console.log('✅ Bot enabled successfully!');

    } catch (error) {
      console.error('❌ Enable failed:', error);
      process.exit(1);
    }
  });

// Disable bot command
program
  .command('disable')
  .description('Disable a bot')
  .argument('<bot-id>', 'Bot ID to disable')
  .action(async (botId) => {
    try {
      console.log(`🔌 Disabling bot: ${botId}...`);
      
      await botManager.disableBot(botId);
      
      console.log('✅ Bot disabled successfully!');

    } catch (error) {
      console.error('❌ Disable failed:', error);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show detailed information about a bot')
  .argument('<bot-id>', 'Bot ID')
  .action(async (botId) => {
    try {
      const bot = await botManager.getBotById(botId);
      if (!bot) {
        console.log(`Bot not found: ${botId}`);
        return;
      }

      const analytics = await botManager.getBotAnalytics(botId);
      const status = botManager.isEnabled(botId) ? '🟢 Enabled' : 
                   botManager.isInstalled(botId) ? '🟡 Installed' : '⚪ Available';

      console.log(`📋 Bot Information: ${bot.metadata.name}\n`);
      console.log(`ID: ${bot.metadata.id}`);
      console.log(`Status: ${status}`);
      console.log(`Version: ${bot.metadata.version}`);
      console.log(`Category: ${bot.metadata.category}`);
      console.log(`Author: ${bot.metadata.author}`);
      console.log(`Rating: ${bot.metadata.rating}/5`);
      console.log(`Downloads: ${bot.metadata.downloads}`);
      console.log(`Created: ${bot.metadata.created.toLocaleDateString()}`);
      console.log(`Updated: ${bot.metadata.updated.toLocaleDateString()}`);
      console.log(`\nDescription:`);
      console.log(bot.metadata.description);
      
      console.log(`\nCapabilities (${bot.metadata.capabilities.length}):`);
      bot.metadata.capabilities.forEach(cap => {
        console.log(`  • ${cap.type}: ${cap.description}`);
      });

      console.log(`\nRequirements:`);
      console.log(`  Dependencies: ${Object.keys(bot.implementation.dependencies).join(', ') || 'None'}`);
      console.log(`  Permissions: ${bot.configuration.permissions.join(', ') || 'None'}`);

      if (bot.metadata.tags.length > 0) {
        console.log(`\nTags: ${bot.metadata.tags.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Failed to get bot info:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show registry statistics')
  .action(async () => {
    try {
      const stats = await botManager.getRegistryStats();

      console.log('📊 Registry Statistics\n');
      console.log(`Total Bots: ${stats.total}`);
      console.log(`Installed: ${stats.installed}`);
      console.log(`Enabled: ${stats.enabled}`);
      console.log(`Average Rating: ${stats.averageRating.toFixed(1)}/5`);
      console.log(`Total Downloads: ${stats.totalDownloads}`);
      
      console.log('\nCategories:');
      Object.entries(stats.categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      process.exit(1);
    }
  });

// Export bot command
program
  .command('export')
  .description('Export a bot definition')
  .argument('<bot-id>', 'Bot ID to export')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (botId, options) => {
    try {
      const exportedBot = await botManager.exportBot(botId);
      
      if (options.output) {
        const fs = require('fs');
        fs.writeFileSync(options.output, exportedBot);
        console.log(`✅ Bot exported to: ${options.output}`);
      } else {
        console.log(exportedBot);
      }

    } catch (error) {
      console.error('❌ Export failed:', error);
      process.exit(1);
    }
  });

// Clone bot command
program
  .command('clone')
  .description('Clone an existing bot')
  .argument('<bot-id>', 'Bot ID to clone')
  .argument('<new-name>', 'Name for the cloned bot')
  .action(async (botId, newName) => {
    try {
      console.log(`🔄 Cloning bot: ${botId} -> ${newName}...`);
      
      const clonedBot = await botManager.cloneBot(botId, newName);
      
      console.log('✅ Bot cloned successfully!');
      console.log(`New bot ID: ${clonedBot.metadata.id}`);

    } catch (error) {
      console.error('❌ Clone failed:', error);
      process.exit(1);
    }
  });

// Quantum computing commands
const quantumCommand = program
  .command('quantum')
  .description('Quantum computing operations');

quantumCommand
  .command('circuit')
  .description('Create a quantum circuit from description')
  .argument('<description>', 'Natural language description of the quantum circuit')
  .action(async (description) => {
    try {
      if (!botManager.isQuantumEnabled()) {
        console.log('❌ Quantum computing is not enabled');
        process.exit(1);
      }

      console.log('⚛️ Creating quantum circuit...');
      console.log(`Description: ${description}\n`);

      const circuit = await botManager.createQuantumCircuit(description);
      
      console.log('✅ Quantum circuit created successfully!');
      console.log(`Name: ${circuit.name}`);
      console.log(`Qubits: ${circuit.qubits}`);
      console.log(`Gates: ${circuit.gates.length}`);
      console.log(`Depth: ${circuit.depth}`);
      
      console.log('\nGates:');
      circuit.gates.forEach((gate, i) => {
        console.log(`  ${i + 1}. ${gate.name} (${gate.type}) on qubits [${gate.qubits.join(', ')}]`);
      });

    } catch (error) {
      console.error('❌ Failed to create quantum circuit:', error);
      process.exit(1);
    }
  });

quantumCommand
  .command('simulate')
  .description('Simulate a quantum circuit')
  .argument('<circuit-description>', 'Description of the quantum circuit to simulate')
  .option('-s, --shots <shots>', 'Number of shots for simulation', '1024')
  .action(async (description, options) => {
    try {
      if (!botManager.isQuantumEnabled()) {
        console.log('❌ Quantum computing is not enabled');
        process.exit(1);
      }

      console.log('⚛️ Creating and simulating quantum circuit...');
      
      const circuit = await botManager.createQuantumCircuit(description);
      const shots = parseInt(options.shots);
      const result = await botManager.simulateQuantumCircuit(circuit, shots);
      
      console.log('✅ Quantum simulation completed!');
      console.log(`Circuit: ${circuit.name}`);
      console.log(`Shots: ${result.shots}`);
      console.log(`Execution time: ${result.executionTime}ms`);
      console.log(`Unique states: ${result.statistics.uniqueStates}`);
      console.log(`Entropy: ${result.statistics.entropy.toFixed(3)}`);
      
      console.log('\nTop results:');
      result.results.slice(0, 5).forEach((outcome: any, i: number) => {
        console.log(`  ${i + 1}. |${outcome.state}⟩: ${outcome.count} counts (${(outcome.probability * 100).toFixed(2)}%)`);
      });

    } catch (error) {
      console.error('❌ Quantum simulation failed:', error);
      process.exit(1);
    }
  });

quantumCommand
  .command('algorithm')
  .description('Generate a quantum algorithm')
  .argument('<type>', 'Algorithm type (grover, qaoa, vqe, shor)')
  .option('-q, --qubits <qubits>', 'Number of qubits', '4')
  .option('-p, --parameters <params>', 'Algorithm parameters (JSON)')
  .action(async (type, options) => {
    try {
      if (!botManager.isQuantumEnabled()) {
        console.log('❌ Quantum computing is not enabled');
        process.exit(1);
      }

      console.log(`⚛️ Generating ${type} quantum algorithm...`);
      
      const parameters = {
        qubits: parseInt(options.qubits),
        ...(options.parameters ? JSON.parse(options.parameters) : {})
      };

      const algorithm = await botManager.generateQuantumAlgorithm(type as any, parameters);
      
      console.log('✅ Quantum algorithm generated!');
      console.log(`Name: ${algorithm.name}`);
      console.log(`Type: ${algorithm.type}`);
      console.log(`Qubits: ${algorithm.qubits}`);
      console.log(`Depth: ${algorithm.depth}`);
      console.log(`Complexity: ${algorithm.complexity}`);
      
      console.log('\nApplications:');
      algorithm.applications.forEach(app => {
        console.log(`  • ${app}`);
      });

    } catch (error) {
      console.error('❌ Failed to generate quantum algorithm:', error);
      process.exit(1);
    }
  });

quantumCommand
  .command('tutorial')
  .description('Generate quantum computing tutorial')
  .argument('<topic>', 'Tutorial topic')
  .option('-l, --level <level>', 'Difficulty level (beginner, intermediate, advanced)', 'beginner')
  .action(async (topic, options) => {
    try {
      if (!botManager.isQuantumEnabled()) {
        console.log('❌ Quantum computing is not enabled');
        process.exit(1);
      }

      console.log(`📚 Generating quantum tutorial: ${topic} (${options.level})...`);
      
      const tutorial = await botManager.createQuantumTutorial(topic, options.level);
      
      console.log('✅ Quantum tutorial generated!');
      console.log(`Title: ${tutorial.title}`);
      console.log(`Level: ${tutorial.level}`);
      console.log(`Estimated time: ${tutorial.estimatedTime}`);
      
      console.log('\nSections:');
      tutorial.sections.forEach((section: string, i: number) => {
        console.log(`  ${i + 1}. ${section}`);
      });
      
      console.log('\nExercises:');
      tutorial.exercises.forEach((exercise: string, i: number) => {
        console.log(`  ${i + 1}. ${exercise}`);
      });

      console.log('\nPrerequisites:');
      tutorial.prerequisites.forEach((prereq: string) => {
        console.log(`  • ${prereq}`);
      });

    } catch (error) {
      console.error('❌ Failed to generate quantum tutorial:', error);
      process.exit(1);
    }
  });

quantumCommand
  .command('backends')
  .description('List available quantum backends')
  .action(async () => {
    try {
      if (!botManager.isQuantumEnabled()) {
        console.log('❌ Quantum computing is not enabled');
        process.exit(1);
      }

      const backends = await botManager.getQuantumBackends();
      
      console.log('⚛️ Available quantum backends:');
      backends.forEach((backend, i) => {
        console.log(`  ${i + 1}. ${backend}`);
      });

    } catch (error) {
      console.error('❌ Failed to list quantum backends:', error);
      process.exit(1);
    }
  });

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await botManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await botManager.shutdown();
  process.exit(0);
});

// Parse command line arguments
program.parse();

export { program };