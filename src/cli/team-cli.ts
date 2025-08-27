#!/usr/bin/env node

/**
 * Team Management CLI for Sherlock Ω IDE
 * Command-line interface for developer onboarding, offboarding, and management
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import TeamManager, { DeveloperProfile, OnboardingConfig } from '../team/team-manager';
import { UserRole } from '../auth/roles';

const program = new Command();
const teamManager = new TeamManager();

// ============================================================================
// CLI Configuration
// ============================================================================

program
  .name('sherlock-team')
  .description('Sherlock Ω IDE Team Management CLI')
  .version('2.0.0');

// ============================================================================
// Onboarding Commands
// ============================================================================

program
  .command('onboard')
  .description('Onboard a new developer')
  .option('-n, --name <name>', 'Developer name')
  .option('-e, --email <email>', 'Developer email')
  .option('-r, --role <role>', 'Developer role (admin|developer|researcher|student|viewer)')
  .option('-d, --department <dept>', 'Department')
  .option('--interactive', 'Interactive mode')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Sherlock Ω IDE - Developer Onboarding\n'));

    let { name, email, role, department } = options;

    if (options.interactive || !name || !email || !role) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Developer name:',
          default: name,
          validate: (input) => input.trim().length > 0 || 'Name is required'
        },
        {
          type: 'input',
          name: 'email',
          message: 'Developer email:',
          default: email,
          validate: (input) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(input) || 'Valid email is required';
          }
        },
        {
          type: 'list',
          name: 'role',
          message: 'Developer role:',
          choices: [
            { name: '👑 Admin - Full system access', value: 'admin' },
            { name: '💻 Developer - Code and deployment access', value: 'developer' },
            { name: '🔬 Researcher - Advanced quantum/AI access', value: 'researcher' },
            { name: '🎓 Student - Learning and basic access', value: 'student' },
            { name: '👁️ Viewer - Read-only access', value: 'viewer' }
          ],
          default: role || 'developer'
        },
        {
          type: 'input',
          name: 'department',
          message: 'Department (optional):',
          default: department
        },
        {
          type: 'list',
          name: 'accessLevel',
          message: 'Access level:',
          choices: [
            { name: 'Basic - Standard features', value: 'basic' },
            { name: 'Advanced - Extended features', value: 'advanced' },
            { name: 'Enterprise - All features', value: 'enterprise' }
          ],
          default: 'basic'
        }
      ]);

      ({ name, email, role, department } = { ...answers, department: answers.department || department });
    }

    try {
      const config: Partial<OnboardingConfig> = {
        accessLevel: 'basic',
        quantumAccess: ['admin', 'developer', 'researcher'].includes(role),
        aiAccess: ['admin', 'developer', 'researcher'].includes(role),
        departments: department ? [department] : []
      };

      console.log(chalk.yellow('\n⏳ Creating developer profile...\n'));

      const developer = await teamManager.onboardDeveloper(name, email, role as UserRole, config);

      console.log(chalk.green('✅ Developer onboarded successfully!\n'));
      console.log(chalk.white('📊 Developer Profile:'));
      console.log(chalk.gray(`   ID: ${developer.id}`));
      console.log(chalk.gray(`   Name: ${developer.name}`));
      console.log(chalk.gray(`   Email: ${developer.email}`));
      console.log(chalk.gray(`   Role: ${developer.role}`));
      console.log(chalk.gray(`   Access Level: ${developer.accessLevel}`));
      console.log(chalk.gray(`   Environment File: ${developer.environmentFile}`));

      console.log(chalk.blue('\n📋 Next Steps:'));
      console.log(chalk.white('1. Configure OAuth credentials:'));
      console.log(chalk.gray(`   ./scripts/inject-dev-env.sh ${name.toLowerCase().replace(/\s+/g, '')}`));
      console.log(chalk.white('2. Copy environment file:'));
      console.log(chalk.gray(`   cp ${developer.environmentFile} .env.local`));
      console.log(chalk.white('3. Start development:'));
      console.log(chalk.gray('   npm run dev'));

    } catch (error: any) {
      console.error(chalk.red('❌ Onboarding failed:'), error.message);
      process.exit(1);
    }
  });

// ============================================================================
// Offboarding Commands
// ============================================================================

program
  .command('offboard')
  .description('Offboard a developer')
  .option('-i, --id <id>', 'Developer ID')
  .option('-e, --email <email>', 'Developer email')
  .option('-r, --reason <reason>', 'Offboarding reason')
  .option('--interactive', 'Interactive mode')
  .action(async (options) => {
    console.log(chalk.red('🛡️ Sherlock Ω IDE - Developer Offboarding\n'));

    let { id, email, reason } = options;

    // List developers if no ID provided
    if (!id && !email) {
      const developers = await teamManager.listDevelopers({ status: 'active' });
      
      if (developers.length === 0) {
        console.log(chalk.yellow('No active developers found.'));
        return;
      }

      const choices = developers.map(dev => ({
        name: `${dev.name} (${dev.email}) - ${dev.role}`,
        value: dev.id
      }));

      const { selectedId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedId',
          message: 'Select developer to offboard:',
          choices
        }
      ]);

      id = selectedId;
    }

    if (!reason) {
      const { offboardingReason } = await inquirer.prompt([
        {
          type: 'input',
          name: 'offboardingReason',
          message: 'Reason for offboarding:',
          default: 'Standard offboarding'
        }
      ]);
      reason = offboardingReason;
    }

    // Confirmation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red('⚠️ This will remove all access and clean up developer data. Continue?'),
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Offboarding cancelled.'));
      return;
    }

    try {
      console.log(chalk.yellow('\n⏳ Processing offboarding...\n'));

      const report = await teamManager.offboardDeveloper(id, 'CLI Admin', reason);

      console.log(chalk.green('✅ Developer offboarded successfully!\n'));
      console.log(chalk.white('📊 Offboarding Report:'));
      console.log(chalk.gray(`   Developer: ${report.developer.name} (${report.developer.email})`));
      console.log(chalk.gray(`   Actions Completed: ${report.actionsCompleted.length}`));
      console.log(chalk.gray(`   Git Commits Audited: ${report.gitCommitsAudited.length}`));
      console.log(chalk.gray(`   Environment Files Removed: ${report.environmentFilesRemoved.length}`));
      console.log(chalk.gray(`   Timestamp: ${report.timestamp.toISOString()}`));

      console.log(chalk.blue('\n📋 Manual Steps Required:'));
      console.log(chalk.white('1. Follow the comprehensive offboarding checklist:'));
      console.log(chalk.gray('   docs/developer-offboarding-checklist.md'));
      console.log(chalk.white('2. Rotate OAuth secrets if developer had access'));
      console.log(chalk.white('3. Remove from GitHub repository and Supabase project'));
      console.log(chalk.white('4. Update team documentation'));

    } catch (error: any) {
      console.error(chalk.red('❌ Offboarding failed:'), error.message);
      process.exit(1);
    }
  });

// ============================================================================
// List and Management Commands
// ============================================================================

program
  .command('list')
  .description('List developers')
  .option('-s, --status <status>', 'Filter by status (active|inactive|offboarded)')
  .option('-r, --role <role>', 'Filter by role')
  .option('-d, --department <dept>', 'Filter by department')
  .action(async (options) => {
    console.log(chalk.blue('👥 Sherlock Ω IDE - Team Members\n'));

    try {
      const developers = await teamManager.listDevelopers(options);

      if (developers.length === 0) {
        console.log(chalk.yellow('No developers found matching the criteria.'));
        return;
      }

      console.log(chalk.white(`Found ${developers.length} developer(s):\n`));

      developers.forEach((dev, index) => {
        const statusColor = dev.status === 'active' ? chalk.green : 
                          dev.status === 'inactive' ? chalk.yellow : chalk.red;
        
        console.log(chalk.white(`${index + 1}. ${dev.name}`));
        console.log(chalk.gray(`   ID: ${dev.id}`));
        console.log(chalk.gray(`   Email: ${dev.email}`));
        console.log(chalk.gray(`   Role: ${dev.role}`));
        console.log(chalk.gray(`   Status: ${statusColor(dev.status)}`));
        console.log(chalk.gray(`   Access Level: ${dev.accessLevel}`));
        console.log(chalk.gray(`   Department: ${dev.department || 'N/A'}`));
        console.log(chalk.gray(`   Onboarded: ${dev.onboardingDate.toLocaleDateString()}`));
        console.log(chalk.gray(`   Last Active: ${dev.lastActive.toLocaleDateString()}`));
        if (dev.environmentFile) {
          console.log(chalk.gray(`   Environment: ${dev.environmentFile}`));
        }
        console.log('');
      });

    } catch (error: any) {
      console.error(chalk.red('❌ Failed to list developers:'), error.message);
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Audit developer git commits')
  .option('-e, --email <email>', 'Developer email')
  .option('-n, --name <name>', 'Developer name')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Sherlock Ω IDE - Developer Audit\n'));

    let { email, name } = options;

    if (!email && !name) {
      const developers = await teamManager.listDevelopers({ status: 'active' });
      
      if (developers.length === 0) {
        console.log(chalk.yellow('No active developers found.'));
        return;
      }

      const choices = developers.map(dev => ({
        name: `${dev.name} (${dev.email})`,
        value: dev.email
      }));

      const { selectedEmail } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedEmail',
          message: 'Select developer to audit:',
          choices
        }
      ]);

      email = selectedEmail;
    }

    if (!email) {
      console.error(chalk.red('❌ Email is required for audit'));
      process.exit(1);
    }

    try {
      console.log(chalk.yellow(`⏳ Auditing commits for ${email}...\n`));

      // Use git to get commit history
      const { execSync } = require('child_process');
      const output = execSync(
        `git log --author="${email}" --pretty=format:"%h|%s|%ad|%an" --date=short -n 20`,
        { encoding: 'utf8' }
      );

      const commits = output.trim().split('\n').filter(line => line);

      if (commits.length === 0) {
        console.log(chalk.yellow('No commits found for this developer.'));
        return;
      }

      console.log(chalk.white(`📊 Found ${commits.length} commit(s):\n`));

      commits.forEach((commit, index) => {
        const [hash, message, date, author] = commit.split('|');
        console.log(chalk.white(`${index + 1}. ${hash} - ${date}`));
        console.log(chalk.gray(`   ${message}`));
        console.log(chalk.gray(`   Author: ${author}`));
        console.log('');
      });

      // Check for potential secrets
      console.log(chalk.blue('🔍 Scanning for potential secrets...\n'));
      
      try {
        const secretScan = execSync(
          `git log --author="${email}" -p | grep -iE "(password|secret|key|token|api)" | head -10`,
          { encoding: 'utf8' }
        );

        if (secretScan.trim()) {
          console.log(chalk.red('⚠️ Potential secrets found in commits:'));
          console.log(chalk.gray(secretScan));
        } else {
          console.log(chalk.green('✅ No obvious secrets found in commits'));
        }
      } catch {
        console.log(chalk.green('✅ No obvious secrets found in commits'));
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Audit failed:'), error.message);
      process.exit(1);
    }
  });

// ============================================================================
// Utility Commands
// ============================================================================

program
  .command('checklist')
  .description('Open offboarding checklist')
  .action(() => {
    const checklistPath = path.join(process.cwd(), 'docs/developer-offboarding-checklist.md');
    
    if (fs.existsSync(checklistPath)) {
      console.log(chalk.blue('📋 Opening offboarding checklist...\n'));
      console.log(chalk.white(`Checklist location: ${checklistPath}`));
      console.log(chalk.gray('Use your preferred editor to open and complete the checklist.'));
      
      // Try to open with default editor
      try {
        const { execSync } = require('child_process');
        execSync(`open "${checklistPath}"`, { stdio: 'ignore' });
      } catch {
        console.log(chalk.yellow('Could not auto-open file. Please open manually.'));
      }
    } else {
      console.error(chalk.red('❌ Offboarding checklist not found'));
      console.log(chalk.gray('Expected location: docs/developer-offboarding-checklist.md'));
    }
  });

program
  .command('status')
  .description('Show team management system status')
  .action(async () => {
    console.log(chalk.blue('📊 Sherlock Ω IDE - Team Management Status\n'));

    try {
      const allDevelopers = await teamManager.listDevelopers();
      const activeDevelopers = allDevelopers.filter(d => d.status === 'active');
      const offboardedDevelopers = allDevelopers.filter(d => d.status === 'offboarded');

      console.log(chalk.white('Team Statistics:'));
      console.log(chalk.gray(`   Total Developers: ${allDevelopers.length}`));
      console.log(chalk.gray(`   Active: ${activeDevelopers.length}`));
      console.log(chalk.gray(`   Offboarded: ${offboardedDevelopers.length}`));

      // Role breakdown
      const roleBreakdown: Record<string, number> = {};
      activeDevelopers.forEach(dev => {
        roleBreakdown[dev.role] = (roleBreakdown[dev.role] || 0) + 1;
      });

      console.log(chalk.white('\nRole Breakdown (Active):'));
      Object.entries(roleBreakdown).forEach(([role, count]) => {
        console.log(chalk.gray(`   ${role}: ${count}`));
      });

      // Recent activity
      const recentlyActive = activeDevelopers
        .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
        .slice(0, 5);

      if (recentlyActive.length > 0) {
        console.log(chalk.white('\nRecently Active:'));
        recentlyActive.forEach(dev => {
          console.log(chalk.gray(`   ${dev.name} - ${dev.lastActive.toLocaleDateString()}`));
        });
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
    }
  });

// ============================================================================
// Parse and Execute
// ============================================================================

if (require.main === module) {
  program.parse();
}

export default program;