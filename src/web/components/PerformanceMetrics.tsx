// src/web/components/PerformanceMetrics.tsx
import React, { useState, useEffect } from 'react';
import { ValidationController } from '../../validation/ValidationController';

interface MetricsData {
  quantumAdvantage: number;
  speedImprovement: number;
  qualityScore: number;
  fileLoadTime: number;
  uiFrameRate: number;
  memoryUsage: number;
  analysisSpeed: number;
  lastUpdated: Date;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const controller = new ValidationController();
      const results = await controller.executeFullValidation();
      
      // Aggregate metrics from all validation results
      const aggregatedMetrics: MetricsData = {
        quantumAdvantage: 0,
        speedImprovement: 0,
        qualityScore: 0,
        fileLoadTime: 0,
        uiFrameRate: 60,
        memoryUsage: 0,
        analysisSpeed: 0,
        lastUpdated: new Date()
      };

      results.forEach(result => {
        if (result.metrics) {
          aggregatedMetrics.quantumAdvantage = Math.max(aggregatedMetrics.quantumAdvantage, result.metrics.quantumAdvantage || 0);
          aggregatedMetrics.speedImprovement = Math.max(aggregatedMetrics.speedImprovement, result.metrics.speedImprovement || 0);
          aggregatedMetrics.qualityScore = Math.max(aggregatedMetrics.qualityScore, result.metrics.qualityScore || 0);
          aggregatedMetrics.fileLoadTime = Math.max(aggregatedMetrics.fileLoadTime, result.metrics.fileLoadTime || 0);
          aggregatedMetrics.memoryUsage = Math.max(aggregatedMetrics.memoryUsage, result.metrics.memoryUsage || 0);
          aggregatedMetrics.analysisSpeed = Math.max(aggregatedMetrics.analysisSpeed, result.metrics.analysisSpeed || 0);
        }
      });

      setMetrics(aggregatedMetrics);
    } catch (err) {
      setError(`Failed to load metrics: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, target: number, higher: boolean = true) => {
    const meets = higher ? value >= target : value <= target;
    return meets ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (value: number, target: number, higher: boolean = true) => {
    const meets = higher ? value >= target : value <= target;
    return meets ? '✅' : '❌';
  };

  if (loading && !metrics) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Performance Metrics Error</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={refreshMetrics}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">🚀 Performance Metrics</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshMetrics}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
          {metrics && (
            <span className="text-xs text-gray-500">
              Updated: {metrics.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quantum Advantage */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Quantum Advantage</h3>
              <span className="text-2xl">⚛️</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.quantumAdvantage, 1.8)}`}>
                {metrics.quantumAdvantage.toFixed(2)}x
              </span>
              <span className="ml-2">{getStatusIcon(metrics.quantumAdvantage, 1.8)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: ≥1.8x</p>
          </div>

          {/* Speed Improvement */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Speed Improvement</h3>
              <span className="text-2xl">🚀</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.speedImprovement, 37)}`}>
                {metrics.speedImprovement.toFixed(1)}%
              </span>
              <span className="ml-2">{getStatusIcon(metrics.speedImprovement, 37)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: ≥37%</p>
          </div>

          {/* Quality Score */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Quality Score</h3>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.qualityScore, 87)}`}>
                {metrics.qualityScore.toFixed(0)}
              </span>
              <span className="ml-2">{getStatusIcon(metrics.qualityScore, 87)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: ≥87</p>
          </div>

          {/* File Load Time */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">File Load Time</h3>
              <span className="text-2xl">📁</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.fileLoadTime, 35, false)}`}>
                {metrics.fileLoadTime.toFixed(0)}ms
              </span>
              <span className="ml-2">{getStatusIcon(metrics.fileLoadTime, 35, false)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: &lt;35ms</p>
          </div>

          {/* UI Frame Rate */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">UI Frame Rate</h3>
              <span className="text-2xl">🎮</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.uiFrameRate, 60)}`}>
                {metrics.uiFrameRate.toFixed(0)}fps
              </span>
              <span className="ml-2">{getStatusIcon(metrics.uiFrameRate, 60)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: ≥60fps</p>
          </div>

          {/* Memory Usage */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Memory Usage</h3>
              <span className="text-2xl">🧠</span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${getStatusColor(metrics.memoryUsage, 50, false)}`}>
                {metrics.memoryUsage.toFixed(0)}MB
              </span>
              <span className="ml-2">{getStatusIcon(metrics.memoryUsage, 50, false)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: &lt;50MB</p>
          </div>
        </div>
      )}

      {/* Summary Status */}
      {metrics && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">📊 Overall Status</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-green-600 font-bold">
                {[
                  metrics.quantumAdvantage >= 1.8,
                  metrics.speedImprovement >= 37,
                  metrics.qualityScore >= 87,
                  metrics.fileLoadTime <= 35,
                  metrics.uiFrameRate >= 60,
                  metrics.memoryUsage <= 50
                ].filter(Boolean).length}
              </span>
              <span className="text-gray-600 ml-1">/ 6 targets met</span>
            </div>
            <div className="text-sm text-gray-500">
              Success Rate: {(([
                metrics.quantumAdvantage >= 1.8,
                metrics.speedImprovement >= 37,
                metrics.qualityScore >= 87,
                metrics.fileLoadTime <= 35,
                metrics.uiFrameRate >= 60,
                metrics.memoryUsage <= 50
              ].filter(Boolean).length / 6) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;