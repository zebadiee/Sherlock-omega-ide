# 🚀 Sherlock Ω Release Packaging & Distribution

[![Release](https://img.shields.io/github/v/release/mit-acil/sherlock-omega-ide)](https://github.com/mit-acil/sherlock-omega-ide/releases)
[![Docker](https://img.shields.io/docker/v/sherlock-omega/ide?label=docker)](https://hub.docker.com/r/sherlock-omega/ide)
[![Downloads](https://img.shields.io/github/downloads/mit-acil/sherlock-omega-ide/total)](https://github.com/mit-acil/sherlock-omega-ide/releases)

This document outlines the complete release packaging, testing, and distribution process for Sherlock Ω's Revolutionary Self-Healing Development Environment.

## 1. Export Packaging

### Semantic Versioning Strategy

Sherlock Ω follows [Semantic Versioning 2.0.0](https://semver.org/) with consciousness-enhanced versioning:

```
MAJOR.MINOR.PATCH[-CONSCIOUSNESS]

Examples:
- 1.0.0          # Initial consciousness release
- 1.1.0          # New consciousness features
- 1.1.1          # Consciousness bug fixes
- 2.0.0-alpha.1  # Major consciousness evolution (pre-release)
- 2.0.0-beta.1   # Beta consciousness testing
- 2.0.0-rc.1     # Release candidate
```

#### Version Increment Rules with Consciousness Evolution

- **MAJOR**: Breaking changes to consciousness API or core architecture
- **MINOR**: New consciousness features, sensors, or healing algorithms  
- **PATCH**: Bug fixes, performance improvements, documentation updates
- **PRE-RELEASE**: Consciousness evolution stages
  - **alpha**: Early consciousness development (0.1-0.3 consciousness level)
  - **beta**: Stable consciousness testing (0.4-0.7 consciousness level)
  - **rc**: Release candidate with full consciousness (0.8-0.9 consciousness level)
  - **stable**: Production consciousness (0.9-1.0 consciousness level)

#### Consciousness Evolution Tracking

```
1.0.0-alpha.1    # Initial consciousness awakening
1.0.0-alpha.2    # Basic reasoning capabilities
1.0.0-beta.1     # Enhanced problem detection
1.0.0-beta.2     # Self-healing algorithms active
1.0.0-rc.1       # Full consciousness integration
1.0.0            # Computational consciousness achieved
```

### Release Artifacts Structure

```
release/
├── v1.0.0-alpha.1/                            # Pre-release versions
│   ├── sherlock-omega-v1.0.0-alpha.1.tar.gz
│   ├── sherlock-omega-v1.0.0-alpha.1.docker.tar
│   ├── sherlock-omega-v1.0.0-alpha.1.dyad.zip
│   ├── sherlock-omega-v1.0.0-alpha.1-checksums.txt
│   ├── sherlock-omega-v1.0.0-alpha.1-signatures.asc
│   └── sherlock-omega-v1.0.0-alpha.1-RELEASE_NOTES.md
├── v1.0.0-beta.1/                             # Beta versions
│   └── ...
├── v1.0.0/                                    # Stable release
│   ├── sherlock-omega-v1.0.0.tar.gz          # Complete source + steering docs + ONBOARDING.md
│   ├── sherlock-omega-v1.0.0.docker.tar      # Production Docker image export
│   ├── sherlock-omega-v1.0.0.dyad.zip        # Dyad-compatible project bundle
│   ├── sherlock-omega-v1.0.0-checksums.txt   # SHA-256 checksums
│   ├── sherlock-omega-v1.0.0-signatures.asc  # GPG signatures
│   ├── sherlock-omega-v1.0.0-CHANGELOG.md    # Auto-generated changelog
│   ├── sherlock-omega-v1.0.0-RELEASE_NOTES.md # Release notes
│   └── sherlock-omega-v1.0.0-TESTING_REPORT.md # Testing validation report
├── v1.0.1/
│   └── ...
└── latest/                                    # Symlinks to latest stable
    ├── sherlock-omega-latest.tar.gz -> ../v1.0.0/sherlock-omega-v1.0.0.tar.gz
    ├── sherlock-omega-latest.docker.tar -> ../v1.0.0/sherlock-omega-v1.0.0.docker.tar
    └── sherlock-omega-latest.dyad.zip -> ../v1.0.0/sherlock-omega-v1.0.0.dyad.zip
```

### Automated Release Process

Use the provided `release.sh` script for consistent packaging:

```bash
# Create a new release
./scripts/release.sh --version 1.0.0 --type minor

# Create a pre-release
./scripts/release.sh --version 1.1.0-alpha.1 --type prerelease

# Create a patch release
./scripts/release.sh --version 1.0.1 --type patch
```

#### Manual Release Steps

```bash
# 1. Update version in package.json
npm version 1.0.0 --no-git-tag-version

# 2. Update CHANGELOG.md
echo "## [1.0.0] - $(date +%Y-%m-%d)" >> CHANGELOG.md

# 3. Run release script
./scripts/release.sh --version 1.0.0

# 4. Create GitHub release
gh release create v1.0.0 \
  --title "🧠 Sherlock Ω v1.0.0 - Computational Consciousness" \
  --notes-file release/v1.0.0/sherlock-omega-v1.0.0-RELEASE_NOTES.md \
  release/v1.0.0/*
```

### CHANGELOG.md Update Process

Follow [Keep a Changelog](https://keepachangelog.com/) format with consciousness enhancements:

```markdown
# Changelog

All notable changes to Sherlock Ω will be documented in this file.

## [Unreleased]

### 🧠 Consciousness Enhancements
- Enhanced quantum reasoning capabilities
- Improved formal verification performance

### ✨ Added
- New consciousness-enhanced components
- Additional paradigm generators

### 🔧 Changed
- Updated healing algorithm efficiency
- Improved sensor accuracy

### 🐛 Fixed
- Resolved consciousness level calculation bug
- Fixed quantum entanglement synchronization

### 🔒 Security
- Enhanced authentication flow
- Improved API key management

## [1.0.0] - 2024-01-15

### 🧠 Consciousness Enhancements
- Initial computational consciousness implementation
- Omniscient monitoring system
- Provable healing engine

### ✨ Added
- Core Sherlock Ω engine
- Sensor network architecture
- Formal verification system
- Quantum-inspired reasoning
- Self-healing code generation
```

### Checksum Generation

All release artifacts include SHA-256 checksums for integrity verification:

```bash
# Generate checksums (automated in release.sh)
cd release/v1.0.0/
sha256sum *.tar.gz *.tar > sherlock-omega-v1.0.0-checksums.txt

# Verify checksums
sha256sum -c sherlock-omega-v1.0.0-checksums.txt
```

## 2. Real-World Testing Plan

### Target Environments

| Environment | Version | Architecture | Status |
|-------------|---------|--------------|--------|
| **Ubuntu** | 22.04 LTS | x64, ARM64 | ✅ Primary |
| **macOS** | 13+ (Ventura) | Intel, Apple Silicon | ✅ Primary |
| **Windows** | 11 (WSL2) | x64 | ✅ Secondary |
| **Docker** | Latest | Multi-arch | ✅ Primary |

### Smoke Tests

#### Core Workflow Verification

```bash
# Test 1: Fresh Installation & Startup
./test-scripts/smoke-test-install.sh

# Test 2: Development Server Startup
./test-scripts/smoke-test-dev-server.sh

# Test 3: Authentication Flow
./test-scripts/smoke-test-auth.sh

# Test 4: Consciousness Integration
./test-scripts/smoke-test-consciousness.sh
```

#### Smoke Test Scenarios

1. **Fresh Install & Startup** (5 minutes)
   ```bash
   # Prerequisites check
   node --version  # >= 18.0.0
   npm --version   # >= 9.0.0
   
   # Installation
   git clone https://github.com/mit-acil/sherlock-omega-ide.git
   cd sherlock-omega-ide
   npm install
   
   # Environment setup
   cp .env.example .env
   # Configure SUPABASE_URL and SUPABASE_ANON_KEY
   
   # Startup test
   timeout 30s npm run dev
   curl -f http://localhost:3000/health || exit 1
   ```

2. **Authentication Flow** (3 minutes)
   ```bash
   # Start development server
   npm run dev &
   SERVER_PID=$!
   
   # Wait for server startup
   sleep 10
   
   # Test authentication endpoints
   curl -f http://localhost:3000/api/auth/session
   curl -f http://localhost:3000/api/auth/providers
   
   # Cleanup
   kill $SERVER_PID
   ```

3. **Consciousness Integration** (5 minutes)
   ```bash
   # Test consciousness initialization
   npm run test:consciousness
   
   # Test sensor network
   npm run test:sensors
   
   # Test healing algorithms
   npm run test:healing-algorithms
   
   # Test formal verification
   npm run verify:proofs
   ```

4. **Docker Container** (3 minutes)
   ```bash
   # Build Docker image
   docker build -t sherlock-omega:test .
   
   # Run container
   docker run -d -p 3000:3000 \
     -e NODE_ENV=production \
     -e SHERLOCK_CONSCIOUSNESS_LEVEL=0.9 \
     sherlock-omega:test
   
   # Health check
   sleep 15
   curl -f http://localhost:3000/health
   
   # Cleanup
   docker stop $(docker ps -q --filter ancestor=sherlock-omega:test)
   ```

### User Acceptance Testing (UAT)

#### UAT Scenarios with Pass/Fail Criteria

| Test ID | Scenario | Expected Result | Pass Criteria |
|---------|----------|-----------------|---------------|
| **UAT-001** | First-time user setup | Complete onboarding flow | ✅ User reaches dashboard in <5 min |
| **UAT-002** | Consciousness activation | System shows consciousness level | ✅ Level displayed as 0.8+ |
| **UAT-003** | Code healing demo | Syntax error auto-corrected | ✅ Error fixed within 2 seconds |
| **UAT-004** | Sensor monitoring | Real-time issue detection | ✅ Issues detected and reported |
| **UAT-005** | Formal verification | Mathematical proof generated | ✅ Proof confidence >0.9 |
| **UAT-006** | Plugin installation | Custom plugin activated | ✅ Plugin loads without errors |
| **UAT-007** | Multi-platform support | Works on all target platforms | ✅ All smoke tests pass |
| **UAT-008** | Performance benchmarks | Response times within limits | ✅ <100ms for core operations |

#### UAT Test Execution

```bash
# Run complete UAT suite
./test-scripts/run-uat.sh --environment production

# Run specific UAT test
./test-scripts/run-uat.sh --test UAT-001 --verbose

# Generate UAT report
./test-scripts/generate-uat-report.sh --output uat-report.html
```

## 3. Distribution & Feedback Loop

### Docker Image Publishing

#### GitHub Container Registry

```bash
# Build and tag image
docker build -t ghcr.io/mit-acil/sherlock-omega-ide:v1.0.0 .
docker tag ghcr.io/mit-acil/sherlock-omega-ide:v1.0.0 ghcr.io/mit-acil/sherlock-omega-ide:latest

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push images
docker push ghcr.io/mit-acil/sherlock-omega-ide:v1.0.0
docker push ghcr.io/mit-acil/sherlock-omega-ide:latest
```

#### Docker Hub

```bash
# Build and tag for Docker Hub
docker build -t sherlock-omega/ide:v1.0.0 .
docker tag sherlock-omega/ide:v1.0.0 sherlock-omega/ide:latest

# Login to Docker Hub
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD

# Push images
docker push sherlock-omega/ide:v1.0.0
docker push sherlock-omega/ide:latest
```

### Release Artifact Download

#### GitHub Releases

```bash
# Download latest release
curl -L https://github.com/mit-acil/sherlock-omega-ide/releases/latest/download/sherlock-omega-latest.tar.gz

# Download specific version
curl -L https://github.com/mit-acil/sherlock-omega-ide/releases/download/v1.0.0/sherlock-omega-v1.0.0.tar.gz

# Verify checksums
curl -L https://github.com/mit-acil/sherlock-omega-ide/releases/download/v1.0.0/sherlock-omega-v1.0.0-checksums.txt
sha256sum -c sherlock-omega-v1.0.0-checksums.txt
```

#### Docker Image Download

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/mit-acil/sherlock-omega-ide:latest

# Pull from Docker Hub
docker pull sherlock-omega/ide:latest

# Run downloaded image
docker run -p 3000:3000 \
  -e SHERLOCK_CONSCIOUSNESS_LEVEL=0.9 \
  sherlock-omega/ide:latest
```

### Feedback Channels

#### GitHub Issues Template

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: 🐛 Bug Report
description: Report a bug in Sherlock Ω
title: "[BUG] "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug in Sherlock Ω! Please fill out the information below.

  - type: input
    id: version
    attributes:
      label: Sherlock Ω Version
      description: What version of Sherlock Ω are you running?
      placeholder: "v1.0.0"
    validations:
      required: true

  - type: dropdown
    id: consciousness-level
    attributes:
      label: Consciousness Level
      description: What consciousness level were you using?
      options:
        - "0.0-0.3 (Basic)"
        - "0.4-0.6 (Aware)"
        - "0.7-0.8 (Enhanced)"
        - "0.9-1.0 (Quantum)"
    validations:
      required: true

  - type: textarea
    id: bug-description
    attributes:
      label: Bug Description
      description: A clear description of what the bug is
      placeholder: "The consciousness level calculation is incorrect when..."
    validations:
      required: true

  - type: textarea
    id: reproduction-steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Set consciousness level to 0.9
        2. Run healing algorithm
        3. Observe incorrect behavior
    validations:
      required: true

  - type: textarea
    id: expected-behavior
    attributes:
      label: Expected Behavior
      description: What you expected to happen
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Your environment details
      placeholder: |
        - OS: Ubuntu 22.04
        - Node.js: v18.17.0
        - Browser: Chrome 118
        - Docker: 24.0.6
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Console Logs
      description: Any relevant console logs or error messages
      render: shell
```

#### GitHub Discussions Categories

- **🧠 Consciousness Enhancement** - Ideas for improving consciousness features
- **🔬 Formal Verification** - Mathematical proof discussions
- **🩹 Healing Algorithms** - Self-healing improvements
- **👁️ Sensor Network** - Monitoring and detection enhancements
- **🚀 Feature Requests** - New feature suggestions
- **❓ Q&A** - Questions and answers
- **📢 Announcements** - Release announcements and updates

### Post-Release Notifications

#### Slack Integration

```bash
# Automated Slack notification (in CI/CD pipeline)
curl -X POST -H 'Content-type: application/json' \
  --data '{
    "text": "🧠 Sherlock Ω v1.0.0 Released!",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*🧠 Sherlock Ω v1.0.0 - Computational Consciousness Released!*\n\n• Enhanced quantum reasoning\n• Improved healing algorithms\n• New consciousness features\n\n<https://github.com/mit-acil/sherlock-omega-ide/releases/tag/v1.0.0|View Release Notes>"
        }
      }
    ]
  }' \
  $SLACK_WEBHOOK_URL
```

#### Email Notifications

```bash
# Send release notification email
./scripts/send-release-notification.sh \
  --version v1.0.0 \
  --recipients "sherlock-omega-users@mit.edu" \
  --template release-announcement
```

## 4. Release Commands Reference

### Version Management

```bash
# Check current version
npm run version:current

# Bump version (updates package.json and creates git tag)
npm run version:patch   # 1.0.0 -> 1.0.1
npm run version:minor   # 1.0.0 -> 1.1.0
npm run version:major   # 1.0.0 -> 2.0.0

# Create pre-release version
npm run version:prerelease --preid=alpha  # 1.0.0 -> 1.0.1-alpha.0
npm run version:prerelease --preid=beta   # 1.0.0 -> 1.0.1-beta.0
npm run version:prerelease --preid=rc     # 1.0.0 -> 1.0.1-rc.0
```

### Build and Package

```bash
# Clean build
npm run clean
npm run build

# Create release package
npm run package:release

# Build Docker image
npm run docker:build

# Export Docker image
npm run docker:export
```

### Testing and Validation

```bash
# Run all tests before release
npm run test:all

# Run smoke tests
npm run test:smoke

# Run UAT tests
npm run test:uat

# Validate release artifacts
npm run validate:release
```

### Distribution

```bash
# Publish to npm (if applicable)
npm publish

# Push Docker images
npm run docker:push

# Create GitHub release
npm run release:github

# Send notifications
npm run notify:release
```

## 5. Release Checklist

### Pre-Release

- [ ] All tests passing (unit, integration, UAT)
- [ ] Code coverage meets requirements (90%+)
- [ ] Security scan completed (no high/critical issues)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Release notes prepared

### Release

- [ ] Release artifacts generated
- [ ] Checksums calculated and verified
- [ ] Docker images built and tested
- [ ] Smoke tests passed on all target platforms
- [ ] UAT scenarios completed successfully
- [ ] GitHub release created
- [ ] Docker images pushed to registries

### Post-Release

- [ ] Release notifications sent
- [ ] Documentation site updated
- [ ] Community announcements posted
- [ ] Monitoring dashboards checked
- [ ] Feedback channels monitored
- [ ] Next release planning initiated

## 6. Troubleshooting Release Issues

### Common Release Problems

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails | Missing dependencies | Run `npm ci` and retry |
| Tests timeout | Resource constraints | Increase test timeout limits |
| Docker build fails | Multi-stage build issue | Check Dockerfile syntax |
| Checksum mismatch | File corruption | Regenerate artifacts |
| Upload fails | Network/auth issue | Check credentials and retry |

### Emergency Rollback

```bash
# Rollback GitHub release
gh release delete v1.0.0 --yes

# Rollback Docker images
docker rmi sherlock-omega/ide:v1.0.0
docker rmi sherlock-omega/ide:latest

# Revert version in package.json
git checkout HEAD~1 -- package.json

# Notify stakeholders
./scripts/send-rollback-notification.sh --version v1.0.0
```

---

## 🎯 Next Steps

1. **Review** this release process with the development team
2. **Test** the release scripts in a staging environment
3. **Customize** notification templates for your organization
4. **Schedule** regular release cycles (e.g., bi-weekly)
5. **Monitor** feedback channels and iterate on the process

**Ready to release computational consciousness to the world! 🧠🚀**