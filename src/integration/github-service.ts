/**
 * GitHub Integration Service
 * Enterprise-grade GitHub automation for Sherlock Ω IDE
 * 
 * Features:
 * - Repository management and automation
 * - GitHub Actions workflow orchestration  
 * - Issue and PR automation
 * - Code quality integration
 * - Security scanning integration
 */

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../types/core';
import * as fs from 'fs';
import * as path from 'path';

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  appId?: string;
  installationId?: string;
  privateKeyPath?: string;
  webhookSecret?: string;
}

export interface GitHubRepository {
  owner: string;
  repo: string;
  branch?: string;
}

export interface WorkflowTrigger {
  workflowId: string;
  ref: string;
  inputs?: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'push' | 'pull_request' | 'issue' | 'schedule' | 'manual';
  conditions: Record<string, any>;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'workflow' | 'comment' | 'label' | 'assign' | 'merge' | 'close';
  parameters: Record<string, any>;
}

export class GitHubIntegrationService {
  private octokit: Octokit;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private config: GitHubConfig;
  private automationRules: Map<string, AutomationRule> = new Map();

  constructor(config: GitHubConfig) {
    this.config = config;
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);

    // Initialize Octokit with appropriate authentication
    this.octokit = this.initializeOctokit();
    this.loadAutomationRules();

