/**
 * Enhanced Bot Registry - FOSS-friendly bot management
 * Simplified design with quantum computing integration
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 * @author Sherlock Ω Contributors
 */

import { EventEmitter } from 'events';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import {
  IBot,
  IQuantumBot,
  IBotRegistry,
  BotMetadata,
  BotFilter,
  BotCategory,
  RegistryExport,
  BotExport,
  FOSSMetadata,
  BotRegistryEvents,
  BotError
} from './enhanced-interfaces';

export class EnhancedBotRegistry extends EventEmitter implements IBotRegistry {
  private bots = new Map<string, IBot>();
  private versions = new Map<string, Map<string, IBot>>();
  private metadata = new Map<string, BotMetadata>();
  
  constructor(
    private logger: Logger,
    private performanceMonitor: PerformanceMonitor
  ) {
    super();
    this.logger.info('Enhanced Bot Registry initialized with FOSS capabilities');
  }

  async register(bot: IBot): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.register', async () => {
      if (this.bots.has(bot.name)) {
        throw new BotError(`Bot ${bot.name} already registered`, 'DUPLICATE_BOT', bot.name);
      }

      // Validate bot
      await this.validateBot(bot);

      // Store bot and metadata
      this.bots.set(bot.name, bot);
      const metadata = bot.getMetadata();
      this.metadata.set(bot.name, metadata);

      // Store version
      if (!this.versions.has(bot.name)) {
        this.versions.set(bot.name, new Map());
      }
      this.versions.get(bot.name)!.set(bot.version, bot);

