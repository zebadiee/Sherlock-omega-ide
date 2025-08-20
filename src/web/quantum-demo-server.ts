import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the quantum visualizer
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω - Quantum Enhanced IDE</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
        }
        .nav {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        .nav-buttons {
            display: flex;
            gap: 1rem;
        }
        .nav-button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-button.active {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
        }
        .nav-button:not(.active) {
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
        }
        .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }
        .content {
            padding: 2rem;
        }
        .quantum-container {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid #333;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .metric {
            background: rgba(0, 212, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(0, 212, 255, 0.3);
            text-align: center;
        }
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #00d4ff;
        }
        .metric-label {
            font-size: 0.9rem;
            color: #aaa;
            margin-top: 0.5rem;
        }
        .canvas-container {
            background: #000;
            border-radius: 8px;
            padding: 1rem;
            border: 1px solid #333;
            margin-top: 1rem;
        }
        canvas {
            width: 100%;
            height: 400px;
            border-radius: 4px;
        }
        .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="nav">
        <div class="logo">🚀 Sherlock Ω IDE</div>
        <div class="nav-buttons">
            <button class="nav-button active" onclick="showQuantum()">⚛️ Quantum Visualizer</button>
            <a href="/devops-chat" class="nav-button">🛠️ DevOps Chat</a>
            <a href="/bot-manager" class="nav-button">🤖 Bot Manager</a>
        </div>
    </div>

    <div class="content">
        <div id="quantum-view" class="quantum-container">
            <div class="status">
                <div class="status-dot"></div>
                <span>Quantum Error Correction System Active</span>
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value" id="error-rate">0.100%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="frame-rate">65.6 FPS</div>
                    <div class="metric-label">Frame Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="quantum-advantage">1.97x</div>
                    <div class="metric-label">Quantum Advantage</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="correction-success">86.7%</div>
                    <div class="metric-label">Correction Success</div>
                </div>
            </div>

            <div class="canvas-container">
                <canvas id="quantum-canvas"></canvas>
            </div>
        </div>
    </div>

    <script>
        // Quantum Visualizer Implementation
        class QuantumVisualizer {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.width = canvas.width = canvas.offsetWidth * 2;
                this.height = canvas.height = canvas.offsetHeight * 2;
                this.ctx.scale(2, 2);
                
                this.qubits = [];
                this.errors = [];
                this.corrections = [];
                this.time = 0;
                
                this.initializeQubits();
                this.animate();
            }
            
            initializeQubits() {
                const gridSize = 7; // Surface code distance 7
                const spacing = (this.width / 2) / (gridSize + 1);
                
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        this.qubits.push({
                            x: (i + 1) * spacing,
                            y: (j + 1) * spacing,
                            state: Math.random() > 0.5 ? 1 : 0,
                            error: false,
                            corrected: false,
                            phase: Math.random() * Math.PI * 2
                        });
                    }
                }
            }
            
            update() {
                this.time += 0.02;
                
                // Simulate quantum errors
                this.qubits.forEach(qubit => {
                    if (Math.random() < 0.001) { // 0.1% error rate
                        qubit.error = true;
                        qubit.corrected = false;
                    }
                    
                    // Simulate error correction
                    if (qubit.error && Math.random() < 0.1) {
                        qubit.error = false;
                        qubit.corrected = true;
                        setTimeout(() => qubit.corrected = false, 1000);
                    }
                    
                    qubit.phase += 0.05;
                });
                
                // Update metrics
                const errorCount = this.qubits.filter(q => q.error).length;
                const correctedCount = this.qubits.filter(q => q.corrected).length;
                
                document.getElementById('error-rate').textContent = 
                    ((errorCount / this.qubits.length) * 100).toFixed(3) + '%';
                document.getElementById('correction-success').textContent = 
                    (correctedCount > 0 ? ((correctedCount / (errorCount + correctedCount)) * 100).toFixed(1) : '86.7') + '%';
            }
            
            draw() {
                // Clear canvas
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.width / 2, this.height / 2);
                
                // Draw quantum grid
                this.qubits.forEach((qubit, i) => {
                    const x = qubit.x;
                    const y = qubit.y;
                    
                    // Qubit visualization
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    
                    // Quantum state visualization
                    const radius = 8 + Math.sin(qubit.phase) * 2;
                    
                    if (qubit.error) {
                        this.ctx.fillStyle = '#ff4444';
                        this.ctx.shadowColor = '#ff4444';
                        this.ctx.shadowBlur = 10;
                    } else if (qubit.corrected) {
                        this.ctx.fillStyle = '#44ff44';
                        this.ctx.shadowColor = '#44ff44';
                        this.ctx.shadowBlur = 10;
                    } else {
                        this.ctx.fillStyle = '#00d4ff';
                        this.ctx.shadowColor = '#00d4ff';
                        this.ctx.shadowBlur = 5;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Quantum superposition visualization
                    this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                });
                
                // Draw entanglement connections
                this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < this.qubits.length - 1; i++) {
                    if (i % 7 !== 6) { // Horizontal connections
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.qubits[i].x, this.qubits[i].y);
                        this.ctx.lineTo(this.qubits[i + 1].x, this.qubits[i + 1].y);
                        this.ctx.stroke();
                    }
                    if (i < this.qubits.length - 7) { // Vertical connections
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.qubits[i].x, this.qubits[i].y);
                        this.ctx.lineTo(this.qubits[i + 7].x, this.qubits[i + 7].y);
                        this.ctx.stroke();
                    }
                }
                
                // Draw title
                this.ctx.fillStyle = '#00d4ff';
                this.ctx.font = '16px monospace';
                this.ctx.fillText('Surface Code Quantum Error Correction', 20, 30);
                this.ctx.fillStyle = '#aaa';
                this.ctx.font = '12px monospace';
                this.ctx.fillText('Distance 7 (49 qubits) - Real-time simulation', 20, 50);
            }
            
            animate() {
                this.update();
                this.draw();
                requestAnimationFrame(() => this.animate());
            }
        }
        
        // Initialize visualizer
        const canvas = document.getElementById('quantum-canvas');
        const visualizer = new QuantumVisualizer(canvas);
        
        // Update frame rate counter
        let frameCount = 0;
        let lastTime = Date.now();
        setInterval(() => {
            const now = Date.now();
            const fps = (frameCount * 1000) / (now - lastTime);
            document.getElementById('frame-rate').textContent = fps.toFixed(1) + ' FPS';
            frameCount = 0;
            lastTime = now;
        }, 1000);
        
        function showQuantum() {
            // Already showing quantum view
        }
        
        // Simulate quantum advantage updates
        setInterval(() => {
            const advantage = 1.9 + Math.random() * 0.2;
            document.getElementById('quantum-advantage').textContent = advantage.toFixed(2) + 'x';
        }, 3000);
    </script>
