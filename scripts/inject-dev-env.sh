#!/usr/bin/env bash

# Multi-developer environment injector with git commit tracking
# Creates or updates .env.local for each developer with comprehensive OAuth configuration
# Enhanced with Supabase documentation links for ongoing system hardening
# 
# Usage: ./scripts/inject-dev-env.sh <developer_name>
# Example: ./scripts/inject-dev-env.sh john_doe

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEV_NAME=$1
if [[ -z "$DEV_NAME" ]]; then
  echo -e "${BLUE}Multi-Developer Environment Injector for Sherlock Ω IDE${NC}"
  echo -e "${BLUE}=========================================================${NC}"
  echo ""
  echo "Usage: $0 <developer_name>"
  echo ""
  echo "Examples:"
  echo "  $0 john_doe"
  echo "  $0 alice_smith"
  echo ""
  echo "Features:"
  echo "  • Git commit tracking for audit trails"
  echo "  • Comprehensive OAuth configuration with validation"
  echo "  • Supabase security documentation links"
  echo "  • Automatic secret generation"
  echo "  • Enterprise audit logging"
  echo ""
  echo -e "${YELLOW}🔗 Supabase Security Resources:${NC}"
  echo "  • Securing Supabase Auth: https://supabase.com/docs/guides/auth"
  echo "  • Managing OAuth Providers: https://supabase.com/docs/guides/auth/social-login/github"
  echo "  • Environment Variables Best Practices: https://supabase.com/docs/guides/hosting/environment-variables"
  exit 1
fi

