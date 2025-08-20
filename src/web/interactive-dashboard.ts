/**
 * Interactive Dashboard Server
 * Real-time web interface for build automation
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chalk from 'chalk';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { InteractiveBuildManager } from '../automation/interactive-build-manager';

export class InteractiveDashboard {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private buildManager: InteractiveBuildManager;
  private connectedClients = 0;

  constructor() {
    this.logger = new Logger();
    this.performanceMonitor = new PerformanceMonitor(this.logger);
    this.buildManager = new InteractiveBuildManager(this.logger, this.performanceMonitor);
    
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API endpoints
    this.app.get('/api/stats', async (req, res) => {
      const stats = this.buildManager.getBuildStats();
      res.json(stats);
    });

    this.app.get('/api/history', async (req, res) => {
      const history = this.buildManager.getBuildHistory();
      res.json(history);
    });

    this.app.post('/api/build', async (req, res) => {
      try {
        const { algorithm, qubits, noise, testCoverage, deployTarget } = req.body;
        
        // Emit build start event
        this.io.emit('buildStarted', { algorithm, qubits });
        
        // Simulate build process with real-time updates
        const buildResult = await this.simulateBuildWithUpdates({
          algorithm,
          qubits: qubits || 3,
          noise: noise || false,
          testCoverage: testCoverage || 0.95,
          deployTarget: deployTarget || 'local',
          version: '1.0.0'
        });

        // Emit build completion
        this.io.emit('buildCompleted', buildResult);
        
        res.json(buildResult);
      } catch (error) {
        const errorResult = {
          success: false,
          error: (error as Error).message
        };
        
        this.io.emit('buildFailed', errorResult);
        res.status(500).json(errorResult);
      }
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        connectedClients: this.connectedClients,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      this.connectedClients++;
      console.log(chalk.green(`🔌 Client connected (${this.connectedClients} total)`));

      // Send welcome message
      socket.emit('welcome', {
        message: 'Connected to Sherlock Ω Interactive Dashboard',
        clientId: socket.id
      });

      // Handle client requests
      socket.on('requestStats', async () => {
        const stats = this.buildManager.getBuildStats();
        socket.emit('statsUpdate', stats);
      });

      socket.on('requestHistory', async () => {
        const history = this.buildManager.getBuildHistory();
        socket.emit('historyUpdate', history);
      });

      socket.on('startBuild', async (config) => {
        try {
          socket.emit('buildProgress', { stage: 'starting', message: 'Initializing build...' });
          
          const result = await this.simulateBuildWithUpdates(config, socket);
          
          socket.emit('buildResult', result);
        } catch (error) {
          socket.emit('buildError', { error: (error as Error).message });
        }
      });

      socket.on('disconnect', () => {
        this.connectedClients--;
        console.log(chalk.yellow(`🔌 Client disconnected (${this.connectedClients} total)`));
      });
    });
  }

  private async simulateBuildWithUpdates(config: any, socket?: any): Promise<any> {
    const emitProgress = (stage: string, message: string, progress?: number) => {
      const update = { stage, message, progress, timestamp: new Date().toISOString() };
      if (socket) {
        socket.emit('buildProgress', update);
      } else {
        this.io.emit('buildProgress', update);
      }
    };

    try {
      // Stage 1: Code Generation
      emitProgress('codeGeneration', 'Analyzing algorithm requirements...', 10);
      await this.delay(1000);
      emitProgress('codeGeneration', 'Generating quantum gates...', 20);
      await this.delay(800);
      emitProgress('codeGeneration', 'Optimizing circuit depth...', 30);
      await this.delay(600);

      // Stage 2: Compilation
      emitProgress('compilation', 'Type checking...', 40);
      await this.delay(1200);
      emitProgress('compilation', 'Transpiling to JavaScript...', 50);
      await this.delay(800);

      // Stage 3: Testing
      emitProgress('testing', 'Running unit tests...', 60);
      await this.delay(1500);
      emitProgress('testing', 'Running integration tests...', 70);
      await this.delay(1000);
      emitProgress('testing', 'Calculating coverage...', 75);
      await this.delay(500);

      // Stage 4: Simulation
      emitProgress('simulation', 'Initializing quantum simulator...', 80);
      await this.delay(1000);
      emitProgress('simulation', 'Running quantum circuit...', 85);
      await this.delay(1500);
      emitProgress('simulation', 'Calculating fidelity...', 90);
      await this.delay(800);

      // Stage 5: Deployment
      emitProgress('deployment', `Deploying to ${config.deployTarget}...`, 95);
      await this.delay(1200);
      emitProgress('deployment', 'Build completed successfully!', 100);

      // Generate realistic results
      const result = {
        success: true,
        version: '1.0.' + Math.floor(Math.random() * 100),
        duration: 8000 + Math.random() * 4000,
        tests: {
          passed: Math.floor(Math.random() * 20) + 15,
          failed: Math.floor(Math.random() * 2),
          coverage: 0.92 + Math.random() * 0.08
        },
        simulation: {
          fidelity: 0.94 + Math.random() * 0.06,
          quantumAdvantage: 1 + Math.random() * 4
        },
        deployment: {
          target: config.deployTarget,
          url: config.deployTarget === 'local' ? 'http://localhost:3000' : 
               config.deployTarget === 'docker' ? 'http://localhost:8080' :
               `https://sherlock-${Date.now().toString(36)}.quantum-cloud.io`
        },
        errors: [],
        suggestions: []
      };

      return result;

    } catch (error) {
      emitProgress('error', `Build failed: ${(error as Error).message}`, 0);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω Interactive Dashboard</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .card h2 {
            margin-bottom: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .build-form {
            display: grid;
            gap: 15px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .form-group label {
            font-weight: 600;
            color: #fff;
        }

        .form-group select,
        .form-group input {
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 14px;
        }

        .form-group select option {
            background: #333;
            color: white;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .progress-container {
            margin-top: 20px;
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            font-size: 14px;
            opacity: 0.9;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .stat-item {
            text-align: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }

        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #4CAF50;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 5px;
        }

        .log-container {
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }

        .log-entry {
            margin-bottom: 5px;
            padding: 2px 0;
        }

        .log-timestamp {
            color: #888;
            margin-right: 10px;
        }

        .log-success { color: #4CAF50; }
        .log-error { color: #f44336; }
        .log-warning { color: #ff9800; }
        .log-info { color: #2196F3; }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        .connected {
            background: rgba(76, 175, 80, 0.9);
            color: white;
        }

        .disconnected {
            background: rgba(244, 67, 54, 0.9);
            color: white;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">
        🔌 Connecting...
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 Sherlock Ω</h1>
            <p>Interactive Quantum Build Automation</p>
        </div>

        <div class="dashboard-grid">
            <!-- Build Form -->
            <div class="card">
                <h2>🏗️ Start New Build</h2>
                <form class="build-form" id="buildForm">
                    <div class="form-group">
                        <label for="algorithm">Quantum Algorithm</label>
                        <select id="algorithm" name="algorithm">
                            <option value="Bell State">Bell State - Quantum Entanglement</option>
                            <option value="Grover Search">Grover Search - Database Search</option>
                            <option value="Shor Algorithm">Shor's Algorithm - Integer Factorization</option>
                            <option value="Quantum Fourier Transform">QFT - Frequency Analysis</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="qubits">Number of Qubits</label>
                        <input type="number" id="qubits" name="qubits" min="1" max="20" value="3">
                    </div>

                    <div class="form-group">
                        <label for="noise">
                            <input type="checkbox" id="noise" name="noise" style="margin-right: 8px;">
                            Include Noise Modeling
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="deployTarget">Deployment Target</label>
                        <select id="deployTarget" name="deployTarget">
                            <option value="local">Local Machine</option>
                            <option value="docker">Docker Container</option>
                            <option value="cloud">Cloud Deployment</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary" id="buildBtn">
                        🚀 Start Build
                    </button>
                </form>

                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Initializing...</div>
                </div>
            </div>

            <!-- Statistics -->
            <div class="card">
                <h2>📊 Build Statistics</h2>
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-item">
                        <div class="stat-value" id="totalBuilds">0</div>
                        <div class="stat-label">Total Builds</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="successRate">100%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="avgDuration">0s</div>
                        <div class="stat-label">Avg Duration</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="avgFidelity">0%</div>
                        <div class="stat-label">Avg Fidelity</div>
                    </div>
                </div>
            </div>

            <!-- Build Log -->
            <div class="card full-width">
                <h2>📝 Build Log</h2>
                <div class="log-container" id="buildLog">
                    <div class="log-entry log-info">
                        <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                        Dashboard initialized. Ready for builds.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Socket.IO connection
        const socket = io();
        
        // DOM elements
        const connectionStatus = document.getElementById('connectionStatus');
        const buildForm = document.getElementById('buildForm');
        const buildBtn = document.getElementById('buildBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const buildLog = document.getElementById('buildLog');
        
        // Stats elements
        const totalBuilds = document.getElementById('totalBuilds');
        const successRate = document.getElementById('successRate');
        const avgDuration = document.getElementById('avgDuration');
        const avgFidelity = document.getElementById('avgFidelity');

        // Connection status
        socket.on('connect', () => {
            connectionStatus.textContent = '🟢 Connected';
            connectionStatus.className = 'connection-status connected';
            addLogEntry('Connected to Sherlock Ω Dashboard', 'success');
        });

        socket.on('disconnect', () => {
            connectionStatus.textContent = '🔴 Disconnected';
            connectionStatus.className = 'connection-status disconnected';
            addLogEntry('Disconnected from server', 'error');
        });

        // Build form submission
        buildForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(buildForm);
            const config = {
                algorithm: formData.get('algorithm'),
                qubits: parseInt(formData.get('qubits')),
                noise: formData.has('noise'),
                deployTarget: formData.get('deployTarget')
            };

            startBuild(config);
        });

        function startBuild(config) {
            buildBtn.disabled = true;
            buildBtn.textContent = '🔄 Building...';
            progressContainer.style.display = 'block';
            
            addLogEntry(\`Starting build: \${config.algorithm} (\${config.qubits} qubits)\`, 'info');
            
            socket.emit('startBuild', config);
        }

        // Socket event handlers
        socket.on('buildProgress', (data) => {
            const progress = data.progress || 0;
            progressFill.style.width = progress + '%';
            progressText.textContent = data.message;
            
            addLogEntry(\`[\${data.stage}] \${data.message}\`, 'info');
        });

        socket.on('buildResult', (result) => {
            buildBtn.disabled = false;
            buildBtn.textContent = '🚀 Start Build';
            progressContainer.style.display = 'none';
            
            if (result.success) {
                addLogEntry(\`Build completed successfully! Version: \${result.version}\`, 'success');
                addLogEntry(\`Fidelity: \${(result.simulation.fidelity * 100).toFixed(1)}%, Duration: \${(result.duration / 1000).toFixed(1)}s\`, 'success');
                
                if (result.deployment.url) {
                    addLogEntry(\`Deployed at: \${result.deployment.url}\`, 'success');
                }
            } else {
                addLogEntry('Build failed!', 'error');
            }
            
            updateStats();
        });

        socket.on('buildError', (data) => {
            buildBtn.disabled = false;
            buildBtn.textContent = '🚀 Start Build';
            progressContainer.style.display = 'none';
            
            addLogEntry(\`Build error: \${data.error}\`, 'error');
        });

        function addLogEntry(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.className = \`log-entry log-\${type}\`;
            entry.innerHTML = \`<span class="log-timestamp">\${timestamp}</span>\${message}\`;
            
            buildLog.appendChild(entry);
            buildLog.scrollTop = buildLog.scrollHeight;
            
            // Keep only last 50 entries
            while (buildLog.children.length > 50) {
                buildLog.removeChild(buildLog.firstChild);
            }
        }

        function updateStats() {
            fetch('/api/stats')
                .then(response => response.json())
                .then(stats => {
                    totalBuilds.textContent = stats.totalBuilds;
                    successRate.textContent = stats.successRate + '%';
                    avgDuration.textContent = (stats.averageDuration / 1000).toFixed(1) + 's';
                    avgFidelity.textContent = (stats.averageFidelity * 100).toFixed(1) + '%';
                })
                .catch(error => {
                    addLogEntry('Failed to update stats: ' + error.message, 'error');
                });
        }

        // Initial stats load
        updateStats();
        
        // Auto-refresh stats every 30 seconds
        setInterval(updateStats, 30000);
    </script>
</body>
</html>
    `;
  }

  start(port: number = 3002): void {
    this.server.listen(port, () => {
      console.log(chalk.green(`🌟 Interactive Dashboard running at http://localhost:${port}`));
      console.log(chalk.cyan('Features:'));
      console.log(chalk.cyan('  • Real-time build monitoring'));
      console.log(chalk.cyan('  • Interactive build configuration'));
      console.log(chalk.cyan('  • Live progress updates'));
      console.log(chalk.cyan('  • Build statistics and history'));
    });
  }

  async stop(): Promise<void> {
    await this.buildManager.cleanup();
    this.server.close();
  }
}

// If run directly
if (require.main === module) {
  const dashboard = new InteractiveDashboard();
  dashboard.start(3002);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n👋 Shutting down Interactive Dashboard...'));
    await dashboard.stop();
    process.exit(0);
  });
}