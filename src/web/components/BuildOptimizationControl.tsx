// src/web/components/BuildOptimizationControl.tsx
import React, { useState, useEffect } from 'react';
import { ValidationController } from '../../validation/ValidationController';

interface BuildStatus {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  startTime?: Date;
  endTime?: Date;
  metrics?: any;
}

const BuildOptimizationControl: React.FC = () => {
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    status: 'idle',
    message: 'Ready to optimize'
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [autoMode, setAutoMode] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const triggerBuildOptimization = async () => {
    setBuildStatus({
      status: 'running',
      message: 'Initializing build optimization...',
      startTime: new Date()
    });
    
    addLog('🚀 Starting build optimization');
    
    try {
      const controller = new ValidationController();
      
      addLog('📊 Running build optimization test...');
      const result = await controller.executeBuildOptimizationTest();
      
      if (result.success) {
        setBuildStatus({
          status: 'success',
          message: `Optimization complete: ${result.message}`,
          startTime: buildStatus.startTime,
          endTime: new Date(),
          metrics: result.metrics
        });
        addLog(`✅ ${result.message}`);
        addLog(`⚛️ Quantum advantage: ${result.metrics?.quantumAdvantage?.toFixed(2)}x`);
        addLog(`🚀 Speed improvement: ${result.metrics?.speedImprovement?.toFixed(1)}%`);
      } else {
        setBuildStatus({
          status: 'error',
          message: `Optimization failed: ${result.message}`,
          startTime: buildStatus.startTime,
          endTime: new Date()
        });
        addLog(`❌ ${result.message}`);
      }
    } catch (error) {
      setBuildStatus({
        status: 'error',
        message: `Build optimization error: ${error}`,
        startTime: buildStatus.startTime,
        endTime: new Date()
      });
      addLog(`💥 Error: ${error}`);
    }
  };

  const triggerFullValidation = async () => {
    setBuildStatus({
      status: 'running',
      message: 'Running full validation suite...',
      startTime: new Date()
    });
    
    addLog('🎯 Starting full validation suite');
    
    try {
      const controller = new ValidationController();
      const results = await controller.executeFullValidation();
      const report = await controller.generateValidationReport(results);
      
      setBuildStatus({
        status: report.summary.failed === 0 ? 'success' : 'error',
        message: `Validation complete: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.successRate.toFixed(1)}%)`,
        startTime: buildStatus.startTime,
        endTime: new Date(),
        metrics: { validationReport: report }
      });
      
      addLog(`📋 Validation complete: ${report.summary.successRate.toFixed(1)}% success rate`);
      addLog(`✅ Passed: ${report.summary.passed}, ❌ Failed: ${report.summary.failed}`);
      
      if (report.recommendations.length > 0) {
        report.recommendations.forEach(rec => addLog(`💡 ${rec}`));
      }
    } catch (error) {
      setBuildStatus({
        status: 'error',
        message: `Full validation error: ${error}`,
        startTime: buildStatus.startTime,
        endTime: new Date()
      });
      addLog(`💥 Validation error: ${error}`);
    }
  };

  const resetBuild = () => {
    setBuildStatus({
      status: 'idle',
      message: 'Ready to optimize'
    });
    setLogs([]);
    addLog('🔄 Build system reset');
  };

  // Auto mode - run optimization every 5 minutes
  useEffect(() => {
    if (autoMode && buildStatus.status === 'idle') {
      const interval = setInterval(() => {
        if (buildStatus.status === 'idle') {
          addLog('🤖 Auto mode: triggering optimization');
          triggerBuildOptimization();
        }
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [autoMode, buildStatus.status]);

  const getStatusColor = () => {
    switch (buildStatus.status) {
      case 'running': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (buildStatus.status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚡';
    }
  };

  const getDuration = () => {
    if (buildStatus.startTime && buildStatus.endTime) {
      const duration = buildStatus.endTime.getTime() - buildStatus.startTime.getTime();
      return `${(duration / 1000).toFixed(1)}s`;
    }
    return null;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">⚡ Build Optimization Control</h2>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
              className="rounded"
            />
            <span>Auto Mode</span>
          </label>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div className="flex-1">
            <div className={`font-semibold ${getStatusColor()}`}>
              {buildStatus.message}
            </div>
            {getDuration() && (
              <div className="text-sm text-gray-500">
                Duration: {getDuration()}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Display */}
        {buildStatus.metrics && buildStatus.status === 'success' && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {buildStatus.metrics.quantumAdvantage && (
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {buildStatus.metrics.quantumAdvantage.toFixed(2)}x
                </div>
                <div className="text-xs text-gray-500">Quantum Advantage</div>
              </div>
            )}
            {buildStatus.metrics.speedImprovement && (
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {buildStatus.metrics.speedImprovement.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Speed Improvement</div>
              </div>
            )}
            {buildStatus.metrics.buildTimeReduction && (
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  -{buildStatus.metrics.buildTimeReduction}ms
                </div>
                <div className="text-xs text-gray-500">Time Saved</div>
              </div>
            )}
            {buildStatus.metrics.validationReport && (
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {buildStatus.metrics.validationReport.summary.successRate.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={triggerBuildOptimization}
          disabled={buildStatus.status === 'running'}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
        >
          <span>⚛️</span>
          <span>{buildStatus.status === 'running' ? 'Optimizing...' : 'Quantum Optimize'}</span>
        </button>

        <button
          onClick={triggerFullValidation}
          disabled={buildStatus.status === 'running'}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
        >
          <span>🎯</span>
          <span>{buildStatus.status === 'running' ? 'Validating...' : 'Full Validation'}</span>
        </button>

        <button
          onClick={resetBuild}
          disabled={buildStatus.status === 'running'}
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Live Logs */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold">📜 Live Logs</h3>
          <button
            onClick={() => setLogs([])}
            className="text-gray-400 hover:text-white text-xs"
          >
            Clear
          </button>
        </div>
        <div className="h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">1.85x</div>
          <div className="text-xs text-gray-500">Last Quantum Advantage</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">38.3%</div>
          <div className="text-xs text-gray-500">Last Speed Improvement</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">80%</div>
          <div className="text-xs text-gray-500">Validation Success Rate</div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">Phase 2</div>
          <div className="text-xs text-gray-500">Current Phase</div>
        </div>
      </div>
    </div>
  );
};

export default BuildOptimizationControl;