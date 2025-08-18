import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { Observable, Subject } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ExecutionConfig {
  mode: 'simulation' | 'real';
  allowedCommands: string[];
  workingDirectory: string;
  timeout: number;
  maxConcurrent: number;
  safetyChecks: boolean;
}

export interface CommandExecution {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  output: string[];
  error?: string;
  pid?: number;
}

export interface StreamOutput {
  executionId: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
  data: string;
  timestamp: Date;
}

/**
 * RealDevOpsExecutor - Executes actual system commands with safety controls
 */
export class RealDevOpsExecutor extends EventEmitter {
  private config: ExecutionConfig;
  private activeExecutions = new Map<string, CommandExecution>();
  private streamSubject = new Subject<StreamOutput>();
  
  // Predefined safe commands
  private readonly SAFE_COMMANDS = {
    test: [
      'npm test',
      'npm run test',
      'npm run test:unit',
      'npm run test:integration',
      'npm run test:coverage',
      'yarn test',
      'pnpm test'
    ],
    build: [
      'npm run build',
      'npm run compile',
      'yarn build',
      'pnpm build',
      'tsc',
      'webpack'
    ],
    lint: [
      'npm run lint',
      'npm run format',
      'eslint .',
      'prettier --check .',
      'yarn lint',
      'pnpm lint'
    ],
    info: [
      'npm --version',
      'node --version',
      'git status',
      'git log --oneline -10',
      'ls -la',
      'pwd',
      'whoami',
      'date'
    ]
  };

  // Dangerous commands that should never be executed
  private readonly BLOCKED_COMMANDS = [
    'rm -rf',
    'sudo',
    'chmod 777',
    'dd if=',
    'mkfs',
    'fdisk',
    'format',
    'del /f',
    'shutdown',
    'reboot',
    'halt',
    'init 0',
    'kill -9',
    'killall',
    'pkill -f',
    '> /dev/',
    'curl | sh',
    'wget | sh',
    'eval',
    'exec'
  ];

  constructor(config: Partial<ExecutionConfig> = {}) {
    super();
    
    this.config = {
      mode: 'simulation',
      allowedCommands: [...Object.values(this.SAFE_COMMANDS).flat()],
      workingDirectory: process.cwd(),
      timeout: 300000, // 5 minutes
      maxConcurrent: 3,
      safetyChecks: true,
      ...config
    };

    console.log('🔧 RealDevOpsExecutor initialized', {
      mode: this.config.mode,
      allowedCommands: this.config.allowedCommands.length,
      safetyChecks: this.config.safetyChecks
    });
  }

