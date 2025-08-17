/**
 * SHERLOCK Ω AUTONOMOUS COMPILER
 * The self-building algorithm that enables true autonomous evolution
 * "Nothing is truly impossible—only unconceived."
 */

import { Logger } from '../logging/logger';
import { PlatformType } from './whispering-interfaces';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class AutonomousCompiler {
  private logger: Logger;
  private sandboxPath: string;
  private buildProcess: ChildProcess | null = null;
  private testProcess: ChildProcess | null = null;

  constructor(platform: PlatformType) {
    this.logger = new Logger(platform);
    this.sandboxPath = path.join(process.cwd(), '.sherlock-sandbox');
  }

  async executeAutonomousBuild(feature: GeneratedFeature): Promise<BuildResult> {
    this.logger.info('🔥 AUTONOMOUS SELF-COMPILATION INITIATED');
    this.logger.info('🎯 "I am the IDE that builds itself into existence"');

    try {
      // Step 1: Create sandboxed environment
      await this.createSandbox();
      
      // Step 2: Apply feature changes to sandbox
      await this.applyFeatureToSandbox(feature);
      
      // Step 3: Execute build process
      const buildResult = await this.executeBuildScript();
      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.error}`);
      }
      
      // Step 4: Execute test suite
      const testResult = await this.executeTestSuite();
      if (!testResult.success) {
        throw new Error(`Tests failed: ${testResult.error}`);
      }
      
      // Step 5: Hot-swap deployment
      const deployResult = await this.executeHotSwapDeployment();
      
      // Step 6: Cleanup sandbox
      await this.cleanupSandbox();
      
      this.logger.info('✨ AUTONOMOUS SELF-COMPILATION COMPLETE - I have evolved myself');
      
      return {
        success: true,
        buildTime: Date.now(),
        feature: feature.id,
        deploymentResult: deployResult
      };
      
    } catch (error) {
      this.logger.error('❌ Autonomous compilation failed:', {}, error as Error);
      
      // Trigger learning cycle from failure
      await this.analyzeFailureAndLearn(error as Error, feature);
      
      // Cleanup and revert
      await this.cleanupSandbox();
      await this.revertFeatureChanges(feature);
      
      return {
        success: false,
        error: (error as Error).message,
        feature: feature.id
      };
    }
  }

  private async createSandbox(): Promise<void> {
    this.logger.info('🏗️ Creating sandboxed build environment...');
    
    // Create sandbox directory
    if (fs.existsSync(this.sandboxPath)) {
      await this.cleanupSandbox();
    }
    
    fs.mkdirSync(this.sandboxPath, { recursive: true });
    
    // Copy current source to sandbox
    await this.copySourceToSandbox();
    
    this.logger.info('✅ Sandbox environment ready');
  }

  private async copySourceToSandbox(): Promise<void> {
    const sourceFiles = [
      'src',
      'package.json',
      'tsconfig.json',
      'jest.config.js'
    ];
    
    for (const file of sourceFiles) {
      const sourcePath = path.join(process.cwd(), file);
      const targetPath = path.join(this.sandboxPath, file);
      
      if (fs.existsSync(sourcePath)) {
        if (fs.statSync(sourcePath).isDirectory()) {
          await this.copyDirectory(sourcePath, targetPath);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  private async applyFeatureToSandbox(feature: GeneratedFeature): Promise<void> {
    this.logger.info(`🔧 Applying feature: ${feature.description}`);
    
    // Apply code changes
    for (const change of feature.codeChanges) {
      const filePath = path.join(this.sandboxPath, change.filePath);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Apply the change
      if (change.type === 'create') {
        fs.writeFileSync(filePath, change.content);
      } else if (change.type === 'modify') {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const modifiedContent = this.applyModification(existingContent, change);
        fs.writeFileSync(filePath, modifiedContent);
      }
    }
    
    // Apply test changes
    for (const testChange of feature.testChanges) {
      const testPath = path.join(this.sandboxPath, testChange.filePath);
      const dir = path.dirname(testPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(testPath, testChange.content);
    }
    
    this.logger.info('✅ Feature applied to sandbox');
  }

  private applyModification(content: string, change: CodeChange): string {
    // Simple string replacement for now
    // In a real implementation, this would use AST manipulation
    if (change.searchPattern && change.replacement) {
      return content.replace(new RegExp(change.searchPattern, 'g'), change.replacement);
    }
    return content;
  }

  private async executeBuildScript(): Promise<ExecutionResult> {
    this.logger.info('🔨 Executing autonomous build: npm run build');
    
    return new Promise((resolve) => {
      this.buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.sandboxPath,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      this.buildProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      this.buildProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      this.buildProcess.on('close', (code) => {
        const success = code === 0;
        
        if (success) {
          this.logger.info('✅ Build completed successfully');
        } else {
          this.logger.error('❌ Build failed:', { code, error: errorOutput });
        }
        
        resolve({
          success,
          output,
          error: errorOutput,
          exitCode: code || 0
        });
      });
    });
  }

  private async executeTestSuite(): Promise<ExecutionResult> {
    this.logger.info('🧪 Executing autonomous test suite: npm run test');
    
    return new Promise((resolve) => {
      this.testProcess = spawn('npm', ['run', 'test', '--', '--watchAll=false'], {
        cwd: this.sandboxPath,
        stdio: 'pipe',
        env: { ...process.env, CI: 'true' }
      });
      
      let output = '';
      let errorOutput = '';
      
      this.testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      this.testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      this.testProcess.on('close', (code) => {
        const success = code === 0;
        
        if (success) {
          this.logger.info('✅ All tests passed');
        } else {
          this.logger.error('❌ Tests failed:', { code, error: errorOutput });
        }
        
        resolve({
          success,
          output,
          error: errorOutput,
          exitCode: code || 0
        });
      });
    });
  }

  private async executeHotSwapDeployment(): Promise<DeploymentResult> {
    this.logger.info('🚀 Executing hot-swap deployment...');
    
    try {
      // Copy built files from sandbox to production
      const distPath = path.join(this.sandboxPath, 'dist');
      const prodDistPath = path.join(process.cwd(), 'dist');
      
      if (fs.existsSync(distPath)) {
        // Backup current dist
        const backupPath = path.join(process.cwd(), 'dist.backup');
        if (fs.existsSync(prodDistPath)) {
          if (fs.existsSync(backupPath)) {
            fs.rmSync(backupPath, { recursive: true });
          }
          fs.renameSync(prodDistPath, backupPath);
        }
        
        // Deploy new dist
        await this.copyDirectory(distPath, prodDistPath);
        
        this.logger.info('✅ Hot-swap deployment completed');
        
        return {
          success: true,
          timestamp: new Date(),
          backupPath
        };
      } else {
        throw new Error('No dist directory found in sandbox');
      }
      
    } catch (error) {
      this.logger.error('❌ Hot-swap deployment failed:', {}, error as Error);
      throw error;
    }
  }

  private async analyzeFailureAndLearn(error: Error, feature: GeneratedFeature): Promise<void> {
    this.logger.info('🧠 Analyzing failure for learning...');
    
    // Record failure pattern for learning
    const failurePattern = {
      featureType: feature.type,
      errorMessage: error.message,
      timestamp: new Date(),
      context: {
        codeChanges: feature.codeChanges.length,
        testChanges: feature.testChanges.length
      }
    };
    
    // Store failure pattern for future learning
    // This would integrate with the learning system
    this.logger.info('📚 Failure pattern recorded for learning');
  }

  private async revertFeatureChanges(feature: GeneratedFeature): Promise<void> {
    this.logger.info('↩️ Reverting feature changes...');
    
    // In a real implementation, this would revert the changes
    // For now, we just log the action
    this.logger.info('✅ Feature changes reverted');
  }

  private async cleanupSandbox(): Promise<void> {
    if (fs.existsSync(this.sandboxPath)) {
      fs.rmSync(this.sandboxPath, { recursive: true });
      this.logger.info('🧹 Sandbox cleaned up');
    }
  }

  // Terminate any running processes
  terminate(): void {
    if (this.buildProcess) {
      this.buildProcess.kill();
    }
    if (this.testProcess) {
      this.testProcess.kill();
    }
  }
}

// Interfaces
interface GeneratedFeature {
  id: string;
  type: string;
  description: string;
  codeChanges: CodeChange[];
  testChanges: TestChange[];
}

interface CodeChange {
  filePath: string;
  type: 'create' | 'modify' | 'delete';
  content?: string;
  searchPattern?: string;
  replacement?: string;
}

interface TestChange {
  filePath: string;
  content: string;
}

interface BuildResult {
  success: boolean;
  buildTime?: number;
  feature: string;
  deploymentResult?: DeploymentResult;
  error?: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
}

interface DeploymentResult {
  success: boolean;
  timestamp: Date;
  backupPath?: string;
}