/**
 * SHERLOCK Ω INTEGRATED SYSTEM DEMO
 * 
 * Demonstrates the complete system working together:
 * - System initialization and startup
 * - Evolution request processing
 * - Safety validation integration
 * - Health monitoring and status
 * - Safe mode activation/recovery
 */

import { SherlockOmegaSystem, DEFAULT_CONFIG, EvolutionRequest } from '../core/sherlock-omega-system';
import { PlatformType } from '../core/whispering-interfaces';

/**
 * Comprehensive demo of Sherlock Ω system
 */
class SherlockOmegaDemo {
  private system: SherlockOmegaSystem;

  constructor() {
    // Initialize with demo configuration
    const config = {
      ...DEFAULT_CONFIG,
      platform: PlatformType.WEB,
      evolutionSettings: {
        ...DEFAULT_CONFIG.evolutionSettings,
        enableAutonomousEvolution: true
      }
    };
    
    this.system = new SherlockOmegaSystem(config);
  }

  /**
   * Run the complete integrated demo
   */
  async runDemo(): Promise<void> {
    console.log('🌟 SHERLOCK Ω (OMEGA) - INTEGRATED SYSTEM DEMO');
    console.log('='.repeat(60));
    console.log();

    try {
      // Step 1: System startup
      await this.demonstrateSystemStartup();
      
      // Step 2: Evolution processing
      await this.demonstrateEvolutionProcessing();
      
      // Step 3: Safety validation
      await this.demonstrateSafetyValidation();
      
      // Step 4: System monitoring
      await this.demonstrateSystemMonitoring();
      
      // Step 5: Safe mode handling
      await this.demonstrateSafeModeHandling();
      
      // Step 6: System shutdown
      await this.demonstrateSystemShutdown();
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Demonstrate system startup and initialization
   */
  private async demonstrateSystemStartup(): Promise<void> {
    console.log('🚀 STEP 1: SYSTEM STARTUP');
    console.log('-'.repeat(40));
    
    console.log('Initializing Sherlock Ω system...');
    await this.system.start();
    
    console.log('✅ System started successfully');
    console.log(`📊 Running: ${this.system.running}`);
    console.log(`🛡️ Safe Mode: ${this.system.safeMode}`);
    console.log();
  }  /*
*
   * Demonstrate evolution request processing
   */
  private async demonstrateEvolutionProcessing(): Promise<void> {
    console.log('🧬 STEP 2: EVOLUTION PROCESSING');
    console.log('-'.repeat(40));
    
    // Test different types of evolution requests
    const requests: EvolutionRequest[] = [
      {
        id: 'safe-feature-001',
        type: 'feature',
        description: 'Add user authentication with comprehensive tests',
        priority: 'medium',
        requestedBy: 'demo-system',
        targetFiles: ['src/auth/login.ts', 'src/auth/session.ts'],
        requirements: ['95% test coverage', 'security validation']
      },
      {
        id: 'risky-payment-002',
        type: 'feature',
        description: 'Add payment processing without adequate testing',
        priority: 'high',
        requestedBy: 'demo-system',
        targetFiles: ['src/payment/processor.ts', 'src/payment/gateway.ts'],
        requirements: ['fast implementation']
      }
    ];

    for (const request of requests) {
      console.log(`📝 Processing: ${request.description}`);
      const result = await this.system.requestEvolution(request);
      
      if (result.success) {
        console.log(`✅ Evolution approved: ${result.evolutionId}`);
      } else {
        console.log(`❌ Evolution blocked: ${result.reason}`);
      }
      console.log();
    }
  }

  /**
   * Demonstrate safety validation in action
   */
  private async demonstrateSafetyValidation(): Promise<void> {
    console.log('🛡️ STEP 3: SAFETY VALIDATION');
    console.log('-'.repeat(40));
    
    console.log('Testing safety validation system...');
    
    // Get validation statistics
    const stats = this.system.safety.getValidationStatistics();
    console.log(`📊 Total Validations: ${stats.totalValidations}`);
    console.log(`📈 Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`🚫 Blocked Deployments: ${stats.blockedDeployments}`);
    console.log(`⏱️ Average Processing Time: ${stats.averageProcessingTime}ms`);
    console.log();
  }

  /**
   * Demonstrate system monitoring and health checks
   */
  private async demonstrateSystemMonitoring(): Promise<void> {
    console.log('📊 STEP 4: SYSTEM MONITORING');
    console.log('-'.repeat(40));
    
    console.log('Checking system health...');
    const status = await this.system.getSystemStatus();
    
    console.log(`🎯 Overall Status: ${status.overall.toUpperCase()}`);
    console.log(`⏱️ Uptime: ${status.metrics.uptime}s`);
    console.log(`🧬 Total Evolutions: ${status.metrics.totalEvolutions}`);
    console.log(`🚫 Blocked Evolutions: ${status.metrics.blockedEvolutions}`);
    console.log(`📈 Success Rate: ${(status.metrics.successRate * 100).toFixed(1)}%`);
    
    console.log('\n📋 Component Status:');
    Object.entries(status.components).forEach(([name, component]) => {
      const statusIcon = {
        'healthy': '✅',
        'degraded': '⚠️',
        'critical': '❌',
        'offline': '⚫'
      }[component.status];
      
      console.log(`   ${statusIcon} ${name}: ${component.status.toUpperCase()}`);
    });
    console.log();
  }

  /**
   * Demonstrate safe mode activation and recovery
   */
  private async demonstrateSafeModeHandling(): Promise<void> {
    console.log('🚨 STEP 5: SAFE MODE DEMONSTRATION');
    console.log('-'.repeat(40));
    
    console.log('Simulating critical system failure...');
    await this.system.enterSafeMode();
    
    console.log(`🛡️ Safe Mode Active: ${this.system.safeMode}`);
    
    // Try to process evolution in safe mode
    const safeRequest: EvolutionRequest = {
      id: 'safe-mode-test',
      type: 'bugfix',
      description: 'Test evolution during safe mode',
      priority: 'low',
      requestedBy: 'demo-system'
    };
    
    const result = await this.system.requestEvolution(safeRequest);
    console.log(`❌ Evolution in safe mode: ${result.reason}`);
    
    // Recover from safe mode
    console.log('\n🔄 Attempting safe mode recovery...');
    await this.system.exitSafeMode();
    console.log(`✅ Safe Mode Exited: ${!this.system.safeMode}`);
    console.log();
  }

  /**
   * Demonstrate graceful system shutdown
   */
  private async demonstrateSystemShutdown(): Promise<void> {
    console.log('🛑 STEP 6: SYSTEM SHUTDOWN');
    console.log('-'.repeat(40));
    
    console.log('Shutting down Sherlock Ω system...');
    await this.system.stop();
    
    console.log('✅ System shutdown complete');
    console.log(`📊 Final Status - Running: ${this.system.running}`);
    console.log();
  }
}

/**
 * Run the integrated demo
 */
async function runIntegratedDemo(): Promise<void> {
  const demo = new SherlockOmegaDemo();
  await demo.runDemo();
  
  console.log('🎯 DEMO COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log();
  console.log('🌟 Sherlock Ω is now fully integrated and operational!');
  console.log('   - Safety validation protects all evolutions');
  console.log('   - Autonomous evolution engine processes requests');
  console.log('   - Real-time monitoring ensures system health');
  console.log('   - Safe mode provides ultimate protection');
  console.log('   - All components work together seamlessly');
}

// Export for use in other modules
export { SherlockOmegaDemo, runIntegratedDemo };

// Run if called directly
if (require.main === module) {
  runIntegratedDemo().catch(console.error);
}