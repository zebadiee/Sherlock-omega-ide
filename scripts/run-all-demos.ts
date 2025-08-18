#!/usr/bin/env ts-node

/**
 * Run All Demos Script
 * Comprehensive demonstration of all Sherlock Ω features
 */

import { spawn } from 'child_process';
import { processManager } from '../src/utils/process-manager';

interface DemoConfig {
  name: string;
  command: string;
  args: string[];
  description: string;
  timeout: number;
}

const demos: DemoConfig[] = [
  {
    name: 'System Test',
    command: 'npm',
    args: ['run', 'test:system'],
    description: 'Comprehensive system validation',
    timeout: 120000 // 2 minutes
  },
  {
    name: 'Grover Search Demo',
    command: 'npm',
    args: ['run', 'demo:grover'],
    description: 'Quantum search algorithm demonstration',
    timeout: 60000 // 1 minute
  },
  {
    name: 'IDE Quantum Integration',
    command: 'npm',
    args: ['run', 'demo:ide-quantum'],
    description: 'Complete IDE quantum workflow',
    timeout: 90000 // 1.5 minutes
  },
  {
    name: 'AI Bot Demo',
    command: 'npm',
    args: ['run', 'demo:ai-bot'],
    description: 'AI bot creation and management',
    timeout: 60000 // 1 minute
  }
];

class DemoRunner {
  private results: Array<{ name: string; success: boolean; duration: number; error?: string }> = [];

  async runAllDemos(): Promise<void> {
    console.log('🚀 Running All Sherlock Ω Demos');
    console.log('=' .repeat(50));
    console.log(`Total demos: ${demos.length}\n`);

    // Clean up any existing processes
    await this.cleanupPorts();

    for (const demo of demos) {
      await this.runDemo(demo);
      console.log(); // Add spacing between demos
    }

    this.printSummary();
  }

  private async runDemo(demo: DemoConfig): Promise<void> {
    console.log(`🎯 ${demo.name}`);
    console.log(`   ${demo.description}`);
    console.log(`   Command: ${demo.command} ${demo.args.join(' ')}`);

    const startTime = Date.now();

    try {
      await this.executeCommand(demo.command, demo.args, demo.timeout);
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: demo.name,
        success: true,
        duration
      });

      console.log(`   ✅ Completed in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        name: demo.name,
        success: false,
        duration,
        error: errorMessage
      });

      console.log(`   ❌ Failed after ${duration}ms: ${errorMessage}`);
    }
  }

  private executeCommand(command: string, args: string[], timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Show real-time output for important messages
        if (output.includes('✅') || output.includes('❌') || output.includes('🎉')) {
          process.stdout.write(`   ${output}`);
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}. stderr: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private async cleanupPorts(): Promise<void> {
    console.log('🧹 Cleaning up ports...');
    const ports = [3000, 3001, 3002, 3003, 3005];
    
    for (const port of ports) {
      await processManager.killProcessOnPort(port);
    }
    
    // Wait a moment for ports to be freed
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Port cleanup completed\n');
  }

  private printSummary(): void {
    console.log('=' .repeat(50));
    console.log('📊 Demo Results Summary');
    console.log('=' .repeat(50));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`📈 Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Demos:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }

    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(1);
      console.log(`   ${status} ${result.name} (${duration}s)`);
    });

    if (successful === this.results.length) {
      console.log('\n🎉 All demos completed successfully!');
      console.log('🚀 Sherlock Ω IDE is ready for production use.');
    } else {
      console.log('\n⚠️  Some demos failed. Please review and fix issues.');
      process.exit(1);
    }
  }
}

// Run all demos if this file is executed directly
if (require.main === module) {
  const runner = new DemoRunner();
  runner.runAllDemos().catch(error => {
    console.error('❌ Demo runner failed:', error);
    process.exit(1);
  });
}

export { DemoRunner };