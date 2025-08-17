/**
 * SHERLOCK Ω SAFETY VALIDATION SYSTEM - ROAD TEST
 * 
 * Comprehensive road test demonstrating the SafetyValidationSystem
 * in action with realistic evolution scenarios.
 */

import { SafetyValidationSystem, Evolution, CodeChange } from './safety-validation-system';
import { PlatformType } from '../../core/whispering-interfaces';

/**
 * Road test scenarios for the SafetyValidationSystem
 */
class SafetyValidationRoadTest {
  private safetySystem: SafetyValidationSystem;

  constructor() {
    this.safetySystem = new SafetyValidationSystem(PlatformType.WEB);
  }

  /**
   * Run comprehensive road test
   */
  async runRoadTest(): Promise<void> {
    console.log('🛡️ SHERLOCK Ω SAFETY VALIDATION SYSTEM - ROAD TEST');
    console.log('=' .repeat(60));
    console.log();

    const scenarios = [
      this.testSafeEvolution,
      this.testInsufficientCoverage,
      this.testHighComplexityEvolution,
      this.testWideImpactEvolution,
      this.testCriticalRiskEvolution,
      this.testMixedRiskEvolution,
      this.testEmptyEvolution,
      this.testErrorHandling
    ];

    for (const scenario of scenarios) {
      try {
        await scenario.call(this);
        console.log();
      } catch (error) {
        console.error(`❌ Scenario failed:`, error);
        console.log();
      }
    }

    console.log('🎯 Road test completed!');
    console.log('=' .repeat(60));
  }

  /**
   * Test 1: Safe evolution that should pass all checks
   */
  private async testSafeEvolution(): Promise<void> {
    console.log('🟢 TEST 1: Safe Evolution (Should Pass)');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'safe-evo-001',
      type: 'feature',
      description: 'Add new user authentication feature',
      affectedFiles: ['src/auth/login.ts', 'src/auth/session.ts'],
      codeChanges: [
        {
          filePath: 'src/auth/login.ts',
          changeType: 'create',
          linesAdded: 80,
          linesRemoved: 0,
          complexity: 6,
          hasTests: true
        },
        {
          filePath: 'src/auth/session.ts',
          changeType: 'create',
          linesAdded: 45,
          linesRemoved: 0,
          complexity: 4,
          hasTests: true
        }
      ],
      testFiles: ['src/__tests__/auth/login.test.ts', 'src/__tests__/auth/session.test.ts'],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'low'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`✅ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`🚨 Issues: ${result.issues.length}`);
    console.log(`💡 Recommendations: ${result.recommendations.length}`);
    
    if (result.recommendations.length > 0) {
      console.log('   Recommendations:');
      result.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * Test 2: Evolution with insufficient test coverage
   */
  private async testInsufficientCoverage(): Promise<void> {
    console.log('🔴 TEST 2: Insufficient Coverage (Should Block)');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'unsafe-evo-002',
      type: 'feature',
      description: 'Add payment processing without tests',
      affectedFiles: ['src/payment/processor.ts', 'src/payment/validator.ts'],
      codeChanges: [
        {
          filePath: 'src/payment/processor.ts',
          changeType: 'create',
          linesAdded: 150,
          linesRemoved: 0,
          complexity: 8,
          hasTests: false // No tests!
        },
        {
          filePath: 'src/payment/validator.ts',
          changeType: 'create',
          linesAdded: 75,
          linesRemoved: 0,
          complexity: 5,
          hasTests: true
        }
      ],
      testFiles: ['src/__tests__/payment/validator.test.ts'],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'medium'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`❌ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`🚨 Issues: ${result.issues.length}`);
    
    console.log('   Issues Found:');
    result.issues.forEach(issue => {
      console.log(`   - ${issue.severity.toUpperCase()}: ${issue.description}`);
      console.log(`     Blocking: ${issue.blocking ? 'YES' : 'NO'}`);
    });
    
