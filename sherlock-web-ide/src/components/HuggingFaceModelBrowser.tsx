/**
 * Hugging Face Model Browser Component
 * Browse, search, and select from thousands of open-source models
 */

import React, { useState, useEffect } from 'react';
import { huggingFaceService, HuggingFaceModel, HuggingFaceProvider } from '../services/HuggingFaceIntegration';
import './HuggingFaceModelBrowser.css';

interface HuggingFaceModelBrowserProps {
  onModelSelect: (model: HuggingFaceModel, provider: string) => void;
  onClose: () => void;
  currentModel?: string;
}

export const HuggingFaceModelBrowser: React.FC<HuggingFaceModelBrowserProps> = ({
  onModelSelect,
  onClose,
  currentModel
}) => {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [providers, setProviders] = useState<HuggingFaceProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('huggingface-api');
  const [filters, setFilters] = useState({
    pipeline_tag: '',
    language: '',
    sort: 'downloads' as 'downloads' | 'likes' | 'recent',
    showLocalOnly: false
  });
  const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null);

  useEffect(() => {
    loadProviders();
    loadPopularModels();
  }, []);

  useEffect(() => {
    if (searchQuery || filters.pipeline_tag || filters.language) {
      searchModels();
    } else {
      loadPopularModels();
    }
  }, [searchQuery, filters]);

  const loadProviders = () => {
    const allProviders = huggingFaceService.getProviders();
    setProviders(allProviders);
  };

  const loadPopularModels = async () => {
    setLoading(true);
    try {
      const popularModels = huggingFaceService.getPopularModels({
        pipeline_tag: filters.pipeline_tag || undefined,
        language: filters.language || undefined,
        limit: 20
      });
      setModels(popularModels);
    } catch (error) {
      console.error('Failed to load popular models:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchModels = async () => {
    setLoading(true);
    try {
      const searchResults = await huggingFaceService.searchModels(searchQuery, {
        pipeline_tag: filters.pipeline_tag || undefined,
        language: filters.language || undefined,
        sort: filters.sort,
        limit: 50
      });
      setModels(searchResults);
    } catch (error) {
      console.error('Failed to search models:', error);
      loadPopularModels(); // Fallback to popular models
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (model: HuggingFaceModel) => {
    setSelectedModel(model);
  };

  const handleConfirmSelection = () => {
    if (selectedModel) {
      onModelSelect(selectedModel, selectedProvider);
      onClose();
    }
  };

  const getModelIcon = (pipelineTag: string) => {
    switch (pipelineTag) {
      case 'text-generation': return '📝';
      case 'code-generation': return '💻';
      case 'feature-extraction': return '🔍';
      case 'summarization': return '📋';
      case 'translation': return '🌐';
      case 'question-answering': return '❓';
      default: return '🤖';
    }
  };

  const getCapabilityColor = (type: string) => {
    switch (type) {
      case 'code-generation': return '#4EC9B0';
      case 'text-generation': return '#DCDCAA';
      case 'chat': return '#88C0D0';
      case 'embeddings': return '#A3BE8C';
      case 'summarization': return '#D08770';
      default: return '#CCCCCC';
    }
  };

  const formatModelSize = (size?: string) => {
    if (!size) return '';
    if (size.includes('B')) return size;
    if (size.includes('M')) return size;
    return `${size}B`;
  };

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
    if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}K`;
    return downloads.toString();
  };

  return (
    <div className="hf-model-browser-overlay">
      <div className="hf-model-browser">
        <div className="browser-header">
          <h2>🤗 Hugging Face Model Browser</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="browser-content">
          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search models (e.g., 'deepseek coder', 'llama chat', 'qwen')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button onClick={searchModels} disabled={loading}>
                {loading ? '🔄' : '🔍'}
              </button>
            </div>

            <div className="filters">
              <select
                value={filters.pipeline_tag}
                onChange={(e) => setFilters(prev => ({ ...prev, pipeline_tag: e.target.value }))}
              >
                <option value="">All Tasks</option>
                <option value="text-generation">Text Generation</option>
                <option value="feature-extraction">Embeddings</option>
                <option value="summarization">Summarization</option>
                <option value="translation">Translation</option>
                <option value="question-answering">Q&A</option>
              </select>

              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="">All Languages</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>

              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
              >
                <option value="downloads">Most Downloaded</option>
                <option value="likes">Most Liked</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          <div className="browser-main">
            {/* Model List */}
            <div className="model-list">
              <div className="list-header">
                <h3>Models ({models.length})</h3>
                {loading && <span className="loading">Loading...</span>}
              </div>

              <div className="models-grid">
                {models.map(model => (
                  <div
                    key={model.id}
                    className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''} ${currentModel === model.id ? 'current' : ''}`}
                    onClick={() => handleModelSelect(model)}
                  >
                    <div className="model-header">
                      <span className="model-icon">{getModelIcon(model.pipeline_tag)}</span>
                      <div className="model-info">
                        <h4 className="model-name">{model.name}</h4>
                        <span className="model-author">by {model.author}</span>
                      </div>
                      {model.model_size && (
                        <span className="model-size">{formatModelSize(model.model_size)}</span>
                      )}
                    </div>

                    <p className="model-description">{model.description}</p>

                    <div className="model-capabilities">
                      {model.capabilities.slice(0, 3).map(cap => (
                        <span
                          key={cap.type}
                          className="capability-tag"
                          style={{ backgroundColor: getCapabilityColor(cap.type) }}
                        >
                          {cap.type.replace('-', ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="model-stats">
                      <span className="stat">
                        📥 {formatDownloads(model.downloads)}
                      </span>
                      <span className="stat">
                        ❤️ {model.likes}
                      </span>
                      {model.license && (
                        <span className="stat license">
                          📄 {model.license}
                        </span>
                      )}
                    </div>

                    {currentModel === model.id && (
                      <div className="current-badge">Current</div>
                    )}
                  </div>
                ))}
              </div>

              {models.length === 0 && !loading && (
                <div className="no-models">
                  <p>No models found matching your criteria.</p>
                  <button onClick={loadPopularModels}>Show Popular Models</button>
                </div>
              )}
            </div>

            {/* Model Details */}
            {selectedModel && (
              <div className="model-details">
                <h3>Model Details</h3>
                
                <div className="detail-section">
                  <h4>{selectedModel.name}</h4>
                  <p className="detail-author">by {selectedModel.author}</p>
                  <p className="detail-description">{selectedModel.description}</p>
                </div>

                <div className="detail-section">
                  <h5>Specifications</h5>
                  <div className="spec-grid">
                    {selectedModel.model_size && (
                      <div className="spec-item">
                        <span className="spec-label">Size:</span>
                        <span className="spec-value">{formatModelSize(selectedModel.model_size)}</span>
                      </div>
                    )}
                    {selectedModel.architecture && (
                      <div className="spec-item">
                        <span className="spec-label">Architecture:</span>
                        <span className="spec-value">{selectedModel.architecture}</span>
                      </div>
                    )}
                    {selectedModel.license && (
                      <div className="spec-item">
                        <span className="spec-label">License:</span>
                        <span className="spec-value">{selectedModel.license}</span>
                      </div>
                    )}
                    <div className="spec-item">
                      <span className="spec-label">Task:</span>
                      <span className="spec-value">{selectedModel.pipeline_tag}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Capabilities</h5>
                  <div className="capabilities-detailed">
                    {selectedModel.capabilities.map(cap => (
                      <div key={cap.type} className="capability-detailed">
                        <span className="capability-name">{cap.type.replace('-', ' ')}</span>
                        <div className="capability-strength">
                          <div 
                            className="strength-bar"
                            style={{ 
                              width: `${cap.strength * 100}%`,
                              backgroundColor: getCapabilityColor(cap.type)
                            }}
                          />
                          <span className="strength-value">{Math.round(cap.strength * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedModel.languages && (
                  <div className="detail-section">
                    <h5>Supported Languages</h5>
                    <div className="languages">
                      {selectedModel.languages.map(lang => (
                        <span key={lang} className="language-tag">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h5>Provider</h5>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="provider-select"
                  >
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} {provider.isAvailable ? '✅' : '❌'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="browser-footer">
          <div className="footer-info">
            <span>💡 Tip: Local models provide privacy and no API costs</span>
          </div>
          <div className="footer-actions">
            <button onClick={onClose} className="cancel-btn">Cancel</button>
            <button 
              onClick={handleConfirmSelection}
              disabled={!selectedModel}
              className="select-btn"
            >
              Select Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HuggingFaceModelBrowser;