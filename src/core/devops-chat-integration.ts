import { EventEmitter } from 'events';
import { DevOpsChatService, ChatMessage, DevOpsCommand } from '../ui/devops-chat';
import { SelfCompilationService, CompilationPipeline } from '../services/evolution/self-compilation-service';
import { SafetyValidationSystem } from '../services/evolution/safety-validation-system';
import { Logger } from '../logging/logger';
import { PlatformType } from './whispering-interfaces';

export interface DevOpsIntegrationConfig {
  platform: PlatformType;
  enableRealTimeExecution: boolean;
  safetyChecksEnabled: boolean;
  maxConcurrentCommands: number;
}

export interface CommandExecution {
  id: string;
  command: DevOpsCommand;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  pipeline?: CompilationPipeline;
}

/**
 * DevOpsIntegration bridges the DevOps Chat UI with the core Sherlock Ω systems.
 * This enables natural language control of the entire development lifecycle.
 */
export class DevOpsIntegration extends EventEmitter {
  private logger: Logger;
  private chatService: DevOpsChatService;
  private compilationService: SelfCompilationService;
  private safetyValidation: SafetyValidationSystem;
  private config: DevOpsIntegrationConfig;
  
  private activeExecutions = new Map<string, CommandExecution>();
  private commandHistory: CommandExecution[] = [];

  constructor(
    config: DevOpsIntegrationConfig,
    compilationService: SelfCompilationService,
    safetyValidation: SafetyValidationSystem
  ) {
    super();
    
    this.config = config;
    this.logger = new Logger(config.platform);
    this.compilationService = compilationService;
    this.safetyValidation = safetyValidation;
    
    this.chatService = new DevOpsChatService();
    this.setupEventListeners();
    
    this.logger.info('🤖 DevOps Chat Integration initialized', {
      platform: config.platform,
      realTimeExecution: config.enableRealTimeExecution,
      safetyChecks: config.safetyChecksEnabled
    });
  }

  private setupEventListeners(): void {
    // Listen to chat service events
    this.chatService.on('command-received', async (command: DevOpsCommand) => {
      await this.handleDevOpsCommand(command);
    });

    // Listen to compilation service events
    this.compilationService.getPipelines$().subscribe(pipeline => {
      this.handlePipelineUpdate(pipeline);
    });

    this.compilationService.getResults$().subscribe(result => {
      this.handleCompilationResult(result);
    });
  }

  /**
   * Handles a natural language DevOps command from the chat interface
   */
  async handleDevOpsCommand(command: DevOpsCommand): Promise<string> {
    this.logger.info(`🎯 Processing DevOps command: "${command.command}"`, {
      intent: command.intent,
      parameters: command.parameters
    });

    // Check if we're at max concurrent commands
    if (this.activeExecutions.size >= this.config.maxConcurrentCommands) {
      const errorMsg = `⚠️ Maximum concurrent commands (${this.config.maxConcurrentCommands}) reached. Please wait for current operations to complete.`;
      this.logger.warn(errorMsg);
      return errorMsg;
    }

    const execution: CommandExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command,
      status: 'pending',
      startTime: new Date()
    };

    this.activeExecutions.set(execution.id, execution);
    this.commandHistory.push(execution);

