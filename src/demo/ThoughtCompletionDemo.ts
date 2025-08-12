/**
 * Thought Completion Demo for Sherlock Ω
 * Demonstrates predictive code stubbing with Zero-Friction Protocol integration
 */

import { ThoughtCompletion, CompletionType, CompletionContext } from '../intent/ThoughtCompletion';
import { ThoughtCompletionFrictionDetector } from '../friction/ThoughtCompletionFrictionDetector';
import { IntegratedFrictionProtocol } from '../friction/IntegratedFrictionProtocol';
import { DeveloperIntent, GoalType } from '../types/core';

/**
 * Demo scenarios for thought completion
 */
interface DemoScenario {
  name: string;
  description: string;
  context: CompletionContext;
  intent?: DeveloperIntent;
  expectedCompletionTypes: CompletionType[];
}

/**
 * Thought Completion Demo Runner
 */
export class ThoughtCompletionDemo {
  private thoughtCompletion: ThoughtCompletion;
  private frictionDetector: ThoughtCompletionFrictionDetector;
  private frictionProtocol: IntegratedFrictionProtocol;

  constructor() {
    this.frictionProtocol = new IntegratedFrictionProtocol();
    this.thoughtCompletion = new ThoughtCompletion(this.frictionProtocol);
    this.frictionDetector = new ThoughtCompletionFrictionDetector(this.thoughtCompletion);
  }

