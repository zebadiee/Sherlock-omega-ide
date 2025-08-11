/**
 * Sensor Registry for Sherlock Ω Omniscient Monitoring System
 * Manages all sensors and provides centralized control
 */

import { SensorInterface, SensorType, SensorResult } from '../types/core';
import { BaseSensor } from './BaseSensor';

/**
 * Registry configuration for sensor management
 */
export interface SensorRegistryConfig {
  autoStart: boolean;
  healthCheckInterval: number; // milliseconds
  maxConcurrentSensors: number;
  enableQuantumEntanglement: boolean;
}

/**
 * Default registry configuration
 */
export const DEFAULT_REGISTRY_CONFIG: SensorRegistryConfig = {
  autoStart: true,
  healthCheckInterval: 30000, // 30 seconds
  maxConcurrentSensors: 10,
  enableQuantumEntanglement: true
};

/**
 * Sensor registration information
 */
export interface SensorRegistration {
  sensor: SensorInterface;
  registeredAt: number;
  priority: number;
  dependencies: SensorType[];
  quantumEntangled: boolean;
}

/**
 * Registry health status
 */
export interface RegistryHealth {
  totalSensors: number;
  activeSensors: number;
  healthySensors: number;
  failedSensors: number;
  averageResponseTime: number;
  quantumEntanglementActive: boolean;
  lastHealthCheck: number;
}

/**
 * Quantum entanglement state for sensor coordination
 */
export interface QuantumEntanglementState {
  entangledSensors: Set<SensorType>;
  correlationMatrix: Map<SensorType, Map<SensorType, number>>;
  interferencePatterns: Array<{
    sensors: SensorType[];
    pattern: string;
    strength: number;
  }>;
}

/**
 * Central registry for managing all sensors in the omniscient monitoring system
 * Implements quantum entanglement for coordinated sensor behavior
 */
export class SensorRegistry {
  private sensors: Map<SensorType, SensorRegistration> = new Map();
  private config: SensorRegistryConfig;
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private quantumState: QuantumEntanglementState;
  private isInitialized: boolean = false;

  constructor(config: Partial<SensorRegistryConfig> = {}) {
    this.config = { ...DEFAULT_REGISTRY_CONFIG, ...config };
    this.quantumState = {
      entangledSensors: new Set(),
      correlationMatrix: new Map(),
      interferencePatterns: []
    };
  }

  /**
   * Initialize the sensor registry
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔧 Initializing Sensor Registry...');

    // Start health monitoring
    this.startHealthMonitoring();

    // Initialize quantum entanglement if enabled
    if (this.config.enableQuantumEntanglement) {
      await this.initializeQuantumEntanglement();
    }

    this.isInitialized = true;
    console.log('✅ Sensor Registry initialized');
  }

  /**
   * Register a sensor with the registry
   */
  public registerSensor(
    sensor: SensorInterface,
    priority: number = 1,
    dependencies: SensorType[] = [],
    quantumEntangled: boolean = true
  ): void {
    if (this.sensors.has(sensor.type)) {
      throw new Error(`Sensor ${sensor.type} is already registered`);
    }

    if (this.sensors.size >= this.config.maxConcurrentSensors) {
      throw new Error(`Maximum number of sensors (${this.config.maxConcurrentSensors}) reached`);
    }

    const registration: SensorRegistration = {
      sensor,
      registeredAt: Date.now(),
      priority,
      dependencies,
      quantumEntangled
    };

    this.sensors.set(sensor.type, registration);

    // Add to quantum entanglement if enabled
    if (quantumEntangled && this.config.enableQuantumEntanglement) {
      this.entangleSensor(sensor.type);
    }

    // Auto-start if configured
    if (this.config.autoStart && sensor instanceof BaseSensor) {
      sensor.startMonitoring();
    }

    console.log(`📡 Registered ${sensor.type} sensor (priority: ${priority})`);
  }

  /**
   * Unregister a sensor from the registry
   */
  public unregisterSensor(sensorType: SensorType): boolean {
    const registration = this.sensors.get(sensorType);
    if (!registration) {
      return false;
    }

    // Stop monitoring if it's a BaseSensor
    if (registration.sensor instanceof BaseSensor) {
      registration.sensor.stopMonitoring();
    }

    // Remove from quantum entanglement
    this.disentangleSensor(sensorType);

    // Remove from registry
    this.sensors.delete(sensorType);

    console.log(`📡 Unregistered ${sensorType} sensor`);
    return true;
  }

  /**
   * Get a registered sensor by type
   */
  public getSensor(sensorType: SensorType): SensorInterface | undefined {
    return this.sensors.get(sensorType)?.sensor;
  }

  /**
   * Get all registered sensors
   */
  public getAllSensors(): SensorInterface[] {
    return Array.from(this.sensors.values()).map(reg => reg.sensor);
  }

  /**
   * Get sensors by priority (highest first)
   */
  public getSensorsByPriority(): SensorInterface[] {
    return Array.from(this.sensors.values())
      .sort((a, b) => b.priority - a.priority)
      .map(reg => reg.sensor);
  }

  /**
   * Start all registered sensors
   */
  public startAllSensors(): void {
    const sortedSensors = this.getSensorsByPriority();
    
    for (const sensor of sortedSensors) {
      if (sensor instanceof BaseSensor) {
        sensor.startMonitoring();
      }
    }

    console.log(`🚀 Started ${sortedSensors.length} sensors`);
  }

