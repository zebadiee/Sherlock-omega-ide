/**
 * Test suite for SensorRegistry
 * Tests sensor registration, coordination, and lifecycle management
 */

import { SensorRegistry, SensorEventType } from '../SensorRegistry';
import { BaseSensor } from '../BaseSensor';
import { SensorType, SensorResult, SensorStatus } from '@types/core';

// Test sensor implementations
class TestSensorA extends BaseSensor {
  constructor() {
    super(SensorType.SYNTAX);
  }

  protected async performMonitoring(): Promise<SensorResult> {
    return this.createSensorResult('HEALTHY', [], { testValue: 1 });
  }
}

class TestSensorB extends BaseSensor {
  constructor() {
    super(SensorType.DEPENDENCY);
  }

  protected async performMonitoring(): Promise<SensorResult> {
    return this.createSensorResult('HEALTHY', [], { testValue: 2 });
  }
}

class TestSensorC extends BaseSensor {
  constructor() {
    super(SensorType.PERFORMANCE);
  }

  protected async performMonitoring(): Promise<SensorResult> {
    return this.createSensorResult('WARNING', [], { testValue: 3 });
  }
}

describe('SensorRegistry', () => {
  let registry: SensorRegistry;
  let sensorA: TestSensorA;
  let sensorB: TestSensorB;
  let sensorC: TestSensorC;

  beforeEach(() => {
    registry = new SensorRegistry();
    sensorA = new TestSensorA();
    sensorB = new TestSensorB();
    sensorC = new TestSensorC();
  });

  afterEach(async () => {
    await registry.stopAllSensors();
  });

  describe('Sensor Registration', () => {
    test('should register sensor successfully', () => {
      registry.registerSensor(sensorA);
      
      const retrievedSensor = registry.getSensor(SensorType.SYNTAX);
      expect(retrievedSensor).toBe(sensorA);
    });

    test('should register sensor with options', () => {
      registry.registerSensor(sensorA, {
        priority: 5,
        dependencies: [],
        tags: ['critical', 'realtime']
      });

      const retrievedSensor = registry.getSensor(SensorType.SYNTAX);
      expect(retrievedSensor).toBe(sensorA);
    });

    test('should not allow duplicate sensor types', () => {
      registry.registerSensor(sensorA);
      
      expect(() => {
        registry.registerSensor(new TestSensorA());
      }).toThrow('Sensor type SYNTAX is already registered');
    });

    test('should validate dependencies exist', () => {
      expect(() => {
        registry.registerSensor(sensorA, {
          dependencies: [SensorType.DEPENDENCY] // Not registered yet
        });
      }).toThrow('Dependency sensor DEPENDENCY is not registered');
    });

    test('should register sensors with valid dependencies', () => {
      registry.registerSensor(sensorB); // Register dependency first
      registry.registerSensor(sensorA, {
        dependencies: [SensorType.DEPENDENCY]
      });

      expect(registry.getSensor(SensorType.SYNTAX)).toBe(sensorA);
      expect(registry.getSensor(SensorType.DEPENDENCY)).toBe(sensorB);
    });
  });

  describe('Sensor Unregistration', () => {
    test('should unregister sensor successfully', () => {
      registry.registerSensor(sensorA);
      registry.unregisterSensor(SensorType.SYNTAX);
      
      expect(registry.getSensor(SensorType.SYNTAX)).toBeUndefined();
    });

    test('should not allow unregistering non-existent sensor', () => {
      expect(() => {
        registry.unregisterSensor(SensorType.SYNTAX);
      }).toThrow('Sensor type SYNTAX is not registered');
    });

    test('should not allow unregistering sensor with dependents', () => {
      registry.registerSensor(sensorB);
      registry.registerSensor(sensorA, {
        dependencies: [SensorType.DEPENDENCY]
      });

      expect(() => {
        registry.unregisterSensor(SensorType.DEPENDENCY);
      }).toThrow('Cannot unregister DEPENDENCY - it has dependents: SYNTAX');
    });

    test('should allow unregistering after removing dependents', () => {
      registry.registerSensor(sensorB);
      registry.registerSensor(sensorA, {
        dependencies: [SensorType.DEPENDENCY]
      });

      registry.unregisterSensor(SensorType.SYNTAX);
      registry.unregisterSensor(SensorType.DEPENDENCY);

      expect(registry.getSensor(SensorType.DEPENDENCY)).toBeUndefined();
    });
  });

  describe('Sensor Retrieval', () => {
    beforeEach(() => {
      registry.registerSensor(sensorA, { tags: ['critical'] });
      registry.registerSensor(sensorB, { tags: ['dependency'] });
      registry.registerSensor(sensorC, { tags: ['critical', 'performance'] });
    });

    test('should get all sensors', () => {
      const allSensors = registry.getAllSensors();
      
      expect(allSensors.size).toBe(3);
      expect(allSensors.get(SensorType.SYNTAX)).toBe(sensorA);
      expect(allSensors.get(SensorType.DEPENDENCY)).toBe(sensorB);
      expect(allSensors.get(SensorType.PERFORMANCE)).toBe(sensorC);
    });

    test('should get sensors by tag', () => {
      const criticalSensors = registry.getSensorsByTag('critical');
      
      expect(criticalSensors).toHaveLength(2);
      expect(criticalSensors).toContain(sensorA);
      expect(criticalSensors).toContain(sensorC);
    });

    test('should return empty array for non-existent tag', () => {
      const nonExistentSensors = registry.getSensorsByTag('nonexistent');
      expect(nonExistentSensors).toHaveLength(0);
    });
  });

  describe('Sensor Lifecycle Management', () => {
    beforeEach(() => {
      registry.registerSensor(sensorA);
      registry.registerSensor(sensorB);
      registry.registerSensor(sensorC);
    });

    test('should start all sensors', async () => {
      await registry.startAllSensors();
      
      expect(sensorA.getStatus()).toBe(SensorStatus.ACTIVE);
      expect(sensorB.getStatus()).toBe(SensorStatus.ACTIVE);
      expect(sensorC.getStatus()).toBe(SensorStatus.ACTIVE);
    });

    test('should stop all sensors', async () => {
      await registry.startAllSensors();
      await registry.stopAllSensors();
      
      expect(sensorA.getStatus()).toBe(SensorStatus.INACTIVE);
      expect(sensorB.getStatus()).toBe(SensorStatus.INACTIVE);
      expect(sensorC.getStatus()).toBe(SensorStatus.INACTIVE);
    });

    test('should start sensors in dependency order', async () => {
      // Unregister and re-register with dependencies
      registry.unregisterSensor(SensorType.SYNTAX);
      registry.unregisterSensor(SensorType.PERFORMANCE);
      
      registry.registerSensor(sensorA, {
        dependencies: [SensorType.DEPENDENCY]
      });
      registry.registerSensor(sensorC, {
        dependencies: [SensorType.DEPENDENCY, SensorType.SYNTAX]
      });

      await registry.startAllSensors();
      
      // All should be started despite dependencies
      expect(sensorA.getStatus()).toBe(SensorStatus.ACTIVE);
      expect(sensorB.getStatus()).toBe(SensorStatus.ACTIVE);
      expect(sensorC.getStatus()).toBe(SensorStatus.ACTIVE);
    });

    test('should detect circular dependencies', () => {
      // Create circular dependency
      registry.unregisterSensor(SensorType.SYNTAX);
      registry.unregisterSensor(SensorType.DEPENDENCY);
      
      registry.registerSensor(sensorB, {
        dependencies: [SensorType.SYNTAX]
      });

      expect(() => {
        registry.registerSensor(sensorA, {
          dependencies: [SensorType.DEPENDENCY]
        });
      }).toThrow('Dependency sensor SYNTAX is not registered');
    });
  });

  describe('Monitoring Coordination', () => {
    beforeEach(() => {
      registry.registerSensor(sensorA);
      registry.registerSensor(sensorB);
      registry.registerSensor(sensorC);
    });

    test('should monitor all sensors', async () => {
      const results = await registry.monitorAll();
      
      expect(results.size).toBe(3);
      expect(results.get(SensorType.SYNTAX)).toBeDefined();
      expect(results.get(SensorType.DEPENDENCY)).toBeDefined();
      expect(results.get(SensorType.PERFORMANCE)).toBeDefined();
    });

    test('should handle monitoring failures gracefully', async () => {
      // Make one sensor fail
      const originalPerformMonitoring = sensorA['performMonitoring'];
      sensorA['performMonitoring'] = async () => {
        throw new Error('Test monitoring failure');
      };

      const results = await registry.monitorAll();
      
      // Should still get results from other sensors
      expect(results.size).toBe(2);
      expect(results.get(SensorType.SYNTAX)).toBeUndefined();
      expect(results.get(SensorType.DEPENDENCY)).toBeDefined();
      expect(results.get(SensorType.PERFORMANCE)).toBeDefined();

      // Restore original method
      sensorA['performMonitoring'] = originalPerformMonitoring;
    });
  });

  describe('System Health Monitoring', () => {
    beforeEach(() => {
      registry.registerSensor(sensorA);
      registry.registerSensor(sensorB);
      registry.registerSensor(sensorC);
    });

    test('should report system health', async () => {
      // Generate some monitoring data
      await sensorA.monitor();
      await sensorB.monitor();
      await sensorC.monitor();

      const health = registry.getSystemHealth();
      
      expect(health.sensorCount).toBe(3);
      expect(health.healthySensors).toBe(2); // A and B are healthy
      expect(health.warningSensors).toBe(1); // C returns WARNING
      expect(health.criticalSensors).toBe(0);
      expect(health.failedSensors).toBe(0);
      expect(health.overall).toBe('WARNING'); // Due to sensor C
    });

    test('should report critical health with failed sensors', async () => {
      // Make sensor A unhealthy
      const originalIsHealthy = sensorA.isHealthy;
      sensorA.isHealthy = () => false;

      const health = registry.getSystemHealth();
      
      expect(health.failedSensors).toBe(1);
      expect(health.overall).toBe('CRITICAL');

      // Restore original method
      sensorA.isHealthy = originalIsHealthy;
    });
  });

  describe('Event System', () => {
    test('should emit registration events', (done) => {
      registry.addEventListener(SensorEventType.REGISTERED, (event) => {
        expect(event.type).toBe(SensorEventType.REGISTERED);
        expect(event.sensorType).toBe(SensorType.SYNTAX);
        expect(event.data).toEqual({
          priority: 1,
          dependencies: [],
          tags: []
        });
        done();
      });

      registry.registerSensor(sensorA);
    });

    test('should emit unregistration events', (done) => {
      registry.registerSensor(sensorA);

      registry.addEventListener(SensorEventType.UNREGISTERED, (event) => {
        expect(event.type).toBe(SensorEventType.UNREGISTERED);
        expect(event.sensorType).toBe(SensorType.SYNTAX);
        done();
      });

      registry.unregisterSensor(SensorType.SYNTAX);
    });

    test('should emit start/stop events', async () => {
      registry.registerSensor(sensorA);

      const events: any[] = [];
      registry.addEventListener(SensorEventType.STARTED, (event) => {
        events.push(event);
      });
      registry.addEventListener(SensorEventType.STOPPED, (event) => {
        events.push(event);
      });

      await registry.startAllSensors();
      await registry.stopAllSensors();

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe(SensorEventType.STARTED);
      expect(events[1].type).toBe(SensorEventType.STOPPED);
    });

    test('should remove event listeners', () => {
      const listener = jest.fn();
      
      registry.addEventListener(SensorEventType.REGISTERED, listener);
      registry.removeEventListener(SensorEventType.REGISTERED, listener);
      
      registry.registerSensor(sensorA);
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = () => {
        throw new Error('Listener error');
      };

      registry.addEventListener(SensorEventType.REGISTERED, errorListener);
      
      // Should not throw despite listener error
      expect(() => {
        registry.registerSensor(sensorA);
      }).not.toThrow();
    });
  });
});