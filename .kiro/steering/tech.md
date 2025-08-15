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
- Jest with 90% coverage threshold for branches, functions, lines, and statements
- Test files: `**/__tests__/**/*.test.ts`
- Separate test suites for unit, integration, and formal verification

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

- 90% minimum test coverage across all metrics
- Strict TypeScript with no `any` types
- ESLint and Prettier for consistent formatting
- Formal verification tests for critical components