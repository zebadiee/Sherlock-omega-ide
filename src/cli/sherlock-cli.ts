#!/usr/bin/env node
// src/cli/sherlock-cli.ts - Practical CLI for real development tasks
import { Command } from 'commander';
import { OpenRouterClient } from '../ai/openrouter-client';
import { ValidationController } from '../validation/ValidationController';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Configuration
const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-3.5-sonnet'
};

program
  .name('sherlock')
  .description('Sherlock Ω IDE - Practical quantum-enhanced development tools')
  .version('1.0.0');

// Validate system command
program
  .command('validate')
  .description('Run system validation tests')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    console.log('🚀 Running Sherlock Ω IDE validation...\n');
    
    try {
      const controller = new ValidationController();
      const results = await controller.executeFullValidation();
      const report = await controller.generateValidationReport(results);
      
      console.log('📊 Validation Results:');
      console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
      console.log(`   Passed: ${report.summary.passed}/${report.summary.total}`);
      
      if (options.verbose) {
        results.forEach(result => {
          console.log(`\n   ${result.success ? '✅' : '❌'} ${result.scenario}:`);
          console.log(`      ${result.message}`);
          if (result.metrics && Object.keys(result.metrics).length > 0) {
            console.log(`      Metrics:`, result.metrics);
          }
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      process.exit(report.summary.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

// Fix TypeScript errors command
program
  .command('fix')
  .description('Fix TypeScript errors using AI')
  .argument('<file>', 'TypeScript file to fix')
  .option('--dry-run', 'Show fixes without applying them')
  .action(async (file, options) => {
    if (!openRouterConfig.apiKey) {
      console.error('❌ OPENROUTER_API_KEY environment variable required');
      console.log('💡 Get your API key from https://openrouter.ai');
      process.exit(1);
    }
    
    try {
      console.log(`🔧 Analyzing ${file}...`);
      
      // Read the file
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const code = fs.readFileSync(filePath, 'utf8');
      
      // Get TypeScript errors for this file
      const { execSync } = require('child_process');
      let errors: string[] = [];
      
      try {
        execSync(`npx tsc --noEmit ${filePath}`, { encoding: 'utf8' });
        console.log('✅ No TypeScript errors found!');
        return;
      } catch (tscError) {
        const errorOutput = (tscError as any).stdout || (tscError as any).stderr || '';
        errors = errorOutput.split('\n').filter((line: string) => line.includes('error TS'));
      }
      
      if (errors.length === 0) {
        console.log('✅ No TypeScript errors found!');
        return;
      }
      
      console.log(`📝 Found ${errors.length} TypeScript errors`);
      
      // Use OpenRouter to fix errors
      const client = new OpenRouterClient(openRouterConfig);
      console.log('🤖 Generating fixes with AI...');
      
      const fixedCode = await client.fixTypeScriptErrors(code, errors);
      
      if (options.dryRun) {
        console.log('\n📋 Proposed fixes:');
        console.log('```typescript');
        console.log(fixedCode);
        console.log('```');
      } else {
        // Backup original file
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, code);
        
        // Apply fixes
        fs.writeFileSync(filePath, fixedCode);
        
        console.log(`✅ Fixed ${file}`);
        console.log(`📁 Backup saved to ${backupPath}`);
        
        // Verify fixes
        try {
          execSync(`npx tsc --noEmit ${filePath}`, { encoding: 'utf8' });
          console.log('🎉 All TypeScript errors resolved!');
        } catch (verifyError) {
          console.log('⚠️ Some errors may remain - manual review recommended');
        }
      }
      
    } catch (error) {
      console.error('❌ Fix failed:', error);
      process.exit(1);
    }
  });

// Optimize code command
program
  .command('optimize')
  .description('Optimize code using quantum-enhanced AI')
  .argument('<file>', 'File to optimize')
  .option('--quantum', 'Apply quantum algorithm optimizations')
  .action(async (file, options) => {
    if (!openRouterConfig.apiKey) {
      console.error('❌ OPENROUTER_API_KEY environment variable required');
      process.exit(1);
    }
    
    try {
      console.log(`⚡ Optimizing ${file}...`);
      
      const filePath = path.resolve(file);
      const code = fs.readFileSync(filePath, 'utf8');
      
      const client = new OpenRouterClient(openRouterConfig);
      
      let optimizedCode: string;
      if (options.quantum) {
        console.log('🔬 Applying quantum optimizations...');
        optimizedCode = await client.optimizeQuantumCode(code);
      } else {
        console.log('🔧 Applying general optimizations...');
        optimizedCode = await client.analyzeCode(code, 'Optimize this code for performance and maintainability');
      }
      
      // Save optimized version
      const optimizedPath = file.replace(/\.ts$/, '.optimized.ts');
      fs.writeFileSync(optimizedPath, optimizedCode);
      
      console.log(`✅ Optimized code saved to ${optimizedPath}`);
      console.log('📊 Review the changes and replace the original if satisfied');
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      process.exit(1);
    }
  });

// Generate tests command
program
  .command('test-gen')
  .description('Generate comprehensive tests for a file')
  .argument('<file>', 'File to generate tests for')
  .action(async (file, options) => {
    if (!openRouterConfig.apiKey) {
      console.error('❌ OPENROUTER_API_KEY environment variable required');
      process.exit(1);
    }
    
    try {
      console.log(`🧪 Generating tests for ${file}...`);
      
      const filePath = path.resolve(file);
      const code = fs.readFileSync(filePath, 'utf8');
      
      const client = new OpenRouterClient(openRouterConfig);
      const tests = await client.generateTests(code);
      
      // Save tests
      const testPath = file.replace(/\.ts$/, '.test.ts');
      fs.writeFileSync(testPath, tests);
      
      console.log(`✅ Tests generated: ${testPath}`);
      console.log('🚀 Run with: npm test');
      
    } catch (error) {
      console.error('❌ Test generation failed:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show system status and health')
  .action(async () => {
    console.log('📊 Sherlock Ω IDE System Status\n');
    
    try {
      // Quick validation check
      const controller = new ValidationController();
      const buildResult = await controller.executeBuildOptimizationTest();
      
      console.log('⚛️ Quantum System:');
      console.log(`   Quantum Advantage: ${buildResult.metrics?.quantumAdvantage?.toFixed(2) || 'N/A'}x`);
      console.log(`   Speed Improvement: ${buildResult.metrics?.speedImprovement?.toFixed(1) || 'N/A'}%`);
      console.log(`   Status: ${buildResult.success ? '✅ Operational' : '❌ Issues detected'}`);
      
      // Check TypeScript errors
      const { execSync } = require('child_process');
      try {
        execSync('npx tsc --noEmit', { encoding: 'utf8' });
        console.log('\n📝 TypeScript: ✅ No errors');
      } catch (tscError) {
        const errorOutput = (tscError as any).stdout || (tscError as any).stderr || '';
        const errorCount = (errorOutput.match(/error TS/g) || []).length;
        console.log(`\n📝 TypeScript: ⚠️ ${errorCount} errors`);
        console.log('💡 Run: sherlock fix <file> to resolve');
      }
      
      // Check OpenRouter configuration
      console.log('\n🤖 AI Integration:');
      if (openRouterConfig.apiKey) {
        console.log('   OpenRouter: ✅ Configured');
        console.log(`   Model: ${openRouterConfig.defaultModel}`);
      } else {
        console.log('   OpenRouter: ❌ API key missing');
        console.log('   Setup: export OPENROUTER_API_KEY=your_key_here');
      }
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup OpenRouter integration')
  .action(async () => {
    console.log('🔧 Setting up Sherlock Ω IDE...\n');
    
    console.log('1. 📝 Register at https://openrouter.ai');
    console.log('2. 🔑 Get your API key from the dashboard');
    console.log('3. 🌍 Set environment variable:');
    console.log('   export OPENROUTER_API_KEY=your_key_here');
    console.log('4. ✅ Run: sherlock status to verify setup');
    console.log('\n💡 Recommended models:');
    console.log('   • anthropic/claude-3.5-sonnet (code analysis)');
    console.log('   • openai/gpt-4-turbo (general tasks)');
    console.log('   • meta-llama/llama-3.1-70b-instruct (open source)');
  });

if (require.main === module) {
  program.parse();
}

export { OpenRouterClient };