/**
 * GitHubIntegrationService - Complete GitHub integration for Sherlock Ω
 * Combines authentication, repository management, and secure operations
 */

import { GitHubAuthManager, AuthState } from './GitHubAuthManager';
import { GitHubRepositoryManager, Repository, RepositoryAnalysis, ScrapedRepository } from './GitHubRepositoryManager';
import { EventEmitter } from 'events';

export interface GitHubIntegrationConfig {
  auth: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    useDeviceFlow: boolean;
  };
  autoInstall: {
    enabled: boolean;
    allowedLicenses: string[];
    maxRepoSize: number;
    excludePatterns: string[];
  };
  scraping: {
    respectRateLimit: boolean;
    maxConcurrentRequests: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

export interface InstallationResult {
  success: boolean;
  repository: Repository;
  localPath: string;
  analysis: RepositoryAnalysis;
  warnings: string[];
  errors: string[];
}

export interface SecurityCheck {
  passed: boolean;
  issues: SecurityIssue[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityIssue {
  type: 'license' | 'size' | 'content' | 'permissions';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
}

export class GitHubIntegrationService extends EventEmitter {
  private authManager: GitHubAuthManager;
  private repoManager: GitHubRepositoryManager;
  private config: GitHubIntegrationConfig;
  private isInitialized = false;

  constructor(
    authManager: GitHubAuthManager,
    repoManager: GitHubRepositoryManager,
    config: GitHubIntegrationConfig
  ) {
    super();
    this.authManager = authManager;
    this.repoManager = repoManager;
    this.config = config;

    // Forward events from managers
    this.authManager.on('auth:success', (state) => this.emit('auth:success', state));
    this.authManager.on('auth:error', (error) => this.emit('auth:error', error));
    this.authManager.on('auth:logout', () => this.emit('auth:logout'));

    this.repoManager.on('repository:cloned', (data) => this.emit('repository:cloned', data));
    this.repoManager.on('repository:forked', (data) => this.emit('repository:forked', data));
    this.repoManager.on('repository:analyzed', (data) => this.emit('repository:analyzed', data));
  }

  /**
   * Initialize the GitHub integration service
   */
  async initialize(): Promise<void> {
    try {
      // Check if already authenticated
      const authState = this.authManager.getAuthState();
      if (!authState.isAuthenticated) {
        // Try to load stored credentials
        await this.authManager.refreshAuthState();
      }

      this.isInitialized = true;
      this.emit('service:initialized');
    } catch (error) {
      this.emit('service:initialization-error', error);
      throw error;
    }
  }

  /**
   * Authenticate with GitHub
   */
  async authenticate(): Promise<AuthState> {
    return await this.authManager.authenticate();
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return this.authManager.getAuthState();
  }

  /**
   * Logout from GitHub
   */
  async logout(): Promise<void> {
    await this.authManager.logout();
  }

  /**
   * Auto-install repository with security checks
   */
  async autoInstallRepository(owner: string, repo: string, destination: string): Promise<InstallationResult> {
    if (!this.config.autoInstall.enabled) {
      throw new Error('Auto-install is disabled');
    }

    const result: InstallationResult = {
      success: false,
      repository: {} as Repository,
      localPath: '',
      analysis: {} as RepositoryAnalysis,
      warnings: [],
      errors: []
    };

    try {
      // Step 1: Get repository information
      result.repository = await this.repoManager.getRepository(owner, repo);

      // Step 2: Perform security checks
      const securityCheck = await this.performSecurityCheck(result.repository);
      
      if (!securityCheck.passed) {
        result.errors.push(`Security check failed: ${securityCheck.riskLevel} risk level`);
        securityCheck.issues.forEach(issue => {
          if (issue.severity === 'error' || issue.severity === 'critical') {
            result.errors.push(issue.message);
          } else {
            result.warnings.push(issue.message);
          }
        });

        if (securityCheck.riskLevel === 'critical' || securityCheck.riskLevel === 'high') {
          this.emit('installation:security-blocked', { repository: `${owner}/${repo}`, securityCheck });
          return result;
        }
      }

      // Step 3: Analyze repository
      result.analysis = await this.repoManager.analyzeRepository(owner, repo);

      // Step 4: Clone repository
      result.localPath = await this.repoManager.cloneRepository(owner, repo, {
        destination,
        depth: 1 // Shallow clone for faster installation
      });

      result.success = true;
      this.emit('installation:success', result);

    } catch (error) {
      result.errors.push(`Installation failed: ${error.message}`);
      this.emit('installation:error', { repository: `${owner}/${repo}`, error });
    }

    return result;
  }

  /**
   * Perform comprehensive security check on repository
   */
  async performSecurityCheck(repository: Repository): Promise<SecurityCheck> {
    const issues: SecurityIssue[] = [];
    let riskLevel: SecurityCheck['riskLevel'] = 'low';

    // Check license compatibility
    if (!repository.license) {
      issues.push({
        type: 'license',
        severity: 'warning',
        message: 'Repository has no license specified'
      });
      riskLevel = 'medium';
    } else if (!this.config.autoInstall.allowedLicenses.includes(repository.license.spdx_id)) {
      issues.push({
        type: 'license',
        severity: 'error',
        message: `License ${repository.license.name} is not in allowed list`,
        details: { license: repository.license.spdx_id }
      });
      riskLevel = 'high';
    }

    // Check repository size
    if (repository.size > this.config.autoInstall.maxRepoSize) {
      issues.push({
        type: 'size',
        severity: 'warning',
        message: `Repository size (${repository.size} bytes) exceeds recommended limit`,
        details: { size: repository.size, limit: this.config.autoInstall.maxRepoSize }
      });
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check if repository is private
    if (repository.private) {
      issues.push({
        type: 'permissions',
        severity: 'info',
        message: 'Repository is private - ensure you have proper access'
      });
    }

    // Check for suspicious patterns in repository name/description
    const suspiciousPatterns = ['malware', 'virus', 'hack', 'exploit', 'backdoor'];
    const repoText = `${repository.name} ${repository.description || ''}`.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (repoText.includes(pattern)) {
        issues.push({
          type: 'content',
          severity: 'critical',
          message: `Repository contains suspicious keyword: ${pattern}`
        });
        riskLevel = 'critical';
      }
    }

    // Additional checks for very new repositories
    const createdDate = new Date(repository.created_at);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation < 1 && repository.stargazers_count === 0) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: 'Repository is very new with no stars - exercise caution'
      });
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return {
      passed: riskLevel !== 'critical' && !issues.some(i => i.severity === 'critical'),
      issues,
      riskLevel
    };
  }

  /**
   * MIT-approved scraping with comprehensive analysis
   */
  async scrapeRepositoryForAnalysis(owner: string, repo: string): Promise<ScrapedRepository> {
    // Verify authentication and permissions
    if (!this.authManager.getAuthState().isAuthenticated) {
      throw new Error('Authentication required for repository scraping');
    }

    // Perform security check first
    const repository = await this.repoManager.getRepository(owner, repo);
    const securityCheck = await this.performSecurityCheck(repository);

    if (securityCheck.riskLevel === 'critical') {
      throw new Error('Repository failed security check - scraping blocked');
    }

    // Scrape with MIT-approved methods
    const scrapedData = await this.repoManager.scrapePublicRepository(owner, repo, {
      includeSource: true,
      includeDocumentation: true,
      includeTests: true,
      fileExtensions: ['.ts', '.js', '.py', '.java', '.go', '.rs', '.md', '.json', '.yml', '.yaml'],
      maxFileSize: 1024 * 1024, // 1MB per file
      excludePatterns: this.config.autoInstall.excludePatterns
    });

    this.emit('scraping:completed', { repository: `${owner}/${repo}`, data: scrapedData });
    return scrapedData;
  }

  /**
   * Search repositories with filtering
   */
  async searchRepositories(query: string, filters: {
    language?: string;
    license?: string;
    minStars?: number;
    maxSize?: number;
  } = {}): Promise<Repository[]> {
    let searchQuery = query;

    // Add filters to search query
    if (filters.language) {
      searchQuery += ` language:${filters.language}`;
    }
    
    if (filters.license) {
      searchQuery += ` license:${filters.license}`;
    }
    
    if (filters.minStars) {
      searchQuery += ` stars:>=${filters.minStars}`;
    }

    const results = await this.repoManager.searchRepositories({
      query: searchQuery,
      sort: 'stars',
      order: 'desc',
      per_page: 50
    });

    // Apply additional filters
    let filteredRepos = results.repositories;

    if (filters.maxSize) {
      filteredRepos = filteredRepos.filter(repo => repo.size <= filters.maxSize!);
    }

    return filteredRepos;
  }

  /**
   * Fork repository with automatic setup
   */
  async forkAndSetup(owner: string, repo: string, setupOptions: {
    clone?: boolean;
    destination?: string;
    createBranch?: string;
  } = {}): Promise<{ fork: Repository; localPath?: string }> {
    // Fork the repository
    const fork = await this.repoManager.forkRepository(owner, repo);

    const result: { fork: Repository; localPath?: string } = { fork };

    // Clone if requested
    if (setupOptions.clone && setupOptions.destination) {
      result.localPath = await this.repoManager.cloneRepository(
        fork.owner.login,
        fork.name,
        {
          destination: setupOptions.destination,
          depth: 1
        }
      );
    }

    this.emit('fork:created', { original: `${owner}/${repo}`, fork: fork.full_name });
    return result;
  }

  /**
   * Get user's repositories with analysis
   */
  async getUserRepositoriesWithAnalysis(username?: string): Promise<Array<Repository & { quickAnalysis: any }>> {
    const repositories = await this.repoManager.getUserRepositories(username);
    
    const analyzed = await Promise.all(
      repositories.slice(0, 10).map(async (repo) => { // Limit to first 10 for performance
        try {
          const analysis = await this.repoManager.analyzeRepository(repo.owner.login, repo.name);
          return {
            ...repo,
            quickAnalysis: {
              languages: analysis.languages,
              technologies: analysis.technologies,
              metrics: analysis.metrics
            }
          };
        } catch (error) {
          return {
            ...repo,
            quickAnalysis: { error: 'Analysis failed' }
          };
        }
      })
    );

    return analyzed;
  }

  /**
   * Check service health and connectivity
   */
  async healthCheck(): Promise<{
    authenticated: boolean;
    rateLimit: any;
    connectivity: boolean;
    lastError?: string;
  }> {
    try {
      const authState = await this.authManager.refreshAuthState();
      
      return {
        authenticated: authState.isAuthenticated,
        rateLimit: authState.rateLimit,
        connectivity: true
      };
    } catch (error) {
      return {
        authenticated: false,
        rateLimit: null,
        connectivity: false,
        lastError: error.message
      };
    }
  }

  /**
   * Get configuration
   */
  getConfig(): GitHubIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GitHubIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.authManager.getAuthState().isAuthenticated;
  }
}