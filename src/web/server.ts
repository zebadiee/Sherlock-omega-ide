/**
 * Simple HTTP Server for Sherlock Ω IDE Web Interface
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

export class SherlockWebServer {
  private server: http.Server;
  private logger: Logger;
  private orchestrator: any;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.logger = new Logger(PlatformType.WEB);
    this.server = this.createServer();
  }

  setOrchestrator(orchestrator: any): void {
    this.orchestrator = orchestrator;
  }

  private createServer(): http.Server {
    return http.createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res);
      } catch (error) {
        this.logger.error('Server error:', {}, error as Error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url || '/';
    const method = req.method || 'GET';

    this.logger.info(`${method} ${url}`);

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    if (url === '/' || url === '/index.html') {
      await this.serveHTML(res);
    } else if (url === '/api/analyze' && method === 'POST') {
      await this.handleAnalyze(req, res);
    } else if (url === '/api/status') {
      await this.handleStatus(res);
    } else if (url.startsWith('/static/')) {
      await this.serveStatic(url, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }

  private async serveHTML(res: http.ServerResponse): Promise<void> {
    const html = this.generateHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private async handleAnalyze(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { code } = JSON.parse(body);
        
        if (!this.orchestrator) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Orchestrator not available' }));
          return;
        }

        const analysis = await this.orchestrator.analyzeCode(code);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(analysis));
      } catch (error) {
        this.logger.error('Analysis error:', {}, error as Error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Analysis failed' }));
      }
    });
  }

  private async handleStatus(res: http.ServerResponse): Promise<void> {
    const status = this.orchestrator ? await this.orchestrator.getStatus() : { error: 'Not initialized' };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  private async serveStatic(url: string, res: http.ServerResponse): Promise<void> {
    // For now, just return 404 for static files
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Static files not implemented');
  }

  private generateHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω IDE</title>
    <link rel="stylesheet" href="https://unpkg.com/monaco-editor@0.52.2/min/vs/editor/editor.main.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: #1e1e1e;
            color: #cccccc;
            height: 100vh;
            overflow: hidden;
        }
        
        .ide-container {
            display: grid;
            grid-template-areas: 
                "titlebar titlebar titlebar"
                "sidebar editor panel"
                "statusbar statusbar statusbar";
            grid-template-rows: 35px 1fr 22px;
            grid-template-columns: 300px 1fr 400px;
            height: 100vh;
        }
        
        .titlebar {
            grid-area: titlebar;
            background: #323233;
            display: flex;
            align-items: center;
            padding: 0 16px;
            border-bottom: 1px solid #2d2d30;
        }
        
        .titlebar .logo {
            display: flex;
            align-items: center;
            font-weight: 600;
            font-size: 13px;
        }
        
        .titlebar .logo::before {
            content: "🔍";
            margin-right: 8px;
            font-size: 16px;
        }
        
        .sidebar {
            grid-area: sidebar;
            background: #252526;
            border-right: 1px solid #2d2d30;
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-header {
            padding: 8px 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #cccccc;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
        }
        
        .file-explorer {
            flex: 1;
            padding: 8px;
        }
        
        .file-item {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 13px;
            display: flex;
            align-items: center;
        }
        
        .file-item:hover {
            background: #2a2d2e;
        }
        
        .file-item.active {
            background: #094771;
            color: #ffffff;
        }
        
        .file-item::before {
            content: "📄";
            margin-right: 6px;
            font-size: 12px;
        }
        
        .editor-area {
            grid-area: editor;
            background: #1e1e1e;
            display: flex;
            flex-direction: column;
        }
        
        .editor-tabs {
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
            min-height: 35px;
        }
        
        .editor-tab {
            padding: 8px 16px;
            background: #2d2d30;
            border-right: 1px solid #3e3e42;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            position: relative;
        }
        
        .editor-tab.active {
            background: #1e1e1e;
            border-bottom: 1px solid #1e1e1e;
        }
        
        .editor-tab::before {
            content: "📄";
            margin-right: 6px;
            font-size: 11px;
        }
        
        .editor-tab .close {
            margin-left: 8px;
            opacity: 0.6;
            cursor: pointer;
        }
        
        .editor-tab .close:hover {
            opacity: 1;
        }
        
        .monaco-container {
            flex: 1;
            position: relative;
        }
        
        .analysis-panel {
            grid-area: panel;
            background: #252526;
            border-left: 1px solid #2d2d30;
            display: flex;
            flex-direction: column;
        }
        
        .panel-header {
            padding: 8px 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #cccccc;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .panel-content {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
        }
        
        .analysis-result {
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            border-left: 3px solid;
        }
        
        .analysis-result.error {
            background: #5a1d1d;
            border-left-color: #f14c4c;
        }
        
        .analysis-result.warning {
            background: #5d4e1a;
            border-left-color: #ffcc02;
        }
        
        .analysis-result.info {
            background: #1a365d;
            border-left-color: #3794ff;
        }
        
        .analysis-result.success {
            background: #1a5d1a;
            border-left-color: #89d185;
        }
        
        .result-type {
            font-weight: 600;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-size: 10px;
        }
        
        .result-message {
            margin-bottom: 4px;
        }
        
        .result-suggestion {
            font-style: italic;
            opacity: 0.8;
        }
        
        .statusbar {
            grid-area: statusbar;
            background: #007acc;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 16px;
            font-size: 12px;
            justify-content: space-between;
        }
        
        .statusbar-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .statusbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .action-button {
            background: #0e639c;
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.2s;
        }
        
        .action-button:hover {
            background: #1177bb;
        }
        
        .score-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
        }
        
        .score-bar {
            width: 60px;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .score-fill {
            height: 100%;
            background: #89d185;
            transition: width 0.3s;
        }
        
        .loading {
            opacity: 0.7;
        }
        
        @media (max-width: 1200px) {
            .ide-container {
                grid-template-columns: 250px 1fr 350px;
            }
        }
        
        @media (max-width: 900px) {
            .ide-container {
                grid-template-areas: 
                    "titlebar titlebar"
                    "editor panel"
                    "statusbar statusbar";
                grid-template-columns: 1fr 350px;
            }
            
            .sidebar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="ide-container">
        <div class="titlebar">
            <div class="logo">Sherlock Ω IDE</div>
        </div>
        
        <div class="sidebar">
            <div class="sidebar-header">Explorer</div>
            <div class="file-explorer">
                <div class="file-item active" onclick="loadFile('main.ts')">main.ts</div>
                <div class="file-item" onclick="loadFile('utils.ts')">utils.ts</div>
                <div class="file-item" onclick="loadFile('types.ts')">types.ts</div>
            </div>
        </div>
        
        <div class="editor-area">
            <div class="editor-tabs">
                <div class="editor-tab active">
                    main.ts
                    <span class="close" onclick="closeTab()">×</span>
                </div>
            </div>
            <div class="monaco-container" id="monaco-container"></div>
        </div>
        
        <div class="analysis-panel">
            <div class="panel-header">
                Pattern Analysis
                <button class="action-button" onclick="analyzeCode()">Analyze</button>
            </div>
            <div class="panel-content" id="analysis-results">
                <div class="analysis-result info">
                    <div class="result-type">Info</div>
                    <div class="result-message">Ready for code analysis</div>
                    <div class="result-suggestion">Write some code and click "Analyze" to see patterns and suggestions</div>
                </div>
            </div>
        </div>
        
        <div class="statusbar">
            <div class="statusbar-left">
                <span id="cursor-position">Ln 1, Col 1</span>
                <span>TypeScript</span>
                <span id="analysis-status">Ready</span>
            </div>
            <div class="statusbar-right">
                <div class="score-indicator">
                    <span>Score:</span>
                    <div class="score-bar">
                        <div class="score-fill" id="score-fill" style="width: 100%"></div>
                    </div>
                    <span id="score-text">100%</span>
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js"></script>
    <script>
        let editor;
        let currentAnalysis = null;
        
        // Initialize Monaco Editor
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('monaco-container'), {
                value: \`function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price == undefined) {
      console.log("Missing price");
      continue;
    }
    total += items[i].price;
  }
  return total
}\`,
                language: 'typescript',
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: true
            });
            
            // Update cursor position
            editor.onDidChangeCursorPosition(function(e) {
                document.getElementById('cursor-position').textContent = 
                    \`Ln \${e.position.lineNumber}, Col \${e.position.column}\`;
            });
            
            // Auto-analyze on content change (debounced)
            let analyzeTimeout;
            editor.onDidChangeModelContent(function() {
                clearTimeout(analyzeTimeout);
                analyzeTimeout = setTimeout(analyzeCode, 1000);
            });
            
            // Initial analysis
            setTimeout(analyzeCode, 500);
        });
        
        async function analyzeCode() {
            if (!editor) return;
            
            const code = editor.getValue();
            const statusElement = document.getElementById('analysis-status');
            const resultsElement = document.getElementById('analysis-results');
            
            statusElement.textContent = 'Analyzing...';
            statusElement.className = 'loading';
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                
                const analysis = await response.json();
                currentAnalysis = analysis;
                
                displayAnalysisResults(analysis);
                updateScore(analysis.overallScore);
                
                statusElement.textContent = \`\${analysis.patterns.length} issues found\`;
                statusElement.className = '';
                
            } catch (error) {
                resultsElement.innerHTML = \`
                    <div class="analysis-result error">
                        <div class="result-type">Error</div>
                        <div class="result-message">Analysis failed: \${error.message}</div>
                    </div>
                \`;
                statusElement.textContent = 'Analysis failed';
                statusElement.className = '';
            }
        }
        
        function displayAnalysisResults(analysis) {
            const resultsElement = document.getElementById('analysis-results');
            
            if (analysis.patterns.length === 0) {
                resultsElement.innerHTML = \`
                    <div class="analysis-result success">
                        <div class="result-type">Success</div>
                        <div class="result-message">No issues found!</div>
                        <div class="result-suggestion">Your code looks clean and follows best practices</div>
                    </div>
                \`;
                return;
            }
            
            let html = '';
            analysis.patterns.forEach(pattern => {
                const severity = pattern.severity === 'high' ? 'error' : 
                               pattern.severity === 'medium' ? 'warning' : 'info';
                
                html += \`
                    <div class="analysis-result \${severity}">
                        <div class="result-type">\${pattern.type} - \${pattern.severity}</div>
                        <div class="result-message">\${pattern.message}</div>
                        \${pattern.line ? \`<div style="font-size: 11px; opacity: 0.8;">Line \${pattern.line}</div>\` : ''}
                        \${pattern.suggestion ? \`<div class="result-suggestion">💡 \${pattern.suggestion}</div>\` : ''}
                    </div>
                \`;
            });
            
            resultsElement.innerHTML = html;
        }
        
        function updateScore(score) {
            const scoreText = document.getElementById('score-text');
            const scoreFill = document.getElementById('score-fill');
            
            const percentage = Math.round(score * 100);
            scoreText.textContent = \`\${percentage}%\`;
            scoreFill.style.width = \`\${percentage}%\`;
            
            // Color based on score
            if (percentage >= 80) {
                scoreFill.style.background = '#89d185';
            } else if (percentage >= 60) {
                scoreFill.style.background = '#ffcc02';
            } else {
                scoreFill.style.background = '#f14c4c';
            }
        }
        
        function loadFile(filename) {
            // Update active file in sidebar
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update tab
            document.querySelector('.editor-tab').textContent = filename;
            
            // Load sample content based on file
            const samples = {
                'main.ts': \`function calculateTotal(items: Item[]) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price == undefined) {
      console.log("Missing price");
      continue;
    }
    total += items[i].price;
  }
  return total
}\`,
                'utils.ts': \`export function processData(data) {
  var results = [];
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].items.length; j++) {
      if (data[i].items[j].active == true) {
        results.push(data[i].items[j].name);
      }
    }
  }
  return results
}\`,
                'types.ts': \`interface Item {
  id: number;
  name: string;
  price?: number;
  active: boolean;
}

type ProcessedData = {
  items: Item[];
  total: number;
}\`
            };
            
            if (editor && samples[filename]) {
                editor.setValue(samples[filename]);
            }
        }
        
        function closeTab() {
            // In a real IDE, this would close the tab
            console.log('Close tab clicked');
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                analyzeCode();
            }
        });
    </script>
</body>
</html>`;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        this.logger.info(`🌐 Sherlock Ω IDE Web Server running at http://localhost:${this.port}`);
        console.log(`🌐 Open your browser to: http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger.info('🛑 Web server stopped');
        resolve();
      });
    });
  }
}