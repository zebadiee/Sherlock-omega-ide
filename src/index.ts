/**
 * Sherlock Ω IDE - Bootstrap Entry Point
 * Enhanced with process management and quantum computing support
 */

import { Logger } from './logging/logger';
import { processManager } from './utils/process-manager';

async function bootstrap() {
  // Simple console logging for bootstrap
  const log = (msg: string) => console.log(`[Bootstrap] ${msg}`);
  
  try {
    log('🚀 Sherlock Ω IDE starting...');
    
    // Initialize process management
    processManager.startMemoryMonitoring();
    log('🛡️  Process management initialized');
    
    // Kill any processes on our ports
    await processManager.killProcessOnPort(3000);
    await processManager.killProcessOnPort(3001);
    await processManager.killProcessOnPort(3002);
    await processManager.killProcessOnPort(3003);
    await processManager.killProcessOnPort(3005);
    
    // Enable autonomous evolution for Cycle 5
    process.env.EVOLUTION_MODE = 'auto';
    log('🔥 Evolution mode set to AUTO - autonomous evolution ENABLED');
    
    // Initialize core systems in order
    await initializeLogging();
    const orchestrator = await initializeBasicOrchestrator();
    await startWebServer(orchestrator);
    
    log('✨ Sherlock Ω IDE ready for development');
    log('🔥 CYCLE 5 EVOLUTION IDE: http://localhost:3005');
    
    // Register cleanup handlers
    processManager.registerCleanupHandler(async () => {
      log('🧹 Cleaning up web servers...');
      const enhancedIDE = (global as any).sherlockWebServer;
      const beastIDE = (global as any).sherlockBeastServer;
      const orchestrator = (global as any).sherlockOrchestrator;
      
      if (enhancedIDE && typeof enhancedIDE.stop === 'function') {
        await enhancedIDE.stop();
      }
      if (beastIDE && typeof beastIDE.stop === 'function') {
        await beastIDE.stop();
      }
      if (orchestrator && typeof orchestrator.shutdown === 'function') {
        await orchestrator.shutdown();
      }
    });
    
    log('✅ Process cleanup handlers registered');
    
  } catch (error) {
    console.error('💥 Bootstrap failed:', error);
    process.exit(1);
  }
}

async function initializeLogging(): Promise<void> {
  // Logging will be initialized by each component
  console.log('📝 Logging system ready');
}

async function initializeBasicOrchestrator(): Promise<any> {
  // Import the simplified orchestrator
  const { SimpleOrchestrator } = await import('./core/simple-orchestrator');
  
  const orchestrator = new SimpleOrchestrator();
  await orchestrator.initialize();
  
  // Make orchestrator globally available for testing
  (global as any).sherlockOrchestrator = orchestrator;
  
  // Test the pattern keeper with some sample code
  await testPatternKeeper(orchestrator);
  
  // Initialize Blueprint-Driven Evolution if in auto mode
  if (process.env.EVOLUTION_MODE === 'auto') {
    const { EvolutionController } = await import('./core/evolution-controller');
    const evolutionController = new EvolutionController('DESKTOP' as any);
    await evolutionController.initializeBlueprintDrivenEvolution();
    console.log('[Bootstrap] 🤖 Blueprint-Driven Evolution activated');
  }
  
  console.log('[Bootstrap] 🧠 Basic orchestrator initialized and tested');
  return orchestrator;
}

async function testPatternKeeper(orchestrator: any): Promise<void> {
  const testCode = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price == undefined) {
      console.log("Missing price");
      continue;
    }
    total += items[i].price;
  }
  return total
}`;

  try {
    const suggestions = await orchestrator.quickAnalysis(testCode);
    console.log('[Bootstrap] 🔍 Pattern Keeper test results:');
    suggestions.forEach((suggestion: string) => {
      console.log(`[Bootstrap]   • ${suggestion}`);
    });
  } catch (error) {
    console.log('[Bootstrap] ⚠️  Pattern Keeper test failed:', error);
  }
}

async function startWebServer(orchestrator: any): Promise<void> {
  const { EnhancedIDEInterface } = await import('./web/enhanced-ide-interface');
  const { FullSherlockIDE } = await import('./web/full-ide');
  
  // Start Enhanced IDE on port 3005
  const enhancedIDE = new EnhancedIDEInterface(3005);
  await enhancedIDE.start();
  
  // Start Beast Mode IDE on port 3003
  const beastIDE = new FullSherlockIDE(3003);
  beastIDE.setOrchestrator(orchestrator);
  await beastIDE.start();
  
  // Store server references for cleanup
  (global as any).sherlockWebServer = enhancedIDE;
  (global as any).sherlockBeastServer = beastIDE;
  
  console.log('[Bootstrap] 🌟 ENHANCED SHERLOCK Ω IDE: http://localhost:3005');
  console.log('[Bootstrap] 🔥 BEAST MODE IDE: http://localhost:3003');
}

// Start the bootstrap process
bootstrap().catch(console.error);