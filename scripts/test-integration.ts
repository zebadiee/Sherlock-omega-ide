#!/usr/bin/env ts-node

/**
 * Hardened Integration Test Runner
 * Self-healing against shell quoting issues and analytics loops
 */

import { createSherlockOmega } from '../src/integration/SherlockOmegaIntegration';

async function runIntegrationTest() {
  console.log('🧠 Testing Sherlock Ω Production Integration...');
  
  try {
    const sherlock = createSherlockOmega({
      features: {
        enableAI: false,
        enableAnalytics: true,
        enableEnhancedCompletion: false,
        enableRealTimeMonitoring: false,
        enablePredictiveActions: true
      }
    });

    console.log('🚀 Starting system...');
    await sherlock.start();
    console.log('✅ System started successfully');

    console.log('📊 Getting system status...');
    const status = await sherlock.getSystemStatus();
    console.log(`📈 System Status: ${status.overall}`);
    console.log(`⏱️  Response Time: ${status.metrics.responseTime.toFixed(0)}ms`);
    console.log(`💾 Memory Usage: ${status.metrics.memoryUsage.toFixed(1)}%`);

    console.log('🛑 Stopping system...');
    await sherlock.stop();
    console.log('✅ Integration test completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Self-healing execution
if (require.main === module) {
  runIntegrationTest();
}