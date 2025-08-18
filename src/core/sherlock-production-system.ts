import { EventEmitter } from 'events';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AIBotRegistry, BotMetadata } from './ai-bot-registry';
import { DescriptiveBotBuilder, BotBuildSession } from './descriptive-bot-builder';
import { HardenedDevOpsChat } from './hardened-devops-chat';
import { RealDevOpsExecutor } from './real-devops-executor';
import { SelfCompilationService } from '../services/evolution/self-compilation-service';

export interface ProductionSystemConfig {
  mode: 'development' | 'staging' | 'production';
  security: {
    enableRealExecution: boolean;
    requireConfirmation: boolean;
    auditLogging: boolean;
    rateLimiting: boolean;
  };
  features: {
    botRegistry: boolean;
    descriptiveBuilder: boolean;
    devopsChat: boolean;
    selfCompilation: boolean;
  };
  limits: {
    maxBotsPerUser: number;
    maxConcurrentBuilds: number;
    maxConcurrentExecutions: number;
    sessionTimeout: number;
  };
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    botRegistry: 'online' | 'offline' | 'error';
    botBuilder: 'online' | 'offline' | 'error';
    devopsChat: 'online' | 'offline' | 'error';
    compilation: 'online' | 'offline' | 'error';
  };
  metrics: {
    totalBots: number;
    activeBuildSessions: number;
    activeChatSessions: number;
    activeExecutions: number;
    systemUptime: number;
  };
  lastHealthCheck: Date;
}

/**
 * SherlockProductionSystem - Production-ready integration of all AI bot capabilities
 */
export class SherlockProductionSystem extends EventEmitter {
  private config: ProductionSystemConfig;
  private botRegistry: AIBotRegistry;
  private botBuilder: DescriptiveBotBuilder;
  private devopsChat: HardenedDevOpsChat;
  private compilationService: SelfCompilationService;
  
  private systemStatus = new BehaviorSubject<SystemStatus>(this.getInitialStatus());
  private startTime = Date.now();
  private isInitialized = false;

  constructor(config: Partial<ProductionSystemConfig> = {}) {
    super();
    
    this.config = {
      mode: 'development',
      security: {
        enableRealExecution: false,
        requireConfirmation: true,
        auditLogging: true,
        rateLimiting: true
      },
      features: {
        botRegistry: true,
        descriptiveBuilder: true,
        devopsChat: true,
        selfCompilation: true
      },
      limits: {
        maxBotsPerUser: 10,
        maxConcurrentBuilds: 3,
        maxConcurrentExecutions: 5,
        sessionTimeout: 3600000 // 1 hour
      },
      ...config
    };

    this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    try {
      console.log('🚀 Initializing Sherlock Production System...');

      // Initialize bot registry
      if (this.config.features.botRegistry) {
        this.botRegistry = new AIBotRegistry('./data/bot-registry');
        await this.botRegistry.initialize();
        console.log('✅ Bot Registry initialized');
      }

      // Initialize descriptive bot builder
      if (this.config.features.descriptiveBuilder) {
        this.botBuilder = new DescriptiveBotBuilder(this.botRegistry);
        console.log('✅ Descriptive Bot Builder initialized');
      }

      // Initialize DevOps chat
      if (this.config.features.devopsChat) {
        this.devopsChat = new HardenedDevOpsChat({
          executionMode: this.config.security.enableRealExecution ? 'real' : 'simulation',
          requireConfirmation: this.config.security.requireConfirmation,
          auditLogging: this.config.security.auditLogging,
          maxCommandsPerMinute: this.config.security.rateLimiting ? 10 : 100
        });
        console.log('✅ Hardened DevOps Chat initialized');
      }

      // Initialize self-compilation service
      if (this.config.features.selfCompilation) {
        this.compilationService = new SelfCompilationService('web' as any);
        console.log('✅ Self-Compilation Service initialized');
      }

      // Set up cross-component integrations
      this.setupIntegrations();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.emit('system-initialized');
      
      console.log('🌟 Sherlock Production System fully operational');

    } catch (error) {
      console.error('❌ Failed to initialize production system:', error);
      this.emit('system-error', error);
      throw error;
    }
  }

