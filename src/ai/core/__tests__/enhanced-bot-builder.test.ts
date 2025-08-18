/**
 * Enhanced Bot Builder Tests
 * Comprehensive test suite for quantum bot building capabilities
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

import { Logger } from '../../../logging/logger';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor';
import { PlatformType } from '../../../types/core';
import { EnhancedBotBuilder } from '../enhanced-bot-builder';
import { IBot, IQuantumBot, BotCategory } from '../enhanced-interfaces';

describe('EnhancedBotBuilder', () => {
  let builder: EnhancedBotBuilder;
  let logger: Logger;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    logger = new Logger(PlatformType.NODE);
    performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    builder = new EnhancedBotBuilder(logger, performanceMonitor);
  });

  afterEach(async () => {
    await builder.shutdown();
  });

  describe('Classical Bot Building', () => {
    test('should build a basic bot from description', async () => {
      const description = 'Create a file processor bot that organizes files by type';
      
      const bot = await builder.buildFromDescription(description);
      
      expect(bot).toBeDefined();
      expect(bot.name).toContain('Bot');
      expect(bot.description).toBe(description);
      expect(bot.version).toBe('1.0.0');
      expect(typeof bot.execute).toBe('function');
      expect(typeof bot.getMetadata).toBe('function');
    });

    test('should detect bot category correctly', async () => {
      const optimizationBot = await builder.buildFromDescription('Create an optimization bot for scheduling');
      const metadata = optimizationBot.getMetadata();
      
      expect(metadata.category).toBe(BotCategory.OPTIMIZATION);
    });

    test('should handle complex descriptions', async () => {
      const complexDescription = 'Create an advanced machine learning bot that processes real-time data streams and provides predictive analytics with API integration';
      
      const bot = await builder.buildFromDescription(complexDescription);
      const metadata = bot.getMetadata();
      
      expect(bot.name).toBeDefined();
      expect(metadata.category).toBe(BotCategory.MACHINE_LEARNING);
      expect(metadata.tags).toContain('generated');
    });

    test('should execute generated bot successfully', async () => {
      const bot = await builder.buildFromDescription('Create a simple calculator bot');
      
      const result = await bot.execute({ operation: 'add', a: 2, b: 3 });
      
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Quantum Bot Building', () => {
    test('should build a quantum bot from description', async () => {
      const description = 'Create a quantum bot for Bell state generation and entanglement demonstration';
      
      const quantumBot = await builder.buildQuantumBot(description);
      
      expect(quantumBot).toBeDefined();
      expect(quantumBot.name).toContain('Bot');
      expect(quantumBot.description).toBe(description);
      expect(typeof quantumBot.simulateCircuit).toBe('function');
      expect(typeof quantumBot.executeQuantumAlgorithm).toBe('function');
      expect(typeof quantumBot.hybridExecute).toBe('function');
    });

    test('should detect quantum features correctly', async () => {
      const quantumBot = await builder.buildQuantumBot('Create a Grover search quantum algorithm bot');
      const metadata = quantumBot.getMetadata();
      
      expect(metadata.category).toBe(BotCategory.QUANTUM);
      expect(metadata.tags).toContain('quantum');
    });

    test('should simulate quantum circuits', async () => {
      const quantumBot = await builder.buildQuantumBot('Create a quantum superposition bot');
      
      const result = await quantumBot.simulateCircuit('2 qubit Bell state circuit');
      
      expect(result).toBeDefined();
      expect(result.probabilities).toBeDefined();
      expect(typeof result.probabilities).toBe('object');
      expect(result.shots).toBeDefined();
      expect(result.executionTime).toBeDefined();
    });

    test('should execute quantum algorithms', async () => {
      const quantumBot = await builder.buildQuantumBot('Create a quantum search bot using Grover algorithm');
      
      const result = await quantumBot.executeQuantumAlgorithm('grover', { qubits: 3 });
      
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.circuitDepth).toBeGreaterThan(0);
      expect(result.gateCount).toBeGreaterThan(0);
    });

    test('should perform hybrid classical-quantum execution', async () => {
      const quantumBot = await builder.buildQuantumBot('Create a hybrid optimization bot');
      
      const result = await quantumBot.hybridExecute(
        { problem: 'optimization' },
        'Bell state circuit for entanglement'
      );
      
      expect(result).toBeDefined();
      expect(result.classicalResult).toBeDefined();
      expect(result.quantumResult).toBeDefined();
      expect(result.totalExecutionTime).toBeGreaterThan(0);
    });

    test('should handle quantum algorithm parameters', async () => {
      const quantumBot = await builder.buildQuantumBot('Create a parameterized quantum circuit bot');
      
      const bellResult = await quantumBot.executeQuantumAlgorithm('bell-state', { qubits: 2 });
      const superpositionResult = await quantumBot.executeQuantumAlgorithm('superposition', { qubits: 4 });
      
      expect(bellResult.result).toBeDefined();
      expect(superpositionResult.result).toBeDefined();
    });
  });

  describe('Interactive Session Management', () => {
    test('should start interactive session', async () => {
      const session = await builder.startInteractiveSession();
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.state).toBe('initializing');
      expect(session.history).toHaveLength(1);
      expect(session.context).toBeDefined();
    });

    test('should continue interactive session', async () => {
      const session = await builder.startInteractiveSession();
      
      const response = await builder.continueSession(
        session.id,
        'Create a quantum bot for Bell state demonstration'
      );
      
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(response.requiresInput).toBeDefined();
    });

    test('should finalize interactive session', async () => {
      const session = await builder.startInteractiveSession();
      
      await builder.continueSession(session.id, 'Create a simple calculator bot');
      await builder.continueSession(session.id, 'generate');
      
      const bot = await builder.finalizeSession(session.id);
      
      expect(bot).toBeDefined();
      expect(bot.name).toBeDefined();
      expect(typeof bot.execute).toBe('function');
    });

    test('should handle session errors gracefully', async () => {
      await expect(builder.continueSession('invalid-session', 'test'))
        .rejects.toThrow('Session not found');
      
      await expect(builder.finalizeSession('invalid-session'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('Code Generation', () => {
    test('should generate TypeScript code', async () => {
      const code = await builder.generateBotCode('Create a file processor bot', {
        language: 'typescript',
        includeTests: false,
        includeDocumentation: false,
        optimizationLevel: 'basic',
        quantumFeatures: false
      });
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toContain('export class');
      expect(code).toContain('async execute');
      expect(code).toContain('getMetadata');
    });

    test('should generate quantum circuit code', async () => {
      const code = await builder.generateQuantumCode('Bell state circuit with Hadamard and CNOT');
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toContain('QuantumCircuit');
      expect(code).toContain('addGate');
    });

    test('should include quantum features in generated code', async () => {
      const code = await builder.generateBotCode('Create a quantum optimization bot', {
        language: 'typescript',
        includeTests: false,
        includeDocumentation: false,
        optimizationLevel: 'basic',
        quantumFeatures: true
      });
      
      expect(code).toContain('simulateCircuit');
      expect(code).toContain('executeQuantumAlgorithm');
      expect(code).toContain('QuantumCircuit');
    });
  });

  describe('Template Management', () => {
    test('should get available templates', async () => {
      const templates = await builder.getTemplates();
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    test('should create template from bot', async () => {
      const bot = await builder.buildFromDescription('Create a test bot');
      
      const template = await builder.createTemplate(bot);
      
      expect(template).toBeDefined();
      expect(template.name).toContain('Template');
      expect(template.description).toBeDefined();
      expect(template.codeTemplate).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid descriptions gracefully', async () => {
      const bot = await builder.buildFromDescription('');
      
      expect(bot).toBeDefined();
      expect(bot.name).toBe('GeneratedBot');
    });

    test('should handle quantum library unavailability', async () => {
      // Mock quantum library unavailability
      const originalQuantumCircuit = require('quantum-circuit');
      jest.doMock('quantum-circuit', () => {
        throw new Error('Module not found');
      });

      // This should still work but with limited quantum features
      const bot = await builder.buildFromDescription('Create a quantum bot');
      expect(bot).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should build bots within reasonable time', async () => {
      const startTime = Date.now();
      
      await builder.buildFromDescription('Create a performance test bot');
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle multiple concurrent builds', async () => {
      const descriptions = [
        'Create a file processor bot',
        'Create a quantum Bell state bot',
        'Create an optimization bot',
        'Create a machine learning bot'
      ];

      const promises = descriptions.map(desc => builder.buildFromDescription(desc));
      const bots = await Promise.all(promises);

      expect(bots).toHaveLength(4);
      bots.forEach(bot => {
        expect(bot).toBeDefined();
        expect(typeof bot.execute).toBe('function');
      });
    });
  });

  describe('Integration', () => {
    test('should integrate with performance monitoring', async () => {
      const spy = jest.spyOn(performanceMonitor, 'timeAsync');
      
      await builder.buildFromDescription('Create a monitored bot');
      
      expect(spy).toHaveBeenCalled();
    });

    test('should emit events during bot building', async () => {
      const eventSpy = jest.fn();
      builder.on('bot-built', eventSpy);
      
      await builder.buildFromDescription('Create an event test bot');
      
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});