</body>
</html>
  `);
});

// DevOps Chat endpoint
app.get('/devops-chat', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω - DevOps Chat</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
        }
        .nav {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        .nav-buttons {
            display: flex;
            gap: 1rem;
        }
        .nav-button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-button.active {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
        }
        .nav-button:not(.active) {
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
        }
        .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }
        .chat-container {
            max-width: 800px;
            margin: 2rem auto;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid #333;
        }
        .chat-messages {
            height: 400px;
            overflow-y: auto;
            background: #000;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid #333;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.5rem;
            border-radius: 6px;
        }
        .message.user {
            background: rgba(0, 212, 255, 0.1);
            border-left: 3px solid #00d4ff;
        }
        .message.system {
            background: rgba(0, 255, 136, 0.1);
            border-left: 3px solid #00ff88;
        }
        .message.error {
            background: rgba(255, 68, 68, 0.1);
            border-left: 3px solid #ff4444;
        }
        .input-container {
            display: flex;
            gap: 1rem;
        }
        .command-input {
            flex: 1;
            padding: 0.75rem;
            background: #000;
            border: 1px solid #333;
            border-radius: 6px;
            color: #e0e0e0;
            font-family: 'Consolas', monospace;
        }
        .send-button {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }
        .send-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
        }
        .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="nav">
        <div class="logo">🚀 Sherlock Ω IDE</div>
        <div class="nav-buttons">
            <a href="/" class="nav-button">⚛️ Quantum Visualizer</a>
            <button class="nav-button active">🛠️ DevOps Chat</button>
            <a href="/bot-manager" class="nav-button">🤖 Bot Manager</a>
        </div>
    </div>

    <div class="chat-container">
        <div class="status">
            <div class="status-dot"></div>
            <span>DevOps Chat System Active - Simulation Mode</span>
        </div>
        
        <div class="chat-messages" id="messages">
            <div class="message system">
                <strong>System:</strong> DevOps Chat initialized in simulation mode. Safe to execute commands.
            </div>
            <div class="message system">
                <strong>Available Commands:</strong> npm test, npm run build, git status, ls -la, pwd, node --version
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" class="command-input" id="commandInput" placeholder="Enter command (e.g., npm test, git status)..." />
            <button class="send-button" onclick="executeCommand()">Execute</button>
        </div>
    </div>

    <script>
        const messages = document.getElementById('messages');
        const commandInput = document.getElementById('commandInput');
        
        function addMessage(type, content) {
            const message = document.createElement('div');
            message.className = \`message \${type}\`;
            message.innerHTML = content;
            messages.appendChild(message);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function executeCommand() {
            const command = commandInput.value.trim();
            if (!command) return;
            
            addMessage('user', \`<strong>$:</strong> \${command}\`);
            commandInput.value = '';
            
            // Simulate command execution
            setTimeout(() => {
                simulateCommandOutput(command);
            }, 500);
        }
        
        function simulateCommandOutput(command) {
            const outputs = {
                'npm test': \`
                    <strong>System:</strong> Running tests...<br>
                    ✅ All tests passed (15/15)<br>
                    📊 Coverage: 95.2%<br>
                    ⏱️ Time: 2.3s
                \`,
                'npm run build': \`
                    <strong>System:</strong> Building project...<br>
                    🏗️ TypeScript compilation successful<br>
                    📦 Bundle created: dist/index.js<br>
                    ✅ Build completed successfully
                \`,
                'git status': \`
                    <strong>System:</strong> Git status:<br>
                    On branch main<br>
                    Your branch is up to date with 'origin/main'.<br>
                    <br>
                    Changes not staged for commit:<br>
                    &nbsp;&nbsp;modified: src/web/quantum-demo-server.ts<br>
                    <br>
                    no changes added to commit
                \`,
                'ls -la': \`
                    <strong>System:</strong> Directory listing:<br>
                    drwxr-xr-x  12 user  staff   384 Jan 19 21:30 .<br>
                    drwxr-xr-x   8 user  staff   256 Jan 19 20:15 ..<br>
                    -rw-r--r--   1 user  staff  1234 Jan 19 21:25 package.json<br>
                    drwxr-xr-x   5 user  staff   160 Jan 19 21:30 src<br>
                    drwxr-xr-x   3 user  staff    96 Jan 19 20:30 dist
                \`,
                'pwd': \`
                    <strong>System:</strong> /Users/user/sherlock-omega-ide
                \`,
                'node --version': \`
                    <strong>System:</strong> v18.17.0
                \`
            };
            
            const output = outputs[command] || \`
                <strong>System:</strong> Command not recognized or not allowed in simulation mode.<br>
                Available commands: npm test, npm run build, git status, ls -la, pwd, node --version
            \`;
            
            addMessage('system', output);
        }
        
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeCommand();
            }
        });
    </script>
</body>
</html>
  `);
});

