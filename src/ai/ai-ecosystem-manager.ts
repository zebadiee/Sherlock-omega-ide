/**
 * 🌟 SHERLOCK Ω AI ECOSYSTEM MANAGER
 * 
 * Central orchestrator for the unified AI ecosystem
 * Manages self-building bots, HuggingFace models, and OpenRouter routing
 * Provides enterprise-grade management, monitoring, and optimization
 */

import { UnifiedAIEcosystem, UnifiedAIConfig, EcosystemTask } from './unified-ai-ecosystem';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';
import { PerformanceMonitor } from '../monitoring/performance-monitor';

export interface EcosystemManagerConfig {
  autoStart: boolean;
  enableTelemetry: boolean;
  maxConcurrentTasks: number;
  healthCheckInterval: number; // minutes
  costAlertThreshold: number; // dollars per hour
  performanceTargets: {
    minSuccessRate: number;
    maxAvgResponseTime: number; // milliseconds
    maxCostPerTask: number;
  };
}

export interface EcosystemMetrics {
  uptime: number; // milliseconds
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalCost: number;
  avgCostPerTask: number;
  avgResponseTime: number;
  activeBots: number;
  discoveredModels: number;
  healthScore: number; // 0-1
  performanceScore: number; // 0-1
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
  estimatedComplexity: number;
  requiredCapabilities: string[];
  maxCost: number;
  template: string;
}

export class AIEcosystemManager {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private config: EcosystemManagerConfig;
  private ecosystem: UnifiedAIEcosystem | null = null;
  private startTime: Date;
  private metrics: EcosystemMetrics;
  private taskTemplates: Map<string, TaskTemplate> = new Map();
  private alertHandlers: Map<string, Function> = new Map();
  private isInitialized = false;

  constructor(config: EcosystemManagerConfig) {
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(this.logger);
    this.config = config;
    this.startTime = new Date();
    
    this.metrics = {
      uptime: 0,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalCost: 0,
      avgCostPerTask: 0,
      avgResponseTime: 0,
      activeBots: 0,
      discoveredModels: 0,
      healthScore: 1.0,
      performanceScore: 1.0
    };

    this.initializeTaskTemplates();
    this.setupAlertHandlers();
    
    this.logger.info('🌟 AI Ecosystem Manager initialized');
  }

  /**
   * 🚀 INITIALIZE ECOSYSTEM
   * Initialize the unified AI ecosystem with configuration
   */
  async initializeEcosystem(ecosystemConfig: UnifiedAIConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('⚠️ Ecosystem already initialized');
      return;
    }

    this.logger.info('🔄 Initializing AI Ecosystem...');

