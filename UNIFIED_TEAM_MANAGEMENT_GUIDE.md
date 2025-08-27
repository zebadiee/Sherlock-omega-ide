# 🚀 Unified Team Management System - Complete Guide

**Sherlock Ω IDE Team Management with Enhanced OAuth Security**

This guide integrates the user-provided streamlined approach with enterprise-grade team management capabilities, featuring comprehensive OAuth security and Supabase documentation links for ongoing system hardening.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Streamlined Role-Based Access Control](#streamlined-role-based-access-control)
3. [Developer Onboarding](#developer-onboarding)
4. [Environment Injection](#environment-injection)
5. [Developer Offboarding](#developer-offboarding)
6. [OAuth Security Management](#oauth-security-management)
7. [Team Management Commands](#team-management-commands)
8. [Security Documentation Links](#security-documentation-links)
9. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Installation and Setup

```bash
# Install dependencies
npm install

# Set up OAuth configuration (choose one method)
npm run team:inject-env <developer_name>    # Streamlined bash script (recommended)
npm run config:oauth                        # Enterprise TypeScript setup
./configure-oauth-env.sh                    # Direct script execution

# Validate configuration
npm run config:validate
```

### Essential Commands

```bash
# Developer lifecycle
npm run team:onboard alice_smith developer
npm run team:inject-env alice_smith
npm run team:offboard alice_smith

# Team management
npm run team:list
npm run team:audit
npm run team:validate-oauth
```

## 🔑 Streamlined Role-Based Access Control

Based on user requirements, the system implements a **3-tier hierarchy** with comprehensive permissions:

### Role Hierarchy

```
admin (Level 3)
├── Full system access with all administrative privileges
├── OAuth credential management and secret rotation
├── Team onboarding/offboarding capabilities
└── Git commit auditing and environment management

developer (Level 2)
├── Full development access with quantum and AI capabilities
├── Code editing, project creation, and deployment (dev/staging)
├── Git operations and environment injection
└── Quantum algorithm execution and AI model training

viewer (Level 1)
├── Read-only access for observation and learning
├── Documentation access and public project viewing
└── Basic tutorial and example access
```

### Permission Examples

```typescript
// User-provided permission checking pattern
if (!hasPermission(currentUser, 'manage:users')) { 
  throw new Error('Access denied') 
}

// Enhanced feature access
if (canAccessQuantum(user)) {
  // Show quantum computing features
}

if (hasPermission(user, 'manage:oauth-credentials')) {
  // Show OAuth management interface
}
```

## 👥 Developer Onboarding

### Interactive Onboarding

```bash
npm run team:onboard
# or
npm run team:onboard alice_smith developer
```

### Onboarding Process

1. **Developer Information Collection**
   - Name and email validation
   - Role selection (admin/developer/viewer)
   - Permission review and confirmation

2. **Environment Setup**
   - Automatic environment file generation
   - Git commit tracking for audit trails
   - Role-based feature flag configuration

3. **Audit Logging**
   - JSON audit trail with timestamps
   - Git commit hash tracking
   - Developer lifecycle events

### Example Output

```bash
🚀 Sherlock Ω IDE - Unified Team Management
=============================================

👥 Developer Onboarding
======================

Developer name: alice_smith
Developer email: alice@company.com

Available roles (streamlined):
  1. admin    - Full system access
  2. developer - Development access with quantum/AI
  3. viewer   - Read-only access

Select role (admin/developer/viewer): developer

📋 Permissions for developer:
  • edit:code
  • deploy:dev
  • view:logs
  • execute:quantum-algorithms
  • access:ai-assistant
  • ... and 15 more permissions

✅ Developer onboarded successfully!
   ID: dev_1677123456789_abc123def
   Environment: .env.alice_smith.local
   Role: developer
   Onboarded: 2024-03-15T10:30:00.000Z

🔧 Next Steps:
1. Run environment injection: npm run team:inject-env alice_smith
2. Configure OAuth credentials
3. Test access with: npm run team:validate-oauth
```

## 🔧 Environment Injection

### Multi-Method Environment Setup

The system provides **three approaches** for environment configuration:

#### 1. Streamlined Bash Script (Recommended)

```bash
npm run team:inject-env alice_smith
# or direct execution
./scripts/inject-dev-env.sh alice_smith
```

**Features:**
- Interactive credential collection with validation
- Git commit tracking for audit trails
- Comprehensive OAuth configuration
- Supabase security documentation links
- Automatic secret generation

#### 2. Enterprise TypeScript Setup

```bash
npm run config:oauth
```

**Features:**
- Advanced validation and error handling
- Integration with existing enterprise infrastructure
- Comprehensive audit logging
- CLI interface with colored output

#### 3. Unified Approach

```bash
npm run config:oauth-unified
```

**Features:**
- Best of both streamlined and enterprise approaches
- Interactive prompts with validation
- Enterprise security protocols
- Comprehensive documentation links

### Environment File Structure

```bash
# Sherlock Ω IDE - Developer Environment Configuration
# Developer: alice_smith
# Generated: 2024-03-15T10:30:00.000Z
# Git Commit: abc123def (main)
#
# 🔗 Supabase Security Resources:
# - Securing Supabase Auth: https://supabase.com/docs/guides/auth
# - Managing OAuth Providers: https://supabase.com/docs/guides/auth/social-login/github
# - Environment Variables Best Practices: https://supabase.com/docs/guides/hosting/environment-variables

# ============================================================================
# DEVELOPER METADATA
# ============================================================================
DEVELOPER_NAME=alice_smith
DEVELOPER_ENV_CREATED=2024-03-15T10:30:00.000Z
GIT_COMMIT=abc123def456789
GIT_BRANCH=main
CONFIG_SCRIPT_VERSION=2.0.0

# ============================================================================
# GITHUB OAUTH INTEGRATION
# ============================================================================
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_WEBHOOK_SECRET=auto_generated_secret

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://ecgexzqtuhgdinohychp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your_jwt_secret_here

# ============================================================================
# AUTO-GENERATED SECURITY SECRETS
# ============================================================================
NEXTAUTH_SECRET=auto_generated_32_chars
JWT_SECRET=auto_generated_32_chars
ENCRYPTION_KEY=auto_generated_32_chars

# ============================================================================
# FEATURE FLAGS (ROLE-BASED)
# ============================================================================
FEATURE_QUANTUM_COMPUTING=true
FEATURE_AI_ASSISTANCE=true
FEATURE_COLLABORATION=true
FEATURE_TELEMETRY=false

# ============================================================================
# SETUP STATUS
# ============================================================================
OAUTH_SETUP_COMPLETE=true
DEVELOPER_ENV_SETUP=true
GITHUB_INTEGRATION_COMPLETE=true
SUPABASE_INTEGRATION_COMPLETE=true
```

## 🛡️ Developer Offboarding

### Secure Offboarding Process

```bash
npm run team:offboard alice_smith
```

### Comprehensive Security Protocol

Based on user-provided patterns with enterprise enhancements:

#### 1. Git Commit Audit (User-Provided Pattern)

```bash
# Record last commits
git log --author="alice@company.com" --pretty=format:"%h %s %ad" --date=short -n 10

# Search for secrets
git log --author="alice@company.com" -p | grep -iE "(password|secret|key|token|api)"
```

#### 2. OAuth Credential Management

- **GitHub OAuth App (ID: 3142320)**
  - Rotate client secrets if developer had access
  - Remove from authorized users
  - Update all environment files
  - **Security Link:** [GitHub OAuth App Security](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)

- **Supabase Management**
  - Disable user account in dashboard
  - Rotate service role keys if compromised
  - Update JWT secrets
  - **Security Link:** [Supabase Auth Security](https://supabase.com/docs/guides/auth#best-practices)

#### 3. Environment Cleanup (User-Provided Pattern)

```bash
# Remove developer-specific environment files
rm -f .env.alice_smith.local
rm -f .env.alice_smith.*

# Search for developer references
grep -r "alice_smith" . --exclude-dir=node_modules --exclude-dir=.git
```

#### 4. Comprehensive Audit Report

```json
{
  "timestamp": "2024-03-15T15:45:00.000Z",
  "action": "developer_offboarding",
  "developer": {
    "name": "alice_smith",
    "email": "alice@company.com",
    "role": "developer",
    "last_commit": "def456789abc123",
    "last_active": "2024-03-15"
  },
  "actions_taken": [
    "repository_access_revoked",
    "supabase_account_disabled",
    "oauth_secrets_rotated",
    "environment_files_cleaned"
  ],
  "completed_by": "admin_user",
  "git_state": {
    "branch": "main",
    "commit": "abc123def456789"
  }
}
```

## 🔐 OAuth Security Management

### Dashboard Links (User-Provided)

- **GitHub OAuth App**: https://github.com/settings/applications/3142320
- **Supabase Project**: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp

### Credential Validation

```bash
# Validate OAuth configuration
npm run team:validate-oauth

# Test GitHub integration
curl -X GET "http://localhost:3002/api/auth/github"

# Test Supabase connection
curl -X GET "http://localhost:3002/api/health"
```

### Secret Rotation (User-Provided Pattern)

```bash
# Generate new secrets
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Automatic rotation with git tracking
npm run team:rotate-secrets
```

## 📋 Team Management Commands

### Core Commands

```bash
# Developer Lifecycle
npm run team:onboard [name] [role]          # Onboard new developer
npm run team:offboard [name]                # Secure offboarding
npm run team:inject-env [name]              # Environment setup
npm run team:update-role [name] [new_role]  # Role management

# Team Operations
npm run team:list [--role=role]             # List developers
npm run team:audit                          # Generate audit report
npm run team:validate-oauth                 # Validate OAuth setup

# Security Operations
npm run team:rotate-secrets                 # Rotate shared secrets
npm run team:cleanup-env                    # Clean old environment files
```

### Advanced Usage

```bash
# Filter by role
npm run team:list --role=developer

# Filter by status
npm run team:list --status=active

# Interactive mode
npm run team:onboard --interactive

# Audit with export
npm run team:audit --export=json > team-audit.json
```

## 🔗 Security Documentation Links

### Supabase Security Resources (User-Provided)

- **[Securing Supabase Auth](https://supabase.com/docs/guides/auth)** - Complete authentication security guide
- **[Managing OAuth Providers](https://supabase.com/docs/guides/auth/social-login/github)** - GitHub OAuth configuration
- **[Environment Variables Best Practices](https://supabase.com/docs/guides/hosting/environment-variables)** - Secure credential management
- **[Supabase Auth Security Best Practices](https://supabase.com/docs/guides/auth#best-practices)** - Advanced security measures

### GitHub Security Resources

- **[GitHub OAuth App Security](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)** - OAuth application security
- **[Personal Access Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)** - Token management

### Enterprise Security

- **OAuth 2.0 Security Best Practices** - RFC 6749 security considerations
- **JWT Security** - Token validation and rotation
- **Environment Variable Security** - Credential protection patterns

## 🔧 Troubleshooting

### Common Issues

#### OAuth Authentication Errors

```bash
# Problem: Invalid client credentials
# Solution: Verify credentials at dashboard links
curl -X GET "https://github.com/settings/applications/3142320"

# Problem: Callback URL mismatch
# Solution: Ensure callback URL is http://localhost:3002/api/auth/callback/github
```

#### Environment Configuration Issues

```bash
# Problem: Environment variables not loading
# Solution: Restart dev server after changing .env.local
npm run dev

# Problem: Permission errors
# Solution: Check file permissions
chmod 600 .env.*.local

# Problem: Git commit tracking failed
# Solution: Ensure git repository is initialized
git init && git add . && git commit -m "Initial commit"
```

#### Supabase Connection Issues

```bash
# Problem: Invalid JWT
# Solution: Regenerate JWT secret in Supabase dashboard
# Navigate to: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp

# Problem: CORS errors
# Solution: Verify site URL in Supabase auth settings
# Set to: http://localhost:3002
```

### Debug Commands

```bash
# Check environment variables
npm run config:validate

# View audit logs
cat audit-log-team-management.json

# Test role permissions
npm run test:roles

# Validate git tracking
git log --oneline -5
```

### Support Resources

- **Configuration Script**: `npm run config:oauth`
- **Validation**: `npm run config:validate`
- **Comprehensive Setup**: `./INTEGRATION_SETUP_GUIDE.md`
- **OAuth Guide**: `./OAUTH_SETUP_GUIDE.md`
- **Security Checklist**: `./docs/developer-offboarding-checklist.md`

## 🎯 Best Practices

### Security (User-Provided + Enhanced)

1. **Never commit .env files to git**
2. **Rotate secrets regularly**
3. **Use different credentials for each environment**
4. **Keep audit logs for compliance**
5. **Follow Supabase security documentation**
6. **Track all changes with git commits**

### Team Management

1. **Use streamlined role hierarchy (admin/developer/viewer)**
2. **Maintain comprehensive audit trails**
3. **Follow consistent onboarding/offboarding procedures**
4. **Document all security incidents**
5. **Regular OAuth credential rotation**

### Development Workflow

1. **Environment-specific configurations**
2. **Git commit tracking for all changes**
3. **Comprehensive validation before deployment**
4. **Regular security audits**
5. **Documentation updates with each change**

---

**🎉 Ready to build quantum algorithms with enterprise-grade team management and automation!** 🚀

*Generated from Sherlock Ω IDE Team Management System - Version 2.0*  
*Enhanced with user-provided streamlined patterns and comprehensive security documentation*