  /**
   * Create a bot from natural language description with full pipeline
   */
  async createBotFromDescription(
    userId: string, 
    description: string,
    options: {
      autoRegister?: boolean;
      autoDeploy?: boolean;
      realTimeUpdates?: boolean;
    } = {}
  ): Promise<{
    buildSession: BotBuildSession;
    registeredBot?: BotMetadata;
    deploymentPipeline?: any;
  }> {
    
    console.log(`🏗️ Creating bot from description for user: ${userId}`);
    
    // Start build session
    const buildSession = await this.botBuilder.startBuildSession(userId, description);
    
    let registeredBot: BotMetadata | undefined;
    let deploymentPipeline: any;

    // If auto-register is enabled, complete the build process
    if (options.autoRegister && buildSession.generatedBot) {
      try {
        // Register the bot in the registry
        registeredBot = await this.botRegistry.registerBot(buildSession.generatedBot as any);
        
        console.log(`✅ Bot registered: ${registeredBot.name} (${registeredBot.id})`);
        
        // If auto-deploy is enabled, deploy the bot
        if (options.autoDeploy && this.config.features.selfCompilation) {
          const evolution = {
            id: `bot-deploy-${registeredBot.id}`,
            type: 'feature' as const,
            description: `Deploy new AI bot: ${registeredBot.name}`,
            affectedFiles: [`bots/${registeredBot.id}/index.ts`],
            codeChanges: [],
            testFiles: [],
            timestamp: new Date(),
            author: userId,
            riskLevel: 'medium' as const
          };

          deploymentPipeline = await this.compilationService.executeBuildPipeline(evolution);
          console.log(`🚀 Bot deployment pipeline: ${deploymentPipeline.id}`);
        }
        
      } catch (error) {
        console.error('Failed to register/deploy bot:', error);
      }
    }

    this.emit('bot-created-from-description', {
      userId,
      description,
      buildSession,
      registeredBot,
      deploymentPipeline
    });

    return {
      buildSession,
      registeredBot,
      deploymentPipeline
    };
  }

  /**
   * Get comprehensive system analytics
   */
  getSystemAnalytics(): {
    botRegistry: ReturnType<AIBotRegistry['getStatistics']>;
    devopsChat: ReturnType<HardenedDevOpsChat['getStatistics']>;
    compilation: ReturnType<SelfCompilationService['getCompilationStatistics']>;
    system: SystemStatus;
  } {
    return {
      botRegistry: this.botRegistry?.getStatistics() || {} as any,
      devopsChat: this.devopsChat?.getStatistics() || {} as any,
      compilation: this.compilationService?.getCompilationStatistics() || {} as any,
      system: this.systemStatus.value
    };
  }

  /**
   * Execute a DevOps command through the integrated system
   */
  async executeDevOpsCommand(
    userId: string,
    command: string,
    options: {
      realExecution?: boolean;
      sessionId?: string;
    } = {}
  ): Promise<any> {
    
    if (!this.config.features.devopsChat) {
      throw new Error('DevOps chat is disabled');
    }

    // Create session if needed
    let sessionId = options.sessionId;
    if (!sessionId) {
      const session = await this.devopsChat.createSession(userId);
      sessionId = session.id;
    }

    // Execute command
    return await this.devopsChat.executeCommand({
      command,
      sessionId,
      forceReal: options.realExecution
    });
  }

