#!/usr/bin/env node

/**
 * Unified OAuth Setup
 * Combines simplified bash script approach with TypeScript validation
 * Best of both worlds: simplicity + enterprise features
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class UnifiedOAuthSetup {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    console.log('🔧 Sherlock Ω IDE - Unified OAuth Setup');
    console.log('======================================\n');
  }

  async setup(): Promise<void> {
    try {
      // Check if bash script exists
      const bashScriptPath = path.join(this.projectRoot, 'configure-oauth-env.sh');
      
      if (!fs.existsSync(bashScriptPath)) {
        throw new Error('configure-oauth-env.sh not found in project root');
      }

      console.log('🚀 Running simplified OAuth configuration...\n');
      
      // Run the bash script
      execSync('./configure-oauth-env.sh', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      console.log('\n📊 Running post-setup validation...');
      
      // Run validation if available
      try {
        execSync('npm run config:validate', {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
      } catch (error) {
        console.log('⚠️ Validation encountered issues, but OAuth setup completed');
      }

      console.log('\n🎯 Setup Summary:');
      console.log('================');
      
      // Check setup status
      const envPath = path.join(this.projectRoot, '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const setupComplete = envContent.includes('OAUTH_SETUP_COMPLETE=true');
        const githubConfigured = !envContent.includes('github_client_id_placeholder');
        const supabaseConfigured = !envContent.includes('your_anon_key_placeholder');

        console.log(`✅ Environment file: ${setupComplete ? 'Created' : 'Partial'}`);
        console.log(`${githubConfigured ? '✅' : '⚠️'} GitHub OAuth: ${githubConfigured ? 'Configured' : 'Needs setup'}`);
        console.log(`${supabaseConfigured ? '✅' : '⚠️'} Supabase: ${supabaseConfigured ? 'Configured' : 'Needs setup'}`);
      }

      console.log('\n🔗 Quick Links:');
      console.log('   GitHub App: https://github.com/settings/applications/3142320');
      console.log('   Supabase: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp');
      console.log('   Local IDE: http://localhost:3002');

      console.log('\n🏃‍♂️ Ready to Start:');
      console.log('   npm run dev');

    } catch (error: any) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure configure-oauth-env.sh exists and is executable');
      console.log('   2. Check that you have bash available');
      console.log('   3. Try running manually: ./configure-oauth-env.sh');
      console.log('   4. Or use interactive TypeScript version: npm run config:oauth');
      process.exit(1);
    }
  }
}

// Run the unified setup
if (require.main === module) {
  const setup = new UnifiedOAuthSetup();
  setup.setup().catch(console.error);
}

export default UnifiedOAuthSetup;