    console.log('   Recommendations:');
    result.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }

  /**
   * Test 3: High complexity evolution
   */
  private async testHighComplexityEvolution(): Promise<void> {
    console.log('🟡 TEST 3: High Complexity Evolution');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'complex-evo-003',
      type: 'refactor',
      description: 'Complex algorithm optimization',
      affectedFiles: ['src/algorithms/optimizer.ts'],
      codeChanges: [
        {
          filePath: 'src/algorithms/optimizer.ts',
          changeType: 'modify',
          linesAdded: 200,
          linesRemoved: 150,
          complexity: 18, // Very high complexity
          hasTests: true
        }
      ],
      testFiles: ['src/__tests__/algorithms/optimizer.test.ts'],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'high'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`❌ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`🚨 Issues: ${result.issues.length}`);
    
    console.log('   Risk Factors:');
    result.riskAssessment.factors.forEach(factor => {
      console.log(`   - ${factor.type}: Impact ${(factor.impact * 100).toFixed(0)}%, Likelihood ${(factor.likelihood * 100).toFixed(0)}%`);
      console.log(`     ${factor.description}`);
    });
  }

  /**
   * Test 4: Wide impact evolution affecting many files
   */
  private async testWideImpactEvolution(): Promise<void> {
    console.log('🟠 TEST 4: Wide Impact Evolution');
    console.log('-'.repeat(40));

    const manyFiles = Array.from({ length: 20 }, (_, i) => `src/modules/module${i}.ts`);
    const manyChanges: CodeChange[] = manyFiles.map(filePath => ({
      filePath,
      changeType: 'modify' as const,
      linesAdded: 25,
      linesRemoved: 10,
      complexity: 4,
      hasTests: true
    }));

    const evolution: Evolution = {
      id: 'wide-evo-004',
      type: 'optimization',
      description: 'System-wide performance optimization',
      affectedFiles: manyFiles,
      codeChanges: manyChanges,
      testFiles: manyFiles.map(f => f.replace('src/', 'src/__tests__/').replace('.ts', '.test.ts')),
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'medium'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`✅ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`📁 Files Affected: ${evolution.affectedFiles.length}`);
    console.log(`🔄 Rollback Complexity: ${(result.riskAssessment.rollbackComplexity * 100).toFixed(1)}%`);
    
    console.log('   Mitigation Strategies:');
    result.riskAssessment.mitigationStrategies.forEach(strategy => {
      console.log(`   - ${strategy}`);
    });
  }

  /**
   * Test 5: Critical risk evolution that should be blocked
   */
  private async testCriticalRiskEvolution(): Promise<void> {
    console.log('🔴 TEST 5: Critical Risk Evolution (Should Block)');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'critical-evo-005',
      type: 'refactor',
      description: 'Dangerous security refactor without tests',
      affectedFiles: ['src/security/auth.ts', 'src/security/crypto.ts'],
      codeChanges: [
        {
          filePath: 'src/security/auth.ts',
          changeType: 'modify',
          linesAdded: 300,
          linesRemoved: 200,
          complexity: 25, // Extremely high complexity
          hasTests: false // No tests for security code!
        },
        {
          filePath: 'src/security/crypto.ts',
          changeType: 'modify',
          linesAdded: 150,
          linesRemoved: 100,
          complexity: 20,
          hasTests: false
        }
      ],
      testFiles: [],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'critical'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`❌ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`🚨 Blocking Issues: ${result.issues.filter(i => i.blocking).length}`);
    
    console.log('   CRITICAL ISSUES:');
    result.issues.forEach(issue => {
      if (issue.blocking) {
        console.log(`   🚫 ${issue.type.toUpperCase()}: ${issue.description}`);
      }
    });

    // Test deployment blocking
    try {
      this.safetySystem.blockDeploymentForInsufficientCoverage(evolution);
    } catch (error) {
      console.log(`   🛑 Deployment blocked: ${(error as Error).message}`);
    }
  }

  /**
   * Test 6: Mixed risk evolution with some issues
   */
  private async testMixedRiskEvolution(): Promise<void> {
    console.log('🟡 TEST 6: Mixed Risk Evolution');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'mixed-evo-006',
      type: 'feature',
      description: 'Feature with mixed test coverage and complexity',
      affectedFiles: ['src/feature/core.ts', 'src/feature/utils.ts', 'src/feature/helpers.ts'],
      codeChanges: [
        {
          filePath: 'src/feature/core.ts',
          changeType: 'create',
          linesAdded: 120,
          linesRemoved: 0,
          complexity: 12, // High complexity
          hasTests: true
        },
        {
          filePath: 'src/feature/utils.ts',
          changeType: 'create',
          linesAdded: 80,
          linesRemoved: 0,
          complexity: 6,
          hasTests: true
        },
        {
          filePath: 'src/feature/helpers.ts',
          changeType: 'create',
          linesAdded: 40,
          linesRemoved: 0,
          complexity: 3,
          hasTests: false // Missing tests
        }
      ],
      testFiles: ['src/__tests__/feature/core.test.ts', 'src/__tests__/feature/utils.test.ts'],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'medium'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`❌ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    
    console.log('   Coverage Analysis:');
    console.log(`   - Total Lines: ${evolution.codeChanges.reduce((sum, c) => sum + c.linesAdded, 0)}`);
    console.log(`   - Tested Lines: ${evolution.codeChanges.filter(c => c.hasTests).reduce((sum, c) => sum + c.linesAdded, 0)}`);
    console.log(`   - Uncovered Segments: ${result.coverageMetrics.uncoveredSegments.length}`);
    
    result.coverageMetrics.uncoveredSegments.forEach(segment => {
      console.log(`     - ${segment.filePath} (complexity: ${segment.complexity})`);
    });
  }

  /**
   * Test 7: Empty evolution (edge case)
   */
  private async testEmptyEvolution(): Promise<void> {
    console.log('⚪ TEST 7: Empty Evolution (Edge Case)');
    console.log('-'.repeat(40));

    const evolution: Evolution = {
      id: 'empty-evo-007',
      type: 'bugfix',
      description: 'Empty evolution for testing',
      affectedFiles: [],
      codeChanges: [],
      testFiles: [],
      timestamp: new Date(),
      author: 'autonomous-system',
      riskLevel: 'low'
    };

    const result = await this.safetySystem.validateEvolutionSafety(evolution);
    
    console.log(`✅ Valid: ${result.isValid}`);
    console.log(`📊 Coverage: ${(result.coverageMetrics.overall * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${result.riskAssessment.overallRisk}`);
    console.log(`📝 Note: Empty evolution = 100% coverage (no code to test)`);
  }

  /**
   * Test 8: Error handling scenario
   */
  private async testErrorHandling(): Promise<void> {
    console.log('🔧 TEST 8: Error Handling & Safe Mode');
    console.log('-'.repeat(40));

    console.log('Testing safe mode activation...');
    
    try {
      await this.safetySystem.enterSafeMode();
      console.log('✅ Safe mode activated successfully');
    } catch (error) {
      console.log(`❌ Safe mode activation failed: ${(error as Error).message}`);
    }

    console.log('Getting validation statistics...');
    const stats = this.safetySystem.getValidationStatistics();
    console.log(`📊 Total Validations: ${stats.totalValidations}`);
    console.log(`📈 Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Processing Time: ${stats.averageProcessingTime}ms`);
    console.log(`🚫 Blocked Deployments: ${stats.blockedDeployments}`);
  }
}

/**
 * Run the road test
 */
async function runRoadTest(): Promise<void> {
  const roadTest = new SafetyValidationRoadTest();
  await roadTest.runRoadTest();
}

// Export for use in other modules
export { SafetyValidationRoadTest, runRoadTest };

// Run if called directly
if (require.main === module) {
  runRoadTest().catch(console.error);
}