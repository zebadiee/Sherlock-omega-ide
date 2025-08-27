# Team Management System - Sherlock Ω IDE

## 🎯 Overview

The Sherlock Ω IDE Team Management System provides enterprise-grade developer onboarding, offboarding, and access management with integrated security features, role-based access control, and comprehensive audit trails.

---

## 🏗️ System Components

### 1. 🔐 **Role-Based Access Control**
- **File**: [`src/auth/roles.ts`](src/auth/roles.ts)
- **Features**: 
  - 5-tier role system (admin, developer, researcher, student, viewer)
  - 50+ granular permissions for quantum/AI features
  - Middleware for route protection
  - Enterprise permission validation

### 2. 🛠️ **Developer Environment Management**
- **File**: [`scripts/inject-dev-env.sh`](scripts/inject-dev-env.sh)
- **Features**:
  - Multi-developer environment isolation
  - Git commit tracking in configurations
  - Automatic secret generation
  - Audit trail creation

### 3. 🛡️ **Security Offboarding**
- **File**: [`docs/developer-offboarding-checklist.md`](docs/developer-offboarding-checklist.md)
- **Features**:
  - Comprehensive 9-step security protocol
  - Git commit audit procedures
  - Secret rotation guidance
  - Compliance documentation

### 4. 👥 **Team Management Engine**
- **File**: [`src/team/team-manager.ts`](src/team/team-manager.ts)
- **Features**:
  - Automated developer lifecycle management
  - Environment file generation
  - Role updates with permission validation
  - Comprehensive audit logging

### 5. 💻 **Command Line Interface**
- **File**: [`src/cli/team-cli.ts`](src/cli/team-cli.ts)
- **Features**:
  - Interactive onboarding/offboarding
  - Git commit auditing
  - Team status reporting
  - Security checklist integration

---

## 🚀 Quick Start

### Onboard a New Developer
```bash
# Interactive onboarding
npm run team:onboard

# Or with parameters
npm run team onboard --name "Alice Johnson" --email "alice@company.com" --role developer
```

### Create Developer Environment
```bash
# Generate isolated environment
./scripts/inject-dev-env.sh alice

# Copy to active environment
cp .env.alice.local .env.local
```

### List Team Members
```bash
# All developers
npm run team:list

# Filter by status/role
npm run team list --status active --role developer
```

### Audit Developer Activity
```bash
# Audit git commits
npm run team:audit

# Check for potential secrets
npm run team audit --email alice@company.com
```

### Offboard Developer
```bash
# Interactive offboarding
npm run team offboard

# Follow comprehensive checklist
npm run team:checklist
```

---

## 🔑 Role System

### Role Hierarchy
1. **👑 Admin** - Full system access, user management
2. **🔬 Researcher** - Advanced quantum/AI access, research tools
3. **💻 Developer** - Code development, deployment access
4. **🎓 Student** - Learning features, supervised access
5. **👁️ Viewer** - Read-only access

### Permission Categories
- **User Management**: `manage:users`, `manage:roles`
- **Code & Projects**: `edit:code`, `manage:projects`, `deploy:*`
- **Quantum Computing**: `execute:quantum`, `create:quantum-circuits`
- **AI & ML**: `execute:ai`, `use:ai-models`, `train:ai-models`
- **Security**: `manage:security`, `view:security-events`
- **Monitoring**: `view:logs`, `view:metrics`, `export:data`

### Usage Examples
```typescript
import { hasPermission, canAccessQuantum, requirePermission } from './src/auth/roles';

// Check permissions
if (hasPermission(user, 'execute:quantum')) {
  // Allow quantum execution
}

// Feature access
if (canAccessQuantum(user)) {
  // Show quantum features
}

// Route protection
app.get('/admin/users', requirePermission('manage:users'), handler);
```

---

## 🛠️ Developer Environment System

### Environment File Structure
Each developer gets an isolated environment:
```
.env.alice.local          # Alice's environment
.env.bob.local            # Bob's environment
.env.charlie.local        # Charlie's environment
```

