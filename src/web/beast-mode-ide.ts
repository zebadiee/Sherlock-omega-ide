/**
 * BEAST MODE SHERLOCK Ω IDE - VISUAL MASTERPIECE
 * The most beautiful, powerful IDE ever built
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

export class BeastModeSherlockIDE {
  private server: http.Server;
  private logger: Logger;
  private orchestrator: any;
  private port: number;
  private terminals: Map<string, ChildProcess> = new Map();
  private workspaceRoot: string;

  constructor(port: number = 3003) {
    this.port = port;
    this.logger = new Logger(PlatformType.WEB);
    this.workspaceRoot = process.cwd();
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

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    if (url === '/' || url === '/index.html') {
      await this.serveBeastModeIDE(res);
    } else if (url === '/api/analyze' && method === 'POST') {
      await this.handleAnalyze(req, res);
    } else if (url === '/api/files') {
      await this.handleFileExplorer(res);
    } else if (url.startsWith('/api/file/') && method === 'GET') {
      await this.handleFileRead(url, res);
    } else if (url.startsWith('/api/file/') && method === 'POST') {
      await this.handleFileSave(req, url, res);
    } else if (url === '/api/terminal/create' && method === 'POST') {
      await this.handleTerminalCreate(res);
    } else if (url.startsWith('/api/terminal/') && method === 'POST') {
      await this.handleTerminalCommand(req, url, res);
    } else if (url === '/api/status') {
      await this.handleStatus(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }

  private async serveBeastModeIDE(res: http.ServerResponse): Promise<void> {
    const html = this.generateBeastModeHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  // File operations (same as before but optimized)
  private async handleFileExplorer(res: http.ServerResponse): Promise<void> {
    try {
      const files = await this.getFileTree(this.workspaceRoot);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read files' }));
    }
  }

  private async handleFileRead(url: string, res: http.ServerResponse): Promise<void> {
    try {
      const filePath = decodeURIComponent(url.replace('/api/file/', ''));
      const fullPath = path.join(this.workspaceRoot, filePath);
      
      if (!fullPath.startsWith(this.workspaceRoot)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied' }));
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content, path: filePath }));
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
    }
  }

  private async handleFileSave(req: http.IncomingMessage, url: string, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    
    req.on('end', async () => {
      try {
        const { content } = JSON.parse(body);
        const filePath = decodeURIComponent(url.replace('/api/file/', ''));
        const fullPath = path.join(this.workspaceRoot, filePath);
        
        if (!fullPath.startsWith(this.workspaceRoot)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save file' }));
      }
    });
  }

  private async handleTerminalCreate(res: http.ServerResponse): Promise<void> {
    try {
      const terminalId = `term_${Date.now()}`;
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      
      const terminal = spawn(shell, [], {
        cwd: this.workspaceRoot,
        env: process.env
      });

      this.terminals.set(terminalId, terminal);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ terminalId, shell }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create terminal' }));
    }
  }

  private async handleTerminalCommand(req: http.IncomingMessage, url: string, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    
    req.on('end', async () => {
      try {
        const { command } = JSON.parse(body);
        const terminalId = url.split('/')[3];
        const terminal = this.terminals.get(terminalId);
        
        if (!terminal) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Terminal not found' }));
          return;
        }

        terminal.stdin?.write(command + '\n');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to execute command' }));
      }
    });
  }

  private async handleAnalyze(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let body = '';
    req.on('data', chunk => body += chunk.toString());

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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Analysis failed' }));
      }
    });
  }

  private async handleStatus(res: http.ServerResponse): Promise<void> {
    const status = {
      orchestrator: this.orchestrator ? await this.orchestrator.getStatus() : { error: 'Not initialized' },
      terminals: this.terminals.size,
      workspace: this.workspaceRoot
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  private async getFileTree(dir: string, relativePath: string = ''): Promise<any[]> {
    const items: any[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') && !entry.name.startsWith('.git')) continue;
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        const itemPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          const children = await this.getFileTree(fullPath, itemPath);
          items.push({
            name: entry.name,
            type: 'directory',
            path: itemPath,
            children
          });
        } else {
          items.push({
            name: entry.name,
            type: 'file',
            path: itemPath,
            extension: path.extname(entry.name)
          });
        }
      }
    } catch (error) {
      // Ignore errors for directories we can't read
    }
    
    return items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        this.logger.info(`🔥 BEAST MODE Sherlock Ω IDE running at http://localhost:${this.port}`);
        console.log(`🚀 VISUAL MASTERPIECE: http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Clean up terminals
      this.terminals.forEach(terminal => terminal.kill());
      this.terminals.clear();
      
      this.server.close(() => {
        this.logger.info('🛑 Beast Mode IDE server stopped');
        resolve();
      });
    });
  }
  private generateBeastModeHTML(): string {
    const { ENHANCED_BEAST_HTML } = require('./enhanced-beast-html');
    return ENHANCED_BEAST_HTML;
  }
}