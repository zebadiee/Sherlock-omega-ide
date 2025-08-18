/**
 * Enhanced Bot Registry Tests
 * Comprehensive test suite for FOSS bot registry capabilities
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';
import { PlatformType } from '../../../types/core';
import { EnhancedBotRegistry } from '../enhanced-bot-registry';
import { IBot, IQuantumBot, BotCategory, BotMetadata } from '../enhanced-interfaces';

describe('EnhancedBotRegistry', () => {
  let registry: EnhancedBotRegistry;
  let logger: Logger;
  let performanceMonitor: PerformanceMonitor;
  let mockBot: IBot;
  let mockQuantumBot: IQuantumBot;

  beforeEach(() => {
    logger = new Logger(PlatformType.NODE);
    performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    registry = new EnhancedBotRegistry(logger, performanceMonitor);

    // Create mock bots for testing
    mockBot = createMockBot('TestBot', 'A test bot for unit testing');
    mockQuantumBot = createMockQuantumBot('QuantumTestBot', 'A quantum test bot');
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('Bot Registration', () => {
    test('should register a bot successfully', async () => {
      await registry.register(mockBot);
      
      const retrievedBot = await registry.getBot('TestBot');
      expect(retrievedBot).toBeDefined();
      expect(retrievedBot?.name).toBe('TestBot');
    });

    test('should prevent duplicate bot registration', async () => {
      await registry.register(mockBot);
      
      await expect(registry.register(mockBot))
        .rejects.toThrow('Bot TestBot already registered');
    });

    test('should register quantum bots', async () => {
      await registry.register(mockQuantumBot);
      
      const retrievedBot = await registry.getBot('QuantumTestBot');
      expect(retrievedBot).toBeDefined();
      expect(registry.isQuantumBot(retrievedBot!)).toBe(true);
    });

    test('should validate bot before registration', async () => {
      const invalidBot = { name: '', description: 'Invalid bot' } as IBot;
      
      await expect(registry.register(invalidBot))
        .rejects.toThrow('Bot name is required');
    });

    test('should emit registration events', async () => {
      const eventSpy = jest.fn();
      registry.on('bot-registered', eventSpy);
      
      await registry.register(mockBot);
      
      expect(eventSpy).toHaveBeenCalledWith({ bot: mockBot });
    });
  });

  describe('Bot Retrieval', () => {
    beforeEach(async () => {
      await registry.register(mockBot);
      await registry.register(mockQuantumBot);
    });

    test('should retrieve bot by name', async () => {
      const bot = await registry.getBot('TestBot');
      
      expect(bot).toBeDefined();
      expect(bot?.name).toBe('TestBot');
    });

    test('should return undefined for non-existent bot', async () => {
      const bot = await registry.getBot('NonExistentBot');
      
      expect(bot).toBeUndefined();
    });

    test('should list all bots', async () => {
      const bots = await registry.listBots();
      
      expect(bots).toHaveLength(2);
      expect(bots.map(b => b.name)).toContain('TestBot');
      expect(bots.map(b => b.name)).toContain('QuantumTestBot');
    });

    test('should filter bots by category', async () => {
      const quantumBots = await registry.listBots({ category: BotCategory.QUANTUM });
      
      expect(quantumBots).toHaveLength(1);
      expect(quantumBots[0].name).toBe('QuantumTestBot');
    });

    test('should search bots by query', async () => {
      const results = await registry.searchBots('quantum');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('QuantumTestBot');
    });

    test('should get bots by tag', async () => {
      const testBots = await registry.getBotsByTag('test');
      
      expect(testBots.length).toBeGreaterThan(0);
    });

    test('should get bots by author', async () => {
      const authorBots = await registry.getBotsByAuthor('Test Author');
      
      expect(authorBots).toHaveLength(2);
    });
  });

  describe('Bot Unregistration', () => {
    beforeEach(async () => {
      await registry.register(mockBot);
    });

    test('should unregister bot successfully', async () => {
      await registry.unregister('TestBot');
      
      const bot = await registry.getBot('TestBot');
      expect(bot).toBeUndefined();
    });

    test('should throw error when unregistering non-existent bot', async () => {
      await expect(registry.unregister('NonExistentBot'))
        .rejects.toThrow('Bot NonExistentBot not found');
    });

    test('should emit unregistration events', async () => {
      const eventSpy = jest.fn();
      registry.on('bot-unregistered', eventSpy);
      
      await registry.unregister('TestBot');
      
      expect(eventSpy).toHaveBeenCalledWith({ name: 'TestBot' });
    });
  });

  describe('Version Management', () => {
    test('should track bot versions', async () => {
      await registry.register(mockBot);
      
      const versions = await registry.getBotVersions('TestBot');
      
      expect(versions).toContain('1.0.0');
    });

    test('should retrieve specific bot version', async () => {
      await registry.register(mockBot);
      
      const bot = await registry.getBotVersion('TestBot', '1.0.0');
      
      expect(bot).toBeDefined();
      expect(bot?.version).toBe('1.0.0');
    });

    test('should return empty array for non-existent bot versions', async () => {
      const versions = await registry.getBotVersions('NonExistentBot');
      
      expect(versions).toEqual([]);
    });
  });

  describe('FOSS Export/Import', () => {
    beforeEach(async () => {
      await registry.register(mockBot);
      await registry.register(mockQuantumBot);
    });

    test('should export registry to JSON', async () => {
      const exportData = await registry.exportRegistry();
      
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      
      const parsed = JSON.parse(exportData);
      expect(parsed.version).toBeDefined();
      expect(parsed.bots).toHaveLength(2);
      expect(parsed.metadata.license).toBe('MIT');
    });

    test('should import registry from JSON', async () => {
      const exportData = await registry.exportRegistry();
      
      // Clear registry
      await registry.unregister('TestBot');
      await registry.unregister('QuantumTestBot');
      
      // Import back
      await registry.importRegistry(exportData);
      
      const bots = await registry.listBots();
      expect(bots).toHaveLength(2);
    });

    test('should export individual bot', async () => {
      const botData = await registry.exportBot('TestBot');
      
      expect(botData).toBeDefined();
      expect(typeof botData).toBe('string');
      
      const parsed = JSON.parse(botData);
      expect(parsed.metadata.name).toBe('TestBot');
      expect(parsed.code).toBeDefined();
    });

    test('should import individual bot', async () => {
      const botData = await registry.exportBot('TestBot');
      
      // Unregister original
      await registry.unregister('TestBot');
      
      // Import back
      await registry.importBot(botData);
      
      const bot = await registry.getBot('TestBot');
      expect(bot).toBeDefined();
    });

    test('should handle invalid import data', async () => {
      await expect(registry.importRegistry('invalid json'))
        .rejects.toThrow('Failed to parse registry export data');
      
      await expect(registry.importBot('invalid json'))
        .rejects.toThrow('Failed to parse bot export data');
    });

    test('should emit export/import events', async () => {
      const exportSpy = jest.fn();
      const importSpy = jest.fn();
      
      registry.on('registry-exported', exportSpy);
      registry.on('registry-imported', importSpy);
      
      const exportData = await registry.exportRegistry();
      await registry.importRegistry(exportData);
      
      expect(exportSpy).toHaveBeenCalled();
      expect(importSpy).toHaveBeenCalled();
    });
  });

  describe('Quantum Bot Features', () => {
    beforeEach(async () => {
      await registry.register(mockQuantumBot);
    });

    test('should identify quantum bots', async () => {
      expect(registry.isQuantumBot(mockQuantumBot)).toBe(true);
      expect(registry.isQuantumBot(mockBot)).toBe(false);
    });

    test('should get all quantum bots', async () => {
      await registry.register(mockBot); // Add non-quantum bot
      
      const quantumBots = await registry.getQuantumBots();
      
      expect(quantumBots).toHaveLength(1);
      expect(quantumBots[0].name).toBe('QuantumTestBot');
    });
  });

  describe('Registry Statistics', () => {
    beforeEach(async () => {
      await registry.register(mockBot);
      await registry.register(mockQuantumBot);
    });

    test('should provide registry statistics', async () => {
      const stats = await registry.getRegistryStats();
      
      expect(stats.totalBots).toBe(2);
      expect(stats.quantumBots).toBe(1);
      expect(stats.categories).toBeDefined();
      expect(stats.authors).toBeDefined();
    });

    test('should track category statistics', async () => {
      const stats = await registry.getRegistryStats();
      
      expect(stats.categories[BotCategory.GENERAL]).toBe(1);
      expect(stats.categories[BotCategory.QUANTUM]).toBe(1);
    });

    test('should track author statistics', async () => {
      const stats = await registry.getRegistryStats();
      
      expect(stats.authors['Test Author']).toBe(2);
    });
  });

  describe('Performance', () => {
    test('should handle large number of bots', async () => {
      const bots = Array.from({ length: 100 }, (_, i) => 
        createMockBot(`Bot${i}`, `Test bot number ${i}`)
      );

      const startTime = Date.now();
      
      for (const bot of bots) {
        await registry.register(bot);
      }
      
      const registrationTime = Date.now() - startTime;
      expect(registrationTime).toBeLessThan(10000); // Should complete within 10 seconds

      const allBots = await registry.listBots();
      expect(allBots).toHaveLength(100);
    });

    test('should perform efficient searches', async () => {
      // Register many bots
      for (let i = 0; i < 50; i++) {
        await registry.register(createMockBot(`SearchBot${i}`, `Search test bot ${i}`));
      }

      const startTime = Date.now();
      const results = await registry.searchBots('search');
      const searchTime = Date.now() - startTime;

      expect(searchTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle registry corruption gracefully', async () => {
      // This would test recovery from corrupted internal state
      // For now, we'll test basic error scenarios
      
      await expect(registry.getBot(''))
        .resolves.toBeUndefined();
    });

    test('should validate bot metadata', async () => {
      const invalidBot = {
        name: 'ValidName',
        description: 'Valid description',
        version: '1.0.0',
        execute: async () => ({}),
        getMetadata: () => null // Invalid metadata
      } as any;

      await expect(registry.register(invalidBot))
        .rejects.toThrow();
    });
  });
});

// Helper functions for creating mock bots
function createMockBot(name: string, description: string): IBot {
  return {
    name,
    description,
    version: '1.0.0',
    author: 'Test Author',
    tags: ['test', 'mock'],

    async execute(input: any): Promise<any> {
      return {
        result: `Mock execution of ${name}`,
        input,
        timestamp: new Date()
      };
    },

    getMetadata(): BotMetadata {
      return {
        name,
        description,
        version: '1.0.0',
        author: 'Test Author',
        created: new Date(),
        updated: new Date(),
        tags: ['test', 'mock'],
        category: BotCategory.GENERAL,
        license: 'MIT'
      };
    }
  };
}

function createMockQuantumBot(name: string, description: string): IQuantumBot {
  const baseBot = createMockBot(name, description);
  
  return {
    ...baseBot,
    
    async simulateCircuit(circuitDescription: string): Promise<any> {
      return {
        probabilities: { '00': 0.5, '11': 0.5 },
        counts: { '00': 512, '11': 512 },
        shots: 1024,
        executionTime: 100,
        backend: 'mock-simulator'
      };
    },

    async executeQuantumAlgorithm(algorithm: string, parameters?: any): Promise<any> {
      return {
        result: `Mock ${algorithm} execution`,
        quantumAdvantage: 2.0,
        circuitDepth: 5,
        gateCount: 10,
        executionTime: 150
      };
    },

    async hybridExecute(classicalInput: any, quantumCircuit?: string): Promise<any> {
      const classicalResult = await baseBot.execute(classicalInput);
      const quantumResult = quantumCircuit ? 
        await this.simulateCircuit(quantumCircuit) : 
        { probabilities: {}, counts: {}, shots: 0, executionTime: 0, backend: 'none' };
      
      return {
        classicalResult,
        quantumResult,
        totalExecutionTime: 200
      };
    },

    getMetadata(): BotMetadata {
      const metadata = baseBot.getMetadata();
      return {
        ...metadata,
        category: BotCategory.QUANTUM,
        tags: [...metadata.tags, 'quantum']
      };
    }
  };
}