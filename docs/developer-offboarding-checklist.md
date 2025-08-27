# Sherlock Ω IDE - Developer Offboarding Checklist

## 🛡️ Secure Developer Offboarding Protocol (Enhanced)

Follow these steps to securely remove a developer's access to the Sherlock Ω IDE project and related services. This checklist ensures complete security while maintaining audit trails.

**Features:**
- User-provided streamlined workflow with comprehensive enterprise security
- Git commit tracking and audit trails
- Supabase and GitHub OAuth credential management
- Links to security documentation for ongoing hardening

---

## 📋 Pre-Offboarding Information Collection

**Developer Information:**
- Developer Name: `_______________________`
- Email: `_______________________`
- GitHub Username: `_______________________`
- Role: `_______________________`
- Offboarding Date: `_______________________`
- Offboarding Initiated By: `_______________________`
- Reason: `_______________________`

---

## 1. 🔍 Code Audit and Git History Review (Enhanced)

### Git Commit Analysis with Audit Trail
- [ ] Record the last git commit hash associated with the developer's work:
    ```bash
    git log --author="<developer_email>" --pretty=format:"%h %s %ad" --date=short -n 10
    ```
    **Last 5 commits (user-provided pattern):**
    ```
    _______________________________________________
    _______________________________________________
    _______________________________________________
    _______________________________________________
    _______________________________________________
    ```

- [ ] Check for recent contributions in the last 30 days:
    ```bash
    git log --author="<developer_email>" --since="30 days ago" --oneline
    ```

- [ ] Search for hardcoded credentials or secrets in their commits:
    ```bash
    git log --author="<developer_email>" -p | grep -iE "(password|secret|key|token|api)" || echo "No secrets found"
    ```

- [ ] Review pull requests and code reviews:
    ```bash
    # List recent PRs by the developer
    gh pr list --author="<developer_username>" --state=all --limit=10
    ```

### Environment File Cleanup (User-Provided Pattern)
- [ ] Delete developer-specific environment files:
    ```bash
    rm -f .env.<developer_name>.local
    rm -f .env.<developer_name>.*
    ```

- [ ] Search for developer name in configuration files:
    ```bash
    grep -r "<developer_name>" . --exclude-dir=node_modules --exclude-dir=.git
    ```

---

## 2. 🐙 GitHub Access Revocation (Enhanced with OAuth App Management)

### Repository Access (User-Provided Pattern)
- [ ] Remove developer from repository collaborators
- [ ] Remove from organization teams (if applicable)
- [ ] Revoke any personal access tokens the developer created
- [ ] Check and update CODEOWNERS file if developer was listed
- [ ] Remove from GitHub OAuth app authorized users (if applicable)

### OAuth Application Management (User-Provided + Enhanced)
- [ ] Review GitHub OAuth app (ID: 3142320) for any developer-specific configurations
    ```
    https://github.com/settings/applications/3142320
    ```
