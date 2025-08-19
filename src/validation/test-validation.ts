// src/validation/test-validation.ts
import { ValidationController } from './ValidationController';

async function testValidationSystem() {
  console.log('🚀 Testing System Validation Framework...\n');
  
  const controller = new ValidationController();
  
  try {
    // Test individual validation scenarios
    console.log('📊 Testing Build Optimization...');
    const buildResult = await controller.executeBuildOptimizationTest();
    console.log(`   ${buildResult.success ? '✅' : '❌'} ${buildResult.message}`);
    console.log(`   📈 Metrics:`, buildResult.metrics);
    
    console.log('\n🔧 Testing Code Improvement...');
    const codeResult = await controller.executeCodeImprovementTest();
    console.log(`   ${codeResult.success ? '✅' : '❌'} ${codeResult.message}`);
    console.log(`   📈 Metrics:`, codeResult.metrics);
    
    console.log('\n⚡ Testing Feature Generation...');
    const featureResult = await controller.executeFeatureGenerationTest();
    console.log(`   ${featureResult.success ? '✅' : '❌'} ${featureResult.message}`);
    console.log(`   📈 Metrics:`, featureResult.metrics);
    
    console.log('\n🔗 Testing n8n Integration...');
    const n8nResult = await controller.executeN8nIntegrationTest();
    console.log(`   ${n8nResult.success ? '✅' : '❌'} ${n8nResult.message}`);
    console.log(`   📈 Metrics:`, n8nResult.metrics);
    
    console.log('\n🤖 Testing Autonomous Development...');
    const autoResult = await controller.executeAutonomousDevelopmentTest();
    console.log(`   ${autoResult.success ? '✅' : '❌'} ${autoResult.message}`);
    console.log(`   📈 Metrics:`, autoResult.metrics);
    
    console.log('\n⚡ Testing Performance Benchmarks...');
    const perfResult = await controller.executePerformanceBenchmarks();
    console.log(`   ${perfResult.success ? '✅' : '❌'} ${perfResult.message}`);
    console.log(`   📈 Metrics:`, perfResult.metrics);
    
    // Test full validation suite
    console.log('\n🎯 Running Full Validation Suite...');
    const fullResults = await controller.executeFullValidation();
    
    const report = await controller.generateValidationReport(fullResults);
    console.log('\n📋 Validation Report:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    console.log('\n🎉 System Validation Framework Test Complete!');
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testValidationSystem();
}

export { testValidationSystem };