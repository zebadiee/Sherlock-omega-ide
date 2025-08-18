import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { EnhancedSherlockSystem } from '../core/enhanced-sherlock-system';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Enhanced Sherlock System
const sherlockSystem = new EnhancedSherlockSystem({
  selfHealing: {
    enabled: true,
    autoFix: true,
    confidenceThreshold: 0.8,
    maxAttempts: 3
  },
  continuousLearning: {
    enabled: true,
    feedbackCollection: true,
    modelRetraining: false,
    performanceOptimization: true
  },
  proactiveAssistance: {
    enabled: true,
    intentPrediction: true,
    contextAwareness: true,
    suggestionEngine: true
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../ui')));

// Serve the enhanced IDE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/enhanced-sherlock-ide.html'));
});

// API Routes

// Bot Management
app.post('/api/bots/create', async (req, res) => {
  try {
    const { description, taskType, complexity, priority, customRequirements } = req.body;
    
    const bot = await sherlockSystem.createIntelligentBot({
      description,
      taskType,
      complexity: complexity || 'medium',
      priority: priority || 'medium',
      customRequirements
    });

    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/bots', async (req, res) => {
  try {
    const analytics = sherlockSystem.getPerformanceAnalytics();
    res.json({ success: true, bots: analytics.bots });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Code Generation with Streaming
app.post('/api/code/generate', async (req, res) => {
  try {
    const { prompt, language, complexity, priority, context } = req.body;
    
    const { taskId, stream$, result$ } = await sherlockSystem.generateCodeWithStreaming(
      prompt,
      { language, complexity, priority, context }
    );

    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*'
    });

    // Stream chunks to client
    const streamSubscription = stream$.subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
      },
      error: (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    });

    // Handle final result
    const resultSubscription = result$.subscribe({
      next: (result) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
        res.end();
        streamSubscription.unsubscribe();
        resultSubscription.unsubscribe();
      },
      error: (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
        streamSubscription.unsubscribe();
        resultSubscription.unsubscribe();
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      streamSubscription.unsubscribe();
      resultSubscription.unsubscribe();
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Self-Compilation and Deployment
app.post('/api/evolution/deploy', async (req, res) => {
  try {
    const { evolution } = req.body;
    
    const result = await sherlockSystem.deployEvolution(evolution);
    
    res.json({ success: result.success, pipeline: result.pipeline, error: result.error });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/compilation/pipelines', (req, res) => {
  try {
    const pipelines = sherlockSystem.getActivePipelines();
    res.json({ success: true, pipelines });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/compilation/pipelines/:pipelineId/cancel', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const cancelled = await sherlockSystem.cancelPipeline(pipelineId);
    
    res.json({ success: cancelled });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/compilation/statistics', (req, res) => {
  try {
    const stats = sherlockSystem.getCompilationStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Self-Healing Analysis
app.post('/api/code/heal', async (req, res) => {
  try {
    const { code, filePath, autoFix, confidenceThreshold } = req.body;
    
    const result = await sherlockSystem.performSelfHealingAnalysis(
      code,
      filePath,
      { autoFix, confidenceThreshold }
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// System Health
app.get('/api/system/health', (req, res) => {
  try {
    const health = sherlockSystem.getCurrentHealth();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Performance Analytics
app.get('/api/system/analytics', (req, res) => {
  try {
    const analytics = sherlockSystem.getPerformanceAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Automation Rules
app.post('/api/automation/rules', async (req, res) => {
  try {
    const rule = req.body;
    const ruleId = sherlockSystem.addAutomationRule(rule);
    res.json({ success: true, ruleId });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/automation/rules/:ruleId/execute', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const context = req.body;
    
    await sherlockSystem.executeAutomationRule(ruleId, context);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// WebSocket Events
io.on('connection', (socket: any) => {
  console.log('🔌 Client connected:', socket.id);

  // Subscribe to system health updates
  const healthSubscription = sherlockSystem.getSystemHealth$().subscribe(health => {
    socket.emit('system-health', health);
  });

  // Handle bot creation requests
  socket.on('create-bot', async (data: any) => {
    try {
      const bot = await sherlockSystem.createIntelligentBot(data);
      socket.emit('bot-created', { success: true, bot });
    } catch (error) {
      socket.emit('bot-created', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handle code generation with real-time streaming
  socket.on('generate-code', async (data: any) => {
    try {
      const { taskId, stream$, result$ } = await sherlockSystem.generateCodeWithStreaming(
        data.prompt,
        data.options
      );

      socket.emit('generation-started', { taskId });

      // Stream chunks
      const streamSubscription = stream$.subscribe({
        next: (chunk) => {
          socket.emit('code-chunk', { taskId, chunk });
        },
        error: (error) => {
          socket.emit('generation-error', { taskId, error: error.message });
        }
      });

      // Handle completion
      const resultSubscription = result$.subscribe({
        next: (result) => {
          socket.emit('generation-complete', { taskId, result });
          streamSubscription.unsubscribe();
          resultSubscription.unsubscribe();
        },
        error: (error) => {
          socket.emit('generation-error', { taskId, error: error.message });
          streamSubscription.unsubscribe();
          resultSubscription.unsubscribe();
        }
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        streamSubscription.unsubscribe();
        resultSubscription.unsubscribe();
      });

    } catch (error) {
      socket.emit('generation-error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handle deployment requests
  socket.on('deploy-evolution', async (data: any) => {
    try {
      const result = await sherlockSystem.deployEvolution(data.evolution);
      socket.emit('deployment-result', { success: result.success, pipeline: result.pipeline, error: result.error });
    } catch (error) {
      socket.emit('deployment-result', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handle bot creation with auto-deployment
  socket.on('create-and-deploy-bot', async (data: any) => {
    try {
      const result = await sherlockSystem.createAndDeployBot({
        ...data,
        autoDeploy: true
      });
      socket.emit('bot-deployed', { success: true, ...result });
    } catch (error) {
      socket.emit('bot-deployed', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handle self-healing requests
  socket.on('heal-code', async (data: any) => {
    try {
      const result = await sherlockSystem.performSelfHealingAnalysis(
        data.code,
        data.filePath,
        data.options
      );
      socket.emit('healing-complete', { success: true, ...result });
    } catch (error) {
      socket.emit('healing-complete', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    healthSubscription.unsubscribe();
  });
});

// System Event Listeners
sherlockSystem.on('system-initialized', () => {
  console.log('🚀 Enhanced Sherlock Ω System is ready!');
});

sherlockSystem.on('bot-created', (bot) => {
  io.emit('bot-created-broadcast', bot);
});

sherlockSystem.on('self-healing-completed', (result) => {
  io.emit('healing-completed-broadcast', result);
});

sherlockSystem.on('automation-rule-executed', (data) => {
  io.emit('automation-executed-broadcast', data);
});

sherlockSystem.on('deployment-started', (evolution) => {
  io.emit('deployment-started-broadcast', evolution);
});

sherlockSystem.on('deployment-completed', (data) => {
  io.emit('deployment-completed-broadcast', data);
});

sherlockSystem.on('deployment-error', (data) => {
  io.emit('deployment-error-broadcast', data);
});

// Demo Routes for Testing
app.get('/demo/bot-builder', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bot Builder Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a2e; color: #e0e0e0; }
            .demo-container { max-width: 800px; margin: 0 auto; }
            .demo-section { margin: 30px 0; padding: 20px; background: #16213e; border-radius: 8px; }
            button { background: #00d4ff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
            button:hover { background: #0099cc; }
            textarea { width: 100%; height: 100px; background: #0f0f0f; color: #e0e0e0; border: 1px solid #333; border-radius: 4px; padding: 10px; }
            .result { background: #0f0f0f; padding: 15px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #00d4ff; }
        </style>
    </head>
    <body>
        <div class="demo-container">
            <h1>🤖 Enhanced Sherlock Ω - Bot Builder Demo</h1>
            
            <div class="demo-section">
                <h2>Create Intelligent Bot</h2>
                <textarea id="botDescription" placeholder="Describe what you want your bot to do...">Create a bot that generates comprehensive unit tests for TypeScript functions with high code coverage</textarea>
                <br>
                <select id="taskType">
                    <option value="code-generation">Code Generation</option>
                    <option value="testing">Testing</option>
                    <option value="documentation">Documentation</option>
                    <option value="analysis">Analysis</option>
                    <option value="debugging">Debugging</option>
                </select>
                <select id="complexity">
                    <option value="low">Low Complexity</option>
                    <option value="medium">Medium Complexity</option>
                    <option value="high">High Complexity</option>
                </select>
                <br>
                <button onclick="createBot()">Create Bot</button>
                <div id="botResult" class="result" style="display: none;"></div>
            </div>

            <div class="demo-section">
                <h2>Generate Code with Streaming</h2>
                <textarea id="codePrompt" placeholder="Describe the code you want to generate...">Create a TypeScript function that validates email addresses with comprehensive error handling</textarea>
                <br>
                <select id="language">
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>
                <br>
                <button onclick="generateCode()">Generate Code</button>
                <div id="codeResult" class="result" style="display: none;"></div>
            </div>

            <div class="demo-section">
                <h2>Self-Healing Code Analysis</h2>
                <textarea id="codeToHeal" placeholder="Paste code that needs healing...">function validateEmail(email) {
    if (!email) return false;
    // Missing proper email validation
    return email.includes('@');
}</textarea>
                <br>
                <button onclick="healCode()">Analyze & Heal Code</button>
                <div id="healResult" class="result" style="display: none;"></div>
            </div>

            <div class="demo-section">
                <h2>System Health</h2>
                <button onclick="getSystemHealth()">Check System Health</button>
                <div id="healthResult" class="result" style="display: none;"></div>
            </div>
        </div>

        <script>
            async function createBot() {
                const description = document.getElementById('botDescription').value;
                const taskType = document.getElementById('taskType').value;
                const complexity = document.getElementById('complexity').value;
                
                const resultDiv = document.getElementById('botResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Creating intelligent bot...';

                try {
                    const response = await fetch('/api/bots/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description, taskType, complexity, priority: 'medium' })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultDiv.innerHTML = \`
                            <h3>✅ Bot Created Successfully!</h3>
                            <p><strong>Name:</strong> \${result.bot.name}</p>
                            <p><strong>ID:</strong> \${result.bot.id}</p>
                            <p><strong>Status:</strong> \${result.bot.status}</p>
                            <p><strong>Capabilities:</strong> \${result.bot.capabilities.length} capabilities</p>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`❌ Error: \${result.error}\`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            async function generateCode() {
                const prompt = document.getElementById('codePrompt').value;
                const language = document.getElementById('language').value;
                
                const resultDiv = document.getElementById('codeResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Generating code...';

                try {
                    const response = await fetch('/api/code/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt, language, complexity: 'medium', priority: 'medium' })
                    });

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let code = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.type === 'chunk') {
                                        code += data.data;
                                        resultDiv.innerHTML = \`<pre>\${code}</pre>\`;
                                    } else if (data.type === 'complete') {
                                        resultDiv.innerHTML = \`
                                            <h3>✅ Code Generated!</h3>
                                            <pre>\${data.result.code}</pre>
                                            <p><strong>Language:</strong> \${data.result.language}</p>
                                            <p><strong>Quality Score:</strong> \${data.result.metadata?.estimatedQuality || 'N/A'}</p>
                                        \`;
                                    }
                                } catch (e) {
                                    // Ignore parsing errors for incomplete chunks
                                }
                            }
                        }
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            async function healCode() {
                const code = document.getElementById('codeToHeal').value;
                
                const resultDiv = document.getElementById('healResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Analyzing and healing code...';

                try {
                    const response = await fetch('/api/code/heal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            code, 
                            filePath: 'demo.ts', 
                            autoFix: true, 
                            confidenceThreshold: 0.8 
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultDiv.innerHTML = \`
                            <h3>✅ Code Analysis Complete!</h3>
                            <p><strong>Issues Found:</strong> \${result.healingReport.totalIssues}</p>
                            <p><strong>Issues Fixed:</strong> \${result.healingReport.fixedIssues}</p>
                            <p><strong>Success Rate:</strong> \${(result.healingReport.successRate * 100).toFixed(1)}%</p>
                            <p><strong>Healing Time:</strong> \${result.healingReport.timeToHeal}ms</p>
                            \${result.fixes.length > 0 ? '<h4>Applied Fixes:</h4>' + result.fixes.map(fix => \`<p>• \${fix.description} (Confidence: \${(fix.confidence * 100).toFixed(1)}%)</p>\`).join('') : ''}
                        \`;
                    } else {
                        resultDiv.innerHTML = \`❌ Error: \${result.error}\`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }

            async function getSystemHealth() {
                const resultDiv = document.getElementById('healthResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '🔄 Checking system health...';

                try {
                    const response = await fetch('/api/system/health');
                    const result = await response.json();
                    
                    if (result.success) {
                        const health = result.health;
                        const statusColor = health.status === 'healthy' ? '#00ff88' : 
                                          health.status === 'degraded' ? '#ffaa00' : '#ff4444';
                        
                        resultDiv.innerHTML = \`
                            <h3 style="color: \${statusColor}">System Status: \${health.status.toUpperCase()}</h3>
                            <p><strong>Uptime:</strong> \${Math.floor(health.uptime / 1000 / 60)} minutes</p>
                            <p><strong>Active Components:</strong> \${health.activeComponents.join(', ')}</p>
                            <p><strong>Success Rate:</strong> \${(health.performance.successRate * 100).toFixed(1)}%</p>
                            <p><strong>Avg Response Time:</strong> \${health.performance.averageResponseTime.toFixed(0)}ms</p>
                            <p><strong>Throughput:</strong> \${health.performance.throughput.toFixed(1)} tasks/min</p>
                            \${health.issues.length > 0 ? '<h4>Issues:</h4>' + health.issues.map(issue => \`<p style="color: #ffaa00;">• \${issue.message}</p>\`).join('') : '<p style="color: #00ff88;">No issues detected</p>'}
                        \`;
                    } else {
                        resultDiv.innerHTML = \`❌ Error: \${result.error}\`;
                    }
                } catch (error) {
                    resultDiv.innerHTML = \`❌ Error: \${error.message}\`;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced Sherlock Ω Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 Bot Builder Demo: http://localhost:${PORT}/demo/bot-builder`);
  console.log(`🎨 Enhanced IDE: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down server...');
  await sherlockSystem.shutdown();
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

export default app;