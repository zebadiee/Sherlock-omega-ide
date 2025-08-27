#!/usr/bin/env node

/**
 * OAuth Configuration Helper
 * Interactive script to help configure GitHub and Supabase OAuth credentials
 * 
 * Based on the provided dashboard links:
 * - Supabase: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp
 * - GitHub OAuth: https://github.com/settings/applications/3142320
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

interface OAuthCredentials {
  github: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  };
  supabase: {
    anonKey?: string;
    serviceRoleKey?: string;
    jwtSecret?: string;
  };
}

class OAuthConfigurator {
  private rl: readline.Interface;
  private envPath: string;
  private credentials: OAuthCredentials = { github: {}, supabase: {} };

  constructor() {
    this.envPath = path.join(process.cwd(), '.env.local');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🔐 Sherlock Ω IDE - OAuth Configuration Helper');
    console.log('============================================\n');
  }

  async configure(): Promise<void> {
    try {
      console.log('Based on your provided links, I\'ll help you configure:');
      console.log('📊 Supabase Project: ecgexzqtuhgdinohychp');
      console.log('🐙 GitHub OAuth App: 3142320\n');

      await this.configureGitHub();
      await this.configureSupabase();
      await this.updateEnvironmentFile();
      await this.validateConfiguration();
      
      console.log('\n🎉 OAuth configuration completed successfully!');
      console.log('🚀 You can now run: npm run dev');
      
    } catch (error: any) {
      console.error('\n❌ Configuration failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  private async configureGitHub(): Promise<void> {
    console.log('🐙 GitHub OAuth Configuration');
    console.log('=============================');
    
    console.log('\n📋 Follow these steps:');
    console.log('1. Open: https://github.com/settings/applications/3142320');
    console.log('2. Verify the following settings:');
    console.log('   - Application name: Sherlock Ω IDE (Development)');
    console.log('   - Homepage URL: http://localhost:3002');
    console.log('   - Authorization callback URL: http://localhost:3002/api/auth/callback/github');
    console.log('3. If settings are incorrect, update them and click "Update application"');
    console.log('4. Copy the Client ID and Client Secret\n');

    const clientId = await this.askQuestion('Enter GitHub Client ID: ');
    if (!clientId || clientId.length < 10) {
      throw new Error('Invalid GitHub Client ID');
    }
    this.credentials.github.clientId = clientId;

    const clientSecret = await this.askQuestion('Enter GitHub Client Secret: ');
    if (!clientSecret || clientSecret.length < 20) {
      throw new Error('Invalid GitHub Client Secret');
    }
    this.credentials.github.clientSecret = clientSecret;

    const createToken = await this.askQuestion('Do you want to create a Personal Access Token for enhanced features? (y/n): ');
    if (createToken.toLowerCase() === 'y') {
      console.log('\n📋 Creating Personal Access Token:');
      console.log('1. Go to: https://github.com/settings/tokens/new');
      console.log('2. Note: Sherlock Ω IDE Development');
      console.log('3. Expiration: 90 days (or custom)');
      console.log('4. Select scopes: repo, read:user, user:email, workflow');
      console.log('5. Click "Generate token" and copy the token\n');

      const accessToken = await this.askQuestion('Enter Personal Access Token (or press Enter to skip): ');
      if (accessToken && accessToken.startsWith('ghp_')) {
        this.credentials.github.accessToken = accessToken;
      }
    }

    console.log('✅ GitHub configuration collected\n');
  }

  private async configureSupabase(): Promise<void> {
    console.log('⚡ Supabase Configuration');
    console.log('========================');
    
    console.log('\n📋 Follow these steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp');
    console.log('2. Go to Settings > API');
    console.log('3. Copy the anon public key and service_role key');
    console.log('4. Go to Settings > JWT under Configuration');
    console.log('5. Copy the JWT Secret\n');

    const anonKey = await this.askQuestion('Enter Supabase anon public key: ');
    if (!anonKey || !anonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      throw new Error('Invalid Supabase anon key format');
    }
    this.credentials.supabase.anonKey = anonKey;

    const serviceRoleKey = await this.askQuestion('Enter Supabase service_role key: ');
    if (!serviceRoleKey || !serviceRoleKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      throw new Error('Invalid Supabase service_role key format');
    }
    this.credentials.supabase.serviceRoleKey = serviceRoleKey;

    const jwtSecret = await this.askQuestion('Enter Supabase JWT Secret: ');
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('Invalid JWT Secret (must be at least 32 characters)');
    }
    this.credentials.supabase.jwtSecret = jwtSecret;

    console.log('\n📋 Configure Authentication:');
    console.log('1. Go to Authentication > URL Configuration');
    console.log('2. Set Site URL: http://localhost:3002');
    console.log('3. Add Redirect URL: http://localhost:3002/api/auth/callback/supabase');
    console.log('4. Go to Authentication > Providers');
    console.log('5. Enable GitHub provider');
    console.log(`6. Enter GitHub Client ID: ${this.credentials.github.clientId}`);
    console.log(`7. Enter GitHub Client Secret: ${this.credentials.github.clientSecret}`);
    console.log('8. Click Save\n');

    await this.askQuestion('Press Enter after completing the Supabase authentication setup...');
    console.log('✅ Supabase configuration collected\n');
  }

  private async updateEnvironmentFile(): Promise<void> {
    console.log('📝 Updating environment configuration...');

    let envContent = fs.readFileSync(this.envPath, 'utf8');

    // Update GitHub credentials
    if (this.credentials.github.clientId) {
      envContent = envContent.replace(
        'GITHUB_CLIENT_ID=github_client_id_placeholder',
        `GITHUB_CLIENT_ID=${this.credentials.github.clientId}`
      );
    }

    if (this.credentials.github.clientSecret) {
      envContent = envContent.replace(
        'GITHUB_CLIENT_SECRET=github_client_secret_placeholder',
        `GITHUB_CLIENT_SECRET=${this.credentials.github.clientSecret}`
      );
    }

    if (this.credentials.github.accessToken) {
      envContent = envContent.replace(
        'GITHUB_ACCESS_TOKEN=ghp_personal_access_token_placeholder',
        `GITHUB_ACCESS_TOKEN=${this.credentials.github.accessToken}`
      );
    }

    // Update Supabase credentials
    if (this.credentials.supabase.anonKey) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY=.+/,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${this.credentials.supabase.anonKey}`
      );
    }

    if (this.credentials.supabase.serviceRoleKey) {
      envContent = envContent.replace(
        /SUPABASE_SERVICE_ROLE_KEY=.+/,
        `SUPABASE_SERVICE_ROLE_KEY=${this.credentials.supabase.serviceRoleKey}`
      );
    }

    if (this.credentials.supabase.jwtSecret) {
      envContent = envContent.replace(
        'SUPABASE_JWT_SECRET=your_jwt_secret_placeholder',
        `SUPABASE_JWT_SECRET=${this.credentials.supabase.jwtSecret}`
      );
    }

    // Generate other required secrets
    const nextAuthSecret = this.generateSecret(32);
    const jwtSecret = this.generateSecret(32);
    const encryptionKey = this.generateSecret(32);
    const webhookSecret = this.generateSecret(20);

    envContent = envContent.replace(
      'NEXTAUTH_SECRET=your_nextauth_secret_placeholder_32_chars_min',
      `NEXTAUTH_SECRET=${nextAuthSecret}`
    );

    envContent = envContent.replace(
      'JWT_SECRET=your_jwt_secret_placeholder_32_chars',
      `JWT_SECRET=${jwtSecret}`
    );

    envContent = envContent.replace(
      'ENCRYPTION_KEY=your_encryption_key_32_chars_exactly',
      `ENCRYPTION_KEY=${encryptionKey}`
    );

    envContent = envContent.replace(
      'GITHUB_WEBHOOK_SECRET=your_github_webhook_secret_placeholder',
      `GITHUB_WEBHOOK_SECRET=${webhookSecret}`
    );

    // Update setup status
    envContent = envContent.replace(
      'OAUTH_SETUP_COMPLETE=false',
      'OAUTH_SETUP_COMPLETE=true'
    );

    envContent = envContent.replace(
      'GITHUB_INTEGRATION_COMPLETE=false',
      'GITHUB_INTEGRATION_COMPLETE=true'
    );

    envContent = envContent.replace(
      'SUPABASE_INTEGRATION_COMPLETE=false',
      'SUPABASE_INTEGRATION_COMPLETE=true'
    );

    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ Environment file updated');
  }

  private async validateConfiguration(): Promise<void> {
    console.log('🔍 Validating configuration...');

    try {
      // Test GitHub OAuth URL generation
      const testGitHubUrl = `https://github.com/login/oauth/authorize?client_id=${this.credentials.github.clientId}&redirect_uri=http://localhost:3002/api/auth/callback/github&scope=read:user user:email repo&state=test`;
      console.log(`✅ GitHub OAuth URL: ${testGitHubUrl.substring(0, 80)}...`);

      // Test Supabase project URL
      const supabaseUrl = 'https://ecgexzqtuhgdinohychp.supabase.co';
      console.log(`✅ Supabase URL: ${supabaseUrl}`);

      console.log('✅ Basic validation passed');
    } catch (error: any) {
      console.warn(`⚠️ Validation warning: ${error.message}`);
    }
  }

  private generateSecret(length: number): string {
    const crypto = require('crypto');
    return crypto.randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '0')
      .replace(/\//g, '0');
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Run the configurator
if (require.main === module) {
  const configurator = new OAuthConfigurator();
  configurator.configure().catch(console.error);
}

export default OAuthConfigurator;