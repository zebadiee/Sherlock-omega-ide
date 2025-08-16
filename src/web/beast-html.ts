export const BEAST_MODE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Sherlock Ω IDE - BEAST MODE</title>
    <link rel="stylesheet" href="https://unpkg.com/monaco-editor@0.52.2/min/vs/editor/editor.main.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #e94560;
            height: 100vh;
            overflow: hidden;
        }
        
        .beast-container {
            display: grid;
            grid-template: "header header header" 40px
                          "sidebar editor panel" 1fr
                          "terminal terminal terminal" 200px
                          "status status status" 25px / 250px 1fr 300px;
            height: 100vh;
            gap: 1px;
            background: #0f3460;
        }
        
        .beast-header {
            grid-area: header;
            background: linear-gradient(90deg, #e94560, #f39c12);
            display: flex;
            align-items: center;
            padding: 0 20px;
            color: white;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
        }
        
        .beast-sidebar {
            grid-area: sidebar;
            background: #1a1a2e;
            border-right: 2px solid #e94560;
            overflow-y: auto;
        }
        
        .beast-editor {
            grid-area: editor;
            background: #0f0f23;
            position: relative;
        }
        
        .beast-panel {
            grid-area: panel;
            background: #1a1a2e;
            border-left: 2px solid #e94560;
            overflow-y: auto;
        }
        
        .beast-terminal {
            grid-area: terminal;
            background: #000;
            border-top: 2px solid #e94560;
            color: #00ff00;
            font-family: 'Monaco', monospace;
            padding: 10px;
            overflow-y: auto;
        }
        
        .beast-status {
            grid-area: status;
            background: linear-gradient(90deg, #e94560, #f39c12);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 12px;
        }
        
        .file-item {
            padding: 8px 16px;
            cursor: pointer;
            border-bottom: 1px solid #0f3460;
            transition: all 0.2s;
        }
        
        .file-item:hover {
            background: linear-gradient(90deg, rgba(233, 69, 96, 0.2), rgba(243, 156, 18, 0.2));
            transform: translateX(5px);
        }
        
        .analysis-item {
            padding: 10px;
            margin: 5px;
            border-left: 3px solid #e94560;
            background: rgba(233, 69, 96, 0.1);
            border-radius: 5px;
        }
        
        .beast-button {
            background: linear-gradient(45deg, #e94560, #f39c12);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
        }
        
        .beast-button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="beast-container">
        <div class="beast-header">
            🔍 Sherlock Ω IDE - BEAST MODE ACTIVATED
        </div>
        
        <div class="beast-sidebar">
            <div style="padding: 10px; font-weight: bold; color: #f39c12;">FILES</div>
            <div id="file-tree"></div>
        </div>
        
        <div class="beast-editor">
            <div id="monaco-editor" style="height: 100%;"></div>
        </div>
        
        <div class="beast-panel">
            <div style="padding: 10px; font-weight: bold; color: #f39c12;">ANALYSIS</div>
            <div id="analysis-results"></div>
        </div>
        
        <div class="beast-terminal">
            <div>🔥 BEAST TERMINAL READY</div>
            <div id="terminal-output"></div>
            <input id="terminal-input" style="background: transparent; border: none; color: #00ff00; width: 100%; outline: none;" placeholder="Enter command...">
        </div>
        
        <div class="beast-status">
            <span id="status-left">Ready to dominate</span>
            <span id="status-right">Quality: <span id="quality-score">100%</span></span>
        </div>
    </div>

    <script src="https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js"></script>
    <script>
        let editor;
        
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: 'function beastMode() {\\n  console.log("🔥 SHERLOCK Ω DOMINATING!");\\n}',
                language: 'typescript',
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: true }
            });
            
            editor.onDidChangeModelContent(() => analyzeCode());
            loadFiles();
        });
        
        async function loadFiles() {
            try {
                const response = await fetch('/api/files');
                const files = await response.json();
                renderFiles(files);
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }
        
        function renderFiles(files) {
            const container = document.getElementById('file-tree');
            container.innerHTML = files.map(file => 
                \`<div class="file-item" onclick="openFile('\${file.path}')">\${file.name}</div>\`
            ).join('');
        }
        
        async function openFile(path) {
            try {
                const response = await fetch(\`/api/file/\${encodeURIComponent(path)}\`);
                const data = await response.json();
                if (editor) {
                    editor.setValue(data.content);
                }
            } catch (error) {
                console.error('Failed to open file:', error);
            }
        }
        
        async function analyzeCode() {
            if (!editor) return;
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: editor.getValue() })
                });
                
                const analysis = await response.json();
                displayAnalysis(analysis);
            } catch (error) {
                console.error('Analysis failed:', error);
            }
        }
        
        function displayAnalysis(analysis) {
            const container = document.getElementById('analysis-results');
            const score = Math.round(analysis.overallScore * 100);
            
            document.getElementById('quality-score').textContent = score + '%';
            
            if (analysis.patterns.length === 0) {
                container.innerHTML = '<div class="analysis-item">🔥 CODE IS PERFECT!</div>';
                return;
            }
            
            container.innerHTML = analysis.patterns.map(pattern => 
                \`<div class="analysis-item">
                    <strong>\${pattern.type}</strong><br>
                    \${pattern.message}
                    \${pattern.suggestion ? '<br>💡 ' + pattern.suggestion : ''}
                </div>\`
            ).join('');
        }
        
        document.getElementById('terminal-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const command = this.value;
                document.getElementById('terminal-output').innerHTML += 
                    \`<div>$ \${command}</div><div>🔥 Command executed!</div>\`;
                this.value = '';
            }
        });
    </script>
</body>
</html>`;