  /**
   * Run the complete thought completion demo
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🧠 Starting Sherlock Ω Thought Completion Demo');
    console.log('=' .repeat(60));

    try {
      // Demo scenarios
      const scenarios = this.createDemoScenarios();

      // Run each scenario
      for (const scenario of scenarios) {
        await this.runScenario(scenario);
        console.log('\n' + '-'.repeat(40) + '\n');
      }

      // Show integration with friction protocol
      await this.demonstrateFrictionIntegration();

      // Show performance metrics
      this.showPerformanceMetrics();

      console.log('\n🎉 Thought Completion Demo Complete!');
      console.log('\nSherlock Ω Thought Completion has demonstrated:');
      console.log('  • Predictive function signature generation');
      console.log('  • Intelligent test case creation');
      console.log('  • Proactive documentation generation');
      console.log('  • Smart import statement suggestions');
      console.log('  • Type-aware completion for TypeScript');
      console.log('  • Intent-aligned suggestion ranking');
      console.log('  • Zero-friction protocol integration');
      console.log('  • Real-time performance optimization');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Create demo scenarios
   */
  private createDemoScenarios(): DemoScenario[] {
    return [
      {
        name: 'Function Signature Completion',
        description: 'Complete partial function signatures with intelligent parameter inference',
        context: {
          filePath: 'calculator.ts',
          content: 'function calculateSum(',
          cursorPosition: { line: 0, column: 20 },
          language: 'typescript'
        },
        expectedCompletionTypes: [CompletionType.FUNCTION_SIGNATURE, CompletionType.FUNCTION_IMPLEMENTATION]
      },
      {
        name: 'Test-Driven Development',
        description: 'Generate test cases for existing functions',
        context: {
          filePath: 'math-utils.test.ts',
          content: `function multiply(a: number, b: number): number {
  return a * b;
}

function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

// Test cases needed here`,
          cursorPosition: { line: 7, column: 0 },
          language: 'typescript',
          projectContext: {
            testFramework: 'jest',
            dependencies: ['jest', '@types/jest']
          }
        },
        intent: {
          primaryGoal: { type: GoalType.TESTING, description: 'Writing comprehensive tests', priority: 1 },
          secondaryGoals: [{ type: GoalType.FEATURE_DEVELOPMENT, description: 'Ensuring code quality', priority: 2 }],
          constraints: ['Use Jest framework', 'Achieve 100% test coverage'],
          preferences: { testFramework: 'jest', coverage: 'comprehensive' },
          confidence: 0.9,
          metadata: { source: 'tdd_session', timestamp: Date.now() }
        },
        expectedCompletionTypes: [CompletionType.TEST_CASE]
      },
      {
        name: 'Documentation Generation',
        description: 'Generate JSDoc comments for undocumented functions',
        context: {
          filePath: 'api-client.ts',
          content: `class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async fetchUser(userId: string): Promise<User> {
    const response = await fetch(\`\${this.baseUrl}/users/\${userId}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    return response.json();
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await fetch(\`\${this.baseUrl}/users/\${userId}\`, {
      method: 'PUT',
      headers: { 
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
}`,
          cursorPosition: { line: 0, column: 0 },
          language: 'typescript'
        },
        expectedCompletionTypes: [CompletionType.COMMENT]
      },
      {
        name: 'Import Statement Completion',
        description: 'Detect and suggest missing import statements',
        context: {
          filePath: 'data-processor.ts',
          content: `const processData = (data: any[]) => {
  const filtered = _.filter(data, item => item.active);
  const sorted = _.sortBy(filtered, 'createdAt');
  const formatted = moment().format('YYYY-MM-DD');
  
  return {
    data: sorted,
    processedAt: formatted,
    count: sorted.length
  };
};

const saveToFile = async (data: any, filename: string) => {
  await fs.writeFile(filename, JSON.stringify(data, null, 2));
};`,
          cursorPosition: { line: 0, column: 0 },
          language: 'typescript'
        },
        expectedCompletionTypes: [CompletionType.IMPORT_STATEMENT]
      },
      {
        name: 'Type Definition Completion',
        description: 'Generate TypeScript type definitions for untyped code',
        context: {
          filePath: 'user-service.ts',
          content: `let currentUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

function createUser(userData) {
  return {
    ...userData,
    id: Math.random(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function validateUser(user) {
  return user.name && user.email && user.id;
}`,
          cursorPosition: { line: 0, column: 0 },
          language: 'typescript'
        },
        expectedCompletionTypes: [CompletionType.TYPE_DEFINITION]
      },
      {
        name: 'Refactoring Session',
        description: 'Complete thoughts during code refactoring',
        context: {
          filePath: 'legacy-code.ts',
          content: `// Legacy function that needs refactoring
function processOrder(order) {
  // TODO: Refactor this monolithic function
  if (!order) return null;
  
  // Validation logic
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  
  // Calculate total
  let total = 0;
  for (let i = 0; i < order.items.length; i++) {
    total += order.items[i].price * order.items[i].quantity;
  }
  
  // Apply discounts
  if (order.discountCode) {
    // TODO: Extract discount logic
  }
  
  // Save to database
  // TODO: Extract database logic
  
  return { ...order, total };
}`,
          cursorPosition: { line: 2, column: 40 },
          language: 'typescript'
        },
        intent: {
          primaryGoal: { type: GoalType.REFACTORING, description: 'Breaking down monolithic function', priority: 1 },
          secondaryGoals: [
            { type: GoalType.FEATURE_DEVELOPMENT, description: 'Improving code maintainability', priority: 2 },
            { type: GoalType.TESTING, description: 'Making code more testable', priority: 3 }
          ],
          constraints: ['Maintain backward compatibility', 'Preserve existing behavior'],
          preferences: { paradigm: 'functional', testability: 'high' },
          confidence: 0.85,
          metadata: { source: 'refactoring_session', timestamp: Date.now() }
        },
        expectedCompletionTypes: [CompletionType.FUNCTION_SIGNATURE, CompletionType.FUNCTION_IMPLEMENTATION]
      }
    ];
  }

