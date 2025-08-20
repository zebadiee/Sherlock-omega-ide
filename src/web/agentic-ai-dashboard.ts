/**
 * Agentic AI Dashboard
 * Real-time visualization of LLM-driven multi-agent quantum development
 * Showcases AI collaboration, reasoning, and system intelligence
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { AgenticAIEvolutionManager } from '../ai/agentic-ai-poc';
import { QuantumBotBuilder } from '../ai/quantum/quantum-bot-builder';
import { AIBotManager } from '../ai/ai-bot-manager';

export class AgenticAIDashboard {
  private app: express.Application;
  private server: any;
  private io: Server;
  private agenticManager: AgenticAIEvolutionManager;
  private logger: Logger;
  private port: number;

  constructor(port: number = 3002) {
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

    // Initialize agentic manager
    const performanceMonitor = new PerformanceMonitor(this.logger);
    const quantumBuilder = new QuantumBotBuilder(this.logger, performanceMonitor);
    const botManager = new AIBotManager(this.logger, performanceMonitor);
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sherlock_agentic_dashboard';

    this.agenticManager = new AgenticAIEvolutionManager(
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
      res.send(this.generateAgenticDashboardHTML());
    });

    // API routes
    this.app.get('/api/agentic-metrics', async (req, res) => {
      try {
        const metrics = this.agenticManager.getAgenticMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Natural language processing endpoint
    this.app.post('/api/process-query', async (req, res) => {
      try {
        const { query } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        const result = await this.agenticManager.processNaturalLanguageQuery(query);
        
        // Emit real-time update
        this.io.emit('query-processed', { query, result });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Enhanced simulation endpoint
    this.app.post('/api/enhanced-simulate', async (req, res) => {
      try {
        const { description, options = {} } = req.body;
        
        const result = await this.agenticManager.simulateWithLLMEnhancement(description, options);
        
        // Emit real-time update
        this.io.emit('simulation-completed', { description, result });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Agent performance endpoint
    this.app.get('/api/agent-performance', async (req, res) => {
      try {
        const metrics = this.agenticManager.getAgenticMetrics();
        res.json({
          agentPerformance: metrics.agenticAI.agentPerformance,
          systemIntelligence: metrics.systemIntelligence,
          userExperience: metrics.userExperience
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Agentic dashboard client connected: ${socket.id}`);

      // Send initial data
      socket.emit('system-status', { 
        status: 'connected', 
        timestamp: new Date().toISOString(),
        agenticAI: true
      });

      // Handle client requests
      socket.on('request-agentic-metrics', async () => {
        try {
          const metrics = this.agenticManager.getAgenticMetrics();
          socket.emit('agentic-metrics-update', metrics);
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('process-natural-language', async (data) => {
        try {
          const result = await this.agenticManager.processNaturalLanguageQuery(data.query);
          socket.emit('query-result', { query: data.query, result });
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('disconnect', () => {
        this.logger.info(`Agentic dashboard client disconnected: ${socket.id}`);
      });
    });

    // Periodic updates
    setInterval(async () => {
      try {
        const metrics = this.agenticManager.getAgenticMetrics();
        
        this.io.emit('periodic-update', { 
          metrics, 
          timestamp: new Date().toISOString(),
          agenticAI: true
        });
      } catch (error) {
        this.logger.error('Failed to send periodic update:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  private generateAgenticDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω Agentic AI Dashboard</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
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
        
        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 300;
        }
        
        .ai-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0, 255, 0, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            border: 1px solid rgba(0, 255, 0, 0.3);
        }
        
        .ai-pulse {
            width: 12px;
            height: 12px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            padding: 2rem;
            max-width: 1600px;
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
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .agent-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        
        .agent-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .agent-status {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }
        
        .status-active {
            background: rgba(0, 255, 0, 0.2);
            color: #00ff00;
        }
        
        .status-idle {
            background: rgba(255, 255, 0, 0.2);
            color: #ffff00;
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
        
        .intelligence-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            margin: 0.5rem 0;
        }
        
        .intelligence-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff);
            border-radius: 10px;
            transition: width 0.5s ease;
        }
        
        .query-input {
            width: 100%;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        
        .query-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        
        .btn {
            background: #2196f3;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-size: 1rem;
        }
        
        .btn:hover {
            background: #1976d2;
        }
        
        .btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .reasoning-log {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            padding: 1rem;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        
        .reasoning-entry {
            margin: 0.5rem 0;
            padding: 0.5rem;
            border-left: 3px solid #64b5f6;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .collaboration-flow {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1rem 0;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .flow-arrow {
            color: #64b5f6;
            font-size: 1.5rem;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 1rem;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Sherlock Ω Agentic AI Dashboard</h1>
        <div class="ai-indicator">
            <div class="ai-pulse"></div>
            <span>AI Agents Active</span>
        </div>
    </div>
    
    <div class="dashboard">
        <!-- Natural Language Interface -->
        <div class="card full-width">
            <h3>🗣️ Natural Language Interface</h3>
            <input type="text" class="query-input" id="nlp-input" placeholder="Ask the AI agents to perform quantum development tasks...">
            <button class="btn" id="process-query-btn">Process with AI Agents</button>
            
            <div id="query-result" style="margin-top: 1rem;"></div>
        </div>
        
        <!-- Agent Collaboration -->
        <div class="card">
            <h3>🤝 Agent Collaboration</h3>
            <div class="agent-grid" id="agent-grid">
                <div class="agent-card">
                    <div class="agent-icon">🎯</div>
                    <div>Planning Agent</div>
                    <div class="agent-status status-idle">Idle</div>
                </div>
                <div class="agent-card">
                    <div class="agent-icon">🏗️</div>
                    <div>Builder Agent</div>
                    <div class="agent-status status-idle">Idle</div>
                </div>
                <div class="agent-card">
                    <div class="agent-icon">⚛️</div>
                    <div>Quantum Validator</div>
                    <div class="agent-status status-idle">Idle</div>
                </div>
                <div class="agent-card">
                    <div class="agent-icon">🧠</div>
                    <div>Feedback Analyzer</div>
                    <div class="agent-status status-idle">Idle</div>
                </div>
            </div>
            
            <div id="collaboration-flow" style="margin-top: 1rem;"></div>
        </div>
        
        <!-- System Intelligence -->
        <div class="card">
            <h3>🧠 System Intelligence</h3>
            <div class="metric">
                <span>Adaptability Score</span>
                <span class="metric-value" id="adaptability-score">8.5/10</span>
            </div>
            <div class="intelligence-bar">
                <div class="intelligence-fill" id="adaptability-bar" style="width: 85%;"></div>
            </div>
            
            <div class="metric">
                <span>Learning Effectiveness</span>
                <span class="metric-value" id="learning-score">9.2/10</span>
            </div>
            <div class="intelligence-bar">
                <div class="intelligence-fill" id="learning-bar" style="width: 92%;"></div>
            </div>
            
            <div class="metric">
                <span>Autonomy Level</span>
                <span class="metric-value" id="autonomy-score">8.8/10</span>
            </div>
            <div class="intelligence-bar">
                <div class="intelligence-fill" id="autonomy-bar" style="width: 88%;"></div>
            </div>
        </div>
        
        <!-- LLM Reasoning -->
        <div class="card full-width">
            <h3>🧠 LLM Reasoning & Analysis</h3>
            <div class="reasoning-log" id="reasoning-log">
                <div class="reasoning-entry">
                    <strong>System:</strong> Agentic AI dashboard initialized. Ready to process natural language queries.
                </div>
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="card">
            <h3>📊 AI Performance Metrics</h3>
            <div class="metric">
                <span>Total Queries Processed</span>
                <span class="metric-value" id="total-queries">0</span>
            </div>
            <div class="metric">
                <span>Success Rate</span>
                <span class="metric-value" id="success-rate">100%</span>
            </div>
            <div class="metric">
                <span>Average Agent Collaboration</span>
                <span class="metric-value" id="avg-collaboration">4.2 agents</span>
            </div>
            <div class="metric">
                <span>User Satisfaction</span>
                <span class="metric-value" id="user-satisfaction">9.1/10</span>
            </div>
        </div>
        
        <!-- Real-time Charts -->
        <div class="card">
            <h3>📈 Intelligence Trends</h3>
            <div class="chart-container">
                <canvas id="intelligence-chart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Socket.IO connection
        const socket = io();
        
        // Chart setup
        const ctx = document.getElementById('intelligence-chart').getContext('2d');
        const intelligenceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Adaptability',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Learning',
                    data: [],
                    borderColor: '#feca57',
                    backgroundColor: 'rgba(254, 202, 87, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Autonomy',
                    data: [],
                    borderColor: '#48dbfb',
                    backgroundColor: 'rgba(72, 219, 251, 0.1)',
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
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        min: 0,
                        max: 10
                    }
                }
            }
        });
        
        // Utility functions
        function addReasoningEntry(message, type = 'info') {
            const log = document.getElementById('reasoning-log');
            const entry = document.createElement('div');
            entry.className = 'reasoning-entry';
            entry.innerHTML = \`<strong>[\${new Date().toLocaleTimeString()}]</strong> \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        function updateAgentStatus(agentName, status) {
            const agents = document.querySelectorAll('.agent-card');
            agents.forEach(agent => {
                const name = agent.querySelector('div:nth-child(2)').textContent;
                if (name.includes(agentName)) {
                    const statusEl = agent.querySelector('.agent-status');
                    statusEl.textContent = status;
                    statusEl.className = \`agent-status status-\${status.toLowerCase()}\`;
                }
            });
        }
        
        function showCollaborationFlow(agents) {
            const flowContainer = document.getElementById('collaboration-flow');
            flowContainer.innerHTML = '';
            
            agents.forEach((agent, index) => {
                const agentEl = document.createElement('div');
                agentEl.textContent = agent.agent;
                agentEl.style.padding = '0.5rem';
                agentEl.style.background = 'rgba(100, 181, 246, 0.2)';
                agentEl.style.borderRadius = '4px';
                agentEl.style.fontSize = '0.9rem';
                
                flowContainer.appendChild(agentEl);
                
                if (index < agents.length - 1) {
                    const arrow = document.createElement('div');
                    arrow.className = 'flow-arrow';
                    arrow.textContent = '→';
                    flowContainer.appendChild(arrow);
                }
            });
        }
        
        function updateIntelligenceMetrics(metrics) {
            if (metrics.systemIntelligence) {
                const adaptability = metrics.systemIntelligence.adaptabilityScore;
                const learning = metrics.systemIntelligence.learningEffectiveness;
                const autonomy = metrics.systemIntelligence.autonomyLevel;
                
                document.getElementById('adaptability-score').textContent = \`\${adaptability.toFixed(1)}/10\`;
                document.getElementById('learning-score').textContent = \`\${learning.toFixed(1)}/10\`;
                document.getElementById('autonomy-score').textContent = \`\${autonomy.toFixed(1)}/10\`;
                
                document.getElementById('adaptability-bar').style.width = \`\${adaptability * 10}%\`;
                document.getElementById('learning-bar').style.width = \`\${learning * 10}%\`;
                document.getElementById('autonomy-bar').style.width = \`\${autonomy * 10}%\`;
                
                // Update chart
                const now = new Date().toLocaleTimeString();
                intelligenceChart.data.labels.push(now);
                intelligenceChart.data.datasets[0].data.push(adaptability);
                intelligenceChart.data.datasets[1].data.push(learning);
                intelligenceChart.data.datasets[2].data.push(autonomy);
                
                // Keep only last 10 data points
                if (intelligenceChart.data.labels.length > 10) {
                    intelligenceChart.data.labels.shift();
                    intelligenceChart.data.datasets.forEach(dataset => dataset.data.shift());
                }
                
                intelligenceChart.update();
            }
        }
        
        function updatePerformanceMetrics(metrics) {
            if (metrics.agenticAI) {
                document.getElementById('total-queries').textContent = metrics.agenticAI.totalQueries;
                
                const successRate = metrics.agenticAI.totalQueries > 0 
                    ? (metrics.agenticAI.successfulProcessing / metrics.agenticAI.totalQueries * 100).toFixed(1)
                    : 100;
                document.getElementById('success-rate').textContent = \`\${successRate}%\`;
                
                document.getElementById('avg-collaboration').textContent = \`\${metrics.agenticAI.averageAgentCollaboration.toFixed(1)} agents\`;
            }
            
            if (metrics.userExperience) {
                document.getElementById('user-satisfaction').textContent = \`\${metrics.userExperience.averageSatisfaction}/10\`;
            }
        }
        
        // Socket event handlers
        socket.on('connect', () => {
            addReasoningEntry('Connected to Agentic AI dashboard server', 'success');
            socket.emit('request-agentic-metrics');
        });
        
        socket.on('periodic-update', (data) => {
            updateIntelligenceMetrics(data.metrics);
            updatePerformanceMetrics(data.metrics);
        });
        
        socket.on('query-processed', (data) => {
            addReasoningEntry(\`Query processed: "\${data.query}"\`, 'success');
            
            if (data.result.agentCollaboration) {
                showCollaborationFlow(data.result.agentCollaboration);
                
                // Update agent statuses
                data.result.agentCollaboration.forEach(collab => {
                    updateAgentStatus(collab.agent, 'Active');
                });
                
                // Reset to idle after 3 seconds
                setTimeout(() => {
                    data.result.agentCollaboration.forEach(collab => {
                        updateAgentStatus(collab.agent, 'Idle');
                    });
                }, 3000);
            }
            
            if (data.result.llmReasoning) {
                data.result.llmReasoning.forEach(reasoning => {
                    addReasoningEntry(reasoning, 'reasoning');
                });
            }
            
            // Display result
            const resultEl = document.getElementById('query-result');
            resultEl.innerHTML = \`
                <div style="background: rgba(0, 255, 0, 0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <strong>✅ Query Processed Successfully</strong><br>
                    Agents Involved: \${data.result.agentCollaboration?.length || 0}<br>
                    \${data.result.deploymentReady ? '🚀 Ready for deployment' : '⚠️ Requires additional work'}
                </div>
            \`;
        });
        
        socket.on('agentic-metrics-update', (metrics) => {
            updateIntelligenceMetrics(metrics);
            updatePerformanceMetrics(metrics);
        });
        
        // Button event handlers
        document.getElementById('process-query-btn').addEventListener('click', async () => {
            const query = document.getElementById('nlp-input').value.trim();
            
            if (!query) {
                alert('Please enter a query');
                return;
            }
            
            const btn = document.getElementById('process-query-btn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> Processing...';
            
            addReasoningEntry(\`Processing query: "\${query}"\`);
            
            try {
                const response = await fetch('/api/process-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const result = await response.json();
                
                if (result.errors && result.errors.length > 0) {
                    addReasoningEntry(\`Errors: \${result.errors.join(', ')}\`, 'error');
                }
                
            } catch (error) {
                addReasoningEntry(\`Error: \${error.message}\`, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Process with AI Agents';
                document.getElementById('nlp-input').value = '';
            }
        });
        
        // Allow Enter key to submit query
        document.getElementById('nlp-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('process-query-btn').click();
            }
        });
        
        // Initialize dashboard
        addReasoningEntry('Agentic AI Dashboard initialized with LLM-driven agents');
        addReasoningEntry('Ready to process natural language queries and demonstrate AI collaboration');
    </script>
</body>
</html>
    `;
  }

  start(): void {
    this.server.listen(this.port, () => {
      this.logger.info(`Agentic AI Dashboard running at http://localhost:${this.port}`);
      console.log(`🤖 Agentic AI Dashboard: http://localhost:${this.port}`);
    });
  }

  async stop(): Promise<void> {
    await this.agenticManager.cleanup();
    this.server.close();
  }
}

// Export for use in other modules
export function createAgenticAIDashboard(port?: number): AgenticAIDashboard {
  return new AgenticAIDashboard(port);
}

// If run directly
if (require.main === module) {
  const dashboard = createAgenticAIDashboard();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🤖 Shutting down Agentic AI dashboard...');
    await dashboard.stop();
    process.exit(0);
  });
  
  dashboard.start();
}