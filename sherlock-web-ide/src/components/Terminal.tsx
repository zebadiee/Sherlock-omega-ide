/**
 * Terminal Component
 * VS Code-style integrated terminal
 */

import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

interface TerminalProps {
  onCommand?: (command: string) => void;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export const Terminal: React.FC<TerminalProps> = ({ onCommand }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: '🧠 Sherlock Ω Terminal - Computational Consciousness Active',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'output',
      content: 'Welcome to the self-healing development environment.',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'output',
      content: 'Type "help" for available commands or start coding!',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  const addLine = (content: string, type: 'command' | 'output' | 'error' = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = (command: string) => {
    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command line
    addLine(`$ ${command}`, 'command');
    
    // Simulate command execution
    setTimeout(() => {
      const cmd = command.toLowerCase().trim();
      
      switch (cmd) {
        case 'help':
          addLine('Available commands:');
          addLine('  help          - Show this help message');
          addLine('  clear         - Clear terminal');
          addLine('  ls            - List files');
          addLine('  pwd           - Show current directory');
          addLine('  npm install   - Install dependencies');
          addLine('  npm start     - Start development server');
          addLine('  npm test      - Run tests');
          addLine('  git status    - Show git status');
          addLine('  sherlock      - Activate Sherlock insights');
          break;
          
        case 'clear':
          setLines([]);
          break;
          
        case 'ls':
          addLine('src/');
          addLine('public/');
          addLine('package.json');
          addLine('tsconfig.json');
          addLine('README.md');
          break;
          
        case 'pwd':
          addLine('/Users/developer/sherlock-omega-ide');
          break;
          
        case 'npm install':
          addLine('🔄 Installing dependencies...');
          setTimeout(() => {
            addLine('✅ Dependencies installed successfully!');
            addLine('📦 Added 1,234 packages in 12.3s');
          }, 2000);
          break;
          
        case 'npm start':
          addLine('🚀 Starting development server...');
          setTimeout(() => {
            addLine('✅ Server running on http://localhost:3000');
            addLine('🌙 Sherlock Ω observers are active');
          }, 1500);
          break;
          
        case 'npm test':
          addLine('🧪 Running tests...');
          setTimeout(() => {
            addLine('✅ All tests passed!');
            addLine('📊 Coverage: 95.2%');
          }, 2500);
          break;
          
        case 'git status':
          addLine('On branch main');
          addLine('Your branch is up to date with \'origin/main\'.');
          addLine('');
          addLine('Changes not staged for commit:');
          addLine('  modified:   src/components/MonacoEditor.tsx');
          addLine('  modified:   src/App.tsx');
          addLine('');
          addLine('Untracked files:');
          addLine('  src/components/WhisperingHUD.tsx');
          break;
          
        case 'sherlock':
          addLine('🧠 Activating Sherlock Ω computational consciousness...');
          setTimeout(() => {
            addLine('🌙 Pattern Keeper: Analyzing mathematical harmonies');
            addLine('💻 Systems Philosopher: Detecting computational poetry');
            addLine('🌌 Cosmic Cartographer: Mapping dimensional connections');
            addLine('✨ All observers active and whispering insights');
          }, 1000);
          break;
          
        default:
          if (cmd.startsWith('cd ')) {
            addLine(`Changed directory to ${cmd.substring(3)}`);
          } else if (cmd.startsWith('mkdir ')) {
            addLine(`Created directory: ${cmd.substring(6)}`);
          } else if (cmd.startsWith('touch ')) {
            addLine(`Created file: ${cmd.substring(6)}`);
          } else if (cmd.startsWith('echo ')) {
            addLine(cmd.substring(5));
          } else {
            addLine(`Command not found: ${command}`, 'error');
            addLine('Type "help" for available commands');
          }
      }
    }, 100);
    
    onCommand?.(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        executeCommand(currentInput.trim());
      }
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion
      const commands = ['help', 'clear', 'ls', 'pwd', 'npm', 'git', 'sherlock'];
      const matches = commands.filter(cmd => cmd.startsWith(currentInput.toLowerCase()));
      if (matches.length === 1) {
        setCurrentInput(matches[0]);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`terminal ${isMinimized ? 'minimized' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-tabs">
          <div className="terminal-tab active">
            <span className="tab-icon">⚡</span>
            <span className="tab-title">sherlock-terminal</span>
          </div>
        </div>
        <div className="terminal-controls">
          <button 
            className="control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? '🔼' : '🔽'}
          </button>
          <button 
            className="control-btn"
            onClick={() => setLines([])}
            title="Clear Terminal"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="terminal-content">
          <div className="terminal-output" ref={terminalRef}>
            {lines.map(line => (
              <div key={line.id} className={`terminal-line ${line.type}`}>
                <span className="line-timestamp">
                  {formatTimestamp(line.timestamp)}
                </span>
                <span className="line-content">{line.content}</span>
              </div>
            ))}
          </div>
          
          <div className="terminal-input-line">
            <span className="prompt">$ </span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Terminal;