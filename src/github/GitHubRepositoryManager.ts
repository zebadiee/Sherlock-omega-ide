/**
 * GitHubRepositoryManager - Repository operations and management
 * Handles cloning, forking, downloading, and repository analysis
 */

import { GitHubAuthManager } from './GitHubAuthManager';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
}

export interface RepositoryContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface CloneOptions {
  destination: string;
  branch?: string;
  depth?: number;
  recursive?: boolean;
}

export interface ForkOptions {
  organization?: string;
  name?: string;
  default_branch_only?: boolean;
}

export interface SearchOptions {
  query: string;
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export class GitHubRepositoryManager extends EventEmitter {
  private authManager: GitHubAuthManager;
  private baseUrl = 'https://api.github.com';

  constructor(authManager: GitHubAuthManager) {
    super();
    this.authManager = authManager;
  }

  /**
   * Search for repositories
   */
  async searchRepositories(options: SearchOptions): Promise<{ repositories: Repository[], total_count: number }> {
    const params = new URLSearchParams({
      q: options.query,
      sort: options.sort || 'stars',
      order: options.order || 'desc',
      per_page: (options.per_page || 30).toString(),
      page: (options.page || 1).toString()
    });

    const response = await this.makeApiCall(`/search/repositories?${params}`);
    
    return {
      repositories: response.items,
      total_count: response.total_count
    };
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    return await this.makeApiCall(`/repos/${owner}/${repo}`);
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(username?: string): Promise<Repository[]> {
    const endpoint = username ? `/users/${username}/repos` : '/user/repos';
    return await this.makeApiCall(endpoint);
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(owner: string, repo: string, path: string = ''): Promise<RepositoryContent[]> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
    return await this.makeApiCall(endpoint);
  }

  /**
   * Get file content
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const content = await this.makeApiCall(`/repos/${owner}/${repo}/contents/${path}`);
    
    if (content.type !== 'file') {
      throw new Error(`Path ${path} is not a file`);
    }

    if (content.encoding === 'base64') {
      return Buffer.from(content.content, 'base64').toString('utf-8');
    }

    return content.content;
  }

  /**
   * Fork a repository
   */
  async forkRepository(owner: string, repo: string, options: ForkOptions = {}): Promise<Repository> {
    const body: any = {};
    
    if (options.organization) {
      body.organization = options.organization;
    }
    
    if (options.name) {
      body.name = options.name;
    }
    
    if (options.default_branch_only) {
      body.default_branch_only = options.default_branch_only;
    }

    const response = await this.makeApiCall(`/repos/${owner}/${repo}/forks`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    this.emit('repository:forked', { original: `${owner}/${repo}`, fork: response.full_name });
    return response;
  }

  /**
   * Clone repository (download as ZIP)
   */
  async cloneRepository(owner: string, repo: string, options: CloneOptions): Promise<string> {
    try {
      // Create destination directory
      await fs.mkdir(options.destination, { recursive: true });

      // Download repository as ZIP
      const zipUrl = `https://github.com/${owner}/${repo}/archive/${options.branch || 'main'}.zip`;
      const response = await fetch(zipUrl);

      if (!response.ok) {
        throw new Error(`Failed to download repository: ${response.statusText}`);
      }

      const zipPath = path.join(options.destination, `${repo}.zip`);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(zipPath, Buffer.from(buffer));

      // Extract ZIP (simplified - in production use a proper ZIP library)
      const extractPath = path.join(options.destination, repo);
      await this.extractZip(zipPath, extractPath);

      // Clean up ZIP file
      await fs.unlink(zipPath);

      this.emit('repository:cloned', { repository: `${owner}/${repo}`, destination: extractPath });
      return extractPath;

    } catch (error) {
      this.emit('repository:clone-error', { repository: `${owner}/${repo}`, error });
      throw error;
    }
  }

  /**
   * Download specific files from repository
   */
  async downloadFiles(owner: string, repo: string, files: string[], destination: string): Promise<string[]> {
    const downloadedFiles: string[] = [];

    try {
      await fs.mkdir(destination, { recursive: true });

      for (const filePath of files) {
        try {
          const content = await this.getFileContent(owner, repo, filePath);
          const localPath = path.join(destination, filePath);
          
          // Create directory structure
          await fs.mkdir(path.dirname(localPath), { recursive: true });
          
          // Write file
          await fs.writeFile(localPath, content, 'utf-8');
          downloadedFiles.push(localPath);

          this.emit('file:downloaded', { file: filePath, destination: localPath });
        } catch (error) {
          this.emit('file:download-error', { file: filePath, error });
        }
      }

      return downloadedFiles;
    } catch (error) {
      this.emit('repository:download-error', { repository: `${owner}/${repo}`, error });
      throw error;
    }
  }

  /**
   * Analyze repository structure and content
   */
  async analyzeRepository(owner: string, repo: string): Promise<RepositoryAnalysis> {
    try {
      const repository = await this.getRepository(owner, repo);
      const contents = await this.getRepositoryContents(owner, repo);
      
      const analysis: RepositoryAnalysis = {
        repository,
        structure: await this.analyzeStructure(owner, repo, contents),
        languages: await this.getRepositoryLanguages(owner, repo),
        metrics: {
          files: 0,
          directories: 0,
          totalSize: repository.size,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          issues: repository.open_issues_count
        },
        technologies: this.detectTechnologies(contents),
        license: repository.license,
        lastUpdated: new Date(repository.updated_at)
      };

      // Count files and directories recursively
      const counts = await this.countFilesAndDirectories(owner, repo, contents);
      analysis.metrics.files = counts.files;
      analysis.metrics.directories = counts.directories;

      this.emit('repository:analyzed', { repository: `${owner}/${repo}`, analysis });
      return analysis;

    } catch (error) {
      this.emit('repository:analysis-error', { repository: `${owner}/${repo}`, error });
      throw error;
    }
  }

  /**
   * MIT-approved scraping for public repositories
   */
  async scrapePublicRepository(owner: string, repo: string, options: ScrapeOptions = {}): Promise<ScrapedRepository> {
    // Verify repository is public and MIT-licensed or has permissive license
    const repository = await this.getRepository(owner, repo);
    
    if (repository.private) {
      throw new Error('Cannot scrape private repositories');
    }

    // Check license compatibility
    if (!this.isLicenseCompatible(repository.license)) {
      throw new Error(`Repository license ${repository.license?.name || 'unknown'} may not be compatible with scraping`);
    }

    const scrapedData: ScrapedRepository = {
      metadata: repository,
      files: new Map(),
      structure: [],
      analysis: await this.analyzeRepository(owner, repo)
    };

    // Scrape files based on options
    if (options.includeSource) {
      await this.scrapeSourceFiles(owner, repo, scrapedData, options);
    }

    if (options.includeDocumentation) {
      await this.scrapeDocumentation(owner, repo, scrapedData);
    }

    if (options.includeTests) {
      await this.scrapeTestFiles(owner, repo, scrapedData);
    }

    this.emit('repository:scraped', { repository: `${owner}/${repo}`, data: scrapedData });
    return scrapedData;
  }

  /**
   * Check if license is compatible with scraping
   */
  private isLicenseCompatible(license: Repository['license']): boolean {
    if (!license) return false;

    const compatibleLicenses = [
      'MIT',
      'Apache-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'ISC',
      'Unlicense',
      'CC0-1.0'
    ];

    return compatibleLicenses.includes(license.spdx_id);
  }

  /**
   * Make authenticated API call
   */
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const credentials = this.authManager.getCredentials();
    
    if (!credentials) {
      throw new Error('GitHub authentication required');
    }

    if (!this.authManager.canMakeApiCall()) {
      const resetTime = this.authManager.getRateLimitResetTime();
      throw new Error(`Rate limit exceeded. Resets in ${Math.ceil(resetTime / 1000)} seconds`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sherlock-Omega-IDE/1.0.0',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return await response.json();
  }

  // Helper methods (simplified implementations)
  private async extractZip(zipPath: string, extractPath: string): Promise<void> {
    // In production, use a proper ZIP extraction library like 'yauzl' or 'node-stream-zip'
    console.log(`Extracting ${zipPath} to ${extractPath}`);
  }

  private async analyzeStructure(owner: string, repo: string, contents: RepositoryContent[]): Promise<any> {
    // Simplified structure analysis
    return contents.map(item => ({
      name: item.name,
      type: item.type,
      path: item.path
    }));
  }

  private async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return await this.makeApiCall(`/repos/${owner}/${repo}/languages`);
  }

  private detectTechnologies(contents: RepositoryContent[]): string[] {
    const technologies: string[] = [];
    const fileNames = contents.map(c => c.name.toLowerCase());

    if (fileNames.includes('package.json')) technologies.push('Node.js');
    if (fileNames.includes('requirements.txt')) technologies.push('Python');
    if (fileNames.includes('cargo.toml')) technologies.push('Rust');
    if (fileNames.includes('go.mod')) technologies.push('Go');
    if (fileNames.includes('pom.xml')) technologies.push('Java/Maven');
    if (fileNames.includes('dockerfile')) technologies.push('Docker');

    return technologies;
  }

  private async countFilesAndDirectories(owner: string, repo: string, contents: RepositoryContent[]): Promise<{ files: number, directories: number }> {
    // Simplified counting - in production, implement recursive counting
    return {
      files: contents.filter(c => c.type === 'file').length,
      directories: contents.filter(c => c.type === 'dir').length
    };
  }

  private async scrapeSourceFiles(owner: string, repo: string, scrapedData: ScrapedRepository, options: ScrapeOptions): Promise<void> {
    // Implementation for scraping source files
  }

  private async scrapeDocumentation(owner: string, repo: string, scrapedData: ScrapedRepository): Promise<void> {
    // Implementation for scraping documentation
  }

  private async scrapeTestFiles(owner: string, repo: string, scrapedData: ScrapedRepository): Promise<void> {
    // Implementation for scraping test files
  }
}

// Supporting interfaces
export interface RepositoryAnalysis {
  repository: Repository;
  structure: any[];
  languages: Record<string, number>;
  metrics: {
    files: number;
    directories: number;
    totalSize: number;
    stars: number;
    forks: number;
    issues: number;
  };
  technologies: string[];
  license: Repository['license'];
  lastUpdated: Date;
}

export interface ScrapeOptions {
  includeSource?: boolean;
  includeDocumentation?: boolean;
  includeTests?: boolean;
  fileExtensions?: string[];
  maxFileSize?: number;
  excludePatterns?: string[];
}

export interface ScrapedRepository {
  metadata: Repository;
  files: Map<string, string>;
  structure: any[];
  analysis: RepositoryAnalysis;
}