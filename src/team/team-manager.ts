/**
 * Team Management System for Sherlock Ω IDE
 * Enterprise-grade developer onboarding, offboarding, and access management
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserRole, hasPermission, canUpgradeRole } from '../auth/roles';
import { Logger } from '../logging/logger';
import { PlatformType } from '../types/core';

export interface DeveloperProfile {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  role: UserRole;
  department?: string;
  organization?: string;
  onboardingDate: Date;
  lastActive: Date;
  environmentFile?: string;
  gitCommits?: GitCommitInfo[];
  accessLevel: 'basic' | 'advanced' | 'enterprise';
  status: 'active' | 'inactive' | 'offboarded';
}

export interface GitCommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
}

export interface OnboardingConfig {
  role: UserRole;
  permissions: string[];
  accessLevel: 'basic' | 'advanced' | 'enterprise';
  quantumAccess: boolean;
  aiAccess: boolean;
  departments: string[];
}

export interface OffboardingReport {
  developer: DeveloperProfile;
  actionsCompleted: string[];
  secretsRotated: string[];
  gitCommitsAudited: GitCommitInfo[];
  environmentFilesRemoved: string[];
  timestamp: Date;
  completedBy: string;
  currentGitCommit: string;
}

export class TeamManager {
  private logger: Logger;
  private projectRoot: string;
  private developersFile: string;
  private auditLogFile: string;

  constructor() {
    this.logger = new Logger(PlatformType.NODE);
    this.projectRoot = process.cwd();
    this.developersFile = path.join(this.projectRoot, 'team-developers.json');
    this.auditLogFile = path.join(this.projectRoot, 'audit-log-team-management.json');
  }

  // ============================================================================
  // Developer Onboarding
  // ============================================================================

  async onboardDeveloper(
    name: string,
    email: string,
    role: UserRole,
    config: Partial<OnboardingConfig> = {}
  ): Promise<DeveloperProfile> {
    this.logger.info('Starting developer onboarding', { name, email, role });

    const developer: DeveloperProfile = {
      id: this.generateDeveloperId(),
      name,
      email,
      role,
      department: config.departments?.[0],
      organization: config.departments?.[0],
      onboardingDate: new Date(),
      lastActive: new Date(),
      accessLevel: config.accessLevel || 'basic',
      status: 'active'
    };

    // Create developer environment
    const envFileName = await this.createDeveloperEnvironment(developer);
    developer.environmentFile = envFileName;

    // Save developer profile
    await this.saveDeveloperProfile(developer);

    // Create audit log entry
    await this.logAction('developer_onboarded', {
      developer: developer.id,
      role,
      environmentFile: envFileName,
      gitCommit: this.getCurrentGitCommit()
    });

    this.logger.info('Developer onboarding completed', { 
      developerId: developer.id,
      environmentFile: envFileName 
    });

    return developer;
  }

  private async createDeveloperEnvironment(developer: DeveloperProfile): Promise<string> {
    const envFileName = `.env.${developer.name.toLowerCase().replace(/\s+/g, '')}.local`;
    const envPath = path.join(this.projectRoot, envFileName);

    // Use the inject-dev-env.sh script logic
    const gitCommit = this.getCurrentGitCommit();
    const gitBranch = this.getCurrentGitBranch();

    const envContent = `# Sherlock Ω IDE - Developer Environment Configuration
# Developer: ${developer.name}
# Email: ${developer.email}
# Role: ${developer.role}
# Generated: ${new Date().toISOString()}
# Git Commit: ${gitCommit}

# ============================================================================
# DEVELOPER INFO
# ============================================================================
DEVELOPER_NAME=${developer.name}
DEVELOPER_EMAIL=${developer.email}
DEVELOPER_ROLE=${developer.role}
DEVELOPER_ID=${developer.id}

# ============================================================================
# GIT TRACKING
# ============================================================================
GIT_COMMIT=${gitCommit}
GIT_BRANCH=${gitBranch}
CONFIG_GENERATED=${new Date().toISOString()}

# ============================================================================
# CORE APPLICATION SETTINGS
# ============================================================================
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3002
NEXTAUTH_URL=http://127.0.0.1:3002
NODE_ENV=development
PORT=3002

# ============================================================================
# GITHUB OAUTH INTEGRATION (TO BE CONFIGURED)
# ============================================================================
GITHUB_CLIENT_ID=github_client_id_placeholder
GITHUB_CLIENT_SECRET=github_client_secret_placeholder
GITHUB_ACCESS_TOKEN=ghp_personal_access_token_placeholder

# ============================================================================
# SUPABASE CONFIGURATION (TO BE CONFIGURED)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://ecgexzqtuhgdinohychp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase_anon_key_placeholder
SUPABASE_SERVICE_ROLE_KEY=supabase_service_role_key_placeholder
SUPABASE_JWT_SECRET=supabase_jwt_secret_placeholder

# ============================================================================
# SECURITY (AUTO-GENERATED)
# ============================================================================
NEXTAUTH_SECRET=${this.generateSecret()}
JWT_SECRET=${this.generateSecret()}
ENCRYPTION_KEY=${this.generateSecret()}

# ============================================================================
# FEATURE ACCESS (ROLE-BASED)
# ============================================================================
FEATURE_QUANTUM_COMPUTING=${this.hasQuantumAccess(developer.role)}
FEATURE_AI_ASSISTANCE=${this.hasAIAccess(developer.role)}
FEATURE_COLLABORATION=true
FEATURE_TELEMETRY=false

# ============================================================================
# INFRASTRUCTURE
# ============================================================================
MONGODB_URI=mongodb://localhost:27017/sherlock-omega-ide-${developer.name.toLowerCase()}
REDIS_URL=redis://localhost:6379

# ============================================================================
# SETUP STATUS
# ============================================================================
DEVELOPER_ENV_SETUP=true
OAUTH_SETUP_COMPLETE=false
`;

    fs.writeFileSync(envPath, envContent);
    fs.chmodSync(envPath, 0o600); // Secure permissions

    return envFileName;
  }

  // ============================================================================
  // Developer Offboarding
  // ============================================================================

  async offboardDeveloper(
    developerId: string,
    completedBy: string,
    reason: string = 'Standard offboarding'
  ): Promise<OffboardingReport> {
    this.logger.info('Starting developer offboarding', { developerId, completedBy });

    const developer = await this.getDeveloperProfile(developerId);
    if (!developer) {
      throw new Error(`Developer not found: ${developerId}`);
    }

    const report: OffboardingReport = {
      developer,
      actionsCompleted: [],
      secretsRotated: [],
      gitCommitsAudited: [],
      environmentFilesRemoved: [],
      timestamp: new Date(),
      completedBy,
      currentGitCommit: this.getCurrentGitCommit()
    };

    // 1. Audit git commits
    report.gitCommitsAudited = this.auditDeveloperCommits(developer.email);
    report.actionsCompleted.push('git_commits_audited');

    // 2. Remove environment files
    const envFilesToRemove = this.findDeveloperEnvironmentFiles(developer.name);
    for (const envFile of envFilesToRemove) {
      if (fs.existsSync(envFile)) {
        fs.unlinkSync(envFile);
        report.environmentFilesRemoved.push(envFile);
      }
    }
    report.actionsCompleted.push('environment_files_removed');

    // 3. Mark as offboarded
    developer.status = 'offboarded';
    await this.saveDeveloperProfile(developer);
    report.actionsCompleted.push('developer_status_updated');

    // 4. Create comprehensive audit log
    await this.logAction('developer_offboarded', {
      developerId,
      developer: developer.name,
      email: developer.email,
      reason,
      completedBy,
      gitCommitsCount: report.gitCommitsAudited.length,
      environmentFilesRemoved: report.environmentFilesRemoved.length,
      gitCommit: report.currentGitCommit
    });

    // 5. Generate offboarding report
    const reportPath = path.join(this.projectRoot, `offboarding-report-${developer.id}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    report.actionsCompleted.push('offboarding_report_generated');

    this.logger.info('Developer offboarding completed', { 
      developerId,
      actionsCompleted: report.actionsCompleted.length 
    });

    return report;
  }

  // ============================================================================
  // Developer Management
  // ============================================================================

  async updateDeveloperRole(
    currentUser: User,
    developerId: string,
    newRole: UserRole
  ): Promise<DeveloperProfile> {
    const developer = await this.getDeveloperProfile(developerId);
    if (!developer) {
      throw new Error(`Developer not found: ${developerId}`);
    }

    // Check permissions
    if (!hasPermission(currentUser, 'manage:roles')) {
      throw new Error('Insufficient permissions to manage roles');
    }

    if (!canUpgradeRole(currentUser, newRole)) {
      throw new Error('Cannot upgrade to this role level');
    }

    const oldRole = developer.role;
    developer.role = newRole;
    developer.lastActive = new Date();

    await this.saveDeveloperProfile(developer);

    // Update environment file with new role
    if (developer.environmentFile) {
      await this.updateEnvironmentRole(developer.environmentFile, newRole);
    }

    await this.logAction('developer_role_updated', {
      developerId,
      oldRole,
      newRole,
      updatedBy: currentUser.id,
      gitCommit: this.getCurrentGitCommit()
    });

    this.logger.info('Developer role updated', { 
      developerId,
      oldRole,
      newRole,
      updatedBy: currentUser.id 
    });

    return developer;
  }

  async listDevelopers(filter: {
    status?: 'active' | 'inactive' | 'offboarded';
    role?: UserRole;
    department?: string;
  } = {}): Promise<DeveloperProfile[]> {
    const developers = await this.loadAllDevelopers();
    
    return developers.filter(dev => {
      if (filter.status && dev.status !== filter.status) return false;
      if (filter.role && dev.role !== filter.role) return false;
      if (filter.department && dev.department !== filter.department) return false;
      return true;
    });
  }

  // ============================================================================
  // Git and Security Utilities
  // ============================================================================

  private auditDeveloperCommits(email: string): GitCommitInfo[] {
    try {
      const output = execSync(
        `git log --author="${email}" --pretty=format:"%h|%H|%s|%ad|%an" --date=short -n 20`,
        { encoding: 'utf8', cwd: this.projectRoot }
      );

      return output.trim().split('\n').map(line => {
        const [shortHash, hash, message, date, author] = line.split('|');
        return { hash, shortHash, message, date, author };
      }).filter(commit => commit.hash);
    } catch (error) {
      this.logger.warn('Failed to audit developer commits', { email, error });
      return [];
    }
  }

  private findDeveloperEnvironmentFiles(developerName: string): string[] {
    const baseName = developerName.toLowerCase().replace(/\s+/g, '');
    const patterns = [
      `.env.${baseName}.local`,
      `.env.${baseName}.*`,
      `.env.*${baseName}*`
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      try {
        const matches = execSync(`find . -maxdepth 1 -name "${pattern}"`, {
          encoding: 'utf8',
          cwd: this.projectRoot
        }).trim().split('\n').filter(f => f);
        files.push(...matches);
      } catch (error) {
        // Pattern not found, continue
      }
    }

    return [...new Set(files)];
  }

  private getCurrentGitCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: this.projectRoot }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getCurrentGitBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: this.projectRoot }).trim();
    } catch {
      return 'unknown';
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateDeveloperId(): string {
    return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecret(): string {
    return require('crypto').randomBytes(32).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
  }

  private hasQuantumAccess(role: UserRole): boolean {
    return ['admin', 'developer', 'researcher'].includes(role);
  }

  private hasAIAccess(role: UserRole): boolean {
    return ['admin', 'developer', 'researcher'].includes(role);
  }

  private async saveDeveloperProfile(developer: DeveloperProfile): Promise<void> {
    const developers = await this.loadAllDevelopers();
    const index = developers.findIndex(d => d.id === developer.id);
    
    if (index >= 0) {
      developers[index] = developer;
    } else {
      developers.push(developer);
    }

    fs.writeFileSync(this.developersFile, JSON.stringify(developers, null, 2));
  }

  private async getDeveloperProfile(developerId: string): Promise<DeveloperProfile | null> {
    const developers = await this.loadAllDevelopers();
    return developers.find(d => d.id === developerId) || null;
  }

  private async loadAllDevelopers(): Promise<DeveloperProfile[]> {
    if (!fs.existsSync(this.developersFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.developersFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Failed to load developers file', { error });
      return [];
    }
  }

  private async updateEnvironmentRole(envFile: string, role: UserRole): Promise<void> {
    const envPath = path.join(this.projectRoot, envFile);
    if (!fs.existsSync(envPath)) return;

    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/DEVELOPER_ROLE=.+/, `DEVELOPER_ROLE=${role}`);
    content = content.replace(/FEATURE_QUANTUM_COMPUTING=.+/, `FEATURE_QUANTUM_COMPUTING=${this.hasQuantumAccess(role)}`);
    content = content.replace(/FEATURE_AI_ASSISTANCE=.+/, `FEATURE_AI_ASSISTANCE=${this.hasAIAccess(role)}`);

    fs.writeFileSync(envPath, content);
  }

  private async logAction(action: string, details: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    };

    let logs: any[] = [];
    if (fs.existsSync(this.auditLogFile)) {
      try {
        const content = fs.readFileSync(this.auditLogFile, 'utf8');
        logs = JSON.parse(content);
      } catch (error) {
        this.logger.warn('Failed to read audit log, creating new', { error });
      }
    }

    logs.push(logEntry);
    fs.writeFileSync(this.auditLogFile, JSON.stringify(logs, null, 2));
  }
}

export default TeamManager;