### Generated Environment Features
- **Developer Identification**: Name, email, role, ID
- **Git Tracking**: Current commit, branch, generation timestamp
- **OAuth Placeholders**: Ready for credential injection
- **Role-Based Features**: Automatic feature flags based on role
- **Security Secrets**: Auto-generated encryption keys
- **Isolated Infrastructure**: Separate database/cache namespaces

### Environment Generation
```bash
# Generate developer environment
./scripts/inject-dev-env.sh <developer_name>

# Example output:
# ✅ .env.alice.local created successfully!
# 📊 Git Information: main branch, commit abc123
# 🔒 Secured with 600 permissions
# 📋 Audit trail recorded
```

---

## 🛡️ Security & Offboarding

### Comprehensive Security Protocol

#### 1. **Pre-Offboarding Audit**
- Git commit history analysis
- Secret scanning in code contributions
- Environment file identification
- Access pattern review

#### 2. **System Access Revocation**
- GitHub repository and OAuth app access
- Supabase user account and API keys
- Environment file cleanup
- Session invalidation

#### 3. **Secret Rotation**
- OAuth client secrets
- Database passwords
- JWT and encryption keys
- Webhook secrets
- API tokens

#### 4. **Audit Trail Documentation**
- Complete action log with timestamps
- Git commit tracking
- Compliance documentation
- Post-offboarding monitoring plan

### Offboarding Checklist Usage
```bash
# Open interactive checklist
npm run team:checklist

# Automated offboarding
npm run team offboard --email developer@company.com

# Manual checklist location
docs/developer-offboarding-checklist.md
```

---

## 📊 Team Management Operations

### Developer Lifecycle Management

#### Onboarding Process
1. **Profile Creation**: Generate unique developer ID and profile
2. **Environment Setup**: Create isolated development environment
3. **Role Assignment**: Apply appropriate permissions and access levels
4. **Git Integration**: Track configuration with current commit
5. **Audit Logging**: Record all onboarding actions

#### Role Management
```typescript
// Update developer role (with permission checks)
await teamManager.updateDeveloperRole(currentUser, developerId, 'researcher');

// List developers by criteria
const activeDevelopers = await teamManager.listDevelopers({ 
  status: 'active', 
  role: 'developer' 
});

// Check upgrade permissions
if (canUpgradeRole(currentUser, 'admin')) {
  // Allow role upgrade
}
```

#### Offboarding Process
1. **Access Audit**: Review all developer access and contributions
2. **Environment Cleanup**: Remove all developer-specific files
3. **Security Review**: Scan for secrets and sensitive data
4. **Access Revocation**: Remove from all systems and services
5. **Documentation**: Generate comprehensive offboarding report

---

## 🔧 Command Reference

### Core Commands
```bash
# Team management
npm run team:onboard          # Interactive developer onboarding
npm run team:list             # List all developers
npm run team:audit            # Audit developer git activity
npm run team:status           # Show team statistics
npm run team:checklist        # Open offboarding checklist

# Environment management
./scripts/inject-dev-env.sh <name>  # Create developer environment
npm run setup:developer <name>      # Alternative environment setup

# Security operations
npm run security:audit-developer    # Audit specific developer
npm run team offboard               # Interactive offboarding
```

### Advanced CLI Usage
```bash
# Detailed onboarding
npm run team onboard \
  --name "Dr. Alice Quantum" \
  --email "alice@quantum-lab.com" \
  --role researcher \
  --department "Quantum Research" \
  --interactive

# Filtered listing
npm run team list \
  --status active \
  --role developer \
  --department "Engineering"

# Comprehensive audit
npm run team audit \
  --email alice@company.com \
  --include-secrets
```

---

## 📁 File Structure

```
sherlock-omega-ide/
├── src/
│   ├── auth/
│   │   └── roles.ts                 # Role-based access control
│   ├── team/
│   │   └── team-manager.ts          # Team management engine
│   └── cli/
│       └── team-cli.ts              # Command-line interface
├── scripts/
│   └── inject-dev-env.sh            # Environment generator
├── docs/
│   ├── developer-offboarding-checklist.md  # Security checklist
│   └── TEAM_MANAGEMENT_GUIDE.md     # This guide
├── team-developers.json             # Developer database
├── audit-log-team-management.json   # Audit trail
└── audit-log-env-setup.json        # Environment audit log
```

