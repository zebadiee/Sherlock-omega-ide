# Project Structure & Architecture

## Directory Organization

```
src/
├── core/           # Core system orchestration and interfaces
├── sensors/        # Problem detection and monitoring systems
├── healing/        # Code generation and repair mechanisms
├── verification/   # Formal proof and correctness validation
├── monitoring/     # Real-time state tracking
├── intent/         # Developer intent understanding
├── github/         # Secure GitHub integration
├── ui/            # User interface components
├── types/         # Shared type definitions
├── utils/         # Utility functions and helpers
├── safety/         # Safety validation and rollback systems
├── testing/        # Automated test generation and coverage
└── evolution/      # Autonomous evolution and deployment
```

## Architectural Patterns

### Core System Components
- **IOmniscientDevelopmentMonitor**: Universal state monitoring and preventive action planning
- **IProvablyCorrectCodeHealer**: Self-healing with formal correctness proofs
- **IDeveloperMindInterface**: Multi-modal developer intent analysis
- **IZeroFrictionProtocol**: Proactive friction elimination
- **IUniversalResolutionEngine**: Guaranteed problem resolution

### Self-Healing Evolution Components
- **SafetyValidationSystem**: Enforces ≥95% test coverage and validates evolution safety
- **TestCoverageEnforcer**: Automatically generates missing tests and blocks unsafe deployments
- **RollbackManager**: Manages state snapshots and 30-second automatic rollback
- **EvolutionSafetyFramework**: Coordinates deployment transactions with rollback capability
- **ContinuousValidator**: Real-time validation of evolution safety and system health

### Type System Architecture
- **ComputationalIssue**: Structured problem representation with formal logic
- **FixCandidate**: Solution proposals with confidence metrics
- **FormalProof**: Mathematical correctness validation
- **DeveloperIntent**: Goal-oriented development understanding
- **SensorResult**: Real-time monitoring data

## Code Organization Principles

### Interface-First Design
- All major components defined through TypeScript interfaces
- Clear separation between contracts and implementations
- Dependency injection patterns for testability

### Formal Verification Integration
- Every fix candidate requires formal proof of correctness
- Logical formulas (preconditions, postconditions, invariants)
- Multiple proof systems supported (Hoare Logic, Temporal Logic, etc.)

### Action-Based Architecture
- All system operations modeled as Actions with rollback strategies
- ActionPlans for coordinated multi-step operations
- Priority-based execution with dependency management

## File Naming Conventions

- **Interfaces**: `interfaces.ts` in each module
- **Types**: `core.ts` for shared types, module-specific types in respective folders
- **Tests**: `__tests__/**/*.test.ts` pattern
- **Implementation**: Descriptive names matching interface contracts

## Import Path Standards

Use TypeScript path mapping for clean imports:
- `@core/*` for core system components
- `@types/*` for shared type definitions
- `@sensors/*`, `@healing/*`, etc. for module-specific imports

## Architectural Constraints

- No circular dependencies between modules
- All external integrations must go through secure interfaces
- Formal verification required for critical path operations
- Real-time monitoring must be non-blocking