    this.logger.info('GitHub Integration Service initialized', {
      hasAppAuth: !!config.appId,
      hasPersonalToken: !!config.accessToken
    });
  }

  private initializeOctokit(): Octokit {
    if (this.config.appId && this.config.installationId && this.config.privateKeyPath) {
      // GitHub App authentication (preferred for automation)
      return new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.config.appId,
          privateKey: this.loadPrivateKey(),
          installationId: this.config.installationId,
        },
      });
    } else if (this.config.accessToken) {
      // Personal access token authentication
      return new Octokit({
        auth: this.config.accessToken,
      });
    } else {
      // Unauthenticated (rate-limited)
      return new Octokit();
    }
  }

  private loadPrivateKey(): string {
    if (!this.config.privateKeyPath) {
      throw new Error('Private key path not configured for GitHub App');
    }

    const keyPath = path.resolve(this.config.privateKeyPath);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`GitHub App private key not found at: ${keyPath}`);
    }

    return fs.readFileSync(keyPath, 'utf8');
  }

  private loadAutomationRules(): void {
    // Default automation rules for Sherlock Ω IDE
    const defaultRules: AutomationRule[] = [
      {
        id: 'quantum-algorithm-ci',
        name: 'Quantum Algorithm CI',
        description: 'Trigger quantum algorithm testing on PR',
        trigger: 'pull_request',
        conditions: {
          files: ['src/ai/quantum/**/*.ts', 'src/examples/quantum-*.ts'],
          action: ['opened', 'synchronize']
        },
        actions: [
          {
            type: 'workflow',
            parameters: {
              workflowId: 'quantum-tests.yml',
              inputs: { test_suite: 'quantum' }
            }
          },
          {
            type: 'comment',
            parameters: {
              body: '🔬 Quantum algorithm changes detected. Running specialized test suite...'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'security-scan',
        name: 'Security Vulnerability Scan',
        description: 'Scan for security vulnerabilities on push',
        trigger: 'push',
        conditions: {
          branch: 'main',
          files: ['package.json', 'src/**/*.ts']
        },
        actions: [
          {
            type: 'workflow',
            parameters: {
              workflowId: 'security-scan.yml'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'auto-label-features',
        name: 'Auto-label Feature PRs',
        description: 'Automatically label feature branches',
        trigger: 'pull_request',
        conditions: {
          action: ['opened'],
          branch_pattern: 'feature/*'
        },
        actions: [
          {
            type: 'label',
            parameters: {
              labels: ['feature', 'needs-review']
            }
          }
        ],
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.automationRules.set(rule.id, rule);
    });
  }

  // Repository Management
  async createRepository(name: string, options: {
    description?: string;
    private?: boolean;
    template?: string;
    autoInit?: boolean;
  } = {}): Promise<any> {
    return this.performanceMonitor.timeAsync('github-create-repo', async () => {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description: options.description || 'Created by Sherlock Ω IDE',
        private: options.private ?? true,
        auto_init: options.autoInit ?? true,
        template_repository: options.template
      });

      this.logger.info('Repository created', { 
        name, 
        id: response.data.id,
        url: response.data.html_url 
      });

      return response.data;
    });
  }

  async setupRepository(repo: GitHubRepository, setupOptions: {
    enableIssues?: boolean;
    enableProjects?: boolean;
    enableWiki?: boolean;
    enablePages?: boolean;
    defaultBranch?: string;
    branchProtection?: boolean;
  } = {}): Promise<void> {
    const { owner, repo: repoName } = repo;

    // Update repository settings
    await this.octokit.repos.update({
      owner,
      repo: repoName,
      has_issues: setupOptions.enableIssues ?? true,
      has_projects: setupOptions.enableProjects ?? true,
      has_wiki: setupOptions.enableWiki ?? false,
      has_pages: setupOptions.enablePages ?? false,
      default_branch: setupOptions.defaultBranch ?? 'main'
    });

    // Set up branch protection if enabled
    if (setupOptions.branchProtection) {
      await this.setupBranchProtection(repo, setupOptions.defaultBranch ?? 'main');
    }

    // Add default labels
    await this.setupDefaultLabels(repo);

    // Create default issue templates
    await this.setupIssueTemplates(repo);

    this.logger.info('Repository setup completed', { owner, repo: repoName });
  }

  private async setupBranchProtection(repo: GitHubRepository, branch: string): Promise<void> {
    const { owner, repo: repoName } = repo;

    await this.octokit.repos.updateBranchProtection({
      owner,
      repo: repoName,
      branch,
      required_status_checks: {
        strict: true,
        contexts: ['ci/tests', 'ci/security-scan', 'ci/quantum-tests']
      },
      enforce_admins: false,
      required_pull_request_reviews: {
        required_approving_review_count: 1,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: true
      },
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false
    });
  }

  private async setupDefaultLabels(repo: GitHubRepository): Promise<void> {
    const { owner, repo: repoName } = repo;

    const defaultLabels = [
      { name: 'quantum', color: '8A2BE2', description: 'Quantum computing related' },
      { name: 'ai', color: '00CED1', description: 'AI/ML related features' },
      { name: 'security', color: 'FF0000', description: 'Security-related issues' },
      { name: 'performance', color: 'FFA500', description: 'Performance improvements' },
      { name: 'automation', color: '32CD32', description: 'Automation and CI/CD' },
      { name: 'needs-review', color: 'FFFF00', description: 'Awaiting code review' },
      { name: 'priority-high', color: 'FF1493', description: 'High priority' },
      { name: 'good-first-issue', color: '98FB98', description: 'Good for newcomers' }
    ];

    for (const label of defaultLabels) {
      try {
        await this.octokit.issues.createLabel({
          owner,
          repo: repoName,
          ...label
        });
      } catch (error: any) {
        if (error.status !== 422) { // Label already exists
          this.logger.warn('Failed to create label', { label: label.name, error: error.message });
        }
      }
    }
  }

  private async setupIssueTemplates(repo: GitHubRepository): Promise<void> {
    const { owner, repo: repoName } = repo;

    const templates = [
      {
        name: 'bug_report.md',
        content: this.getBugReportTemplate()
      },
      {
        name: 'feature_request.md',
        content: this.getFeatureRequestTemplate()
      },
      {
        name: 'quantum_algorithm.md',
        content: this.getQuantumAlgorithmTemplate()
      }
    ];

    for (const template of templates) {
      try {
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: `.github/ISSUE_TEMPLATE/${template.name}`,
          message: `Add ${template.name} issue template`,
          content: Buffer.from(template.content).toString('base64')
        });
      } catch (error: any) {
        this.logger.warn('Failed to create issue template', { 
          template: template.name, 
          error: error.message 
        });
      }
    }
  }

  // Workflow Management
  async triggerWorkflow(repo: GitHubRepository, trigger: WorkflowTrigger): Promise<any> {
    const { owner, repo: repoName } = repo;

    return this.performanceMonitor.timeAsync('github-trigger-workflow', async () => {
      const response = await this.octokit.actions.createWorkflowDispatch({
        owner,
        repo: repoName,
        workflow_id: trigger.workflowId,
        ref: trigger.ref,
        inputs: trigger.inputs || {}
      });

      this.logger.info('Workflow triggered', {
        workflow: trigger.workflowId,
        ref: trigger.ref,
        inputs: trigger.inputs
      });

      return response;
    });
  }

  async getWorkflowRuns(repo: GitHubRepository, workflowId?: string): Promise<any[]> {
    const { owner, repo: repoName } = repo;

    const response = await this.octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo: repoName,
      workflow_id: workflowId,
      per_page: 50
    });

    return response.data.workflow_runs;
  }

  // Automation Engine
  async processWebhook(event: string, payload: any): Promise<void> {
    this.logger.info('Processing GitHub webhook', { event, action: payload.action });

    for (const [ruleId, rule] of this.automationRules) {
      if (!rule.enabled || rule.trigger !== event) continue;

      if (await this.evaluateConditions(rule.conditions, payload)) {
        await this.executeActions(rule.actions, payload);
        this.logger.info('Automation rule executed', { ruleId, rule: rule.name });
      }
    }
  }

  private async evaluateConditions(conditions: Record<string, any>, payload: any): Promise<boolean> {
    // Branch condition
    if (conditions.branch && payload.ref) {
      const branch = payload.ref.replace('refs/heads/', '');
      if (branch !== conditions.branch) return false;
    }

    // Branch pattern condition
    if (conditions.branch_pattern && payload.pull_request?.head?.ref) {
      const branch = payload.pull_request.head.ref;
      const pattern = conditions.branch_pattern.replace('*', '.*');
      if (!new RegExp(pattern).test(branch)) return false;
    }

    // Action condition
    if (conditions.action && !conditions.action.includes(payload.action)) {
      return false;
    }

    // Files condition
    if (conditions.files && payload.commits) {
      const changedFiles = payload.commits.flatMap((commit: any) => 
        [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])]
      );

      const filePatterns = Array.isArray(conditions.files) ? conditions.files : [conditions.files];
      const hasMatchingFile = filePatterns.some((pattern: string) => 
        changedFiles.some((file: string) => file.match(pattern.replace('**', '.*')))
      );

      if (!hasMatchingFile) return false;
    }

    return true;
  }

  private async executeActions(actions: AutomationAction[], payload: any): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'workflow':
            await this.executeWorkflowAction(action, payload);
            break;
          case 'comment':
            await this.executeCommentAction(action, payload);
            break;
          case 'label':
            await this.executeLabelAction(action, payload);
            break;
          case 'assign':
            await this.executeAssignAction(action, payload);
            break;
          default:
            this.logger.warn('Unknown automation action type', { type: action.type });
        }
      } catch (error: any) {
        this.logger.error('Failed to execute automation action', {
          type: action.type,
          error: error.message
        });
      }
    }
  }

  private async executeWorkflowAction(action: AutomationAction, payload: any): Promise<void> {
    const { workflowId, inputs } = action.parameters;
    const repo = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name
    };

    await this.triggerWorkflow(repo, {
      workflowId,
      ref: payload.ref || 'main',
      inputs
    });
  }

  private async executeCommentAction(action: AutomationAction, payload: any): Promise<void> {
    const { body } = action.parameters;

    if (payload.pull_request) {
      await this.octokit.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body
      });
    }
  }

  private async executeLabelAction(action: AutomationAction, payload: any): Promise<void> {
    const { labels } = action.parameters;

    if (payload.pull_request) {
      await this.octokit.issues.addLabels({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        labels
      });
    }
  }

  private async executeAssignAction(action: AutomationAction, payload: any): Promise<void> {
    const { assignees } = action.parameters;

    if (payload.pull_request) {
      await this.octokit.issues.addAssignees({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        assignees
      });
    }
  }

  // Template Methods
  private getBugReportTemplate(): string {
    return `---
name: Bug report
about: Create a report to help us improve Sherlock Ω IDE
title: ''
labels: 'bug'
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.17.0]
- IDE version: [e.g. 1.0.0]
- Browser (if applicable): [e.g. Chrome, Safari]

**Quantum/AI Context (if applicable):**
- Algorithm type: [e.g. Grover's, VQE]
- Quantum backend: [e.g. simulator, IBM Quantum]
- AI model: [e.g. GPT-4, Claude]

**Additional context**
Add any other context about the problem here.
`;
  }

  private getFeatureRequestTemplate(): string {
    return `---
name: Feature request
about: Suggest an idea for Sherlock Ω IDE
title: ''
labels: 'enhancement'
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Feature Category**
- [ ] Quantum Computing
- [ ] AI/ML Integration
- [ ] IDE User Experience
- [ ] Performance/Optimization
- [ ] Security
- [ ] Automation/CI-CD
- [ ] Plugin System
- [ ] Documentation
- [ ] Other

**Technical Considerations**
- Impact on existing features: [Low/Medium/High]
- Implementation complexity: [Low/Medium/High]
- Breaking changes: [Yes/No]

**Additional context**
Add any other context or screenshots about the feature request here.
`;
  }

  private getQuantumAlgorithmTemplate(): string {
    return `---
name: Quantum Algorithm Implementation
about: Propose a new quantum algorithm for Sherlock Ω IDE
title: 'Implement [Algorithm Name]'
labels: 'quantum, enhancement'
assignees: ''
---

**Algorithm Details**
- **Name**: [e.g. Variational Quantum Eigensolver]
- **Type**: [e.g. Optimization, Search, Simulation]
- **Complexity**: [Classical/Quantum complexity analysis]

**Use Cases**
Describe the practical applications and use cases for this algorithm.

**Implementation Requirements**
- [ ] Circuit design and gates required
- [ ] Classical pre/post-processing
- [ ] Noise model considerations
- [ ] Simulator compatibility
- [ ] Hardware requirements

**Educational Content**
- [ ] Tutorial/documentation needed
- [ ] Interactive visualizations
- [ ] Example use cases
- [ ] Performance benchmarks

**References**
- Paper/arXiv links
- Related implementations
- Theoretical background

**Testing Strategy**
- Unit tests for quantum circuits
- Integration tests with simulators
- Performance benchmarks
- Verification against known results

**Additional Context**
Add any other context about the quantum algorithm here.
`;
  }

  // Utility Methods
  async validateConfiguration(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      this.logger.info('GitHub authentication validated', { user: user.login });
    } catch (error: any) {
      issues.push(`Authentication failed: ${error.message}`);
    }

    if (!this.config.webhookSecret) {
      issues.push('Webhook secret not configured - webhooks will not be secure');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  getAutomationRules(): AutomationRule[] {
    return Array.from(this.automationRules.values());
  }

  addAutomationRule(rule: AutomationRule): void {
    this.automationRules.set(rule.id, rule);
    this.logger.info('Automation rule added', { ruleId: rule.id, name: rule.name });
  }

  removeAutomationRule(ruleId: string): boolean {
    const removed = this.automationRules.delete(ruleId);
    if (removed) {
      this.logger.info('Automation rule removed', { ruleId });
    }
    return removed;
  }

  async getRepositoryInsights(repo: GitHubRepository): Promise<any> {
    const { owner, repo: repoName } = repo;

    const [
      repoData,
      releases,
      contributors,
      languages,
      traffic
    ] = await Promise.all([
      this.octokit.repos.get({ owner, repo: repoName }),
      this.octokit.repos.listReleases({ owner, repo: repoName, per_page: 10 }),
      this.octokit.repos.listContributors({ owner, repo: repoName, per_page: 10 }),
      this.octokit.repos.listLanguages({ owner, repo: repoName }),
      this.octokit.repos.getClones({ owner, repo: repoName }).catch(() => ({ data: { count: 0, uniques: 0 } }))
    ]);

    return {
      repository: repoData.data,
      releases: releases.data,
      contributors: contributors.data,
      languages: languages.data,
      traffic: traffic.data,
      insights: {
        health: {
          hasReadme: !!repoData.data.has_pages,
          hasLicense: !!repoData.data.license,
          hasIssueTemplates: true, // We create these
          hasPullRequestTemplate: false,
          hasCodeOfConduct: false
        }
      }
    };
  }
}

export default GitHubIntegrationService;