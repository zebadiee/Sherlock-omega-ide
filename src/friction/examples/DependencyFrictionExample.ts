/**
 * Example usage of Dependency Friction Detector
 * Demonstrates dependency friction detection and elimination in action
 */

import { DependencyFrictionDetector, DependencyDetectionContext } from '../DependencyFrictionDetector';
import { SimpleSyntaxFrictionDetector } from '../SimpleSyntaxFrictionDetector';
import { SimpleZeroFrictionProtocol } from '../SimpleZeroFrictionProtocol';

/**
 * Example demonstrating dependency friction detection and elimination
 */
export class DependencyFrictionExample {
  private dependencyDetector: DependencyFrictionDetector;
  private protocol: SimpleZeroFrictionProtocol;

  constructor() {
    this.dependencyDetector = new DependencyFrictionDetector();
    
    // Create protocol with multiple detectors
    this.protocol = new SimpleZeroFrictionProtocol([
      new SimpleSyntaxFrictionDetector(),
      this.dependencyDetector
    ]);
  }

  /**
   * Run example with sample TypeScript code that has missing dependencies
   */
  async runExample(): Promise<void> {
    console.log('🚀 Running Dependency Friction Detection Example');
    console.log('=' .repeat(50));

    // Sample code with missing dependencies
    const sampleCode = `
import _ from 'lodash';
import moment from 'moment';
import { Request, Response } from 'express';
import React from 'react';
import axios from 'axios';

// Using lodash
const users = _.map([1, 2, 3], (id) => ({ id, name: \`User \${id}\` }));

// Using moment
const now = moment().format('YYYY-MM-DD');

// Using express types
function handler(req: Request, res: Response) {
  res.json({ users, timestamp: now });
}

// Using React
const MyComponent = () => React.createElement('div', null, 'Hello World');

// Using axios
axios.get('/api/users').then(response => console.log(response.data));
`;

    const context: DependencyDetectionContext = {
      filePath: 'src/example.ts',
      content: sampleCode,
      checkPackageJson: true,
      workspaceRoot: process.cwd()
    };

    try {
      // Run dependency detection only
      console.log('\n📦 Running Dependency Friction Detection...');
      const frictionPoints = await this.dependencyDetector.detect(context);
      
      console.log(`\nDetected ${frictionPoints.length} dependency friction points:`);
      for (const point of frictionPoints) {
        console.log(`  • ${point.description}`);
        console.log(`    - Severity: ${point.severity}`);
        console.log(`    - Auto-installable: ${point.autoInstallable}`);
        console.log(`    - Install command: ${point.installCommand}`);
        console.log(`    - Suggestions: ${point.suggestions.join(', ')}`);
        console.log('');
      }

      // Attempt elimination
      console.log('🔧 Attempting to eliminate dependency friction...');
      let eliminatedCount = 0;
      
      for (const point of frictionPoints) {
        const success = await this.dependencyDetector.eliminate(point);
        if (success) {
          eliminatedCount++;
          console.log(`  ✅ Successfully eliminated: ${point.dependencyName}`);
        } else {
          console.log(`  ❌ Failed to eliminate: ${point.dependencyName}`);
        }
      }

      console.log(`\n📊 Elimination Summary:`);
      console.log(`  - Total friction points: ${frictionPoints.length}`);
      console.log(`  - Successfully eliminated: ${eliminatedCount}`);
      console.log(`  - Elimination rate: ${frictionPoints.length > 0 ? (eliminatedCount / frictionPoints.length * 100).toFixed(1) : 0}%`);

      // Show detector statistics
      const stats = this.dependencyDetector.getDependencyStats();
      console.log(`\n📈 Detector Statistics:`);
      console.log(`  - Total detected: ${stats.totalDetected}`);
      console.log(`  - Total attempted: ${stats.totalAttempted}`);
      console.log(`  - Total eliminated: ${stats.totalEliminated}`);
      console.log(`  - Auto-installable count: ${stats.autoInstallableCount}`);
      console.log(`  - Active package manager: ${stats.activePackageManager}`);

      // Run full protocol
      console.log('\n🎯 Running Full Zero-Friction Protocol...');
      const protocolResult = await this.protocol.run(context);
      
      console.log(`\n🏁 Protocol Execution Complete:`);
      console.log(`  - Total friction: ${protocolResult.totalFriction}`);
      console.log(`  - Eliminated: ${protocolResult.eliminatedFriction}`);
      console.log(`  - Failed: ${protocolResult.failedElimination}`);
      console.log(`  - Execution time: ${protocolResult.executionTime}ms`);

    } catch (error) {
      console.error('❌ Example execution failed:', error);
    }
  }

