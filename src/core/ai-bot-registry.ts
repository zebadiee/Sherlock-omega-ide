import { EventEmitter } from 'events';
import { Observable, BehaviorSubject } from 'rxjs';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BotCapability {
  id: string;
  name: string;
  description: string;
  category: 'code-generation' | 'testing' | 'debugging' | 'documentation' | 'analysis' | 'deployment' | 'monitoring' | 'custom';
  inputTypes: string[];
  outputTypes: string[];
  dependencies: string[];
  complexity: 'low' | 'medium' | 'high';
  reliability: number; // 0-1 score
  performance: {
    averageResponseTime: number;
    successRate: number;
    resourceUsage: 'low' | 'medium' | 'high';
  };
  examples: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface BotMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  status: 'active' | 'inactive' | 'deprecated' | 'development';
  visibility: 'public' | 'private' | 'team';
  
  // Technical specs
  capabilities: BotCapability[];
  requirements: {
    memory: string;
    cpu: string;
    storage: string;
    network: boolean;
  };
  
  // Usage stats
  usage: {
    totalInvocations: number;
    successfulInvocations: number;
    averageResponseTime: number;
    lastUsed?: Date;
    popularityScore: number;
  };
  
  // Configuration
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    retries: number;
  };
  
  // Documentation
  documentation: {
    readme: string;
    examples: string;
    changelog: string;
    troubleshooting: string;
  };
}

export interface BotSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status?: string;
  minReliability?: number;
  complexity?: string;
  sortBy?: 'name' | 'popularity' | 'created' | 'updated' | 'reliability';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface BotSearchResult {
  bots: BotMetadata[];
  total: number;
  facets: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    authors: Record<string, number>;
    complexities: Record<string, number>;
  };
}

/**
 * AIBotRegistry - Centralized catalog and management system for AI bots
 */
export class AIBotRegistry extends EventEmitter {
  private bots = new Map<string, BotMetadata>();
  private capabilities = new Map<string, BotCapability>();
  private botsSubject = new BehaviorSubject<BotMetadata[]>([]);
  
  private registryPath: string;
  private isInitialized = false;

  constructor(registryPath = './data/bot-registry') {
    super();
    this.registryPath = registryPath;
  }

  /**
   * Initialize the registry and load existing bots
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.registryPath, { recursive: true });
      await this.loadBotsFromDisk();
      this.isInitialized = true;
      
      console.log('🗂️ AI Bot Registry initialized', {
        totalBots: this.bots.size,
        totalCapabilities: this.capabilities.size
      });
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize bot registry:', error);
      throw error;
    }
  }

  /**
   * Register a new bot in the catalog
   */
  async registerBot(botData: Omit<BotMetadata, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<BotMetadata> {
    const bot: BotMetadata = {
      ...botData,
      id: this.generateBotId(botData.name),
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        totalInvocations: 0,
        successfulInvocations: 0,
        averageResponseTime: 0,
        popularityScore: 0
      }
    };

    // Validate bot data
    this.validateBotMetadata(bot);

    // Register capabilities
    for (const capability of bot.capabilities) {
      this.capabilities.set(capability.id, capability);
    }

    // Store bot
    this.bots.set(bot.id, bot);
    
    // Persist to disk
    await this.saveBotToDisk(bot);
    
    // Update subjects
    this.updateBotsSubject();
    
    this.emit('bot-registered', bot);
    console.log(`✅ Bot registered: ${bot.name} (${bot.id})`);
    
    return bot;
  }

  /**
   * Update an existing bot
   */
  async updateBot(botId: string, updates: Partial<BotMetadata>): Promise<BotMetadata> {
    const existingBot = this.bots.get(botId);
    if (!existingBot) {
      throw new Error(`Bot not found: ${botId}`);
    }

    const updatedBot: BotMetadata = {
      ...existingBot,
      ...updates,
      id: botId, // Prevent ID changes
      updatedAt: new Date()
    };

    // Validate updated data
    this.validateBotMetadata(updatedBot);

    // Update capabilities
    if (updates.capabilities) {
      // Remove old capabilities
      for (const capability of existingBot.capabilities) {
        this.capabilities.delete(capability.id);
      }
      
      // Add new capabilities
      for (const capability of updatedBot.capabilities) {
        this.capabilities.set(capability.id, capability);
      }
    }

    // Store updated bot
    this.bots.set(botId, updatedBot);
    
    // Persist to disk
    await this.saveBotToDisk(updatedBot);
    
    // Update subjects
    this.updateBotsSubject();
    
    this.emit('bot-updated', updatedBot);
    console.log(`📝 Bot updated: ${updatedBot.name} (${botId})`);
    
    return updatedBot;
  }

