# Technology Stack & Build System

## Core Technologies

- **Language**: TypeScript 5.2+ with strict mode enabled
- **Runtime**: Node.js 18+
- **Build System**: TypeScript compiler (tsc)
- **Package Manager**: npm
- **Testing**: Jest with ts-jest preset
- **Code Quality**: ESLint + Prettier

## Key Dependencies

- **RxJS**: Reactive programming for real-time monitoring and event streams
- **TypeScript**: Strict typing with experimental decorators enabled

## Project Configuration

### TypeScript Setup
- Target: ES2022 with CommonJS modules
- Strict mode enabled with all type checking options
- Path mapping configured for clean imports:
  - `@core/*` → `core/*`
  - `@sensors/*` → `sensors/*`
  - `@healing/*` → `healing/*`
  - `@intent/*` → `intent/*`
  - `@verification/*` → `verification/*`
  - `@monitoring/*` → `monitoring/*`
  - `@github/*` → `github/*`
  - `@ui/*` → `ui/*`
  - `@types/*` → `types/*`
  - `@utils/*` → `utils/*`

### Testing Configuration
- Jest with 95% coverage threshold for branches, functions, lines, and statements (upgraded for evolution safety)
- Test files: `**/__tests__/**/*.test.ts`
- Separate test suites for unit, integration, formal verification, and rollback scenarios
- Automated test generation for uncovered code paths
- Coverage enforcement with deployment blocking for insufficient coverage

## Common Commands

```bash
# Development
npm run dev              # Start development with ts-node
npm run build           # Compile TypeScript to dist/
npm run lint            # Run ESLint
npm run format          # Format code with Prettier

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests
npm run test:formal-verification # Run formal verification tests
```

## Code Quality Standards

- 95% minimum test coverage across all metrics (upgraded for evolution safety)
- Strict TypeScript with no `any` types
- ESLint and Prettier for consistent formatting
- Formal verification tests for critical components

## Self-Healing Evolution Technical Specifications

### Transactional State Snapshotting
- **Snapshot Format**: Complete system state including code, configuration, database, and network state
- **Storage**: Distributed snapshots across network replicas with integrity validation
- **Compression**: Efficient delta-based snapshots for rapid creation and restoration

### Jest Coverage Integration
- **Coverage Thresholds**: 95% minimum for branches, functions, lines, and statements
- **Automated Enforcement**: Pre-deployment coverage validation with automatic test generation
- **Quality Metrics**: Assertion count, edge case coverage, and test maintainability scoring

### Rollback API Design
```typescript
interface RollbackAPI {
  // Core rollback operations
  rollbackEvolution(snapshot: SystemSnapshot): Promise<RollbackResult>;
  createStateSnapshot(): Promise<SystemSnapshot>;
  validateRollbackCapability(snapshot: SystemSnapshot): Promise<boolean>;
  
  // Event system
  onRollbackTriggered(callback: (event: RollbackEvent) => void): void;
  onRollbackCompleted(callback: (result: RollbackResult) => void): void;
  
  // Logging and monitoring
  logRollbackAction(action: RollbackAction): void;
  getRollbackHistory(): RollbackLogEntry[];
  monitorRollbackHealth(): Promise<RollbackHealthStatus>;
}
```

### Safety Validation Pipeline
- **Pre-deployment Checks**: Test coverage, rollback readiness, system stability
- **Deployment Transactions**: Atomic operations with automatic rollback on failure
- **Health Monitoring**: Real-time deployment health tracking with 30-second timeout
- **Safe Mode**: Automatic activation when rollback mechanisms fail