// src/web/App.tsx
import React from 'react';
import ValidationDashboard from './components/ValidationDashboard';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <ValidationDashboard />
    </div>
  );
};

export default App;