      this.logger.info(`Bot registered: ${bot.name} v${bot.version} by ${metadata.author}`);
      this.emit('bot-registered', { bot });
    });
  }

  async unregister(name: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.unregister', async () => {
      if (!this.bots.has(name)) {
        throw new BotError(`Bot ${name} not found`, 'BOT_NOT_FOUND', name);
      }

      this.bots.delete(name);
      this.metadata.delete(name);
      this.versions.delete(name);

      this.logger.info(`Bot unregistered: ${name}`);
      this.emit('bot-unregistered', { name });
    });
  }

  async getBot(name: string): Promise<IBot | undefined> {
    return this.performanceMonitor.timeAsync('bot-registry.get-bot', async () => {
      return this.bots.get(name);
    });
  }

  async listBots(filter?: BotFilter): Promise<IBot[]> {
    return this.performanceMonitor.timeAsync('bot-registry.list-bots', async () => {
      let bots = Array.from(this.bots.values());

      if (filter) {
        bots = this.applyFilter(bots, filter);
      }

      // Sort by name for consistent ordering
      return bots.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async searchBots(query: string): Promise<IBot[]> {
    return this.performanceMonitor.timeAsync('bot-registry.search-bots', async () => {
      const searchTerm = query.toLowerCase();
      const results: IBot[] = [];

      for (const [name, bot] of this.bots) {
        const metadata = this.metadata.get(name);
        if (!metadata) continue;

        // Search in name, description, and tags
        if (
          name.toLowerCase().includes(searchTerm) ||
          metadata.description.toLowerCase().includes(searchTerm) ||
          metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ) {
          results.push(bot);
        }
      }

      return results.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async getBotsByTag(tag: string): Promise<IBot[]> {
    return this.performanceMonitor.timeAsync('bot-registry.get-bots-by-tag', async () => {
      const results: IBot[] = [];

      for (const [name, bot] of this.bots) {
        const metadata = this.metadata.get(name);
        if (metadata && metadata.tags.includes(tag)) {
          results.push(bot);
        }
      }

      return results.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async getBotsByAuthor(author: string): Promise<IBot[]> {
    return this.performanceMonitor.timeAsync('bot-registry.get-bots-by-author', async () => {
      const results: IBot[] = [];

      for (const [name, bot] of this.bots) {
        const metadata = this.metadata.get(name);
        if (metadata && metadata.author === author) {
          results.push(bot);
        }
      }

      return results.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  // FOSS Sharing Capabilities

  async exportRegistry(): Promise<string> {
    return this.performanceMonitor.timeAsync('bot-registry.export-registry', async () => {
      const botExports: BotExport[] = [];

      for (const [name, bot] of this.bots) {
        const metadata = this.metadata.get(name);
        if (!metadata) continue;

        const botExport: BotExport = {
          metadata,
          code: await this.serializeBotCode(bot),
          dependencies: await this.extractDependencies(bot),
          tests: await this.extractTests(bot),
          documentation: await this.extractDocumentation(bot)
        };

        botExports.push(botExport);
      }

      const registryExport: RegistryExport = {
        version: '1.0.0',
        exportDate: new Date(),
        bots: botExports,
        metadata: {
          license: 'MIT',
          repository: 'https://github.com/zebadiee/Sherlock-omega-ide',
          contributors: ['Sherlock Ω Contributors', 'Dr. Elena Vasquez'],
          documentation: 'https://github.com/zebadiee/Sherlock-omega-ide/docs'
        }
      };

      const exportData = JSON.stringify(registryExport, null, 2);
      this.logger.info(`Registry exported: ${botExports.length} bots`);
      this.emit('registry-exported', { data: exportData });

      return exportData;
    });
  }

  async importRegistry(data: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.import-registry', async () => {
      try {
        const registryExport: RegistryExport = JSON.parse(data);
        let importedCount = 0;

        for (const botExport of registryExport.bots) {
          try {
            const bot = await this.deserializeBotCode(botExport);
            
            // Check if bot already exists
            if (!this.bots.has(bot.name)) {
              await this.register(bot);
              importedCount++;
            } else {
              this.logger.warn(`Bot ${bot.name} already exists, skipping import`);
            }
          } catch (error) {
            this.logger.error(`Failed to import bot ${botExport.metadata.name}:`, error as Record<string, unknown>);
          }
        }

        this.logger.info(`Registry imported: ${importedCount} bots`);
        this.emit('registry-imported', { count: importedCount });

      } catch (error) {
        throw new BotError('Failed to parse registry export data', 'INVALID_EXPORT_DATA', undefined, error);
      }
    });
  }

  async exportBot(name: string): Promise<string> {
    return this.performanceMonitor.timeAsync('bot-registry.export-bot', async () => {
      const bot = this.bots.get(name);
      const metadata = this.metadata.get(name);

      if (!bot || !metadata) {
        throw new BotError(`Bot ${name} not found`, 'BOT_NOT_FOUND', name);
      }

      const botExport: BotExport = {
        metadata,
        code: await this.serializeBotCode(bot),
        dependencies: await this.extractDependencies(bot),
        tests: await this.extractTests(bot),
        documentation: await this.extractDocumentation(bot)
      };

      const exportData = JSON.stringify(botExport, null, 2);
      this.logger.info(`Bot exported: ${name}`);

      return exportData;
    });
  }

  async importBot(data: string): Promise<void> {
    return this.performanceMonitor.timeAsync('bot-registry.import-bot', async () => {
      try {
        const botExport: BotExport = JSON.parse(data);
        const bot = await this.deserializeBotCode(botExport);
        
        await this.register(bot);
        this.logger.info(`Bot imported: ${bot.name}`);

      } catch (error) {
        throw new BotError('Failed to parse bot export data', 'INVALID_BOT_DATA', undefined, error);
      }
    });
  }

  // Version Management

  async getBotVersions(name: string): Promise<string[]> {
    return this.performanceMonitor.timeAsync('bot-registry.get-bot-versions', async () => {
      const versions = this.versions.get(name);
      if (!versions) {
        return [];
      }
      return Array.from(versions.keys()).sort();
    });
  }

  async getBotVersion(name: string, version: string): Promise<IBot | undefined> {
    return this.performanceMonitor.timeAsync('bot-registry.get-bot-version', async () => {
      const versions = this.versions.get(name);
      if (!versions) {
        return undefined;
      }
      return versions.get(version);
    });
  }

  // Utility Methods

  async getRegistryStats(): Promise<any> {
    const allBots = await this.listBots();
    const quantumBots = allBots.filter(bot => this.isQuantumBot(bot));
    
    const categoryStats = allBots.reduce((acc, bot) => {
      const metadata = this.metadata.get(bot.name);
      if (metadata) {
        acc[metadata.category] = (acc[metadata.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const authorStats = allBots.reduce((acc, bot) => {
      const metadata = this.metadata.get(bot.name);
      if (metadata) {
        acc[metadata.author] = (acc[metadata.author] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBots: allBots.length,
      quantumBots: quantumBots.length,
      categories: categoryStats,
      authors: authorStats,
      averageVersion: this.calculateAverageVersion(allBots),
      newestBot: this.getNewestBot(allBots),
      oldestBot: this.getOldestBot(allBots)
    };
  }

  isQuantumBot(bot: IBot): boolean {
    return 'simulateCircuit' in bot && typeof (bot as any).simulateCircuit === 'function';
  }

  async getQuantumBots(): Promise<IQuantumBot[]> {
    const allBots = await this.listBots();
    return allBots.filter(bot => this.isQuantumBot(bot)) as IQuantumBot[];
  }

  // Private Helper Methods

  private async validateBot(bot: IBot): Promise<void> {
    if (!bot.name || typeof bot.name !== 'string') {
      throw new BotError('Bot name is required and must be a string', 'INVALID_BOT_NAME');
    }

    if (!bot.description || typeof bot.description !== 'string') {
      throw new BotError('Bot description is required and must be a string', 'INVALID_BOT_DESCRIPTION');
    }

    if (!bot.version || typeof bot.version !== 'string') {
      throw new BotError('Bot version is required and must be a string', 'INVALID_BOT_VERSION');
    }

    if (typeof bot.execute !== 'function') {
      throw new BotError('Bot must implement execute method', 'MISSING_EXECUTE_METHOD');
    }

    if (typeof bot.getMetadata !== 'function') {
      throw new BotError('Bot must implement getMetadata method', 'MISSING_METADATA_METHOD');
    }

    // Validate quantum bot specific methods
    if (this.isQuantumBot(bot)) {
      const quantumBot = bot as IQuantumBot;
      if (typeof quantumBot.simulateCircuit !== 'function') {
        throw new BotError('Quantum bot must implement simulateCircuit method', 'MISSING_QUANTUM_METHOD');
      }
    }
  }

  private applyFilter(bots: IBot[], filter: BotFilter): IBot[] {
    return bots.filter(bot => {
      const metadata = this.metadata.get(bot.name);
      if (!metadata) return false;

      if (filter.category && metadata.category !== filter.category) {
        return false;
      }

      if (filter.author && metadata.author !== filter.author) {
        return false;
      }

      if (filter.tags && !filter.tags.some(tag => metadata.tags.includes(tag))) {
        return false;
      }

      // Version filtering (simplified)
      if (filter.minVersion && this.compareVersions(metadata.version, filter.minVersion) < 0) {
        return false;
      }

      if (filter.maxVersion && this.compareVersions(metadata.version, filter.maxVersion) > 0) {
        return false;
      }

      return true;
    });
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  private async serializeBotCode(bot: IBot): Promise<string> {
    // In a real implementation, this would serialize the bot's code
    // For now, we'll create a simplified representation
    return `
// Generated Bot Code for ${bot.name}
class ${bot.name.replace(/[^a-zA-Z0-9]/g, '')} {
  constructor() {
    this.name = '${bot.name}';
    this.description = '${bot.description}';
    this.version = '${bot.version}';
  }

  async execute(input) {
    // Bot implementation would be here
    return { result: 'Bot executed successfully', input };
  }

  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      author: '${bot.getMetadata().author}',
      created: new Date('${bot.getMetadata().created.toISOString()}'),
      updated: new Date('${bot.getMetadata().updated.toISOString()}'),
      tags: ${JSON.stringify(bot.getMetadata().tags)},
      category: '${bot.getMetadata().category}',
      license: '${bot.getMetadata().license}'
    };
  }
}

module.exports = ${bot.name.replace(/[^a-zA-Z0-9]/g, '')};
`;
  }

  private async deserializeBotCode(botExport: BotExport): Promise<IBot> {
    // In a real implementation, this would safely deserialize and instantiate the bot
    // For now, we'll create a mock bot based on the metadata
    const mockBot: IBot = {
      name: botExport.metadata.name,
      description: botExport.metadata.description,
      version: botExport.metadata.version,
      author: botExport.metadata.author,
      tags: botExport.metadata.tags,

      async execute(input: any): Promise<any> {
        return {
          result: `Mock execution of ${botExport.metadata.name}`,
          input,
          timestamp: new Date()
        };
      },

      getMetadata(): BotMetadata {
        return botExport.metadata;
      }
    };

    return mockBot;
  }

  private async extractDependencies(bot: IBot): Promise<string[]> {
    // Extract dependencies from bot code
    const dependencies = ['typescript', '@types/node'];
    
    if (this.isQuantumBot(bot)) {
      dependencies.push('quantum-circuit');
    }
    
    return dependencies;
  }

  private async extractTests(bot: IBot): Promise<string | undefined> {
    // Generate basic test template
    return `
// Tests for ${bot.name}
describe('${bot.name}', () => {
  let bot;

  beforeEach(() => {
    bot = new ${bot.name.replace(/[^a-zA-Z0-9]/g, '')}();
  });

  test('should execute successfully', async () => {
    const result = await bot.execute({ test: 'data' });
    expect(result).toBeDefined();
  });

  test('should return correct metadata', () => {
    const metadata = bot.getMetadata();
    expect(metadata.name).toBe('${bot.name}');
    expect(metadata.version).toBe('${bot.version}');
  });
});
`;
  }

  private async extractDocumentation(bot: IBot): Promise<string | undefined> {
    // Generate basic documentation
    return `
# ${bot.name}

${bot.description}

## Usage

\`\`\`typescript
const bot = new ${bot.name.replace(/[^a-zA-Z0-9]/g, '')}();
const result = await bot.execute(inputData);
console.log(result);
\`\`\`

## Metadata

- **Version**: ${bot.version}
- **Author**: ${bot.getMetadata().author}
- **License**: ${bot.getMetadata().license}
- **Category**: ${bot.getMetadata().category}

## Tags

${bot.getMetadata().tags.map(tag => `- ${tag}`).join('\n')}
`;
  }

  private calculateAverageVersion(bots: IBot[]): string {
    if (bots.length === 0) return '0.0.0';
    
    // Simplified version averaging
    const versions = bots.map(bot => bot.version);
    return versions[0]; // Return first version as placeholder
  }

  private getNewestBot(bots: IBot[]): string | undefined {
    if (bots.length === 0) return undefined;
    
    let newest = bots[0];
    let newestDate = this.metadata.get(newest.name)?.created || new Date(0);
    
    for (const bot of bots) {
      const metadata = this.metadata.get(bot.name);
      if (metadata && metadata.created > newestDate) {
        newest = bot;
        newestDate = metadata.created;
      }
    }
    
    return newest.name;
  }

  private getOldestBot(bots: IBot[]): string | undefined {
    if (bots.length === 0) return undefined;
    
    let oldest = bots[0];
    let oldestDate = this.metadata.get(oldest.name)?.created || new Date();
    
    for (const bot of bots) {
      const metadata = this.metadata.get(bot.name);
      if (metadata && metadata.created < oldestDate) {
        oldest = bot;
        oldestDate = metadata.created;
      }
    }
    
    return oldest.name;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    this.bots.clear();
    this.versions.clear();
    this.metadata.clear();
    this.removeAllListeners();
    this.logger.info('Enhanced Bot Registry shut down');
  }
}