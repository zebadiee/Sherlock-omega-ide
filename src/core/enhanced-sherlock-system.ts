import { EventEmitter } from 'events';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

import { EnhancedPluginSystem, AIBot, BotTemplate } from './enhanced-plugin-system';
import { AIBotBuilder, BotBuilderConfig } from '../ui/ai-bot-builder';
import { AsyncProcessingEngine, ProcessingTask, ProcessingResult } from './async-processing-engine';
import { IntelligentModelRouter, TaskRequirements, ModelSelection } from '../ai/intelligent-model-router';
import { SelfCompilationService, CompilationPipeline } from '../services/evolution/self-compilation-service';
import { SafetyValidationSystem, Evolution } from '../services/evolution/safety-validation-system';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  activeComponents: string[];
  issues: Array<{
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  performance: {
    averageResponseTime: number;
    successRate: number;
    throughput: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'file-change' | 'error-detected' | 'performance-threshold' | 'schedule' | 'manual';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'create-bot' | 'run-analysis' | 'generate-tests' | 'fix-code' | 'notify';
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  lastTriggered?: Date;
  executionCount: number;
}

export interface EnhancedCapabilities {
  selfHealing: {
    enabled: boolean;
    autoFix: boolean;
    confidenceThreshold: number;
    maxAttempts: number;
  };
  continuousLearning: {
    enabled: boolean;
    feedbackCollection: boolean;
    modelRetraining: boolean;
    performanceOptimization: boolean;
  };
  proactiveAssistance: {
    enabled: boolean;
    intentPrediction: boolean;
    contextAwareness: boolean;
    suggestionEngine: boolean;
  };
}

export class EnhancedSherlockSystem extends EventEmitter {
  private pluginSystem!: EnhancedPluginSystem;
  private botBuilder!: AIBotBuilder;
  private processingEngine!: AsyncProcessingEngine;
  private modelRouter!: IntelligentModelRouter;
  private compilationService!: SelfCompilationService;
  private safetyValidation!: SafetyValidationSystem;
  
  private systemHealth = new BehaviorSubject<SystemHealth>(this.getInitialHealth());
  private automationRules = new Map<string, AutomationRule>();
  private capabilities: EnhancedCapabilities;
  
  private startTime = Date.now();
  private isInitialized = false;

  constructor(capabilities?: Partial<EnhancedCapabilities>) {
    super();
    
    this.capabilities = {
      selfHealing: {
        enabled: true,
        autoFix: true,
        confidenceThreshold: 0.8,
        maxAttempts: 3
      },
      continuousLearning: {
        enabled: true,
        feedbackCollection: true,
        modelRetraining: false, // Requires additional infrastructure
        performanceOptimization: true
      },
      proactiveAssistance: {
        enabled: true,
        intentPrediction: true,
        contextAwareness: true,
        suggestionEngine: true
      },
      ...capabilities
    };

    this.initializeSystem();
  }

  // System Initialization
  private async initializeSystem(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced Sherlock Ω System...');

      // Initialize core components
      this.pluginSystem = new EnhancedPluginSystem();
      this.botBuilder = new AIBotBuilder(this.pluginSystem);
      this.processingEngine = new AsyncProcessingEngine();
      this.modelRouter = new IntelligentModelRouter();
      this.compilationService = new SelfCompilationService('web' as any); // Platform type
      this.safetyValidation = new SafetyValidationSystem('web' as any);

      // Set up event listeners
      this.setupEventListeners();

      // Initialize automation rules
      this.initializeDefaultAutomationRules();

      // Start health monitoring
      this.startHealthMonitoring();

      // Start proactive assistance if enabled
      if (this.capabilities.proactiveAssistance.enabled) {
        this.startProactiveAssistance();
      }

      this.isInitialized = true;
      this.emit('system-initialized');
      
      console.log('✅ Enhanced Sherlock Ω System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize system:', error);
      this.emit('system-error', error);
      throw error;
    }
  }

  // Enhanced Bot Creation with AI Assistance
  async createIntelligentBot(requirements: {
    description: string;
    taskType: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    customRequirements?: Record<string, any>;
  }): Promise<AIBot> {
    
    // Use AI to analyze requirements and suggest optimal configuration
    const analysisTask: ProcessingTask = {
      id: '',
      type: 'analysis',
      priority: requirements.priority,
      payload: {
        description: requirements.description,
        taskType: requirements.taskType,
        complexity: requirements.complexity,
        analysisType: 'bot-requirements'
      },
      createdAt: new Date()
    };

    const taskId = await this.processingEngine.submitTask(analysisTask);
    const analysisResult = await this.waitForTaskCompletion(taskId);

    if (!analysisResult.success) {
      throw new Error(`Failed to analyze bot requirements: ${analysisResult.error}`);
    }

    // Generate bot configuration based on analysis
    const botConfig = this.generateBotConfigFromAnalysis(
      requirements,
      analysisResult.result
    );

    // Select optimal AI model for the bot
    const modelRequirements: TaskRequirements = {
      type: requirements.taskType as any,
      complexity: requirements.complexity,
      priority: requirements.priority,
      qualityThreshold: requirements.complexity === 'high' ? 0.9 : 0.7
    };

    const modelSelection = await this.modelRouter.selectOptimalModel(modelRequirements);
    botConfig.configuration = {
      ...botConfig.configuration,
      model: modelSelection.model.id,
      estimatedCost: modelSelection.estimatedCost,
      estimatedLatency: modelSelection.estimatedLatency
    };

    // Create the bot
    const bot = await this.pluginSystem.createBot('custom', {
      name: botConfig.name,
      description: botConfig.description,
      customConfig: botConfig.configuration
    });

    // Activate the bot
    await this.pluginSystem.activateBot(bot.id);

    this.emit('intelligent-bot-created', { bot, modelSelection, requirements });
    return bot;
  }

  // Automated Code Generation with Streaming
  async generateCodeWithStreaming(
    prompt: string,
    options: {
      language?: string;
      complexity?: 'low' | 'medium' | 'high';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      context?: any;
    } = {}
  ): Promise<{
    taskId: string;
    stream$: Observable<string>;
    result$: Observable<ProcessingResult>;
  }> {
    
    // Select optimal model for code generation
    const modelSelection = await this.modelRouter.selectOptimalModel({
      type: 'code-generation',
      complexity: options.complexity || 'medium',
      priority: options.priority || 'medium',
      language: options.language
    });

    // Submit processing task
    const taskId = await this.processingEngine.submitTask({
      type: 'code-generation',
      priority: options.priority || 'medium',
      payload: {
        prompt,
        language: options.language || 'typescript',
        context: options.context,
        model: modelSelection.model.id
      }
    });

    // Create streaming observable
    const stream$ = this.processingEngine.getStreamingResponse$(taskId).pipe(
      map(response => response.chunk),
      filter(chunk => chunk.length > 0)
    );

    // Create result observable
    const result$ = this.processingEngine.getResults$().pipe(
      filter(result => result.taskId === taskId)
    );

    return { taskId, stream$, result$ };
  }

  // Self-Healing Code Analysis and Repair
  async performSelfHealingAnalysis(
    code: string,
    filePath: string,
    options: {
      autoFix?: boolean;
      confidenceThreshold?: number;
    } = {}
  ): Promise<{
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion';
      message: string;
      line: number;
      column?: number;
      severity: number;
      fixable: boolean;
      suggestedFix?: string;
    }>;
    fixes: Array<{
      description: string;
      confidence: number;
      code: string;
      applied: boolean;
    }>;
    healingReport: {
      totalIssues: number;
      fixedIssues: number;
      successRate: number;
      timeToHeal: number;
    };
  }> {
    
    if (!this.capabilities.selfHealing.enabled) {
      throw new Error('Self-healing is disabled');
    }

    const startTime = Date.now();
    
    // Analyze code for issues
    const analysisTaskId = await this.processingEngine.submitTask({
      type: 'analysis',
      priority: 'high',
      payload: {
        code,
        filePath,
        analysisType: 'comprehensive',
        includeFixSuggestions: true
      }
    });

    const analysisResult = await this.waitForTaskCompletion(analysisTaskId);
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }

    const issues = analysisResult.result.issues || [];
    const fixes: any[] = [];
    let fixedIssues = 0;

    // Apply fixes if auto-fix is enabled
    if (options.autoFix !== false && this.capabilities.selfHealing.autoFix) {
      const confidenceThreshold = options.confidenceThreshold || 
        this.capabilities.selfHealing.confidenceThreshold;

      for (const issue of issues) {
        if (issue.fixable && issue.confidence >= confidenceThreshold) {
          try {
            const fixTaskId = await this.processingEngine.submitTask({
              type: 'code-generation',
              priority: 'high',
              payload: {
                prompt: `Fix this issue: ${issue.message}`,
                code,
                context: { issue, filePath },
                fixMode: true
              }
            });

            const fixResult = await this.waitForTaskCompletion(fixTaskId);
            if (fixResult.success) {
              fixes.push({
                description: issue.message,
                confidence: issue.confidence,
                code: fixResult.result.code,
                applied: true
              });
              fixedIssues++;
            }
          } catch (error) {
            console.warn(`Failed to apply fix for issue: ${issue.message}`, error);
          }
        }
      }
    }

    const healingReport = {
      totalIssues: issues.length,
      fixedIssues,
      successRate: issues.length > 0 ? fixedIssues / issues.length : 1,
      timeToHeal: Date.now() - startTime
    };

    this.emit('self-healing-completed', { issues, fixes, healingReport });
    
    return { issues, fixes, healingReport };
  }

  // Self-Compilation and Deployment
  async deployEvolution(evolution: Evolution): Promise<{
    success: boolean;
    pipeline?: CompilationPipeline;
    error?: string;
  }> {
    try {
      this.emit('deployment-started', evolution);
      
      // Validate evolution safety first
      const safetyResult = await this.safetyValidation.validateEvolutionSafety(evolution);
      
      if (!safetyResult.isValid) {
        return {
          success: false,
          error: `Safety validation failed: ${safetyResult.issues.filter(i => i.blocking).map(i => i.description).join(', ')}`
        };
      }

      // Execute compilation pipeline
      const pipeline = await this.compilationService.executeBuildPipeline(evolution);
      
      this.emit('deployment-completed', { evolution, pipeline });
      
      return {
        success: pipeline.overallSuccess,
        pipeline,
        error: pipeline.overallSuccess ? undefined : 'Compilation pipeline failed'
      };
      
    } catch (error) {
      this.emit('deployment-error', { evolution, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  async createAndDeployBot(requirements: {
    description: string;
    taskType: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    autoDeploy?: boolean;
  }): Promise<{
    bot: AIBot;
    deployment?: CompilationPipeline;
  }> {
    // Create the bot
    const bot = await this.createIntelligentBot(requirements);
    
    if (requirements.autoDeploy) {
      // Create evolution for bot deployment
      const evolution: Evolution = {
        id: `bot-deploy-${bot.id}`,
        type: 'feature',
        description: `Deploy new AI bot: ${bot.name}`,
        affectedFiles: [`bots/${bot.id}/index.ts`],
        codeChanges: [],
        testFiles: [],
        timestamp: new Date(),
        author: 'enhanced-sherlock-system',
        riskLevel: requirements.complexity === 'high' ? 'high' : 'medium'
      };

      const deploymentResult = await this.deployEvolution(evolution);
      
      return {
        bot,
        deployment: deploymentResult.pipeline
      };
    }
    
    return { bot };
  }

  getCompilationStatistics(): ReturnType<SelfCompilationService['getCompilationStatistics']> {
    return this.compilationService.getCompilationStatistics();
  }

  getActivePipelines(): CompilationPipeline[] {
    return this.compilationService.getActivePipelines();
  }

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    return await this.compilationService.cancelPipeline(pipelineId);
  }

  // Automation Rules Management
  addAutomationRule(rule: Omit<AutomationRule, 'id' | 'executionCount'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: AutomationRule = {
      ...rule,
      id,
      executionCount: 0
    };

    this.automationRules.set(id, fullRule);
    this.emit('automation-rule-added', fullRule);
    
    return id;
  }

  removeAutomationRule(ruleId: string): boolean {
    const removed = this.automationRules.delete(ruleId);
    if (removed) {
      this.emit('automation-rule-removed', ruleId);
    }
    return removed;
  }

  async executeAutomationRule(ruleId: string, context?: any): Promise<void> {
    const rule = this.automationRules.get(ruleId);
    if (!rule || !rule.isActive) {
      throw new Error(`Automation rule ${ruleId} not found or inactive`);
    }

    try {
      for (const action of rule.actions) {
        await this.executeAutomationAction(action, context);
      }

      rule.executionCount++;
      rule.lastTriggered = new Date();
      
      this.emit('automation-rule-executed', { rule, context });
      
    } catch (error) {
      this.emit('automation-rule-error', { rule, error, context });
      throw error;
    }
  }

  // System Health and Monitoring
  getSystemHealth$(): Observable<SystemHealth> {
    return this.systemHealth.asObservable();
  }

  getCurrentHealth(): SystemHealth {
    return this.systemHealth.value;
  }

  // Performance Analytics
  getPerformanceAnalytics(): {
    system: SystemHealth;
    processing: ReturnType<AsyncProcessingEngine['getPerformanceMetrics']>;
    bots: Array<{
      bot: AIBot;
      performance: {
        totalRequests: number;
        successRate: number;
        averageResponseTime: number;
        lastUsed?: Date;
      };
    }>;
    models: Array<{
      modelId: string;
      analytics: ReturnType<IntelligentModelRouter['getModelAnalytics']>;
    }>;
  } {
    const bots = Array.from((this.pluginSystem as any).bots.values());
    const botPerformance = bots.map(bot => ({
      bot,
      performance: bot.usage
    }));

    const models = Array.from((this.modelRouter as any).models.keys());
    const modelAnalytics = models.map(modelId => ({
      modelId,
      analytics: this.modelRouter.getModelAnalytics(modelId)
    }));

    return {
      system: this.getCurrentHealth(),
      processing: this.processingEngine.getPerformanceMetrics(),
      bots: botPerformance,
      models: modelAnalytics
    };
  }

  // Private Helper Methods
  private setupEventListeners(): void {
    // Plugin system events
    this.pluginSystem.on('bot-created', (bot) => {
      this.emit('bot-created', bot);
      this.updateSystemHealth();
    });

    this.pluginSystem.on('bot-error', (error) => {
      this.emit('bot-error', error);
      this.updateSystemHealth();
    });

    // Processing engine events
    this.processingEngine.on('task-completed', (result) => {
      this.recordModelPerformance(result);
    });

    this.processingEngine.on('task-failed', (result) => {
      this.recordModelPerformance(result);
      this.updateSystemHealth();
    });
  }

  private initializeDefaultAutomationRules(): void {
    // Auto-fix syntax errors
    this.addAutomationRule({
      name: 'Auto-fix Syntax Errors',
      description: 'Automatically fix syntax errors when detected',
      trigger: {
        type: 'error-detected',
        conditions: { errorType: 'syntax', severity: 'high' }
      },
      actions: [
        {
          type: 'fix-code',
          parameters: { autoApply: true, confidenceThreshold: 0.9 }
        }
      ],
      isActive: this.capabilities.selfHealing.enabled
    });

    // Generate tests for new functions
    this.addAutomationRule({
      name: 'Auto-generate Tests',
      description: 'Generate tests for new functions',
      trigger: {
        type: 'file-change',
        conditions: { changeType: 'function-added' }
      },
      actions: [
        {
          type: 'generate-tests',
          parameters: { framework: 'jest', coverage: 'comprehensive' }
        }
      ],
      isActive: true
    });
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateSystemHealth();
    }, 5000); // Update every 5 seconds
  }

  private startProactiveAssistance(): void {
    // Implement proactive assistance logic
    console.log('🤖 Proactive assistance started');
  }

  private updateSystemHealth(): void {
    const health = this.calculateSystemHealth();
    this.systemHealth.next(health);
  }

  private calculateSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime;
    const processingMetrics = this.processingEngine.getPerformanceMetrics();
    
    const issues: SystemHealth['issues'] = [];
    let status: SystemHealth['status'] = 'healthy';

    // Check processing engine health
    if (processingMetrics.successRate < 0.9) {
      issues.push({
        component: 'processing-engine',
        severity: 'medium',
        message: `Low success rate: ${(processingMetrics.successRate * 100).toFixed(1)}%`,
        timestamp: new Date()
      });
      status = 'degraded';
    }

    // Check response times
    if (processingMetrics.averageProcessingTime > 10000) {
      issues.push({
        component: 'processing-engine',
        severity: 'medium',
        message: `High response times: ${processingMetrics.averageProcessingTime}ms`,
        timestamp: new Date()
      });
      status = 'degraded';
    }

    return {
      status,
      uptime,
      activeComponents: [
        'plugin-system',
        'bot-builder',
        'processing-engine',
        'model-router'
      ],
      issues,
      performance: {
        averageResponseTime: processingMetrics.averageProcessingTime,
        successRate: processingMetrics.successRate,
        throughput: processingMetrics.totalTasksProcessed / (uptime / 1000 / 60), // per minute
        resourceUsage: {
          cpu: 0.3, // Mock values - would be real in production
          memory: 0.4,
          network: 0.2
        }
      }
    };
  }

  private async waitForTaskCompletion(taskId: string, timeout = 30000): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`));
      }, timeout);

      const subscription = this.processingEngine.getResults$().pipe(
        filter(result => result.taskId === taskId)
      ).subscribe(result => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  private generateBotConfigFromAnalysis(
    requirements: any,
    analysis: any
  ): BotBuilderConfig {
    return {
      name: `${requirements.taskType} Assistant`,
      description: requirements.description,
      category: requirements.taskType,
      capabilities: analysis.suggestedCapabilities || [requirements.taskType],
      customPrompts: analysis.suggestedPrompts || {},
      configuration: {
        complexity: requirements.complexity,
        priority: requirements.priority,
        ...requirements.customRequirements
      }
    };
  }

  private async executeAutomationAction(action: any, context?: any): Promise<void> {
    switch (action.type) {
      case 'create-bot':
        await this.createIntelligentBot({
          description: action.parameters.description,
          taskType: action.parameters.taskType,
          complexity: action.parameters.complexity || 'medium',
          priority: action.parameters.priority || 'medium'
        });
        break;
      
      case 'fix-code':
        if (context?.code && context?.filePath) {
          await this.performSelfHealingAnalysis(
            context.code,
            context.filePath,
            action.parameters
          );
        }
        break;
      
      default:
        console.warn(`Unknown automation action type: ${action.type}`);
    }
  }

  private recordModelPerformance(result: ProcessingResult): void {
    // Extract model information from task context if available
    // This would be implemented based on how model information is stored
    console.log('Recording model performance for task:', result.taskId);
  }

  private getInitialHealth(): SystemHealth {
    return {
      status: 'healthy',
      uptime: 0,
      activeComponents: [],
      issues: [],
      performance: {
        averageResponseTime: 0,
        successRate: 1,
        throughput: 0,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          network: 0
        }
      }
    };
  }

  // Cleanup
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Enhanced Sherlock Ω System...');
    
    this.processingEngine.shutdown();
    this.removeAllListeners();
    
    console.log('✅ System shutdown complete');
  }
}