  /**
   * Remove a bot from the registry
   */
  async removeBot(botId: string): Promise<boolean> {
    const bot = this.bots.get(botId);
    if (!bot) {
      return false;
    }

    // Remove capabilities
    for (const capability of bot.capabilities) {
      this.capabilities.delete(capability.id);
    }

    // Remove bot
    this.bots.delete(botId);
    
    // Remove from disk
    await this.removeBotFromDisk(botId);
    
    // Update subjects
    this.updateBotsSubject();
    
    this.emit('bot-removed', botId);
    console.log(`🗑️ Bot removed: ${bot.name} (${botId})`);
    
    return true;
  }

  /**
   * Get a bot by ID
   */
  getBot(botId: string): BotMetadata | undefined {
    return this.bots.get(botId);
  }

  /**
   * Search bots with advanced filtering
   */
  searchBots(query: BotSearchQuery): BotSearchResult {
    let results = Array.from(this.bots.values());

    // Apply filters
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(bot => 
        bot.name.toLowerCase().includes(searchTerm) ||
        bot.description.toLowerCase().includes(searchTerm) ||
        bot.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (query.category) {
      results = results.filter(bot => 
        bot.capabilities.some(cap => cap.category === query.category)
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(bot => 
        query.tags!.some(tag => bot.tags.includes(tag))
      );
    }

    if (query.author) {
      results = results.filter(bot => bot.author === query.author);
    }

    if (query.status) {
      results = results.filter(bot => bot.status === query.status);
    }

    if (query.minReliability) {
      results = results.filter(bot => {
        const avgReliability = bot.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / bot.capabilities.length;
        return avgReliability >= query.minReliability!;
      });
    }

    if (query.complexity) {
      results = results.filter(bot => 
        bot.capabilities.some(cap => cap.complexity === query.complexity)
      );
    }

    // Calculate facets
    const facets = this.calculateFacets(results);

    // Sort results
    if (query.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (query.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'popularity':
            aValue = a.usage.popularityScore;
            bValue = b.usage.popularityScore;
            break;
          case 'created':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case 'updated':
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          case 'reliability':
            aValue = a.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / a.capabilities.length;
            bValue = b.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / b.capabilities.length;
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (query.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }

    // Apply pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    results = results.slice(offset, offset + limit);

    return {
      bots: results,
      total,
      facets
    };
  }

  /**
   * Get bots by capability
   */
  getBotsByCapability(capabilityId: string): BotMetadata[] {
    return Array.from(this.bots.values()).filter(bot =>
      bot.capabilities.some(cap => cap.id === capabilityId)
    );
  }

  /**
   * Get all capabilities
   */
  getCapabilities(): BotCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Get capabilities by category
   */
  getCapabilitiesByCategory(category: string): BotCapability[] {
    return Array.from(this.capabilities.values()).filter(cap => cap.category === category);
  }

  /**
   * Record bot usage for analytics
   */
  async recordBotUsage(botId: string, responseTime: number, success: boolean): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) return;

    bot.usage.totalInvocations++;
    if (success) {
      bot.usage.successfulInvocations++;
    }
    
    // Update average response time
    bot.usage.averageResponseTime = (
      (bot.usage.averageResponseTime * (bot.usage.totalInvocations - 1)) + responseTime
    ) / bot.usage.totalInvocations;
    
    bot.usage.lastUsed = new Date();
    
    // Update popularity score (simple algorithm)
    bot.usage.popularityScore = this.calculatePopularityScore(bot);
    
    bot.updatedAt = new Date();
    
    // Persist changes
    await this.saveBotToDisk(bot);
    this.updateBotsSubject();
    
    this.emit('bot-usage-recorded', { botId, responseTime, success });
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalBots: number;
    activeBots: number;
    totalCapabilities: number;
    categoryCounts: Record<string, number>;
    averageReliability: number;
    totalInvocations: number;
    topBots: Array<{ id: string; name: string; invocations: number }>;
  } {
    const bots = Array.from(this.bots.values());
    const activeBots = bots.filter(bot => bot.status === 'active');
    
    const categoryCounts = bots.reduce((acc, bot) => {
      for (const capability of bot.capabilities) {
        acc[capability.category] = (acc[capability.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalReliability = Array.from(this.capabilities.values())
      .reduce((sum, cap) => sum + cap.reliability, 0);
    const averageReliability = this.capabilities.size > 0 ? totalReliability / this.capabilities.size : 0;

    const totalInvocations = bots.reduce((sum, bot) => sum + bot.usage.totalInvocations, 0);

    const topBots = bots
      .sort((a, b) => b.usage.totalInvocations - a.usage.totalInvocations)
      .slice(0, 10)
      .map(bot => ({
        id: bot.id,
        name: bot.name,
        invocations: bot.usage.totalInvocations
      }));

    return {
      totalBots: bots.length,
      activeBots: activeBots.length,
      totalCapabilities: this.capabilities.size,
      categoryCounts,
      averageReliability,
      totalInvocations,
      topBots
    };
  }

  /**
   * Export registry data
   */
  async exportRegistry(): Promise<string> {
    const data = {
      bots: Array.from(this.bots.values()),
      capabilities: Array.from(this.capabilities.values()),
      exportedAt: new Date(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import registry data
   */
  async importRegistry(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      
      // Clear existing data
      this.bots.clear();
      this.capabilities.clear();
      
      // Import bots
      for (const botData of parsed.bots) {
        this.bots.set(botData.id, botData);
      }
      
      // Import capabilities
      for (const capData of parsed.capabilities) {
        this.capabilities.set(capData.id, capData);
      }
      
      // Persist all bots
      for (const bot of this.bots.values()) {
        await this.saveBotToDisk(bot);
      }
      
      this.updateBotsSubject();
      this.emit('registry-imported', { botCount: this.bots.size });
      
    } catch (error) {
      throw new Error(`Failed to import registry: ${error}`);
    }
  }

  // Observables
  getBots$(): Observable<BotMetadata[]> {
    return this.botsSubject.asObservable();
  }

  // Private methods
  private generateBotId(name: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${sanitized}-${timestamp}`;
  }

  private validateBotMetadata(bot: BotMetadata): void {
    if (!bot.name || bot.name.trim().length === 0) {
      throw new Error('Bot name is required');
    }
    
    if (!bot.description || bot.description.trim().length === 0) {
      throw new Error('Bot description is required');
    }
    
    if (!bot.capabilities || bot.capabilities.length === 0) {
      throw new Error('Bot must have at least one capability');
    }
    
    // Validate capabilities
    for (const capability of bot.capabilities) {
      if (!capability.id || !capability.name || !capability.description) {
        throw new Error('Capability must have id, name, and description');
      }
      
      if (capability.reliability < 0 || capability.reliability > 1) {
        throw new Error('Capability reliability must be between 0 and 1');
      }
    }
  }

  private calculatePopularityScore(bot: BotMetadata): number {
    const successRate = bot.usage.totalInvocations > 0 
      ? bot.usage.successfulInvocations / bot.usage.totalInvocations 
      : 0;
    
    const recencyFactor = bot.usage.lastUsed 
      ? Math.max(0, 1 - (Date.now() - bot.usage.lastUsed.getTime()) / (30 * 24 * 60 * 60 * 1000)) // 30 days
      : 0;
    
    return (bot.usage.totalInvocations * 0.4) + (successRate * 0.4) + (recencyFactor * 0.2);
  }

  private calculateFacets(bots: BotMetadata[]): BotSearchResult['facets'] {
    const categories: Record<string, number> = {};
    const tags: Record<string, number> = {};
    const authors: Record<string, number> = {};
    const complexities: Record<string, number> = {};

    for (const bot of bots) {
      // Categories
      for (const capability of bot.capabilities) {
        categories[capability.category] = (categories[capability.category] || 0) + 1;
        complexities[capability.complexity] = (complexities[capability.complexity] || 0) + 1;
      }
      
      // Tags
      for (const tag of bot.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
      
      // Authors
      authors[bot.author] = (authors[bot.author] || 0) + 1;
    }

    return { categories, tags, authors, complexities };
  }

  private async loadBotsFromDisk(): Promise<void> {
    try {
      const files = await fs.readdir(this.registryPath);
      const botFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of botFiles) {
        try {
          const filePath = path.join(this.registryPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const bot: BotMetadata = JSON.parse(data);
          
          this.bots.set(bot.id, bot);
          
          // Load capabilities
          for (const capability of bot.capabilities) {
            this.capabilities.set(capability.id, capability);
          }
        } catch (error) {
          console.warn(`Failed to load bot from ${file}:`, error);
        }
      }
      
      this.updateBotsSubject();
    } catch (error) {
      console.warn('Failed to load bots from disk:', error);
    }
  }

  private async saveBotToDisk(bot: BotMetadata): Promise<void> {
    try {
      const filePath = path.join(this.registryPath, `${bot.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(bot, null, 2));
    } catch (error) {
      console.error(`Failed to save bot ${bot.id} to disk:`, error);
    }
  }

  private async removeBotFromDisk(botId: string): Promise<void> {
    try {
      const filePath = path.join(this.registryPath, `${botId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to remove bot ${botId} from disk:`, error);
    }
  }

  private updateBotsSubject(): void {
    this.botsSubject.next(Array.from(this.bots.values()));
  }
}