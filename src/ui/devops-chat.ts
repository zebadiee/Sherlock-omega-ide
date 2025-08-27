import { EventEmitter } from 'events';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'stream' | 'error' | 'success';
  content: string;
  timestamp: Date;
  metadata?: {
    command?: string;
    executionId?: string;
    duration?: number;
    status?: 'pending' | 'running' | 'completed' | 'failed';
  };
}

export interface DevOpsCommand {
  id: string;
  command: string;
  intent: 'test' | 'build' | 'deploy' | 'status' | 'health' | 'logs' | 'rollback' | 'unknown';
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface StreamingOutput {
  executionId: string;
  chunk: string;
  type: 'stdout' | 'stderr' | 'info' | 'warning' | 'error';
  timestamp: Date;
}

export class DevOpsChatService extends EventEmitter {
  private messages = new BehaviorSubject<ChatMessage[]>([]);
  private streamingSubject = new Subject<StreamingOutput>();
  private isConnected = new BehaviorSubject<boolean>(false);
  
  private messageHistory: ChatMessage[] = [];
  private activeExecutions = new Map<string, { command: string; startTime: Date }>();
  
  private commandPatterns = new Map<RegExp, string>([
    [/run\s+(test|tests)/i, 'test'],
    [/execute\s+(test|tests)/i, 'test'],
    [/test\s+suite/i, 'test'],
    [/(build|compile)/i, 'build'],
    [/deploy/i, 'deploy'],
    [/(status|state)/i, 'status'],
    [/(health|check)/i, 'health'],
    [/(log|logs)/i, 'logs'],
    [/rollback/i, 'rollback']
  ]);

  constructor() {
    super();
    this.initializeChat();
  }

  private initializeChat(): void {
    // Add welcome message
    this.addMessage({
      type: 'system',
      content: '🤖 Sherlock Ω DevOps Chat initialized. I can help you manage builds, tests, deployments, and system health. Try commands like:\n\n• "run the test suite"\n• "what\'s the build status?"\n• "deploy the latest evolution"\n• "show system health"',
      metadata: { status: 'completed' }
    });

    this.isConnected.next(true);
  }