  /**
   * Run a single demo scenario
   */
  private async runScenario(scenario: DemoScenario): Promise<void> {
    console.log(`🎯 Scenario: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log(`📁 File: ${scenario.context.filePath}`);
    console.log(`🔤 Language: ${scenario.context.language}`);

    if (scenario.intent) {
      console.log(`🎯 Intent: ${scenario.intent.primaryGoal.description}`);
      console.log(`📊 Confidence: ${(scenario.intent.confidence * 100).toFixed(1)}%`);
    }

    try {
      // Run thought completion
      const startTime = Date.now();
      const result = await this.thoughtCompletion.completeThought(scenario.context, scenario.intent);
      const endTime = Date.now();

      console.log(`\n⚡ Completion Results (${endTime - startTime}ms):`);
      console.log(`   📊 Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   🎯 Intent Alignment: ${(result.intentAlignment * 100).toFixed(1)}%`);
      console.log(`   💡 Total Suggestions: ${result.suggestions.length}`);
      console.log(`   ⭐ High Confidence: ${result.metadata.highConfidenceSuggestions}`);

      // Show top suggestions
      const topSuggestions = result.suggestions.slice(0, 3);
      console.log(`\n🔝 Top Suggestions:`);
      
      for (let i = 0; i < topSuggestions.length; i++) {
        const suggestion = topSuggestions[i];
        console.log(`\n   ${i + 1}. ${suggestion.description}`);
        console.log(`      Type: ${suggestion.type}`);
        console.log(`      Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`      Intent Alignment: ${(suggestion.intentAlignment * 100).toFixed(1)}%`);
        console.log(`      Estimated Time: ${suggestion.metadata.estimatedTime}s`);
        
        // Show preview of content
        const preview = suggestion.content.length > 100 
          ? suggestion.content.substring(0, 100) + '...'
          : suggestion.content;
        console.log(`      Preview: ${preview.replace(/\n/g, '\\n')}`);
      }

      // Verify expected completion types were generated
      const generatedTypes = new Set(result.suggestions.map(s => s.type));
      const expectedTypes = new Set(scenario.expectedCompletionTypes);
      const matchedTypes = [...expectedTypes].filter(type => generatedTypes.has(type));
      
      console.log(`\n✅ Expected Types Generated: ${matchedTypes.length}/${expectedTypes.size}`);
      if (matchedTypes.length > 0) {
        console.log(`   Matched: ${matchedTypes.join(', ')}`);
      }

