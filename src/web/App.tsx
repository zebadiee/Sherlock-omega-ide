// src/web/App.tsx
import React, { useState } from 'react';
import ValidationDashboard from './components/ValidationDashboard';
import QuantumErrorCorrectionVisualizer from './components/QuantumErrorCorrectionVisualizer';
import './styles.css';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'visualizer'>('dashboard');

  return (
    <div className="App">
      {/* Navigation */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">🚀 Sherlock Ω IDE - Quantum Enhanced</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded ${
                activeView === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveView('visualizer')}
              className={`px-4 py-2 rounded ${
                activeView === 'visualizer' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
            >
              ⚛️ Quantum Visualizer
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-screen bg-gray-100">
        {activeView === 'dashboard' && <ValidationDashboard />}
        {activeView === 'visualizer' && (
          <div className="p-6">
            <QuantumErrorCorrectionVisualizer />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;