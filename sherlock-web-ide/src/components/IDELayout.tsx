/**
 * IDE Layout Component
 * VS Code-style layout with sidebar, editor, and panels
 */

import React, { useState } from 'react';
import MonacoEditor from './MonacoEditor';
import FileExplorer from './FileExplorer';
import Terminal from './Terminal';
import WhisperingHUD from './WhisperingHUD';
import LLMSettings from './LLMSettings';
import { llmService } from '../services/LLMIntegration';
import './IDELayout.css';

interface WhisperSuggestion {
  id: string;
  type: string;
  observer: string;
  message: string;
  confidence: number;
  timing: 'immediate' | 'next-pause' | 'when-curious';
  renderLocation: 'hud' | 'inline' | 'suggestion-widget';
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export const IDELayout: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [activeTab, setActiveTab] = useState('explorer');
  const [bottomTab, setBottomTab] = useState('terminal');
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([
    {
      path: '/sherlock-project/src/main.ts',
      name: 'main.ts',
      content: `// Welcome to Sherlock Ω IDE
// The quiet revolution begins here...

import { SherlockOrchestrator } from './core/orchestrator';
import { PatternKeeper } from './observers/PatternKeeper';
import { SystemsPhilosopher } from './observers/SystemsPhilosopher';
import { CosmicCartographer } from './observers/CosmicCartographer';

class SherlockIDE {
  private orchestrator: SherlockOrchestrator;
  
  constructor() {
    this.orchestrator = new SherlockOrchestrator();
    this.initializeObservers();
  }
  
  private async initializeObservers() {
    // 🧮 Pattern Keeper - Mathematical harmonies
    const patternKeeper = new PatternKeeper();
    
    // 💻 Systems Philosopher - Computational poetry
    const systemsPhilosopher = new SystemsPhilosopher();
    
    // 🌌 Cosmic Cartographer - Dimensional connections
    const cosmicCartographer = new CosmicCartographer();
    
    await this.orchestrator.registerObserver(patternKeeper);
    await this.orchestrator.registerObserver(systemsPhilosopher);
    await this.orchestrator.registerObserver(cosmicCartographer);
    
    console.log('🌙 Sherlock Ω consciousness awakened');
  }
  
  async start() {
    await this.orchestrator.awaken();
    console.log('✨ Development friction is becoming computationally extinct');
  }
}

// Initialize the revolutionary IDE
const sherlock = new SherlockIDE();
sherlock.start();`,
      isDirty: false
    }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [whispers, setWhispers] = useState<WhisperSuggestion[]>([]);
  const [isBottomPanelVisible, setIsBottomPanelVisible] = useState(true);
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [currentLLMProvider, setCurrentLLMProvider] = useState(llmService.getActiveProvider()?.name || 'None');

  const handleWhisper = (suggestion: WhisperSuggestion) => {
    setWhispers(prev => [...prev.slice(-4), suggestion]);
  };

  const handleCodeChange = (code: string, filePath: string) => {
    setOpenFiles(prev => prev.map((file, index) => 
      index === activeFileIndex 
        ? { ...file, content: code, isDirty: true }
        : file
    ));
  };

  const handleFileSelect = (filePath: string) => {
    const existingIndex = openFiles.findIndex(f => f.path === filePath);
    
    if (existingIndex !== -1) {
      setActiveFileIndex(existingIndex);
    } else {
      // Simulate loading file content
      const fileName = filePath.split('/').pop() || 'untitled';
      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: `// ${fileName}\n// File loaded from ${filePath}\n\nconsole.log('Hello from ${fileName}');`,
        isDirty: false
      };
      
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFileIndex(openFiles.length);
    }
  };

  const handleCloseFile = (index: number) => {
    setOpenFiles(prev => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const handleUserCommand = (command: string) => {
    const response: WhisperSuggestion = {
      id: `response-${Date.now()}`,
      type: 'user-query-response',
      observer: 'sherlock-omega',
      message: command,
      confidence: 0.95,
      timing: 'immediate',
      renderLocation: 'hud'
    };
    
    setWhispers(prev => [...prev.slice(-4), response]);
  };

  const handleLLMProviderChange = (providerId: string) => {
    const provider = llmService.getProvider(providerId);
    setCurrentLLMProvider(provider?.name || 'None');
  };

  const handleAcceptSuggestion = (id: string) => {
    setWhispers(prev => prev.filter(w => w.id !== id));
  };

  const handleDismissSuggestion = (id: string) => {
    setWhispers(prev => prev.filter(w => w.id !== id));
  };

  const currentFile = openFiles[activeFileIndex];

  return (
    <div className="ide-layout">
      {/* Activity Bar */}
      <div className="activity-bar">
        <div className="activity-items">
          <button 
            className={`activity-item ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
            title="Explorer"
          >
            📁
          </button>
          <button 
            className={`activity-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            🔍
          </button>
          <button 
            className={`activity-item ${activeTab === 'git' ? 'active' : ''}`}
            onClick={() => setActiveTab('git')}
            title="Source Control"
          >
            🌿
          </button>
          <button 
            className={`activity-item ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
            title="Run and Debug"
          >
            🐛
          </button>
          <button 
            className={`activity-item ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            🧩
          </button>
        </div>
        
        <div className="activity-bottom">
          <button 
            className="activity-item" 
            title="LLM Settings"
            onClick={() => setShowLLMSettings(true)}
          >
            ⚙️
          </button>
          <button className="activity-item sherlock-brain" title="Sherlock Ω">🧠</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar" style={{ width: sidebarWidth }}>
        {activeTab === 'explorer' && (
          <FileExplorer
            onFileSelect={handleFileSelect}
            onFileCreate={(parentPath, name, type) => console.log('Create:', name, type)}
            onFileDelete={(path) => console.log('Delete:', path)}
            onFileRename={(oldPath, newName) => console.log('Rename:', oldPath, newName)}
          />
        )}
        {activeTab === 'search' && (
          <div className="panel-placeholder">
            <h3>🔍 Search</h3>
            <p>Search functionality coming soon...</p>
          </div>
        )}
        {activeTab === 'git' && (
          <div className="panel-placeholder">
            <h3>🌿 Source Control</h3>
            <p>Git integration coming soon...</p>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle vertical"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          
          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
            setSidebarWidth(newWidth);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Editor Area */}
        <div className="editor-area">
          {/* Tab Bar */}
          <div className="tab-bar">
            {openFiles.map((file, index) => (
              <div 
                key={file.path}
                className={`tab ${index === activeFileIndex ? 'active' : ''}`}
                onClick={() => setActiveFileIndex(index)}
              >
                <span className="tab-icon">
                  {file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? '🔷' : '📄'}
                </span>
                <span className="tab-name">
                  {file.name}
                  {file.isDirty && <span className="dirty-indicator">●</span>}
                </span>
                <button 
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseFile(index);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="editor-container">
            {currentFile ? (
              <MonacoEditor
                key={currentFile.path}
                initialValue={currentFile.content}
                onWhisper={handleWhisper}
                onCodeChange={handleCodeChange}
                theme="whispering"
                language="typescript"
              />
            ) : (
              <div className="welcome-screen">
                <h2>🧠 Welcome to Sherlock Ω IDE</h2>
                <p>The revolutionary self-healing development environment</p>
                <p>Select a file from the explorer to start coding</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Panel */}
        {isBottomPanelVisible && (
          <>
            <div 
              className="resize-handle horizontal"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = bottomPanelHeight;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newHeight = Math.max(100, Math.min(400, startHeight - (e.clientY - startY)));
                  setBottomPanelHeight(newHeight);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            <div className="bottom-panel" style={{ height: bottomPanelHeight }}>
              <div className="panel-tabs">
                <button 
                  className={`panel-tab ${bottomTab === 'terminal' ? 'active' : ''}`}
                  onClick={() => setBottomTab('terminal')}
                >
                  ⚡ Terminal
                </button>
                <button 
                  className={`panel-tab ${bottomTab === 'problems' ? 'active' : ''}`}
                  onClick={() => setBottomTab('problems')}
                >
                  ⚠️ Problems
                </button>
                <button 
                  className={`panel-tab ${bottomTab === 'output' ? 'active' : ''}`}
                  onClick={() => setBottomTab('output')}
                >
                  📄 Output
                </button>
                
                <button 
                  className="panel-close"
                  onClick={() => setIsBottomPanelVisible(false)}
                  title="Close Panel"
                >
                  ×
                </button>
              </div>
              
              <div className="panel-content">
                {bottomTab === 'terminal' && <Terminal />}
                {bottomTab === 'problems' && (
                  <div className="panel-placeholder">
                    <p>No problems detected. Sherlock is keeping your code healthy! ✨</p>
                  </div>
                )}
                {bottomTab === 'output' && (
                  <div className="panel-placeholder">
                    <p>Output panel - Build and debug information will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Whispering HUD */}
      <WhisperingHUD
        suggestions={whispers}
        onSubmit={handleUserCommand}
        onAcceptSuggestion={handleAcceptSuggestion}
        onDismissSuggestion={handleDismissSuggestion}
        currentCode={currentFile?.content || ''}
        currentFile={currentFile?.path || 'untitled.ts'}
        language="typescript"
      />

      {/* LLM Settings Modal */}
      {showLLMSettings && (
        <LLMSettings
          onClose={() => setShowLLMSettings(false)}
          onProviderChange={handleLLMProviderChange}
        />
      )}

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-item">🌙 Sherlock Ω Active</span>
          <span className="status-item">TypeScript</span>
          <span className="status-item">UTF-8</span>
        </div>
        <div className="status-right">
          <span className="status-item">Ln {1}, Col {1}</span>
          <span className="status-item">Spaces: 2</span>
          <span className="status-item">🧠 Observers: 3</span>
          <span className="status-item">🤖 LLM: {currentLLMProvider}</span>
        </div>
      </div>
    </div>
  );
};

export default IDELayout;