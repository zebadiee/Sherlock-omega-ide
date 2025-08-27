# 🔐 OAuth Configuration Guide

Based on your provided dashboard links, here's your **step-by-step configuration guide**:

## 📊 Your Project Details
- **Supabase Project**: `ecgexzqtuhgdinohychp`
- **GitHub OAuth App**: `3142320`
- **Project URL**: `https://ecgexzqtuhgdinohychp.supabase.co` ✅ (Already configured)

## 🐙 Step 1: GitHub OAuth Configuration

### Get GitHub Credentials
1. **Open your GitHub OAuth App**: 
   ```
   https://github.com/settings/applications/3142320
   ```

2. **Verify/Update Settings**:
   - **Application name**: `Sherlock Ω IDE (Development)`
   - **Homepage URL**: `http://localhost:3002`
   - **Authorization callback URL**: `http://localhost:3002/api/auth/callback/github`
   - **Application description**: `Revolutionary IDE for quantum computing and AI development`

3. **Copy Credentials**:
   - Copy the **Client ID** (should be visible)
   - Copy the **Client Secret** (click "Generate a new client secret" if needed)

### Optional: Personal Access Token
1. **Go to**: https://github.com/settings/tokens/new
2. **Settings**:
   - **Note**: `Sherlock Ω IDE Development`
   - **Expiration**: `90 days` (or your preference)
   - **Scopes**: Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `read:user` (Read access to user profile)
     - ✅ `user:email` (Access user email addresses)
     - ✅ `workflow` (Update GitHub Action workflows)
3. **Generate token** and copy it (starts with `ghp_`)

## ⚡ Step 2: Supabase Configuration

### Get Supabase API Keys
1. **Open your Supabase dashboard**: 
   ```
   https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp
   ```

2. **Go to Settings > API**:
   - Copy **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - Copy **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

3. **Go to Settings > API > JWT Settings**:
   - Copy **JWT Secret** (long string, usually 32+ characters)

### Configure Supabase Authentication
1. **Go to Authentication > URL Configuration**:
   - **Site URL**: `http://localhost:3002`
   - **Redirect URLs**: Add this URL:
     ```
     http://localhost:3002/api/auth/callback/supabase
     ```

2. **Go to Authentication > Providers**:
   - **Enable GitHub provider**
   - **GitHub Client ID**: Paste your GitHub Client ID from Step 1
   - **GitHub Client Secret**: Paste your GitHub Client Secret from Step 1
   - **Click Save**

## 🔧 Step 3: Configure Environment

### Option 1: Simplified Bash Script (Recommended)
Run the streamlined configuration script:
```bash
./configure-oauth-env.sh
```

### Option 2: Interactive TypeScript (Advanced)
For more features and validation:
```bash
npm run config:oauth
```

### Option 3: Unified Setup (Best of Both)
Combines simplicity with enterprise validation:
```bash
npm run config:oauth-unified
```

```bash
# GitHub OAuth (replace with your actual values)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_ACCESS_TOKEN=ghp_your_personal_access_token_here  # Optional

# Supabase (replace with your actual values)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

## ✅ Step 4: Validation

### Validate Configuration
```bash
npm run config:validate
```

You should see all items marked with ✅ (green checkmarks).

### Test Database Connection
```bash
# Apply database schema
npm run setup:complete --skip-interactive

# Or manually with Supabase CLI
supabase link --project-ref ecgexzqtuhgdinohychp
supabase db push
```

## 🚀 Step 5: Start Development

### Start the IDE
```bash
npm run dev
```

### Open in Browser
- **Main IDE**: http://localhost:3002
- **Dashboard**: http://localhost:3002/dashboard
- **Health Check**: http://localhost:3002/api/health

### Test OAuth Flows
1. **GitHub OAuth**: http://localhost:3002/api/auth/github
2. **Supabase OAuth**: http://localhost:3002/api/auth/supabase

## 🔍 Troubleshooting

### Common Issues

#### 1. GitHub OAuth Errors
- **Invalid client**: Check Client ID and Secret are correct
- **Callback mismatch**: Ensure callback URL is exactly `http://localhost:3002/api/auth/callback/github`
- **App suspended**: Check if your GitHub app is active

#### 2. Supabase Connection Issues
- **Invalid JWT**: Ensure JWT secret is correct
- **CORS errors**: Check if site URL is set to `http://localhost:3002`
- **Auth provider error**: Verify GitHub credentials in Supabase auth settings

#### 3. Environment Issues
- **Variables not loading**: Restart dev server after changing `.env.local`
- **Placeholder values**: Ensure no placeholder text remains in environment variables
- **Permission errors**: Check file permissions on `.env.local`

### Debug Commands
```bash
# Check environment variables
npm run config:validate

# Test GitHub integration
curl -X GET "http://localhost:3002/api/auth/github"

# Test Supabase connection
curl -X GET "http://localhost:3002/api/health"

# View logs
DEBUG=sherlock:* npm run dev
```

## 📞 Need Help?

### Quick Links
- **GitHub OAuth App**: https://github.com/settings/applications/3142320
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ecgexzqtuhgdinohychp
- **Configuration Script**: `npm run config:oauth`
- **Validation**: `npm run config:validate`

### Support
- 📖 **Full Documentation**: `./INTEGRATION_SETUP_GUIDE.md`
- 🔧 **Setup Script**: `./scripts/setup-integration.ts`
- 🧪 **Integration Tests**: `npm run test:integration`

---

**Ready to build quantum algorithms with enterprise-grade automation!** 🚀