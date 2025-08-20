import express from 'express';
import path from 'path';
import { HardenedDevOpsChat } from '../core/hardened-devops-chat';
import { AIBotRegistry } from '../core/ai-bot-registry';
import { DescriptiveBotBuilder } from '../core/descriptive-bot-builder';

const app = express();

// Initialize Hardened DevOps Chat
const devopsChat = new HardenedDevOpsChat({
  executionMode: process.env.DEVOPS_MODE as any || 'simulation', // Can be 'simulation', 'real', or 'hybrid'
  requireConfirmation: process.env.REQUIRE_CONFIRMATION !== 'false',
  allowedUsers: [], // Empty array means all users allowed
  sessionTimeout: 3600000, // 1 hour
  auditLogging: true,
  maxCommandsPerMinute: 10
}, {
  mode: process.env.DEVOPS_MODE as any || 'simulation',
  allowedCommands: [
    'npm test', 'npm run test', 'npm run test:unit', 'npm run test:integration', 'npm run test:coverage',
    'npm run build', 'npm run compile', 'npm run lint', 'npm run format',
    'git status', 'git log --oneline -10', 'git diff --stat',
    'ls -la', 'pwd', 'whoami', 'date', 'node --version', 'npm --version'
  ],
  workingDirectory: process.cwd(),
  timeout: 300000, // 5 minutes
  maxConcurrent: 3,
  safetyChecks: true
});

// Initialize Bot Registry and Builder
const botRegistry = new AIBotRegistry('./data/bot-registry');
const botBuilder = new DescriptiveBotBuilder(botRegistry);

// Initialize registry
botRegistry.initialize().catch(console.error);

// Store sessions (in production, use Redis or database)
const activeSessions = new Map<string, any>();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../ui')));

// Serve the enhanced IDE
app.get('/', (req, res) => {
  const filePath = path.resolve(__dirname, '../ui/enhanced-sherlock-ide.html');
  res.sendFile(filePath);
});

// Serve the DevOps Chat (Original)
app.get('/devops-chat', (req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, '../ui/devops-chat-ui.html'),
    path.resolve(process.cwd(), 'src/ui/devops-chat-ui.html'),
    path.resolve(__dirname, '../../src/ui/devops-chat-ui.html'),
    path.join(__dirname, '../ui/devops-chat-ui.html')
  ];
  
  console.log('Looking for DevOps chat file in paths:', possiblePaths);
  
  let fileServed = false;
  
  for (const filePath of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        console.log('Found DevOps chat file at:', filePath);
        res.sendFile(filePath);
        fileServed = true;
        break;
      }
    } catch (error: any) {
      console.log('Path check failed for:', filePath, error?.message || String(error));
    }
  }
  
  if (!fileServed) {
    console.error('DevOps chat file not found in any of the expected paths');
    res.status(404).json({ 
      error: 'DevOps Chat not found',
      searchedPaths: possiblePaths,
      suggestion: 'Make sure src/ui/devops-chat-ui.html exists'
    });
  }
});

// Serve the Hardened DevOps Chat
app.get('/hardened-chat', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'src/ui/hardened-devops-chat.html');
  res.sendFile(filePath);
});

// Serve the AI Bot Manager
app.get('/bot-manager', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'src/ui/ai-bot-manager-basic.html');
  res.sendFile(filePath);
});

// Simple API endpoints for demo
app.get('/api/system/health', (req, res) => {
  res.json({
    success: true,
    health: {
      status: 'healthy',
      uptime: Date.now(),
      activeComponents: ['plugin-system', 'bot-builder', 'self-compilation'],
      issues: [],
      performance: {
        averageResponseTime: 150,
        successRate: 0.987,
        throughput: 45.2,
        resourceUsage: {
          cpu: 0.3,
          memory: 0.4,
          network: 0.2
        }
      }
    }
  });
});

