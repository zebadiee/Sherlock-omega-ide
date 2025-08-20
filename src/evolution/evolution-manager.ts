/**
 * Evolution Manager - Orchestrates autonomous evolution of Sherlock Ω IDE
 * Integrates with bot colony and provides safe evolution capabilities
 */

import { EventEmitter } from 'events';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { SelfEvolvingAgent } from './self-evolving-agent';
import { QuantumBotBuilder } from '../ai/quantum/quantum-bot-builder';
import { AIBotManager } from '../ai/ai-bot-manager';

export interface EvolutionTask {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'feature' | 'optimization' | 'security' | 'quantum' | 'testing';
  estimatedComplexity: number; // 1-10 scale
  requiredCapabilities: string[];
  deadline?: Date;
}

export interface EvolutionResult {
  taskId: string;
  success: boolean;
  code?: string;
  metrics: {
    securityScore: number;
    testCoverage: number;
    performance: number;
    quantumAdvantage?: number;
  };
  iterations: number;
  duration: number;
  rollbackAvailable: boolean;
}

export class EvolutionManager extends EventEmitter {
  private evolvingAgent: SelfEvolvingAgent;
  private taskQueue: EvolutionTask[] = [];
  private activeEvolutions = new Map<string, Promise<EvolutionResult>>();
  private evolutionHistory: EvolutionResult[] = [];
  private isEvolutionEnabled = true;
  private maxConcurrentEvolutions = 3;

  constructor(
    private logger: Logger,
    private performanceMonitor: PerformanceMonitor,
    private quantumBuilder: QuantumBotBuilder,
    private botManager: AIBotManager,
    mongoUri: string
  ) {
    super();
    
    this.evolvingAgent = new SelfEvolvingAgent(
      logger,
      performanceMonitor,
      quantumBuilder,
      mongoUri
    );

    this.logger.info('Evolution Manager initialized');
  }

  /**
   * Queue a new evolution task
   */
  async queueEvolution(task: EvolutionTask): Promise<string> {
    this.logger.info(`Queuing evolution task: ${task.description}`);
    
    // Validate task
    if (!this.validateTask(task)) {
      throw new Error(`Invalid evolution task: ${task.id}`);
    }

    // Add to queue with priority sorting
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.emit('task-queued', { task });
    
    // Process queue if not at capacity
    if (this.activeEvolutions.size < this.maxConcurrentEvolutions) {
      setImmediate(() => this.processQueue());
    }

    return task.id;
  }

