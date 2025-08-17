# Sherlock Ω - Developer Guide & Launchpad

Welcome, developer. This document is the central hub for understanding, contributing to, and evolving the Sherlock Ω IDE. It contains critical, developer-only information. For user-facing features, see the [Complete Launch Guide](./SHERLOCK_OMEGA_LAUNCH_GUIDE.md).

## 1. Project Philosophy

Sherlock Ω is not just an IDE; it's an experiment in creating a **computational consciousness** for software development. Our core principles are:

- **True Autonomy**: The IDE should be able to build, test, deploy, and improve itself ([Requirement 13](./.kiro/specs/autonomous-evolution/requirements.md)).
- **Blueprint-Driven Evolution**: The system can build entire applications from high-level markdown "blueprints" ([Requirement 14](./.kiro/specs/autonomous-evolution/requirements.md)).
- **Intelligent Orchestration**: A central orchestrator (`EnhancedAIOrchestrator`) makes context-aware, cost-aware, and privacy-aware decisions to route tasks to the best AI model.
- **Resilience and Hardening**: The system is designed to be self-healing and robust, with comprehensive testing and monitoring.

## 2. Development Setup

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### Quick Start
```bash
# 1. Clone the repository
git clone <repository_url>
cd Sherlock-omega-ide

# 2. Install root dependencies
npm install

# 3. Install web-ide dependencies
cd sherlock-web-ide
npm install

# 4. Launch the IDE in development mode
npm start
```

### Running Tests
To ensure system stability, run the full test suite from the root directory:
```bash
npm test
```

## 3. Core Architecture

The system is designed with a multi-layered, modular architecture.

- **AI Orchestrator (`src/ai/enhanced-ai-orchestrator.ts`)**: This is the brain of the IDE. It handles all AI requests, performs context analysis, detects sensitive data for privacy, runs AST analysis, and selects the optimal model for any given task.
- **Autonomous Evolution Engine (`.kiro/specs/autonomous-evolution`)**: This system governs the IDE's ability to self-improve. It's guided by a set of formal requirements for safety, testing, and deployment.
- **Specifications (`.kiro/specs`)**: This directory is the single source of truth for the system's design and requirements. All development should be guided by these documents.
- **Web IDE (`sherlock-web-ide`)**: The React-based frontend that provides the user interface.

For a deep dive into the architecture, review the AI Integration System Design.

## 4. Autonomous Systems Deep Dive

### Blueprint-Driven Evolution
Sherlock Ω can build applications from scratch based on high-level plans.
- **Location**: `.kiro/blueprints/`
- **Process**: Add a new `.md` file to this directory describing an application's concept and features. The IDE will detect it and begin the autonomous build process.
- **Example**: See `ai-drive.md` for an example.

### Self-Compilation
The IDE uses its own integrated terminal to build and deploy its own updates.
- **Trigger**: This process is triggered by the successful generation of a new feature.
- **Safety**: The entire process is sandboxed and governed by the strict safety and rollback protocols defined in `Requirement 10`.

## 5. Debugging and Hardening

Maintaining system stability is paramount.
- **Status Report**: For an overview of the system's current stability and test status, see the [Hardening Status Report](./HARDENING_STATUS_REPORT.md).
- **Logging**: The `Logger` class provides a structured, multi-transport logging system with performance integration. Use it to gain insight into system behavior.
- **Testing**: All new code must be accompanied by comprehensive Jest tests. Focus on unit, integration, and error-handling scenarios.

## 6. How to Contribute

- **Bug Reports**: Found a bug? Please provide detailed information, including logs, by using the [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md).
- **Feature Requests**: Have an idea? Propose it using the [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md).
- **Code Style**: We use TypeScript with strict type checking. All `any` types are forbidden. All public APIs must be documented with JSDoc.

## 7. Key Development Areas

### Enhanced AI Orchestrator
The heart of the system's intelligence:
- **Location**: `src/ai/enhanced-ai-orchestrator.ts`
- **Status**: ✅ Fully hardened with 16/16 tests passing
- **Features**: Context-aware routing, privacy detection, AST analysis, learning engine

### Monaco Completion Provider
Intelligent code completion:
- **Location**: `src/ai/completion/monaco-completion-provider.ts`
- **Status**: ✅ Recently hardened with proper range handling
- **Tests**: Basic completion tests (18/18 passing)

### Performance Monitoring
Real-time system health tracking:
- **Location**: `src/monitoring/`
- **Features**: Performance metrics, alerting, resource tracking
- **Integration**: Integrated with logging and AI orchestrator

### Plugin System
Extensible architecture:
- **Location**: `src/plugins/`
- **Features**: Dynamic loading, sandboxed execution, lifecycle management
- **Security**: Comprehensive validation and isolation

## 8. Testing Strategy

### Current Status
- **Test Success Rate**: 97.6% (165/169 tests passing)
- **Test Suites**: 8/15 passing
- **Critical Components**: All core systems have comprehensive test coverage

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: System interaction testing
- **Performance Tests**: Response time and resource usage
- **Security Tests**: Privacy and validation testing
- **Resilience Tests**: Error handling and recovery

### Running Specific Tests
```bash
# Run enhanced AI orchestrator tests
npm test -- --testPathPattern=enhanced-ai-orchestrator

# Run completion provider tests
npm test -- --testPathPattern=completion-basic

# Run with coverage
npm test -- --coverage
```

## 9. Architecture Patterns

### Interface-First Design
All major components are defined through TypeScript interfaces with clear separation between contracts and implementations.

### Dependency Injection
Components use dependency injection patterns for testability and modularity.

### Event-Driven Architecture
The system uses an event-driven approach for loose coupling between components.

### Error Handling
Comprehensive error handling with graceful degradation and recovery mechanisms.

## 10. Security Considerations

### Privacy Protection
- Automatic detection of sensitive content
- Local model routing for private data
- Configurable privacy levels

### Sandboxing
- Plugin execution isolation
- Secure code evaluation
- Resource access controls

### Validation
- Input sanitization
- Type safety enforcement
- Security auditing

This new structure provides the clear separation you were looking for and establishes a solid "launchpad" for anyone interacting with the Sherlock Ω project.