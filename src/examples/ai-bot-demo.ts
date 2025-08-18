/**
 * AI Bot Manager Demo
 * Demonstrates the bot catalog and builder capabilities
 */

import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../types/core';
import { AIBotManager } from '../ai/ai-bot-manager';

async function runAIBotDemo() {
  console.log('🤖 Starting AI Bot Manager Demo...\n');

  // Initialize dependencies
  const logger = new Logger(PlatformType.NODE);
  const performanceMonitor = new PerformanceMonitor(PlatformType.NODE);

  // Initialize AI Bot Manager with quantum computing
  const botManager = new AIBotManager(logger, performanceMonitor, {
    enableAutoInstall: true,
    enableSandbox: true,
    enableQuantumComputing: true
  });

  try {
    // Demo 1: Create a bot from natural language description
    console.log('📝 Demo 1: Creating a bot from description...');
    const description = `
      Create a file organizer bot that can read files from a directory, 
      analyze their types, and organize them into appropriate folders. 
      It should support common file types like images, documents, and code files.
    `;

    const generatedBot = await botManager.createBotFromDescription(description);
    console.log(`✅ Generated bot: ${generatedBot.blueprint.name}`);
    console.log(`   Description: ${generatedBot.blueprint.description}`);
    console.log(`   Capabilities: ${generatedBot.blueprint.capabilities.length}`);
    console.log(`   Confidence: ${(generatedBot.blueprint.confidence * 100).toFixed(1)}%\n`);

    // Demo 2: Interactive bot building session
    console.log('💬 Demo 2: Interactive bot building...');
    const session = await botManager.startInteractiveBotBuilder();
    console.log(`Started session: ${session.id}`);

    // Simulate user interaction
    let response = await botManager.continueInteractiveSession(
      session.id, 
      "I want to create a code formatter bot that can format TypeScript and JavaScript files"
    );
    console.log(`Bot: ${response.message}`);

    response = await botManager.continueInteractiveSession(
      session.id,
      "Add support for Prettier configuration and ESLint integration"
    );
    console.log(`Bot: ${response.message}`);

    response = await botManager.continueInteractiveSession(
      session.id,
      "Looks good, generate the bot"
    );
    console.log(`Bot: ${response.message}`);

    const interactiveBot = await botManager.finalizeBotBuilder(session.id);
    console.log(`✅ Interactive bot created: ${interactiveBot.blueprint.name}\n`);

    // Demo 3: Bot registry operations
    console.log('📚 Demo 3: Bot registry operations...');
    
    // List all bots
    const allBots = await botManager.listBots();
    console.log(`Total bots in registry: ${allBots.length}`);

    // Search for specific bots
    const searchResults = await botManager.searchBots({
      query: 'file',
      category: 'automation' as any
    });
    console.log(`Search results for 'file' in automation: ${searchResults.length}`);

    // Get registry statistics
    const stats = await botManager.getRegistryStats();
    console.log('Registry Statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Installed: ${stats.installed}`);
    console.log(`  Enabled: ${stats.enabled}`);
    console.log(`  Average Rating: ${stats.averageRating.toFixed(1)}`);
    console.log(`  Categories:`, stats.categories);
    console.log();

    // Demo 4: Bot management operations
    console.log('⚙️ Demo 4: Bot management...');
    
    const botId = generatedBot.blueprint.id;
    
    // Enable the bot
    await botManager.enableBot(botId);
    console.log(`✅ Enabled bot: ${botId}`);

    // Get bot analytics
    const analytics = await botManager.getBotAnalytics(botId);
    console.log('Bot Analytics:');
    console.log(`  Name: ${analytics.metadata.name}`);
    console.log(`  Downloads: ${analytics.usage.downloads}`);
    console.log(`  Rating: ${analytics.usage.rating}`);
    console.log(`  Capabilities: ${analytics.capabilities}`);
    console.log(`  Dependencies: ${analytics.dependencies}`);
    console.log();

    // Demo 5: Export and clone bot
    console.log('📤 Demo 5: Export and clone operations...');
    
    // Export bot
    const exportedBot = await botManager.exportBot(botId);
    console.log(`✅ Exported bot (${exportedBot.length} characters)`);

    // Clone bot
    const clonedBot = await botManager.cloneBot(botId, 'Advanced File Organizer');
    console.log(`✅ Cloned bot: ${clonedBot.metadata.name}`);
    console.log();

    // Demo 6: Show generated code structure
    console.log('💻 Demo 6: Generated code preview...');
    console.log('Generated files:');
    Object.keys(generatedBot.implementation.sourceFiles).forEach(fileName => {
      console.log(`  📄 ${fileName}`);
    });
    
    console.log('\nMain entry point preview:');
    const mainFile = generatedBot.implementation.sourceFiles[generatedBot.implementation.entryPoint];
    console.log(mainFile.substring(0, 500) + '...\n');

    // Demo 7: Blueprint refinement
    console.log('🔧 Demo 7: Blueprint refinement...');
    const originalBlueprint = generatedBot.blueprint;
    const refinedBlueprint = await botManager.refineBotBlueprint(
      originalBlueprint,
      "Add support for custom file extensions and recursive directory scanning"
    );
    
    console.log(`Original capabilities: ${originalBlueprint.capabilities.length}`);
    console.log(`Refined capabilities: ${refinedBlueprint.capabilities.length}`);
    console.log(`Confidence change: ${originalBlueprint.confidence.toFixed(2)} -> ${refinedBlueprint.confidence.toFixed(2)}`);
    console.log();

    // Demo 8: Quantum Computing Features
    if (botManager.isQuantumEnabled()) {
      console.log('⚛️ Demo 8: Quantum Computing Features...');
      
      // Create a quantum circuit
      const quantumCircuit = await botManager.createQuantumCircuit(
        'Create a Bell state circuit with 2 qubits using Hadamard and CNOT gates'
      );
      console.log(`✅ Quantum circuit created: ${quantumCircuit.name}`);
      console.log(`   Qubits: ${quantumCircuit.qubits}, Gates: ${quantumCircuit.gates.length}`);

      // Simulate the circuit
      const simulationResult = await botManager.simulateQuantumCircuit(quantumCircuit, 1024);
      console.log(`✅ Quantum simulation completed in ${simulationResult.executionTime}ms`);
      console.log(`   Unique states: ${simulationResult.statistics.uniqueStates}`);
      console.log(`   Entropy: ${simulationResult.statistics.entropy.toFixed(3)}`);

      // Generate a quantum algorithm
      const groverAlgorithm = await botManager.generateQuantumAlgorithm('grover' as any, { qubits: 4 });
      console.log(`✅ Generated Grover's algorithm: ${groverAlgorithm.qubits} qubits, ${groverAlgorithm.gates.length} gates`);

      // Create a quantum-enhanced bot
      const quantumBot = await botManager.createQuantumBot(
        'Create a quantum optimization bot that uses QAOA for solving combinatorial problems'
      );
      console.log(`✅ Quantum bot created: ${quantumBot.blueprint.name}`);
      console.log(`   Enhanced with quantum capabilities`);

      // Generate quantum tutorial
      const tutorial = await botManager.createQuantumTutorial('quantum basics', 'beginner');
      console.log(`✅ Quantum tutorial generated: ${tutorial.title}`);
      console.log(`   Sections: ${tutorial.sections.length}, Exercises: ${tutorial.exercises.length}`);
      console.log();
    }

    console.log('🎉 AI Bot Manager Demo completed successfully!');
    console.log('⚛️ Quantum computing features demonstrated!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await botManager.shutdown();
  }
}

// Event listeners for demonstration
function setupDemoEventListeners(botManager: AIBotManager) {
  botManager.on('bot-registered', (event) => {
    console.log(`🔔 Event: Bot registered - ${event.botId}`);
  });

  botManager.on('bot-generated', (event) => {
    console.log(`🔔 Event: Bot generated - ${event.blueprint.name}`);
  });

  botManager.on('session-started', (event) => {
    console.log(`🔔 Event: Interactive session started - ${event.sessionId}`);
  });

  botManager.on('bot-enabled', (event) => {
    console.log(`🔔 Event: Bot enabled - ${event.botId}`);
  });
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runAIBotDemo().catch(console.error);
}

export { runAIBotDemo };