# Validate developer name format
if [[ ! "$DEV_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo -e "${RED}Error: Developer name must contain only letters, numbers, underscore, and hyphen${NC}"
    exit 1
fi

ENV_FILE=".env.$DEV_NAME.local"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo -e "${GREEN}🚀 Sherlock Ω IDE - Multi-Developer Environment Setup${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "Developer: ${BLUE}$DEV_NAME${NC}"
echo -e "Environment: ${BLUE}$ENV_FILE${NC}"
echo -e "Timestamp: ${BLUE}$TIMESTAMP${NC}"
echo ""

# Get current git commit hash and branch
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${YELLOW}📊 Git Information:${NC}"
echo -e "   Branch: ${BLUE}$GIT_BRANCH${NC}"
echo -e "   Commit: ${BLUE}$GIT_SHORT${NC} ($GIT_COMMIT)"
echo ""

# Check if environment file already exists
if [[ -f "$ENV_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Environment file already exists: $ENV_FILE${NC}"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted by user${NC}"
        exit 0
    fi
    # Backup existing file
    BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📋 Backing up existing $ENV_FILE to $BACKUP_FILE${NC}"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo ""
fi

# Dashboard links
echo -e "${YELLOW}🔗 Dashboard Links:${NC}"
echo "   GitHub OAuth: https://github.com/settings/applications/3142320"
echo "   Supabase: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp"
echo ""

# Interactive credential collection with validation
echo -e "${BLUE}🔐 OAuth Credential Collection${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

echo -e "${YELLOW}GitHub OAuth Configuration:${NC}"
echo "Please visit: https://github.com/settings/applications/3142320"
echo "Verify these settings:"
echo "  • Application name: Sherlock Ω IDE (Development)"
echo "  • Homepage URL: http://localhost:3002"
echo "  • Authorization callback URL: http://localhost:3002/api/auth/callback/github"
echo ""

# Get GitHub credentials with validation
while true; do
    read -p "GitHub Client ID: " GITHUB_CLIENT_ID
    if [[ ${#GITHUB_CLIENT_ID} -ge 10 ]]; then
        break
    else
        echo -e "${RED}Error: GitHub Client ID seems too short${NC}"
    fi
done

while true; do
    read -s -p "GitHub Client Secret: " GITHUB_CLIENT_SECRET
    echo
    if [[ ${#GITHUB_CLIENT_SECRET} -ge 20 ]]; then
        break
    else
        echo -e "${RED}Error: GitHub Client Secret seems too short${NC}"
    fi
done

# Optional Personal Access Token
echo ""
read -p "Do you want to add a GitHub Personal Access Token for enhanced features? (y/N): " -n 1 -r
echo
GITHUB_ACCESS_TOKEN=""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Create a token at: https://github.com/settings/tokens/new"
    echo "Required scopes: repo, read:user, user:email, workflow"
    read -s -p "GitHub Personal Access Token (optional): " GITHUB_ACCESS_TOKEN
    echo
fi

echo ""
echo -e "${YELLOW}Supabase Configuration:${NC}"
echo "Please visit: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp"
echo "Go to Settings > API to get your keys"
echo ""

# Pre-configured Supabase URL
SUPABASE_URL="https://ecgexzqtuhgdinohychp.supabase.co"
echo -e "Supabase URL: ${GREEN}$SUPABASE_URL${NC} (pre-configured)"

# Get Supabase credentials with validation
while true; do
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    if [[ $SUPABASE_ANON_KEY == eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9* ]]; then
        break
    else
        echo -e "${RED}Error: Invalid Supabase anon key format${NC}"
    fi
done

while true; do
    read -s -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    echo
    if [[ $SUPABASE_SERVICE_ROLE_KEY == eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9* ]]; then
        break
    else
        echo -e "${RED}Error: Invalid Supabase service role key format${NC}"
    fi
done

while true; do
    read -s -p "Supabase JWT Secret: " SUPABASE_JWT_SECRET
    echo
    if [[ ${#SUPABASE_JWT_SECRET} -ge 32 ]]; then
        break
    else
        echo -e "${RED}Error: JWT Secret must be at least 32 characters${NC}"
    fi
done

# Get callback URL
echo ""
read -p "Callback URL [default: http://127.0.0.1:3002/auth/callback]: " CALLBACK_URL
CALLBACK_URL=${CALLBACK_URL:-http://127.0.0.1:3002/auth/callback}

# Generate secure secrets
echo ""
echo -e "${BLUE}🔒 Generating Secure Secrets${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""

generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)
GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-20)

echo -e "${GREEN}✅ Generated secure secrets:${NC}"
echo "  • NextAuth Secret: ${NEXTAUTH_SECRET:0:8}..."
echo "  • JWT Secret: ${JWT_SECRET:0:8}..."
echo "  • Encryption Key: ${ENCRYPTION_KEY:0:8}..."
echo "  • Webhook Secret: ${GITHUB_WEBHOOK_SECRET:0:8}..."
echo ""

# Create comprehensive environment file
echo -e "${BLUE}📝 Creating Environment Configuration${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

cat <<EOF > "$ENV_FILE"
# Sherlock Ω IDE - Developer Environment Configuration
# Developer: $DEV_NAME
# Generated: $TIMESTAMP
# Git Commit: $GIT_COMMIT ($GIT_BRANCH)
#
# 🔗 Supabase Security Resources:
# - Securing Supabase Auth: https://supabase.com/docs/guides/auth
# - Managing OAuth Providers: https://supabase.com/docs/guides/auth/social-login/github
# - Environment Variables Best Practices: https://supabase.com/docs/guides/hosting/environment-variables
# - Supabase Auth Security Best Practices: https://supabase.com/docs/guides/auth#best-practices
# - GitHub OAuth App Security: https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps

# ============================================================================
# DEVELOPER METADATA
# ============================================================================
DEVELOPER_NAME=$DEV_NAME
DEVELOPER_ENV_CREATED=$TIMESTAMP
GIT_COMMIT=$GIT_COMMIT
GIT_BRANCH=$GIT_BRANCH
CONFIG_SCRIPT_VERSION=2.0.0

# ============================================================================
# GITHUB OAUTH INTEGRATION
# ============================================================================
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET
EOF

# Add GitHub Personal Access Token if provided
if [[ -n "$GITHUB_ACCESS_TOKEN" ]]; then
    echo "GITHUB_ACCESS_TOKEN=$GITHUB_ACCESS_TOKEN" >> "$ENV_FILE"
else
    echo "# GITHUB_ACCESS_TOKEN=ghp_your_personal_access_token_here  # Optional" >> "$ENV_FILE"
fi

# Continue with Supabase and other configurations
cat <<EOF >> "$ENV_FILE"

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET

# ============================================================================
# OAUTH CALLBACK CONFIGURATION
# ============================================================================
NEXTAUTH_URL=$CALLBACK_URL
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3002

# ============================================================================
# SECURITY SECRETS (AUTO-GENERATED)
# ============================================================================
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=3002
DEBUG=sherlock:*

# ============================================================================
# FEATURE FLAGS
# ============================================================================
FEATURE_QUANTUM_COMPUTING=true
FEATURE_AI_ASSISTANCE=true
FEATURE_COLLABORATION=true
FEATURE_TELEMETRY=false

# ============================================================================
# INFRASTRUCTURE (OPTIONAL)
# ============================================================================
MONGODB_URI=mongodb://localhost:27017/sherlock-omega-ide-$DEV_NAME
REDIS_URL=redis://localhost:6379

# ============================================================================
# SETUP STATUS
# ============================================================================
OAUTH_SETUP_COMPLETE=true
DEVELOPER_ENV_SETUP=true
GITHUB_INTEGRATION_COMPLETE=true
SUPABASE_INTEGRATION_COMPLETE=true
EOF

# Set secure file permissions
chmod 600 "$ENV_FILE"
echo -e "${GREEN}🔒 Set secure file permissions (600)${NC}"

# Create audit log entry
AUDIT_LOG="$PROJECT_DIR/audit-log-env-injection.json"
AUDIT_ENTRY=$(cat <<EOF
{
    "timestamp": "$TIMESTAMP",
    "event": "developer_env_created",
    "details": {
        "developer_name": "$DEV_NAME",
        "env_file": "$ENV_FILE",
        "git_commit": "$GIT_COMMIT",
        "git_branch": "$GIT_BRANCH"
    },
    "script_version": "2.0.0"
}
EOF
)

if [[ -f "$AUDIT_LOG" ]]; then
    # Add to existing log
    temp_file=$(mktemp)
    jq ". += [$AUDIT_ENTRY]" "$AUDIT_LOG" > "$temp_file" && mv "$temp_file" "$AUDIT_LOG" 2>/dev/null || {
        echo "[$AUDIT_ENTRY]" > "$AUDIT_LOG"
    }
else
    # Create new log
    echo "[$AUDIT_ENTRY]" > "$AUDIT_LOG"
fi

echo -e "${GREEN}📋 Audit log updated${NC}"
echo ""

# Show summary
echo -e "${BLUE}📊 Configuration Summary${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "Developer: ${YELLOW}$DEV_NAME${NC}"
echo -e "Environment File: ${YELLOW}$ENV_FILE${NC}"
echo -e "Git Commit: ${YELLOW}$GIT_SHORT${NC}"
echo -e "Timestamp: ${YELLOW}$TIMESTAMP${NC}"
echo ""

# Next steps
echo -e "${GREEN}🚀 Next Steps${NC}"
echo -e "${GREEN}=============${NC}"
echo "1. Copy the environment file to .env.local:"
echo -e "   ${YELLOW}cp $ENV_FILE .env.local${NC}"
echo ""
echo "2. Start the development server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Test OAuth flows:"
echo -e "   ${YELLOW}curl -X GET http://localhost:3002/api/auth/github${NC}"
echo ""
echo "4. Validate configuration:"
echo -e "   ${YELLOW}npm run config:validate${NC}"
echo ""

# Security reminders
echo -e "${RED}🛡️  Security Reminders${NC}"
echo -e "${RED}===================${NC}"
echo -e "${RED}• Never commit .env files to git${NC}"
echo -e "${RED}• Rotate secrets regularly${NC}"
echo -e "${RED}• Use different credentials for each environment${NC}"
echo -e "${RED}• Keep audit logs for compliance${NC}"
echo ""

# Documentation links
echo -e "${YELLOW}🔗 Supabase Security Resources for Ongoing Hardening:${NC}"
echo "  • Securing Supabase Auth: https://supabase.com/docs/guides/auth"
echo "  • Managing OAuth Providers: https://supabase.com/docs/guides/auth/social-login/github"
echo "  • Environment Variables Best Practices: https://supabase.com/docs/guides/hosting/environment-variables"
echo "  • Supabase Auth Security Best Practices: https://supabase.com/docs/guides/auth#best-practices"
echo "  • GitHub OAuth App Security: https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps"
echo ""

echo -e "${GREEN}🎉 Environment setup complete! Add/commit as needed. (Never commit real secrets!)${NC}"

exit 0