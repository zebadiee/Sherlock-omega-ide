# Sherlock Ω Monitoring System

The monitoring system provides comprehensive performance tracking and alerting for the Sherlock Ω IDE, enabling proactive issue detection and self-healing capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Sherlock Ω Core System                  │
├─────────────────────────────────────────────────────────────┤
│                   MonitoringService                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PerformanceMonitor                     │    │
│  │  • Metric Collection                                │    │
│  │  • Threshold Monitoring                             │    │
│  │  • Alert Generation                                 │    │
│  │  • Data Export                                      │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Platform Layer                           │
│              (Web, Desktop, Hybrid)                         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### PerformanceMonitor

Core monitoring component that tracks various performance metrics:

- **Response Times**: API calls, user interactions, system operations
- **Resource Usage**: Memory, CPU, storage consumption
- **Business Metrics**: Evolution cycles, learning events, whisper deliveries
- **Error Tracking**: Error rates, failure counts
- **User Experience**: Interaction latency, suggestion quality

### MonitoringService

Integration layer that connects PerformanceMonitor with the Sherlock Ω system:

- **System Integration**: Implements SensorInterface for core system compatibility
- **Alert Management**: Processes and escalates performance alerts
- **Health Scoring**: Calculates overall system health metrics
- **Configuration Management**: Handles dynamic configuration updates

## Quick Start

### Basic Usage

```typescript
import { MonitoringService } from '@monitoring/monitoring-service';
import { PlatformType } from '@core/whispering-interfaces';

// Initialize monitoring service
const monitoringService = new MonitoringService({
  enabled: true,
  platform: PlatformType.WEB,
  alertThresholds: {
    responseTime: 1000,    // 1 second
    memoryUsage: 0.8,      // 80%
    errorRate: 0.05        // 5%
  },
  reportingInterval: 30000 // 30 seconds
});

// Start monitoring
await monitoringService.start();

// Record metrics
monitoringService.recordMetric('api_call', 250, MetricType.RESPONSE_TIME);

// Time operations
const result = await monitoringService.timeOperation('data_processing', async () => {
  return await processData();
});

// Check system health
const healthState = monitoringService.getPerformanceState();
console.log(`System health: ${(healthState.healthScore * 100).toFixed(1)}%`);
```

### Advanced Configuration

```typescript
import { PerformanceMonitor, MetricType } from '@monitoring/performance-monitor';

const monitor = new PerformanceMonitor(PlatformType.WEB, {
  enabled: true,
  sampleRate: 0.8,           // Sample 80% of metrics
  retentionPeriod: 3600000,  // 1 hour retention
  thresholds: [
    {
      metric: 'response_time',
      warning: 500,
      critical: 2000,
      action: 'alert'
    },
    {
      metric: 'memory_usage',
      warning: 0.7,
      critical: 0.9,
      action: 'throttle'
    }
  ],
  alerting: true,
  exportMetrics: true
});
```

## Metric Types

### Timing Metrics
- `RESPONSE_TIME`: API response times
- `EXECUTION_TIME`: Code execution duration
- `RENDER_TIME`: UI rendering performance

### Resource Metrics
- `MEMORY_USAGE`: Memory consumption
- `CPU_USAGE`: CPU utilization
- `STORAGE_USAGE`: Storage consumption

### Business Metrics
- `EVOLUTION_CYCLES`: System learning iterations
- `LEARNING_EVENTS`: Knowledge acquisition events
- `WHISPER_DELIVERIES`: Suggestion delivery count

### Error Metrics
- `ERROR_RATE`: Error occurrence rate
- `FAILURE_COUNT`: Total failure count

### User Experience Metrics
- `INTERACTION_LATENCY`: User interaction response time
- `SUGGESTION_QUALITY`: AI suggestion effectiveness

## Testing Strategy

### Unit Testing

Our testing strategy ensures robust monitoring with comprehensive coverage:

```typescript
describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  const monitors: PerformanceMonitor[] = [];

  beforeEach(() => {
    monitor = new PerformanceMonitor(PlatformType.WEB);
    monitors.push(monitor);
  });

  afterEach(() => {
    // Critical: Clean up all monitor instances
    monitors.forEach(m => m.stopCleanupInterval());
    monitors.length = 0;
  });

  afterAll(() => {
    // Safety net for Jest cleanup
    jest.clearAllTimers();
  });
});
```

### Key Testing Principles

