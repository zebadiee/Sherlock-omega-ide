/**
 * Interactive SafetyValidationSystem Test
 * Create and test your own evolution scenarios
 */

// Simplified SafetyValidationSystem
class SafetyValidationSystem {
  constructor() {
    this.MINIMUM_COVERAGE_THRESHOLD = 0.95;
    this.MAX_COMPLEXITY_THRESHOLD = 10;
  }

  async validateEvolution(evolutionData) {
    console.log('🛡️  TESTING YOUR EVOLUTION');
    console.log('='.repeat(50));
    console.log(`📝 ${evolutionData.description}`);
    console.log(`📁 Files: ${evolutionData.files.length}`);
    console.log();

    // Calculate coverage
    const totalLines = evolutionData.files.reduce((sum, file) => sum + file.lines, 0);
    const testedLines = evolutionData.files.reduce((sum, file) => 
      sum + (file.hasTests ? file.lines : 0), 0);
    const coverage = totalLines > 0 ? testedLines / totalLines : 1.0;

    // Calculate complexity
    const avgComplexity = evolutionData.files.reduce((sum, file) => 
      sum + file.complexity, 0) / evolutionData.files.length;

    // Assess risk
    let riskLevel = 'low';
    const riskFactors = [];

    if (coverage < this.MINIMUM_COVERAGE_THRESHOLD) {
      riskLevel = 'critical';
      riskFactors.push(`Insufficient coverage: ${(coverage * 100).toFixed(1)}%`);
    }

    if (avgComplexity > this.MAX_COMPLEXITY_THRESHOLD) {
      riskLevel = avgComplexity > 15 ? 'critical' : 'high';
      riskFactors.push(`High complexity: ${avgComplexity.toFixed(1)}`);
    }

    if (evolutionData.files.length > 10) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      riskFactors.push(`Wide impact: ${evolutionData.files.length} files`);
    }

    // Determine if valid
    const isValid = coverage >= this.MINIMUM_COVERAGE_THRESHOLD && 
                   !['critical', 'high'].includes(riskLevel);

    // Calculate confidence
    let confidence = coverage;
    const riskPenalty = { 'low': 0, 'medium': 0.1, 'high': 0.3, 'critical': 0.6 }[riskLevel];
    confidence *= (1 - riskPenalty);

    // Display results
    console.log('📊 ANALYSIS RESULTS:');
    console.log(`   Coverage: ${(coverage * 100).toFixed(1)}% ${coverage >= 0.95 ? '✅' : '❌'}`);
    console.log(`   Complexity: ${avgComplexity.toFixed(1)} ${avgComplexity <= 10 ? '✅' : '❌'}`);
    console.log(`   Risk Level: ${riskLevel.toUpperCase()} ${['low', 'medium'].includes(riskLevel) ? '✅' : '❌'}`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log();

    if (riskFactors.length > 0) {
      console.log('⚠️  RISK FACTORS:');
      riskFactors.forEach(factor => console.log(`   - ${factor}`));
      console.log();
    }

    console.log(`🎯 RESULT: ${isValid ? '🟢 APPROVED FOR DEPLOYMENT' : '🔴 BLOCKED - NEEDS FIXES'}`);
    
    if (!isValid) {
      console.log();
      console.log('🔧 TO FIX:');
      if (coverage < 0.95) {
        const missingTests = evolutionData.files.filter(f => !f.hasTests).length;
        console.log(`   - Add tests for ${missingTests} files to reach 95% coverage`);
      }
      if (avgComplexity > 10) {
        console.log(`   - Refactor complex code (current: ${avgComplexity.toFixed(1)}, max: 10)`);
      }
    }

    console.log('='.repeat(50));
    return { isValid, coverage, riskLevel, confidence };
  }
}

// Test scenarios you can try
const scenarios = {
  // Scenario 1: Safe feature
  safeFeature: {
    description: "Add user profile feature with full test coverage",
    files: [
      { name: "profile.ts", lines: 120, complexity: 6, hasTests: true },
      { name: "avatar.ts", lines: 80, complexity: 4, hasTests: true },
      { name: "settings.ts", lines: 60, complexity: 3, hasTests: true }
    ]
  },

  // Scenario 2: Risky payment feature
  riskyPayment: {
    description: "Add payment processing without adequate tests",
    files: [
      { name: "payment.ts", lines: 200, complexity: 15, hasTests: false },
      { name: "stripe.ts", lines: 150, complexity: 12, hasTests: false },
      { name: "validation.ts", lines: 80, complexity: 5, hasTests: true }
    ]
  },

  // Scenario 3: Complex AI feature
  complexAI: {
    description: "Machine learning model with high complexity",
    files: [
      { name: "neural-net.ts", lines: 300, complexity: 22, hasTests: true },
      { name: "optimizer.ts", lines: 180, complexity: 18, hasTests: true }
    ]
  },

  // Scenario 4: Wide impact refactor
  wideRefactor: {
    description: "System-wide refactoring affecting many files",
    files: Array.from({ length: 15 }, (_, i) => ({
      name: `module${i}.ts`,
      lines: 50,
      complexity: 6,
      hasTests: true
    }))
  }
};

// Main function to run tests
async function runInteractiveTest() {
  const safety = new SafetyValidationSystem();
  
  console.log('🛡️  SHERLOCK Ω SAFETY VALIDATION - INTERACTIVE TEST');
  console.log('='.repeat(60));
  console.log();

  // Test all scenarios
  for (const [name, scenario] of Object.entries(scenarios)) {
    console.log(`🧪 TESTING: ${name.toUpperCase()}`);
    await safety.validateEvolution(scenario);
    console.log();
  }

  console.log('🎯 All scenarios tested! Try modifying the scenarios above to experiment.');
}

// Run the interactive test
runInteractiveTest().catch(console.error);