- [ ] Rotate GitHub OAuth Client Secret if developer had access:
    - Navigate to: https://github.com/settings/applications/3142320
    - Generate new client secret
    - Update all environment files with new secret
    - **Security Link:** [GitHub OAuth App Security](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [ ] Check GitHub App installations and permissions (if applicable)
- [ ] Update audit logs with rotated credentials and git commit hash

---

## 3. ⚡ Supabase Access Management (Enhanced with Security Links)

### User Account Management (User-Provided Pattern)
- [ ] Navigate to Supabase Dashboard: 
    ```
    https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp
    ```
- [ ] Go to Authentication > Users
- [ ] Find and delete/disable the developer's user account
- [ ] Record user ID before deletion: `_______________________`
- [ ] **Security Documentation:** [Managing Users](https://supabase.com/docs/guides/auth/managing-users)

### API Keys and Secrets (Enhanced)
- [ ] Rotate Supabase service role key if developer had access:
    - Go to Settings > API
    - Generate new service role key
    - Update all environment files
    - **Security Link:** [Supabase Auth Security Best Practices](https://supabase.com/docs/guides/auth#best-practices)
- [ ] Review and rotate JWT secret if compromised
- [ ] Check auth provider settings and update if needed
- [ ] Review database policies for any developer-specific rules
- [ ] **Additional Security:** [Environment Variables Best Practices](https://supabase.com/docs/guides/hosting/environment-variables)

### Database Access Audit
- [ ] Check database logs for developer's recent activity:
    ```sql
    SELECT * FROM audit_logs WHERE user_email = '<developer_email>' 
    ORDER BY created_at DESC LIMIT 20;
    ```
- [ ] Review any custom database functions or triggers created by developer
- [ ] Check for any stored procedures or views with developer access

---

## 4. 🔐 OAuth and Authentication Cleanup (User-Provided + Enhanced)

### Credential Rotation (User-Provided Pattern Enhanced)
- [ ] Rotate shared OAuth secrets if developer had access:
    ```bash
    # Generate new secrets
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
    ```
- [ ] Update NEXTAUTH_SECRET in all environments
- [ ] Update JWT_SECRET in all environments
- [ ] Update ENCRYPTION_KEY in all environments
- [ ] Update webhook secrets for GitHub and Supabase
- [ ] **Security Documentation:** [Securing Supabase Auth](https://supabase.com/docs/guides/auth)

### Session Management
- [ ] Revoke all active sessions for the developer
- [ ] Clear any cached authentication tokens
- [ ] Remove developer from any OAuth application authorized users list
- [ ] Update git commit hash in audit logs for tracking

**Tip from user:** Run `git log --author="<dev>"` to review recent contributions and confirm no secrets were committed.

---

## 5. 🏗️ Infrastructure and Deployment Access

### CI/CD and Deployment
- [ ] Remove developer from deployment pipelines
- [ ] Revoke access to cloud infrastructure (if applicable)
- [ ] Remove SSH keys from deployment servers
- [ ] Check Docker registry access and remove if needed
- [ ] Review GitHub Actions secrets and remove developer-specific ones

### Environment Management
- [ ] Remove developer from staging environment access
- [ ] Remove from production environment access
- [ ] Check monitoring tools (Sentry, etc.) and remove access
- [ ] Remove from any third-party integrations (AI APIs, Quantum services)

---

## 6. 📚 Documentation and Knowledge Transfer

### Project Documentation
- [ ] Remove developer from team lists and onboarding documentation
- [ ] Update project README if developer was mentioned
- [ ] Remove developer from contributor lists
- [ ] Update contact information and escalation paths

### Knowledge Transfer
- [ ] Document any critical knowledge the developer possessed:
    ```
    Critical Knowledge Areas:
    _________________________________________
    _________________________________________
    _________________________________________
    ```
- [ ] Identify and reassign any ongoing projects
- [ ] Transfer ownership of any tools or scripts created by developer

---

## 7. 🔒 Security Hardening Post-Offboarding

### Access Review
- [ ] Review all system access logs for the past 30 days
- [ ] Check for any unusual activity or access patterns
- [ ] Verify no backdoors or unauthorized access methods remain

### Secret Rotation Timeline
- [ ] Immediate (within 24 hours):
    - OAuth client secrets
    - Personal access tokens
    - Database passwords
- [ ] Within 48 hours:
    - JWT secrets
    - Encryption keys
    - Webhook secrets
- [ ] Within 1 week:
    - SSL certificates (if developer had access)
    - API keys for external services

---

## 8. 📊 Audit Trail and Compliance

### Audit Log Creation
- [ ] Create comprehensive audit log entry:
    ```json
    {
      "timestamp": "YYYY-MM-DDTHH:MM:SSZ",
      "action": "developer_offboarding",
      "developer": {
        "name": "<developer_name>",
        "email": "<developer_email>",
        "role": "<role>",
        "last_commit": "<git_commit_hash>",
        "last_active": "YYYY-MM-DD"
      },
      "actions_taken": [
        "repository_access_revoked",
        "supabase_account_disabled",
        "oauth_secrets_rotated",
        "environment_files_cleaned"
      ],
      "completed_by": "<admin_name>",
      "git_state": {
        "branch": "<current_branch>",
        "commit": "<current_commit>"
      }
    }
    ```

### Compliance Documentation
- [ ] Save this completed checklist with timestamp
- [ ] Document any exceptions or issues encountered
- [ ] Store audit trail in secure location
- [ ] Update security incident log if applicable

---

## 9. ✅ Final Verification

### System Testing
- [ ] Test OAuth flows still work with rotated credentials
- [ ] Verify GitHub integration functions correctly
- [ ] Confirm Supabase authentication works
- [ ] Test deployment pipelines with new credentials

### Access Verification
- [ ] Confirm developer cannot access any systems
- [ ] Verify all credentials have been rotated
- [ ] Check that no developer-specific configurations remain

---

## 📝 Completion Sign-off

**Offboarding Completed By:** `_______________________`  
**Date:** `_______________________`  
**Time:** `_______________________`  
**Current Git Commit:** `_______________________`

**Post-Offboarding Actions Required:**
- [ ] Monitor systems for any unusual activity for 7 days
- [ ] Update team documentation and processes
- [ ] Review and update offboarding procedures if needed

---

## 🚨 Emergency Contacts

If security issues are discovered during or after offboarding:

- **Security Team Lead:** `_______________________`
- **DevOps Lead:** `_______________________`
- **Project Manager:** `_______________________`

---

## 🔗 Security Documentation for Ongoing Hardening (User-Provided)

**Further Reading and Hardening:**
- [Supabase Auth Security Best Practices](https://supabase.com/docs/guides/auth#best-practices)
- [GitHub OAuth App Security](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [Environment Variables in Supabase](https://supabase.com/docs/guides/hosting/environment-variables)
- [Securing Supabase Auth](https://supabase.com/docs/guides/auth)
- [Managing OAuth Providers](https://supabase.com/docs/guides/auth/social-login/github)

> **Security Reminder (User-Provided):** Always rotate shared secrets and audit logs after offboarding to maintain security. Document everything for compliance and audit purposes.

**Generated from Sherlock Ω IDE Security Protocols - Version 2.0 (Enhanced with User Contributions)**