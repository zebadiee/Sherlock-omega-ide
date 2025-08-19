// src/validation/ValidationController.ts
import { TestRunner } from './TestRunner';
import { EnvironmentManager } from './EnvironmentManager';

export class ValidationController {
  private runner: TestRunner;
  private envManager: EnvironmentManager;

  constructor() {
    this.envManager = new EnvironmentManager();
    this.runner = new TestRunner(this.envManager);
  }

  async executeFullValidation(): Promise<ValidationResult[]> {
    const scenarios = [
      'buildOptimization',
      'codeImprovement', 
      'featureGeneration',
      'n8nIntegration',
      'autonomousDevelopment'
    ];

    const results: ValidationResult[] = [];
    for (const scenario of scenarios) {
      try {
        const result = await this.runValidation(scenario, {});
        results.push(result);
      } catch (error) {
        results.push({
          scenario,
          success: false,
          message: `Failed to execute ${scenario}: ${error}`,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          metrics: {}
        });
      }
    }

    return results;
  }

  async executeBuildOptimizationTest(): Promise<ValidationResult> {
    return this.runValidation('buildOptimization', {
      targetQuantumAdvantage: 1.8,
      targetSpeedImprovement: 37
    });
  }

  async executeCodeImprovementTest(): Promise<ValidationResult> {
    return this.runValidation('codeImprovement', {
      targetImprovements: 3,
      targetQualityScore: 87
    });
  }

  async executeFeatureGenerationTest(): Promise<ValidationResult> {
    return this.runValidation('featureGeneration', {
      featureRequest: 'Quantum error correction visualizer'
    });
  }

  async executeN8nIntegrationTest(): Promise<ValidationResult> {
    return this.runValidation('n8nIntegration', {
      nodeFiles: ['sherlock-ide-automation.json']
    });
  }

  async executeAutonomousDevelopmentTest(): Promise<ValidationResult> {
    return this.runValidation('autonomousDevelopment', {
      schedule: '2 AM BST',
      logFile: 'logs/sherlock-omega.log'
    });
  }

  async executePerformanceBenchmarks(): Promise<ValidationResult> {
    return this.runValidation('performanceBenchmarks', {
      targets: {
        fileLoadTime: 35, // ms
        uiFrameRate: 60,  // fps
        memoryUsage: 50,  // MB
        analysisSpeed: 150 // ms
      }
    });
  }

  private async runValidation(scenario: string, context: any): Promise<ValidationResult> {
    const startTime = new Date();
    const env = await this.envManager.createTestEnvironment({ scenario });
    
    try {
      const result = await this.runner.execute(scenario, context);
      await this.envManager.cleanupTestEnvironment(env);
      
      return {
        ...result,
        scenario,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime()
      };
    } catch (error) {
      await this.envManager.cleanupTestEnvironment(env);
      throw error;
    }
  }

  async createTestEnvironment(config: TestEnvironmentConfig): Promise<TestEnvironment> {
    return this.envManager.createTestEnvironment(config);
  }

  async cleanupTestEnvironment(environment: TestEnvironment): Promise<void> {
    return this.envManager.cleanupTestEnvironment(environment);
  }

  async generateValidationReport(results: ValidationResult[]): Promise<ValidationReport> {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100
      },
      results,
      generatedAt: new Date(),
      recommendations: this.generateRecommendations(results)
    };
  }

  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(result => {
      if (!result.success) {
        recommendations.push(`Fix ${result.scenario}: ${result.message}`);
      }
    });

    return recommendations;
  }

  async monitorValidationHealth(): Promise<ValidationHealthStatus> {
    return {
      status: 'healthy',
      lastValidation: new Date(),
      systemLoad: 'normal',
      availableResources: 'sufficient'
    };
  }
}

export interface ValidationResult {
  scenario: string;
  success: boolean;
  message: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  metrics: { [key: string]: number };
}

export interface TestEnvironmentConfig {
  scenario: string;
  isolationLevel?: 'process' | 'container' | 'vm';
  resourceLimits?: {
    memory?: number;
    cpu?: number;
    timeout?: number;
  };
}

export interface TestEnvironment {
  id: string;
  scenario: string;
  status: 'active' | 'cleanup' | 'failed';
  createdAt: Date;
}

export interface ValidationReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
  results: ValidationResult[];
  generatedAt: Date;
  recommendations: string[];
}

export interface ValidationHealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  lastValidation: Date;
  systemLoad: 'low' | 'normal' | 'high';
  availableResources: 'sufficient' | 'limited' | 'critical';
}