---

## 🎯 Integration Points

### OAuth Configuration
- **GitHub OAuth App**: ID `3142320`
- **Supabase Project**: `ecgexzqtuhgdinohychp`
- **Environment Templates**: Auto-configured with project URLs
- **Security Integration**: Role-based feature access

### Git Integration
- **Commit Tracking**: All configurations linked to git state
- **Author Auditing**: Complete commit history analysis
- **Secret Scanning**: Automated detection in developer contributions
- **Branch Awareness**: Environment configs track current branch

### Security Integration
- **Permission System**: Integrated with OAuth and API routes
- **Audit Logging**: Comprehensive action tracking
- **Secret Management**: Automatic generation and rotation guidance
- **Compliance**: Enterprise-grade documentation and procedures

---

## 🔍 Monitoring & Auditing

### Audit Trails
- **Team Actions**: All onboarding/offboarding recorded
- **Environment Changes**: Developer environment modifications
- **Role Updates**: Permission and access level changes
- **Security Events**: Offboarding and secret rotation activities

### Monitoring Commands
```bash
# Check team status
npm run team:status

# View recent activity
npm run team list --status active

# Audit specific developer
npm run team audit --email developer@company.com

# Review audit logs
cat audit-log-team-management.json | jq '.[].action' | sort | uniq -c
```

### Compliance Reporting
```bash
# Generate team report
npm run team list --format json > team-report-$(date +%Y%m%d).json

# Export audit trail
cp audit-log-team-management.json compliance-audit-$(date +%Y%m%d).json

# Security checklist completion
npm run team:checklist > offboarding-$(date +%Y%m%d).md
```

---

## 🚨 Security Best Practices

### Environment Security
- ✅ **Isolated Environments**: Each developer has separate configuration
- ✅ **Secure Permissions**: 600 file permissions on sensitive files
- ✅ **Git Tracking**: All configs linked to specific commits
- ✅ **Audit Trails**: Complete action logging

### Access Management
- ✅ **Role-Based Access**: Granular permission system
- ✅ **Permission Validation**: Middleware protection on routes
- ✅ **Upgrade Controls**: Hierarchical role management
- ✅ **Feature Flags**: Role-based feature access

### Offboarding Security
- ✅ **Complete Audit**: Git history and secret scanning
- ✅ **Access Revocation**: All systems and services
- ✅ **Secret Rotation**: Comprehensive credential updates
- ✅ **Documentation**: Compliance and audit trails

---

## 🎉 Getting Started

### 1. **Set Up Team Management**
```bash
# Verify system is ready
npm run team:status

# Create first developer
npm run team:onboard
```

### 2. **Configure OAuth Integration**
```bash
# Generate developer environment
./scripts/inject-dev-env.sh alice

# Configure OAuth credentials
npm run config:oauth-simple
```

### 3. **Test Access Control**
```bash
# Start development server
npm run dev

# Test role-based features
# Navigate to http://localhost:3002
```

### 4. **Manage Team Operations**
```bash
# Regular operations
npm run team:list           # Monitor team
npm run team:audit          # Security audits
npm run team:checklist      # Offboarding procedures
```

---

## 📞 Support & Documentation

### Quick Links
- **Role System**: [`src/auth/roles.ts`](src/auth/roles.ts)
- **Team CLI**: `npm run team --help`
- **Security Checklist**: [`docs/developer-offboarding-checklist.md`](docs/developer-offboarding-checklist.md)
- **Environment Generator**: [`scripts/inject-dev-env.sh`](scripts/inject-dev-env.sh)

### Help Commands
```bash
npm run team --help          # Full CLI help
npm run team onboard --help  # Onboarding options
npm run team list --help     # Listing filters
```

---

**Enterprise-grade team management for quantum computing development! 🚀**

*Complete developer lifecycle management with security, compliance, and audit trails built-in.*