#!/usr/bin/env npx ts-node
/**
 * Performance Benchmark Script for Sherlock Ω
 * Measures zero-friction protocol performance and detection speeds
 */

import { IntegratedFrictionProtocol } from '../src/friction/IntegratedFrictionProtocol';
import { DependencyFrictionDetector } from '../src/friction/DependencyFrictionDetector';

interface BenchmarkResult {
  testName: string;
  executionTime: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class SherlockOmegaBenchmark {
  private protocol: IntegratedFrictionProtocol;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.protocol = new IntegratedFrictionProtocol();
  }

  /**
   * Run comprehensive performance benchmarks
   */
  async runBenchmarks(): Promise<void> {
    console.log('🚀 Sherlock Ω Performance Benchmarks');
    console.log('=' .repeat(50));

    await this.benchmarkDetectionSpeed();
    await this.benchmarkLargeFileHandling();
    await this.benchmarkConcurrentDetection();
    await this.benchmarkMemoryUsage();

    this.printResults();
  }

  /**
   * Benchmark basic detection speed
   */
  private async benchmarkDetectionSpeed(): Promise<void> {
    console.log('\n⚡ Benchmarking Detection Speed...');

    const testCode = `
import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';
import react from 'react';
    `;

    const iterations = 100;
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      await this.protocol.runIntegratedDetection({
        filePath: `test-${i}.ts`,
        content: testCode,
        checkPackageJson: true
      });
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const executionTime = endTime - startTime;

    this.results.push({
      testName: 'Detection Speed',
      executionTime,
      itemsProcessed: iterations,
      itemsPerSecond: (iterations / executionTime) * 1000,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    });

    console.log(`   ✅ Processed ${iterations} files in ${executionTime}ms`);
    console.log(`   📊 Rate: ${((iterations / executionTime) * 1000).toFixed(2)} files/second`);
  }

  /**
   * Benchmark large file handling
   */
  private async benchmarkLargeFileHandling(): Promise<void> {
    console.log('\n📄 Benchmarking Large File Handling...');

    // Generate a large file with many imports
    const imports = Array.from({ length: 100 }, (_, i) => 
      `import lib${i} from 'library-${i}';`
    ).join('\n');

    const largeCode = `
${imports}

// Large function with many dependencies
export function processData() {
  const results = [];
  ${Array.from({ length: 50 }, (_, i) => 
    `results.push(lib${i}.process());`
  ).join('\n  ')}
  return results;
}
    `;

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const result = await this.protocol.runIntegratedDetection({
      filePath: 'large-file.ts',
      content: largeCode,
      checkPackageJson: true
    });

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const executionTime = endTime - startTime;

    this.results.push({
      testName: 'Large File Handling',
      executionTime,
      itemsProcessed: result.actionableItems.length,
      itemsPerSecond: (result.actionableItems.length / executionTime) * 1000,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    });

    console.log(`   ✅ Processed large file (${largeCode.length} chars) in ${executionTime}ms`);
    console.log(`   📦 Detected ${result.actionableItems.length} dependencies`);
  }

  /**
   * Benchmark concurrent detection
   */
  private async benchmarkConcurrentDetection(): Promise<void> {
    console.log('\n🔄 Benchmarking Concurrent Detection...');

    const testFiles = Array.from({ length: 20 }, (_, i) => ({
      filePath: `concurrent-${i}.ts`,
      content: `
import lib${i} from 'library-${i}';
import util${i} from 'utility-${i}';
export const result${i} = lib${i}.process();
      `,
      checkPackageJson: true
    }));

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Run concurrent detections
    const promises = testFiles.map(context => 
      this.protocol.runIntegratedDetection(context)
    );

    const results = await Promise.all(promises);
    const totalItems = results.reduce((sum, r) => sum + r.actionableItems.length, 0);

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const executionTime = endTime - startTime;

    this.results.push({
      testName: 'Concurrent Detection',
      executionTime,
      itemsProcessed: totalItems,
      itemsPerSecond: (totalItems / executionTime) * 1000,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    });

    console.log(`   ✅ Processed ${testFiles.length} files concurrently in ${executionTime}ms`);
    console.log(`   📊 Total items detected: ${totalItems}`);
  }

  /**
   * Benchmark memory usage patterns
   */
  private async benchmarkMemoryUsage(): Promise<void> {
    console.log('\n💾 Benchmarking Memory Usage...');

    const initialMemory = process.memoryUsage();
    
    // Run multiple detection cycles to test memory leaks
    for (let cycle = 0; cycle < 10; cycle++) {
      const testCode = `
import test${cycle} from 'test-library-${cycle}';
export const result = test${cycle}.process();
      `;

      await this.protocol.runIntegratedDetection({
        filePath: `memory-test-${cycle}.ts`,
        content: testCode,
        checkPackageJson: true
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = process.memoryUsage();

    console.log(`   📊 Memory Usage Analysis:`);
    console.log(`      RSS: ${this.formatBytes(finalMemory.rss - initialMemory.rss)}`);
    console.log(`      Heap Used: ${this.formatBytes(finalMemory.heapUsed - initialMemory.heapUsed)}`);
    console.log(`      Heap Total: ${this.formatBytes(finalMemory.heapTotal - initialMemory.heapTotal)}`);
  }

  /**
   * Print comprehensive benchmark results
   */
  private printResults(): void {
    console.log('\n📊 Benchmark Results Summary');
    console.log('=' .repeat(50));

    for (const result of this.results) {
      console.log(`\n🎯 ${result.testName}:`);
      console.log(`   ⏱️  Execution Time: ${result.executionTime}ms`);
      console.log(`   📦 Items Processed: ${result.itemsProcessed}`);
      console.log(`   ⚡ Rate: ${result.itemsPerSecond.toFixed(2)} items/second`);
      console.log(`   💾 Memory Delta: ${this.formatBytes(result.memoryUsage.heapUsed)}`);
    }

    // Overall performance assessment
    const avgDetectionTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / this.results.length;
    const totalItemsProcessed = this.results.reduce((sum, r) => sum + r.itemsProcessed, 0);

    console.log('\n🏆 Performance Assessment:');
    console.log(`   📊 Average Detection Time: ${avgDetectionTime.toFixed(2)}ms`);
    console.log(`   📦 Total Items Processed: ${totalItemsProcessed}`);
    
    if (avgDetectionTime < 200) {
      console.log('   ✅ EXCELLENT: Sub-200ms detection achieved!');
    } else if (avgDetectionTime < 500) {
      console.log('   ✅ GOOD: Sub-500ms detection achieved');
    } else {
      console.log('   ⚠️  NEEDS OPTIMIZATION: Detection time above 500ms');
    }

    console.log('\n🎉 Sherlock Ω Performance Benchmarks Complete!');
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  const benchmark = new SherlockOmegaBenchmark();
  benchmark.runBenchmarks().catch(console.error);
}