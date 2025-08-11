# Sherlock Ω - Project Structure & Organization

## Root Structure
```
sherlock-omega-ide/
├── src/                    # Source code
├── dist/                   # Compiled output (generated)
├── node_modules/           # Dependencies (generated)
├── coverage/               # Test coverage reports (generated)
├── .kiro/                  # Kiro IDE configuration
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest test configuration
└── README.md               # Project documentation
```

## Source Code Architecture (`src/`)

### Core System (`src/core/`)
- **SherlockOmegaCore.ts** - Main consciousness engine and entry point
- **interfaces.ts** - Core system interfaces and contracts
- Primary orchestration layer that coordinates all subsystems

### Type Definitions (`src/types/`)
- **core.ts** - Fundamental type definitions for the entire system
- Shared types used across all modules
- Formal verification and proof system types

### Sensor Network (`src/sensors/`)
- **BaseSensor.ts** - Abstract base class for all sensors
- **SyntaxSensor.ts** - Monitors syntax and parsing issues
- **DependencySensor.ts** - Tracks dependency health and availability
- **SensorRegistry.ts** - Manages sensor lifecycle and coordination
- Omniscient monitoring system components

### Healing Engine (`src/healing/`)
- **ProvablyCorrectCodeHealer.ts** - Main healing orchestrator
- **ParadigmGenerator.ts** - Base class for paradigm-specific generators
- **FunctionalParadigmGenerator.ts** - Functional programming fixes
- **ImperativeParadigmGenerator.ts** - Imperative programming fixes
- Self-healing code generation with formal proofs

### Verification System (`src/verification/`)
- **FormalProofSystem.ts** - Core proof system implementation
- **HoareProofGenerator.ts** - Hoare logic proof generation
- **TheoremProverIntegration.ts** - External theorem prover integration
- Mathematical correctness verification

### Monitoring System (`src/monitoring/`)
- **OmniscientDevelopmentMonitor.ts** - Universal state monitoring
- **PreventiveActionPlanner.ts** - Proactive problem prevention
- Real-time problem detection and prevention

## Testing Structure
Each module has corresponding `__tests__/` directory:
- Tests mirror source structure exactly
- Use `.test.ts` suffix for test files
- Comprehensive coverage expected for all public APIs
- Integration tests in addition to unit tests

## File Naming Conventions
- **PascalCase** for class files (e.g., `SherlockOmegaCore.ts`)
- **camelCase** for utility files (e.g., `interfaces.ts`)
- **kebab-case** for configuration files (e.g., `jest.config.js`)
- **Test files** match source file name with `.test.ts` suffix

## Import Patterns
- Use path aliases for internal imports: `@core/SherlockOmegaCore`
- External dependencies imported normally: `import { Observable } from 'rxjs'`
- Interfaces imported from `@core/interfaces` or `@types/core`
- Avoid circular dependencies between modules

## Module Boundaries
- **Core**: System orchestration and main interfaces
- **Sensors**: Problem detection and monitoring
- **Healing**: Code generation and repair
- **Verification**: Formal proof and correctness
- **Monitoring**: Real-time state tracking
- **Types**: Shared type definitions

## Architecture Layers
1. **Presentation Layer**: Main entry point (`src/index.ts`)
2. **Orchestration Layer**: Core system (`src/core/`)
3. **Business Logic Layer**: Healing, monitoring, verification
4. **Infrastructure Layer**: Sensors, utilities
5. **Data Layer**: Types and interfaces

## Extension Points
- New sensors extend `BaseSensor` and register with `SensorRegistry`
- New paradigm generators extend `ParadigmGenerator`
- New proof systems implement formal verification interfaces
- All major components use dependency injection for testability