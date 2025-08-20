/**
 * Bot Manager - Orchestrates Self-Building Bots
 * Manages bot lifecycle, replication, and feature construction
 */

import { SelfBuildingBot, ConstructionTask } from './self-building-bot';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

export interface BotColony {
  bots: Map<string, SelfBuildingBot>;
  totalGenerations: number;
  totalFeatures: number;
  quantumAdvantage: number;
}

export class BotManager {
  private logger: Logger;
  private colony: BotColony;
  private taskQueue: ConstructionTask[] = [];
  private isActive: boolean = false;

  constructor() {
    this.logger = new Logger(PlatformType.NODE);
    this.colony = {
      bots: new Map(),
      totalGenerations: 0,
      totalFeatures: 0,
      quantumAdvantage: 1.97
    };
    
    this.logger.info('🏭 Bot Manager initialized - ready for autonomous construction');
  }

  /**
   * Initialize the bot colony with a genesis bot
   */
  async initializeColony(): Promise<void> {
    this.logger.info('🌱 Initializing bot colony with genesis bot...');
    
    try {
      const genesisBot = new SelfBuildingBot('genesis-bot-001');
      this.colony.bots.set(genesisBot.getStatus().botId, genesisBot);
      
      this.logger.info(`✅ Genesis bot ${genesisBot.getStatus().botId} created`);
      this.logger.info(`🤖 Colony initialized with ${this.colony.bots.size} bot(s)`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize bot colony:', {}, error as Error);
      throw error;
    }
  }

  /**
   * Start autonomous bot operations
   */
  async startAutonomousOperations(): Promise<void> {
    if (this.isActive) {
      this.logger.warn('⚠️ Autonomous operations already active');
      return;
    }

    this.isActive = true;
    this.logger.info('🚀 Starting autonomous bot operations...');

    // Start the main operation loop
    this.autonomousLoop();
  }

  /**
   * Stop autonomous operations
   */
  stopAutonomousOperations(): void {
    this.isActive = false;
    this.logger.info('🛑 Autonomous operations stopped');
  }

  /**
   * Add a construction task to the queue
   */
  addConstructionTask(task: ConstructionTask): void {
    this.taskQueue.push(task);
    this.logger.info(`📋 Task added to queue: ${task.description} (Priority: ${task.priority})`);
    
    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Trigger bot replication
   */
  async replicateBot(botId: string): Promise<boolean> {
    const bot = this.colony.bots.get(botId);
    if (!bot) {
      this.logger.error(`❌ Bot ${botId} not found for replication`);
      return false;
    }

    try {
      const replica = await bot.replicate();
      this.colony.bots.set(replica.getStatus().botId, replica);
      this.colony.totalGenerations++;
      
      this.logger.info(`✅ Bot replicated: ${replica.getStatus().botId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`❌ Replication failed for bot ${botId}:`, {}, error as Error);
      return false;
    }
  }

  /**
   * Get colony status
   */
  getColonyStatus(): any {
    const botStatuses = Array.from(this.colony.bots.values()).map(bot => bot.getStatus());
    
    return {
      isActive: this.isActive,
      totalBots: this.colony.bots.size,
      totalGenerations: this.colony.totalGenerations,
      totalFeatures: this.colony.totalFeatures,
      quantumAdvantage: this.colony.quantumAdvantage,
      queuedTasks: this.taskQueue.length,
      bots: botStatuses,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Main autonomous operation loop
   */
  private async autonomousLoop(): Promise<void> {
    while (this.isActive) {
      try {
        await this.processTaskQueue();
        await this.considerReplication();
        await this.evolveColony();
        
        // Wait before next cycle
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        this.logger.error('❌ Error in autonomous loop:', {}, error as Error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Longer wait on error
      }
    }
  }

  /**
   * Process pending construction tasks
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    const task = this.taskQueue.shift()!;
    this.logger.info(`🔨 Processing task: ${task.description}`);

    // Find available bot for the task
    const availableBot = this.findBestBotForTask(task);
    if (!availableBot) {
      this.logger.warn(`⚠️ No available bot for task ${task.id} - requeuing`);
      this.taskQueue.push(task);
      return;
    }

    // Execute the task
    const success = await availableBot.constructFeature(task);
    if (success) {
      this.colony.totalFeatures++;
      this.logger.info(`✅ Task completed: ${task.description}`);
    } else {
      this.logger.warn(`⚠️ Task failed: ${task.description} - will retry later`);
      // Requeue with lower priority
      task.priority = task.priority === 'critical' ? 'high' : 
                     task.priority === 'high' ? 'medium' : 'low';
      this.taskQueue.push(task);
    }
  }

  /**
   * Consider if replication is needed
   */
  private async considerReplication(): Promise<void> {
    const colonySize = this.colony.bots.size;
    const queueSize = this.taskQueue.length;
    
    // Replicate if queue is growing and we have capacity
    if (queueSize > colonySize * 2 && colonySize < 5) {
      const genesisBot = Array.from(this.colony.bots.values())[0];
      if (genesisBot) {
        this.logger.info('🔄 Colony expansion needed - triggering replication');
        await this.replicateBot(genesisBot.getStatus().botId);
      }
    }
  }

  /**
   * Evolve the entire colony
   */
  private async evolveColony(): Promise<void> {
    // Periodically evolve all bots
    if (Math.random() < 0.1) { // 10% chance per cycle
      this.logger.info('🧬 Initiating colony-wide evolution...');
      
      const evolutionPromises = Array.from(this.colony.bots.values()).map(bot => 
        bot.evolve().catch(error => 
          this.logger.warn(`Evolution failed for bot ${bot.getStatus().botId}:`, {}, error as Error)
        )
      );
      
      await Promise.all(evolutionPromises);
      this.logger.info('✨ Colony evolution cycle completed');
    }
  }

  /**
   * Find the best bot for a given task
   */
  private findBestBotForTask(task: ConstructionTask): SelfBuildingBot | null {
    const availableBots = Array.from(this.colony.bots.values());
    
    if (availableBots.length === 0) return null;
    
    // For now, return the first available bot
    // In the future, could implement more sophisticated selection
    return availableBots[0];
  }

  /**
   * Create sample construction tasks for testing
   */
  createSampleTasks(): void {
    const sampleTasks: ConstructionTask[] = [
      {
        id: 'quantum-file-reader',
        description: 'Build quantum-optimized file reader with 2x performance',
        priority: 'high',
        estimatedComplexity: 0.7,
        requiredCapabilities: ['construction', 'quantumOptimization']
      },
      {
        id: 'auto-test-generator',
        description: 'Create automatic test generator for 95%+ coverage',
        priority: 'medium',
        estimatedComplexity: 0.8,
        requiredCapabilities: ['testGeneration', 'construction']
      },
      {
        id: 'performance-optimizer',
        description: 'Build performance optimization engine',
        priority: 'high',
        estimatedComplexity: 0.9,
        requiredCapabilities: ['quantumOptimization', 'construction']
      }
    ];

    sampleTasks.forEach(task => this.addConstructionTask(task));
    this.logger.info(`📋 Added ${sampleTasks.length} sample construction tasks`);
  }
}

export default BotManager;