  /**
   * Demonstrate package.json friction detection
   */
  async demonstratePackageJsonFriction(): Promise<void> {
    console.log('\n📋 Demonstrating package.json Friction Detection');
    console.log('-'.repeat(50));

    // Create a context that checks package.json
    const context: DependencyDetectionContext = {
      checkPackageJson: true,
      workspaceRoot: process.cwd()
    };

    try {
      const frictionPoints = await this.dependencyDetector.detect(context);
      
      const packageJsonFriction = frictionPoints.filter(p => p.filePath === 'package.json');
      
      if (packageJsonFriction.length > 0) {
        console.log(`Found ${packageJsonFriction.length} package.json friction points:`);
        for (const point of packageJsonFriction) {
          console.log(`  • ${point.description}`);
          console.log(`    - Command: ${point.installCommand}`);
        }
      } else {
        console.log('✅ No package.json friction detected - all dependencies are properly installed');
      }

    } catch (error) {
      console.error('❌ Package.json friction detection failed:', error);
    }
  }

  /**
   * Show different package manager behaviors
   */
  async demonstratePackageManagerDetection(): Promise<void> {
    console.log('\n📦 Demonstrating Package Manager Detection');
    console.log('-'.repeat(50));

    const stats = this.dependencyDetector.getDependencyStats();
    console.log(`Active package manager: ${stats.activePackageManager}`);

    // Show what commands would be generated for different dependencies
    const testDependencies = [
      { name: 'lodash', type: 'production' },
      { name: 'jest', type: 'development' },
      { name: '@types/node', type: 'development' },
      { name: 'react', type: 'production' }
    ];

    console.log('\nGenerated install commands:');
    for (const dep of testDependencies) {
      // This would be generated by the detector's internal methods
      const isDevDep = dep.type === 'development';
      const command = stats.activePackageManager === 'yarn' 
        ? `yarn add${isDevDep ? ' --dev' : ''} ${dep.name}`
        : `npm install${isDevDep ? ' --save-dev' : ''} ${dep.name}`;
      
      console.log(`  ${dep.name} (${dep.type}): ${command}`);
    }
  }

  /**
   * Demonstrate error handling and edge cases
   */
  async demonstrateErrorHandling(): Promise<void> {
    console.log('\n⚠️  Demonstrating Error Handling');
    console.log('-'.repeat(50));

    // Test with malformed code
    const malformedCode = `
import from 'invalid-syntax';
import { } from '';
import nonexistent from 'this-package-definitely-does-not-exist';
`;

    const context: DependencyDetectionContext = {
      filePath: 'src/malformed.ts',
      content: malformedCode
    };

    try {
      const frictionPoints = await this.dependencyDetector.detect(context);
      
      console.log(`Detected ${frictionPoints.length} friction points from malformed code:`);
      for (const point of frictionPoints) {
        console.log(`  • ${point.description}`);
        console.log(`    - Auto-installable: ${point.autoInstallable}`);
        if (point.suggestions.length > 0) {
          console.log(`    - Suggestions: ${point.suggestions.join(', ')}`);
        }
      }

    } catch (error) {
      console.log('✅ Error handling worked correctly:', error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Run the complete dependency friction example
 */
export async function runDependencyFrictionExample(): Promise<void> {
  const example = new DependencyFrictionExample();
  
  await example.runExample();
  await example.demonstratePackageJsonFriction();
  await example.demonstratePackageManagerDetection();
  await example.demonstrateErrorHandling();
  
  console.log('\n🎉 Dependency Friction Example Complete!');
}

// Run example if this file is executed directly
if (require.main === module) {
  runDependencyFrictionExample().catch(console.error);
}