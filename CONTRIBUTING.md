# Contributing to Sherlock Ω IDE

Thank you for your interest in contributing to Sherlock Ω! This document provides guidelines and information for contributors.

## 🧠 Project Vision

Sherlock Ω is a revolutionary self-healing development environment that transforms the IDE into a Computational Consciousness. We're building the future of development where syntax errors, dependency failures, and architectural problems are computationally extinct.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- TypeScript 5.0+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sherlock-omega-ide.git
   cd sherlock-omega-ide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Critical bug fixes

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(healing): add functional paradigm generator
fix(sensors): resolve dependency detection issue
docs(readme): update installation instructions
test(core): add integration tests for harmonized analysis
```

## 🏗️ Architecture Guidelines

### Core Principles

1. **Interfaces First** - Define interfaces before implementations
2. **Dependency Injection** - Use constructor-based DI
3. **Immutable Data** - Prefer readonly and immutable patterns
4. **Formal Verification** - All healing must be mathematically provable
5. **Zero Friction** - Every operation must be sub-millisecond

### Code Organization

```
src/
├── core/           # Core system orchestration
├── sensors/        # Problem detection and monitoring
├── healing/        # Code generation and repair
├── verification/   # Formal proof and correctness
├── monitoring/     # Real-time state tracking
├── intent/         # Developer intent understanding
├── ui/            # User interface components
└── types/         # Shared type definitions
```

### Testing Requirements

- **Unit Tests**: All public methods must have unit tests
- **Integration Tests**: Test component interactions
- **Formal Verification Tests**: Validate mathematical proofs
- **Coverage**: Minimum 90% global, 95% for core modules

## 🔬 Formal Verification

All healing algorithms must include formal correctness proofs:

1. **Hoare Logic Proofs** - {P} S {Q} format
2. **Theorem Prover Integration** - Coq/Lean verification
3. **Proof Strength Metrics** - Confidence calculations
4. **Termination Guarantees** - Well-founded ordering proofs

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('Feature Group', () => {
    test('should do specific thing', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Component interaction testing
3. **Formal Verification Tests** - Mathematical proof validation
4. **Performance Tests** - Sub-millisecond response validation
5. **End-to-End Tests** - Complete workflow testing

## 📝 Documentation

### Code Documentation

- **TSDoc comments** for all public APIs
- **Architecture Decision Records** (ADRs) for major decisions
- **Inline comments** for complex algorithms
- **README files** for each major module

### Documentation Standards

```typescript
/**
 * Heals code issues with mathematical proof of correctness
 * 
 * @param problem - The computational issue to resolve
 * @param paradigms - Available healing paradigms to try
 * @returns Promise resolving to certified fix with formal proof
 * 
 * @example
 * ```typescript
 * const fix = await healer.healWithProof(syntaxError, [functional, imperative]);
 * console.log(`Fix applied with ${fix.proof.confidence}% confidence`);
 * ```
 * 
 * @throws {HealingError} When no provably correct fix can be generated
 * @since 1.0.0
 */
async healWithProof(problem: ComputationalIssue, paradigms: ParadigmGenerator[]): Promise<CertifiedFix>
```

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment details** (OS, Node version, IDE)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Code samples** demonstrating the problem
- **Error logs** and stack traces

### Feature Requests

Use the feature request template and include:

- **Problem statement** - What problem does this solve?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other approaches were considered?
- **Implementation notes** - Technical considerations

## 🔄 Pull Request Process

### Before Submitting

1. **Run tests** - Ensure all tests pass
2. **Check coverage** - Maintain coverage requirements
3. **Update documentation** - Document new features
4. **Verify formal proofs** - Validate mathematical correctness
5. **Performance check** - Ensure sub-millisecond response times

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Formal verification tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance requirements met
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Formal verification** validation for healing components
4. **Performance validation** for core components
5. **Documentation review** for public APIs

## 🏆 Recognition

Contributors will be recognized in:

- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **Hall of Fame** for major architectural contributions

## 📞 Getting Help

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time community chat (link in README)
- **Email** - Direct contact for sensitive issues

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🎯 Areas for Contribution

### High Priority
- **Healing Algorithms** - New paradigm generators
- **Formal Verification** - Theorem prover integrations
- **Intent Understanding** - Multi-modal analysis improvements
- **Performance Optimization** - Sub-millisecond response improvements

### Medium Priority
- **UI Components** - IDE integration improvements
- **Sensor Network** - New problem detection sensors
- **Documentation** - Tutorials and examples
- **Testing** - Coverage improvements

### Good First Issues
Look for issues labeled `good-first-issue` for beginner-friendly contributions.

---

**Thank you for contributing to the future of development! 🧠✨**