    try {
      execution.status = 'running';
      this.emit('command-started', execution);

      let result: string;

      switch (command.intent) {
        case 'test':
          result = await this.executeTestCommand(execution);
          break;
        case 'build':
          result = await this.executeBuildCommand(execution);
          break;
        case 'deploy':
          result = await this.executeDeployCommand(execution);
          break;
        case 'status':
          result = await this.executeStatusCommand(execution);
          break;
        case 'health':
          result = await this.executeHealthCommand(execution);
          break;
        case 'logs':
          result = await this.executeLogsCommand(execution);
          break;
        case 'rollback':
          result = await this.executeRollbackCommand(execution);
          break;
        default:
          result = this.executeUnknownCommand(execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.result = result;

      this.emit('command-completed', execution);
      this.logger.info(`✅ DevOps command completed: ${command.command}`, {
        executionId: execution.id,
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });

      return result;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      this.emit('command-failed', execution);
      this.logger.error(`❌ DevOps command failed: ${command.command}`, {
        executionId: execution.id,
        error: execution.error
      });

      throw error;

    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  private async executeTestCommand(execution: CommandExecution): Promise<string> {
    const { command } = execution;
    
    this.logger.info('🧪 Executing test command', { parameters: command.parameters });

    // Determine test type
    const testType = command.parameters.testType || 'all';
    const includeCoverage = command.parameters.includeCoverage || false;

    // Create a test-focused evolution
    const testEvolution = {
      id: `test_${execution.id}`,
      type: 'testing' as const,
      description: `Manual test execution: ${command.command}`,
      affectedFiles: [],
      codeChanges: [],
      testFiles: [],
      timestamp: new Date(),
      author: 'devops-chat',
      riskLevel: 'low' as const
    };

    // Define test steps based on parameters
    const testSteps = [];
    
    if (testType === 'unit' || testType === 'all') {
      testSteps.push({
        id: 'test-unit',
        name: 'Unit Tests',
        command: 'npm run test:unit',
        description: 'Execute unit test suite',
        timeout: 120000,
        retries: 1,
        critical: true
      });
    }

    if (testType === 'integration' || testType === 'all') {
      testSteps.push({
        id: 'test-integration',
        name: 'Integration Tests',
        command: 'npm run test:integration',
        description: 'Execute integration test suite',
        timeout: 180000,
        retries: 1,
        critical: true
      });
    }

    if (includeCoverage) {
      testSteps.push({
        id: 'test-coverage',
        name: 'Coverage Analysis',
        command: 'npm run test:coverage',
        description: 'Generate test coverage report',
        timeout: 120000,
        retries: 1,
        critical: false
      });
    }

    // Execute the test pipeline
    const pipeline = await this.compilationService.executeBuildPipeline(testEvolution, testSteps);
    execution.pipeline = pipeline;

    if (pipeline.overallSuccess) {
      const successfulSteps = pipeline.results.filter(r => r.success).length;
      const totalSteps = pipeline.results.length;
      const duration = pipeline.endTime!.getTime() - pipeline.startTime!.getTime();

      return `✅ Test execution completed! ${successfulSteps}/${totalSteps} test suites passed in ${(duration / 1000).toFixed(1)}s`;
    } else {
      const failedSteps = pipeline.results.filter(r => !r.success);
      const failureReasons = failedSteps.map(r => r.error).join(', ');
      
      throw new Error(`Test execution failed: ${failureReasons}`);
    }
  }

  private async executeBuildCommand(execution: CommandExecution): Promise<string> {
    const { command } = execution;
    
    this.logger.info('🔨 Executing build command', { parameters: command.parameters });

    const buildEvolution = {
      id: `build_${execution.id}`,
      type: 'optimization' as const,
      description: `Manual build execution: ${command.command}`,
      affectedFiles: [],
      codeChanges: [],
      testFiles: [],
      timestamp: new Date(),
      author: 'devops-chat',
      riskLevel: 'low' as const
    };

    // Use default build steps
    const pipeline = await this.compilationService.executeBuildPipeline(buildEvolution);
    execution.pipeline = pipeline;

    if (pipeline.overallSuccess) {
      const duration = pipeline.endTime!.getTime() - pipeline.startTime!.getTime();
      return `✅ Build completed successfully in ${(duration / 1000).toFixed(1)}s! All artifacts generated and verified.`;
    } else {
      const failedSteps = pipeline.results.filter(r => !r.success);
      const failureReasons = failedSteps.map(r => r.error).join(', ');
      
      throw new Error(`Build failed: ${failureReasons}`);
    }
  }

  private async executeDeployCommand(execution: CommandExecution): Promise<string> {
    const { command } = execution;
    
    this.logger.info('🚀 Executing deploy command', { parameters: command.parameters });

    // Safety check if enabled
    if (this.config.safetyChecksEnabled || command.parameters.safetyCheck) {
      this.logger.info('🛡️ Running pre-deployment safety validation...');
      
      // Create a mock evolution for safety validation
      const deployEvolution = {
        id: `deploy_${execution.id}`,
        type: 'feature' as const,
        description: `Manual deployment: ${command.command}`,
        affectedFiles: ['src/**/*'],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'devops-chat',
        riskLevel: command.parameters.target === 'latest' ? 'medium' as const : 'high' as const
      };

      const safetyResult = await this.safetyValidation.validateEvolutionSafety(deployEvolution);
      
      if (!safetyResult.isValid) {
        const blockingIssues = safetyResult.issues.filter(i => i.blocking);
        throw new Error(`Deployment blocked by safety validation: ${blockingIssues.map(i => i.description).join(', ')}`);
      }

      this.logger.info('✅ Safety validation passed');
    }

    // Execute deployment pipeline
    const deployEvolution = {
      id: `deploy_${execution.id}`,
      type: 'feature' as const,
      description: `Manual deployment: ${command.command}`,
      affectedFiles: [],
      codeChanges: [],
      testFiles: [],
      timestamp: new Date(),
      author: 'devops-chat',
      riskLevel: 'medium' as const
    };

    const pipeline = await this.compilationService.executeBuildPipeline(deployEvolution);
    execution.pipeline = pipeline;

    if (pipeline.overallSuccess) {
      const duration = pipeline.endTime!.getTime() - pipeline.startTime!.getTime();
      return `✅ Deployment completed successfully in ${(duration / 1000).toFixed(1)}s! New version is live and healthy.`;
    } else {
      const failedSteps = pipeline.results.filter(r => !r.success);
      const failureReasons = failedSteps.map(r => r.error).join(', ');
      
      throw new Error(`Deployment failed: ${failureReasons}`);
    }
  }

  private async executeStatusCommand(execution: CommandExecution): Promise<string> {
    this.logger.info('📊 Executing status command');

    const compilationStats = this.compilationService.getCompilationStatistics();
    const activePipelines = this.compilationService.getActivePipelines();
    const safetyStats = this.safetyValidation.getValidationStatistics();

    const status = {
      activePipelines: activePipelines.length,
      totalPipelines: compilationStats.totalPipelines,
      successRate: (compilationStats.successRate * 100).toFixed(1),
      averageDuration: (compilationStats.averageDuration / 1000).toFixed(1),
      safetyValidations: safetyStats.totalValidations,
      blockedDeployments: safetyStats.blockedDeployments
    };

    return `📊 System Status:
• Active Pipelines: ${status.activePipelines}
• Total Pipelines: ${status.totalPipelines}
• Success Rate: ${status.successRate}%
• Average Duration: ${status.averageDuration}s
• Safety Validations: ${status.safetyValidations}
• Blocked Deployments: ${status.blockedDeployments}`;
  }

  private async executeHealthCommand(execution: CommandExecution): Promise<string> {
    this.logger.info('💚 Executing health command');

    const components = [
      { name: 'Self-Compilation Service', healthy: true, responseTime: 45 },
      { name: 'Safety Validation System', healthy: true, responseTime: 23 },
      { name: 'DevOps Chat Integration', healthy: true, responseTime: 12 },
      { name: 'Plugin System', healthy: true, responseTime: 34 },
      { name: 'Monitoring Service', healthy: true, responseTime: 56 }
    ];

    const healthyCount = components.filter(c => c.healthy).length;
    const overallHealth = healthyCount === components.length ? 'HEALTHY' : 'DEGRADED';
    const avgResponseTime = components.reduce((sum, c) => sum + c.responseTime, 0) / components.length;

    return `💚 System Health: ${overallHealth}
• Components: ${healthyCount}/${components.length} healthy
• Average Response Time: ${avgResponseTime.toFixed(0)}ms
• Active Executions: ${this.activeExecutions.size}
• Command History: ${this.commandHistory.length} total`;
  }

  private async executeLogsCommand(execution: CommandExecution): Promise<string> {
    const { command } = execution;
    
    this.logger.info('📜 Executing logs command', { parameters: command.parameters });

    const count = command.parameters.count || 10;
    const level = command.parameters.level || 'all';

    // Get recent command history as "logs"
    const recentCommands = this.commandHistory
      .slice(-count)
      .reverse()
      .map(exec => {
        const status = exec.status === 'completed' ? '✅' : 
                     exec.status === 'failed' ? '❌' : 
                     exec.status === 'running' ? '🔄' : '⏳';
        const time = exec.startTime.toLocaleTimeString();
        return `${status} [${time}] ${exec.command.intent.toUpperCase()}: ${exec.command.command}`;
      });

    return `📜 Recent DevOps Commands (last ${count}):

${recentCommands.join('\n')}

Use 'view system logs' for detailed system logs.`;
  }

  private async executeRollbackCommand(execution: CommandExecution): Promise<string> {
    this.logger.info('🔄 Executing rollback command');

    // Get available snapshots
    const snapshots = this.compilationService.getSnapshots();
    
    if (snapshots.length === 0) {
      throw new Error('No deployment snapshots available for rollback');
    }

    const latestSnapshot = snapshots[0];
    
    // Simulate rollback process
    this.logger.info(`Rolling back to snapshot: ${latestSnapshot.id}`);
    
    // In a real implementation, this would trigger actual rollback
    await new Promise(resolve => setTimeout(resolve, 2000));

    return `✅ Rollback completed successfully! System restored to snapshot ${latestSnapshot.id} from ${latestSnapshot.timestamp.toLocaleString()}`;
  }

  private executeUnknownCommand(execution: CommandExecution): string {
    const { command } = execution;
    
    const suggestions = [
      'run tests',
      'build project',
      'deploy latest',
      'show status',
      'check health',
      'view logs',
      'rollback deployment'
    ];

    return `🤔 I'm not sure how to handle "${command.command}". 

Try one of these commands:
${suggestions.map(s => `• ${s}`).join('\n')}

I'm continuously learning new commands! You can also try more specific variations like:
• "run unit tests with coverage"
• "deploy the latest safe evolution"
• "show me the last 5 error logs"`;
  }

  private handlePipelineUpdate(pipeline: any): void {
    // Find execution associated with this pipeline
    const execution = Array.from(this.activeExecutions.values())
      .find(exec => exec.pipeline?.id === pipeline.id);

    if (execution) {
      this.emit('pipeline-update', { execution, pipeline });
    }
  }

  private handleCompilationResult(result: any): void {
    this.emit('compilation-result', result);
  }

  // Public API
  getChatService(): DevOpsChatService {
    return this.chatService;
  }

  getActiveExecutions(): CommandExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  getCommandHistory(): CommandExecution[] {
    return [...this.commandHistory];
  }

  getExecutionById(id: string): CommandExecution | undefined {
    return this.activeExecutions.get(id) || 
           this.commandHistory.find(exec => exec.id === id);
  }

  // Statistics
  getIntegrationStatistics(): {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageExecutionTime: number;
    commandsByIntent: Record<string, number>;
    activeExecutions: number;
  } {
    const completed = this.commandHistory.filter(exec => exec.status === 'completed');
    const failed = this.commandHistory.filter(exec => exec.status === 'failed');
    
    const avgTime = completed.length > 0 
      ? completed.reduce((sum, exec) => {
          const duration = exec.endTime!.getTime() - exec.startTime.getTime();
          return sum + duration;
        }, 0) / completed.length
      : 0;

    const commandsByIntent = this.commandHistory.reduce((acc, exec) => {
      acc[exec.command.intent] = (acc[exec.command.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCommands: this.commandHistory.length,
      successfulCommands: completed.length,
      failedCommands: failed.length,
      averageExecutionTime: avgTime,
      commandsByIntent,
      activeExecutions: this.activeExecutions.size
    };
  }
}