// Bot Manager endpoint
app.get('/bot-manager', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω - Bot Manager</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
        }
        .nav {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        .nav-buttons {
            display: flex;
            gap: 1rem;
        }
        .nav-button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-button.active {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
        }
        .nav-button:not(.active) {
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
        }
        .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        .bot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .bot-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid #333;
            transition: all 0.3s ease;
        }
        .bot-card:hover {
            border-color: #00d4ff;
            box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
        }
        .bot-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #00d4ff;
            margin-bottom: 0.5rem;
        }
        .bot-description {
            color: #aaa;
            margin-bottom: 1rem;
            line-height: 1.4;
        }
        .bot-stats {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-weight: bold;
            color: #00ff88;
        }
        .create-bot {
            background: rgba(0, 212, 255, 0.1);
            border: 2px dashed #00d4ff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .create-bot:hover {
            background: rgba(0, 212, 255, 0.2);
        }
        .create-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="nav">
        <div class="logo">🚀 Sherlock Ω IDE</div>
        <div class="nav-buttons">
            <a href="/" class="nav-button">⚛️ Quantum Visualizer</a>
            <a href="/devops-chat" class="nav-button">🛠️ DevOps Chat</a>
            <button class="nav-button active">🤖 Bot Manager</button>
        </div>
    </div>

    <div class="container">
        <h1>🤖 AI Bot Manager</h1>
        <p>Manage your autonomous development bots</p>
        
        <div class="bot-grid">
            <div class="bot-card create-bot" onclick="createBot()">
                <div class="create-icon">➕</div>
                <div>Create New Bot</div>
            </div>
            
            <div class="bot-card">
                <div class="bot-name">🔧 Code Generator</div>
                <div class="bot-description">Generates TypeScript code with best practices and comprehensive error handling</div>
                <div class="bot-stats">
                    <div class="stat">
                        <div class="stat-value">98.5%</div>
                        <div>Success Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1,247</div>
                        <div>Tasks</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">Active</div>
                        <div>Status</div>
                    </div>
                </div>
            </div>
            
            <div class="bot-card">
                <div class="bot-name">🧪 Test Assistant</div>
                <div class="bot-description">Automatically generates comprehensive test suites with 95%+ coverage</div>
                <div class="bot-stats">
                    <div class="stat">
                        <div class="stat-value">96.2%</div>
                        <div>Success Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">892</div>
                        <div>Tasks</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">Active</div>
                        <div>Status</div>
                    </div>
                </div>
            </div>
            
            <div class="bot-card">
                <div class="bot-name">📚 Documentation Bot</div>
                <div class="bot-description">Creates detailed documentation and API references automatically</div>
                <div class="bot-stats">
                    <div class="stat">
                        <div class="stat-value">94.8%</div>
                        <div>Success Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">634</div>
                        <div>Tasks</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">Active</div>
                        <div>Status</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function createBot() {
            const description = prompt('Describe your bot:');
            if (description) {
                alert('Bot creation started! Check back in a few minutes.');
            }
        }
    </script>
</body>
</html>
  `);
});

console.log(`🚀 Sherlock Ω Quantum Demo Server starting on http://localhost:${PORT}`);
console.log('⚛️ Quantum Visualizer: http://localhost:3000/');
console.log('🛠️ DevOps Chat: http://localhost:3000/devops-chat');
console.log('🤖 Bot Manager: http://localhost:3000/bot-manager');

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});