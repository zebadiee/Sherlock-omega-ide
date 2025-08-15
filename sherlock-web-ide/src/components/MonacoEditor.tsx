/**
 * Monaco Editor Component with Whispering Integration
 * The foundation of the web-based Sherlock IDE
 */

import React, { useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Whispering Architecture Types (simplified for initial implementation)
interface Insight {
  id: string;
  type: string;
  observer: string;
  confidence: number;
  message: string;
  code?: string;
}

interface WhisperSuggestion {
  id: string;
  type: string;
  observer: string;
  message: string;
  confidence: number;
  timing: 'immediate' | 'next-pause' | 'when-curious';
  renderLocation: 'hud' | 'inline' | 'suggestion-widget';
}

interface DeveloperState {
  flowState: 'deep-focus' | 'exploring' | 'debugging' | 'curious' | 'stuck';
  attentionLevel: number; // 0-1
  typingSpeed: number;
  lastActivity: Date;
}

interface MonacoEditorProps {
  onWhisper?: (suggestion: WhisperSuggestion) => void;
  onCodeChange?: (code: string, filePath: string) => void;
  theme?: 'light' | 'dark' | 'whispering';
  language?: string;
  initialValue?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  onWhisper,
  onCodeChange,
  theme = 'whispering',
  language = 'typescript',
  initialValue = '// Welcome to Sherlock Ω IDE\n// The quiet revolution begins...\n\nfunction whisperWisdom() {\n  return "Development friction is becoming computationally extinct";\n}'
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [developerState, setDeveloperState] = useState<DeveloperState>({
    flowState: 'exploring',
    attentionLevel: 0.8,
    typingSpeed: 0,
    lastActivity: new Date()
  });
  const [insights, setInsights] = useState<Insight[]>([]);

  // Initialize whispering theme
  const defineWhisperingTheme = (monaco: typeof import('monaco-editor')) => {
    monaco.editor.defineTheme('whispering', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '88C0D0', fontStyle: 'italic' },
        { token: 'keyword', foreground: '81A1C1', fontStyle: 'bold' },
        { token: 'string', foreground: 'A3BE8C' },
        { token: 'number', foreground: 'B48EAD' },
        { token: 'type', foreground: '8FBCBB' },
        { token: 'function', foreground: '88C0D0' },
        { token: 'whisper-suggestion', foreground: '88C0D0', fontStyle: 'italic' },
        { token: 'harmony-pattern', foreground: 'A3BE8C', fontStyle: 'bold' }
      ],
      colors: {
        'editor.background': '#2E3440',
        'editor.foreground': '#D8DEE9',
        'editor.lineHighlightBackground': '#3B4252',
        'editor.selectionBackground': '#434C5E',
        'editor.inactiveSelectionBackground': '#434C5E',
        'editorCursor.foreground': '#D8DEE9',
        'editorWhitespace.foreground': '#4C566A',
        'editorIndentGuide.background': '#4C566A',
        'editorIndentGuide.activeBackground': '#5E81AC',
        'editor.findMatchBackground': '#EBCB8B',
        'editor.findMatchHighlightBackground': '#EBCB8B',
        'editorWidget.background': '#3B4252',
        'editorWidget.border': '#4C566A',
        'editorSuggestWidget.background': '#3B4252',
        'editorSuggestWidget.border': '#4C566A',
        'editorSuggestWidget.selectedBackground': '#434C5E',
        'whisper.suggestion': '#88C0D0',
        'harmony.highlight': '#A3BE8C'
      }
    });
  };

  // Detect developer flow state based on typing patterns
  const detectFlowState = (typingSpeed: number, pauseDuration: number): DeveloperState['flowState'] => {
    if (typingSpeed > 60 && pauseDuration < 2000) return 'deep-focus';
    if (typingSpeed < 20 && pauseDuration > 5000) return 'stuck';
    if (pauseDuration > 10000) return 'curious';
    if (typingSpeed > 40) return 'exploring';
    return 'debugging';
  };

  // Simple pattern detection (Pattern Keeper simulation)
  const detectPatterns = (code: string): Insight[] => {
    const patterns: Insight[] = [];
    
    // Detect potential optimizations
    if (code.includes('for (let i = 0; i < array.length; i++)')) {
      patterns.push({
        id: `pattern-${Date.now()}-1`,
        type: 'mathematical-harmony',
        observer: 'pattern-keeper',
        confidence: 0.85,
        message: 'Consider using array.forEach() or for...of for better readability',
        code: 'array.forEach(item => { /* your logic */ });'
      });
    }

    // Detect nested callbacks (Systems Philosopher simulation)
    const callbackDepth = (code.match(/function\s*\(/g) || []).length;
    if (callbackDepth > 3) {
      patterns.push({
        id: `pattern-${Date.now()}-2`,
        type: 'computational-poetry',
        observer: 'systems-philosopher',
        confidence: 0.78,
        message: 'Deep nesting detected. Consider using async/await for better flow',
        code: 'async function elegantFlow() { /* await your operations */ }'
      });
    }

    // Detect repeated code (Cosmic Cartographer simulation)
    const lines = code.split('\n');
    const duplicateLines = lines.filter((line, index) => 
      lines.indexOf(line.trim()) !== index && line.trim().length > 10
    );
    if (duplicateLines.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-3`,
        type: 'cosmic-connection',
        observer: 'cosmic-cartographer',
        confidence: 0.72,
        message: 'Repeated patterns detected. Consider extracting to a reusable function',
        code: 'function extractedPattern() { /* common logic */ }'
      });
    }

    return patterns;
  };

  // Convert insights to whisper suggestions
  const createWhisperSuggestion = (insight: Insight): WhisperSuggestion => {
    return {
      id: insight.id,
      type: insight.type,
      observer: insight.observer,
      message: insight.message,
      confidence: insight.confidence,
      timing: insight.confidence > 0.8 ? 'next-pause' : 'when-curious',
      renderLocation: 'suggestion-widget'
    };
  };

  // Handle editor mount
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;
    
    // Define whispering theme
    defineWhisperingTheme(monaco);
    
    // Set theme
    monaco.editor.setTheme(theme);

    // Track typing patterns for flow state detection
    let lastTypingTime = Date.now();
    let typingSpeed = 0;
    let keystrokes = 0;

    editor.onDidChangeModelContent((e) => {
      const now = Date.now();
      const timeDiff = now - lastTypingTime;
      keystrokes++;
      
      // Calculate typing speed (characters per minute)
      if (timeDiff > 0) {
        typingSpeed = (keystrokes / (timeDiff / 1000)) * 60;
      }

      // Update developer state
      const newFlowState = detectFlowState(typingSpeed, timeDiff);
      const newDeveloperState: DeveloperState = {
        flowState: newFlowState,
        attentionLevel: newFlowState === 'deep-focus' ? 0.9 : 0.6,
        typingSpeed,
        lastActivity: new Date(now)
      };
      
      setDeveloperState(newDeveloperState);
      lastTypingTime = now;

      // Get current code and analyze patterns
      const code = editor.getValue();
      const detectedPatterns = detectPatterns(code);
      setInsights(detectedPatterns);

      // Notify parent component
      onCodeChange?.(code, 'untitled.ts');

      // Generate whisper suggestions (respecting flow state)
      if (newDeveloperState.flowState !== 'deep-focus' && detectedPatterns.length > 0) {
        const suggestion = createWhisperSuggestion(detectedPatterns[0]);
        onWhisper?.(suggestion);
      }
    });

    // Enhanced completion provider with whispering suggestions
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: (model, position) => {
        const suggestions: monaco.languages.CompletionItem[] = [];

        // Add whispering suggestions based on current insights
        insights.forEach(insight => {
          if (insight.code) {
            suggestions.push({
              label: `🌙 ${insight.message}`,
              kind: monaco.languages.CompletionItemKind.Snippet,
              detail: `Whispered by ${insight.observer} (${Math.round(insight.confidence * 100)}% confidence)`,
              documentation: {
                value: `**Sherlock Ω Insight**\n\n${insight.message}\n\n*This suggestion comes from the ${insight.observer} observer with ${Math.round(insight.confidence * 100)}% confidence.*`
              },
              insertText: insight.code,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column
              },
              sortText: '0000' // Prioritize whispering suggestions
            });
          }
        });

        return { suggestions };
      }
    });

    // Add hover provider for whispering insights
    monaco.languages.registerHoverProvider('typescript', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        // Check if there are relevant insights for this position
        const relevantInsights = insights.filter(insight => 
          insight.confidence > 0.7
        );

        if (relevantInsights.length > 0) {
          const insight = relevantInsights[0];
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `**🌙 Sherlock Ω Whispers**` },
              { value: insight.message },
              { value: `*Confidence: ${Math.round(insight.confidence * 100)}%*` }
            ]
          };
        }

        return null;
      }
    });
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={initialValue}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          wordBasedSuggestions: 'currentDocument',
          // Whispering-specific options
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',            // string
          cursorSmoothCaretAnimation: 'on',    // string literal
          smoothScrolling: true,               // boolean
          mouseWheelScrollSensitivity: 2,
          fastScrollSensitivity: 5,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
      
      {/* Developer State Indicator (for debugging) */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(46, 52, 64, 0.9)',
        color: '#D8DEE9',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #4C566A'
      }}>
        Flow: {developerState.flowState} | 
        Attention: {Math.round(developerState.attentionLevel * 100)}% | 
        Insights: {insights.length}
      </div>
    </div>
  );
};

export default MonacoEditor;