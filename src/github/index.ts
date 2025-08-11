/**
 * GitHub Integration Module - Entry Point
 * Provides secure GitHub authentication, repository management, and code analysis
 */

export { GitHubAuthManager, GitHubCredentials, GitHubAuthConfig, AuthState, GitHubUser, RateLimit } from './GitHubAuthManager';
export { GitHubRepositoryManager, Repository, RepositoryContent, CloneOptions, ForkOptions, SearchOptions, RepositoryAnalysis, ScrapeOptions, ScrapedRepository } from './GitHubRepositoryManager';
export { GitHubIntegrationService, GitHubIntegrationConfig } from './GitHubIntegrationService';

import { GitHubAuthManager, GitHubAuthConfig } from './GitHubAuthManager';
import { GitHubRepositoryManager } from './GitHubRepositoryManager';
import { GitHubIntegrationService, GitHubIntegrationConfig } from './GitHubIntegrationService';

/**
 * Factory function to create a complete GitHub integration service
 */
export function createGitHubIntegration(config: GitHubIntegrationConfig): GitHubIntegrationService {
  const authManager = new GitHubAuthManager(config.auth);
  const repoManager = new GitHubRepositoryManager(authManager);
  
  return new GitHubIntegrationService(authManager, repoManager, config);
}

/**
 * Default configuration for GitHub integration
 */
export const DEFAULT_GITHUB_CONFIG: Partial<GitHubIntegrationConfig> = {
  auth: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: 'http://localhost:3000/auth/github/callback',
    scopes: ['repo', 'user:email', 'read:org'],
    useDeviceFlow: true
  },
  autoInstall: {
    enabled: true,
    allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
    maxRepoSize: 100 * 1024 * 1024, // 100MB
    excludePatterns: ['node_modules', '.git', 'dist', 'build']
  },
  scraping: {
    respectRateLimit: true,
    maxConcurrentRequests: 5,
    retryAttempts: 3,
    retryDelay: 1000
  }
};

/**
 * Initialize GitHub integration with environment variables
 */
export async function initializeGitHubIntegration(): Promise<GitHubIntegrationService> {
  const config: GitHubIntegrationConfig = {
    ...DEFAULT_GITHUB_CONFIG,
    auth: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
      scopes: (process.env.GITHUB_SCOPES || 'repo,user:email,read:org').split(','),
      useDeviceFlow: process.env.GITHUB_USE_DEVICE_FLOW !== 'false'
    }
  } as GitHubIntegrationConfig;

  const service = createGitHubIntegration(config);
  
  // Auto-authenticate if credentials are stored
  try {
    await service.initialize();
  } catch (error) {
    console.warn('GitHub auto-authentication failed:', error);
  }

  return service;
}