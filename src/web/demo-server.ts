/**
 * Sherlock Ω IDE - Standalone Demo Server
 * Web interface without evolution engine for independent operation
 */

import { EnhancedIDEInterface } from './enhanced-ide-interface';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

async function startDemoServer() {
  const logger = new Logger(PlatformType.WEB);
  
  try {
    // Set demo mode environment
    process.env.EVOLUTION_MODE = 'manual';
    
    logger.info('🚀 Starting Sherlock Ω IDE Demo Server...');
    logger.info('🔒 Evolution engine DISABLED - Demo mode active');
    
    // Initialize basic orchestrator without evolution
    let orchestrator = null;
    if (process.env.EVOLUTION_MODE !== 'manual') {
      // Only initialize evolution in non-demo mode
      const { SimpleOrchestrator } = await import('../core/simple-orchestrator');
      orchestrator = new SimpleOrchestrator();
      await orchestrator.initialize();
      logger.info('🧬 Evolution orchestrator initialized');
    } else {
      logger.info('🔒 Evolution orchestrator SKIPPED - Demo mode');
    }
    
    // Start the enhanced IDE interface
    const ideInterface = new EnhancedIDEInterface(3005);
    await ideInterface.start();
    
    logger.info('✨ Demo server ready at http://localhost:3005/demo');
    logger.info('🌐 Web interface running independently');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      logger.info('👋 Demo server shutting down gracefully');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Demo server failed to start:', error);
    process.exit(1);
  }
}

// Start the demo server
startDemoServer().catch(console.error);