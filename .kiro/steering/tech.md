# Sherlock Ω - Technical Stack & Build System

## Tech Stack
- **Language**: TypeScript 5.0+ (strict mode enabled)
- **Runtime**: Node.js 18+
- **Testing**: Jest with ts-jest preset
- **Build**: TypeScript compiler (tsc)
- **Dependencies**: RxJS for reactive programming

## Build System
- **Compiler**: TypeScript with strict configuration
- **Target**: ES2022 with CommonJS modules
- **Output**: `dist/` directory with declaration files
- **Source Maps**: Enabled for debugging
- **Decorators**: Experimental decorators enabled

## Path Aliases
The project uses TypeScript path mapping for clean imports:
- `@core/*` → `src/core/*`
- `@sensors/*` → `src/sensors/*`
- `@healing/*` → `src/healing/*`
- `@intent/*` → `src/intent/*`
- `@friction/*` → `src/friction/*`
- `@resolution/*` → `src/resolution/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development mode with watch
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Code Quality Standards
- **Strict TypeScript**: All strict compiler options enabled
- **ESLint**: TypeScript ESLint configuration
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive test coverage expected
- **Declaration Files**: Generated for all public APIs

## Architecture Constraints
- **Interfaces First**: All major components defined by interfaces
- **Dependency Injection**: Constructor-based DI pattern
- **Immutable Data**: Prefer readonly and immutable patterns
- **Async/Await**: Use async/await over Promises.then()
- **Error Handling**: Comprehensive error handling with typed errors

## Performance Requirements
- **Response Time**: Sub-millisecond for core operations
- **Memory**: Efficient memory usage with cleanup
- **CPU**: Non-blocking operations for UI thread
- **Scalability**: Handle large codebases efficiently

## CI/CD Pipeline

### Build Status & Quality Metrics
[![CI/CD Pipeline](https://github.com/mit-acil/sherlock-omega-ide/workflows/🧠%20Sherlock%20Ω%20CI/CD%20Pipeline/badge.svg)](https://github.com/mit-acil/sherlock-omega-ide/actions)
[![Coverage](https://codecov.io/gh/mit-acil/sherlock-omega-ide/branch/main/graph/badge.svg)](https://codecov.io/gh/mit-acil/sherlock-omega-ide)
[![Security](https://snyk.io/test/github/mit-acil/sherlock-omega-ide/badge.svg)](https://snyk.io/test/github/mit-acil/sherlock-omega-ide)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Formal Verification](https://img.shields.io/badge/Formal%20Verification-Enabled-green.svg)](#)

### Pipeline Stages
1. **Quality Gates** - TypeScript compilation, ESLint, security audit
2. **Comprehensive Testing** - Unit/integration tests with 90% coverage requirement (95% for core modules)
3. **Formal Verification** - Mathematical proof checking and healing algorithm validation
4. **Build & Package** - Production build optimization and Docker image creation
5. **Deployment** - Staging → Canary (10%) → Full Production rollout
6. **Monitoring** - Real-time health checks with automatic rollback on failure

### Quality Requirements
- **Test Coverage**: Minimum 90% global, 95% for core/healing/verification modules
- **Security**: Zero tolerance for high/critical vulnerabilities
- **Performance**: Bundle size limits enforced with performance budgets
- **Formal Verification**: All mathematical proofs must validate before merge
- **Code Quality**: Zero ESLint warnings, strict TypeScript compilation

### Deployment Strategy
- **Staging Environment**: Full feature testing with smoke tests
- **Canary Deployment**: 10% traffic routing with health monitoring
- **Automatic Rollback**: Triggered on health check failures or error rate spikes
- **Zero Downtime**: Blue-green deployment with seamless traffic switching

### Monitoring & Alerts
- **Real-time Metrics**: Response times, error rates, resource usage
- **Slack Integration**: Pipeline status and emergency notifications
- **Health Checks**: Continuous monitoring with 5-minute canary validation
- **Emergency Response**: Automatic rollback with team notifications