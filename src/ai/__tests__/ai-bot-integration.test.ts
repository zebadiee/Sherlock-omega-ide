/**
 * AI Bot System Integration Tests
 * Tests the complete bot creation and management workflow
 */

import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import { PlatformType } from '../../types/core';
import { AIBotManager } from '../ai-bot-manager';
import { BotCategory, CapabilityType } from '../bot-registry/interfaces';

describe('AI Bot System Integration', () => {
  let logger: Logger;
  let performanceMonitor: PerformanceMonitor;
  let botManager: AIBotManager;

  beforeEach(() => {
    logger = new Logger(PlatformType.NODE);
    performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    botManager = new AIBotManager(logger, performanceMonitor, {
      enableAutoInstall: true,
      enableSandbox: true
    });
  });

  afterEach(async () => {
    await botManager.shutdown();
  });

  describe('Bot Creation from Description', () => {
    it('should create a file organizer bot from natural language', async () => {
      const description = `
        Create a file organizer bot that can read files from a directory,
        analyze their types, and organize them into appropriate folders.
        It should support common file types like images, documents, and code files.
      `;

      const generatedBot = await botManager.createBotFromDescription(description);

      expect(generatedBot).toBeDefined();
      expect(generatedBot.blueprint.name).toContain('organizer');
      expect(generatedBot.blueprint.capabilities.length).toBeGreaterThan(0);
      expect(generatedBot.blueprint.confidence).toBeGreaterThan(0.5);
      
      // Check that implementation was generated
      expect(generatedBot.implementation.entryPoint).toBe('index.ts');
      expect(generatedBot.implementation.sourceFiles).toHaveProperty('index.ts');
      expect(generatedBot.implementation.sourceFiles).toHaveProperty('package.json');
      
      // Check that tests were generated
      expect(generatedBot.tests.length).toBeGreaterThan(0);
      
      // Check that documentation was generated
      expect(generatedBot.documentation.readme).toContain(generatedBot.blueprint.name);
    });

    it('should create a code formatter bot', async () => {
      const description = `
        Build a code formatter that can format TypeScript and JavaScript files
        using Prettier. It should support custom configuration and ESLint integration.
      `;

      const generatedBot = await botManager.createBotFromDescription(description);

      expect(generatedBot.blueprint.name).toContain('formatter');
      expect(generatedBot.blueprint.category).toBe(BotCategory.CODE_GENERATION);
      expect(generatedBot.blueprint.capabilities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: CapabilityType.FILE_MANIPULATION
          })
        ])
      );
    });
  });

  describe('Interactive Bot Builder', () => {
    it('should handle interactive bot building session', async () => {
      const session = await botManager.startInteractiveBotBuilder();
      
      expect(session.id).toBeDefined();
      expect(session.history.length).toBe(1);
      expect(session.history[0].content).toContain('What would you like your bot to do?');

      // Simulate user input
      const response1 = await botManager.continueInteractiveSession(
        session.id,
        'I want to create a documentation generator bot'
      );

      expect(response1.message).toBeDefined();
      expect(response1.requiresInput).toBe(true);
      expect(response1.blueprint).toBeDefined();

      // Continue the conversation
      const response2 = await botManager.continueInteractiveSession(
        session.id,
        'Add support for TypeScript interfaces and JSDoc comments'
      );

      expect(response2.message).toBeDefined();
      expect(response2.blueprint).toBeDefined();

      // Finalize the bot
      const response3 = await botManager.continueInteractiveSession(
        session.id,
        'generate'
      );

      expect(response3.requiresInput).toBe(false);

      const finalBot = await botManager.finalizeBotBuilder(session.id);
      expect(finalBot.blueprint.name).toBeDefined();
      expect(finalBot.implementation.sourceFiles).toHaveProperty('index.ts');
    });
  });

  describe('Bot Registry Operations', () => {
    it('should register and manage bots', async () => {
      // Create a bot first
      const generatedBot = await botManager.createBotFromDescription(
        'Create a simple text processor that converts text to uppercase'
      );

      const botId = generatedBot.blueprint.id;

      // Check if bot was auto-registered
      const registeredBot = await botManager.getBotById(botId);
      expect(registeredBot).toBeDefined();
      expect(registeredBot!.metadata.name).toBe(generatedBot.blueprint.name);

      // Test bot operations
      expect(botManager.isInstalled(botId)).toBe(true);
      expect(botManager.isEnabled(botId)).toBe(false);

      await botManager.enableBot(botId);
      expect(botManager.isEnabled(botId)).toBe(true);

      await botManager.disableBot(botId);
      expect(botManager.isEnabled(botId)).toBe(false);
    });

    it('should search and list bots', async () => {
      // Create multiple bots
      await botManager.createBotFromDescription('Create a file reader bot');
      await botManager.createBotFromDescription('Create an API client bot');

      const allBots = await botManager.listBots();
      expect(allBots.length).toBeGreaterThanOrEqual(2);

      const searchResults = await botManager.searchBots({
        query: 'file'
      });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].name.toLowerCase()).toContain('file');
    });

    it('should provide registry statistics', async () => {
      // Create a few bots
      await botManager.createBotFromDescription('Create a test bot 1');
      await botManager.createBotFromDescription('Create a test bot 2');

      const stats = await botManager.getRegistryStats();
      
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.installed).toBeGreaterThanOrEqual(2);
      expect(stats.categories).toBeDefined();
      expect(typeof stats.averageRating).toBe('number');
    });
  });

  describe('Bot Analytics', () => {
    it('should provide bot analytics', async () => {
      const generatedBot = await botManager.createBotFromDescription(
        'Create a simple calculator bot'
      );

      const analytics = await botManager.getBotAnalytics(generatedBot.blueprint.id);

      expect(analytics.metadata).toBeDefined();
      expect(analytics.usage).toBeDefined();
      expect(analytics.performance).toBeDefined();
      expect(analytics.capabilities).toBe(generatedBot.blueprint.capabilities.length);
      expect(typeof analytics.dependencies).toBe('number');
    });
  });

  describe('Bot Management Operations', () => {
    it('should export and import bots', async () => {
      const generatedBot = await botManager.createBotFromDescription(
        'Create a JSON validator bot'
      );

      const botId = generatedBot.blueprint.id;

      // Export bot
      const exportedData = await botManager.exportBot(botId);
      expect(exportedData).toBeDefined();
      expect(typeof exportedData).toBe('string');

      const parsedData = JSON.parse(exportedData);
      expect(parsedData.metadata.id).toBe(botId);

      // Import would create a new bot (in a real scenario)
      // For testing, we just verify the export format is correct
      expect(parsedData).toHaveProperty('metadata');
      expect(parsedData).toHaveProperty('implementation');
      expect(parsedData).toHaveProperty('configuration');
    });

    it('should clone bots', async () => {
      const originalBot = await botManager.createBotFromDescription(
        'Create a log parser bot'
      );

      const clonedBot = await botManager.cloneBot(
        originalBot.blueprint.id,
        'Advanced Log Parser'
      );

      expect(clonedBot.metadata.name).toBe('Advanced Log Parser');
      expect(clonedBot.metadata.id).not.toBe(originalBot.blueprint.id);
      expect(clonedBot.metadata.version).toBe('1.0.0');
      expect(clonedBot.implementation).toEqual(originalBot.implementation);
    });
  });

  describe('Blueprint Refinement', () => {
    it('should refine bot blueprints based on feedback', async () => {
      const description = 'Create a simple text processor';
      const generatedBot = await botManager.createBotFromDescription(description);
      
      const originalBlueprint = generatedBot.blueprint;
      const originalCapabilityCount = originalBlueprint.capabilities.length;

      const refinedBlueprint = await botManager.refineBotBlueprint(
        originalBlueprint,
        'Add support for file processing and API integration'
      );

      expect(refinedBlueprint.capabilities.length).toBeGreaterThanOrEqual(originalCapabilityCount);
      expect(refinedBlueprint.workflow.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid bot descriptions gracefully', async () => {
      const description = ''; // Empty description

      const generatedBot = await botManager.createBotFromDescription(description);
      
      // Should still create a basic bot with default capabilities
      expect(generatedBot.blueprint.capabilities.length).toBeGreaterThan(0);
      expect(generatedBot.blueprint.confidence).toBeLessThan(0.8);
    });

    it('should handle non-existent bot operations', async () => {
      const nonExistentBotId = 'non-existent-bot-123';

      await expect(botManager.getBotById(nonExistentBotId)).resolves.toBeNull();
      await expect(botManager.enableBot(nonExistentBotId)).rejects.toThrow();
      await expect(botManager.getBotAnalytics(nonExistentBotId)).rejects.toThrow();
    });

    it('should handle invalid session operations', async () => {
      const invalidSessionId = 'invalid-session-123';

      await expect(
        botManager.continueInteractiveSession(invalidSessionId, 'test input')
      ).rejects.toThrow();

      await expect(
        botManager.finalizeBotBuilder(invalidSessionId)
      ).rejects.toThrow();
    });
  });

  describe('Event System', () => {
    it('should emit events for bot operations', (done) => {
      let eventCount = 0;
      const expectedEvents = ['bot-generated', 'bot-registered'];

      const checkCompletion = () => {
        eventCount++;
        if (eventCount === expectedEvents.length) {
          done();
        }
      };

      botManager.on('bot-generated', (event) => {
        expect(event.blueprint).toBeDefined();
        checkCompletion();
      });

      botManager.on('bot-registered', (event) => {
        expect(event.botId).toBeDefined();
        checkCompletion();
      });

      // Trigger events by creating a bot
      botManager.createBotFromDescription('Create an event test bot');
    });
  });
});