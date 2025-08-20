/**
 * AI Bot Command Interface
 * Accepts natural language commands and converts them to executable algorithms
 */

import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';
import { AlgorithmBuilder } from './algorithm-builder';
import { BotColony } from './bot-colony';

export interface BotCommand {
  id: string;
  command: string;
  type: CommandType;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
}

export enum CommandType {
  BUILD_ALGORITHM = 'build_algorithm',
  OPTIMIZE_CODE = 'optimize_code',
  CREATE_FEATURE = 'create_feature',
  ANALYZE_PERFORMANCE = 'analyze_performance',
  GENERATE_TESTS = 'generate_tests',
  REFACTOR_CODE = 'refactor_code',
  CREATE_BOT = 'create_bot',
  DEPLOY_SYSTEM = 'deploy_system'
}

export interface CommandResult {
  commandId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  botId?: string;
  artifacts?: string[];
}

export class BotCommandInterface {
  private logger: Logger;
  private algorithmBuilder: AlgorithmBuilder;
  private botColony: BotColony;
  private commandQueue: BotCommand[] = [];
  private activeCommands: Map<string, BotCommand> = new Map();

  constructor(platform: PlatformType) {
    this.logger = new Logger(platform);
    this.algorithmBuilder = new AlgorithmBuilder(platform);
    this.botColony = new BotColony(platform);
  }

  /**
   * Process natural language command
   */
  async processCommand(commandText: string, userId?: string): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Parse the command
      const command = await this.parseCommand(commandText, userId);
      
      this.logger.info(`🤖 Processing command: ${command.command}`, { 
        type: command.type, 
        priority: command.priority 
      });

      // Add to queue
      this.commandQueue.push(command);
      this.activeCommands.set(command.id, command);

      // Execute the command
      const result = await this.executeCommand(command);
      
      // Clean up
      this.activeCommands.delete(command.id);
      
      const executionTime = Date.now() - startTime;
      
      this.logger.info(`✅ Command completed in ${executionTime}ms`, { 
        commandId: command.id,
        success: result.success 
      });

