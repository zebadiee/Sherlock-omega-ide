/**
 * Quantum Evolution Dashboard
 * Web-based monitoring interface for the quantum evolution system
 * Provides real-time metrics, health monitoring, and evolution tracking
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PolishedEvolutionManager } from '../evolution/polished-evolution-manager';
import { QuantumBotBuilder } from '../ai/quantum/quantum-bot-builder';
import { AIBotManager } from '../ai/ai-bot-manager';

export class QuantumDashboard {
  private app: express.Application;
  private server: any;
  private io: Server;
  private evolutionManager: PolishedEvolutionManager;
  private logger: Logger;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.logger = new Logger();
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Initialize evolution manager
    const performanceMonitor = new PerformanceMonitor(this.logger);
    const quantumBuilder = new QuantumBotBuilder(this.logger, performanceMonitor);
    const botManager = new AIBotManager(this.logger, performanceMonitor);
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sherlock_dashboard';

    this.evolutionManager = new PolishedEvolutionManager(
      this.logger,
      performanceMonitor,
      quantumBuilder,
      botManager,
      mongoUri
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  private setupRoutes(): void {
    // Main dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API routes
    this.app.get('/api/health', async (req, res) => {
      try {
        const health = await this.getSystemHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = this.evolutionManager.getEnhancedEvolutionStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/evolution-history', async (req, res) => {
      try {
        const history = this.evolutionManager.getEvolutionHistory();
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Simulation endpoint
    this.app.post('/api/simulate', async (req, res) => {
      try {
        const { algorithm, qubits = 3, noise = false } = req.body;
        
        const algorithmMap: Record<string, string> = {
          'bell': 'Create a Bell state with quantum entanglement',
          'ghz': 'Generate a GHZ state with maximum entanglement',
          'grover': 'Implement Grover\'s quantum search algorithm',
          'deutsch-jozsa': 'Implement Deutsch-Jozsa algorithm for function evaluation',
          'teleportation': 'Quantum teleportation protocol implementation',
          'superdense': 'Superdense coding for classical bit transmission'
        };

        const description = algorithmMap[algorithm];
        if (!description) {
          return res.status(400).json({ error: 'Unknown algorithm' });
        }

        const result = await this.evolutionManager.simulateWithErrorHandling(description, {
          qubits,
          noise,
          verbose: false
        });

        // Emit real-time update
        this.io.emit('simulation-completed', { algorithm, result });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Evolution endpoint
    this.app.post('/api/evolve', async (req, res) => {
      try {
        const { description, priority = 'medium', complexity = 5 } = req.body;
        
        const task = {
          id: `dashboard-${Date.now()}`,
          description,
          priority,
          category: 'quantum' as const,
          estimatedComplexity: complexity,
          requiredCapabilities: ['quantum-computing', 'algorithm-design']
        };

        // Start evolution asynchronously
        this.evolutionManager.evolveWithEnhancedHandling(task)
          .then(result => {
            this.io.emit('evolution-completed', { task, result });
          })
          .catch(error => {
            this.io.emit('evolution-failed', { task, error: error.message });
          });

        res.json({ message: 'Evolution started', taskId: task.id });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Dashboard client connected: ${socket.id}`);

      // Send initial data
      socket.emit('system-status', { status: 'connected', timestamp: new Date().toISOString() });

      // Handle client requests
      socket.on('request-stats', async () => {
        try {
          const stats = this.evolutionManager.getEnhancedEvolutionStats();
          socket.emit('stats-update', stats);
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('request-health', async () => {
        try {
          const health = await this.getSystemHealth();
          socket.emit('health-update', health);
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('disconnect', () => {
        this.logger.info(`Dashboard client disconnected: ${socket.id}`);
      });
    });

    // Periodic updates
    setInterval(async () => {
      try {
        const stats = this.evolutionManager.getEnhancedEvolutionStats();
        const health = await this.getSystemHealth();
        
        this.io.emit('periodic-update', { stats, health, timestamp: new Date().toISOString() });
      } catch (error) {
        this.logger.error('Failed to send periodic update:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  private async getSystemHealth(): Promise<any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      quantum: {
        simulatorStatus: 'active',
        workerThreads: 4,
        averageSimulationTime: 150
      }
    };
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω Quantum Dashboard</title>
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
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .header .subtitle {
            opacity: 0.8;
            margin-top: 0.5rem;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.2s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
        }
        
        .card h3 {
            margin-bottom: 1rem;
            color: #64b5f6;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5rem 0;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-value {
            font-weight: bold;
            color: #81c784;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-healthy { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }
        
        .controls {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .btn {
            background: #2196f3;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .btn:hover {
            background: #1976d2;
        }
        
        .btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .log {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            padding: 1rem;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .log-entry {
            margin: 0.25rem 0;
            opacity: 0.9;
        }
        
        .log-success { color: #4caf50; }
        .log-warning { color: #ff9800; }
        .log-error { color: #f44336; }
        
        .chart-container {
            position: relative;
            height: 200px;
            margin-top: 1rem;
        }
        
        input, select {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            margin: 0.25rem;
        }
        
        input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔬 Sherlock Ω Quantum Dashboard</h1>
        <div class="subtitle">Real-time monitoring of quantum evolution system</div>
    </div>
    
    <div class="dashboard">
        <!-- System Health Card -->
        <div class="card">
            <h3>🏥 System Health</h3>
            <div id="health-metrics">
                <div class="metric">
                    <span><span class="status-indicator status-healthy"></span>System Status</span>
                    <span class="metric-value" id="system-status">Initializing...</span>
                </div>
                <div class="metric">
                    <span>Uptime</span>
                    <span class="metric-value" id="uptime">--</span>
                </div>
                <div class="metric">
                    <span>Memory Usage</span>
                    <span class="metric-value" id="memory-usage">--</span>
                </div>
                <div class="metric">
                    <span>Quantum Simulator</span>
                    <span class="metric-value" id="quantum-status">--</span>
                </div>
            </div>
        </div>
        
        <!-- Evolution Statistics Card -->
        <div class="card">
            <h3>📊 Evolution Statistics</h3>
            <div id="evolution-stats">
                <div class="metric">
                    <span>Total Evolutions</span>
                    <span class="metric-value" id="total-evolutions">0</span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value" id="success-rate">0%</span>
                </div>
                <div class="metric">
                    <span>Avg Quantum Advantage</span>
                    <span class="metric-value" id="quantum-advantage">1.0x</span>
                </div>
                <div class="metric">
                    <span>Avg Execution Time</span>
                    <span class="metric-value" id="execution-time">--</span>
                </div>
            </div>
        </div>
        
        <!-- Quantum Simulation Card -->
        <div class="card">
            <h3>⚛️ Quantum Simulation</h3>
            <div class="controls">
                <select id="algorithm-select">
                    <option value="bell">Bell State</option>
                    <option value="ghz">GHZ State</option>
                    <option value="grover">Grover Search</option>
                    <option value="deutsch-jozsa">Deutsch-Jozsa</option>
                    <option value="teleportation">Teleportation</option>
                    <option value="superdense">Superdense Coding</option>
                </select>
                <input type="number" id="qubits-input" value="3" min="1" max="10" placeholder="Qubits">
                <label><input type="checkbox" id="noise-checkbox"> Noise</label>
                <button class="btn" id="simulate-btn">Simulate</button>
            </div>
            <div id="simulation-results" style="margin-top: 1rem;">
                <div class="metric">
                    <span>Last Simulation</span>
                    <span class="metric-value" id="last-algorithm">None</span>
                </div>
                <div class="metric">
                    <span>Fidelity</span>
                    <span class="metric-value" id="fidelity">--</span>
                </div>
                <div class="metric">
                    <span>Quantum Advantage</span>
                    <span class="metric-value" id="sim-advantage">--</span>
                </div>
            </div>
        </div>
        
        <!-- Evolution Control Card -->
        <div class="card">
            <h3>🧬 Evolution Control</h3>
            <div class="controls">
                <input type="text" id="evolution-description" placeholder="Describe quantum algorithm to evolve..." style="width: 100%; margin-bottom: 0.5rem;">
                <select id="priority-select">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                </select>
                <input type="number" id="complexity-input" value="5" min="1" max="10" placeholder="Complexity">
                <button class="btn" id="evolve-btn">Start Evolution</button>
            </div>
            <div id="evolution-status" style="margin-top: 1rem;">
                <div class="metric">
                    <span>Status</span>
                    <span class="metric-value" id="evolution-current-status">Idle</span>
                </div>
            </div>
        </div>
        
        <!-- Activity Log Card -->
        <div class="card" style="grid-column: 1 / -1;">
            <h3>📝 Activity Log</h3>
            <div class="log" id="activity-log">
                <div class="log-entry">Dashboard initialized...</div>
            </div>
        </div>
        
        <!-- Performance Chart Card -->
        <div class="card" style="grid-column: 1 / -1;">
            <h3>📈 Performance Metrics</h3>
            <div class="chart-container">
                <canvas id="performance-chart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Socket.IO connection
        const socket = io();
        
        // Chart setup
        const ctx = document.getElementById('performance-chart').getContext('2d');
        const performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Quantum Advantage',
                    data: [],
                    borderColor: '#64b5f6',
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Fidelity (%)',
                    data: [],
                    borderColor: '#81c784',
                    backgroundColor: 'rgba(129, 199, 132, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: { 
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
        
        // Utility functions
        function addLogEntry(message, type = 'info') {
            const log = document.getElementById('activity-log');
            const entry = document.createElement('div');
            entry.className = \`log-entry log-\${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return \`\${hours}h \${minutes}m\`;
        }
        
        function formatBytes(bytes) {
            return \`\${(bytes / 1024 / 1024).toFixed(1)} MB\`;
        }
        
        // Socket event handlers
        socket.on('connect', () => {
            addLogEntry('Connected to dashboard server', 'success');
            socket.emit('request-stats');
            socket.emit('request-health');
        });
        
        socket.on('periodic-update', (data) => {
            updateHealthMetrics(data.health);
            updateEvolutionStats(data.stats);
        });
        
        socket.on('simulation-completed', (data) => {
            addLogEntry(\`Simulation completed: \${data.algorithm}\`, 'success');
            updateSimulationResults(data.result);
            updateChart(data.result);
        });
        
        socket.on('evolution-completed', (data) => {
            addLogEntry(\`Evolution completed: \${data.task.description}\`, 'success');
            document.getElementById('evolution-current-status').textContent = 'Completed';
        });
        
        socket.on('evolution-failed', (data) => {
            addLogEntry(\`Evolution failed: \${data.error}\`, 'error');
            document.getElementById('evolution-current-status').textContent = 'Failed';
        });
        
        // Update functions
        function updateHealthMetrics(health) {
            document.getElementById('system-status').textContent = health.status.toUpperCase();
            document.getElementById('uptime').textContent = formatUptime(health.uptime);
            document.getElementById('memory-usage').textContent = formatBytes(health.memory.heapUsed);
            document.getElementById('quantum-status').textContent = health.quantum.simulatorStatus.toUpperCase();
        }
        
        function updateEvolutionStats(stats) {
            document.getElementById('total-evolutions').textContent = stats.totalEvolutions;
            document.getElementById('success-rate').textContent = \`\${stats.totalEvolutions > 0 ? (stats.successfulEvolutions/stats.totalEvolutions*100).toFixed(1) : 0}%\`;
            document.getElementById('quantum-advantage').textContent = \`\${stats.averageQuantumAdvantage.toFixed(2)}x\`;
            document.getElementById('execution-time').textContent = \`\${stats.averageExecutionTime.toFixed(0)}ms\`;
        }
        
        function updateSimulationResults(result) {
            if (result.errors) return;
            
            document.getElementById('last-algorithm').textContent = result.algorithm || 'Unknown';
            document.getElementById('fidelity').textContent = \`\${(result.fidelity * 100).toFixed(1)}%\`;
            document.getElementById('sim-advantage').textContent = \`\${result.quantumAdvantage.toFixed(2)}x\`;
        }
        
        function updateChart(result) {
            if (result.errors) return;
            
            const now = new Date().toLocaleTimeString();
            performanceChart.data.labels.push(now);
            performanceChart.data.datasets[0].data.push(result.quantumAdvantage);
            performanceChart.data.datasets[1].data.push(result.fidelity * 100);
            
            // Keep only last 10 data points
            if (performanceChart.data.labels.length > 10) {
                performanceChart.data.labels.shift();
                performanceChart.data.datasets[0].data.shift();
                performanceChart.data.datasets[1].data.shift();
            }
            
            performanceChart.update();
        }
        
        // Button event handlers
        document.getElementById('simulate-btn').addEventListener('click', async () => {
            const algorithm = document.getElementById('algorithm-select').value;
            const qubits = parseInt(document.getElementById('qubits-input').value);
            const noise = document.getElementById('noise-checkbox').checked;
            
            const btn = document.getElementById('simulate-btn');
            btn.disabled = true;
            btn.textContent = 'Simulating...';
            
            addLogEntry(\`Starting simulation: \${algorithm} (\${qubits} qubits, noise: \${noise})\`);
            
            try {
                const response = await fetch('/api/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ algorithm, qubits, noise })
                });
                
                const result = await response.json();
                
                if (result.errors) {
                    addLogEntry(\`Simulation failed: \${result.errors[0]}\`, 'error');
                } else {
                    updateSimulationResults(result);
                    updateChart(result);
                }
            } catch (error) {
                addLogEntry(\`Simulation error: \${error.message}\`, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Simulate';
            }
        });
        
        document.getElementById('evolve-btn').addEventListener('click', async () => {
            const description = document.getElementById('evolution-description').value;
            const priority = document.getElementById('priority-select').value;
            const complexity = parseInt(document.getElementById('complexity-input').value);
            
            if (!description.trim()) {
                addLogEntry('Please enter an evolution description', 'warning');
                return;
            }
            
            const btn = document.getElementById('evolve-btn');
            btn.disabled = true;
            btn.textContent = 'Evolving...';
            
            document.getElementById('evolution-current-status').textContent = 'Running';
            addLogEntry(\`Starting evolution: \${description}\`);
            
            try {
                const response = await fetch('/api/evolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, priority, complexity })
                });
                
                const result = await response.json();
                addLogEntry(\`Evolution queued: \${result.taskId}\`);
            } catch (error) {
                addLogEntry(\`Evolution error: \${error.message}\`, 'error');
                document.getElementById('evolution-current-status').textContent = 'Failed';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Start Evolution';
            }
        });
        
        // Initialize dashboard
        addLogEntry('Quantum Dashboard initialized');
    </script>
</body>
</html>
    `;
  }

  start(): void {
    this.server.listen(this.port, () => {
      this.logger.info(`Quantum Dashboard running at http://localhost:${this.port}`);
      console.log(`🌐 Quantum Dashboard: http://localhost:${this.port}`);
    });
  }

  async stop(): Promise<void> {
    await this.evolutionManager.cleanup();
    this.server.close();
  }
}

// Export for use in other modules
export function createQuantumDashboard(port?: number): QuantumDashboard {
  return new QuantumDashboard(port);
}

// If run directly
if (require.main === module) {
  const dashboard = createQuantumDashboard();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down dashboard...');
    await dashboard.stop();
    process.exit(0);
  });
  
  dashboard.start();
}