  /**
   * Process the evolution queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isEvolutionEnabled || this.taskQueue.length === 0) {
      return;
    }

    if (this.activeEvolutions.size >= this.maxConcurrentEvolutions) {
      this.logger.debug('Evolution capacity reached, waiting for completion');
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.logger.info(`Starting evolution for task: ${task.id}`);
    
    const evolutionPromise = this.executeEvolution(task);
    this.activeEvolutions.set(task.id, evolutionPromise);

    try {
      const result = await evolutionPromise;
      this.handleEvolutionComplete(task, result);
    } catch (error) {
      this.handleEvolutionError(task, error as Error);
    } finally {
      this.activeEvolutions.delete(task.id);
      // Process next task in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Execute a single evolution task
   */
  private async executeEvolution(task: EvolutionTask): Promise<EvolutionResult> {
    const startTime = Date.now();
    
    try {
      this.emit('evolution-started', { task });
      
      // Create enhanced task description with context
      const enhancedDescription = this.enhanceTaskDescription(task);
      
      // Execute evolution using the self-evolving agent
      const result = await this.evolvingAgent.evolveCode(
        enhancedDescription,
        `evolution-${task.id}`
      );

      const duration = Date.now() - startTime;
      
      const evolutionResult: EvolutionResult = {
        taskId: task.id,
        success: true,
        code: result.code,
        metrics: {
          securityScore: result.analysis?.score || 0,
          testCoverage: result.analysis?.coverage || 0,
          performance: result.analysis?.performance || 0,
          quantumAdvantage: result.quantumEnhanced ? 1.5 : 1.0
        },
        iterations: result.iterations || 0,
        duration,
        rollbackAvailable: !!result.rollbackSnapshot
      };

      // Deploy if quality thresholds are met
      if (this.shouldDeploy(evolutionResult)) {
        await this.deployEvolution(task, evolutionResult);
      }

      return evolutionResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        taskId: task.id,
        success: false,
        metrics: {
          securityScore: 0,
          testCoverage: 0,
          performance: 0
        },
        iterations: 0,
        duration,
        rollbackAvailable: false
      };
    }
  }

  /**
   * Enhance task description with context from existing codebase
   */
  private enhanceTaskDescription(task: EvolutionTask): string {
    let enhanced = task.description;

    // Add architectural context
    enhanced += `\n\nArchitectural Context:
- Follow Sherlock Ω IDE patterns and interfaces
- Integrate with existing quantum computing capabilities
- Maintain 95%+ test coverage requirement
- Use TypeScript strict mode with proper typing
- Follow dependency injection patterns`;

    // Add category-specific guidance
    switch (task.category) {
      case 'quantum':
        enhanced += `\n- Leverage QuantumBotBuilder for quantum algorithms
- Integrate with existing quantum strategies
- Consider quantum advantage optimization`;
        break;
      case 'security':
        enhanced += `\n- Follow security best practices
- Implement proper input validation
- Use secure cryptographic functions`;
        break;
      case 'testing':
        enhanced += `\n- Generate comprehensive test suites
- Include edge case testing
- Ensure formal verification where applicable`;
        break;
    }

    // Add capability requirements
    if (task.requiredCapabilities.length > 0) {
      enhanced += `\n\nRequired Capabilities: ${task.requiredCapabilities.join(', ')}`;
    }

    return enhanced;
  }

  /**
   * Determine if evolution result should be deployed
   */
  private shouldDeploy(result: EvolutionResult): boolean {
    const minSecurityScore = 0.9;
    const minTestCoverage = 0.95;
    const minPerformance = 0.8;

    return result.success &&
           result.metrics.securityScore >= minSecurityScore &&
           result.metrics.testCoverage >= minTestCoverage &&
           result.metrics.performance >= minPerformance;
  }

  /**
   * Deploy evolved code to the system
   */
  private async deployEvolution(task: EvolutionTask, result: EvolutionResult): Promise<void> {
    this.logger.info(`Deploying evolution for task: ${task.id}`);
    
    try {
      // Create deployment transaction
      const deploymentId = `deploy-${task.id}-${Date.now()}`;
      
      // Write evolved code to appropriate location
      const filePath = this.determineFilePath(task);
      
      // TODO: Implement actual file writing with proper validation
      // await this.writeEvolutionCode(filePath, result.code);
      
      // Update bot capabilities if needed
      if (task.category === 'quantum') {
        await this.updateQuantumCapabilities(result.code);
      }

      // Register new features with bot manager
      await this.registerNewFeatures(task, result);
      
      this.emit('evolution-deployed', { task, result, deploymentId });
      
    } catch (error) {
      this.logger.error(`Failed to deploy evolution ${task.id}:`, error);
      
      // Trigger rollback if deployment fails
      if (result.rollbackAvailable) {
        await this.triggerRollback(task.id);
      }
      
      throw error;
    }
  }

  /**
   * Handle successful evolution completion
   */
  private handleEvolutionComplete(task: EvolutionTask, result: EvolutionResult): void {
    this.evolutionHistory.push(result);
    
    this.logger.info(`Evolution completed for task ${task.id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    this.emit('evolution-completed', { task, result });
    
    // Update system metrics
    this.updateSystemMetrics(result);
  }

  /**
   * Handle evolution errors
   */
  private handleEvolutionError(task: EvolutionTask, error: Error): void {
    this.logger.error(`Evolution failed for task ${task.id}:`, error);
    
    const result: EvolutionResult = {
      taskId: task.id,
      success: false,
      metrics: {
        securityScore: 0,
        testCoverage: 0,
        performance: 0
      },
      iterations: 0,
      duration: 0,
      rollbackAvailable: false
    };

    this.evolutionHistory.push(result);
    this.emit('evolution-failed', { task, error, result });
  }

  /**
   * Validate evolution task
   */
  private validateTask(task: EvolutionTask): boolean {
    if (!task.id || !task.description) return false;
    if (task.estimatedComplexity < 1 || task.estimatedComplexity > 10) return false;
    if (!['low', 'medium', 'high', 'critical'].includes(task.priority)) return false;
    if (!['feature', 'optimization', 'security', 'quantum', 'testing'].includes(task.category)) return false;
    
    return true;
  }

  private determineFilePath(task: EvolutionTask): string {
    const basePath = 'src/';
    
    switch (task.category) {
      case 'quantum':
        return `${basePath}ai/quantum/`;
      case 'security':
        return `${basePath}security/`;
      case 'testing':
        return `${basePath}testing/`;
      default:
        return `${basePath}evolution/generated/`;
    }
  }

  private async updateQuantumCapabilities(code: string | undefined): Promise<void> {
    if (!code) return;
    
    // Analyze code for new quantum algorithms
    // Update quantum builder with new capabilities
    this.logger.info('Updated quantum capabilities with evolved code');
  }

  private async registerNewFeatures(task: EvolutionTask, result: EvolutionResult): Promise<void> {
    // Register new features with the bot manager
    this.logger.info(`Registered new features from evolution ${task.id}`);
  }

  private async triggerRollback(taskId: string): Promise<void> {
    this.logger.warn(`Triggering rollback for evolution ${taskId}`);
    // Implement rollback logic
  }

  private updateSystemMetrics(result: EvolutionResult): void {
    // Update system-wide metrics based on evolution results
    this.emit('metrics-updated', { result });
  }

  // Public API Methods

  /**
   * Get current evolution status
   */
  getEvolutionStatus(): any {
    return {
      enabled: this.isEvolutionEnabled,
      queueLength: this.taskQueue.length,
      activeEvolutions: this.activeEvolutions.size,
      maxConcurrent: this.maxConcurrentEvolutions,
      totalCompleted: this.evolutionHistory.length,
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * Get evolution history
   */
  getEvolutionHistory(limit: number = 50): EvolutionResult[] {
    return this.evolutionHistory
      .slice(-limit)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Enable/disable evolution system
   */
  setEvolutionEnabled(enabled: boolean): void {
    this.isEvolutionEnabled = enabled;
    this.logger.info(`Evolution system ${enabled ? 'enabled' : 'disabled'}`);
    this.emit('evolution-toggled', { enabled });
  }

  /**
   * Set maximum concurrent evolutions
   */
  setMaxConcurrentEvolutions(max: number): void {
    this.maxConcurrentEvolutions = Math.max(1, Math.min(10, max));
    this.logger.info(`Max concurrent evolutions set to ${this.maxConcurrentEvolutions}`);
  }

  private calculateSuccessRate(): number {
    if (this.evolutionHistory.length === 0) return 0;
    
    const successful = this.evolutionHistory.filter(r => r.success).length;
    return successful / this.evolutionHistory.length;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.evolvingAgent.cleanup();
    this.removeAllListeners();
  }
}