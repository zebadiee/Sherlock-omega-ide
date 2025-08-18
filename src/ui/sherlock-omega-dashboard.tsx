/**
 * SHERLOCK Ω DASHBOARD - Main User Interface
 * 
 * The central command center for the autonomous development environment.
 * Provides real-time monitoring, evolution management, and system control.
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  Square, 
  Settings,
  BarChart3,
  Zap,
  Eye,
  GitBranch,
  Code,
  TestTube
} from 'lucide-react';

// Types for the dashboard
interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'safe_mode';
  uptime: string;
  components: {
    safety: string;
    evolution: string;
    ai: string;
    monitoring: string;
  };
  metrics: {
    safetySuccessRate: string;
    evolutionSuccessRate: string;
    totalOperations: number;
  };
}

interface EvolutionRequest {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'blocked' | 'processing';
  timestamp: Date;
  reason?: string;
}

interface SafetyMetrics {
  validations: number;
  blocked: number;
  coverage: number;
  confidence: number;
}

// Status indicator component
const StatusIndicator: React.FC<{ status: string; label: string }> = ({ status, label }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': case 'online': case 'approved': return 'text-green-500';
      case 'degraded': case 'warning': case 'pending': return 'text-yellow-500';
      case 'critical': case 'blocked': case 'error': return 'text-red-500';
      case 'safe_mode': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': case 'online': case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': case 'warning': case 'pending': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': case 'blocked': case 'error': return <XCircle className="w-4 h-4" />;
      case 'safe_mode': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="font-medium">{label}</span>
    </div>
  );
};

// Main dashboard component
export const SherlockOmegaDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    uptime: '0s',
    components: {
      safety: '0 validations, 0 blocked',
      evolution: '0 processed, 0 successful', 
      ai: '0 requests processed',
      monitoring: 'HEALTHY'
    },
    metrics: {
      safetySuccessRate: '100.0%',
      evolutionSuccessRate: '100.0%',
      totalOperations: 0
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [evolutions, setEvolutions] = useState<EvolutionRequest[]>([]);
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    validations: 0,
    blocked: 0,
    coverage: 95.0,
    confidence: 0.9
  });

  // Mock system control functions
  const startSystem = async () => {
    setIsRunning(true);
    // Simulate system startup
    setTimeout(() => {
      setSystemStatus(prev => ({
        ...prev,
        overall: 'healthy',
        uptime: '1m 23s'
      }));
    }, 1000);
  };

  const stopSystem = async () => {
    setIsRunning(false);
    setSystemStatus(prev => ({
      ...prev,
      overall: 'healthy',
      uptime: '0s'
    }));
  };

  const enterSafeMode = async () => {
    setIsSafeMode(true);
    setSystemStatus(prev => ({
      ...prev,
      overall: 'safe_mode'
    }));
  };

  const exitSafeMode = async () => {
    setIsSafeMode(false);
    setSystemStatus(prev => ({
      ...prev,
      overall: 'healthy'
    }));
  };

  const requestEvolution = (description: string, priority: EvolutionRequest['priority']) => {
    const newEvolution: EvolutionRequest = {
      id: `evo-${Date.now()}`,
      description,
      priority,
      status: 'pending',
      timestamp: new Date()
    };

    setEvolutions(prev => [newEvolution, ...prev]);

    // Simulate processing
    setTimeout(() => {
      const isUnsafe = description.includes('without tests') || 
                      description.includes('complex') ||
                      description.includes('risky');
      
      const finalStatus = isUnsafe ? 'blocked' : 'approved';
      const reason = isUnsafe ? 'Safety validation failed - insufficient test coverage' : undefined;

      setEvolutions(prev => 
        prev.map(evo => 
          evo.id === newEvolution.id 
            ? { ...evo, status: finalStatus, reason }
            : evo
        )
      );

      // Update metrics
      setSafetyMetrics(prev => ({
        ...prev,
        validations: prev.validations + 1,
        blocked: isUnsafe ? prev.blocked + 1 : prev.blocked
      }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">SHERLOCK Ω</h1>
            </div>
            <div className="text-sm text-gray-400">
              Autonomous Development Environment
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <StatusIndicator 
              status={systemStatus.overall} 
              label={systemStatus.overall.toUpperCase()} 
            />
            <div className="text-sm text-gray-400">
              Uptime: {systemStatus.uptime}
            </div>
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={startSystem}
          disabled={isRunning}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Start System</span>
        </button>
        
        <button
          onClick={stopSystem}
          disabled={!isRunning}
          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition-colors"
        >
          <Square className="w-4 h-4" />
          <span>Stop System</span>
        </button>
        
        <button
          onClick={isSafeMode ? exitSafeMode : enterSafeMode}
          className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
            isSafeMode 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{isSafeMode ? 'Exit Safe Mode' : 'Enter Safe Mode'}</span>
        </button>
        
        <button className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Components Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">System Components</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Safety Validation</span>
              </div>
              <StatusIndicator status="healthy" label="ONLINE" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span>Evolution Engine</span>
              </div>
              <StatusIndicator status={isRunning ? "healthy" : "offline"} label={isRunning ? "ONLINE" : "OFFLINE"} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-pink-400" />
                <span>AI Orchestrator</span>
              </div>
              <StatusIndicator status={isRunning ? "healthy" : "offline"} label={isRunning ? "ONLINE" : "OFFLINE"} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span>Monitoring</span>
              </div>
              <StatusIndicator status="healthy" label="ONLINE" />
            </div>
          </div>
        </div>

        {/* Safety Metrics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">Safety Metrics</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Validations</span>
              <span className="font-semibold">{safetyMetrics.validations}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Blocked Deployments</span>
              <span className="font-semibold text-red-400">{safetyMetrics.blocked}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Success Rate</span>
              <span className="font-semibold text-green-400">
                {safetyMetrics.validations > 0 
                  ? ((safetyMetrics.validations - safetyMetrics.blocked) / safetyMetrics.validations * 100).toFixed(1)
                  : 100}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Coverage Threshold</span>
              <span className="font-semibold text-blue-400">{safetyMetrics.coverage}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Confidence Score</span>
              <span className="font-semibold text-purple-400">
                {(safetyMetrics.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Performance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Operations</span>
              <span className="font-semibold">{systemStatus.metrics.totalOperations}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Evolution Success</span>
              <span className="font-semibold text-green-400">{systemStatus.metrics.evolutionSuccessRate}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Safety Success</span>
              <span className="font-semibold text-blue-400">{systemStatus.metrics.safetySuccessRate}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Response Time</span>
              <span className="font-semibold text-purple-400">~150ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Memory Usage</span>
              <span className="font-semibold text-yellow-400">245MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Request Panel */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Request Evolution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold">Request Evolution</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => requestEvolution('Add user authentication with comprehensive tests', 'medium')}
                disabled={!isRunning || isSafeMode}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
              >
                Safe Feature
              </button>
              
              <button
                onClick={() => requestEvolution('Add payment processing without tests', 'high')}
                disabled={!isRunning || isSafeMode}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
              >
                Risky Feature
              </button>
              
              <button
                onClick={() => requestEvolution('Implement complex machine learning algorithm', 'medium')}
                disabled={!isRunning || isSafeMode}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
              >
                Complex Feature
              </button>
              
              <button
                onClick={() => requestEvolution('Add simple utility function with tests', 'low')}
                disabled={!isRunning || isSafeMode}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
              >
                Simple Utility
              </button>
            </div>
            
            {(!isRunning || isSafeMode) && (
              <div className="text-sm text-gray-400 text-center">
                {!isRunning ? 'Start system to request evolutions' : 'Exit safe mode to request evolutions'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Evolutions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Recent Evolutions</h2>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {evolutions.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No evolutions requested yet
              </div>
            ) : (
              evolutions.map((evolution) => (
                <div key={evolution.id} className="bg-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{evolution.id}</span>
                    <StatusIndicator status={evolution.status} label={evolution.status.toUpperCase()} />
                  </div>
                  
                  <div className="text-sm text-gray-300 mb-1">
                    {evolution.description}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Priority: {evolution.priority.toUpperCase()}</span>
                    <span>{evolution.timestamp.toLocaleTimeString()}</span>
                  </div>
                  
                  {evolution.reason && (
                    <div className="text-xs text-red-400 mt-1">
                      {evolution.reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};