app.post('/api/bots/create', (req, res) => {
  const { description, taskType, complexity } = req.body;
  
  const bot = {
    id: `bot_${Date.now()}`,
    name: `${taskType} Assistant`,
    description,
    status: 'active',
    capabilities: [taskType],
    createdAt: new Date(),
    usage: {
      totalRequests: 0,
      successRate: 1.0,
      averageResponseTime: 200
    }
  };

  res.json({ success: true, bot });
});

app.get('/api/compilation/statistics', (req, res) => {
  res.json({
    success: true,
    statistics: {
      totalPipelines: 15,
      successfulPipelines: 14,
      failedPipelines: 1,
      averageDuration: 12500,
      successRate: 0.933,
      mostCommonFailures: [
        { step: 'test-coverage', count: 1 }
      ]
    }
  });
});

app.get('/api/compilation/pipelines', (req, res) => {
  res.json({
    success: true,
    pipelines: [
      {
        id: 'pipeline_123',
        status: 'completed',
        evolutionId: 'evo_456',
        overallSuccess: true,
        startTime: new Date(Date.now() - 30000),
        endTime: new Date()
      }
    ]
  });
});

// DevOps Chat API - Create Session
app.post('/api/devops/session', async (req, res) => {
  try {
    const { userId = 'demo-user' } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const session = await devopsChat.createSession(userId, ipAddress);
    activeSessions.set(session.id, session);
    
    res.json({ 
      success: true, 
      session: {
        id: session.id,
        userId: session.userId,
        permissions: session.permissions,
        mode: devopsChat.getConfig().executionMode
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Session creation failed' 
    });
  }
});

// DevOps Chat API - Execute Command
app.post('/api/devops/command', async (req, res) => {
  try {
    const { command, sessionId, forceReal = false } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    const response = await devopsChat.executeCommand({
      command,
      sessionId,
      forceReal
    });
    
    res.json(response);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Command execution failed' 
    });
  }
});

// DevOps Chat API - Confirm Command
app.post('/api/devops/confirm', async (req, res) => {
  try {
    const { confirmationToken } = req.body;
    
    const response = await devopsChat.confirmCommand(confirmationToken);
    res.json(response);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Confirmation failed' 
    });
  }
});

// DevOps Chat API - Cancel Confirmation
app.post('/api/devops/cancel', async (req, res) => {
  try {
    const { confirmationToken } = req.body;
    
    const cancelled = devopsChat.cancelConfirmation(confirmationToken);
    res.json({ success: cancelled });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Cancellation failed' 
    });
  }
});

// DevOps Chat API - Get Statistics
app.get('/api/devops/stats', (req, res) => {
  try {
    const stats = devopsChat.getStatistics();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get statistics' 
    });
  }
});

// DevOps Chat API - Get Audit Logs
app.get('/api/devops/audit', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = devopsChat.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get audit logs' 
    });
  }
});

// DevOps Chat API - Update Configuration
app.post('/api/devops/config', (req, res) => {
  try {
    const { executionMode, requireConfirmation } = req.body;
    
    devopsChat.updateConfig({
      executionMode,
      requireConfirmation
    });
    
    res.json({ success: true, config: devopsChat.getConfig() });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Configuration update failed' 
    });
  }
});

// Bot Registry API - Search Bots
app.get('/api/bots/search', (req, res) => {
  try {
    const query = {
      query: req.query.q as string,
      category: req.query.category as string,
      status: req.query.status as string,
      sortBy: req.query.sortBy as any || 'popularity',
      limit: parseInt(req.query.limit as string) || 20
    };
    
    const results = botRegistry.searchBots(query);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    });
  }
});

// Bot Registry API - Get Bot Details
app.get('/api/bots/:botId', (req, res) => {
  try {
    const bot = botRegistry.getBot(req.params.botId);
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get bot' 
    });
  }
});

// Bot Registry API - Register New Bot
app.post('/api/bots/register', async (req, res) => {
  try {
    const botData = req.body;
    const bot = await botRegistry.registerBot(botData);
    
    res.json({ success: true, bot });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Bot registration failed' 
    });
  }
});