  /**
   * Execute a DevOps command (real or simulated based on config)
   */
  async executeCommand(command: string, options: {
    realExecution?: boolean;
    streamOutput?: boolean;
  } = {}): Promise<CommandExecution> {
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: CommandExecution = {
      id: executionId,
      command,
      status: 'pending',
      startTime: new Date(),
      output: []
    };

    this.activeExecutions.set(executionId, execution);

    try {
      // Determine execution mode
      const useRealExecution = options.realExecution ?? (this.config.mode === 'real');
      
      if (useRealExecution) {
        return await this.executeRealCommand(execution, options.streamOutput);
      } else {
        return await this.executeSimulatedCommand(execution, options.streamOutput);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);
      
      this.emit('execution-failed', execution);
      return execution;
    } finally {
      // Clean up after 5 minutes
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 300000);
    }
  }

  /**
   * Execute real system command with safety checks
   */
  private async executeRealCommand(execution: CommandExecution, streamOutput = false): Promise<CommandExecution> {
    const { command } = execution;
    
    // Safety checks
    if (this.config.safetyChecks) {
      const safetyCheck = this.performSafetyCheck(command);
      if (!safetyCheck.safe) {
        throw new Error(`Command blocked by safety check: ${safetyCheck.reason}`);
      }
    }

    // Check concurrent executions
    const runningCount = Array.from(this.activeExecutions.values())
      .filter(e => e.status === 'running').length;
    
    if (runningCount >= this.config.maxConcurrent) {
      throw new Error(`Maximum concurrent executions (${this.config.maxConcurrent}) reached`);
    }

    execution.status = 'running';
    this.emit('execution-started', execution);

    if (streamOutput) {
      return await this.executeWithStreaming(execution);
    } else {
      return await this.executeWithBuffer(execution);
    }
  }

  /**
   * Execute command with real-time streaming output
   */
  private async executeWithStreaming(execution: CommandExecution): Promise<CommandExecution> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', execution.command], {
        cwd: this.config.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      execution.pid = child.pid;

      // Handle stdout
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        execution.output.push(output);
        
        this.streamSubject.next({
          executionId: execution.id,
          type: 'stdout',
          data: output,
          timestamp: new Date()
        });
      });

      // Handle stderr
      child.stderr?.on('data', (data) => {
        const output = data.toString();
        execution.output.push(output);
        
        this.streamSubject.next({
          executionId: execution.id,
          type: 'stderr',
          data: output,
          timestamp: new Date()
        });
      });

      // Handle completion
      child.on('close', (code) => {
        execution.status = code === 0 ? 'completed' : 'failed';
        execution.endTime = new Date();
        execution.exitCode = code || 0;

        if (code === 0) {
          this.emit('execution-completed', execution);
          resolve(execution);
        } else {
          execution.error = `Command exited with code ${code}`;
          this.emit('execution-failed', execution);
          reject(new Error(execution.error));
        }
      });

      // Handle errors
      child.on('error', (error) => {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.error = error.message;
        
        this.emit('execution-failed', execution);
        reject(error);
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        execution.status = 'failed';
        execution.error = 'Command timed out';
        reject(new Error('Command timed out'));
      }, this.config.timeout);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Execute command with buffered output
   */
  private async executeWithBuffer(execution: CommandExecution): Promise<CommandExecution> {
    try {
      const { stdout, stderr } = await execAsync(execution.command, {
        cwd: this.config.workingDirectory,
        timeout: this.config.timeout
      });

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.exitCode = 0;
      execution.output = [stdout, stderr].filter(Boolean);

      this.emit('execution-completed', execution);
      return execution;

    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.exitCode = error.code || 1;
      execution.error = error.message;
      execution.output = [error.stdout, error.stderr].filter(Boolean);

      this.emit('execution-failed', execution);
      throw error;
    }
  }

  /**
   * Execute simulated command for testing
   */
  private async executeSimulatedCommand(execution: CommandExecution, streamOutput = false): Promise<CommandExecution> {
    execution.status = 'running';
    this.emit('execution-started', execution);

    // Simulate processing time
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
    
    if (streamOutput) {
      // Simulate streaming output
      const outputs = this.generateSimulatedOutput(execution.command);
      
      for (let i = 0; i < outputs.length; i++) {
        await this.delay(processingTime / outputs.length);
        
        execution.output.push(outputs[i]);
        this.streamSubject.next({
          executionId: execution.id,
          type: 'stdout',
          data: outputs[i],
          timestamp: new Date()
        });
      }
    } else {
      await this.delay(processingTime);
      execution.output = this.generateSimulatedOutput(execution.command);
    }

    execution.status = 'completed';
    execution.endTime = new Date();
    execution.exitCode = 0;

    this.emit('execution-completed', execution);
    return execution;
  }

  /**
   * Generate simulated output based on command type
   */
  private generateSimulatedOutput(command: string): string[] {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('test')) {
      return [
        '🧪 Running test suite...',
        'Test Suites: 5 passed, 5 total',
        'Tests:       45 passed, 45 total',
        'Snapshots:   0 total',
        'Time:        3.456 s',
        'Coverage: 96.8%'
      ];
    } else if (lowerCommand.includes('build')) {
      return [
        '🔨 Starting build process...',
        'Compiling TypeScript...',
        'Bundling assets...',
        'Optimizing output...',
        '✅ Build completed successfully!',
        'Output: dist/'
      ];
    } else if (lowerCommand.includes('lint')) {
      return [
        '🔍 Running linter...',
        'Checking 25 files...',
        '✅ No linting errors found',
        'Code style: Excellent'
      ];
    } else if (lowerCommand.includes('git status')) {
      return [
        'On branch main',
        'Your branch is up to date with \'origin/main\'.',
        '',
        'Changes not staged for commit:',
        '  modified:   src/core/real-devops-executor.ts',
        '',
        'no changes added to commit'
      ];
    } else {
      return [
        `Executing: ${command}`,
        '✅ Command completed successfully'
      ];
    }
  }

  /**
   * Perform safety checks on command
   */
  private performSafetyCheck(command: string): { safe: boolean; reason?: string } {
    // Check for blocked commands
    for (const blocked of this.BLOCKED_COMMANDS) {
      if (command.toLowerCase().includes(blocked.toLowerCase())) {
        return { safe: false, reason: `Contains blocked pattern: ${blocked}` };
      }
    }

    // Check if command is in allowed list (if restrictive mode)
    if (this.config.allowedCommands.length > 0) {
      const isAllowed = this.config.allowedCommands.some(allowed => 
        command.toLowerCase().startsWith(allowed.toLowerCase())
      );
      
      if (!isAllowed) {
        return { safe: false, reason: 'Command not in allowed list' };
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\|\s*sh/,           // Piping to shell
      /\|\s*bash/,         // Piping to bash
      /&&.*rm/,            // Chained with rm
      /;.*rm/,             // Semicolon with rm
      /`.*`/,              // Command substitution
      /\$\(.*\)/,          // Command substitution
      />\s*\/dev/,         // Writing to device files
      /curl.*\|/,          // Curl piped to something
      /wget.*\|/           // Wget piped to something
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(command)) {
        return { safe: false, reason: `Contains suspicious pattern: ${pattern.source}` };
      }
    }

    return { safe: true };
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    if (execution.pid) {
      try {
        process.kill(execution.pid, 'SIGTERM');
        execution.status = 'cancelled';
        execution.endTime = new Date();
        this.emit('execution-cancelled', execution);
        return true;
      } catch (error) {
        console.error('Failed to cancel execution:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): CommandExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): CommandExecution[] {
    return Array.from(this.activeExecutions.values())
      .filter(e => e.status === 'running');
  }

  /**
   * Get streaming output observable
   */
  getStreamOutput$(): Observable<StreamOutput> {
    return this.streamSubject.asObservable();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExecutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ExecutionConfig {
    return { ...this.config };
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    const executions = Array.from(this.activeExecutions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const active = executions.filter(e => e.status === 'running');

    const avgTime = completed.length > 0 
      ? completed.reduce((sum, e) => {
          const duration = e.endTime!.getTime() - e.startTime.getTime();
          return sum + duration;
        }, 0) / completed.length
      : 0;

    return {
      totalExecutions: executions.length,
      activeExecutions: active.length,
      completedExecutions: completed.length,
      failedExecutions: failed.length,
      averageExecutionTime: avgTime
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Cancel all running executions
    for (const execution of this.activeExecutions.values()) {
      if (execution.status === 'running' && execution.pid) {
        try {
          process.kill(execution.pid, 'SIGTERM');
        } catch (error) {
          console.error('Failed to cleanup execution:', error);
        }
      }
    }

    this.activeExecutions.clear();
    this.removeAllListeners();
  }
}