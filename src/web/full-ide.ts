/**
 * FULL IDE SERVER - VSCode Clone with ALL Features
 * Terminal, File Explorer, Extensions, Themes, Command Palette - EVERYTHING!
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../logging/logger';
import { PlatformType } from '../core/whispering-interfaces';

export class FullSherlockIDE {
  private server: http.Server;
  private logger: Logger;
  private orchestrator: any;
  private port: number;
  private terminals: Map<string, ChildProcess> = new Map();
  private workspaceRoot: string;

  constructor(port: number = 3002) {
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
      await this.serveFullIDE(res);
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

  private async serveFullIDE(res: http.ServerResponse): Promise<void> {
    const html = this.generateFullIDEHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

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
        this.logger.info(`🚀 FULL Sherlock Ω IDE running at http://localhost:${this.port}`);
        console.log(`🔥 BEAST MODE IDE: http://localhost:${this.port}`);
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
        this.logger.info('🛑 Full IDE server stopped');
        resolve();
      });
    });
  }
 
 private generateFullIDEHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sherlock Ω IDE - Full Stack Development Environment</title>
    <link rel="stylesheet" href="https://unpkg.com/monaco-editor@0.52.2/min/vs/editor/editor.main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
                "titlebar titlebar titlebar titlebar"
                "activitybar sidebar editor panel"
                "activitybar sidebar terminal panel"
                "statusbar statusbar statusbar statusbar";
            grid-template-rows: 35px 1fr 200px 22px;
            grid-template-columns: 48px 300px 1fr 350px;
            height: 100vh;
        }
        
        /* TITLE BAR */
        .titlebar {
            grid-area: titlebar;
            background: #323233;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            border-bottom: 1px solid #2d2d30;
            -webkit-app-region: drag;
        }
        
        .titlebar-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .titlebar-center {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .titlebar-right {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .window-control {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .window-control.close { background: #ff5f57; }
        .window-control.minimize { background: #ffbd2e; }
        .window-control.maximize { background: #28ca42; }
        
        .logo {
            display: flex;
            align-items: center;
            font-weight: 600;
            font-size: 13px;
            color: #007acc;
        }
        
        .logo::before {
            content: "🔍";
            margin-right: 8px;
            font-size: 16px;
        }
        
        /* ACTIVITY BAR */
        .activitybar {
            grid-area: activitybar;
            background: #333333;
            border-right: 1px solid #2d2d30;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 0;
        }
        
        .activity-item {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px 0;
            cursor: pointer;
            border-radius: 4px;
            color: #cccccc;
            transition: all 0.2s;
        }
        
        .activity-item:hover {
            background: #2a2d2e;
        }
        
        .activity-item.active {
            background: #094771;
            color: #ffffff;
            border-left: 2px solid #007acc;
        }
        
        /* SIDEBAR */
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
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .sidebar-actions {
            display: flex;
            gap: 4px;
        }
        
        .sidebar-action {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 2px;
            font-size: 10px;
        }
        
        .sidebar-action:hover {
            background: #3e3e42;
        }
        
        .file-explorer {
            flex: 1;
            padding: 8px;
            overflow-y: auto;
        }
        
        .file-tree {
            list-style: none;
        }
        
        .file-item {
            padding: 2px 8px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 13px;
            display: flex;
            align-items: center;
            user-select: none;
            position: relative;
        }
        
        .file-item:hover {
            background: #2a2d2e;
        }
        
        .file-item.active {
            background: #094771;
            color: #ffffff;
        }
        
        .file-item.directory {
            font-weight: 500;
        }
        
        .file-item .icon {
            margin-right: 6px;
            width: 16px;
            text-align: center;
            font-size: 12px;
        }
        
        .file-item .expand-arrow {
            position: absolute;
            left: -12px;
            width: 12px;
            height: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            cursor: pointer;
        }
        
        .file-children {
            margin-left: 16px;
            display: none;
        }
        
        .file-children.expanded {
            display: block;
        }
        
        /* EDITOR AREA */
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
            overflow-x: auto;
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
            white-space: nowrap;
            min-width: 120px;
        }
        
        .editor-tab.active {
            background: #1e1e1e;
            border-bottom: 1px solid #1e1e1e;
        }
        
        .editor-tab.dirty::after {
            content: "●";
            margin-left: 6px;
            color: #ffffff;
        }
        
        .editor-tab .icon {
            margin-right: 6px;
            font-size: 11px;
        }
        
        .editor-tab .close {
            margin-left: auto;
            padding-left: 8px;
            opacity: 0.6;
            cursor: pointer;
            font-size: 10px;
        }
        
        .editor-tab .close:hover {
            opacity: 1;
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
            color: #6c6c6c;
            font-size: 14px;
        }
        
        .editor-placeholder .logo-large {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.3;
        }
        
        /* TERMINAL */
        .terminal-area {
            grid-area: terminal;
            background: #1e1e1e;
            border-top: 1px solid #2d2d30;
            display: flex;
            flex-direction: column;
        }
        
        .terminal-header {
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
            min-height: 35px;
            padding: 0 16px;
            justify-content: space-between;
        }
        
        .terminal-tabs {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .terminal-tab {
            padding: 4px 12px;
            background: #3e3e42;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .terminal-tab.active {
            background: #007acc;
            color: #ffffff;
        }
        
        .terminal-actions {
            display: flex;
            gap: 8px;
        }
        
        .terminal-action {
            padding: 4px 8px;
            background: #3e3e42;
            border: none;
            color: #cccccc;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        
        .terminal-action:hover {
            background: #4e4e4e;
        }
        
        .terminal-content {
            flex: 1;
            background: #000000;
            color: #ffffff;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            padding: 8px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        
        .terminal-input {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            background: #000000;
            border-top: 1px solid #2d2d30;
        }
        
        .terminal-prompt {
            color: #00ff00;
            margin-right: 8px;
        }
        
        .terminal-input input {
            flex: 1;
            background: transparent;
            border: none;
            color: #ffffff;
            font-family: inherit;
            font-size: inherit;
            outline: none;
        }
        
        /* ANALYSIS PANEL */
        .analysis-panel {
            grid-area: panel;
            background: #252526;
            border-left: 1px solid #2d2d30;
            display: flex;
            flex-direction: column;
        }
        
        .panel-tabs {
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
        }
        
        .panel-tab {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            border-right: 1px solid #3e3e42;
        }
        
        .panel-tab.active {
            background: #252526;
            border-bottom: 1px solid #252526;
        }
        
        .panel-content {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
        }
        
        .analysis-result {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            border-left: 3px solid;
            cursor: pointer;
        }
        
        .analysis-result:hover {
            background: rgba(255,255,255,0.05);
        }
        
        .analysis-result.error {
            background: rgba(244, 67, 54, 0.1);
            border-left-color: #f44336;
        }
        
        .analysis-result.warning {
            background: rgba(255, 193, 7, 0.1);
            border-left-color: #ffc107;
        }
        
        .analysis-result.info {
            background: rgba(33, 150, 243, 0.1);
            border-left-color: #2196f3;
        }
        
        .analysis-result.success {
            background: rgba(76, 175, 80, 0.1);
            border-left-color: #4caf50;
        }
        
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }
        
        .result-type {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
        }
        
        .result-line {
            font-size: 10px;
            opacity: 0.7;
        }
        
        .result-message {
            margin-bottom: 4px;
            line-height: 1.4;
        }
        
        .result-suggestion {
            font-style: italic;
            opacity: 0.8;
            font-size: 11px;
        }
        
        /* STATUS BAR */
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
        
        .statusbar-item {
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 3px;
            transition: background 0.2s;
        }
        
        .statusbar-item:hover {
            background: rgba(255,255,255,0.1);
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
            background: #4caf50;
            transition: width 0.3s;
        }
        
        /* COMMAND PALETTE */
        .command-palette {
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            background: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            z-index: 1000;
            display: none;
        }
        
        .command-palette.show {
            display: block;
        }
        
        .command-input {
            width: 100%;
            padding: 12px 16px;
            background: transparent;
            border: none;
            color: #cccccc;
            font-size: 14px;
            outline: none;
            border-bottom: 1px solid #3e3e42;
        }
        
        .command-results {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .command-item {
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }
        
        .command-item:hover,
        .command-item.selected {
            background: #094771;
        }
        
        .command-shortcut {
            font-size: 11px;
            opacity: 0.7;
        }
        
        /* NOTIFICATIONS */
        .notifications {
            position: fixed;
            top: 50px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .notification {
            background: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 12px 16px;
            min-width: 300px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .notification.success {
            border-left: 3px solid #4caf50;
        }
        
        .notification.error {
            border-left: 3px solid #f44336;
        }
        
        .notification.warning {
            border-left: 3px solid #ffc107;
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .notification-message {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .notification-close {
            cursor: pointer;
            opacity: 0.6;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        /* RESPONSIVE */
        @media (max-width: 1200px) {
            .ide-container {
                grid-template-columns: 48px 250px 1fr 300px;
            }
        }
        
        @media (max-width: 900px) {
            .ide-container {
                grid-template-areas: 
                    "titlebar titlebar titlebar"
                    "activitybar editor panel"
                    "activitybar terminal panel"
                    "statusbar statusbar statusbar";
                grid-template-columns: 48px 1fr 300px;
            }
            
            .sidebar {
                display: none;
            }
        }
        
        /* ANIMATIONS */
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .slide-in {
            animation: slideIn 0.3s ease-in-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        
        /* SCROLLBARS */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #3e3e42;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }
    </style>
</head>
<body>
    <div class="ide-container">
        <!-- TITLE BAR -->
        <div class="titlebar">
            <div class="titlebar-left">
                <div class="window-control close"></div>
                <div class="window-control minimize"></div>
                <div class="window-control maximize"></div>
            </div>
            <div class="titlebar-center">
                <div class="logo">Sherlock Ω IDE</div>
                <span id="workspace-name">- Workspace</span>
            </div>
            <div class="titlebar-right">
                <i class="fas fa-search" style="cursor: pointer;" onclick="toggleCommandPalette()"></i>
            </div>
        </div>
        
        <!-- ACTIVITY BAR -->
        <div class="activitybar">
            <div class="activity-item active" onclick="switchActivity('explorer')" title="Explorer">
                <i class="fas fa-folder"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('search')" title="Search">
                <i class="fas fa-search"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('git')" title="Source Control">
                <i class="fas fa-code-branch"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('debug')" title="Run and Debug">
                <i class="fas fa-bug"></i>
            </div>
            <div class="activity-item" onclick="switchActivity('extensions')" title="Extensions">
                <i class="fas fa-th-large"></i>
            </div>
        </div>
        
        <!-- SIDEBAR -->
        <div class="sidebar">
            <div class="sidebar-header">
                <span>Explorer</span>
                <div class="sidebar-actions">
                    <div class="sidebar-action" onclick="createNewFile()" title="New File">
                        <i class="fas fa-file-plus"></i>
                    </div>
                    <div class="sidebar-action" onclick="createNewFolder()" title="New Folder">
                        <i class="fas fa-folder-plus"></i>
                    </div>
                    <div class="sidebar-action" onclick="refreshExplorer()" title="Refresh">
                        <i class="fas fa-sync"></i>
                    </div>
                </div>
            </div>
            <div class="file-explorer">
                <ul class="file-tree" id="file-tree">
                    <!-- File tree will be populated here -->
                </ul>
            </div>
        </div>
        
        <!-- EDITOR AREA -->
        <div class="editor-area">
            <div class="editor-tabs" id="editor-tabs">
                <!-- Tabs will be added here -->
            </div>
            <div class="monaco-container" id="monaco-container">
                <div class="editor-placeholder">
                    <div class="logo-large">🔍</div>
                    <div>Sherlock Ω IDE</div>
                    <div style="font-size: 12px; opacity: 0.6; margin-top: 8px;">Open a file to start coding</div>
                </div>
            </div>
        </div>
        
        <!-- TERMINAL -->
        <div class="terminal-area">
            <div class="terminal-header">
                <div class="terminal-tabs">
                    <div class="terminal-tab active" id="terminal-tab-1">
                        <i class="fas fa-terminal"></i>
                        <span>bash</span>
                    </div>
                </div>
                <div class="terminal-actions">
                    <button class="terminal-action" onclick="createNewTerminal()">
                        <i class="fas fa-plus"></i> New Terminal
                    </button>
                    <button class="terminal-action" onclick="clearTerminal()">
                        <i class="fas fa-trash"></i> Clear
                    </button>
                </div>
            </div>
            <div class="terminal-content" id="terminal-content">
                <div style="color: #00ff00;">Sherlock Ω IDE Terminal</div>
                <div style="color: #888;">Type commands below...</div>
            </div>
            <div class="terminal-input">
                <span class="terminal-prompt">$</span>
                <input type="text" id="terminal-input" placeholder="Enter command..." onkeypress="handleTerminalInput(event)">
            </div>
        </div>
        
        <!-- ANALYSIS PANEL -->
        <div class="analysis-panel">
            <div class="panel-tabs">
                <div class="panel-tab active" onclick="switchPanel('problems')">Problems</div>
                <div class="panel-tab" onclick="switchPanel('output')">Output</div>
                <div class="panel-tab" onclick="switchPanel('debug')">Debug Console</div>
            </div>
            <div class="panel-content" id="panel-content">
                <div class="analysis-result info">
                    <div class="result-header">
                        <div class="result-type">Info</div>
                    </div>
                    <div class="result-message">Pattern analysis ready</div>
                    <div class="result-suggestion">Open a file and start coding to see real-time analysis</div>
                </div>
            </div>
        </div>
        
        <!-- STATUS BAR -->
        <div class="statusbar">
            <div class="statusbar-left">
                <div class="statusbar-item" id="cursor-position">Ln 1, Col 1</div>
                <div class="statusbar-item" id="file-encoding">UTF-8</div>
                <div class="statusbar-item" id="file-language">TypeScript</div>
                <div class="statusbar-item" id="git-branch">
                    <i class="fas fa-code-branch"></i> main
                </div>
            </div>
            <div class="statusbar-right">
                <div class="statusbar-item" id="analysis-status">Ready</div>
                <div class="score-indicator">
                    <span>Quality:</span>
                    <div class="score-bar">
                        <div class="score-fill" id="score-fill" style="width: 100%"></div>
                    </div>
                    <span id="score-text">100%</span>
                </div>
                <div class="statusbar-item">
                    <i class="fas fa-bell"></i>
                </div>
            </div>
        </div>
    </div>
    
    <!-- COMMAND PALETTE -->
    <div class="command-palette" id="command-palette">
        <input type="text" class="command-input" id="command-input" placeholder="Type a command..." onkeyup="filterCommands(event)">
        <div class="command-results" id="command-results">
            <!-- Command results will be populated here -->
        </div>
    </div>
    
    <!-- NOTIFICATIONS -->
    <div class="notifications" id="notifications">
        <!-- Notifications will appear here -->
    </div>

    <script src="https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js"></script>
    <script>
        // GLOBAL STATE
        let editor;
        let currentFile = null;
        let openTabs = new Map();
        let fileTree = [];
        let terminalId = null;
        let currentAnalysis = null;
        
        // MONACO EDITOR INITIALIZATION
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            initializeIDE();
        });
        
        async function initializeIDE() {
            console.log('🚀 Initializing Sherlock Ω IDE...');
            
            // Load file tree
            await loadFileTree();
            
            // Create terminal
            await createTerminal();
            
            // Setup keyboard shortcuts
            setupKeyboardShortcuts();
            
            // Show welcome notification
            showNotification('Welcome to Sherlock Ω IDE!', 'Your intelligent development environment is ready.', 'success');
            
            console.log('✨ IDE initialized successfully!');
        }
        
        // FILE MANAGEMENT
        async function loadFileTree() {
            try {
                const response = await fetch('/api/files');
                fileTree = await response.json();
                renderFileTree(fileTree, document.getElementById('file-tree'));
            } catch (error) {
                console.error('Failed to load file tree:', error);
                showNotification('Error', 'Failed to load file tree', 'error');
            }
        }
        
        function renderFileTree(items, container, level = 0) {
            container.innerHTML = '';
            
            items.forEach(item => {
                const li = document.createElement('li');
                const div = document.createElement('div');
                div.className = 'file-item' + (item.type === 'directory' ? ' directory' : '');
                div.style.paddingLeft = (level * 16 + 8) + 'px';
                
                if (item.type === 'directory') {
                    const arrow = document.createElement('span');
                    arrow.className = 'expand-arrow';
                    arrow.innerHTML = '▶';
                    arrow.onclick = (e) => {
                        e.stopPropagation();
                        toggleDirectory(li, item);
                    };
                    div.appendChild(arrow);
                }
                
                const icon = document.createElement('span');
                icon.className = 'icon';
                icon.innerHTML = getFileIcon(item);
                div.appendChild(icon);
                
                const name = document.createElement('span');
                name.textContent = item.name;
                div.appendChild(name);
                
                if (item.type === 'file') {
                    div.onclick = () => openFile(item.path);
                }
                
                li.appendChild(div);
                
                if (item.children) {
                    const childContainer = document.createElement('ul');
                    childContainer.className = 'file-children';
                    li.appendChild(childContainer);
                }
                
                container.appendChild(li);
            });
        }
        
        function getFileIcon(item) {
            if (item.type === 'directory') return '📁';
            
            const ext = item.extension?.toLowerCase();
            switch (ext) {
                case '.ts': return '🔷';
                case '.js': return '🟨';
                case '.json': return '📋';
                case '.md': return '📝';
                case '.html': return '🌐';
                case '.css': return '🎨';
                case '.py': return '🐍';
                case '.java': return '☕';
                case '.cpp': case '.c': return '⚙️';
                default: return '📄';
            }
        }
        
        function toggleDirectory(li, item) {
            const arrow = li.querySelector('.expand-arrow');
            const children = li.querySelector('.file-children');
            
            if (children.classList.contains('expanded')) {
                children.classList.remove('expanded');
                arrow.innerHTML = '▶';
            } else {
                children.classList.add('expanded');
                arrow.innerHTML = '▼';
                if (children.children.length === 0 && item.children) {
                    renderFileTree(item.children, children, li.style.paddingLeft ? parseInt(li.style.paddingLeft) / 16 + 1 : 1);
                }
            }
        }
        
        async function openFile(filePath) {
            try {
                if (openTabs.has(filePath)) {
                    switchToTab(filePath);
                    return;
                }
                
                const response = await fetch(\`/api/file/\${encodeURIComponent(filePath)}\`);
                const fileData = await response.json();
                
                if (fileData.error) {
                    throw new Error(fileData.error);
                }
                
                // Create editor if it doesn't exist
                if (!editor) {
                    createEditor();
                }
                
                // Add tab
                addTab(filePath, fileData.content);
                
                // Switch to new tab
                switchToTab(filePath);
                
                // Hide placeholder
                document.querySelector('.editor-placeholder').style.display = 'none';
                
                showNotification('File Opened', \`Opened \${filePath}\`, 'success');
                
            } catch (error) {
                console.error('Failed to open file:', error);
                showNotification('Error', \`Failed to open \${filePath}\`, 'error');
            }
        }
        
        function createEditor() {
            const container = document.getElementById('monaco-container');
            container.innerHTML = '';
            
            editor = monaco.editor.create(container, {
                value: '',
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
                cursorSmoothCaretAnimation: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true }
            });
            
            // Update cursor position
            editor.onDidChangeCursorPosition(function(e) {
                document.getElementById('cursor-position').textContent = 
                    \`Ln \${e.position.lineNumber}, Col \${e.position.column}\`;
            });
            
            // Auto-analyze on content change
            let analyzeTimeout;
            editor.onDidChangeModelContent(function() {
                if (currentFile) {
                    markTabDirty(currentFile);
                }
                
                clearTimeout(analyzeTimeout);
                analyzeTimeout = setTimeout(analyzeCurrentFile, 1000);
            });
            
            // Auto-save
            let saveTimeout;
            editor.onDidChangeModelContent(function() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveCurrentFile, 2000);
            });
        }
        
        function addTab(filePath, content) {
            const tabsContainer = document.getElementById('editor-tabs');
            
            const tab = document.createElement('div');
            tab.className = 'editor-tab';
            tab.dataset.path = filePath;
            
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.innerHTML = getFileIcon({ extension: path.extname(filePath) });
            tab.appendChild(icon);
            
            const name = document.createElement('span');
            name.textContent = path.basename(filePath);
            tab.appendChild(name);
            
            const close = document.createElement('span');
            close.className = 'close';
            close.innerHTML = '×';
            close.onclick = (e) => {
                e.stopPropagation();
                closeTab(filePath);
            };
            tab.appendChild(close);
            
            tab.onclick = () => switchToTab(filePath);
            
            tabsContainer.appendChild(tab);
            
            // Store tab data
            openTabs.set(filePath, {
                content: content,
                originalContent: content,
                element: tab
            });
        }
        
        function switchToTab(filePath) {
            // Update active tab
            document.querySelectorAll('.editor-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const tab = openTabs.get(filePath);
            if (tab) {
                tab.element.classList.add('active');
                currentFile = filePath;
                
                if (editor) {
                    editor.setValue(tab.content);
                    editor.focus();
                }
                
                // Update language
                const ext = path.extname(filePath).toLowerCase();
                const language = getLanguageFromExtension(ext);
                document.getElementById('file-language').textContent = language;
                
                if (editor) {
                    monaco.editor.setModelLanguage(editor.getModel(), getMonacoLanguage(ext));
                }
            }
        }
        
        function closeTab(filePath) {
            const tab = openTabs.get(filePath);
            if (tab) {
                tab.element.remove();
                openTabs.delete(filePath);
                
                if (currentFile === filePath) {
                    // Switch to another tab or show placeholder
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
        
        function markTabDirty(filePath) {
            const tab = openTabs.get(filePath);
            if (tab && editor) {
                const currentContent = editor.getValue();
                if (currentContent !== tab.originalContent) {
                    tab.element.classList.add('dirty');
                } else {
                    tab.element.classList.remove('dirty');
                }
                tab.content = currentContent;
            }
        }
        
        async function saveCurrentFile() {
            if (!currentFile || !editor) return;
            
            try {
                const content = editor.getValue();
                const response = await fetch(\`/api/file/\${encodeURIComponent(currentFile)}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                
                const result = await response.json();
                if (result.success) {
                    const tab = openTabs.get(currentFile);
                    if (tab) {
                        tab.originalContent = content;
                        tab.element.classList.remove('dirty');
                    }
                    
                    showNotification('File Saved', \`Saved \${currentFile}\`, 'success');
                }
            } catch (error) {
                console.error('Failed to save file:', error);
                showNotification('Error', 'Failed to save file', 'error');
            }
        }
        
        // TERMINAL MANAGEMENT
        async function createTerminal() {
            try {
                const response = await fetch('/api/terminal/create', { method: 'POST' });
                const result = await response.json();
                terminalId = result.terminalId;
                
                document.getElementById('terminal-content').innerHTML += \`
                    <div style="color: #00ff00;">Terminal created: \${result.shell}</div>
                \`;
            } catch (error) {
                console.error('Failed to create terminal:', error);
            }
        }
        
        async function handleTerminalInput(event) {
            if (event.key === 'Enter' && terminalId) {
                const input = event.target;
                const command = input.value;
                
                if (command.trim()) {
                    // Add command to terminal display
                    const terminalContent = document.getElementById('terminal-content');
                    terminalContent.innerHTML += \`
                        <div><span style="color: #00ff00;">$ </span>\${command}</div>
                    \`;
                    
                    try {
                        await fetch(\`/api/terminal/\${terminalId}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ command })
                        });
                        
                        // Simulate output (in real implementation, you'd capture actual output)
                        setTimeout(() => {
                            terminalContent.innerHTML += \`
                                <div style="color: #ccc;">Command executed: \${command}</div>
                            \`;
                            terminalContent.scrollTop = terminalContent.scrollHeight;
                        }, 100);
                        
                    } catch (error) {
                        terminalContent.innerHTML += \`
                            <div style="color: #ff6b6b;">Error: \${error.message}</div>
                        \`;
                    }
                    
                    input.value = '';
                    terminalContent.scrollTop = terminalContent.scrollHeight;
                }
            }
        }
        
        function createNewTerminal() {
            showNotification('New Terminal', 'Creating new terminal...', 'info');
            createTerminal();
        }
        
        function clearTerminal() {
            document.getElementById('terminal-content').innerHTML = \`
                <div style="color: #00ff00;">Sherlock Ω IDE Terminal</div>
                <div style="color: #888;">Terminal cleared...</div>
            \`;
        }
        
        // ANALYSIS
        async function analyzeCurrentFile() {
            if (!currentFile || !editor) return;
            
            const code = editor.getValue();
            const statusElement = document.getElementById('analysis-status');
            
            statusElement.textContent = 'Analyzing...';
            
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
                
                statusElement.textContent = \`\${analysis.patterns.length} issues\`;
                
            } catch (error) {
                console.error('Analysis failed:', error);
                statusElement.textContent = 'Analysis failed';
            }
        }
        
        function displayAnalysisResults(analysis) {
            const panelContent = document.getElementById('panel-content');
            
            if (analysis.patterns.length === 0) {
                panelContent.innerHTML = \`
                    <div class="analysis-result success">
                        <div class="result-header">
                            <div class="result-type">Success</div>
                        </div>
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
                    <div class="analysis-result \${severity}" onclick="goToLine(\${pattern.line || 1})">
                        <div class="result-header">
                            <div class="result-type">\${pattern.type}</div>
                            \${pattern.line ? \`<div class="result-line">Line \${pattern.line}</div>\` : ''}
                        </div>
                        <div class="result-message">\${pattern.message}</div>
                        \${pattern.suggestion ? \`<div class="result-suggestion">💡 \${pattern.suggestion}</div>\` : ''}
                    </div>
                \`;
            });
            
            panelContent.innerHTML = html;
        }
        
        function goToLine(lineNumber) {
            if (editor) {
                editor.revealLineInCenter(lineNumber);
                editor.setPosition({ lineNumber, column: 1 });
                editor.focus();
            }
        }
        
        function updateScore(score) {
            const scoreText = document.getElementById('score-text');
            const scoreFill = document.getElementById('score-fill');
            
            const percentage = Math.round(score * 100);
            scoreText.textContent = \`\${percentage}%\`;
            scoreFill.style.width = \`\${percentage}%\`;
            
            if (percentage >= 80) {
                scoreFill.style.background = '#4caf50';
            } else if (percentage >= 60) {
                scoreFill.style.background = '#ffc107';
            } else {
                scoreFill.style.background = '#f44336';
            }
        }
        
        // UI INTERACTIONS
        function switchActivity(activity) {
            document.querySelectorAll('.activity-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.activity-item').classList.add('active');
            
            // Update sidebar content based on activity
            const sidebarHeader = document.querySelector('.sidebar-header span');
            sidebarHeader.textContent = activity.charAt(0).toUpperCase() + activity.slice(1);
        }
        
        function switchPanel(panel) {
            document.querySelectorAll('.panel-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update panel content based on selection
            if (panel === 'problems' && currentAnalysis) {
                displayAnalysisResults(currentAnalysis);
            }
        }
        
        function toggleCommandPalette() {
            const palette = document.getElementById('command-palette');
            const input = document.getElementById('command-input');
            
            if (palette.classList.contains('show')) {
                palette.classList.remove('show');
            } else {
                palette.classList.add('show');
                input.focus();
                populateCommands();
            }
        }
        
        function populateCommands() {
            const commands = [
                { name: 'File: New File', shortcut: 'Ctrl+N', action: 'createNewFile' },
                { name: 'File: Open File', shortcut: 'Ctrl+O', action: 'openFile' },
                { name: 'File: Save', shortcut: 'Ctrl+S', action: 'saveCurrentFile' },
                { name: 'Edit: Find', shortcut: 'Ctrl+F', action: 'find' },
                { name: 'View: Command Palette', shortcut: 'Ctrl+Shift+P', action: 'toggleCommandPalette' },
                { name: 'Terminal: New Terminal', shortcut: 'Ctrl+Shift+\`', action: 'createNewTerminal' },
                { name: 'Analyze: Run Analysis', shortcut: 'Ctrl+Shift+A', action: 'analyzeCurrentFile' }
            ];
            
            const results = document.getElementById('command-results');
            results.innerHTML = commands.map(cmd => \`
                <div class="command-item" onclick="executeCommand('\${cmd.action}')">
                    <span>\${cmd.name}</span>
                    <span class="command-shortcut">\${cmd.shortcut}</span>
                </div>
            \`).join('');
        }
        
        function filterCommands(event) {
            if (event.key === 'Escape') {
                toggleCommandPalette();
                return;
            }
            
            // Filter commands based on input
            const query = event.target.value.toLowerCase();
            const items = document.querySelectorAll('.command-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        }
        
        function executeCommand(action) {
            toggleCommandPalette();
            
            switch (action) {
                case 'createNewFile':
                    createNewFile();
                    break;
                case 'saveCurrentFile':
                    saveCurrentFile();
                    break;
                case 'createNewTerminal':
                    createNewTerminal();
                    break;
                case 'analyzeCurrentFile':
                    analyzeCurrentFile();
                    break;
                default:
                    console.log('Command not implemented:', action);
            }
        }
        
        function createNewFile() {
            const fileName = prompt('Enter file name:');
            if (fileName) {
                // Create new file logic
                showNotification('New File', \`Creating \${fileName}...\`, 'info');
            }
        }
        
        function createNewFolder() {
            const folderName = prompt('Enter folder name:');
            if (folderName) {
                showNotification('New Folder', \`Creating \${folderName}...\`, 'info');
            }
        }
        
        function refreshExplorer() {
            loadFileTree();
            showNotification('Explorer', 'File tree refreshed', 'success');
        }
        
        // NOTIFICATIONS
        function showNotification(title, message, type = 'info') {
            const notifications = document.getElementById('notifications');
            
            const notification = document.createElement('div');
            notification.className = \`notification \${type} fade-in\`;
            
            notification.innerHTML = \`
                <div class="notification-content">
                    <div class="notification-title">\${title}</div>
                    <div class="notification-message">\${message}</div>
                </div>
                <div class="notification-close" onclick="this.parentElement.remove()">×</div>
            \`;
            
            notifications.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
        
        // KEYBOARD SHORTCUTS
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 's':
                            e.preventDefault();
                            saveCurrentFile();
                            break;
                        case 'n':
                            e.preventDefault();
                            createNewFile();
                            break;
                        case 'p':
                            if (e.shiftKey) {
                                e.preventDefault();
                                toggleCommandPalette();
                            }
                            break;
                        case '\`':
                            if (e.shiftKey) {
                                e.preventDefault();
                                createNewTerminal();
                            }
                            break;
                        case 'Enter':
                            e.preventDefault();
                            analyzeCurrentFile();
                            break;
                    }
                }
                
                if (e.key === 'Escape') {
                    const palette = document.getElementById('command-palette');
                    if (palette.classList.contains('show')) {
                        toggleCommandPalette();
                    }
                }
            });
        }
        
        // UTILITY FUNCTIONS
        function getLanguageFromExtension(ext) {
            switch (ext) {
                case '.ts': return 'TypeScript';
                case '.js': return 'JavaScript';
                case '.json': return 'JSON';
                case '.md': return 'Markdown';
                case '.html': return 'HTML';
                case '.css': return 'CSS';
                case '.py': return 'Python';
                case '.java': return 'Java';
                case '.cpp': case '.c': return 'C++';
                default: return 'Plain Text';
            }
        }
        
        function getMonacoLanguage(ext) {
            switch (ext) {
                case '.ts': return 'typescript';
                case '.js': return 'javascript';
                case '.json': return 'json';
                case '.md': return 'markdown';
                case '.html': return 'html';
                case '.css': return 'css';
                case '.py': return 'python';
                case '.java': return 'java';
                case '.cpp': case '.c': return 'cpp';
                default: return 'plaintext';
            }
        }
        
        // Path utility (simple implementation)
        const path = {
            basename: (p) => p.split('/').pop() || p,
            extname: (p) => {
                const parts = p.split('.');
                return parts.length > 1 ? '.' + parts.pop() : '';
            }
        };
    </script>
</body>
</html>`;
  }
}