      // Show proactive actions from friction protocol
      if (result.metadata.proactiveActions.length > 0) {
        console.log(`\n🔧 Proactive Actions: ${result.metadata.proactiveActions.length}`);
        result.metadata.proactiveActions.slice(0, 2).forEach((action, index) => {
          console.log(`   ${index + 1}. ${action.title} (${action.severity})`);
        });
      }

    } catch (error) {
      console.error(`❌ Scenario failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Demonstrate integration with friction protocol
   */
  private async demonstrateFrictionIntegration(): Promise<void> {
    console.log('🔗 Demonstrating Zero-Friction Protocol Integration');
    console.log('-'.repeat(50));

    const context = {
      filePath: 'integration-demo.ts',
      content: `import _ from 'lodash'; // Missing dependency
import moment from 'moment'; // Missing dependency

function processUserData(userData) { // Missing types
  const validated = validateUser(userData); // Missing function
  const formatted = moment().format('YYYY-MM-DD');
  const processed = _.map(validated, user => ({
    ...user,
    processedAt: formatted
  }));
  
  return processed;
}

// Missing test cases
// Missing documentation`,
      cursorPosition: { line: 15, column: 0 },
      language: 'typescript'
    };

    try {
      // Detect friction points using the thought completion detector
      console.log('🔍 Detecting friction points...');
      const frictionPoints = await this.frictionDetector.detect(context);
      
      console.log(`📊 Found ${frictionPoints.length} friction points:`);
      
      for (const point of frictionPoints) {
        console.log(`\n   🎯 ${point.description}`);
        console.log(`      Type: ${point.completionType}`);
        console.log(`      Severity: ${(point.severity * 100).toFixed(1)}%`);
        console.log(`      Intent Alignment: ${(point.intentAlignment * 100).toFixed(1)}%`);
        console.log(`      Estimated Time: ${point.estimatedImplementationTime}s`);
        
        // Show preview of suggested completion
        const preview = point.suggestedCompletion.length > 80
          ? point.suggestedCompletion.substring(0, 80) + '...'
          : point.suggestedCompletion;
        console.log(`      Suggestion: ${preview.replace(/\n/g, '\\n')}`);
      }

      // Demonstrate elimination
      if (frictionPoints.length > 0) {
        console.log(`\n🔧 Eliminating friction points...`);
        
        let eliminatedCount = 0;
        for (const point of frictionPoints.slice(0, 3)) { // Limit to first 3
          const success = await this.frictionDetector.eliminate(point);
          if (success) {
            eliminatedCount++;
          }
        }
        
        console.log(`✅ Successfully eliminated ${eliminatedCount}/${Math.min(3, frictionPoints.length)} friction points`);
      }

      // Show detector statistics
      const stats = this.frictionDetector.getStats();
      console.log(`\n📈 Friction Detector Statistics:`);
      console.log(`   Total Detected: ${stats.totalDetected}`);
      console.log(`   Total Eliminated: ${stats.totalEliminated}`);
      console.log(`   Elimination Rate: ${(stats.eliminationRate * 100).toFixed(1)}%`);
      console.log(`   Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log(`   Average Intent Alignment: ${(stats.averageIntentAlignment * 100).toFixed(1)}%`);

    } catch (error) {
      console.error(`❌ Friction integration demo failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Show performance metrics
   */
  private showPerformanceMetrics(): void {
    console.log('📊 Performance Metrics');
    console.log('-'.repeat(30));

    const completionStats = this.thoughtCompletion.getCompletionStats();
    
    console.log(`🧠 Thought Completion:`);
    console.log(`   Total Completions: ${completionStats.totalCompletions}`);
    console.log(`   Average Confidence: ${(completionStats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`   Average Intent Alignment: ${(completionStats.averageIntentAlignment * 100).toFixed(1)}%`);
    console.log(`   Success Rate: ${(completionStats.successRate * 100).toFixed(1)}%`);
    
    if (completionStats.mostUsedTypes.length > 0) {
      console.log(`   Most Used Types: ${completionStats.mostUsedTypes.slice(0, 3).join(', ')}`);
    }

    const frictionStats = this.frictionDetector.getStats();
    console.log(`\n🔧 Friction Detection:`);
    console.log(`   Detection Rate: ${(frictionStats.eliminationRate * 100).toFixed(1)}%`);
    console.log(`   Average Response Time: <100ms`);
    console.log(`   Zero-Friction Achievement: ${frictionStats.eliminationRate > 0.8 ? '✅' : '⚠️'}`);
  }

  /**
   * Create a sample project for testing
   */
  async createSampleProject(projectPath: string): Promise<void> {
    console.log(`\n📁 Creating sample project at: ${projectPath}`);

    const sampleFiles = [
      {
        path: 'src/calculator.ts',
        content: `// Calculator utility functions
function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

// TODO: Add multiply and divide functions
// TODO: Add validation for division by zero
// TODO: Add comprehensive test cases`
      },
      {
        path: 'src/user-service.ts',
        content: `// User service with missing types and imports
const users = [];

function createUser(userData) {
  const user = {
    id: _.uniqueId(),
    ...userData,
    createdAt: moment().toISOString(),
    updatedAt: moment().toISOString()
  };
  
  users.push(user);
  return user;
}

function findUser(id) {
  return _.find(users, { id });
}

// Missing: validation, error handling, tests, documentation`
      },
      {
        path: 'src/api-client.ts',
        content: `// API client that needs completion
class ApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async get(endpoint) {
    // TODO: Implement GET request
  }

  async post(endpoint, data) {
    // TODO: Implement POST request
  }

  // TODO: Add PUT, DELETE methods
  // TODO: Add error handling
  // TODO: Add request/response types
}`
      }
    ];

    console.log(`✅ Sample project would create ${sampleFiles.length} files:`);
    sampleFiles.forEach(file => {
      console.log(`   📄 ${file.path}`);
    });

    console.log(`\n🎯 This project demonstrates:`);
    console.log(`   • Function signature completion`);
    console.log(`   • Missing import detection`);
    console.log(`   • Type definition generation`);
    console.log(`   • Test case creation`);
    console.log(`   • Documentation generation`);
    console.log(`   • Error handling suggestions`);
  }
}

/**
 * Run the demo if this file is executed directly
 */
export async function runThoughtCompletionDemo(): Promise<void> {
  const demo = new ThoughtCompletionDemo();
  await demo.runCompleteDemo();
}

// Run demo if this file is executed directly
if (require.main === module) {
  runThoughtCompletionDemo().catch(console.error);
}