      return {
        ...result,
        commandId: command.id,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('❌ Command execution failed:', {}, error as Error);
      
      return {
        commandId: 'unknown',
        success: false,
        error: (error as Error).message,
        executionTime
      };
    }
  }

  /**
   * Parse natural language into structured command
   */
  private async parseCommand(commandText: string, userId?: string): Promise<BotCommand> {
    const command: BotCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command: commandText.toLowerCase().trim(),
      type: this.detectCommandType(commandText),
      parameters: await this.extractParameters(commandText),
      priority: this.determinePriority(commandText),
      timestamp: new Date(),
      userId
    };

    return command;
  }

  /**
   * Detect command type from natural language
   */
  private detectCommandType(commandText: string): CommandType {
    const text = commandText.toLowerCase();
    
    if (text.includes('build') && (text.includes('algorithm') || text.includes('function'))) {
      return CommandType.BUILD_ALGORITHM;
    }
    if (text.includes('optimize') || text.includes('improve') || text.includes('faster')) {
      return CommandType.OPTIMIZE_CODE;
    }
    if (text.includes('create') && text.includes('feature')) {
      return CommandType.CREATE_FEATURE;
    }
    if (text.includes('analyze') && text.includes('performance')) {
      return CommandType.ANALYZE_PERFORMANCE;
    }
    if (text.includes('test') || text.includes('coverage')) {
      return CommandType.GENERATE_TESTS;
    }
    if (text.includes('refactor') || text.includes('clean')) {
      return CommandType.REFACTOR_CODE;
    }
    if (text.includes('create') && text.includes('bot')) {
      return CommandType.CREATE_BOT;
    }
    if (text.includes('deploy') || text.includes('release')) {
      return CommandType.DEPLOY_SYSTEM;
    }
    
    // Default to algorithm building
    return CommandType.BUILD_ALGORITHM;
  }

  /**
   * Extract parameters from natural language
   */
  private async extractParameters(commandText: string): Promise<Record<string, any>> {
    const parameters: Record<string, any> = {};
    const text = commandText.toLowerCase();

    // Extract algorithm type
    if (text.includes('sorting')) parameters.algorithmType = 'sorting';
    if (text.includes('search')) parameters.algorithmType = 'search';
    if (text.includes('graph')) parameters.algorithmType = 'graph';
    if (text.includes('machine learning') || text.includes('ml')) parameters.algorithmType = 'ml';
    if (text.includes('quantum')) parameters.algorithmType = 'quantum';

    // Extract complexity requirements
    if (text.includes('fast') || text.includes('quick')) parameters.performance = 'high';
    if (text.includes('memory efficient')) parameters.memoryOptimized = true;
    if (text.includes('parallel')) parameters.parallel = true;

    // Extract data types
    if (text.includes('array') || text.includes('list')) parameters.dataType = 'array';
    if (text.includes('tree')) parameters.dataType = 'tree';
    if (text.includes('graph')) parameters.dataType = 'graph';
    if (text.includes('string')) parameters.dataType = 'string';

    // Extract language preference
    if (text.includes('typescript') || text.includes('ts')) parameters.language = 'typescript';
    if (text.includes('javascript') || text.includes('js')) parameters.language = 'javascript';
    if (text.includes('python')) parameters.language = 'python';

    return parameters;
  }

  /**
   * Determine command priority
   */
  private determinePriority(commandText: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = commandText.toLowerCase();
    
    if (text.includes('urgent') || text.includes('critical') || text.includes('emergency')) {
      return 'critical';
    }
    if (text.includes('important') || text.includes('priority') || text.includes('asap')) {
      return 'high';
    }
    if (text.includes('when possible') || text.includes('later')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Execute the parsed command
   */
  private async executeCommand(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    switch (command.type) {
      case CommandType.BUILD_ALGORITHM:
        return await this.buildAlgorithm(command);
      
      case CommandType.OPTIMIZE_CODE:
        return await this.optimizeCode(command);
      
      case CommandType.CREATE_FEATURE:
        return await this.createFeature(command);
      
      case CommandType.ANALYZE_PERFORMANCE:
        return await this.analyzePerformance(command);
      
      case CommandType.GENERATE_TESTS:
        return await this.generateTests(command);
      
      case CommandType.REFACTOR_CODE:
        return await this.refactorCode(command);
      
      case CommandType.CREATE_BOT:
        return await this.createBot(command);
      
      case CommandType.DEPLOY_SYSTEM:
        return await this.deploySystem(command);
      
      default:
        return {
          success: false,
          error: `Unknown command type: ${command.type}`
        };
    }
  }

  /**
   * Build algorithm from command
   */
  private async buildAlgorithm(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const algorithm = await this.algorithmBuilder.buildFromCommand(command);
      
      // Deploy the algorithm using a bot
      const bot = await this.botColony.assignBot('algorithm-builder');
      const deployResult = await bot.deployAlgorithm(algorithm);
      
      return {
        success: true,
        result: {
          algorithm: algorithm.name,
          complexity: algorithm.complexity,
          performance: algorithm.performance,
          code: algorithm.code.substring(0, 200) + '...' // Truncated for response
        },
        botId: bot.id,
        artifacts: [algorithm.filePath, algorithm.testPath]
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Optimize existing code
   */
  private async optimizeCode(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('code-optimizer');
      const result = await bot.optimizeCode(command.parameters);
      
      return {
        success: true,
        result: {
          optimizations: result.optimizations,
          performanceGain: result.performanceGain,
          memoryReduction: result.memoryReduction
        },
        botId: bot.id,
        artifacts: result.modifiedFiles
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create new feature
   */
  private async createFeature(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('feature-builder');
      const feature = await bot.createFeature(command.command, command.parameters);
      
      return {
        success: true,
        result: {
          featureName: feature.name,
          components: feature.components,
          testCoverage: feature.testCoverage
        },
        botId: bot.id,
        artifacts: feature.files
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Analyze performance
   */
  private async analyzePerformance(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('performance-analyzer');
      const analysis = await bot.analyzePerformance(command.parameters);
      
      return {
        success: true,
        result: {
          bottlenecks: analysis.bottlenecks,
          recommendations: analysis.recommendations,
          metrics: analysis.metrics
        },
        botId: bot.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate tests
   */
  private async generateTests(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('test-generator');
      const tests = await bot.generateTests(command.parameters);
      
      return {
        success: true,
        result: {
          testFiles: tests.files,
          coverage: tests.coverage,
          testCount: tests.count
        },
        botId: bot.id,
        artifacts: tests.files
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Refactor code
   */
  private async refactorCode(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('code-refactorer');
      const refactoring = await bot.refactorCode(command.parameters);
      
      return {
        success: true,
        result: {
          refactoredFiles: refactoring.files,
          improvements: refactoring.improvements,
          maintainabilityScore: refactoring.maintainabilityScore
        },
        botId: bot.id,
        artifacts: refactoring.files
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create new bot
   */
  private async createBot(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const newBot = await this.botColony.createBot(command.parameters);
      
      return {
        success: true,
        result: {
          botId: newBot.id,
          capabilities: newBot.capabilities,
          specialization: newBot.specialization
        },
        botId: newBot.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Deploy system
   */
  private async deploySystem(command: BotCommand): Promise<Omit<CommandResult, 'commandId' | 'executionTime'>> {
    try {
      const bot = await this.botColony.assignBot('deployment-manager');
      const deployment = await bot.deploySystem(command.parameters);
      
      return {
        success: true,
        result: {
          deploymentId: deployment.id,
          status: deployment.status,
          url: deployment.url
        },
        botId: bot.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get command queue status
   */
  getQueueStatus(): { pending: number; active: number; commands: BotCommand[] } {
    return {
      pending: this.commandQueue.length,
      active: this.activeCommands.size,
      commands: [...this.commandQueue]
    };
  }

  /**
   * Get available command examples
   */
  getCommandExamples(): string[] {
    return [
      "Build a fast sorting algorithm for arrays",
      "Create a binary search function with TypeScript",
      "Optimize the file loading performance",
      "Generate tests for the user authentication module",
      "Build a quantum algorithm for prime factorization",
      "Create a machine learning feature for recommendation",
      "Refactor the database connection code",
      "Analyze performance bottlenecks in the API",
      "Deploy the latest version to production",
      "Create a specialized bot for data processing"
    ];
  }
}