  /**
   * Get bot recommendations based on user needs
   */
  async getBotRecommendations(
    userId: string,
    requirements: {
      task: string;
      complexity: 'low' | 'medium' | 'high';
      domain: string;
    }
  ): Promise<{
    existingBots: BotMetadata[];
    buildSuggestion: string;
    confidence: number;
  }> {
    
    // Search for existing bots that match requirements
    const searchResults = this.botRegistry.searchBots({
      query: requirements.task,
      complexity: requirements.complexity,
      sortBy: 'reliability',
      limit: 5
    });

    // Generate build suggestion if no good matches
    let buildSuggestion = '';
    let confidence = 0;

    if (searchResults.bots.length === 0) {
      buildSuggestion = `I recommend building a custom ${requirements.complexity}-complexity bot for ${requirements.task} in the ${requirements.domain} domain.`;
      confidence = 0.8;
    } else {
      const bestBot = searchResults.bots[0];
      const avgReliability = bestBot.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / bestBot.capabilities.length;
      
      if (avgReliability < 0.7) {
        buildSuggestion = `Existing bots have low reliability. Consider building a new bot or improving "${bestBot.name}".`;
        confidence = 0.6;
      } else {
        buildSuggestion = `"${bestBot.name}" looks like a good match for your needs.`;
        confidence = avgReliability;
      }
    }

    return {
      existingBots: searchResults.bots,
      buildSuggestion,
      confidence
    };
  }

  // Private methods
  private setupIntegrations(): void {
    // Bot registry events
    this.botRegistry?.on('bot-registered', (bot) => {
      this.emit('bot-registered', bot);
      this.updateSystemStatus();
    });

    // Bot builder events
    this.botBuilder?.on('session-completed', (session) => {
      this.emit('build-session-completed', session);
    });

    // DevOps chat events
    this.devopsChat?.on('command-executed', (data) => {
      this.emit('devops-command-executed', data);
    });

    // Compilation service events
    this.compilationService?.getPipelines$().subscribe(pipeline => {
      this.emit('compilation-pipeline-update', pipeline);
    });
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateSystemStatus();
    }, 30000); // Check every 30 seconds
  }

  private updateSystemStatus(): void {
    const status = this.calculateSystemStatus();
    this.systemStatus.next(status);
  }

  private calculateSystemStatus(): SystemStatus {
    const uptime = Date.now() - this.startTime;
    
    const components = {
      botRegistry: this.botRegistry ? 'online' as const : 'offline' as const,
      botBuilder: this.botBuilder ? 'online' as const : 'offline' as const,
      devopsChat: this.devopsChat ? 'online' as const : 'offline' as const,
      compilation: this.compilationService ? 'online' as const : 'offline' as const
    };

    const offlineComponents = Object.values(components).filter(status => status === 'offline').length;
    const overall = offlineComponents === 0 ? 'healthy' : offlineComponents < 2 ? 'degraded' : 'critical';

    const metrics = {
      totalBots: this.botRegistry?.getStatistics().totalBots || 0,
      activeBuildSessions: this.botBuilder?.getUserSessions('demo-user').length || 0,
      activeChatSessions: this.devopsChat?.getActiveSessions().length || 0,
      activeExecutions: this.devopsChat?.getStatistics().executorStats.activeExecutions || 0,
      systemUptime: uptime
    };

    return {
      overall,
      components,
      metrics,
      lastHealthCheck: new Date()
    };
  }

  private getInitialStatus(): SystemStatus {
    return {
      overall: 'healthy',
      components: {
        botRegistry: 'offline',
        botBuilder: 'offline',
        devopsChat: 'offline',
        compilation: 'offline'
      },
      metrics: {
        totalBots: 0,
        activeBuildSessions: 0,
        activeChatSessions: 0,
        activeExecutions: 0,
        systemUptime: 0
      },
      lastHealthCheck: new Date()
    };
  }

  // Public API
  getBotRegistry(): AIBotRegistry {
    return this.botRegistry;
  }

  getBotBuilder(): DescriptiveBotBuilder {
    return this.botBuilder;
  }

  getDevOpsChat(): HardenedDevOpsChat {
    return this.devopsChat;
  }

  getSystemStatus$(): Observable<SystemStatus> {
    return this.systemStatus.asObservable();
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Sherlock Production System...');
    
    this.devopsChat?.cleanup();
    this.removeAllListeners();
    
    console.log('✅ System shutdown complete');
  }
}