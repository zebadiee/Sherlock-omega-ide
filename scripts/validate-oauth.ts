#!/usr/bin/env node

/**
 * OAuth Setup Validator
 * Quick validation script for GitHub and Supabase OAuth configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

class OAuthValidator {
  private results: ValidationResult[] = [];
  private envPath: string;
  private envVars: Record<string, string> = {};

  constructor() {
    this.envPath = path.join(process.cwd(), '.env.local');
    this.loadEnvironmentVars();
  }

  private loadEnvironmentVars(): void {
    if (!fs.existsSync(this.envPath)) {
      throw new Error('.env.local file not found');
    }

    const content = fs.readFileSync(this.envPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          this.envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }

  validate(): void {
    console.log('🔍 Validating OAuth Configuration');
    console.log('=================================\n');

    this.validateBasicConfiguration();
    this.validateGitHubConfiguration();
    this.validateSupabaseConfiguration();
    this.validateSecurityConfiguration();
    this.validateIntegrationStatus();

    this.printResults();
  }

  private validateBasicConfiguration(): void {
    // Check basic app configuration
    this.checkEnvVar('NEXT_PUBLIC_SITE_URL', 'Basic', 'http://localhost:3002');
    this.checkEnvVar('NODE_ENV', 'Basic', 'development');
    this.checkEnvVar('PORT', 'Basic', '3002');
  }

  private validateGitHubConfiguration(): void {
    // GitHub OAuth App credentials
    const clientId = this.envVars['GITHUB_CLIENT_ID'];
    const clientSecret = this.envVars['GITHUB_CLIENT_SECRET'];

    if (!clientId || clientId.includes('placeholder')) {
      this.addResult('GitHub', 'Client ID', 'fail', 'GitHub Client ID not configured');
    } else if (clientId.length < 10) {
      this.addResult('GitHub', 'Client ID', 'fail', 'Invalid GitHub Client ID format');
    } else {
      this.addResult('GitHub', 'Client ID', 'pass', `Configured: ${clientId.substring(0, 8)}...`);
    }

    if (!clientSecret || clientSecret.includes('placeholder')) {
      this.addResult('GitHub', 'Client Secret', 'fail', 'GitHub Client Secret not configured');
    } else if (clientSecret.length < 20) {
      this.addResult('GitHub', 'Client Secret', 'fail', 'Invalid GitHub Client Secret format');
    } else {
      this.addResult('GitHub', 'Client Secret', 'pass', 'Configured and valid length');
    }

    // Personal Access Token (optional)
    const accessToken = this.envVars['GITHUB_ACCESS_TOKEN'];
    if (!accessToken || accessToken.includes('placeholder')) {
      this.addResult('GitHub', 'Access Token', 'warning', 'Personal Access Token not configured (optional)');
    } else if (!accessToken.startsWith('ghp_')) {
      this.addResult('GitHub', 'Access Token', 'fail', 'Invalid GitHub token format');
    } else {
      this.addResult('GitHub', 'Access Token', 'pass', 'Personal Access Token configured');
    }

    // Webhook secret
    const webhookSecret = this.envVars['GITHUB_WEBHOOK_SECRET'];
    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      this.addResult('GitHub', 'Webhook Secret', 'warning', 'Webhook secret not configured');
    } else {
      this.addResult('GitHub', 'Webhook Secret', 'pass', 'Webhook secret configured');
    }
  }

  private validateSupabaseConfiguration(): void {
    // Supabase Project URL
    const supabaseUrl = this.envVars['NEXT_PUBLIC_SUPABASE_URL'];
    if (!supabaseUrl || supabaseUrl.includes('your_project_id')) {
      this.addResult('Supabase', 'Project URL', 'fail', 'Supabase URL not configured');
    } else if (!supabaseUrl.includes('ecgexzqtuhgdinohychp.supabase.co')) {
      this.addResult('Supabase', 'Project URL', 'warning', 'URL does not match expected project ID');
    } else {
      this.addResult('Supabase', 'Project URL', 'pass', 'Project URL configured correctly');
    }

    // Anon Key
    const anonKey = this.envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    if (!anonKey || anonKey.includes('placeholder')) {
      this.addResult('Supabase', 'Anon Key', 'fail', 'Supabase anon key not configured');
    } else if (!anonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      this.addResult('Supabase', 'Anon Key', 'fail', 'Invalid anon key format');
    } else {
      this.addResult('Supabase', 'Anon Key', 'pass', 'Anon key configured');
    }

    // Service Role Key
    const serviceRoleKey = this.envVars['SUPABASE_SERVICE_ROLE_KEY'];
    if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
      this.addResult('Supabase', 'Service Role Key', 'fail', 'Service role key not configured');
    } else if (!serviceRoleKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      this.addResult('Supabase', 'Service Role Key', 'fail', 'Invalid service role key format');
    } else {
      this.addResult('Supabase', 'Service Role Key', 'pass', 'Service role key configured');
    }

    // JWT Secret
    const jwtSecret = this.envVars['SUPABASE_JWT_SECRET'];
    if (!jwtSecret || jwtSecret.includes('placeholder')) {
      this.addResult('Supabase', 'JWT Secret', 'fail', 'JWT secret not configured');
    } else if (jwtSecret.length < 32) {
      this.addResult('Supabase', 'JWT Secret', 'fail', 'JWT secret too short');
    } else {
      this.addResult('Supabase', 'JWT Secret', 'pass', 'JWT secret configured');
    }
  }

  private validateSecurityConfiguration(): void {
    // NextAuth Secret
    const nextAuthSecret = this.envVars['NEXTAUTH_SECRET'];
    if (!nextAuthSecret || nextAuthSecret.includes('placeholder')) {
      this.addResult('Security', 'NextAuth Secret', 'fail', 'NextAuth secret not configured');
    } else if (nextAuthSecret.length < 32) {
      this.addResult('Security', 'NextAuth Secret', 'fail', 'NextAuth secret too short');
    } else {
      this.addResult('Security', 'NextAuth Secret', 'pass', 'NextAuth secret configured');
    }

    // JWT Secret
    const jwtSecret = this.envVars['JWT_SECRET'];
    if (!jwtSecret || jwtSecret.includes('placeholder')) {
      this.addResult('Security', 'JWT Secret', 'fail', 'JWT secret not configured');
    } else if (jwtSecret.length < 32) {
      this.addResult('Security', 'JWT Secret', 'fail', 'JWT secret too short');
    } else {
      this.addResult('Security', 'JWT Secret', 'pass', 'JWT secret configured');
    }

    // Encryption Key
    const encryptionKey = this.envVars['ENCRYPTION_KEY'];
    if (!encryptionKey || encryptionKey.includes('placeholder')) {
      this.addResult('Security', 'Encryption Key', 'fail', 'Encryption key not configured');
    } else if (encryptionKey.length !== 32) {
      this.addResult('Security', 'Encryption Key', 'fail', 'Encryption key must be exactly 32 characters');
    } else {
      this.addResult('Security', 'Encryption Key', 'pass', 'Encryption key configured');
    }
  }

  private validateIntegrationStatus(): void {
    const oauthComplete = this.envVars['OAUTH_SETUP_COMPLETE'] === 'true';
    const githubComplete = this.envVars['GITHUB_INTEGRATION_COMPLETE'] === 'true';
    const supabaseComplete = this.envVars['SUPABASE_INTEGRATION_COMPLETE'] === 'true';

    this.addResult('Status', 'OAuth Setup', oauthComplete ? 'pass' : 'warning', 
      oauthComplete ? 'OAuth setup marked complete' : 'OAuth setup not complete');
    
    this.addResult('Status', 'GitHub Integration', githubComplete ? 'pass' : 'warning',
      githubComplete ? 'GitHub integration complete' : 'GitHub integration pending');
    
    this.addResult('Status', 'Supabase Integration', supabaseComplete ? 'pass' : 'warning',
      supabaseComplete ? 'Supabase integration complete' : 'Supabase integration pending');
  }

  private checkEnvVar(key: string, category: string, expected?: string): void {
    const value = this.envVars[key];
    if (!value) {
      this.addResult(category, key, 'fail', 'Not configured');
    } else if (expected && value !== expected) {
      this.addResult(category, key, 'warning', `Expected: ${expected}, Got: ${value}`);
    } else {
      this.addResult(category, key, 'pass', `Configured: ${value}`);
    }
  }

  private addResult(category: string, item: string, status: 'pass' | 'fail' | 'warning', message: string): void {
    this.results.push({ category, item, status, message });
  }

  private printResults(): void {
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`\n📋 ${category}`);
      console.log('='.repeat(category.length + 3));
      
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        console.log(`   ${icon} ${result.item}: ${result.message}`);
      }
    }

    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📊 Summary');
    console.log('===========');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📈 Total: ${this.results.length}`);

    if (failed === 0) {
      console.log('\n🎉 OAuth configuration looks good!');
      console.log('🚀 Ready to start development with: npm run dev');
    } else {
      console.log('\n🔧 Please fix the failed items before proceeding.');
      console.log('💡 Run: npm run config:oauth');
    }

    console.log('\n📚 Next Steps:');
    console.log('   1. Apply database schema: npm run db:migrate');
    console.log('   2. Start development server: npm run dev');
    console.log('   3. Test integration: npm run test:integration');
    console.log('   4. Open dashboard: http://localhost:3002');
  }
}

// Run validation
if (require.main === module) {
  try {
    const validator = new OAuthValidator();
    validator.validate();
  } catch (error: any) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

export default OAuthValidator;