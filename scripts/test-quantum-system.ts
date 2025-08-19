#!/usr/bin/env ts-node

/**
 * Comprehensive Quantum System Test
 * Validates all quantum computing features and integrations
 * 
 * @author Dr. Elena Vasquez (Quantum Computer Science, MIT)
 */

import { Logger } from '../src/logging/logger';
import { PerformanceMonitor } from '../src/monitoring/performance-monitor';
import { PlatformType } from '../src/types/core';
import { EnhancedBotBuilder } from '../src/ai/core/enhanced-bot-builder';
import { EnhancedBotRegistry } from '../src/ai/core/enhanced-bot-registry';
import { runIDEQuantumDemo } from '../src/examples/ide-integration-demo';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class QuantumSystemTester {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private builder: EnhancedBotBuilder;
  private registry: EnhancedBotRegistry;
  private results: TestResult[] = [];

  constructor() {
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    this.builder = new EnhancedBotBuilder(this.logger, this.performanceMonitor);
    this.registry = new EnhancedBotRegistry(this.logger, this.performanceMonitor);
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive Quantum System Tests\n');
    console.log('=' .repeat(60));

    const tests = [
      () => this.testQuantumLibraryAvailability(),
      () => this.testBasicBotCreation(),
      () => this.testQuantumBotCreation(),
      () => this.testQuantumCircuitSimulation(),
      () => this.testQuantumAlgorithms(),
      () => this.testBotRegistry(),
      () => this.testFOSSExportImport(),
      () => this.testInteractiveSession(),
      () => this.testCodeGeneration(),
      () => this.testPerformance(),
      () => this.testIDEIntegration()
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printResults();
    await this.cleanup();
  }

  private async runTest(testFn: () => Promise<void>): Promise<void> {
    const testName = testFn.name.replace('test', '').replace(/([A-Z])/g, ' $1').trim();
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`❌ ${testName} (${duration}ms)`);
      console.log(`   Error: ${error}`);
    }
  }

  private async testQuantumLibraryAvailability(): Promise<void> {
    try {
      const QuantumCircuit = require('quantum-circuit');
      const circuit = new QuantumCircuit(2);
      circuit.addGate('h', 0);
      circuit.addGate('cx', 0, 1);
      circuit.run();
      
      const probs = circuit.probabilities();
      if (!probs || typeof probs !== 'object') {
        throw new Error('Quantum circuit simulation failed');
      }
      
      // Verify Bell state probabilities
      if (Math.abs(probs['00'] - 0.5) > 0.1 || Math.abs(probs['11'] - 0.5) > 0.1) {
        throw new Error('Bell state probabilities incorrect');
      }
      
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('quantum-circuit library not installed. Run: npm install quantum-circuit');
      }
      throw error;
    }
  }

  private async testBasicBotCreation(): Promise<void> {
    const bot = await this.builder.buildFromDescription('Create a simple test bot');
    
    if (!bot || !bot.name || !bot.execute) {
      throw new Error('Failed to create basic bot');
    }
    
    const result = await bot.execute({ test: 'data' });
    if (!result || !result.result) {
      throw new Error('Bot execution failed');
    }
  }

  private async testQuantumBotCreation(): Promise<void> {
    const quantumBot = await this.builder.buildQuantumBot(
      'Create a Bell state quantum bot for entanglement demonstration'
    );
    
    if (!quantumBot || !quantumBot.simulateCircuit) {
      throw new Error('Failed to create quantum bot');
    }
    
    const metadata = quantumBot.getMetadata();
    if (metadata.category !== 'quantum') {
      throw new Error('Quantum bot category not set correctly');
    }
  }

  private async testQuantumCircuitSimulation(): Promise<void> {
    const quantumBot = await this.builder.buildQuantumBot('Create quantum circuit simulator');
    
    const result = await quantumBot.simulateCircuit('Bell state with maximum entanglement');
    
    if (!result || !result.probabilities) {
      throw new Error('Quantum circuit simulation failed');
    }
    
    if (typeof result.probabilities !== 'object') {
      throw new Error('Invalid probability format');
    }
    
    if (!result.shots || !result.executionTime) {
      throw new Error('Missing simulation metadata');
    }
  }

  private async testQuantumAlgorithms(): Promise<void> {
    const quantumBot = await this.builder.buildQuantumBot('Create quantum algorithm executor');
    
    // Test Grover's algorithm
    const groverResult = await quantumBot.executeQuantumAlgorithm('grover', { qubits: 3 });
    if (!groverResult || !groverResult.result) {
      throw new Error('Grover algorithm execution failed');
    }
    
    // Test Bell state creation
    const bellResult = await quantumBot.executeQuantumAlgorithm('bell-state', { qubits: 2 });
    if (!bellResult || !bellResult.result) {
      throw new Error('Bell state algorithm execution failed');
    }
    
    // Test superposition
    const superpositionResult = await quantumBot.executeQuantumAlgorithm('superposition', { qubits: 4 });
    if (!superpositionResult || !superpositionResult.result) {
      throw new Error('Superposition algorithm execution failed');
    }
  }

  private async testBotRegistry(): Promise<void> {
    const testBot = await this.builder.buildFromDescription('Create registry test bot');
    
    // Register bot
    await this.registry.register(testBot);
    
    // Retrieve bot
    const retrievedBot = await this.registry.getBot(testBot.name);
    if (!retrievedBot || retrievedBot.name !== testBot.name) {
      throw new Error('Bot registration/retrieval failed');
    }
    
    // List bots
    const allBots = await this.registry.listBots();
    if (!allBots.some(bot => bot.name === testBot.name)) {
      throw new Error('Bot not found in registry listing');
    }
    
    // Search bots
    const searchResults = await this.registry.searchBots('registry');
    if (!searchResults.some(bot => bot.name === testBot.name)) {
      throw new Error('Bot search failed');
    }
  }

  private async testFOSSExportImport(): Promise<void> {
    const testBot = await this.builder.buildFromDescription('Create FOSS test bot');
    await this.registry.register(testBot);
    
    // Export registry
    const exportData = await this.registry.exportRegistry();
    if (!exportData || typeof exportData !== 'string') {
      throw new Error('Registry export failed');
    }
    
    const parsed = JSON.parse(exportData);
    if (!parsed.bots || !parsed.metadata || parsed.metadata.license !== 'MIT') {
      throw new Error('Invalid export format');
    }
    
    // Export individual bot
    const botData = await this.registry.exportBot(testBot.name);
    if (!botData || typeof botData !== 'string') {
      throw new Error('Bot export failed');
    }
    
    const botParsed = JSON.parse(botData);
    if (!botParsed.metadata || !botParsed.code) {
      throw new Error('Invalid bot export format');
    }
  }

  private async testInteractiveSession(): Promise<void> {
    const session = await this.builder.startInteractiveSession();
    if (!session || !session.id) {
      throw new Error('Failed to start interactive session');
    }
    
    const response1 = await this.builder.continueSession(
      session.id,
      'Create a quantum Bell state bot'
    );
    if (!response1 || !response1.message) {
      throw new Error('Interactive session continuation failed');
    }
    
    const response2 = await this.builder.continueSession(session.id, 'generate');
    if (!response2) {
      throw new Error('Interactive session generation failed');
    }
    
    const finalBot = await this.builder.finalizeSession(session.id);
    if (!finalBot || !finalBot.name) {
      throw new Error('Interactive session finalization failed');
    }
  }

  private async testCodeGeneration(): Promise<void> {
    const code = await this.builder.generateBotCode('Create a code generation test bot', {
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
      optimizationLevel: 'basic',
      quantumFeatures: false
    });
    
    if (!code || typeof code !== 'string') {
      throw new Error('Code generation failed');
    }
    
    if (!code.includes('export class') || !code.includes('async execute')) {
      throw new Error('Generated code missing required elements');
    }
    
    // Test quantum code generation
    const quantumCode = await this.builder.generateQuantumCode('Bell state circuit');
    if (!quantumCode || !quantumCode.includes('QuantumCircuit')) {
      throw new Error('Quantum code generation failed');
    }
  }

  private async testPerformance(): Promise<void> {
    const startTime = Date.now();
    
    // Create multiple bots concurrently
    const promises = Array.from({ length: 5 }, (_, i) =>
      this.builder.buildFromDescription(`Create performance test bot ${i}`)
    );
    
    const bots = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    if (bots.length !== 5) {
      throw new Error('Concurrent bot creation failed');
    }
    
    if (duration > 10000) { // Should complete within 10 seconds
      throw new Error(`Performance test too slow: ${duration}ms`);
    }
    
    // Test bot execution performance
    const execStartTime = Date.now();
    const execPromises = bots.map(bot => bot.execute({ performance: 'test' }));
    await Promise.all(execPromises);
    const execDuration = Date.now() - execStartTime;
    
    if (execDuration > 5000) { // Should complete within 5 seconds
      throw new Error(`Bot execution too slow: ${execDuration}ms`);
    }
  }

  private async testIDEIntegration(): Promise<void> {
    // Test the complete IDE workflow
    try {
      await runIDEQuantumDemo();
    } catch (error) {
      throw new Error(`IDE integration test failed: ${error}`);
    }
  }

  private printResults(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('🧪 Test Results Summary');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.name} (${result.duration}ms)`);
    });
    
    if (passed === this.results.length) {
      console.log('\n🎉 All tests passed! Quantum system is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
      process.exit(1);
    }
  }

  private async cleanup(): Promise<void> {
    await this.builder.shutdown();
    await this.registry.shutdown();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new QuantumSystemTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

export { QuantumSystemTester };