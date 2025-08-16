/**
 * SHERLOCK Ω GITHUB INTEGRATION
 * Social coding with intelligence
 */

export class GitHubIntegration {
  private accessToken: string | null = null;
  private currentRepo: GitHubRepo | null = null;
  private userProfile: GitHubUser | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // OAuth flow for GitHub authentication
      const token = await this.initiateOAuthFlow();
      this.accessToken = token;
      
      // Get user profile
      this.userProfile = await this.fetchUserProfile();
      
      console.log('🔗 GitHub authentication successful');
      return true;
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      return false;
    }
  }

  async cloneRepository(repoUrl: string): Promise<boolean> {
    try {
      console.log(`📥 Cloning repository: ${repoUrl}`);
      
      // Parse GitHub URL
      const repoInfo = this.parseGitHubUrl(repoUrl);
      if (!repoInfo) {
        throw new Error('Invalid GitHub URL');
      }

      // Fetch repository data
      const repoData = await this.fetchRepository(repoInfo.owner, repoInfo.repo);
      this.currentRepo = repoData;

      // Clone files (simplified - in real implementation would use git)
      const files = await this.fetchRepositoryContents(repoInfo.owner, repoInfo.repo);
      
      return true;
    } catch (error) {
      console.error('Failed to clone repository:', error);
      return false;
    }
  }

  async createRepository(name: string, description: string, isPrivate: boolean = false): Promise<GitHubRepo | null> {
    try {
      const response = await this.githubAPI('POST', '/user/repos', {
        name,
        description,
        private: isPrivate,
        auto_init: true
      });

      console.log(`✨ Created repository: ${name}`);
      return response;
    } catch (error) {
      console.error('Failed to create repository:', error);
      return null;
    }
  }

  async commitAndPush(message: string, files: FileChange[]): Promise<boolean> {
    try {
      if (!this.currentRepo) {
        throw new Error('No repository selected');
      }

      console.log(`📤 Committing changes: ${message}`);

      // Create commit (simplified)
      const commitData = {
        message,
        tree: await this.createTree(files),
        parents: [this.currentRepo.default_branch]
      };

      const commit = await this.githubAPI('POST', `/repos/${this.currentRepo.full_name}/git/commits`, commitData);
      
      // Update branch reference
      await this.githubAPI('PATCH', `/repos/${this.currentRepo.full_name}/git/refs/heads/${this.currentRepo.default_branch}`, {
        sha: commit.sha
      });

      console.log('✅ Changes pushed successfully');
      return true;
    } catch (error) {
      console.error('Failed to commit and push:', error);
      return false;
    }
  }

  async createPullRequest(title: string, description: string, head: string, base: string): Promise<PullRequest | null> {
    try {
      if (!this.currentRepo) {
        throw new Error('No repository selected');
      }

      const pr = await this.githubAPI('POST', `/repos/${this.currentRepo.full_name}/pulls`, {
        title,
        body: description,
        head,
        base
      });

      console.log(`🔀 Pull request created: #${pr.number}`);
      return pr;
    } catch (error) {
      console.error('Failed to create pull request:', error);
      return null;
    }
  }

  async getRepositoryInsights(): Promise<RepoInsights> {
    try {
      if (!this.currentRepo) {
        throw new Error('No repository selected');
      }

      const [commits, contributors, languages, issues] = await Promise.all([
        this.githubAPI('GET', `/repos/${this.currentRepo.full_name}/commits?per_page=100`),
        this.githubAPI('GET', `/repos/${this.currentRepo.full_name}/contributors`),
        this.githubAPI('GET', `/repos/${this.currentRepo.full_name}/languages`),
        this.githubAPI('GET', `/repos/${this.currentRepo.full_name}/issues?state=open`)
      ]);

      return {
        totalCommits: commits.length,
        contributors: contributors.length,
        languages: Object.keys(languages),
        openIssues: issues.length,
        stars: this.currentRepo.stargazers_count,
        forks: this.currentRepo.forks_count
      };
    } catch (error) {
      console.error('Failed to get repository insights:', error);
      return {
        totalCommits: 0,
        contributors: 0,
        languages: [],
        openIssues: 0,
        stars: 0,
        forks: 0
      };
    }
  }

  async searchRepositories(query: string, language?: string): Promise<GitHubRepo[]> {
    try {
      let searchQuery = query;
      if (language) {
        searchQuery += ` language:${language}`;
      }

      const response = await this.githubAPI('GET', `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc`);
      return response.items || [];
    } catch (error) {
      console.error('Failed to search repositories:', error);
      return [];
    }
  }

  // Private helper methods
  private async initiateOAuthFlow(): Promise<string> {
    // Simplified OAuth - in real implementation would use proper OAuth flow
    // For now, return a placeholder token or throw an error
    throw new Error('OAuth flow not implemented - please set GITHUB_TOKEN environment variable');
  }

  private async fetchUserProfile(): Promise<GitHubUser> {
    return await this.githubAPI('GET', '/user');
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  private async fetchRepository(owner: string, repo: string): Promise<GitHubRepo> {
    return await this.githubAPI('GET', `/repos/${owner}/${repo}`);
  }

  private async fetchRepositoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    return await this.githubAPI('GET', `/repos/${owner}/${repo}/contents/${path}`);
  }

  private async createTree(files: FileChange[]): Promise<string> {
    // Simplified tree creation
    const tree = files.map(file => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content
    }));

    const response = await this.githubAPI('POST', `/repos/${this.currentRepo!.full_name}/git/trees`, {
      tree
    });

    return response.sha;
  }

  private async githubAPI(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://api.github.com${endpoint}`, {
      method,
      headers: {
        'Authorization': `token ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  }

  // Public getters
  getCurrentRepo(): GitHubRepo | null {
    return this.currentRepo;
  }

  getUserProfile(): GitHubUser | null {
    return this.userProfile;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

// Interfaces
interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  created_at: string;
  updated_at: string;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url?: string;
  content?: string;
}

interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

interface PullRequest {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
}

interface RepoInsights {
  totalCommits: number;
  contributors: number;
  languages: string[];
  openIssues: number;
  stars: number;
  forks: number;
}