// Bot Builder API - Start Build Session
app.post('/api/builder/start', async (req, res) => {
  try {
    const { description, userId = 'demo-user' } = req.body;
    
    const session = await botBuilder.startBuildSession(userId, description);
    res.json({ success: true, session });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start build session' 
    });
  }
});

// Bot Builder API - Next Step
app.post('/api/builder/:sessionId/next', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { feedback } = req.body;
    
    const session = await botBuilder.nextStep(sessionId, feedback);
    res.json({ success: true, session });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to proceed to next step' 
    });
  }
});

// Bot Builder API - Get Suggestions
app.get('/api/builder/:sessionId/suggestions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const suggestions = await botBuilder.getSuggestions(sessionId);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get suggestions' 
    });
  }
});

// Bot Registry API - Get Statistics
app.get('/api/bots/stats', (req, res) => {
  try {
    const stats = botRegistry.getStatistics();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get statistics' 
    });
  }
});

// Demo route
app.get('/demo/bot-builder', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sherlock Ω - Bot Builder Demo</title>
        <style>
            body { 
                font-family: 'Segoe UI', sans-serif; 
                margin: 40px; 
                background: #1a1a2e; 
                color: #e0e0e0; 
            }
            .container { max-width: 800px; margin: 0 auto; }
            .section { 
                margin: 30px 0; 
                padding: 20px; 
                background: #16213e; 
                border-radius: 8px; 
                border: 1px solid #00d4ff;
            }
            button { 
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer; 
                margin: 5px;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            button:hover { 
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
            }
            textarea { 
                width: 100%; 
                height: 100px; 
                background: #0f0f0f; 
                color: #e0e0e0; 
                border: 1px solid #333; 
                border-radius: 4px; 
                padding: 10px; 
                font-family: 'Consolas', monospace;
            }
            .result { 
                background: #0f0f0f; 
                padding: 15px; 
                border-radius: 4px; 
                margin-top: 10px; 
                border-left: 4px solid #00d4ff; 
                display: none;
            }
            .logo {
                text-align: center;
                font-size: 36px;
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 20px;
                text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
            }
            .subtitle {
                text-align: center;
                color: #aaa;
                margin-bottom: 40px;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">Sherlock Ω</div>
            <div class="subtitle">Self-Healing Development Environment with AI Bot Builder</div>
            
            <div class="section">
                <h2>🤖 Create AI Bot</h2>
                <textarea id="botDescription" placeholder="Describe your bot...">Create a TypeScript code generator that follows best practices and includes comprehensive error handling</textarea>
                <br><br>
                <select id="taskType" style="padding: 8px; margin-right: 10px; background: #0f0f0f; color: #e0e0e0; border: 1px solid #333;">
                    <option value="code-generation">Code Generation</option>
                    <option value="testing">Testing</option>
                    <option value="documentation">Documentation</option>
                    <option value="debugging">Debugging</option>
                </select>
                <select id="complexity" style="padding: 8px; background: #0f0f0f; color: #e0e0e0; border: 1px solid #333;">
                    <option value="low">Low Complexity</option>
                    <option value="medium">Medium Complexity</option>
                    <option value="high">High Complexity</option>
                </select>
                <br><br>
                <button onclick="createBot()">🚀 Create Bot</button>
                <div id="botResult" class="result"></div>
            </div>

            <div class="section">
                <h2>📊 System Health</h2>
                <button onclick="checkHealth()">Check System Health</button>
                <div id="healthResult" class="result"></div>
            </div>

            <div class="section">
                <h2>🔧 Compilation Statistics</h2>
                <button onclick="getStats()">View Compilation Stats</button>
                <div id="statsResult" class="result"></div>
            </div>
        </div>

        <script>
            async function createBot() {
                const description = document.getElementById('botDescription').value;
                const taskType = document.getElementById('taskType').value;
                const complexity = document.getElementById('complexity').value;
                
                const resultDiv = document.getElementById('botResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Creating AI bot...';

                try {
                    const response = await fetch('/api/bots/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description, taskType, complexity })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultDiv.innerHTML = \`
                            <h3>✅ Bot Created Successfully!</h3>
                            <p><strong>Name:</strong> \${result.bot.name}</p>
                            <p><strong>ID:</strong> \${result.bot.id}</p>
                            <p><strong>Status:</strong> \${result.bot.status}</p>
                            <p><strong>Capabilities:</strong> \${result.bot.capabilities.join(', ')}</p>
                            <p><strong>Success Rate:</strong> \${(result.bot.usage.successRate * 100).toFixed(1)}%</p>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`❌ Error: \${result.error}\`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            async function checkHealth() {
                const resultDiv = document.getElementById('healthResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Checking system health...';

                try {
                    const response = await fetch('/api/system/health');
                    const result = await response.json();
                    
                    if (result.success) {
                        const health = result.health;
                        resultDiv.innerHTML = \`
                            <h3 style="color: #00ff88">System Status: \${health.status.toUpperCase()}</h3>
                            <p><strong>Active Components:</strong> \${health.activeComponents.join(', ')}</p>
                            <p><strong>Success Rate:</strong> \${(health.performance.successRate * 100).toFixed(1)}%</p>
                            <p><strong>Avg Response Time:</strong> \${health.performance.averageResponseTime}ms</p>
                            <p><strong>Throughput:</strong> \${health.performance.throughput} ops/min</p>
                            <p><strong>CPU Usage:</strong> \${(health.performance.resourceUsage.cpu * 100).toFixed(1)}%</p>
                            <p><strong>Memory Usage:</strong> \${(health.performance.resourceUsage.memory * 100).toFixed(1)}%</p>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            async function getStats() {
                const resultDiv = document.getElementById('statsResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Loading compilation statistics...';

                try {
                    const response = await fetch('/api/compilation/statistics');
                    const result = await response.json();
                    
                    if (result.success) {
                        const stats = result.statistics;
                        resultDiv.innerHTML = \`
                            <h3>📊 Compilation Statistics</h3>
                            <p><strong>Total Pipelines:</strong> \${stats.totalPipelines}</p>
                            <p><strong>Success Rate:</strong> \${(stats.successRate * 100).toFixed(1)}%</p>
                            <p><strong>Average Duration:</strong> \${(stats.averageDuration / 1000).toFixed(1)}s</p>
                            <p><strong>Failed Pipelines:</strong> \${stats.failedPipelines}</p>
                            <p><strong>Most Common Failures:</strong> \${stats.mostCommonFailures.map(f => f.step).join(', ') || 'None'}</p>
                        \`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            // Auto-check health on load
            setTimeout(checkHealth, 1000);
        </script>
    </body>
    </html>
  `);
});

// Test page for DevOps Chat
app.get('/devops-test', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'src/ui/devops-test.html');
  res.sendFile(filePath);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down server...');
  devopsChat.cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Shutting down server...');
  devopsChat.cleanup();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sherlock Ω Hardened Demo Server running on http://localhost:${PORT}`);
  console.log(`🎨 Enhanced IDE: http://localhost:${PORT}/`);
  console.log(`🤖 DevOps Chat (Original): http://localhost:${PORT}/devops-chat`);
  console.log(`🛡️ Hardened DevOps Chat: http://localhost:${PORT}/hardened-chat`);
  console.log(`🗂️ AI Bot Manager: http://localhost:${PORT}/bot-manager`);
  console.log(`🧪 DevOps Test: http://localhost:${PORT}/devops-test`);
  console.log(`📊 Bot Builder Demo: http://localhost:${PORT}/demo/bot-builder`);
  console.log('');
  console.log('🔧 Environment Variables:');
  console.log(`   DEVOPS_MODE=${process.env.DEVOPS_MODE || 'simulation'} (simulation|real|hybrid)`);
  console.log(`   REQUIRE_CONFIRMATION=${process.env.REQUIRE_CONFIRMATION !== 'false'}`);
  console.log('');
  console.log('💡 To enable real execution: DEVOPS_MODE=real npm run demo:simple');
  console.log('⚠️  WARNING: Real mode will execute actual system commands!');
});

export default app;