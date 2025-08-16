/**
 * Sherlock Ω IDE - Bootstrap Entry Point
 * Minimal working version to break the development loop
 */

import { Logger } from './logging/logger';

async function bootstrap() {
  // Simple console logging for bootstrap
  const log = (msg: string) => console.log(`[Bootstrap] ${msg}`);
  
  try {
    log('🚀 Sherlock Ω IDE starting...');
    
    // Initialize core systems in order
    await initializeLogging();
    const orchestrator = await initializeBasicOrchestrator();
    await startWebServer(orchestrator);
    
    log('✨ Sherlock Ω IDE ready for development');
    log('🔥 BEAST MODE IDE: http://localhost:3003');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      log('👋 Sherlock Ω IDE shutting down gracefully');
      process.exit(0);
    });
    
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
  const { BeastModeSherlockIDE } = await import('./web/beast-mode-ide');
  
  const beastIDE = new BeastModeSherlockIDE(3003);
  beastIDE.setOrchestrator(orchestrator);
  
  await beastIDE.start();
  
  // Store server reference for cleanup
  (global as any).sherlockWebServer = beastIDE;
  
  console.log('[Bootstrap] 🔥 BEAST MODE IDE ACTIVATED!');
}

// Start the bootstrap process
bootstrap().catch(console.error);