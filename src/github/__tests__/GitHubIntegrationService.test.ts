/**
 * Test suite for GitHubIntegrationService
 */

import { GitHubIntegrationService, GitHubIntegrationConfig } from '../GitHubIntegrationService';
import { GitHubAuthManager } from '../GitHubAuthManager';
import { GitHubRepositoryManager } from '../GitHubRepositoryManager';

// Mock the managers
jest.mock('../GitHubAuthManager');
jest.mock('../GitHubRepositoryManager');

describe('GitHubIntegrationService', () => {
  let service: GitHubIntegrationService;
  let mockAuthManager: jest.Mocked<GitHubAuthManager>;
  let mockRepoManager: jest.Mocked<GitHubRepositoryManager>;
  let config: GitHubIntegrationConfig;

  beforeEach(() => {
    config = {
      auth: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        scopes: ['repo', 'user:email'],
        useDeviceFlow: true
      },
      autoInstall: {
        enabled: true,
        allowedLicenses: ['MIT', 'Apache-2.0'],
        maxRepoSize: 100 * 1024 * 1024,
        excludePatterns: ['node_modules', '.git']
      },
      scraping: {
        respectRateLimit: true,
        maxConcurrentRequests: 5,
        retryAttempts: 3,
        retryDelay: 1000
      }
    };

    mockAuthManager = new GitHubAuthManager(config.auth) as jest.Mocked<GitHubAuthManager>;
    mockRepoManager = new GitHubRepositoryManager(mockAuthManager) as jest.Mocked<GitHubRepositoryManager>;

    service = new GitHubIntegrationService(mockAuthManager, mockRepoManager, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      mockAuthManager.getAuthState.mockReturnValue({ isAuthenticated: true });
      mockAuthManager.refreshAuthState.mockResolvedValue({ isAuthenticated: true });

      await service.initialize();

      expect(service.isReady()).toBe(true);
    });

    test('should handle initialization with no stored credentials', async () => {
      mockAuthManager.getAuthState.mockReturnValue({ isAuthenticated: false });
      mockAuthManager.refreshAuthState.mockResolvedValue({ isAuthenticated: false });

      await service.initialize();

      expect(mockAuthManager.refreshAuthState).toHaveBeenCalled();
    });

    test('should emit initialization error on failure', async () => {
      const error = new Error('Initialization failed');
      mockAuthManager.refreshAuthState.mockRejectedValue(error);

      const errorSpy = jest.fn();
      service.on('service:initialization-error', errorSpy);

      await expect(service.initialize()).rejects.toThrow('Initialization failed');
      expect(errorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('Authentication', () => {
    test('should authenticate successfully', async () => {
      const authState = { isAuthenticated: true, user: { login: 'testuser' } };
      mockAuthManager.authenticate.mockResolvedValue(authState);

      const result = await service.authenticate();

      expect(result).toEqual(authState);
      expect(mockAuthManager.authenticate).toHaveBeenCalled();
    });

    test('should get current auth state', () => {
      const authState = { isAuthenticated: true };
      mockAuthManager.getAuthState.mockReturnValue(authState);

      const result = service.getAuthState();

      expect(result).toEqual(authState);
    });

    test('should logout successfully', async () => {
      await service.logout();

      expect(mockAuthManager.logout).toHaveBeenCalled();
    });
  });

  describe('Security Checks', () => {
    test('should pass security check for MIT licensed repository', async () => {
      const repository = {
        id: 1,
        name: 'test-repo',
        full_name: 'user/test-repo',
        private: false,
        size: 1000,
        license: { spdx_id: 'MIT', name: 'MIT License' },
        created_at: '2023-01-01T00:00:00Z',
        stargazers_count: 10
      } as any;

      const securityCheck = await (service as any).performSecurityCheck(repository);

      expect(securityCheck.passed).toBe(true);
      expect(securityCheck.riskLevel).toBe('low');
    });

    test('should fail security check for disallowed license', async () => {
      const repository = {
        id: 1,
        name: 'test-repo',
        private: false,
        size: 1000,
        license: { spdx_id: 'GPL-3.0', name: 'GNU General Public License v3.0' },
        created_at: '2023-01-01T00:00:00Z',
        stargazers_count: 10
      } as any;

      const securityCheck = await (service as any).performSecurityCheck(repository);

      expect(securityCheck.passed).toBe(false);
      expect(securityCheck.riskLevel).toBe('high');
      expect(securityCheck.issues).toContainEqual(
        expect.objectContaining({
          type: 'license',
          severity: 'error'
        })
      );
    });

    test('should flag suspicious repository names', async () => {
      const repository = {
        id: 1,
        name: 'malware-tool',
        description: 'A tool for hacking',
        private: false,
        size: 1000,
        license: { spdx_id: 'MIT', name: 'MIT License' },
        created_at: '2023-01-01T00:00:00Z',
        stargazers_count: 10
      } as any;

      const securityCheck = await (service as any).performSecurityCheck(repository);

      expect(securityCheck.passed).toBe(false);
      expect(securityCheck.riskLevel).toBe('critical');
    });

    test('should warn about very new repositories', async () => {
      const repository = {
        id: 1,
        name: 'new-repo',
        private: false,
        size: 1000,
        license: { spdx_id: 'MIT', name: 'MIT License' },
        created_at: new Date().toISOString(),
        stargazers_count: 0
      } as any;

      const securityCheck = await (service as any).performSecurityCheck(repository);

      expect(securityCheck.issues).toContainEqual(
        expect.objectContaining({
          type: 'content',
          severity: 'warning',
          message: expect.stringContaining('very new')
        })
      );
    });
  });

  describe('Auto Installation', () => {
    test('should auto-install repository successfully', async () => {
      const repository = {
        id: 1,
        name: 'test-repo',
        full_name: 'user/test-repo',
        private: false,
        size: 1000,
        license: { spdx_id: 'MIT', name: 'MIT License' },
        created_at: '2023-01-01T00:00:00Z',
        stargazers_count: 10
      } as any;

      const analysis = {
        repository,
        languages: { TypeScript: 80, JavaScript: 20 },
        technologies: ['Node.js'],
        metrics: { files: 50, directories: 10 }
      } as any;

      mockRepoManager.getRepository.mockResolvedValue(repository);
      mockRepoManager.analyzeRepository.mockResolvedValue(analysis);
      mockRepoManager.cloneRepository.mockResolvedValue('/path/to/cloned/repo');

      const result = await service.autoInstallRepository('user', 'test-repo', '/destination');

      expect(result.success).toBe(true);
      expect(result.localPath).toBe('/path/to/cloned/repo');
      expect(result.errors).toHaveLength(0);
    });

    test('should block installation for high-risk repository', async () => {
      const repository = {
        id: 1,
        name: 'malware-repo',
        private: false,
        size: 1000,
        license: { spdx_id: 'MIT', name: 'MIT License' },
        created_at: '2023-01-01T00:00:00Z',
        stargazers_count: 10
      } as any;

      mockRepoManager.getRepository.mockResolvedValue(repository);

      const result = await service.autoInstallRepository('user', 'malware-repo', '/destination');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should throw error when auto-install is disabled', async () => {
      service.updateConfig({ autoInstall: { ...config.autoInstall, enabled: false } });

      await expect(
        service.autoInstallRepository('user', 'test-repo', '/destination')
      ).rejects.toThrow('Auto-install is disabled');
    });
  });

  describe('Repository Search', () => {
    test('should search repositories with filters', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', language: 'TypeScript', size: 1000, stargazers_count: 100 },
        { id: 2, name: 'repo2', language: 'JavaScript', size: 2000, stargazers_count: 50 }
      ] as any[];

      mockRepoManager.searchRepositories.mockResolvedValue({
        repositories: mockRepos,
        total_count: 2
      });

      const results = await service.searchRepositories('test query', {
        language: 'TypeScript',
        minStars: 10,
        maxSize: 1500
      });

      expect(mockRepoManager.searchRepositories).toHaveBeenCalledWith({
        query: 'test query language:TypeScript stars:>=10',
        sort: 'stars',
        order: 'desc',
        per_page: 50
      });

      // Should filter by maxSize
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('repo1');
    });
  });

  describe('Fork and Setup', () => {
    test('should fork repository successfully', async () => {
      const originalRepo = { owner: { login: 'original-owner' }, name: 'test-repo' } as any;
      const forkedRepo = { owner: { login: 'current-user' }, name: 'test-repo', full_name: 'current-user/test-repo' } as any;

      mockRepoManager.forkRepository.mockResolvedValue(forkedRepo);

      const result = await service.forkAndSetup('original-owner', 'test-repo');

      expect(result.fork).toEqual(forkedRepo);
      expect(mockRepoManager.forkRepository).toHaveBeenCalledWith('original-owner', 'test-repo');
    });

    test('should fork and clone repository', async () => {
      const forkedRepo = { owner: { login: 'current-user' }, name: 'test-repo' } as any;

      mockRepoManager.forkRepository.mockResolvedValue(forkedRepo);
      mockRepoManager.cloneRepository.mockResolvedValue('/path/to/cloned/fork');

      const result = await service.forkAndSetup('original-owner', 'test-repo', {
        clone: true,
        destination: '/destination'
      });

      expect(result.fork).toEqual(forkedRepo);
      expect(result.localPath).toBe('/path/to/cloned/fork');
      expect(mockRepoManager.cloneRepository).toHaveBeenCalledWith(
        'current-user',
        'test-repo',
        { destination: '/destination', depth: 1 }
      );
    });
  });

  describe('Health Check', () => {
    test('should return healthy status when authenticated', async () => {
      const authState = {
        isAuthenticated: true,
        rateLimit: { remaining: 5000, limit: 5000 }
      };

      mockAuthManager.refreshAuthState.mockResolvedValue(authState);

      const health = await service.healthCheck();

      expect(health.authenticated).toBe(true);
      expect(health.connectivity).toBe(true);
      expect(health.rateLimit).toEqual(authState.rateLimit);
    });

    test('should return unhealthy status on error', async () => {
      const error = new Error('Network error');
      mockAuthManager.refreshAuthState.mockRejectedValue(error);

      const health = await service.healthCheck();

      expect(health.authenticated).toBe(false);
      expect(health.connectivity).toBe(false);
      expect(health.lastError).toBe('Network error');
    });
  });

  describe('Configuration Management', () => {
    test('should get current configuration', () => {
      const currentConfig = service.getConfig();

      expect(currentConfig).toEqual(config);
    });

    test('should update configuration', () => {
      const configSpy = jest.fn();
      service.on('config:updated', configSpy);

      const newConfig = { autoInstall: { ...config.autoInstall, enabled: false } };
      service.updateConfig(newConfig);

      expect(configSpy).toHaveBeenCalled();
      expect(service.getConfig().autoInstall.enabled).toBe(false);
    });
  });

  describe('Service Readiness', () => {
    test('should be ready when initialized and authenticated', async () => {
      mockAuthManager.getAuthState.mockReturnValue({ isAuthenticated: true });
      await service.initialize();

      expect(service.isReady()).toBe(true);
    });

    test('should not be ready when not authenticated', async () => {
      mockAuthManager.getAuthState.mockReturnValue({ isAuthenticated: false });
      await service.initialize();

      expect(service.isReady()).toBe(false);
    });
  });
});