#!/usr/bin/env bash

# Sherlock Ω IDE - Minimal Privacy Setup
# Implements: Simplistic Privacy | Seamless Security | Full SQL Support
#
# This script sets up the minimal environment following your requirements:
# - Minimal environment variables only
# - Developer isolation with per-user .env files
# - Supabase RLS and GitHub OAuth integration
# - Full SQL support with privacy-first approach

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

print_header() {
    echo -e "${BLUE}🔐 Sherlock Ω IDE - Minimal Privacy Setup${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${CYAN}Simplistic Privacy | Seamless Security | Full SQL Support${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}📋 $1${NC}"
    echo -e "${YELLOW}$(printf '=%.0s' $(seq 1 ${#1}))${NC}"
    echo ""
}

validate_environment() {
    print_section "Environment Validation"
    
    # Check required tools
    local required_tools=("git" "node" "npm" "curl" "openssl")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Please install missing tools and run again${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required tools available${NC}"
    echo ""
}

setup_minimal_environment() {
    print_section "Minimal Environment Setup"
    
    local dev_name="${1:-$(whoami)}"
    local env_file=".env.${dev_name}.minimal.local"
    
    echo -e "Developer: ${CYAN}$dev_name${NC}"
    echo -e "Environment file: ${CYAN}$env_file${NC}"
    echo ""
    
    # Check if minimal template exists
    if [[ ! -f ".env.minimal.template" ]]; then
        echo -e "${RED}❌ Minimal template not found${NC}"
        echo -e "${YELLOW}Creating minimal template...${NC}"
        create_minimal_template
    fi
    
    # Copy template to developer-specific file
    cp ".env.minimal.template" "$env_file"
    
    echo -e "${GREEN}✅ Minimal environment template created${NC}"
    echo -e "${BLUE}📁 File: $env_file${NC}"
    echo ""
    
    # Collect minimal credentials
    collect_minimal_credentials "$env_file"
}

collect_minimal_credentials() {
    local env_file="$1"
    
    print_section "Minimal Credential Collection"
    
    echo -e "${YELLOW}🔗 Required Dashboards:${NC}"
    echo "• GitHub OAuth: https://github.com/settings/applications/3142320"
    echo "• Supabase Project: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp"
    echo ""
    
    # GitHub OAuth (minimal permissions)
    echo -e "${CYAN}🐙 GitHub OAuth (minimal scopes):${NC}"
    read -p "GitHub Client ID: " github_client_id
    read -s -p "GitHub Client Secret: " github_client_secret
    echo
    
    # Validate GitHub credentials format
    if [[ ${#github_client_id} -lt 10 ]]; then
        echo -e "${RED}❌ Invalid GitHub Client ID${NC}"
        exit 1
    fi
    
    # Supabase (minimal keys)
    echo ""
    echo -e "${CYAN}⚡ Supabase (minimal configuration):${NC}"
    
    # Pre-configured URL
    local supabase_url="https://ecgexzqtuhgdinohychp.supabase.co"
    echo -e "Supabase URL: ${GREEN}$supabase_url${NC} (pre-configured)"
    
    read -p "Supabase Anon Key: " supabase_anon_key
    
    # Validate Supabase key format
    if [[ ! $supabase_anon_key == eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9* ]]; then
        echo -e "${RED}❌ Invalid Supabase anon key format${NC}"
        exit 1
    fi
    
    # OAuth callback
    echo ""
    local callback_url="http://127.0.0.1:3002/auth/callback"
    echo -e "OAuth Callback: ${GREEN}$callback_url${NC} (optimized)"
    echo ""
    
    # Update environment file with minimal credentials
    update_minimal_env_file "$env_file" "$github_client_id" "$github_client_secret" "$supabase_url" "$supabase_anon_key" "$callback_url"
}

update_minimal_env_file() {
    local env_file="$1"
    local github_client_id="$2"
    local github_client_secret="$3"
    local supabase_url="$4"
    local supabase_anon_key="$5"
    local callback_url="$6"
    
    # Get git commit for audit trail
    local git_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    # Update minimal credentials
    sed -i.bak "s|GITHUB_CLIENT_ID=.*|GITHUB_CLIENT_ID=$github_client_id|" "$env_file"
    sed -i.bak "s|GITHUB_CLIENT_SECRET=.*|GITHUB_CLIENT_SECRET=$github_client_secret|" "$env_file"
    sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" "$env_file"
    sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$supabase_anon_key|" "$env_file"
    sed -i.bak "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$callback_url|" "$env_file"
    sed -i.bak "s|GIT_COMMIT=.*|GIT_COMMIT=$git_commit|" "$env_file"
    
    # Update setup status
    sed -i.bak "s|MINIMAL_SETUP_COMPLETE=.*|MINIMAL_SETUP_COMPLETE=true|" "$env_file"
    
    # Remove backup file
    rm -f "${env_file}.bak"
    
    # Set secure permissions
    chmod 600 "$env_file"
    
    echo -e "${GREEN}✅ Minimal credentials configured${NC}"
    echo -e "${GREEN}🔒 Secure file permissions set (600)${NC}"
    echo ""
}

setup_supabase_rls() {
    print_section "Supabase RLS Configuration"
    
    echo -e "${CYAN}🛡️  Setting up Row-Level Security...${NC}"
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        echo -e "${BLUE}📡 Supabase CLI detected${NC}"
        
        # Apply privacy-first migrations
        if [[ -f "supabase/migrations/002_privacy_security_schema.sql" ]]; then
            echo -e "${YELLOW}🔄 Applying privacy-first schema...${NC}"
            
            # Link to project
            supabase link --project-ref ecgexzqtuhgdinohychp || true
            
            # Apply migrations
            supabase db push
            
            echo -e "${GREEN}✅ RLS policies applied${NC}"
        else
            echo -e "${YELLOW}⚠️  Migration file not found, run: npm run sql:setup${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase CLI not installed${NC}"
        echo -e "${BLUE}📋 Manual setup required:${NC}"
        echo "1. Install Supabase CLI: npm install -g supabase"
        echo "2. Run: supabase link --project-ref ecgexzqtuhgdinohychp"
        echo "3. Run: supabase db push"
    fi
    
    echo ""
}

setup_github_oauth() {
    print_section "GitHub OAuth Configuration"
    
    echo -e "${CYAN}🔧 OAuth Configuration Checklist:${NC}"
    echo ""
    echo -e "${YELLOW}✓ Required GitHub Settings:${NC}"
    echo "  • Application name: Sherlock Ω IDE (Minimal)"
    echo "  • Homepage URL: http://127.0.0.1:3002"
    echo "  • Authorization callback URL: http://127.0.0.1:3002/auth/callback"
    echo "  • Scopes: read:user, user:email (minimal permissions)"
    echo ""
    
    echo -e "${YELLOW}✓ Supabase Auth Provider:${NC}"
    echo "  • Go to Authentication > Providers"
    echo "  • Enable GitHub provider"
    echo "  • Add your GitHub Client ID and Secret"
    echo "  • Set redirect URL: http://127.0.0.1:3002/auth/callback"
    echo ""
    
    read -p "Press Enter after completing OAuth configuration..."
    echo ""
}

validate_minimal_setup() {
    print_section "Validation and Testing"
    
    local env_file
    env_file=$(find . -name ".env.*.minimal.local" -type f | head -n 1)
    
    if [[ -z "$env_file" ]]; then
        echo -e "${RED}❌ No minimal environment file found${NC}"
        return 1
    fi
    
    echo -e "${CYAN}🔍 Validating minimal setup...${NC}"
    
    # Source the environment file
    set -a
    source "$env_file"
    set +a
    
    # Check minimal required variables
    local required_vars=("GITHUB_CLIENT_ID" "GITHUB_CLIENT_SECRET" "SUPABASE_URL" "SUPABASE_ANON_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]] || [[ "${!var}" == *"placeholder"* ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required variables: ${missing_vars[*]}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All minimal variables configured${NC}"
    
    # Test GitHub OAuth URL generation
    echo -e "${BLUE}🔗 Testing OAuth URLs...${NC}"
    local github_oauth_url="https://github.com/login/oauth/authorize?client_id=$GITHUB_CLIENT_ID&redirect_uri=$NEXTAUTH_URL&scope=read:user%20user:email"
    echo -e "GitHub OAuth: ${github_oauth_url:0:80}...${NC}"
    
    # Test Supabase connection
    echo -e "${BLUE}📡 Testing Supabase connection...${NC}"
    if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null; then
        echo -e "${GREEN}✅ Supabase connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase connection test failed (may be normal)${NC}"
    fi
    
    echo ""
}

create_audit_log() {
    print_section "Audit Trail Creation"
    
    local audit_file="minimal-setup-audit.json"
    local git_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    local audit_entry=$(cat <<EOF
{
  "timestamp": "$TIMESTAMP",
  "action": "minimal_privacy_setup",
  "details": {
    "setup_type": "minimal_privacy",
    "features": ["simplistic_privacy", "seamless_security", "full_sql_support"],
    "git_commit": "$git_commit",
    "git_branch": "$git_branch",
    "environment_files": $(find . -name ".env.*.minimal.local" | jq -R . | jq -s .),
    "security_features": ["rls_enabled", "minimal_permissions", "developer_isolation"]
  }
}
EOF
)
    
    if [[ -f "$audit_file" ]]; then
        # Add to existing audit log
        local temp_file=$(mktemp)
        jq ". += [$audit_entry]" "$audit_file" > "$temp_file" && mv "$temp_file" "$audit_file"
    else
        # Create new audit log
        echo "[$audit_entry]" > "$audit_file"
    fi
    
    echo -e "${GREEN}✅ Audit trail created${NC}"
    echo -e "${BLUE}📋 File: $audit_file${NC}"
    echo ""
}

show_next_steps() {
    print_section "Next Steps"
    
    echo -e "${GREEN}🎉 Minimal Privacy Setup Complete!${NC}"
    echo ""
    
    echo -e "${YELLOW}🚀 Ready to Use:${NC}"
    echo "1. Start development server:"
    echo -e "   ${CYAN}npm run dev${NC}"
    echo ""
    echo "2. Test OAuth authentication:"
    echo -e "   ${CYAN}curl -X GET http://127.0.0.1:3002/api/auth/github${NC}"
    echo ""
    echo "3. Validate minimal setup:"
    echo -e "   ${CYAN}npm run team:validate-oauth${NC}"
    echo ""
    
    echo -e "${YELLOW}🔧 SQL Features:${NC}"
    echo "• Full Postgres SQL access via Supabase"
    echo "• Row-Level Security (RLS) enabled"
    echo "• Custom functions for advanced queries"
    echo "• Privacy-compliant analytics"
    echo ""
    
    echo -e "${YELLOW}🔒 Security Features:${NC}"
    echo "• Minimal environment variables only"
    echo "• Developer-specific .env files"
    echo "• GitHub OAuth with minimal scopes"
    echo "• Supabase RLS for data isolation"
    echo "• Automatic audit trails"
    echo ""
    
    echo -e "${YELLOW}🔗 Resources:${NC}"
    echo "• Supabase Security: https://supabase.com/docs/guides/security"
    echo "• GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps"
    echo "• Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security"
    echo "• SQL Editor: https://supabase.com/docs/guides/database/sql-editor"
    echo ""
    
    echo -e "${GREEN}✨ Your privacy-first, secure, and powerful development environment is ready!${NC}"
}

# Main execution
main() {
    print_header
    
    local developer_name="${1:-$(whoami)}"
    
    validate_environment
    setup_minimal_environment "$developer_name"
    setup_supabase_rls
    setup_github_oauth
    
    if validate_minimal_setup; then
        create_audit_log
        show_next_steps
    else
        echo -e "${RED}❌ Setup validation failed${NC}"
        echo -e "${YELLOW}Please check your configuration and try again${NC}"
        exit 1
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi