import { EventEmitter } from 'events';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { RealDevOpsExecutor, ExecutionConfig, CommandExecution } from './real-devops-executor';

export interface HardenedChatConfig {
  executionMode: 'simulation' | 'real' | 'hybrid';
  requireConfirmation: boolean;
  allowedUsers: string[];
  sessionTimeout: number;
  auditLogging: boolean;
  maxCommandsPerMinute: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  commandCount: number;
  isAuthenticated: boolean;
  permissions: string[];
}

export interface AuditLog {
  id: string;
  sessionId: string;
  userId: string;
  command: string;
  executionMode: 'simulation' | 'real';
  timestamp: Date;
  success: boolean;
  output?: string;
  error?: string;
  ipAddress?: string;
}

export interface CommandRequest {
  command: string;
  sessionId: string;
  forceReal?: boolean;
  skipConfirmation?: boolean;
}

export interface CommandResponse {
  success: boolean;
  executionId: string;
  mode: 'simulation' | 'real';
  requiresConfirmation?: boolean;
  confirmationToken?: string;
  output?: string;
  error?: string;
  warnings?: string[];
}

/**
 * HardenedDevOpsChat - Production-ready DevOps chat with security controls
 */
export class HardenedDevOpsChat extends EventEmitter {
  private config: HardenedChatConfig;
  private executor: RealDevOpsExecutor;
  private sessions = new Map<string, ChatSession>();
  private auditLogs: AuditLog[] = [];
  private pendingConfirmations = new Map<string, CommandRequest>();
  private rateLimiter = new Map<string, number[]>();

  private sessionSubject = new BehaviorSubject<ChatSession[]>([]);
  private auditSubject = new Subject<AuditLog>();

  constructor(
    config: Partial<HardenedChatConfig> = {},
    executorConfig: Partial<ExecutionConfig> = {}
  ) {
    super();

    this.config = {
      executionMode: 'simulation',
      requireConfirmation: true,
      allowedUsers: [],
      sessionTimeout: 3600000, // 1 hour
      auditLogging: true,
      maxCommandsPerMinute: 10,
      ...config
    };

    this.executor = new RealDevOpsExecutor({
      mode: this.config.executionMode === 'real' ? 'real' : 'simulation',
      safetyChecks: true,
      ...executorConfig
    });

    this.setupEventListeners();
    this.startSessionCleanup();

    console.log('🛡️ HardenedDevOpsChat initialized', {
      mode: this.config.executionMode,
      requireConfirmation: this.config.requireConfirmation,
      auditLogging: this.config.auditLogging
    });
  }

  /**
   * Create or get user session
   */
  async createSession(userId: string, ipAddress?: string): Promise<ChatSession> {
    // Check if user is allowed
    if (this.config.allowedUsers.length > 0 && !this.config.allowedUsers.includes(userId)) {
      throw new Error('User not authorized for DevOps chat');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      commandCount: 0,
      isAuthenticated: true,
      permissions: this.getUserPermissions(userId)
    };

    this.sessions.set(sessionId, session);
    this.updateSessionsSubject();

    this.auditLog({
      sessionId,
      userId,
      command: 'SESSION_CREATED',
      executionMode: 'simulation',
      timestamp: new Date(),
      success: true,
      ipAddress
    });

    this.emit('session-created', session);
    return session;
  }

  /**
   * Execute a DevOps command with security controls
   */
  async executeCommand(request: CommandRequest): Promise<CommandResponse> {
    const session = this.sessions.get(request.sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }

    // Update session activity
    session.lastActivity = new Date();
    session.commandCount++;

    // Rate limiting
    if (!this.checkRateLimit(session.userId)) {
      throw new Error('Rate limit exceeded. Please wait before sending more commands.');
    }

    // Determine execution mode
    let executionMode: 'simulation' | 'real' = 'simulation';
    
    if (this.config.executionMode === 'real' || request.forceReal) {
      executionMode = 'real';
    } else if (this.config.executionMode === 'hybrid') {
      // In hybrid mode, use real execution for safe commands
      executionMode = this.isSafeCommand(request.command) ? 'real' : 'simulation';
    }

    // Check if confirmation is required
    if (this.config.requireConfirmation && 
        executionMode === 'real' && 
        !request.skipConfirmation &&
        this.isDestructiveCommand(request.command)) {
      
      const confirmationToken = this.generateConfirmationToken();
      this.pendingConfirmations.set(confirmationToken, request);
      
      return {
        success: false,
        executionId: '',
        mode: executionMode,
        requiresConfirmation: true,
        confirmationToken,
        warnings: [
          'This command will execute on the real system.',
          'Please confirm if you want to proceed.',
          `Command: ${request.command}`
        ]
      };
    }

    try {
      // Execute the command
      const execution = await this.executor.executeCommand(request.command, {
        realExecution: executionMode === 'real',
        streamOutput: true
      });

      // Audit log
      this.auditLog({
        sessionId: request.sessionId,
        userId: session.userId,
        command: request.command,
        executionMode,
        timestamp: new Date(),
        success: execution.status === 'completed',
        output: execution.output.join('\n'),
        error: execution.error
      });

      const response: CommandResponse = {
        success: execution.status === 'completed',
        executionId: execution.id,
        mode: executionMode,
        output: execution.output.join('\n'),
        error: execution.error
      };

      // Add warnings for real execution
      if (executionMode === 'real') {
        response.warnings = ['Command executed on real system'];
      }

      this.emit('command-executed', { session, request, execution, response });
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Audit log for failed execution
      this.auditLog({
        sessionId: request.sessionId,
        userId: session.userId,
        command: request.command,
        executionMode,
        timestamp: new Date(),
        success: false,
        error: errorMessage
      });

      return {
        success: false,
        executionId: '',
        mode: executionMode,
        error: errorMessage
      };
    }
  }

  /**
   * Confirm a pending command execution
   */
  async confirmCommand(confirmationToken: string): Promise<CommandResponse> {
    const request = this.pendingConfirmations.get(confirmationToken);
    if (!request) {
      throw new Error('Invalid or expired confirmation token');
    }

    this.pendingConfirmations.delete(confirmationToken);
    
    // Execute with confirmation bypass
    return await this.executeCommand({
      ...request,
      skipConfirmation: true
    });
  }

  /**
   * Cancel a pending confirmation
   */
  cancelConfirmation(confirmationToken: string): boolean {
    return this.pendingConfirmations.delete(confirmationToken);
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Terminate a session
   */
  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.updateSessionsSubject();

    this.auditLog({
      sessionId,
      userId: session.userId,
      command: 'SESSION_TERMINATED',
      executionMode: 'simulation',
      timestamp: new Date(),
      success: true
    });

    this.emit('session-terminated', session);
    return true;
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit = 100): AuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Get streaming output for an execution
   */
  getExecutionStream$(executionId: string): Observable<any> {
    return this.executor.getStreamOutput$();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HardenedChatConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update executor mode if needed
    if (newConfig.executionMode) {
      this.executor.updateConfig({
        mode: newConfig.executionMode === 'real' ? 'real' : 'simulation'
      });
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): HardenedChatConfig {
    return { ...this.config };
  }

  /**
   * Get system statistics
   */
  getStatistics(): {
    activeSessions: number;
    totalCommands: number;
    realExecutions: number;
    simulatedExecutions: number;
    failedCommands: number;
    averageSessionDuration: number;
    executorStats: ReturnType<RealDevOpsExecutor['getStatistics']>;
  } {
    const sessions = Array.from(this.sessions.values());
    const realExecutions = this.auditLogs.filter(log => log.executionMode === 'real').length;
    const simulatedExecutions = this.auditLogs.filter(log => log.executionMode === 'simulation').length;
    const failedCommands = this.auditLogs.filter(log => !log.success).length;

    const avgSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, session) => {
          const duration = session.lastActivity.getTime() - session.startTime.getTime();
          return sum + duration;
        }, 0) / sessions.length
      : 0;

    return {
      activeSessions: sessions.length,
      totalCommands: this.auditLogs.length,
      realExecutions,
      simulatedExecutions,
      failedCommands,
      averageSessionDuration: avgSessionDuration,
      executorStats: this.executor.getStatistics()
    };
  }

  // Private methods

  private setupEventListeners(): void {
    this.executor.on('execution-completed', (execution: CommandExecution) => {
      this.emit('execution-completed', execution);
    });

    this.executor.on('execution-failed', (execution: CommandExecution) => {
      this.emit('execution-failed', execution);
    });
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity.getTime() > this.config.sessionTimeout) {
          expiredSessions.push(sessionId);
        }
      }

      for (const sessionId of expiredSessions) {
        this.terminateSession(sessionId);
      }
    }, 60000); // Check every minute
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimiter.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= this.config.maxCommandsPerMinute) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimiter.set(userId, recentRequests);
    return true;
  }

  private isSafeCommand(command: string): boolean {
    const safeCommands = [
      'npm test',
      'npm run test',
      'npm run lint',
      'git status',
      'git log',
      'ls',
      'pwd',
      'whoami',
      'date',
      'node --version',
      'npm --version'
    ];

    return safeCommands.some(safe => command.toLowerCase().startsWith(safe.toLowerCase()));
  }

  private isDestructiveCommand(command: string): boolean {
    const destructivePatterns = [
      'rm ',
      'del ',
      'delete ',
      'drop ',
      'truncate ',
      'format ',
      'mkfs',
      'fdisk',
      'shutdown',
      'reboot',
      'kill',
      'npm publish',
      'git push',
      'git reset --hard',
      'docker rm',
      'docker rmi'
    ];

    return destructivePatterns.some(pattern => 
      command.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private getUserPermissions(userId: string): string[] {
    // In a real implementation, this would fetch from a user management system
    return ['read', 'execute', 'build', 'test'];
  }

  private generateConfirmationToken(): string {
    return `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private auditLog(log: Omit<AuditLog, 'id'>): void {
    if (!this.config.auditLogging) return;

    const auditEntry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...log
    };

    this.auditLogs.push(auditEntry);
    
    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    this.auditSubject.next(auditEntry);
    this.emit('audit-log', auditEntry);
  }

  private updateSessionsSubject(): void {
    this.sessionSubject.next(Array.from(this.sessions.values()));
  }

  // Observables
  getSessions$(): Observable<ChatSession[]> {
    return this.sessionSubject.asObservable();
  }

  getAuditLogs$(): Observable<AuditLog> {
    return this.auditSubject.asObservable();
  }

  // Cleanup
  cleanup(): void {
    this.executor.cleanup();
    this.sessions.clear();
    this.pendingConfirmations.clear();
    this.rateLimiter.clear();
    this.removeAllListeners();
  }
}