# 📚 Sherlock Ω API Documentation

Complete reference for integrating Sherlock Ω into your development workflow.

## Table of Contents

- [Core API](#core-api)
- [Configuration](#configuration)
- [Friction Detection](#friction-detection)
- [AI Integration](#ai-integration)
- [Analytics](#analytics)
- [Events](#events)
- [Types](#types)

## Core API

### `createSherlockOmega(config?: SherlockOmegaConfig)`

Creates a new Sherlock Ω instance with optional configuration.

```typescript
import { createSherlockOmega } from 'sherlock-omega-ide';

const sherlock = createSherlockOmega({
  features: {
    enableAI: true,
    enableAnalytics: true,
    enableRealTimeMonitoring: true
  }
});
```

**Returns:** `SherlockOmegaIntegration`

### `SherlockOmegaIntegration`

Main interface for interacting with Sherlock Ω.

#### Methods

##### `start(): Promise<void>`

Starts the Sherlock Ω system and begins monitoring.

```typescript
await sherlock.start();
console.log('🧠 Sherlock Ω is now active');
```

##### `stop(): Promise<void>`

Stops the system and cleans up resources.

```typescript
await sherlock.stop();
```

##### `getSystemStatus(): Promise<SystemStatus>`

Returns current system health and metrics.

```typescript
const status = await sherlock.getSystemStatus();
console.log(`Status: ${status.overall}`);
console.log(`Response Time: ${status.metrics.responseTime}ms`);
```

##### `runThoughtCompletion(context: CompletionContext): Promise<ThoughtCompletionResult>`

Executes AI-powered thought completion.

```typescript
const result = await sherlock.runThoughtCompletion({
  filePath: '/path/to/file.ts',
  content: 'const app = express();',
  cursorPosition: { line: 0, column: 20 },
  language: 'typescript'
});
```

##### `detectFriction(context: IntegratedContext): Promise<IntegratedProtocolResult>`

Runs comprehensive friction detection.

```typescript
const result = await sherlock.detectFriction({
  filePath: '/path/to/file.ts',
  content: fileContent,
  checkPackageJson: true,
  language: 'typescript'
});
```

##### `executeAction(actionId: string): Promise<ActionExecutionResult>`

Executes a specific friction elimination action.

```typescript
const result = await sherlock.executeAction('install-express-123');
if (result.success) {
  console.log('Action completed successfully');
}
```

## Configuration

### `SherlockOmegaConfig`

Main configuration interface for Sherlock Ω.

```typescript
interface SherlockOmegaConfig {
  features?: FeatureConfig;
  ai?: AIConfig;
  monitoring?: MonitoringConfig;
  analytics?: AnalyticsConfig;
  verification?: VerificationConfig;
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}
```

### `FeatureConfig`

Controls which features are enabled.

```typescript
interface FeatureConfig {
  enableAI?: boolean;                    // AI-powered completions
  enableAnalytics?: boolean;             // Productivity tracking
  enableEnhancedCompletion?: boolean;    // Advanced thought completion
  enableRealTimeMonitoring?: boolean;    // Continuous monitoring
  enablePredictiveActions?: boolean;     // Proactive problem prevention
}
```

### `AIConfig`

Configuration for AI integration.

```typescript
interface AIConfig {
  provider?: 'openai' | 'anthropic' | 'auto';
  model?: string;
  apiKey?: string;
  confidenceThreshold?: number;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}
```

### `MonitoringConfig`

Real-time monitoring settings.

```typescript
interface MonitoringConfig {
  detectionInterval?: number;           // Milliseconds between checks
  enableFormalVerification?: boolean;   // Use theorem proving
  maxResponseTime?: number;             // Maximum response time (ms)
  sensorPriority?: SensorType[];        // Sensor execution order
}
```

## Friction Detection

### `IntegratedFrictionProtocol`

Core friction detection and elimination system.

#### Methods

##### `runIntegratedDetection(context: IntegratedContext): Promise<IntegratedProtocolResult>`

Runs comprehensive friction detection across all sensors.

```typescript
const protocol = new IntegratedFrictionProtocol();
const result = await protocol.runIntegratedDetection({
  filePath: '/src/app.ts',
  content: sourceCode,
  checkPackageJson: true,
  language: 'typescript'
});
```

##### `executeAction(actionId: string): Promise<ActionExecutionResult>`

Executes a specific friction elimination action.

```typescript
const result = await protocol.executeAction('fix-syntax-error-456');
```

### `ActionableItem`

Represents a friction point that can be automatically resolved.

```typescript
interface ActionableItem {
  id: string;
  type: 'install' | 'update' | 'fix' | 'refactor';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  command?: string;
  filePath?: string;
  line?: number;
  column?: number;
  metadata: {
    frictionType: string;
    confidence: number;
    estimatedTime: number;
    dependencies?: string[];
  };
}
```

## AI Integration

### `AIProviderManager`

Manages AI providers for thought completion and code generation.

#### Methods

##### `getCompletion(request: AIRequest): Promise<AIResponse>`

Gets AI-powered code completion.

```typescript
const manager = new AIProviderManager();
const response = await manager.getCompletion({
  id: 'completion-123',
  type: AICapability.CODE_COMPLETION,
  context: {
    code: 'const app = ',
    language: 'typescript',
    cursorPosition: { line: 0, column: 12 }
  }
});
```

### `AICapability`

Available AI capabilities.

```typescript
enum AICapability {
  CODE_COMPLETION = 'code_completion',
  CODE_EXPLANATION = 'code_explanation',
  REFACTORING = 'refactoring',
  DEBUGGING = 'debugging',
  ARCHITECTURE_DESIGN = 'architecture_design',
  TEST_GENERATION = 'test_generation',
  DOCUMENTATION = 'documentation',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization'
}
```

## Analytics

### `PerformanceAnalytics`

Tracks productivity metrics and friction elimination.

#### Methods

##### `startSession(): string`

Starts a new analytics session.

```typescript
const analytics = new PerformanceAnalytics();
const sessionId = analytics.startSession();
```

##### `recordFrictionEvent(event: FrictionEvent): void`

Records a friction detection or elimination event.

```typescript
analytics.recordFrictionEvent({
  id: 'friction-123',
  type: 'detected',
  frictionType: 'dependency',
  timestamp: Date.now(),
  filePath: '/src/app.ts',
  severity: 'medium',
  metadata: {
    packageName: 'express',
    confidence: 0.95
  }
});
```

##### `generateReport(): AnalyticsReport`

Generates a comprehensive analytics report.

```typescript
const report = analytics.generateReport();
console.log(`Friction eliminated: ${report.totalEliminated}`);
console.log(`Time saved: ${report.timeSaved}ms`);
```

## Events

### Event System

Sherlock Ω uses an event-driven architecture for real-time updates.

#### Available Events

```typescript
// System events
sherlock.on('started', () => console.log('System started'));
sherlock.on('stopped', () => console.log('System stopped'));
sherlock.on('error', (error) => console.error('System error:', error));

// Friction events
sherlock.on('frictionDetected', (items: ActionableItem[]) => {
  console.log(`Detected ${items.length} friction points`);
});

sherlock.on('frictionEliminated', (actionId: string, result: ActionExecutionResult) => {
  console.log(`Eliminated friction: ${actionId}`);
});

// AI events
sherlock.on('completionGenerated', (result: ThoughtCompletionResult) => {
  console.log(`Generated ${result.suggestions.length} suggestions`);
});

// Analytics events
sherlock.on('sessionStarted', (sessionId: string) => {
  console.log(`Analytics session started: ${sessionId}`);
});

sherlock.on('metricsUpdated', (metrics: FlowStateMetrics) => {
  console.log(`Flow state: ${metrics.flowStatePercentage}%`);
});
```

## Types

### Core Types

```typescript
// System status
interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'error';
  components: {
    frictionProtocol: 'active' | 'inactive' | 'error';
    aiProvider: 'connected' | 'disconnected' | 'error';
    analytics: 'recording' | 'paused' | 'error';
    monitoring: 'active' | 'inactive' | 'error';
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

// Completion context
interface CompletionContext {
  filePath: string;
  content: string;
  cursorPosition: { line: number; column: number };
  language: string;
  projectContext?: ProjectContext;
}

// Friction detection context
interface IntegratedContext {
  filePath: string;
  content: string;
  checkPackageJson?: boolean;
  language: string;
  projectRoot?: string;
}

// Action execution result
interface ActionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  duration: number;
  changes?: FileChange[];
}
```

### Analytics Types

```typescript
// Friction event
interface FrictionEvent {
  id: string;
  type: 'detected' | 'eliminated' | 'failed';
  frictionType: string;
  timestamp: number;
  filePath?: string;
  severity: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
}

// Flow state metrics
interface FlowStateMetrics {
  sessionDuration: number;
  interruptionCount: number;
  flowStatePercentage: number;
  averageTaskSwitchTime: number;
  deepWorkSessions: number;
}

// Productivity metrics
interface ProductivityMetrics {
  linesWritten: number;
  functionsCreated: number;
  testsWritten: number;
  bugsFixed: number;
  refactoringsCompleted: number;
  productivityScore: number;
}
```

## Error Handling

### Error Types

```typescript
// Base error class
class SherlockOmegaError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'SherlockOmegaError';
  }
}

// Specific error types
class FrictionDetectionError extends SherlockOmegaError {}
class AIProviderError extends SherlockOmegaError {}
class AnalyticsError extends SherlockOmegaError {}
class VerificationError extends SherlockOmegaError {}
```

### Error Handling Best Practices

```typescript
try {
  await sherlock.start();
} catch (error) {
  if (error instanceof SherlockOmegaError) {
    console.error(`Sherlock Ω Error [${error.code}]:`, error.message);
    console.error('Context:', error.context);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Usage

### Custom Friction Detectors

```typescript
import { BaseFrictionDetector, FrictionPoint } from 'sherlock-omega-ide';

class CustomDetector extends BaseFrictionDetector {
  constructor() {
    super('custom', ['typescript', 'javascript']);
  }

  async detectFriction(context: any): Promise<FrictionPoint[]> {
    // Your custom detection logic
    return [
      {
        id: 'custom-issue-1',
        type: 'custom',
        severity: 'medium',
        message: 'Custom issue detected',
        location: { line: 10, column: 5 },
        metadata: { customData: 'value' }
      }
    ];
  }

  async eliminateFriction(frictionPoint: FrictionPoint): Promise<boolean> {
    // Your custom elimination logic
    return true;
  }
}

// Register the custom detector
sherlock.registerDetector(new CustomDetector());
```

### Plugin Development

```typescript
interface SherlockOmegaPlugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

class MyPlugin implements SherlockOmegaPlugin {
  name = 'my-plugin';
  version = '1.0.0';

  activate(context: PluginContext) {
    // Plugin initialization
    context.registerCommand('myPlugin.doSomething', () => {
      console.log('Plugin command executed');
    });
  }

  deactivate() {
    // Cleanup
  }
}

// Register the plugin
sherlock.registerPlugin(new MyPlugin());
```

---

## Support

For additional help with the API:

- 📖 **Examples:** https://github.com/zebadiee/Sherlock-omega-ide/tree/main/examples
- 💬 **Discord:** https://discord.gg/sherlock-omega
- 🐛 **Issues:** https://github.com/zebadiee/Sherlock-omega-ide/issues
- 📧 **Email:** api-support@sherlock-omega.dev