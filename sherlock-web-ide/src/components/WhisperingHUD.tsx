/**
 * Whispering HUD Component
 * Interactive interface for communicating with Sherlock Ω
 */

import React, { useState, useEffect, useRef } from 'react';
import { llmService, CodeContext } from '../services/LLMIntegration';
import './WhisperingHUD.css';

interface WhisperSuggestion {
  id: string;
  type: string;
  observer: string;
  message: string;
  confidence: number;
  timing: 'immediate' | 'next-pause' | 'when-curious';
  renderLocation: 'hud' | 'inline' | 'suggestion-widget';
}

interface WhisperingHUDProps {
  suggestions: WhisperSuggestion[];
  onSubmit: (text: string) => void;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  currentCode?: string;
  currentFile?: string;
  language?: string;
}

export const WhisperingHUD: React.FC<WhisperingHUDProps> = ({
  suggestions,
  onSubmit,
  onAcceptSuggestion,
  onDismissSuggestion,
  currentCode = '',
  currentFile = 'untitled.ts',
  language = 'typescript'
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim() && !isProcessing) {
      const userInput = input.trim();
      setInput('');
      setIsProcessing(true);
      
      // Add user message to conversation
      setConversationHistory(prev => [...prev, {
        role: 'user',
        content: userInput,
        timestamp: new Date()
      }]);
      
      try {
        // Process with LLM service
        await handleLLMRequest(userInput);
      } catch (error) {
        console.error('LLM request failed:', error);
        // Fallback to original handler
        onSubmit(userInput);
      } finally {
        setIsProcessing(false);
      }
    } else if (e.key === 'Escape') {
      setInput('');
      setIsExpanded(false);
    } else if (e.key === 'ArrowUp' && conversationHistory.length > 0) {
      // Navigate conversation history
      const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
      if (lastUserMessage && !input) {
        setInput(lastUserMessage.content);
      }
    }
  };

  const handleLLMRequest = async (userInput: string) => {
    const context: CodeContext = {
      language,
      filePath: currentFile,
      selectedCode: currentCode,
      surroundingCode: currentCode
    };

    let response: string;

    // Determine the type of request and route to appropriate LLM method
    if (userInput.toLowerCase().includes('explain')) {
      response = await llmService.explainCode(currentCode, context);
    } else if (userInput.toLowerCase().includes('debug') || userInput.toLowerCase().includes('error')) {
      response = await llmService.debugCode(currentCode, userInput, context);
    } else if (userInput.toLowerCase().includes('optimize') || userInput.toLowerCase().includes('improve')) {
      const suggestions = await llmService.generateCodeSuggestion(currentCode, context);
      response = suggestions.length > 0 
        ? `I found ${suggestions.length} optimization opportunities:\n\n${suggestions.map(s => `• ${s.explanation}`).join('\n')}`
        : 'Your code looks well-optimized! I don\'t see any immediate improvements.';
    } else {
      // General conversation
      const llmResponse = await llmService.sendRequest({
        provider: llmService.getActiveProvider()?.id || 'openai',
        model: llmService.getActiveProvider()?.models[0]?.id || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are Sherlock Ω, a computational consciousness that assists developers with elegant insights. 
            You have access to the current code context and can provide specific, actionable advice.
            Be concise but insightful, focusing on mathematical harmonies and computational poetry.`
          },
          ...conversationHistory.slice(-5).map(h => ({ role: h.role, content: h.content })),
          {
            role: 'user',
            content: `${userInput}\n\nCurrent code context:\n\`\`\`${language}\n${currentCode}\n\`\`\``
          }
        ],
        context
      });
      response = llmResponse.content;
    }

    // Add assistant response to conversation
    setConversationHistory(prev => [...prev, {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    }]);

    // Create a whisper suggestion from the response
    const whisperSuggestion: WhisperSuggestion = {
      id: `llm-response-${Date.now()}`,
      type: 'llm-response',
      observer: 'sherlock-omega',
      message: response,
      confidence: 0.95,
      timing: 'immediate',
      renderLocation: 'hud'
    };

    onSubmit(response); // This will add it to the suggestions
  };

  const getObserverIcon = (observer: string) => {
    switch (observer) {
      case 'pattern-keeper': return '🧮';
      case 'systems-philosopher': return '💻';
      case 'cosmic-cartographer': return '🌌';
      default: return '🌙';
    }
  };

  const getObserverColor = (observer: string) => {
    switch (observer) {
      case 'pattern-keeper': return '#A3BE8C';
      case 'systems-philosopher': return '#88C0D0';
      case 'cosmic-cartographer': return '#B48EAD';
      default: return '#D8DEE9';
    }
  };

  return (
    <div className={`whispering-hud ${isExpanded ? 'expanded' : ''}`}>
      {/* Suggestions Area */}
      {suggestions.length > 0 && (
        <div className="suggestions-area">
          {suggestions.slice(-3).map(suggestion => (
            <div 
              key={suggestion.id} 
              className="suggestion-card"
              style={{ borderLeftColor: getObserverColor(suggestion.observer) }}
            >
              <div className="suggestion-header">
                <span className="observer-icon">
                  {getObserverIcon(suggestion.observer)}
                </span>
                <span className="observer-name">
                  {suggestion.observer.replace('-', ' ')}
                </span>
                <span className="confidence">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
              <div className="suggestion-message">
                {suggestion.message}
              </div>
              <div className="suggestion-actions">
                <button 
                  className="accept-btn"
                  onClick={() => onAcceptSuggestion(suggestion.id)}
                >
                  Apply
                </button>
                <button 
                  className="dismiss-btn"
                  onClick={() => onDismissSuggestion(suggestion.id)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <span className="sherlock-icon">🧠</span>
          <input
            className="whisper-input"
            type="text"
            placeholder="Ask Sherlock Ω anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
          />
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="quick-commands">
            <button onClick={() => setInput('Explain this code')}>
              💡 Explain
            </button>
            <button onClick={() => setInput('Optimize this function')}>
              ⚡ Optimize
            </button>
            <button onClick={() => setInput('Find patterns')}>
              🔍 Patterns
            </button>
            <button onClick={() => setInput('Suggest improvements')}>
              ✨ Improve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhisperingHUD;