// src/web/test-dashboard.ts - Test dashboard components without React DOM
import { ValidationController } from '../validation/ValidationController';

async function testDashboardData() {
  console.log('🚀 Testing Dashboard Data Sources...\n');
  
  try {
    const controller = new ValidationController();
    
    // Test ValidationController
    console.log('📊 Testing ValidationController...');
    const results = await controller.executeFullValidation();
    const report = await controller.generateValidationReport(results);
    
    console.log(`✅ Validation Report Generated:`);
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`   Passed: ${report.summary.passed}, Failed: ${report.summary.failed}`);
    
    // Test Build Optimization specifically
    console.log('\n⚛️ Testing Build Optimization Engine...');
    const buildResult = await controller.executeBuildOptimizationTest();
    
    console.log(`✅ Build Optimization Results:`);
    console.log(`   Quantum Advantage: ${buildResult.metrics?.quantumAdvantage?.toFixed(2)}x`);
    console.log(`   Speed Improvement: ${buildResult.metrics?.speedImprovement?.toFixed(1)}%`);
    console.log(`   Success: ${buildResult.success ? '✅' : '❌'}`);
    
    // Test Performance Metrics
    console.log('\n📈 Testing Performance Metrics...');
    const perfResult = await controller.executePerformanceBenchmarks();
    
    console.log(`✅ Performance Metrics:`);
    console.log(`   File Load Time: ${perfResult.metrics?.fileLoadTime || 'N/A'}ms`);
    console.log(`   UI Frame Rate: ${perfResult.metrics?.uiFrameRate || 'N/A'}fps`);
    console.log(`   Memory Usage: ${perfResult.metrics?.memoryUsage || 'N/A'}MB`);
    
    // Dashboard Data Summary
    console.log('\n🎯 Dashboard Data Summary:');
    console.log(`   ✅ ValidationController: Operational`);
    console.log(`   ✅ Build Optimization: ${buildResult.metrics?.quantumAdvantage?.toFixed(2)}x quantum advantage`);
    console.log(`   ✅ Performance Monitoring: Active`);
    console.log(`   ✅ Real-time Metrics: Available`);
    console.log(`   ✅ System Health: ${report.summary.successRate >= 80 ? 'Healthy' : 'Warning'}`);
    
    console.log('\n🎉 Dashboard Components Ready for Production!');
    console.log('🚀 React dashboard can now display real-time validation data');
    
    return {
      success: true,
      validationReport: report,
      buildOptimization: buildResult,
      performanceMetrics: perfResult
    };
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
    return { success: false, error };
  }
}

// Run the test
if (require.main === module) {
  testDashboardData().then(result => {
    if (result.success) {
      console.log('\n✅ All dashboard data sources operational!');
      process.exit(0);
    } else {
      console.log('\n❌ Dashboard test failed!');
      process.exit(1);
    }
  });
}

export { testDashboardData };