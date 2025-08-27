#!/usr/bin/env node

/**
 * 🌟 UNIFIED AI ECOSYSTEM CLI
 * Command-line interface for managing the self-building AI with HuggingFace and OpenRouter
 * 
 * Commands:
 * - ecosystem:init     - Initialize the AI ecosystem
 * - ecosystem:status   - Show ecosystem status and metrics
 * - ecosystem:optimize - Run optimization routines
 * - bot:create         - Create specialized bots
 * - bot:list           - List active bots
 * - models:discover    - Discover and assess AI models
 * - models:list        - List available models
 * - task:submit        - Submit tasks to the ecosystem
 * - task:templates     - Manage task templates
 */

import { Command } from 'commander';
import AIEcosystemManager, { DEFAULT_ECOSYSTEM_CONFIG } from '../ai/ai-ecosystem-manager';
import { UnifiedAIConfig } from '../ai/unified-ai-ecosystem';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class UnifiedAICLI {
  private program: Command;
  private ecosystemManager: AIEcosystemManager;
  private logger: Logger;
  private rl: readline.Interface;

  constructor() {
    this.program = new Command();
    this.logger = new Logger(PlatformType.NODE);
    this.ecosystemManager = new AIEcosystemManager(DEFAULT_ECOSYSTEM_CONFIG);
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('sherlock-ai')
      .description('🌟 Sherlock Ω Unified AI Ecosystem Management')
      .version('1.0.0');

    // Ecosystem commands
    this.program
      .command('ecosystem:init')
      .description('Initialize the AI ecosystem')
      .option('--config <path>', 'Configuration file path')
      .option('--interactive', 'Interactive configuration')
      .action(this.initializeEcosystem.bind(this));

    this.program
      .command('ecosystem:status')
      .description('Show ecosystem status and metrics')
      .option('--detailed', 'Show detailed status')
      .option('--json', 'Output as JSON')
      .action(this.showEcosystemStatus.bind(this));

    this.program
      .command('ecosystem:optimize')
      .description('Run ecosystem optimization')
      .option('--type <type>', 'Optimization type (cost|performance|all)', 'all')
      .action(this.optimizeEcosystem.bind(this));

    // Bot management commands
    this.program
      .command('bot:create')
      .description('Create a specialized bot')
      .argument('<specialization>', 'Bot specialization (code-generation|reasoning|optimization|creativity)')
      .option('--max-cost <cost>', 'Maximum cost per task', '0.1')
      .option('--preferred-models <models>', 'Preferred models (comma-separated)')
      .action(this.createBot.bind(this));

    this.program
      .command('bot:list')
      .description('List active bots')
      .option('--detailed', 'Show detailed bot information')
      .action(this.listBots.bind(this));

    // Model management commands
    this.program
      .command('models:discover')
      .description('Discover and assess AI models')
      .option('--provider <provider>', 'Provider to discover from (huggingface|openrouter|all)', 'all')
      .option('--min-downloads <count>', 'Minimum downloads', '1000')
      .option('--max-size <size>', 'Maximum model size (e.g., 33B)', '70B')
      .action(this.discoverModels.bind(this));

    this.program
      .command('models:list')
      .description('List available models')
      .option('--provider <provider>', 'Filter by provider')
      .option('--capability <capability>', 'Filter by capability')
      .option('--sort <field>', 'Sort by field (downloads|likes|size)', 'downloads')
      .action(this.listModels.bind(this));

    // Task management commands
    this.program
      .command('task:submit')
      .description('Submit a task to the ecosystem')
      .argument('<type>', 'Task type (self-improvement|feature-construction|model-discovery|capability-assessment)')
      .argument('<description>', 'Task description')
      .option('--priority <priority>', 'Task priority (low|medium|high|critical)', 'medium')
      .option('--max-cost <cost>', 'Maximum cost', '0.1')
      .option('--deadline <date>', 'Deadline (ISO date string)')
      .action(this.submitTask.bind(this));

    this.program
      .command('task:templates')
      .description('Manage task templates')
      .option('--list', 'List available templates')
      .option('--execute <template>', 'Execute a template')
      .action(this.manageTemplates.bind(this));

    // Utility commands
    this.program
      .command('config:generate')
      .description('Generate configuration file')
      .option('--output <path>', 'Output file path', 'ai-ecosystem-config.json')
      .action(this.generateConfig.bind(this));

    this.program
      .command('monitor')
      .description('Real-time ecosystem monitoring')
      .option('--interval <seconds>', 'Update interval', '5')
      .action(this.startMonitoring.bind(this));
  }

  async run(): Promise<void> {
    this.printHeader();
    await this.program.parseAsync(process.argv);
    this.rl.close();
  }

  // ============================================================================
  // COMMAND IMPLEMENTATIONS
  // ============================================================================

  private async initializeEcosystem(options: any): Promise<void> {
    console.log(`${colors.blue}🔄 Initializing AI Ecosystem...${colors.reset}\n`);

    try {
      let config: UnifiedAIConfig;

      if (options.config) {
        // Load from file
        config = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        console.log(`${colors.green}✅ Configuration loaded from ${options.config}${colors.reset}`);
      } else if (options.interactive) {
        // Interactive configuration
        config = await this.interactiveConfiguration();
      } else {
        // Use default configuration with environment variables
        config = this.getDefaultConfiguration();
      }

      // Initialize the ecosystem
      await this.ecosystemManager.initializeEcosystem(config);

      console.log(`\n${colors.green}🎉 AI Ecosystem initialized successfully!${colors.reset}`);
      console.log(`${colors.cyan}🚀 Self-building bots with HuggingFace and OpenRouter are now active${colors.reset}\n`);

      // Show initial status
      await this.showEcosystemStatus({ detailed: false, json: false });

    } catch (error) {
      console.error(`${colors.red}❌ Failed to initialize ecosystem: ${(error as Error).message}${colors.reset}`);
      process.exit(1);
    }
  }

  private async showEcosystemStatus(options: any): Promise<void> {
    try {
      const status = this.ecosystemManager.getEcosystemStatus();

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`${colors.cyan}🌟 Sherlock Ω AI Ecosystem Status${colors.reset}`);
      console.log(`${colors.cyan}=================================${colors.reset}\n`);

      // Manager status
      console.log(`${colors.yellow}📊 Manager Status:${colors.reset}`);
      console.log(`   Initialized: ${status.manager.isInitialized ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
      console.log(`   Uptime: ${colors.blue}${status.manager.uptime}${colors.reset}`);
      console.log('');

      // Ecosystem metrics
      console.log(`${colors.yellow}📈 Ecosystem Metrics:${colors.reset}`);
      console.log(`   Health Score: ${this.colorizeScore(status.metrics.healthScore)}`);
      console.log(`   Performance Score: ${this.colorizeScore(status.metrics.performanceScore)}`);
      console.log(`   Active Bots: ${colors.blue}${status.metrics.activeBots}${colors.reset}`);
      console.log(`   Discovered Models: ${colors.blue}${status.metrics.discoveredModels}${colors.reset}`);
      console.log(`   Total Tasks: ${colors.blue}${status.metrics.totalTasks}${colors.reset}`);
      console.log(`   Success Rate: ${this.colorizePercentage(status.metrics.successfulTasks / Math.max(status.metrics.totalTasks, 1))}`);
      console.log(`   Total Cost: ${colors.green}$${status.metrics.totalCost.toFixed(4)}${colors.reset}`);
      console.log(`   Avg Cost/Task: ${colors.green}$${status.metrics.avgCostPerTask.toFixed(4)}${colors.reset}`);
      console.log('');

      // Alerts
      if (status.alerts.length > 0) {
        console.log(`${colors.red}🚨 Alerts:${colors.reset}`);
        status.alerts.forEach(alert => {
          console.log(`   ${colors.red}• ${alert}${colors.reset}`);
        });
        console.log('');
      }

      // Recommendations
      if (status.recommendations.length > 0) {
        console.log(`${colors.yellow}💡 Recommendations:${colors.reset}`);
        status.recommendations.forEach(rec => {
          console.log(`   ${colors.yellow}• ${rec}${colors.reset}`);
        });
        console.log('');
      }

      if (options.detailed && status.ecosystem) {
        console.log(`${colors.yellow}🔍 Detailed Ecosystem Status:${colors.reset}`);
        console.log(`   Queue Length: ${status.ecosystem.queuedTasks}`);
        console.log(`   Providers Connected: ${Object.keys(status.ecosystem.providers).length}`);
        console.log(`   Cost Efficiency: ${status.ecosystem.costEfficiency.toFixed(4)}`);
        console.log('');
      }

    } catch (error) {
      console.error(`${colors.red}❌ Failed to get status: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async optimizeEcosystem(options: any): Promise<void> {
    console.log(`${colors.blue}🔧 Running ecosystem optimization (${options.type})...${colors.reset}\n`);

    try {
      if (options.type === 'cost' || options.type === 'all') {
        const costOptimization = await this.ecosystemManager.optimizeCosts();
        
        console.log(`${colors.green}💰 Cost Optimization Results:${colors.reset}`);
        console.log(`   Current Cost: ${colors.yellow}$${costOptimization.currentCost.toFixed(4)}${colors.reset}`);
        console.log(`   Projected Savings: ${colors.green}$${costOptimization.projectedSavings.toFixed(4)}${colors.reset}`);
        console.log(`   Recommendations: ${costOptimization.recommendations.length}`);
        console.log('');
      }

      if (options.type === 'performance' || options.type === 'all') {
        const perfOptimization = await this.ecosystemManager.optimizePerformance();
        
        console.log(`${colors.green}📈 Performance Optimization Results:${colors.reset}`);
        console.log(`   Current Performance: ${this.colorizeScore(perfOptimization.currentPerformance)}`);
        console.log(`   Projected Improvement: ${colors.green}+${(perfOptimization.projectedImprovement * 100).toFixed(1)}%${colors.reset}`);
        console.log(`   Bottlenecks: ${perfOptimization.bottlenecks.length}`);
        console.log('');
      }

      console.log(`${colors.green}✅ Optimization completed!${colors.reset}`);

    } catch (error) {
      console.error(`${colors.red}❌ Optimization failed: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async createBot(specialization: string, options: any): Promise<void> {
    console.log(`${colors.blue}🤖 Creating specialized bot: ${specialization}...${colors.reset}\n`);

    try {
      const config = {
        maxCostPerTask: parseFloat(options.maxCost),
        preferredModels: options.preferredModels ? options.preferredModels.split(',') : undefined
      };

      const botId = await this.ecosystemManager.createSpecializedBot(specialization, config);

      console.log(`${colors.green}✅ Bot created successfully!${colors.reset}`);
      console.log(`   Bot ID: ${colors.blue}${botId}${colors.reset}`);
      console.log(`   Specialization: ${colors.cyan}${specialization}${colors.reset}`);
      console.log(`   Max Cost/Task: ${colors.green}$${options.maxCost}${colors.reset}`);
      console.log('');

    } catch (error) {
      console.error(`${colors.red}❌ Failed to create bot: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async listBots(options: any): Promise<void> {
    console.log(`${colors.cyan}🤖 Active Bots${colors.reset}`);
    console.log(`${colors.cyan}=============${colors.reset}\n`);

    try {
      const status = this.ecosystemManager.getEcosystemStatus();
      
      if (!status.ecosystem || status.ecosystem.activeBots.length === 0) {
        console.log(`${colors.yellow}No active bots found${colors.reset}`);
        return;
      }

      status.ecosystem.activeBots.forEach((bot: any, index: number) => {
        console.log(`${colors.blue}${index + 1}. ${bot.botId}${colors.reset}`);
        console.log(`   Generation: ${bot.generation}`);
        console.log(`   Features Built: ${bot.constructedFeatures}`);
        console.log(`   Status: ${colors.green}${bot.status}${colors.reset}`);
        
        if (options.detailed && bot.aiEnhanced) {
          console.log(`   AI Enhanced: ${colors.green}✅${colors.reset}`);
          console.log(`   Task History: ${bot.taskHistory}`);
          console.log(`   Avg Cost: $${bot.avgTaskCost?.toFixed(4) || '0.0000'}`);
          console.log(`   Specialization: ${bot.specialization || 'general'}`);
        }
        console.log('');
      });

    } catch (error) {
      console.error(`${colors.red}❌ Failed to list bots: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async discoverModels(options: any): Promise<void> {
    console.log(`${colors.blue}🔍 Discovering AI models...${colors.reset}\n`);

    try {
      const criteria = {
        minDownloads: parseInt(options.minDownloads),
        maxModelSize: options.maxSize
      };

      const models = await this.ecosystemManager.discoverModels(criteria);

      console.log(`${colors.green}📊 Discovery Results:${colors.reset}`);
      console.log(`   Models Found: ${colors.blue}${models.length}${colors.reset}`);
      console.log('');

      if (models.length > 0) {
        console.log(`${colors.yellow}Top Models:${colors.reset}`);
        models.slice(0, 10).forEach((model: any, index: number) => {
          console.log(`${colors.blue}${index + 1}. ${model.modelId}${colors.reset}`);
          console.log(`   Provider: ${model.provider}`);
          console.log(`   Code Gen: ${this.colorizeScore(model.capabilities?.codeGeneration || 0)}`);
          console.log(`   Reasoning: ${this.colorizeScore(model.capabilities?.reasoning || 0)}`);
          console.log(`   Cost Efficiency: ${this.colorizeScore(model.capabilities?.costEfficiency || 0)}`);
          console.log('');
        });
      }

    } catch (error) {
      console.error(`${colors.red}❌ Model discovery failed: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async listModels(options: any): Promise<void> {
    console.log(`${colors.cyan}🤖 Available AI Models${colors.reset}`);
    console.log(`${colors.cyan}======================${colors.reset}\n`);

    // This would list models from the ecosystem
    console.log(`${colors.yellow}Feature coming soon - model listing${colors.reset}`);
  }

  private async submitTask(type: string, description: string, options: any): Promise<void> {
    console.log(`${colors.blue}📋 Submitting task: ${type}...${colors.reset}\n`);

    try {
      const taskData = {
        type: type as any,
        description,
        priority: options.priority as any,
        maxCost: parseFloat(options.maxCost),
        deadline: options.deadline ? new Date(options.deadline) : undefined
      };

      const taskId = await this.ecosystemManager.submitTask(taskData);

      console.log(`${colors.green}✅ Task submitted successfully!${colors.reset}`);
      console.log(`   Task ID: ${colors.blue}${taskId}${colors.reset}`);
      console.log(`   Type: ${colors.cyan}${type}${colors.reset}`);
      console.log(`   Priority: ${colors.yellow}${options.priority}${colors.reset}`);
      console.log(`   Max Cost: ${colors.green}$${options.maxCost}${colors.reset}`);
      console.log('');

    } catch (error) {
      console.error(`${colors.red}❌ Failed to submit task: ${(error as Error).message}${colors.reset}`);
    }
  }

  private async manageTemplates(options: any): Promise<void> {
    if (options.list) {
      const templates = this.ecosystemManager.getTaskTemplates();
      
      console.log(`${colors.cyan}📋 Task Templates${colors.reset}`);
      console.log(`${colors.cyan}=================${colors.reset}\n`);

      templates.forEach((template, index) => {
        console.log(`${colors.blue}${index + 1}. ${template.name} (${template.id})${colors.reset}`);
        console.log(`   Description: ${template.description}`);
        console.log(`   Priority: ${colors.yellow}${template.defaultPriority}${colors.reset}`);
        console.log(`   Max Cost: ${colors.green}$${template.maxCost}${colors.reset}`);
        console.log('');
      });
    }

    if (options.execute) {
      console.log(`${colors.yellow}Interactive template execution coming soon...${colors.reset}`);
    }
  }

  private async generateConfig(options: any): Promise<void> {
    console.log(`${colors.blue}🔧 Generating configuration file...${colors.reset}\n`);

    const config = this.getDefaultConfiguration();
    
    fs.writeFileSync(options.output, JSON.stringify(config, null, 2));
    
    console.log(`${colors.green}✅ Configuration generated: ${options.output}${colors.reset}`);
    console.log(`${colors.yellow}💡 Edit the file to customize your AI ecosystem setup${colors.reset}`);
  }

  private async startMonitoring(options: any): Promise<void> {
    const interval = parseInt(options.interval) * 1000;
    
    console.log(`${colors.blue}📊 Starting real-time monitoring (${options.interval}s intervals)...${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to stop${colors.reset}\n`);

    const monitor = setInterval(async () => {
      // Clear screen
      process.stdout.write('\x1Bc');
      
      await this.showEcosystemStatus({ detailed: true, json: false });
      
      console.log(`${colors.cyan}Last updated: ${new Date().toLocaleTimeString()}${colors.reset}`);
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(monitor);
      console.log(`\n${colors.yellow}Monitoring stopped${colors.reset}`);
      process.exit(0);
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private printHeader(): void {
    console.log(`${colors.blue}🌟 Sherlock Ω Unified AI Ecosystem CLI${colors.reset}`);
    console.log(`${colors.blue}=======================================${colors.reset}`);
    console.log(`${colors.cyan}Self-building AI with HuggingFace and OpenRouter integration${colors.reset}\n`);
  }

  private async interactiveConfiguration(): Promise<UnifiedAIConfig> {
    console.log(`${colors.yellow}🔧 Interactive Configuration Setup${colors.reset}\n`);

    const openRouterKey = await this.askQuestion('OpenRouter API Key: ');
    const huggingFaceKey = await this.askQuestion('HuggingFace API Key (optional): ');
    const enableLocal = await this.askQuestion('Enable local models? (y/N): ');

    return {
      openRouter: {
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'anthropic/claude-3-sonnet',
        fallbackModels: ['anthropic/claude-3-haiku', 'openai/gpt-4-turbo']
      },
      huggingFace: {
        apiKey: huggingFaceKey || undefined,
        enableLocalModels: enableLocal.toLowerCase() === 'y',
        preferredProviders: ['huggingface-api', 'local-ollama'],
        modelSelectionCriteria: {
          maxModelSize: '33B',
          preferredLicenses: ['apache-2.0', 'mit'],
          minimumDownloads: 1000
        }
      },
      selfBuilding: {
        maxConcurrentBots: 5,
        evolutionFrequency: 30,
        replicationThreshold: 0.85,
        enableQuantumOptimization: true
      },
      ecosystem: {
        enableCostOptimization: true,
        enableModelDiscovery: true,
        enableAdaptiveLearning: true,
        maxCostPerHour: 10
      }
    };
  }

  private getDefaultConfiguration(): UnifiedAIConfig {
    return {
      openRouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'anthropic/claude-3-sonnet',
        fallbackModels: ['anthropic/claude-3-haiku', 'openai/gpt-4-turbo']
      },
      huggingFace: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        enableLocalModels: true,
        preferredProviders: ['huggingface-api', 'local-ollama', 'local-llama-cpp'],
        modelSelectionCriteria: {
          maxModelSize: '33B',
          preferredLicenses: ['apache-2.0', 'mit', 'llama2'],
          minimumDownloads: 1000
        }
      },
      selfBuilding: {
        maxConcurrentBots: 5,
        evolutionFrequency: 30,
        replicationThreshold: 0.85,
        enableQuantumOptimization: true
      },
      ecosystem: {
        enableCostOptimization: true,
        enableModelDiscovery: true,
        enableAdaptiveLearning: true,
        maxCostPerHour: 10
      }
    };
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private colorizeScore(score: number): string {
    if (score >= 0.8) return `${colors.green}${(score * 100).toFixed(1)}%${colors.reset}`;
    if (score >= 0.6) return `${colors.yellow}${(score * 100).toFixed(1)}%${colors.reset}`;
    return `${colors.red}${(score * 100).toFixed(1)}%${colors.reset}`;
  }

  private colorizePercentage(value: number): string {
    return this.colorizeScore(value);
  }
}

// CLI Entry Point
if (require.main === module) {
  const cli = new UnifiedAICLI();
  cli.run().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default UnifiedAICLI;