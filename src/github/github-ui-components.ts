/**
 * GITHUB UI COMPONENTS FOR SHERLOCK Ω IDE
 * Beautiful GitHub integration interface
 */

export const GITHUB_UI_COMPONENTS = `
<!-- GitHub Panel HTML -->
<div class="github-panel" id="github-panel" style="display: none;">
    <div class="github-header">
        <div class="github-user" id="github-user">
            <div class="user-avatar">
                <i class="fab fa-github"></i>
            </div>
            <div class="user-info">
                <div class="user-name">Not connected</div>
                <div class="user-status">Connect to GitHub</div>
            </div>
        </div>
        <button class="github-btn primary" onclick="connectToGitHub()">
            <i class="fas fa-plug"></i> Connect
        </button>
    </div>

    <div class="github-tabs">
        <div class="github-tab active" onclick="switchGitHubTab('repos')">
            <i class="fas fa-folder"></i> Repositories
        </div>
        <div class="github-tab" onclick="switchGitHubTab('search')">
            <i class="fas fa-search"></i> Search
        </div>
        <div class="github-tab" onclick="switchGitHubTab('insights')">
            <i class="fas fa-chart-line"></i> Insights
        </div>
    </div>

    <div class="github-content">
        <!-- Repositories Tab -->
        <div class="github-tab-content active" id="repos-tab">
            <div class="repo-actions">
                <button class="github-btn" onclick="createNewRepo()">
                    <i class="fas fa-plus"></i> New Repo
                </button>
                <button class="github-btn" onclick="cloneRepo()">
                    <i class="fas fa-download"></i> Clone
                </button>
            </div>
            <div class="repo-list" id="repo-list">
                <!-- Repositories will be loaded here -->
            </div>
        </div>

        <!-- Search Tab -->
        <div class="github-tab-content" id="search-tab">
            <div class="search-form">
                <input type="text" id="search-input" placeholder="Search repositories..." class="github-input">
                <select id="language-filter" class="github-select">
                    <option value="">All Languages</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                </select>
                <button class="github-btn primary" onclick="searchRepositories()">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>
            <div class="search-results" id="search-results">
                <!-- Search results will appear here -->
            </div>
        </div>

        <!-- Insights Tab -->
        <div class="github-tab-content" id="insights-tab">
            <div class="insights-container" id="insights-container">
                <div class="insight-card">
                    <div class="insight-icon">📊</div>
                    <div class="insight-content">
                        <div class="insight-title">Repository Analytics</div>
                        <div class="insight-description">Connect to a repository to see insights</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- GitHub Modals -->
<div class="github-modal" id="clone-modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Clone Repository</h3>
            <button class="modal-close" onclick="closeModal('clone-modal')">×</button>
        </div>
        <div class="modal-body">
            <label>Repository URL:</label>
            <input type="text" id="clone-url" placeholder="https://github.com/user/repo" class="github-input">
            <div class="modal-actions">
                <button class="github-btn" onclick="closeModal('clone-modal')">Cancel</button>
                <button class="github-btn primary" onclick="performClone()">Clone</button>
            </div>
        </div>
    </div>
</div>

<div class="github-modal" id="create-repo-modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Create New Repository</h3>
            <button class="modal-close" onclick="closeModal('create-repo-modal')">×</button>
        </div>
        <div class="modal-body">
            <label>Repository Name:</label>
            <input type="text" id="repo-name" placeholder="my-awesome-project" class="github-input">
            
            <label>Description:</label>
            <textarea id="repo-description" placeholder="A brief description of your project" class="github-textarea"></textarea>
            
            <label class="checkbox-label">
                <input type="checkbox" id="repo-private"> Private repository
            </label>
            
            <div class="modal-actions">
                <button class="github-btn" onclick="closeModal('create-repo-modal')">Cancel</button>
                <button class="github-btn primary" onclick="performCreateRepo()">Create</button>
            </div>
        </div>
    </div>
</div>

<style>
.github-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--darker);
}

.github-header {
    padding: 15px;
    border-bottom: 1px solid var(--accent);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.github-user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    color: var(--text);
    font-size: 0.9rem;
}

.user-status {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.github-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid var(--accent);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.github-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: translateY(-1px);
}

.github-btn.primary {
    background: var(--primary);
    border-color: var(--primary);
}

.github-btn.primary:hover {
    background: var(--secondary);
    border-color: var(--secondary);
}

.github-tabs {
    display: flex;
    background: rgba(243, 156, 18, 0.1);
    border-bottom: 1px solid var(--accent);
}

.github-tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--text-muted);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.github-tab:hover {
    background: rgba(243, 156, 18, 0.2);
    color: var(--secondary);
}

.github-tab.active {
    background: var(--darker);
    color: var(--secondary);
    border-bottom: 2px solid var(--secondary);
}

.github-content {
    flex: 1;
    overflow-y: auto;
}

.github-tab-content {
    display: none;
    padding: 15px;
}

.github-tab-content.active {
    display: block;
}

.repo-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.repo-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.repo-item {
    background: rgba(233, 69, 96, 0.1);
    border: 1px solid var(--accent);
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.repo-item:hover {
    background: rgba(233, 69, 96, 0.2);
    transform: translateX(3px);
}

.repo-name {
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 4px;
}

.repo-description {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.repo-stats {
    display: flex;
    gap: 15px;
    font-size: 0.7rem;
    color: var(--text-muted);
}

.repo-stat {
    display: flex;
    align-items: center;
    gap: 4px;
}

.search-form {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.github-input, .github-select, .github-textarea {
    background: var(--dark);
    border: 1px solid var(--accent);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s ease;
}

.github-input:focus, .github-select:focus, .github-textarea:focus {
    border-color: var(--primary);
}

.github-input {
    flex: 1;
    min-width: 200px;
}

.github-textarea {
    width: 100%;
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
}

.search-results {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.insights-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.insight-card {
    background: rgba(233, 69, 96, 0.1);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.insight-icon {
    font-size: 2rem;
}

.insight-content {
    flex: 1;
}

.insight-title {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
}

.insight-description {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.insight-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
}

.github-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-content {
    background: var(--darker);
    border: 1px solid var(--accent);
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--accent);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    color: var(--primary);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: rgba(255,255,255,0.1);
    color: var(--text);
}

.modal-body {
    padding: 20px;
}

.modal-body label {
    display: block;
    color: var(--text);
    margin-bottom: 5px;
    font-weight: 500;
    font-size: 0.9rem;
}

.modal-body input, .modal-body textarea, .modal-body select {
    width: 100%;
    margin-bottom: 15px;
}

.checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    width: auto !important;
    margin: 0 !important;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>`;

export const GITHUB_JAVASCRIPT = `
// GitHub Integration JavaScript
let githubIntegration = null;

async function initializeGitHub() {
    const { GitHubIntegration } = await import('../github/github-integration');
    githubIntegration = new GitHubIntegration();
    console.log('🔗 GitHub integration initialized');
}

async function connectToGitHub() {
    if (!githubIntegration) {
        await initializeGitHub();
    }
    
    const success = await githubIntegration.authenticate();
    if (success) {
        updateGitHubUI();
        loadUserRepositories();
        showNotification('Connected to GitHub successfully!', 'success');
    } else {
        showNotification('Failed to connect to GitHub', 'error');
    }
}

function updateGitHubUI() {
    if (!githubIntegration || !githubIntegration.isAuthenticated()) return;
    
    const user = githubIntegration.getUserProfile();
    if (user) {
        const userElement = document.getElementById('github-user');
        userElement.innerHTML = \`
            <div class="user-avatar">
                <img src="\${user.avatar_url}" alt="\${user.name}">
            </div>
            <div class="user-info">
                <div class="user-name">\${user.name || user.login}</div>
                <div class="user-status">\${user.public_repos} repositories</div>
            </div>
        \`;
        
        // Update connect button
        const connectBtn = document.querySelector('.github-header .github-btn');
        connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
        connectBtn.classList.add('success');
    }
}

async function loadUserRepositories() {
    if (!githubIntegration || !githubIntegration.isAuthenticated()) return;
    
    try {
        const repos = await githubIntegration.searchRepositories('user:' + githubIntegration.getUserProfile().login);
        displayRepositories(repos);
    } catch (error) {
        console.error('Failed to load repositories:', error);
        showNotification('Failed to load repositories', 'error');
    }
}

function displayRepositories(repos) {
    const repoList = document.getElementById('repo-list');
    
    if (repos.length === 0) {
        repoList.innerHTML = '<div class="empty-state">No repositories found</div>';
        return;
    }
    
    repoList.innerHTML = repos.map(repo => \`
        <div class="repo-item" onclick="selectRepository('\${repo.full_name}')">
            <div class="repo-name">\${repo.name}</div>
            <div class="repo-description">\${repo.description || 'No description'}</div>
            <div class="repo-stats">
                <div class="repo-stat">
                    <i class="fas fa-star"></i>
                    <span>\${repo.stargazers_count}</span>
                </div>
                <div class="repo-stat">
                    <i class="fas fa-code-branch"></i>
                    <span>\${repo.forks_count}</span>
                </div>
                <div class="repo-stat">
                    <i class="fas fa-circle" style="color: \${getLanguageColor(repo.language)}"></i>
                    <span>\${repo.language || 'Unknown'}</span>
                </div>
            </div>
        </div>
    \`).join('');
}

async function searchRepositories() {
    const query = document.getElementById('search-input').value;
    const language = document.getElementById('language-filter').value;
    
    if (!query.trim()) {
        showNotification('Please enter a search query', 'warning');
        return;
    }
    
    if (!githubIntegration) {
        await initializeGitHub();
    }
    
    try {
        showNotification('Searching repositories...', 'info');
        const repos = await githubIntegration.searchRepositories(query, language);
        
        const resultsContainer = document.getElementById('search-results');
        displayRepositories(repos);
        
        // Move results to search tab
        resultsContainer.innerHTML = document.getElementById('repo-list').innerHTML;
        
        showNotification(\`Found \${repos.length} repositories\`, 'success');
    } catch (error) {
        console.error('Search failed:', error);
        showNotification('Search failed', 'error');
    }
}

async function selectRepository(fullName) {
    if (!githubIntegration) return;
    
    try {
        showNotification(\`Loading repository: \${fullName}\`, 'info');
        
        const success = await githubIntegration.cloneRepository(\`https://github.com/\${fullName}\`);
        if (success) {
            await loadRepositoryInsights();
            showNotification(\`Repository \${fullName} loaded successfully!\`, 'success');
            
            // Refresh file tree
            await loadFileTree();
        } else {
            showNotification('Failed to load repository', 'error');
        }
    } catch (error) {
        console.error('Failed to select repository:', error);
        showNotification('Failed to load repository', 'error');
    }
}

async function loadRepositoryInsights() {
    if (!githubIntegration) return;
    
    try {
        const insights = await githubIntegration.getRepositoryInsights();
        const container = document.getElementById('insights-container');
        
        container.innerHTML = \`
            <div class="insight-card">
                <div class="insight-icon">📊</div>
                <div class="insight-content">
                    <div class="insight-title">Total Commits</div>
                    <div class="insight-value">\${insights.totalCommits}</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">👥</div>
                <div class="insight-content">
                    <div class="insight-title">Contributors</div>
                    <div class="insight-value">\${insights.contributors}</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">⭐</div>
                <div class="insight-content">
                    <div class="insight-title">Stars</div>
                    <div class="insight-value">\${insights.stars}</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">🍴</div>
                <div class="insight-content">
                    <div class="insight-title">Forks</div>
                    <div class="insight-value">\${insights.forks}</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">🐛</div>
                <div class="insight-content">
                    <div class="insight-title">Open Issues</div>
                    <div class="insight-value">\${insights.openIssues}</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">💻</div>
                <div class="insight-content">
                    <div class="insight-title">Languages</div>
                    <div class="insight-description">\${insights.languages.join(', ')}</div>
                </div>
            </div>
        \`;
    } catch (error) {
        console.error('Failed to load insights:', error);
    }
}

function switchGitHubTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.github-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.github-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
}

function createNewRepo() {
    document.getElementById('create-repo-modal').style.display = 'flex';
}

function cloneRepo() {
    document.getElementById('clone-modal').style.display = 'flex';
}

async function performCreateRepo() {
    const name = document.getElementById('repo-name').value;
    const description = document.getElementById('repo-description').value;
    const isPrivate = document.getElementById('repo-private').checked;
    
    if (!name.trim()) {
        showNotification('Repository name is required', 'warning');
        return;
    }
    
    if (!githubIntegration || !githubIntegration.isAuthenticated()) {
        showNotification('Please connect to GitHub first', 'warning');
        return;
    }
    
    try {
        showNotification('Creating repository...', 'info');
        const repo = await githubIntegration.createRepository(name, description, isPrivate);
        
        if (repo) {
            closeModal('create-repo-modal');
            showNotification(\`Repository '\${name}' created successfully!\`, 'success');
            loadUserRepositories();
        } else {
            showNotification('Failed to create repository', 'error');
        }
    } catch (error) {
        console.error('Failed to create repository:', error);
        showNotification('Failed to create repository', 'error');
    }
}

async function performClone() {
    const url = document.getElementById('clone-url').value;
    
    if (!url.trim()) {
        showNotification('Repository URL is required', 'warning');
        return;
    }
    
    if (!githubIntegration) {
        await initializeGitHub();
    }
    
    try {
        showNotification('Cloning repository...', 'info');
        const success = await githubIntegration.cloneRepository(url);
        
        if (success) {
            closeModal('clone-modal');
            showNotification('Repository cloned successfully!', 'success');
            await loadFileTree();
            await loadRepositoryInsights();
        } else {
            showNotification('Failed to clone repository', 'error');
        }
    } catch (error) {
        console.error('Failed to clone repository:', error);
        showNotification('Failed to clone repository', 'error');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Python': '#3572A5',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'C++': '#f34b7d',
        'C': '#555555',
        'HTML': '#e34c26',
        'CSS': '#563d7c'
    };
    return colors[language] || '#666666';
}

// Initialize GitHub integration when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add GitHub panel to sidebar when git activity is selected
    const originalSwitchActivity = window.switchActivity;
    window.switchActivity = function(activity) {
        originalSwitchActivity(activity);
        
        if (activity === 'git') {
            const sidebar = document.querySelector('.sidebar');
            const githubPanel = document.getElementById('github-panel');
            
            if (githubPanel) {
                githubPanel.style.display = 'flex';
            } else {
                // Create GitHub panel
                const panel = document.createElement('div');
                panel.innerHTML = GITHUB_UI_COMPONENTS;
                sidebar.appendChild(panel.firstElementChild);
            }
            
            // Hide file explorer
            document.querySelector('.file-explorer').style.display = 'none';
        } else {
            // Show file explorer, hide GitHub panel
            const githubPanel = document.getElementById('github-panel');
            if (githubPanel) {
                githubPanel.style.display = 'none';
            }
            document.querySelector('.file-explorer').style.display = 'block';
        }
    };
});
`;