#!/usr/bin/env node

/**
 * Sherlock Ω - Zero-Friction Development Environment
 * Main Entry Point for Development and Production
 */

import { createSherlockOmega } from './integration/SherlockOmegaIntegration';

async function main() {
  console.log('🧠 Starting Sherlock Ω - Zero-Friction Development Environment...');
  console.log('');

  try {
    // Create Sherlock Ω instance with full features enabled
    const sherlock = createSherlockOmega({
      features: {
        enableAI: true,
        enableAnalytics: true,
        enableEnhancedCompletion: true,
        enableRealTimeMonitoring: true,
        enablePredictiveActions: true
      }
    });

    console.log('🚀 Initializing system components...');
    await sherlock.start();
    
    console.log('');
    console.log('✅ Sherlock Ω is now active!');
    console.log('');
    console.log('🎯 Zero-friction development features:');
    console.log('  • Real-time friction detection');
    console.log('  • Automatic dependency installation');
    console.log('  • AI-powered thought completion');
    console.log('  • Predictive action planning');
    console.log('  • Performance analytics');
    console.log('');
    console.log('📊 System Status:');
    
    // Get and display system status
    const status = await sherlock.getSystemStatus();
    console.log(`  • Overall Health: ${status.overall}`);
    console.log(`  • Response Time: ${status.metrics.responseTime.toFixed(0)}ms`);
    console.log(`  • Memory Usage: ${status.metrics.memoryUsage.toFixed(1)}%`);
    console.log(`  • Uptime: ${Math.floor(status.metrics.uptime / 1000)}s`);
    console.log('');
    console.log('🔗 Connect your editor to start experiencing zero-friction development!');
    console.log('');
    console.log('Press Ctrl+C to stop Sherlock Ω');

    // Keep the process alive and handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('');
      console.log('🛑 Shutting down Sherlock Ω...');
      
      try {
        await sherlock.stop();
        console.log('✅ Sherlock Ω stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      console.log('');
      console.log('🛑 Received SIGTERM, shutting down...');
      
      try {
        await sherlock.stop();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Keep process alive
    await new Promise(() => {}); // Infinite promise

  } catch (error) {
    console.error('');
    console.error('❌ Failed to start Sherlock Ω:', error);
    console.error('');
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main();
}

export { main };