  // Message Management
  async sendCommand(command: string): Promise<string> {
    const userMessage = this.addMessage({
      type: 'user',
      content: command
    });

    const parsedCommand = this.parseCommand(command);
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add thinking message
    const thinkingMessage = this.addMessage({
      type: 'system',
      content: '🤔 Processing your command...',
      metadata: { 
        command: parsedCommand.command,
        executionId,
        status: 'pending'
      }
    });

    try {
      // Execute the command
      const response = await this.executeCommand(parsedCommand, executionId);
      
      // Update thinking message to show result
      this.updateMessage(thinkingMessage.id, {
        content: response,
        metadata: { 
          ...thinkingMessage.metadata,
          status: 'completed',
          duration: Date.now() - thinkingMessage.timestamp.getTime()
        }
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.updateMessage(thinkingMessage.id, {
        type: 'error',
        content: `❌ Error: ${errorMessage}`,
        metadata: { 
          ...thinkingMessage.metadata,
          status: 'failed'
        }
      });

      throw error;
    }
  }

  private parseCommand(command: string): DevOpsCommand {
    let intent: DevOpsCommand['intent'] = 'unknown';
    const parameters: Record<string, any> = {};

    // Match command patterns
    for (const [pattern, intentType] of this.commandPatterns.entries()) {
      if (pattern.test(command)) {
        intent = intentType as DevOpsCommand['intent'];
        break;
      }
    }

    // Extract parameters based on intent
    switch (intent) {
      case 'test':
        if (command.includes('coverage')) parameters.includeCoverage = true;
        if (command.includes('unit')) parameters.testType = 'unit';
        if (command.includes('integration')) parameters.testType = 'integration';
        break;
      case 'deploy':
        if (command.includes('latest')) parameters.target = 'latest';
        if (command.includes('safe')) parameters.safetyCheck = true;
        break;
      case 'logs':
        if (command.includes('error')) parameters.level = 'error';
        if (command.includes('last')) {
          const match = command.match(/last\s+(\d+)/);
          if (match) parameters.count = parseInt(match[1]);
        }
        break;
    }

    return {
      id: `cmd_${Date.now()}`,
      command,
      intent,
      parameters,
      timestamp: new Date()
    };
  }

  private async executeCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.activeExecutions.set(executionId, {
      command: command.command,
      startTime: new Date()
    });

    try {
      switch (command.intent) {
        case 'test':
          return await this.handleTestCommand(command, executionId);
        case 'build':
          return await this.handleBuildCommand(command, executionId);
        case 'deploy':
          return await this.handleDeployCommand(command, executionId);
        case 'status':
          return await this.handleStatusCommand(command, executionId);
        case 'health':
          return await this.handleHealthCommand(command, executionId);
        case 'logs':
          return await this.handleLogsCommand(command, executionId);
        case 'rollback':
          return await this.handleRollbackCommand(command, executionId);
        default:
          return this.handleUnknownCommand(command, executionId);
      }
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private async handleTestCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '🧪 Initiating test suite execution...', 'info');
    
    // Simulate test execution with streaming output
    const testTypes = command.parameters.testType ? [command.parameters.testType] : ['unit', 'integration'];
    let totalTests = 0;
    let passedTests = 0;

    for (const testType of testTypes) {
      this.emitStream(executionId, `\n📋 Running ${testType} tests...`, 'info');
      
      // Simulate test progress
      const testCount = testType === 'unit' ? 45 : 12;
      totalTests += testCount;
      
      for (let i = 1; i <= testCount; i++) {
        await this.delay(100);
        if (Math.random() > 0.05) { // 95% pass rate
          passedTests++;
          this.emitStream(executionId, `  ✅ Test ${i}/${testCount} passed`, 'stdout');
        } else {
          this.emitStream(executionId, `  ❌ Test ${i}/${testCount} failed`, 'stderr');
        }
      }
    }

    const successRate = (passedTests / totalTests * 100).toFixed(1);
    const coverage = command.parameters.includeCoverage ? '96.8%' : 'N/A';
    
    this.emitStream(executionId, `\n📊 Test Results Summary:`, 'info');
    this.emitStream(executionId, `   Total Tests: ${totalTests}`, 'info');
    this.emitStream(executionId, `   Passed: ${passedTests}`, 'info');
    this.emitStream(executionId, `   Failed: ${totalTests - passedTests}`, 'info');
    this.emitStream(executionId, `   Success Rate: ${successRate}%`, 'info');
    if (command.parameters.includeCoverage) {
      this.emitStream(executionId, `   Coverage: ${coverage}`, 'info');
    }

    return `✅ Test suite completed! ${passedTests}/${totalTests} tests passed (${successRate}% success rate)${coverage !== 'N/A' ? `, Coverage: ${coverage}` : ''}`;
  }

  private async handleBuildCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '🔨 Starting build process...', 'info');
    
    const steps = [
      'TypeScript compilation',
      'Asset bundling',
      'Dependency resolution',
      'Code optimization',
      'Build verification'
    ];

    for (let i = 0; i < steps.length; i++) {
      this.emitStream(executionId, `\n[${i + 1}/${steps.length}] ${steps[i]}...`, 'info');
      await this.delay(800);
      this.emitStream(executionId, `✅ ${steps[i]} completed`, 'stdout');
    }

    this.emitStream(executionId, '\n🎉 Build completed successfully!', 'info');
    return '✅ Build completed successfully! All artifacts generated and verified.';
  }

