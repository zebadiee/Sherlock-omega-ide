/**
 * LLM Settings Component
 * Configure and manage multiple LLM providers
 */

import React, { useState, useEffect } from 'react';
import { llmService, LLMProvider, LLMModel } from '../services/LLMIntegration';
import { huggingFaceService, HuggingFaceModel } from '../services/HuggingFaceIntegration';
import HuggingFaceModelBrowser from './HuggingFaceModelBrowser';
import './LLMSettings.css';

interface LLMSettingsProps {
  onClose: () => void;
  onProviderChange: (providerId: string) => void;
}

export const LLMSettings: React.FC<LLMSettingsProps> = ({ onClose, onProviderChange }) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<LLMProvider | undefined>();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testingProvider, setTestingProvider] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [showHFBrowser, setShowHFBrowser] = useState(false);
  const [selectedHFModel, setSelectedHFModel] = useState<HuggingFaceModel | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const allProviders = llmService.getProviders();
    setProviders(allProviders);
    
    const active = llmService.getActiveProvider();
    setActiveProvider(active);
    setSelectedProvider(active?.id || '');

    // Load saved API keys from localStorage
    const savedKeys: Record<string, string> = {};
    allProviders.forEach(provider => {
      const saved = localStorage.getItem(`llm-api-key-${provider.id}`);
      if (saved) {
        savedKeys[provider.id] = saved;
      }
    });
    setApiKeys(savedKeys);

    // Test provider availability
    const results: Record<string, boolean> = {};
    for (const provider of allProviders) {
      results[provider.id] = await llmService.checkProviderAvailability(provider.id);
    }
    setTestResults(results);
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: apiKey }));
  };

  const saveApiKey = async (providerId: string) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey) return;

    // Save to localStorage
    localStorage.setItem(`llm-api-key-${providerId}`, apiKey);

    // Configure provider
    await llmService.configureProvider(providerId, { apiKey });

    // Test availability
    setTestingProvider(providerId);
    const isAvailable = await llmService.checkProviderAvailability(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: isAvailable }));
    setTestingProvider('');

    // Reload providers
    await loadProviders();
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    llmService.setActiveProvider(providerId);
    onProviderChange(providerId);
    setActiveProvider(llmService.getActiveProvider());
  };

  const getProviderIcon = (provider: LLMProvider) => {
    switch (provider.type) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🔍';
      case 'ollama': return '🦙';
      default: return '⚡';
    }
  };

  const getModelCapabilityIcon = (type: string) => {
    switch (type) {
      case 'code-generation': return '⚡';
      case 'code-analysis': return '🔍';
      case 'explanation': return '💡';
      case 'debugging': return '🐛';
      case 'refactoring': return '🔧';
      case 'testing': return '🧪';
      default: return '✨';
    }
  };

  const formatCapabilityStrength = (strength: number) => {
    if (strength >= 0.9) return 'Excellent';
    if (strength >= 0.8) return 'Very Good';
    if (strength >= 0.7) return 'Good';
    if (strength >= 0.6) return 'Fair';
    return 'Limited';
  };

  return (
    <div className="llm-settings-overlay">
      <div className="llm-settings-modal">
        <div className="settings-header">
          <h2>🧠 LLM Provider Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="provider-list">
            <h3>Available Providers</h3>
            
            {providers.map(provider => (
              <div 
                key={provider.id} 
                className={`provider-card ${selectedProvider === provider.id ? 'active' : ''} ${testResults[provider.id] ? 'available' : 'unavailable'}`}
              >
                <div className="provider-header">
                  <div className="provider-info">
                    <span className="provider-icon">{getProviderIcon(provider)}</span>
                    <div>
                      <h4>{provider.name}</h4>
                      <span className="provider-type">{provider.type}</span>
                    </div>
                  </div>
                  
                  <div className="provider-status">
                    {testingProvider === provider.id ? (
                      <span className="testing">🔄 Testing...</span>
                    ) : testResults[provider.id] ? (
                      <span className="available">✅ Available</span>
                    ) : (
                      <span className="unavailable">❌ Unavailable</span>
                    )}
                  </div>
                </div>

                {/* API Key Configuration */}
                {provider.type !== 'ollama' && (
                  <div className="api-key-section">
                    <label>API Key:</label>
                    <div className="api-key-input">
                      <input
                        type="password"
                        placeholder={`Enter ${provider.name} API key`}
                        value={apiKeys[provider.id] || ''}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                      />
                      <button 
                        onClick={() => saveApiKey(provider.id)}
                        disabled={!apiKeys[provider.id] || testingProvider === provider.id}
                      >
                        Save & Test
                      </button>
                    </div>
                  </div>
                )}

                {/* Models */}
                <div className="models-section">
                  <h5>Available Models:</h5>
                  <div className="models-grid">
                    {provider.models.map(model => (
                      <div key={model.id} className="model-card">
                        <div className="model-header">
                          <strong>{model.name}</strong>
                          {model.costPer1kTokens && (
                            <span className="model-cost">${model.costPer1kTokens}/1k tokens</span>
                          )}
                        </div>
                        <p className="model-description">{model.description}</p>
                        <div className="model-specs">
                          <span>Context: {model.contextLength.toLocaleString()} tokens</span>
                        </div>
                        <div className="model-capabilities">
                          {model.capabilities.map(cap => (
                            <div key={cap.type} className="capability">
                              <span className="capability-icon">{getModelCapabilityIcon(cap.type)}</span>
                              <span className="capability-name">{cap.type.replace('-', ' ')}</span>
                              <span className={`capability-strength strength-${Math.floor(cap.strength * 5)}`}>
                                {formatCapabilityStrength(cap.strength)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select Provider Button */}
                <div className="provider-actions">
                  <button 
                    className={`select-provider-btn ${selectedProvider === provider.id ? 'selected' : ''}`}
                    onClick={() => handleProviderSelect(provider.id)}
                    disabled={!testResults[provider.id]}
                  >
                    {selectedProvider === provider.id ? '✅ Active Provider' : 'Select Provider'}
                  </button>
                </div>
              </div>
            ))}

            {/* Hugging Face Integration */}
            <div className="provider-card hf-integration">
              <div className="provider-header">
                <div className="provider-info">
                  <span className="provider-icon">🤗</span>
                  <div>
                    <h4>Hugging Face Models</h4>
                    <span className="provider-type">Open Source Hub</span>
                  </div>
                </div>
                <div className="provider-status">
                  <span className="available">✅ Thousands Available</span>
                </div>
              </div>

              <div className="hf-description">
                <p>Access thousands of open-source models including DeepSeek Coder, Qwen, Code Llama, and more.</p>
                <p>Choose from cloud inference or local deployment options.</p>
              </div>

              <div className="hf-actions">
                <button 
                  className="browse-models-btn"
                  onClick={() => setShowHFBrowser(true)}
                >
                  🔍 Browse Hugging Face Models
                </button>
                
                {selectedHFModel && (
                  <div className="selected-hf-model">
                    <h5>Selected Model:</h5>
                    <div className="hf-model-info">
                      <span className="hf-model-name">{selectedHFModel.name}</span>
                      <span className="hf-model-author">by {selectedHFModel.author}</span>
                      <div className="hf-model-capabilities">
                        {selectedHFModel.capabilities.slice(0, 2).map(cap => (
                          <span key={cap.type} className="hf-capability">
                            {cap.type.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="usage-stats">
            <h3>Usage Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{llmService.getRequestHistory().length}</span>
                <span className="stat-label">Total Requests</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{activeProvider?.name || 'None'}</span>
                <span className="stat-label">Active Provider</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{providers.filter(p => testResults[p.id]).length}</span>
                <span className="stat-label">Available Providers</span>
              </div>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="setup-guide">
            <h3>Quick Setup Guide</h3>
            <div className="guide-steps">
              <div className="guide-step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Get API Keys</strong>
                  <p>Sign up for accounts and get API keys from your preferred providers:</p>
                  <ul>
                    <li><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a></li>
                    <li><a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a></li>
                    <li><a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="guide-step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Local Setup (Optional)</strong>
                  <p>Install Ollama for local models:</p>
                  <code>curl -fsSL https://ollama.ai/install.sh | sh</code>
                  <code>ollama pull codellama</code>
                </div>
              </div>
              
              <div className="guide-step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Configure & Test</strong>
                  <p>Enter your API keys above and click "Save & Test" to verify connectivity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="clear-cache-btn" onClick={() => llmService.clearCache()}>
            🗑️ Clear Cache
          </button>
          <button className="close-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>

        {/* Hugging Face Model Browser */}
        {showHFBrowser && (
          <HuggingFaceModelBrowser
            onModelSelect={(model, provider) => {
              setSelectedHFModel(model);
              setShowHFBrowser(false);
              // TODO: Integrate with LLM service
              console.log('Selected HF model:', model, 'with provider:', provider);
            }}
            onClose={() => setShowHFBrowser(false)}
            currentModel={selectedHFModel?.id}
          />
        )}
      </div>
    </div>
  );
};

export default LLMSettings;