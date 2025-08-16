export const ENHANCED_BEAST_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Sherlock Ω IDE - The Living IDE</title>
    <link rel="stylesheet" href="https://unpkg.com/monaco-editor@0.52.2/min/vs/editor/editor.main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        :root {
            --primary: #e94560;
            --secondary: #f39c12;
            --dark: #0a0a0a;
            --darker: #1a1a2e;
            --accent: #16213e;
            --text: #ffffff;
            --text-muted: #cccccc;
            --success: #27ae60;
            --warning: #f39c12;
            --error: #e74c3c;
            --shadow: 0 4px 20px rgba(233, 69, 96, 0.3);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'JetBrains Mono', monospace;
            background: linear-gradient(135deg, var(--dark) 0%, var(--darker) 50%, var(--accent) 100%);
            color: var(--text);
            height: 100vh;
            overflow: hidden;
            user-select: none;
        }
        
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--dark), var(--darker));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease-out;
        }
        
        .loading-logo {
            font-size: 4rem;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }
        
        .loading-text {
            font-size: 1.5rem;
            color: var(--primary);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .loading-bar {
            width: 300px;
            height: 4px;
            background: rgba(233, 69, 96, 0.2);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .loading-progress {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            width: 0%;
            transition: width 0.3s ease;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .ide-container {
            display: grid;
            grid-template: "header header header header" 45px
                          "activity sidebar editor panel" 1fr
                          "activity terminal terminal panel" 250px
                          "status status status status" 28px / 60px 280px 1fr 350px;
            height: 100vh;
            gap: 1px;
            background: var(--accent);
            opacity: 0;
            transition: opacity 0.5s ease-in;
        }
        
        .ide-container.loaded {
            opacity: 1;
        }
        
        .header {
            grid-area: header;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            color: var(--text);
            font-weight: 600;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .logo {
            display: flex;
            align-items: center;
            font-size: 1.2rem;
            font-weight: 700;
        }
        
        .logo::before {
            content: "🔍";
            margin-right: 10px;
            font-size: 1.5rem;
            animation: rotate 4s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .header-actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .header-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: var(--text);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
        }
        
        .header-btn:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-1px);
        }
        
        .activity-bar {
            grid-area: activity;
            background: var(--darker);
            border-right: 2px solid var(--primary);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px 0;
            box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        }
        
        .activity-item {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 8px 0;
            cursor: pointer;
            border-radius: 8px;
            color: var(--text-muted);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .activity-item:hover {
            background: rgba(233, 69, 96, 0.2);
            color: var(--primary);
            transform: scale(1.1);
        }
        
        .activity-item.active {
            background: var(--primary);
            color: var(--text);
            box-shadow: 0 0 15px rgba(233, 69, 96, 0.5);
        }
        
        .activity-item.active::after {
            content: '';
            position: absolute;
            left: -2px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            background: var(--text);
            border-radius: 2px;
        }
        
        .sidebar {
            grid-area: sidebar;
            background: var(--darker);
            border-right: 1px solid var(--accent);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .sidebar-header {
            padding: 15px 20px;
            font-weight: 600;
            color: var(--secondary);
            background: rgba(243, 156, 18, 0.1);
            border-bottom: 1px solid var(--accent);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .sidebar-actions {
            display: flex;
            gap: 8px;
        }
        
        .sidebar-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .sidebar-btn:hover {
            color: var(--secondary);
            background: rgba(243, 156, 18, 0.2);
        }
        
        .file-explorer {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .file-item {
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            font-size: 0.9rem;
            position: relative;
        }
        
        .file-item:hover {
            background: linear-gradient(90deg, rgba(233, 69, 96, 0.1), rgba(243, 156, 18, 0.1));
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(233, 69, 96, 0.2);
        }
        
        .file-item.active {
            background: var(--primary);
            color: var(--text);
            box-shadow: 0 2px 12px rgba(233, 69, 96, 0.4);
        }
        
        .file-icon {
            margin-right: 8px;
            font-size: 1rem;
        }
        
        .editor-area {
            grid-area: editor;
            background: var(--dark);
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .editor-tabs {
            background: var(--darker);
            border-bottom: 1px solid var(--accent);
            display: flex;
            align-items: center;
            min-height: 40px;
            overflow-x: auto;
            padding: 0 10px;
        }
        
        .editor-tab {
            padding: 8px 16px;
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            border-radius: 6px 6px 0 0;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            position: relative;
            margin-right: 2px;
        }
        
        .editor-tab:hover {
            background: rgba(233, 69, 96, 0.1);
            color: var(--text);
        }
        
        .editor-tab.active {
            background: var(--dark);
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
        }
        
        .tab-close {
            opacity: 0.6;
            transition: opacity 0.2s ease;
        }
        
        .tab-close:hover {
            opacity: 1;
            color: var(--error);
        }
        
        .monaco-container {
            flex: 1;
            position: relative;
        }
        
        .editor-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted);
            font-size: 1.1rem;
        }
        
        .placeholder-logo {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.3;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .panel {
            grid-area: panel;
            background: var(--darker);
            border-left: 1px solid var(--accent);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .panel-tabs {
            background: rgba(243, 156, 18, 0.1);
            border-bottom: 1px solid var(--accent);
            display: flex;
            align-items: center;
            padding: 0 10px;
        }
        
        .panel-tab {
            padding: 10px 16px;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--text-muted);
            border-radius: 6px 6px 0 0;
            transition: all 0.2s ease;
        }
        
        .panel-tab:hover {
            color: var(--secondary);
            background: rgba(243, 156, 18, 0.1);
        }
        
        .panel-tab.active {
            color: var(--secondary);
            background: var(--darker);
            border-bottom: 2px solid var(--secondary);
        }
        
        .panel-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        
        .analysis-item {
            padding: 12px;
            margin: 8px 0;
            border-left: 3px solid var(--primary);
            background: rgba(233, 69, 96, 0.1);
            border-radius: 6px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .analysis-item:hover {
            background: rgba(233, 69, 96, 0.2);
            transform: translateX(3px);
            box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
        }
        
        .analysis-item.error {
            border-left-color: var(--error);
            background: rgba(231, 76, 60, 0.1);
        }
        
        .analysis-item.warning {
            border-left-color: var(--warning);
            background: rgba(243, 156, 18, 0.1);
        }
        
        .analysis-item.success {
            border-left-color: var(--success);
            background: rgba(39, 174, 96, 0.1);
        }
        
        .terminal-area {
            grid-area: terminal;
            background: #000;
            border-top: 2px solid var(--primary);
            display: flex;
            flex-direction: column;
            font-family: 'JetBrains Mono', 'Monaco', monospace;
        }
        
        .terminal-header {
            background: var(--darker);
            padding: 10px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--accent);
        }
        
        .terminal-tabs {
            display: flex;
            gap: 10px;
        }
        
        .terminal-tab {
            padding: 6px 12px;
            background: rgba(233, 69, 96, 0.2);
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s ease;
        }
        
        .terminal-tab.active {
            background: var(--primary);
        }
        
        .terminal-actions {
            display: flex;
            gap: 8px;
        }
        
        .terminal-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: var(--text);
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s ease;
        }
        
        .terminal-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .terminal-content {
            flex: 1;
            padding: 15px;
            color: #00ff00;
            font-size: 0.9rem;
            line-height: 1.4;
            overflow-y: auto;
        }
        
        .terminal-input-area {
            padding: 10px 15px;
            border-top: 1px solid #333;
            display: flex;
            align-items: center;
        }
        
        .terminal-prompt {
            color: #00ff00;
            margin-right: 8px;
            font-weight: bold;
        }
        
        .terminal-input {
            flex: 1;
            background: transparent;
            border: none;
            color: #00ff00;
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
        }
        
        .status-bar {
            grid-area: status;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            color: var(--text);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .status-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .status-right {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .status-item {
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s ease;
        }
        
        .status-item:hover {
            background: rgba(255,255,255,0.1);
        }
        
        .quality-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .quality-bar {
            width: 60px;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .quality-fill {
            height: 100%;
            background: var(--success);
            transition: width 0.3s ease;
        }
        
        /* Scrollbars */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--dark);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--secondary);
        }
        
        /* Animations */
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .slide-in {
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
            .ide-container {
                grid-template-columns: 50px 250px 1fr 300px;
            }
        }
        
        @media (max-width: 900px) {
            .ide-container {
                grid-template-columns: 50px 1fr 280px;
                grid-template-areas: 
                    "header header header"
                    "activity editor panel"
                    "activity terminal panel"
                    "status status status";
            }
            .sidebar { display: none; }
        }
    </style>
</head>
<body>
    <!-- Loading Screen -->
    <div class="loading-screen" id="loading-screen">
        <div class="loading-logo">🔍</div>
        <div class="loading-text">
            <div>Sherlock Ω IDE</div>
            <div style="font-size: 1rem; margin-top: 10px; opacity: 0.8;">Awakening digital consciousness...</div>
        </div>
        <div class="loading-bar">
            <div class="loading-progress" id="loading-progress"></div>
        </div>
    </div>

    <!-- Main IDE -->
    <div class="ide-container" id="ide-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">Sherlock Ω IDE</div>
            <div class="header-actions">
                <button class="header-btn" onclick="openCommandPalette()">
                    <i class="fas fa-search"></i> Command
                </button>
                <button class="header-btn" onclick="toggleSettings()">
                    <i class="fas fa-cog"></i> Settings
                </button>
            </div>
        </div>
        
        <!-- Activity Bar -->
        <div class="activity-bar">
            <div class="activity-item active" onclick="switchActivity('explorer')" title="Explorer">
                <i class="fas fa-folder-open"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('search')" title="Search">
                <i class="fas fa-search"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('git')" title="Source Control">
                <i class="fas fa-code-branch"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('debug')" title="Debug">
                <i class="fas fa-bug"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('extensions')" title="Extensions">
                <i class="fas fa-puzzle-piece"></i>
            </div>
        </div>
        
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <span>EXPLORER</span>
                <div class="sidebar-actions">
                    <button class="sidebar-btn" onclick="createNewFile()" title="New File">
                        <i class="fas fa-file-plus"></i>
                    </button>
                    <button class="sidebar-btn" onclick="createNewFolder()" title="New Folder">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                    <button class="sidebar-btn" onclick="refreshExplorer()" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
            <div class="file-explorer" id="file-explorer">
                <!-- Files will be loaded here -->
            </div>
        </div>
        
        <!-- Editor Area -->
        <div class="editor-area">
            <div class="editor-tabs" id="editor-tabs">
                <!-- Tabs will be added here -->
            </div>
            <div class="monaco-container" id="monaco-container">
                <div class="editor-placeholder">
                    <div class="placeholder-logo">🔍</div>
                    <div>Welcome to Sherlock Ω IDE</div>
                    <div style="font-size: 0.9rem; opacity: 0.7; margin-top: 10px;">
                        The world's first self-evolving development environment
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Panel -->
        <div class="panel">
            <div class="panel-tabs">
                <div class="panel-tab active" onclick="switchPanel('problems')">PROBLEMS</div>
                <div class="panel-tab" onclick="switchPanel('output')">OUTPUT</div>
                <div class="panel-tab" onclick="switchPanel('debug')">DEBUG</div>
            </div>
            <div class="panel-content" id="panel-content">
                <div class="analysis-item success">
                    <div style="font-weight: 600; margin-bottom: 5px;">🧬 Consciousness Active</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">
                        Sherlock Ω is analyzing, learning, and evolving...
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Terminal -->
        <div class="terminal-area">
            <div class="terminal-header">
                <div class="terminal-tabs">
                    <div class="terminal-tab active">
                        <i class="fas fa-terminal"></i> bash
                    </div>
                </div>
                <div class="terminal-actions">
                    <button class="terminal-btn" onclick="createNewTerminal()">
                        <i class="fas fa-plus"></i> New
                    </button>
                    <button class="terminal-btn" onclick="clearTerminal()">
                        <i class="fas fa-trash"></i> Clear
                    </button>
                </div>
            </div>
            <div class="terminal-content" id="terminal-content">
                <div style="color: #00ff00;">🔥 Sherlock Ω Terminal - Ready for commands</div>
                <div style="color: #888; margin-top: 5px;">Type 'help' for available commands</div>
            </div>
            <div class="terminal-input-area">
                <span class="terminal-prompt">$</span>
                <input class="terminal-input" id="terminal-input" placeholder="Enter command..." onkeypress="handleTerminalInput(event)">
            </div>
        </div>
        
        <!-- Status Bar -->
        <div class="status-bar">
            <div class="status-left">
                <div class="status-item" id="cursor-position">Ln 1, Col 1</div>
                <div class="status-item" id="file-language">TypeScript</div>
                <div class="status-item" id="git-status">
                    <i class="fas fa-code-branch"></i> main
                </div>
            </div>
            <div class="status-right">
                <div class="status-item" id="analysis-status">🧬 Evolving</div>
                <div class="quality-indicator">
                    <span>Quality:</span>
                    <div class="quality-bar">
                        <div class="quality-fill" id="quality-fill" style="width: 100%"></div>
                    </div>
                    <span id="quality-score">100%</span>
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js"></script>
    <script>
        // Global state
        let editor;
        let currentFile = null;
        let openTabs = new Map();
        let fileTree = [];
        
        // Initialize IDE
        document.addEventListener('DOMContentLoaded', function() {
            initializeIDE();
        });
        
        async function initializeIDE() {
            console.log('🔥 Initializing Sherlock Ω IDE...');
            
            // Show loading sequence
            await showLoadingSequence();
            
            // Initialize Monaco Editor
            await initializeMonaco();
            
            // Load file tree
            await loadFileTree();
            
            // Hide loading screen
            hideLoadingScreen();
            
            console.log('✨ Sherlock Ω IDE ready!');
        }
        
        async function showLoadingSequence() {
            const progress = document.getElementById('loading-progress');
            const steps = [
                { text: 'Awakening consciousness...', progress: 20 },
                { text: 'Loading neural networks...', progress: 40 },
                { text: 'Initializing pattern recognition...', progress: 60 },
                { text: 'Connecting to evolution engine...', progress: 80 },
                { text: 'Ready to dominate!', progress: 100 }
            ];
            
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                document.querySelector('.loading-text div:last-child').textContent = step.text;
                progress.style.width = step.progress + '%';
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }
        
        function hideLoadingScreen() {
            const loadingScreen = document.getElementById('loading-screen');
            const ideContainer = document.getElementById('ide-container');
            
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                ideContainer.classList.add('loaded');
            }, 500);
        }
        
        async function initializeMonaco() {
            return new Promise((resolve) => {
                require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' } });
                require(['vs/editor/editor.main'], function () {
                    resolve();
                });
            });
        }
        
        async function loadFileTree() {
            try {
                const response = await fetch('/api/files');
                fileTree = await response.json();
                renderFileTree(fileTree);
            } catch (error) {
                console.error('Failed to load file tree:', error);
                showNotification('Failed to load files', 'error');
            }
        }
        
        function renderFileTree(files) {
            const container = document.getElementById('file-explorer');
            container.innerHTML = '';
            
            files.forEach(file => {
                const item = createFileItem(file);
                container.appendChild(item);
            });
        }
        
        function createFileItem(file) {
            const item = document.createElement('div');
            item.className = 'file-item slide-in';
            item.onclick = () => openFile(file.path);
            
            const icon = getFileIcon(file);
            item.innerHTML = \`
                <span class="file-icon">\${icon}</span>
                <span>\${file.name}</span>
            \`;
            
            return item;
        }
        
        function getFileIcon(file) {
            if (file.type === 'directory') return '📁';
            
            const ext = file.extension?.toLowerCase();
            const icons = {
                '.ts': '🔷', '.js': '🟨', '.json': '📋', '.md': '📝',
                '.html': '🌐', '.css': '🎨', '.py': '🐍', '.java': '☕',
                '.cpp': '⚙️', '.c': '⚙️', '.go': '🐹', '.rs': '🦀'
            };
            
            return icons[ext] || '📄';
        }
        
        async function openFile(filePath) {
            try {
                showNotification('Opening file...', 'info');
                
                const response = await fetch(\`/api/file/\${encodeURIComponent(filePath)}\`);
                const fileData = await response.json();
                
                if (fileData.error) {
                    throw new Error(fileData.error);
                }
                
                // Create editor if needed
                if (!editor) {
                    await createEditor();
                }
                
                // Add tab and switch to it
                addTab(filePath, fileData.content);
                switchToTab(filePath);
                
                // Hide placeholder
                document.querySelector('.editor-placeholder').style.display = 'none';
                
                showNotification(\`Opened \${filePath}\`, 'success');
                
            } catch (error) {
                console.error('Failed to open file:', error);
                showNotification(\`Failed to open \${filePath}\`, 'error');
            }
        }
        
        async function createEditor() {
            const container = document.getElementById('monaco-container');
            const placeholder = container.querySelector('.editor-placeholder');
            
            editor = monaco.editor.create(container, {
                value: '',
                language: 'typescript',
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Monaco, monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                smoothScrolling: true,
                mouseWheelZoom: true
            });
            
            // Event handlers
            editor.onDidChangeCursorPosition(updateCursorPosition);
            editor.onDidChangeModelContent(onContentChange);
            
            placeholder.style.display = 'none';
        }
        
        function addTab(filePath, content) {
            const tabsContainer = document.getElementById('editor-tabs');
            
            if (openTabs.has(filePath)) {
                switchToTab(filePath);
                return;
            }
            
            const tab = document.createElement('div');
            tab.className = 'editor-tab fade-in';
            tab.dataset.path = filePath;
            
            const fileName = filePath.split('/').pop();
            const icon = getFileIcon({ extension: '.' + fileName.split('.').pop() });
            
            tab.innerHTML = \`
                \${icon}
                <span>\${fileName}</span>
                <i class="fas fa-times tab-close" onclick="closeTab(event, '\${filePath}')"></i>
            \`;
            
            tab.onclick = (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    switchToTab(filePath);
                }
            };
            
            tabsContainer.appendChild(tab);
            
            openTabs.set(filePath, {
                content: content,
                originalContent: content,
                element: tab,
                dirty: false
            });
        }
        
        function switchToTab(filePath) {
            // Update active tab
            document.querySelectorAll('.editor-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const tabData = openTabs.get(filePath);
            if (tabData) {
                tabData.element.classList.add('active');
                currentFile = filePath;
                
                if (editor) {
                    editor.setValue(tabData.content);
                    editor.focus();
                }
                
                updateLanguage(filePath);
            }
        }
        
        function closeTab(event, filePath) {
            event.stopPropagation();
            
            const tabData = openTabs.get(filePath);
            if (tabData) {
                tabData.element.remove();
                openTabs.delete(filePath);
                
                if (currentFile === filePath) {
                    const remainingTabs = Array.from(openTabs.keys());
                    if (remainingTabs.length > 0) {
                        switchToTab(remainingTabs[0]);
                    } else {
                        currentFile = null;
                        if (editor) {
                            editor.setValue('');
                        }
                        document.querySelector('.editor-placeholder').style.display = 'flex';
                    }
                }
            }
        }
        
        function updateCursorPosition(e) {
            document.getElementById('cursor-position').textContent = 
                \`Ln \${e.position.lineNumber}, Col \${e.position.column}\`;
        }
        
        function updateLanguage(filePath) {
            const ext = filePath.split('.').pop().toLowerCase();
            const languages = {
                'ts': 'TypeScript', 'js': 'JavaScript', 'json': 'JSON',
                'md': 'Markdown', 'html': 'HTML', 'css': 'CSS',
                'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'c': 'C'
            };
            
            document.getElementById('file-language').textContent = languages[ext] || 'Text';
        }
        
        let contentChangeTimeout;
        function onContentChange() {
            if (currentFile) {
                markTabDirty(currentFile);
            }
            
            clearTimeout(contentChangeTimeout);
            contentChangeTimeout = setTimeout(analyzeCode, 1000);
        }
        
        function markTabDirty(filePath) {
            const tabData = openTabs.get(filePath);
            if (tabData && editor) {
                const currentContent = editor.getValue();
                const isDirty = currentContent !== tabData.originalContent;
                
                if (isDirty !== tabData.dirty) {
                    tabData.dirty = isDirty;
                    tabData.element.classList.toggle('dirty', isDirty);
                }
                
                tabData.content = currentContent;
            }
        }
        
        async function analyzeCode() {
            if (!editor || !currentFile) return;
            
            try {
                document.getElementById('analysis-status').textContent = '🔍 Analyzing...';
                
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: editor.getValue() })
                });
                
                const analysis = await response.json();
                displayAnalysis(analysis);
                updateQualityScore(analysis.overallScore);
                
                document.getElementById('analysis-status').textContent = '🧬 Evolving';
                
            } catch (error) {
                console.error('Analysis failed:', error);
                document.getElementById('analysis-status').textContent = '❌ Error';
            }
        }
        
        function displayAnalysis(analysis) {
            const container = document.getElementById('panel-content');
            
            if (analysis.patterns.length === 0) {
                container.innerHTML = \`
                    <div class="analysis-item success fade-in">
                        <div style="font-weight: 600; margin-bottom: 5px;">✅ Perfect Code!</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">
                            No issues detected. Your code is clean and optimized.
                        </div>
                    </div>
                \`;
                return;
            }
            
            let html = '';
            analysis.patterns.forEach(pattern => {
                const severity = pattern.severity === 'high' ? 'error' : 
                               pattern.severity === 'medium' ? 'warning' : 'success';
                
                html += \`
                    <div class="analysis-item \${severity} fade-in" onclick="goToLine(\${pattern.line || 1})">
                        <div style="font-weight: 600; margin-bottom: 5px;">
                            \${getSeverityIcon(pattern.severity)} \${pattern.type}
                        </div>
                        <div style="margin-bottom: 5px;">\${pattern.message}</div>
                        \${pattern.line ? \`<div style="font-size: 0.8rem; opacity: 0.7;">Line \${pattern.line}</div>\` : ''}
                        \${pattern.suggestion ? \`<div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">💡 \${pattern.suggestion}</div>\` : ''}
                    </div>
                \`;
            });
            
            container.innerHTML = html;
        }
        
        function getSeverityIcon(severity) {
            const icons = {
                'high': '🚨',
                'medium': '⚠️',
                'low': 'ℹ️'
            };
            return icons[severity] || 'ℹ️';
        }
        
        function goToLine(lineNumber) {
            if (editor) {
                editor.revealLineInCenter(lineNumber);
                editor.setPosition({ lineNumber, column: 1 });
                editor.focus();
            }
        }
        
        function updateQualityScore(score) {
            const percentage = Math.round(score * 100);
            document.getElementById('quality-score').textContent = percentage + '%';
            document.getElementById('quality-fill').style.width = percentage + '%';
            
            const fill = document.getElementById('quality-fill');
            if (percentage >= 80) {
                fill.style.background = 'var(--success)';
            } else if (percentage >= 60) {
                fill.style.background = 'var(--warning)';
            } else {
                fill.style.background = 'var(--error)';
            }
        }
        
        // Terminal functionality
        function handleTerminalInput(event) {
            if (event.key === 'Enter') {
                const input = event.target;
                const command = input.value.trim();
                
                if (command) {
                    addTerminalOutput(\`$ \${command}\`);
                    executeCommand(command);
                    input.value = '';
                }
            }
        }
        
        function addTerminalOutput(text, className = '') {
            const terminal = document.getElementById('terminal-content');
            const line = document.createElement('div');
            line.textContent = text;
            if (className) line.className = className;
            terminal.appendChild(line);
            terminal.scrollTop = terminal.scrollHeight;
        }
        
        async function executeCommand(command) {
            const commands = {
                'help': () => {
                    addTerminalOutput('Available commands:', 'fade-in');
                    addTerminalOutput('  help     - Show this help', 'fade-in');
                    addTerminalOutput('  clear    - Clear terminal', 'fade-in');
                    addTerminalOutput('  status   - Show IDE status', 'fade-in');
                    addTerminalOutput('  analyze  - Analyze current file', 'fade-in');
                },
                'clear': () => {
                    document.getElementById('terminal-content').innerHTML = 
                        '<div style="color: #00ff00;">🔥 Sherlock Ω Terminal - Ready for commands</div>';
                },
                'status': async () => {
                    try {
                        const response = await fetch('/api/status');
                        const status = await response.json();
                        addTerminalOutput(\`Platform: \${status.orchestrator.platform}\`, 'fade-in');
                        addTerminalOutput(\`Uptime: \${Math.round(status.orchestrator.uptime)}s\`, 'fade-in');
                        addTerminalOutput(\`Files: \${fileTree.length} loaded\`, 'fade-in');
                        addTerminalOutput(\`Tabs: \${openTabs.size} open\`, 'fade-in');
                    } catch (error) {
                        addTerminalOutput('Failed to get status', 'fade-in');
                    }
                },
                'analyze': () => {
                    if (currentFile) {
                        analyzeCode();
                        addTerminalOutput('Running code analysis...', 'fade-in');
                    } else {
                        addTerminalOutput('No file open to analyze', 'fade-in');
                    }
                }
            };
            
            if (commands[command]) {
                await commands[command]();
            } else {
                addTerminalOutput(\`Command not found: \${command}\`, 'fade-in');
                addTerminalOutput('Type "help" for available commands', 'fade-in');
            }
        }
        
        // UI interactions
        function switchActivity(activity) {
            document.querySelectorAll('.activity-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.activity-item').classList.add('active');
            
            const titles = {
                'explorer': 'EXPLORER',
                'search': 'SEARCH',
                'git': 'SOURCE CONTROL',
                'debug': 'DEBUG',
                'extensions': 'EXTENSIONS'
            };
            
            document.querySelector('.sidebar-header span').textContent = titles[activity];
        }
        
        function switchPanel(panel) {
            document.querySelectorAll('.panel-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
        }
        
        function createNewFile() {
            const fileName = prompt('Enter file name:');
            if (fileName) {
                showNotification(\`Creating \${fileName}...\`, 'info');
                // TODO: Implement file creation
            }
        }
        
        function createNewFolder() {
            const folderName = prompt('Enter folder name:');
            if (folderName) {
                showNotification(\`Creating folder \${folderName}...\`, 'info');
                // TODO: Implement folder creation
            }
        }
        
        function refreshExplorer() {
            showNotification('Refreshing file tree...', 'info');
            loadFileTree();
        }
        
        function createNewTerminal() {
            showNotification('Creating new terminal...', 'info');
            // TODO: Implement multiple terminals
        }
        
        function clearTerminal() {
            document.getElementById('terminal-content').innerHTML = 
                '<div style="color: #00ff00;">🔥 Sherlock Ω Terminal - Ready for commands</div>';
        }
        
        // Notifications
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification \${type} fade-in\`;
            notification.style.cssText = \`
                position: fixed;
                top: 60px;
                right: 20px;
                background: var(--darker);
                border: 1px solid var(--accent);
                border-left: 3px solid var(--\${type === 'error' ? 'error' : type === 'success' ? 'success' : 'primary'});
                padding: 12px 16px;
                border-radius: 6px;
                color: var(--text);
                font-size: 0.9rem;
                box-shadow: var(--shadow);
                z-index: 1000;
                max-width: 300px;
            \`;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        if (currentFile) {
                            saveCurrentFile();
                        }
                        break;
                    case 'n':
                        e.preventDefault();
                        createNewFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        // TODO: Open file dialog
                        break;
                    case 'w':
                        e.preventDefault();
                        if (currentFile) {
                            closeTab(e, currentFile);
                        }
                        break;
                }
            }
        });
        
        async function saveCurrentFile() {
            if (!currentFile || !editor) return;
            
            try {
                showNotification('Saving file...', 'info');
                
                const content = editor.getValue();
                const response = await fetch(\`/api/file/\${encodeURIComponent(currentFile)}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                
                const result = await response.json();
                if (result.success) {
                    const tabData = openTabs.get(currentFile);
                    if (tabData) {
                        tabData.originalContent = content;
                        tabData.dirty = false;
                        tabData.element.classList.remove('dirty');
                    }
                    
                    showNotification('File saved successfully!', 'success');
                } else {
                    throw new Error('Save failed');
                }
            } catch (error) {
                console.error('Failed to save file:', error);
                showNotification('Failed to save file', 'error');
            }
        }
    </script>
</body>
</html>`;