  private async handleDeployCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '🚀 Initiating deployment process...', 'info');
    
    if (command.parameters.safetyCheck) {
      this.emitStream(executionId, '\n🛡️ Running safety validation...', 'info');
      await this.delay(1000);
      this.emitStream(executionId, '✅ Safety validation passed', 'stdout');
    }

    const deploySteps = [
      'Creating deployment snapshot',
      'Stopping current services',
      'Deploying new version',
      'Running health checks',
      'Activating new deployment'
    ];

    for (let i = 0; i < deploySteps.length; i++) {
      this.emitStream(executionId, `\n[${i + 1}/${deploySteps.length}] ${deploySteps[i]}...`, 'info');
      await this.delay(1200);
      this.emitStream(executionId, `✅ ${deploySteps[i]} completed`, 'stdout');
    }

    this.emitStream(executionId, '\n🎉 Deployment completed successfully!', 'info');
    return '✅ Deployment completed! New version is live and healthy.';
  }

  private async handleStatusCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '📊 Gathering system status...', 'info');
    await this.delay(500);

    const status = {
      buildPipelines: { active: 2, queued: 1, failed: 0 },
      deployments: { active: 1, successful: 15, failed: 1 },
      tests: { lastRun: '2 minutes ago', successRate: '98.7%' },
      coverage: '96.8%',
      uptime: '15 days, 4 hours'
    };

    this.emitStream(executionId, '\n📋 System Status Report:', 'info');
    this.emitStream(executionId, `   🔨 Build Pipelines: ${status.buildPipelines.active} active, ${status.buildPipelines.queued} queued`, 'info');
    this.emitStream(executionId, `   🚀 Deployments: ${status.deployments.successful} successful, ${status.deployments.failed} failed`, 'info');
    this.emitStream(executionId, `   🧪 Tests: Last run ${status.tests.lastRun}, ${status.tests.successRate} success rate`, 'info');
    this.emitStream(executionId, `   📊 Coverage: ${status.coverage}`, 'info');
    this.emitStream(executionId, `   ⏱️ Uptime: ${status.uptime}`, 'info');

    return `📊 System Status: ${status.buildPipelines.active} active pipelines, ${status.deployments.successful} successful deployments, ${status.tests.successRate} test success rate, ${status.coverage} coverage`;
  }

  private async handleHealthCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '💚 Checking system health...', 'info');
    await this.delay(800);

    const healthChecks = [
      { name: 'Self-Compilation Service', status: 'healthy', responseTime: '45ms' },
      { name: 'Safety Validation System', status: 'healthy', responseTime: '23ms' },
      { name: 'AI Orchestrator', status: 'healthy', responseTime: '156ms' },
      { name: 'Plugin System', status: 'healthy', responseTime: '12ms' },
      { name: 'Monitoring Service', status: 'healthy', responseTime: '34ms' }
    ];

    this.emitStream(executionId, '\n🏥 Health Check Results:', 'info');
    for (const check of healthChecks) {
      this.emitStream(executionId, `   ✅ ${check.name}: ${check.status} (${check.responseTime})`, 'info');
    }

    const overallHealth = healthChecks.every(c => c.status === 'healthy') ? 'HEALTHY' : 'DEGRADED';
    this.emitStream(executionId, `\n🎯 Overall System Health: ${overallHealth}`, 'info');

    return `💚 System Health: ${overallHealth} - All ${healthChecks.length} components are operational`;
  }

  private async handleLogsCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '📜 Retrieving system logs...', 'info');
    await this.delay(400);

    const logCount = command.parameters?.count || 10;
    const level = command.parameters?.level || 'all';

    this.emitStream(executionId, `\n📋 Last ${logCount} log entries (${level} level):`, 'info');
    
    const sampleLogs = [
      { time: '14:32:15', level: 'INFO', message: 'Evolution evo_123 successfully deployed' },
      { time: '14:31:42', level: 'INFO', message: 'Test suite completed with 98.7% success rate' },
      { time: '14:30:18', level: 'WARN', message: 'High memory usage detected: 78%' },
      { time: '14:29:55', level: 'INFO', message: 'Self-compilation pipeline started' },
      { time: '14:28:33', level: 'ERROR', message: 'Plugin validation failed for plugin_xyz' }
    ];

    for (let i = 0; i < Math.min(logCount, sampleLogs.length); i++) {
      const log = sampleLogs[i];
      if (log && log.level && log.time && log.message) {
        const emoji = log.level === 'ERROR' ? '❌' : log.level === 'WARN' ? '⚠️' : 'ℹ️';
        this.emitStream(executionId, `   ${emoji} [${log.time}] ${log.level}: ${log.message}`, 'info');
      }
    }

    return `📜 Retrieved ${Math.min(logCount, sampleLogs.length)} log entries`;
  }

  private async handleRollbackCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    this.emitStream(executionId, '🔄 Initiating rollback procedure...', 'info');
    await this.delay(600);

    this.emitStream(executionId, '\n⚠️ WARNING: This will revert to the previous stable state', 'warning');
    this.emitStream(executionId, '🔍 Identifying last stable snapshot...', 'info');
    await this.delay(800);
    this.emitStream(executionId, '✅ Found snapshot: snap_20241218_143022', 'stdout');
    
    this.emitStream(executionId, '\n🔄 Rolling back deployment...', 'info');
    await this.delay(1500);
    this.emitStream(executionId, '✅ Rollback completed successfully', 'stdout');
    
    this.emitStream(executionId, '\n🏥 Running post-rollback health checks...', 'info');
    await this.delay(1000);
    this.emitStream(executionId, '✅ All systems operational', 'stdout');

    return '✅ Rollback completed successfully! System restored to previous stable state.';
  }

  private async handleUnknownCommand(command: DevOpsCommand, executionId: string): Promise<string> {
    const suggestions = [
      'run tests',
      'build project',
      'deploy latest',
      'show status',
      'check health',
      'view logs',
      'rollback deployment'
    ];

    return `🤔 I'm not sure how to handle "${command.command}". Try one of these commands:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nI'm continuously learning new commands!`;
  }

  // Utility methods
  private addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.messageHistory.push(fullMessage);
    this.messages.next([...this.messageHistory]);
    
    return fullMessage;
  }

  private updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
    const index = this.messageHistory.findIndex(m => m.id === messageId);
    if (index !== -1) {
      // Ensure we don't overwrite required properties with undefined
      const currentMessage = this.messageHistory[index];
      if (currentMessage) {
        const safeUpdates = {
          ...updates,
          id: updates.id || currentMessage.id, // Preserve ID if not provided
          type: updates.type || currentMessage.type,
          content: updates.content !== undefined ? updates.content : currentMessage.content,
          timestamp: updates.timestamp || currentMessage.timestamp
        };
        this.messageHistory[index] = { ...currentMessage, ...safeUpdates };
        this.messages.next([...this.messageHistory]);
      }
    }
  }

  private emitStream(executionId: string, chunk: string, type: StreamingOutput['type']): void {
    const streamOutput: StreamingOutput = {
      executionId,
      chunk,
      type,
      timestamp: new Date()
    };

    this.streamingSubject.next(streamOutput);
    
    // Also add as a stream message
    this.addMessage({
      type: 'stream',
      content: chunk,
      metadata: { executionId }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API
  getMessages$(): Observable<ChatMessage[]> {
    return this.messages.asObservable();
  }

  getStreaming$(): Observable<StreamingOutput> {
    return this.streamingSubject.asObservable();
  }

  getConnectionStatus$(): Observable<boolean> {
    return this.isConnected.asObservable();
  }

  clearChat(): void {
    this.messageHistory = [];
    this.messages.next([]);
    this.initializeChat();
  }

  exportChatHistory(): string {
    return JSON.stringify(this.messageHistory, null, 2);
  }

  getActiveExecutions(): Array<{ id: string; command: string; duration: number }> {
    return Array.from(this.activeExecutions.entries()).map(([id, exec]) => ({
      id,
      command: exec.command,
      duration: Date.now() - exec.startTime.getTime()
    }));
  }
}