  /**
   * Stop all registered sensors
   */
  public stopAllSensors(): void {
    for (const registration of this.sensors.values()) {
      if (registration.sensor instanceof BaseSensor) {
        registration.sensor.stopMonitoring();
      }
    }

    console.log('⏹️ Stopped all sensors');
  }

  /**
   * Get registry health status
   */
  public getHealth(): RegistryHealth {
    const sensors = Array.from(this.sensors.values());
    const totalSensors = sensors.length;
    
    let activeSensors = 0;
    let healthySensors = 0;
    let failedSensors = 0;
    let totalResponseTime = 0;

    for (const registration of sensors) {
      const sensor = registration.sensor;
      
      if (sensor instanceof BaseSensor) {
        const status = sensor.getStatus();
        const metrics = sensor.getMetrics();
        
        if (status === 'ACTIVE') activeSensors++;
        if (sensor.isHealthy()) healthySensors++;
        if (status === 'FAILED') failedSensors++;
        
        totalResponseTime += metrics.averageResponseTime;
      }
    }

    return {
      totalSensors,
      activeSensors,
      healthySensors,
      failedSensors,
      averageResponseTime: totalSensors > 0 ? totalResponseTime / totalSensors : 0,
      quantumEntanglementActive: this.config.enableQuantumEntanglement,
      lastHealthCheck: Date.now()
    };
  }

  /**
   * Monitor all sensors and collect results
   */
  public async monitorAll(): Promise<Map<SensorType, SensorResult>> {
    const results = new Map<SensorType, SensorResult>();
    const monitoringPromises: Promise<void>[] = [];

    for (const [sensorType, registration] of this.sensors) {
      const promise = registration.sensor.monitor()
        .then(result => {
          results.set(sensorType, result);
        })
        .catch(error => {
          console.error(`Sensor ${sensorType} monitoring failed:`, error);
          // Create error result
          results.set(sensorType, {
            timestamp: Date.now(),
            status: 'CRITICAL',
            issues: [],
            metrics: { error: error.message }
          });
        });

      monitoringPromises.push(promise);
    }

    // Wait for all sensors to complete
    await Promise.all(monitoringPromises);

    // Apply quantum interference if enabled
    if (this.config.enableQuantumEntanglement) {
      this.applyQuantumInterference(results);
    }

    return results;
  }

  /**
   * Shutdown the registry
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Sensor Registry...');

    // Stop all sensors
    this.stopAllSensors();

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Clear quantum entanglement
    this.quantumState.entangledSensors.clear();
    this.quantumState.correlationMatrix.clear();
    this.quantumState.interferencePatterns = [];

    // Clear sensors
    this.sensors.clear();

    this.isInitialized = false;
    console.log('✅ Sensor Registry shutdown complete');
  }

  // Private methods

  /**
   * Start health monitoring for all sensors
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all sensors
   */
  private performHealthCheck(): void {
    const health = this.getHealth();
    
    if (health.failedSensors > 0) {
      console.warn(`⚠️ Health check: ${health.failedSensors} sensors failed`);
    }

    // Log health summary
    console.log(`💓 Health: ${health.healthySensors}/${health.totalSensors} healthy, avg response: ${health.averageResponseTime.toFixed(2)}ms`);
  }

  /**
   * Initialize quantum entanglement system
   */
  private async initializeQuantumEntanglement(): Promise<void> {
    console.log('🌌 Initializing quantum entanglement...');
    
    // Initialize correlation matrix
    for (const sensorType of this.sensors.keys()) {
      this.quantumState.correlationMatrix.set(sensorType, new Map());
    }

    console.log('✨ Quantum entanglement initialized');
  }

  /**
   * Add sensor to quantum entanglement
   */
  private entangleSensor(sensorType: SensorType): void {
    this.quantumState.entangledSensors.add(sensorType);
    
    // Initialize correlations with other entangled sensors
    const correlations = new Map<SensorType, number>();
    for (const otherSensor of this.quantumState.entangledSensors) {
      if (otherSensor !== sensorType) {
        correlations.set(otherSensor, 0.5); // Initial neutral correlation
      }
    }
    
    this.quantumState.correlationMatrix.set(sensorType, correlations);
    
    console.log(`🔗 Entangled ${sensorType} sensor`);
  }

  /**
   * Remove sensor from quantum entanglement
   */
  private disentangleSensor(sensorType: SensorType): void {
    this.quantumState.entangledSensors.delete(sensorType);
    this.quantumState.correlationMatrix.delete(sensorType);
    
    // Remove correlations from other sensors
    for (const correlations of this.quantumState.correlationMatrix.values()) {
      correlations.delete(sensorType);
    }
    
    console.log(`🔓 Disentangled ${sensorType} sensor`);
  }

  /**
   * Apply quantum interference patterns to sensor results
   */
  private applyQuantumInterference(results: Map<SensorType, SensorResult>): void {
    // Analyze interference patterns between entangled sensors
    const patterns: Array<{
      sensors: SensorType[];
      pattern: string;
      strength: number;
    }> = [];

    // Look for correlated issues across sensors
    const criticalSensors = Array.from(results.entries())
      .filter(([_, result]) => result.status === 'CRITICAL')
      .map(([sensorType, _]) => sensorType);

    if (criticalSensors.length > 1) {
      patterns.push({
        sensors: criticalSensors,
        pattern: 'CRITICAL_CORRELATION',
        strength: criticalSensors.length / results.size
      });
    }

    this.quantumState.interferencePatterns = patterns;
  }
}