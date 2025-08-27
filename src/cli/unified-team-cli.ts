#!/usr/bin/env node

/**
 * Unified Team Management CLI for Sherlock Ω IDE
 * Integrates user-provided streamlined approach with enterprise infrastructure
 * 
 * Features:
 * - Streamlined role-based access control (admin, developer, viewer)
 * - Multi-environment injection with git commit tracking
 * - Comprehensive developer offboarding with security protocols
 * - OAuth credential management with Supabase documentation links
 * - Enterprise audit logging and compliance
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';
import { User, UserRole, hasPermission, rolePermissions } from '../auth/roles';
import TeamManager, { DeveloperProfile } from '../team/team-manager';

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

interface CLIOptions {
  action: string;
  developer?: string;
  role?: UserRole;
  interactive?: boolean;
  validate?: boolean;
}

class UnifiedTeamCLI {
  private rl: readline.Interface;
  private teamManager: TeamManager;
  private currentUser: User;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.teamManager = new TeamManager();
    
    // Mock current user - in real implementation, get from auth context
    this.currentUser = {
      id: 'admin_user',
      email: 'admin@sherlock-omega.com',
      role: 'admin'
    };
  }

  async run(options: CLIOptions): Promise<void> {
    try {
      this.printHeader();
      
      switch (options.action) {
        case 'onboard':
          await this.handleOnboarding(options);
          break;
        case 'offboard':
          await this.handleOffboarding(options);
          break;
        case 'inject-env':
          await this.handleEnvironmentInjection(options);
          break;
        case 'list':
          await this.handleListDevelopers(options);
          break;
        case 'update-role':
          await this.handleRoleUpdate(options);
          break;
        case 'audit':
          await this.handleAudit(options);
          break;
        case 'validate-oauth':
          await this.handleOAuthValidation(options);
          break;
        default:
          this.showUsage();
      }
    } catch (error: any) {
      console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  private printHeader(): void {
    console.log(`${colors.blue}🚀 Sherlock Ω IDE - Unified Team Management${colors.reset}`);
    console.log(`${colors.blue}=============================================${colors.reset}`);
    console.log(`${colors.cyan}Streamlined role-based access control with enterprise security${colors.reset}\n`);
  }

  private showUsage(): void {
    console.log(`${colors.yellow}Usage:${colors.reset}`);
    console.log('  npm run team:onboard [developer_name] [role]');
    console.log('  npm run team:offboard [developer_name]');
    console.log('  npm run team:inject-env [developer_name]');
    console.log('  npm run team:list [--role=role] [--status=status]');
    console.log('  npm run team:update-role [developer_name] [new_role]');
    console.log('  npm run team:audit');
    console.log('  npm run team:validate-oauth\n');
    
    console.log(`${colors.yellow}Examples:${colors.reset}`);
    console.log('  npm run team:onboard alice_smith developer');
    console.log('  npm run team:offboard alice_smith');
    console.log('  npm run team:inject-env alice_smith');
    console.log('  npm run team:list --role=developer');
    console.log('  npm run team:update-role alice_smith admin\n');
    
    console.log(`${colors.yellow}Roles (streamlined hierarchy):${colors.reset}`);
    console.log('  • admin    - Full system access with all administrative privileges');
    console.log('  • developer - Full development access with quantum and AI capabilities');
    console.log('  • viewer   - Read-only access for observation and learning\n');
    
    console.log(`${colors.yellow}🔗 Security Documentation:${colors.reset}`);
    console.log('  • Supabase Auth: https://supabase.com/docs/guides/auth');
    console.log('  • GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps');
    console.log('  • Environment Variables: https://supabase.com/docs/guides/hosting/environment-variables');
  }

  // ============================================================================
  // Developer Onboarding (User-Provided Pattern Enhanced)
  // ============================================================================

  async handleOnboarding(options: CLIOptions): Promise<void> {
    if (!hasPermission(this.currentUser, 'manage:users')) {
      throw new Error('Insufficient permissions for developer onboarding');
    }

    console.log(`${colors.green}👥 Developer Onboarding${colors.reset}`);
    console.log(`${colors.green}======================${colors.reset}\n`);

    const name = options.developer || await this.askQuestion('Developer name: ');
    const email = await this.askQuestion('Developer email: ');
    
    // Streamlined role selection
    console.log(`${colors.yellow}Available roles (streamlined):${colors.reset}`);
    console.log('  1. admin    - Full system access');
    console.log('  2. developer - Development access with quantum/AI');
    console.log('  3. viewer   - Read-only access');
    
    const roleChoice = options.role || await this.askQuestion('Select role (admin/developer/viewer): ') as UserRole;
    
    if (!['admin', 'developer', 'viewer'].includes(roleChoice)) {
      throw new Error('Invalid role. Must be admin, developer, or viewer');
    }

    // Show permissions for selected role
    console.log(`\n${colors.cyan}📋 Permissions for ${roleChoice}:${colors.reset}`);
    const permissions = rolePermissions[roleChoice];
    permissions.slice(0, 8).forEach(perm => console.log(`  • ${perm}`));
    if (permissions.length > 8) {
      console.log(`  • ... and ${permissions.length - 8} more permissions`);
    }
    console.log('');

    const confirm = await this.askQuestion(`Proceed with onboarding ${name} as ${roleChoice}? (y/N): `);
    if (confirm.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}⚠️  Onboarding cancelled${colors.reset}`);
      return;
    }

    // Perform onboarding
    const developer = await this.teamManager.onboardDeveloper(name, email, roleChoice);
    
    console.log(`${colors.green}✅ Developer onboarded successfully!${colors.reset}`);
    console.log(`   ID: ${developer.id}`);
    console.log(`   Environment: ${developer.environmentFile}`);
    console.log(`   Role: ${developer.role}`);
    console.log(`   Onboarded: ${developer.onboardingDate.toISOString()}\n`);

    console.log(`${colors.blue}🔧 Next Steps:${colors.reset}`);
    console.log(`1. Run environment injection: npm run team:inject-env ${name.toLowerCase().replace(/\s+/g, '')}`);
    console.log(`2. Configure OAuth credentials`);
    console.log(`3. Test access with: npm run team:validate-oauth\n`);
    
    console.log(`${colors.yellow}🔗 Configuration Resources:${colors.reset}`);
    console.log('  • GitHub OAuth: https://github.com/settings/applications/3142320');
    console.log('  • Supabase Dashboard: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp');
  }

  // ============================================================================
  // Developer Offboarding (User-Provided Pattern Enhanced)
  // ============================================================================

  async handleOffboarding(options: CLIOptions): Promise<void> {
    if (!hasPermission(this.currentUser, 'manage:users')) {
      throw new Error('Insufficient permissions for developer offboarding');
    }

    console.log(`${colors.red}🛡️  Developer Offboarding${colors.reset}`);
    console.log(`${colors.red}========================${colors.reset}\n`);

    const developerName = options.developer || await this.askQuestion('Developer name or ID to offboard: ');
    const reason = await this.askQuestion('Reason for offboarding: ');

    // Find developer
    const developers = await this.teamManager.listDevelopers({ status: 'active' });
    const developer = developers.find(d => 
      d.name.toLowerCase().includes(developerName.toLowerCase()) || 
      d.id === developerName
    );

    if (!developer) {
      throw new Error(`Developer not found: ${developerName}`);
    }

    console.log(`\n${colors.yellow}📋 Developer Information:${colors.reset}`);
    console.log(`   Name: ${developer.name}`);
    console.log(`   Email: ${developer.email}`);
    console.log(`   Role: ${developer.role}`);
    console.log(`   Onboarded: ${developer.onboardingDate.toISOString()}`);
    console.log(`   Last Active: ${developer.lastActive.toISOString()}\n`);

    console.log(`${colors.red}⚠️  Offboarding Actions:${colors.reset}`);
    console.log('  • Remove repository access');
    console.log('  • Disable Supabase account');
    console.log('  • Rotate OAuth secrets');
    console.log('  • Clean environment files');
    console.log('  • Audit git commits');
    console.log('  • Generate security report\n');

    const confirm = await this.askQuestion(`${colors.red}Proceed with offboarding ${developer.name}? (y/N): ${colors.reset}`);
    if (confirm.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}⚠️  Offboarding cancelled${colors.reset}`);
      return;
    }

    // Perform offboarding
    const report = await this.teamManager.offboardDeveloper(
      developer.id, 
      this.currentUser.id, 
      reason
    );

    console.log(`${colors.green}✅ Developer offboarding completed!${colors.reset}\n`);
    
    console.log(`${colors.cyan}📊 Offboarding Summary:${colors.reset}`);
    console.log(`   Actions Completed: ${report.actionsCompleted.length}`);
    console.log(`   Git Commits Audited: ${report.gitCommitsAudited.length}`);
    console.log(`   Environment Files Removed: ${report.environmentFilesRemoved.length}`);
    console.log(`   Current Git Commit: ${report.currentGitCommit.substring(0, 8)}\n`);

    console.log(`${colors.yellow}🔗 Security Documentation:${colors.reset}`);
    console.log('  • Follow comprehensive checklist: ./docs/developer-offboarding-checklist.md');
    console.log('  • Supabase Security: https://supabase.com/docs/guides/auth#best-practices');
    console.log('  • GitHub OAuth Security: https://docs.github.com/en/developers/apps/building-oauth-apps');
  }

  // ============================================================================
  // Environment Injection (User-Provided Pattern)
  // ============================================================================

  async handleEnvironmentInjection(options: CLIOptions): Promise<void> {
    console.log(`${colors.blue}🔧 Environment Injection${colors.reset}`);
    console.log(`${colors.blue}========================${colors.reset}\n`);

    const developerName = options.developer || await this.askQuestion('Developer name: ');
    
    console.log(`${colors.yellow}🔗 Quick Setup Options:${colors.reset}`);
    console.log('  1. Interactive injection (recommended)');
    console.log('  2. Run bash script directly');
    console.log('  3. Enterprise TypeScript setup\n');

    const method = await this.askQuestion('Select method (1/2/3): ');
    
    switch (method) {
      case '1':
        console.log(`${colors.cyan}Running interactive environment injection...${colors.reset}\n`);
        execSync(`./scripts/inject-dev-env.sh ${developerName}`, { stdio: 'inherit' });
        break;
        
      case '2':
        console.log(`${colors.cyan}Running bash script directly...${colors.reset}\n`);
        console.log(`${colors.yellow}Command: ./scripts/inject-dev-env.sh ${developerName}${colors.reset}`);
        console.log(`${colors.yellow}Features: Git commit tracking, Supabase docs, validation${colors.reset}\n`);
        execSync(`./scripts/inject-dev-env.sh ${developerName}`, { stdio: 'inherit' });
        break;
        
      case '3':
        console.log(`${colors.cyan}Running enterprise TypeScript setup...${colors.reset}\n`);
        execSync(`npm run config:oauth`, { stdio: 'inherit' });
        break;
        
      default:
        throw new Error('Invalid method selection');
    }

    console.log(`\n${colors.green}✅ Environment injection completed!${colors.reset}\n`);
    
    console.log(`${colors.yellow}🔗 Supabase Security Resources for Ongoing Hardening:${colors.reset}`);
    console.log('  • Securing Supabase Auth: https://supabase.com/docs/guides/auth');
    console.log('  • Managing OAuth Providers: https://supabase.com/docs/guides/auth/social-login/github');
    console.log('  • Environment Variables Best Practices: https://supabase.com/docs/guides/hosting/environment-variables');
  }

  // ============================================================================
  // List and Management Functions
  // ============================================================================

  async handleListDevelopers(options: CLIOptions): Promise<void> {
    console.log(`${colors.cyan}👥 Developer Directory${colors.reset}`);
    console.log(`${colors.cyan}====================${colors.reset}\n`);

    const filter: any = {};
    
    // Parse filter options
    if (options.role) filter.role = options.role;
    if (process.argv.includes('--status=active')) filter.status = 'active';
    if (process.argv.includes('--status=inactive')) filter.status = 'inactive';
    if (process.argv.includes('--status=offboarded')) filter.status = 'offboarded';

    const developers = await this.teamManager.listDevelopers(filter);
    
    if (developers.length === 0) {
      console.log(`${colors.yellow}No developers found matching the criteria${colors.reset}`);
      return;
    }

    // Group by role for streamlined display
    const byRole: Record<UserRole, DeveloperProfile[]> = {
      admin: [],
      developer: [],
      viewer: []
    };
    
    developers.forEach(dev => {
      if (byRole[dev.role]) {
        byRole[dev.role].push(dev);
      }
    });

    // Display by role hierarchy
    for (const role of ['admin', 'developer', 'viewer'] as UserRole[]) {
      if (byRole[role].length > 0) {
        console.log(`${colors.yellow}${role.toUpperCase()} (${byRole[role].length}):${colors.reset}`);
        byRole[role].forEach(dev => {
          const statusColor = dev.status === 'active' ? colors.green : 
                            dev.status === 'inactive' ? colors.yellow : colors.red;
          console.log(`  • ${dev.name} (${dev.email}) - ${statusColor}${dev.status}${colors.reset}`);
          console.log(`    Onboarded: ${dev.onboardingDate.toISOString().split('T')[0]}`);
          if (dev.environmentFile) {
            console.log(`    Environment: ${dev.environmentFile}`);
          }
        });
        console.log('');
      }
    }

    console.log(`${colors.cyan}Total: ${developers.length} developers${colors.reset}\n`);
    
    // Show available permissions for each role
    console.log(`${colors.yellow}🔑 Role Permissions:${colors.reset}`);
    Object.entries(rolePermissions).forEach(([role, perms]) => {
      console.log(`  ${role}: ${perms.slice(0, 3).join(', ')}... (+${perms.length - 3} more)`);
    });
  }

  async handleRoleUpdate(options: CLIOptions): Promise<void> {
    if (!hasPermission(this.currentUser, 'manage:roles')) {
      throw new Error('Insufficient permissions for role updates');
    }

    console.log(`${colors.magenta}🔄 Role Update${colors.reset}`);
    console.log(`${colors.magenta}==============${colors.reset}\n`);

    const developerName = options.developer || await this.askQuestion('Developer name or ID: ');
    const newRole = options.role || await this.askQuestion('New role (admin/developer/viewer): ') as UserRole;

    if (!['admin', 'developer', 'viewer'].includes(newRole)) {
      throw new Error('Invalid role. Must be admin, developer, or viewer');
    }

    // Find developer
    const developers = await this.teamManager.listDevelopers({ status: 'active' });
    const developer = developers.find(d => 
      d.name.toLowerCase().includes(developerName.toLowerCase()) || 
      d.id === developerName
    );

    if (!developer) {
      throw new Error(`Developer not found: ${developerName}`);
    }

    console.log(`\n${colors.cyan}Current: ${developer.name} - ${developer.role}${colors.reset}`);
    console.log(`${colors.cyan}New: ${developer.name} - ${newRole}${colors.reset}\n`);

    const confirm = await this.askQuestion('Proceed with role update? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}⚠️  Role update cancelled${colors.reset}`);
      return;
    }

    const updatedDeveloper = await this.teamManager.updateDeveloperRole(
      this.currentUser,
      developer.id,
      newRole
    );

    console.log(`${colors.green}✅ Role updated successfully!${colors.reset}`);
    console.log(`   ${updatedDeveloper.name}: ${developer.role} → ${newRole}`);
    console.log(`   Updated: ${updatedDeveloper.lastActive.toISOString()}\n`);
  }

  // ============================================================================
  // Audit and Validation
  // ============================================================================

  async handleAudit(options: CLIOptions): Promise<void> {
    console.log(`${colors.cyan}📊 Team Audit Report${colors.reset}`);
    console.log(`${colors.cyan}===================${colors.reset}\n`);

    const developers = await this.teamManager.listDevelopers();
    const activeDevelopers = developers.filter(d => d.status === 'active');
    const inactiveDevelopers = developers.filter(d => d.status === 'inactive');
    const offboardedDevelopers = developers.filter(d => d.status === 'offboarded');

    console.log(`${colors.yellow}📈 Team Statistics:${colors.reset}`);
    console.log(`   Total Developers: ${developers.length}`);
    console.log(`   Active: ${activeDevelopers.length}`);
    console.log(`   Inactive: ${inactiveDevelopers.length}`);
    console.log(`   Offboarded: ${offboardedDevelopers.length}\n`);

    // Role distribution
    const roleStats: Record<string, number> = {};
    activeDevelopers.forEach(dev => {
      roleStats[dev.role] = (roleStats[dev.role] || 0) + 1;
    });

    console.log(`${colors.yellow}👥 Active Role Distribution:${colors.reset}`);
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log('');

    // Recent activity
    const recentlyActive = activeDevelopers
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      .slice(0, 5);

    console.log(`${colors.yellow}🕒 Recent Activity (Top 5):${colors.reset}`);
    recentlyActive.forEach(dev => {
      const daysSince = Math.floor((Date.now() - dev.lastActive.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   ${dev.name} - ${daysSince} days ago`);
    });
    console.log('');

    // Git information
    try {
      const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      console.log(`${colors.yellow}📋 Audit Context:${colors.reset}`);
      console.log(`   Git Branch: ${gitBranch}`);
      console.log(`   Git Commit: ${gitCommit.substring(0, 8)}`);
      console.log(`   Generated: ${new Date().toISOString()}\n`);
    } catch (error) {
      console.log(`${colors.yellow}📋 Audit Context: ${new Date().toISOString()}\n`);
    }

    console.log(`${colors.green}✅ Audit report generated successfully!${colors.reset}`);
  }

  async handleOAuthValidation(options: CLIOptions): Promise<void> {
    console.log(`${colors.blue}🔍 OAuth Configuration Validation${colors.reset}`);
    console.log(`${colors.blue}=================================${colors.reset}\n`);

    try {
      execSync('npm run config:validate', { stdio: 'inherit' });
      
      console.log(`\n${colors.green}✅ OAuth validation completed!${colors.reset}\n`);
      
      console.log(`${colors.yellow}🔗 Configuration Links:${colors.reset}`);
      console.log('  • GitHub OAuth: https://github.com/settings/applications/3142320');
      console.log('  • Supabase Dashboard: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp\n');
      
      console.log(`${colors.yellow}🔗 Security Documentation:${colors.reset}`);
      console.log('  • Supabase Auth Security: https://supabase.com/docs/guides/auth#best-practices');
      console.log('  • GitHub OAuth Security: https://docs.github.com/en/developers/apps/building-oauth-apps');
      
    } catch (error) {
      console.error(`${colors.red}❌ OAuth validation failed${colors.reset}`);
      console.log(`\n${colors.yellow}💡 Try running the environment injection first:${colors.reset}`);
      console.log('   npm run team:inject-env <developer_name>');
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    const cli = new UnifiedTeamCLI();
    cli.showUsage();
    process.exit(0);
  }

  const options: CLIOptions = {
    action: args[0],
    developer: args[1],
    role: args[2] as UserRole,
    interactive: true
  };

  const cli = new UnifiedTeamCLI();
  cli.run(options).catch(error => {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default UnifiedTeamCLI;