1. **Resource Cleanup**: Always stop intervals and timers to prevent Jest hanging
2. **Instance Tracking**: Track all monitor instances for proper cleanup
3. **Async Testing**: Use proper async/await patterns for time-based tests
4. **Isolation**: Each test should be independent and not affect others

### Test Categories

#### Functional Tests
- Metric recording and retrieval
- Statistical calculations (average, median, percentiles)
- Alert generation and threshold monitoring
- Data export functionality

#### Integration Tests
- MonitoringService integration with PerformanceMonitor
- SensorInterface implementation
- Configuration management
- Health score calculation

#### Performance Tests
- High-load scenarios
- Continuous monitoring
- Memory leak detection
- Resource cleanup verification

### Running Tests

```bash
# Run all monitoring tests
npm test -- --testPathPattern=monitoring

# Run with coverage
npm run test:coverage -- --testPathPattern=monitoring

# Run specific test file
npm test -- performance-monitor.test.ts

# Debug open handles
npm test -- --detectOpenHandles
```

## Best Practices

### Development

1. **Always Clean Up Resources**
   ```typescript
   // In tests
   afterEach(() => {
     monitor.stopCleanupInterval();
   });
   
   // In production
   process.on('SIGTERM', () => {
     monitoringService.stop();
   });
   ```

2. **Use Appropriate Sampling**
   ```typescript
   // High-frequency operations
   const monitor = new PerformanceMonitor(platform, {
     sampleRate: 0.1 // Sample 10% to reduce overhead
   });
   ```

3. **Set Meaningful Thresholds**
   ```typescript
   const thresholds = [
     {
       metric: 'response_time',
       warning: 1000,  // 1s warning
       critical: 5000, // 5s critical
       action: 'alert'
     }
   ];
   ```

### Production Deployment

1. **Monitor the Monitor**: Set up external monitoring for the monitoring system
2. **Gradual Rollout**: Start with sampling and gradually increase coverage
3. **Alert Fatigue**: Tune thresholds to avoid excessive alerts
4. **Data Retention**: Configure appropriate retention periods for your use case

## Integration with Sherlock Ω

The monitoring system integrates seamlessly with Sherlock Ω's self-healing architecture:

### Sensor Integration
```typescript
// MonitoringService implements SensorInterface
const monitoringResult = await monitoringService.monitor();
// Result feeds into the omniscient development monitor
```

### Performance State Integration
```typescript
// Performance state is part of SystemState
interface SystemState {
  platform: PlatformType;
  resources: SystemResources;
  performance: PerformanceState; // ← Monitoring integration
  // ... other state
}
```

### Self-Healing Triggers
```typescript
// Critical alerts can trigger self-healing actions
const criticalAlerts = monitoringService.getCriticalAlerts();
if (criticalAlerts.length > 0) {
  // Trigger preventive action plan
  await omniscientMonitor.preventAllProblems(actionPlan);
}
```

## Contributing

### Adding New Metrics

1. Define the metric type in `MetricType` enum
2. Add appropriate thresholds in default configuration
3. Create tests for the new metric
4. Update documentation

### Extending MonitoringService

1. Follow the SensorInterface contract
2. Maintain backward compatibility
3. Add comprehensive tests
4. Update integration documentation

### Testing Guidelines

- Always clean up resources in tests
- Use realistic test data and scenarios
- Test both success and failure paths
- Verify performance under load
- Check for memory leaks and resource cleanup

## Troubleshooting

### Common Issues

**Jest Hanging / Open Handles**
```bash
# Diagnose
npm test -- --detectOpenHandles

# Fix: Ensure all intervals are stopped
afterEach(() => {
  monitor.stopCleanupInterval();
});
```

**High Memory Usage**
```typescript
// Reduce retention period
monitor.updateConfig({ retentionPeriod: 300000 }); // 5 minutes

// Increase sampling
monitor.updateConfig({ sampleRate: 0.5 }); // 50% sampling
```

**Missing Metrics**
```typescript
// Check if monitoring is enabled
const config = monitor.getConfig();
console.log('Monitoring enabled:', config.enabled);

// Verify sampling isn't too aggressive
console.log('Sample rate:', config.sampleRate);
```

## API Reference

See the TypeScript definitions in:
- `src/monitoring/performance-monitor.ts`
- `src/monitoring/monitoring-service.ts`
- `src/core/whispering-interfaces.ts`

For detailed API documentation, run:
```bash
npm run docs:generate
```