    try {
      // Create the unified ecosystem
      this.ecosystem = new UnifiedAIEcosystem(ecosystemConfig);
      
      // Initialize the ecosystem
      await this.ecosystem.initialize();
      
      // Start monitoring and management services
      this.startMonitoring();
      this.startAutomaticOptimization();
      
      if (this.config.autoStart) {
        await this.startEcosystemOperations();
      }
      
      this.isInitialized = true;
      this.logger.info('✅ AI Ecosystem fully initialized and operational');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize ecosystem:', {}, error as Error);
      throw error;
    }
  }

  /**
   * 🎯 TASK MANAGEMENT
   * High-level task management interface
   */
  async submitTask(taskData: {
    type: 'self-improvement' | 'feature-construction' | 'model-discovery' | 'capability-assessment';
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    maxCost?: number;
    deadline?: Date;
    metadata?: Record<string, any>;
  }): Promise<string> {
    if (!this.ecosystem) {
      throw new Error('Ecosystem not initialized');
    }

    const task: EcosystemTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskData.type,
      description: taskData.description,
      priority: taskData.priority || 'medium',
      requiredCapabilities: this.inferRequiredCapabilities(taskData.type, taskData.description),
      maxCost: taskData.maxCost || 0.1,
      deadline: taskData.deadline,
      metadata: taskData.metadata || {}
    };

    // Submit to ecosystem
    const taskId = await (this.ecosystem as any).submitTask(task);
    
    this.metrics.totalTasks++;
    this.logger.info(`📋 Task submitted: ${taskId} (${task.type})`);
    
    return taskId;
  }

  /**
   * 📊 ECOSYSTEM MONITORING
   * Get comprehensive ecosystem status and metrics
   */
  getEcosystemStatus(): {
    manager: {
      isInitialized: boolean;
      uptime: string;
      config: EcosystemManagerConfig;
    };
    ecosystem: any;
    metrics: EcosystemMetrics;
    alerts: string[];
    recommendations: string[];
  } {
    const uptime = Date.now() - this.startTime.getTime();
    const alerts = this.generateAlerts();
    const recommendations = this.generateRecommendations();

    return {
      manager: {
        isInitialized: this.isInitialized,
        uptime: this.formatUptime(uptime),
        config: this.config
      },
      ecosystem: this.ecosystem ? this.ecosystem.getEcosystemStatus() : null,
      metrics: {
        ...this.metrics,
        uptime
      },
      alerts,
      recommendations
    };
  }

  /**
   * 🤖 BOT MANAGEMENT
   * Manage self-building bots
   */
  async createSpecializedBot(specialization: string, config?: any): Promise<string> {
    if (!this.ecosystem) {
      throw new Error('Ecosystem not initialized');
    }

    const botId = await this.ecosystem.createEnhancedSelfBuildingBot({
      specialization,
      ...config
    });

    this.metrics.activeBots++;
    this.logger.info(`🤖 Specialized bot created: ${botId} (${specialization})`);
    
    return botId;
  }

  /**
   * 🔍 MODEL DISCOVERY
   * Discover and assess new AI models
   */
  async discoverModels(criteria?: {
    minDownloads?: number;
    preferredLicenses?: string[];
    maxModelSize?: string;
    taskType?: string;
  }): Promise<any[]> {
    if (!this.ecosystem) {
      throw new Error('Ecosystem not initialized');
    }

    this.logger.info('🔍 Starting model discovery...');
    
    const models = await this.ecosystem.discoverAndAssessModels();
    
    // Filter based on criteria
    let filteredModels = models;
    if (criteria) {
      filteredModels = this.filterModelsByCriteria(models, criteria);
    }

    this.metrics.discoveredModels = models.length;
    this.logger.info(`📊 Discovered ${models.length} models, ${filteredModels.length} match criteria`);
    
    return filteredModels;
  }

  /**
   * 💰 COST OPTIMIZATION
   * Optimize ecosystem costs
   */
  async optimizeCosts(): Promise<{
    currentCost: number;
    projectedSavings: number;
    recommendations: string[];
    actions: string[];
  }> {
    this.logger.info('💰 Running cost optimization analysis...');
    
    const currentCost = this.metrics.totalCost;
    const recommendations: string[] = [];
    const actions: string[] = [];
    
    // Analyze cost patterns
    if (this.metrics.avgCostPerTask > this.config.performanceTargets.maxCostPerTask) {
      recommendations.push('Switch to more cost-effective models for routine tasks');
      actions.push('rebalance-model-preferences');
    }
    
    if (this.metrics.activeBots > 10) {
      recommendations.push('Consider consolidating underutilized bots');
      actions.push('consolidate-bots');
    }
    
    const projectedSavings = this.calculateProjectedSavings(recommendations);
    
    return {
      currentCost,
      projectedSavings,
      recommendations,
      actions
    };
  }

  /**
   * 📈 PERFORMANCE OPTIMIZATION
   * Optimize ecosystem performance
   */
  async optimizePerformance(): Promise<{
    currentPerformance: number;
    bottlenecks: string[];
    optimizations: string[];
    projectedImprovement: number;
  }> {
    this.logger.info('📈 Running performance optimization...');
    
    const bottlenecks: string[] = [];
    const optimizations: string[] = [];
    
    // Identify bottlenecks
    if (this.metrics.avgResponseTime > this.config.performanceTargets.maxAvgResponseTime) {
      bottlenecks.push('High average response time');
      optimizations.push('Route tasks to faster models');
    }
    
    if (this.metrics.successfulTasks / this.metrics.totalTasks < this.config.performanceTargets.minSuccessRate) {
      bottlenecks.push('Low success rate');
      optimizations.push('Improve model selection algorithms');
    }
    
    const projectedImprovement = this.calculateProjectedImprovement(optimizations);
    
    return {
      currentPerformance: this.metrics.performanceScore,
      bottlenecks,
      optimizations,
      projectedImprovement
    };
  }

  /**
   * 🔧 ECOSYSTEM CONFIGURATION
   * Update ecosystem configuration
   */
  async updateConfiguration(updates: Partial<EcosystemManagerConfig>): Promise<void> {
    this.logger.info('🔧 Updating ecosystem configuration...');
    
    Object.assign(this.config, updates);
    
    // Restart monitoring with new configuration
    this.startMonitoring();
    
    this.logger.info('✅ Configuration updated successfully');
  }

  /**
   * 🛠️ TASK TEMPLATES
   * Manage task templates for common operations
   */
  getTaskTemplates(): TaskTemplate[] {
    return Array.from(this.taskTemplates.values());
  }

  async executeTemplate(templateId: string, parameters: Record<string, any>): Promise<string> {
    const template = this.taskTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const description = this.populateTemplate(template.template, parameters);
    
    return this.submitTask({
      type: 'feature-construction',
      description,
      priority: template.defaultPriority,
      maxCost: template.maxCost,
      metadata: { templateId, parameters }
    });
  }

  /**
   * 🚨 ALERT MANAGEMENT
   * Manage alerts and notifications
   */
  onAlert(alertType: string, handler: Function): void {
    this.alertHandlers.set(alertType, handler);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private startMonitoring(): void {
    const interval = this.config.healthCheckInterval * 60 * 1000;
    
    setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, interval);

    this.logger.info(`📊 Monitoring started (${this.config.healthCheckInterval}min intervals)`);
  }

  private startAutomaticOptimization(): void {
    // Run optimization every hour
    setInterval(async () => {
      await this.runAutomaticOptimization();
    }, 60 * 60 * 1000);

    this.logger.info('🔄 Automatic optimization started');
  }

  private async startEcosystemOperations(): Promise<void> {
    if (!this.ecosystem) return;
    
    this.logger.info('🚀 Starting ecosystem operations...');
    
    // Submit initial discovery tasks
    await this.submitTask({
      type: 'model-discovery',
      description: 'Discover and assess available AI models',
      priority: 'high'
    });

    // Create specialized bots
    await this.createSpecializedBot('code-generation');
    await this.createSpecializedBot('reasoning');
    await this.createSpecializedBot('optimization');
  }

  private updateMetrics(): void {
    if (!this.ecosystem) return;

    const ecosystemStatus = this.ecosystem.getEcosystemStatus();
    
    this.metrics.activeBots = ecosystemStatus.activeBots.length;
    this.metrics.discoveredModels = ecosystemStatus.discoveredModels;
    this.metrics.healthScore = ecosystemStatus.healthScore;
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    
    // Calculate derived metrics
    this.metrics.avgCostPerTask = this.metrics.totalTasks > 0 ? 
      this.metrics.totalCost / this.metrics.totalTasks : 0;
    
    this.metrics.performanceScore = this.calculatePerformanceScore();
  }

  private checkAlerts(): void {
    const alerts = this.generateAlerts();
    
    alerts.forEach(alert => {
      const handler = this.alertHandlers.get('general') || this.alertHandlers.get(alert);
      if (handler) {
        handler(alert);
      }
    });
  }

  private generateAlerts(): string[] {
    const alerts: string[] = [];
    
    if (this.metrics.healthScore < 0.7) {
      alerts.push('Low ecosystem health score');
    }
    
    if (this.metrics.avgCostPerTask > this.config.performanceTargets.maxCostPerTask) {
      alerts.push('High average cost per task');
    }
    
    if (this.metrics.totalCost > this.config.costAlertThreshold) {
      alerts.push('Cost threshold exceeded');
    }
    
    return alerts;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.activeBots < 3) {
      recommendations.push('Consider creating more specialized bots');
    }
    
    if (this.metrics.discoveredModels < 20) {
      recommendations.push('Run model discovery to find more AI models');
    }
    
    if (this.metrics.performanceScore < 0.8) {
      recommendations.push('Run performance optimization analysis');
    }
    
    return recommendations;
  }

  private async runAutomaticOptimization(): Promise<void> {
    this.logger.info('🔄 Running automatic optimization...');
    
    // Cost optimization
    if (this.metrics.avgCostPerTask > this.config.performanceTargets.maxCostPerTask) {
      await this.optimizeCosts();
    }
    
    // Performance optimization
    if (this.metrics.performanceScore < 0.8) {
      await this.optimizePerformance();
    }
  }

  private initializeTaskTemplates(): void {
    const templates: TaskTemplate[] = [
      {
        id: 'code-generation',
        name: 'Code Generation',
        description: 'Generate production-ready code',
        defaultPriority: 'medium',
        estimatedComplexity: 0.6,
        requiredCapabilities: ['code-generation'],
        maxCost: 0.05,
        template: 'Generate {{language}} code for: {{requirement}}. Include error handling and tests.'
      },
      {
        id: 'bug-fix',
        name: 'Bug Fix',
        description: 'Fix bugs in existing code',
        defaultPriority: 'high',
        estimatedComplexity: 0.4,
        requiredCapabilities: ['debugging', 'code-generation'],
        maxCost: 0.03,
        template: 'Fix the bug in this {{language}} code: {{code}}. The error is: {{error}}'
      },
      {
        id: 'optimization',
        name: 'Code Optimization',
        description: 'Optimize code performance',
        defaultPriority: 'low',
        estimatedComplexity: 0.5,
        requiredCapabilities: ['optimization', 'reasoning'],
        maxCost: 0.04,
        template: 'Optimize this {{language}} code for {{metric}}: {{code}}'
      }
    ];

    templates.forEach(template => {
      this.taskTemplates.set(template.id, template);
    });
  }

  private setupAlertHandlers(): void {
    this.onAlert('general', (alert: string) => {
      this.logger.warn(`🚨 Alert: ${alert}`);
    });
  }

  private inferRequiredCapabilities(type: string, description: string): string[] {
    const capabilities: string[] = [];
    
    if (type === 'feature-construction' || description.toLowerCase().includes('code')) {
      capabilities.push('code-generation');
    }
    
    if (description.toLowerCase().includes('debug') || description.toLowerCase().includes('fix')) {
      capabilities.push('debugging');
    }
    
    if (description.toLowerCase().includes('optimize') || description.toLowerCase().includes('improve')) {
      capabilities.push('optimization');
    }
    
    if (description.toLowerCase().includes('analyze') || description.toLowerCase().includes('reason')) {
      capabilities.push('reasoning');
    }
    
    return capabilities.length > 0 ? capabilities : ['general'];
  }

  private filterModelsByCriteria(models: any[], criteria: any): any[] {
    return models.filter(model => {
      if (criteria.minDownloads && model.downloads < criteria.minDownloads) {
        return false;
      }
      
      if (criteria.preferredLicenses && !criteria.preferredLicenses.includes(model.license)) {
        return false;
      }
      
      return true;
    });
  }

  private calculateProjectedSavings(recommendations: string[]): number {
    // Estimate savings based on recommendations
    let savings = 0;
    
    recommendations.forEach(rec => {
      if (rec.includes('cost-effective')) savings += this.metrics.totalCost * 0.2;
      if (rec.includes('consolidating')) savings += this.metrics.totalCost * 0.1;
    });
    
    return savings;
  }

  private calculateProjectedImprovement(optimizations: string[]): number {
    // Estimate performance improvement
    return optimizations.length * 0.1; // 10% improvement per optimization
  }

  private calculatePerformanceScore(): number {
    const successRate = this.metrics.totalTasks > 0 ? 
      this.metrics.successfulTasks / this.metrics.totalTasks : 1;
    
    const costEfficiency = this.metrics.avgCostPerTask <= this.config.performanceTargets.maxCostPerTask ? 1 : 0.5;
    
    const responseTimeScore = this.metrics.avgResponseTime <= this.config.performanceTargets.maxAvgResponseTime ? 1 : 0.5;
    
    return (successRate + costEfficiency + responseTimeScore) / 3;
  }

  private formatUptime(uptime: number): string {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  private populateTemplate(template: string, parameters: Record<string, any>): string {
    let result = template;
    Object.entries(parameters).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    return result;
  }
}

/**
 * Default ecosystem manager configuration
 */
export const DEFAULT_ECOSYSTEM_CONFIG: EcosystemManagerConfig = {
  autoStart: true,
  enableTelemetry: true,
  maxConcurrentTasks: 10,
  healthCheckInterval: 5, // minutes
  costAlertThreshold: 10, // dollars per hour
  performanceTargets: {
    minSuccessRate: 0.8,
    maxAvgResponseTime: 5000, // milliseconds
    maxCostPerTask: 0.1
  }
};

export default AIEcosystemManager;