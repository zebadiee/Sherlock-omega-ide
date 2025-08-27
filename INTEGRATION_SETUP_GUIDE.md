# Sherlock Ω IDE - GitHub & Supabase Integration Guide

## 🚀 Complete Setup Guide

This guide provides comprehensive instructions for setting up the unified GitHub and Supabase automation system for Sherlock Ω IDE. The integration provides enterprise-grade automation, security, and collaboration features.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher 
- **Git**: Latest version
- **Docker**: (Optional) For local development

### Required Accounts
- **GitHub Account**: With repository access
- **Supabase Account**: For database and authentication
- **Domain**: (Production only) For OAuth callbacks

## 🛠️ Installation & Setup

### Step 1: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.local.template .env.local
   ```

2. **Configure GitHub OAuth Application**
   
   **Development Setup:**
   - Visit: https://github.com/settings/applications/new
   - Application name: `Sherlock Ω IDE (Development)`
   - Homepage URL: `http://localhost:3002`
   - Authorization callback URL: `http://localhost:3002/api/auth/callback/github`
   - Copy Client ID and Client Secret
   
   **Production Setup:**
   - Application name: `Sherlock Ω IDE`
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

3. **Configure Supabase Project**
   
   **Create Project:**
   - Visit: https://app.supabase.com
   - Create new project: `sherlock-omega-ide-dev` (or your preferred name)
   - Choose region closest to your users
   - Set strong database password
   
   **Get API Keys:**
   - Go to Settings > API
   - Copy Project URL (starts with `https://`)
   - Copy anon public key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - Copy service role key (for server operations)
   
   **Configure Authentication:**
   - Go to Authentication > URL Configuration
   - Site URL: `http://localhost:3002` (development) or `https://your-domain.com` (production)
   - Redirect URLs: `http://localhost:3002/api/auth/callback/supabase`
   
   **Enable GitHub Provider:**
   - Go to Authentication > Providers
   - Enable GitHub
   - Enter your GitHub OAuth Client ID and Secret

4. **Update .env.local File**
   ```env
   # GitHub OAuth Configuration
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_ACCESS_TOKEN=ghp_your_personal_access_token

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret

   # Application Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3002
   NEXTAUTH_URL=http://localhost:3002
   NEXTAUTH_SECRET=your_32_character_secret

   # Security Configuration
   JWT_SECRET=your_jwt_secret_32_chars
   ENCRYPTION_KEY=your_encryption_key_32_chars

   # GitHub Webhook (for automation)
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

### Step 2: Database Setup

1. **Apply Database Schema**
   ```bash
   # Option 1: Using Supabase CLI (Recommended)
   npm install -g supabase
   supabase login
   supabase link --project-ref your_project_id
   supabase db push

   # Option 2: Manual SQL Execution
   # Copy content from supabase/migrations/001_initial_schema.sql
   # Paste into Supabase SQL Editor and execute
   ```

2. **Verify Database Setup**
   ```bash
   # Run integration tests
   npm run test:integration
   ```

### Step 3: Install Dependencies

```bash
# Install all required dependencies
npm install

# Install quantum computing libraries
npm run quantum:install

# Install development tools
npm install -D @types/node typescript ts-node
```

### Step 4: Run Setup Script

```bash
# Automated setup (interactive)
npm run setup:integration

# Non-interactive setup (for CI/CD)
npm run setup:integration -- --skip-interactive
```

### Step 5: Start Development Server

```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:3002
```

## 🔧 Configuration Details

### GitHub Integration Features

#### Automation Rules
The system includes pre-configured automation rules:

1. **Quantum Algorithm CI**
   - Triggers on: Pull requests affecting quantum files
   - Actions: Run quantum test suite, add comments
   - Files: `src/ai/quantum/**/*.ts`

2. **Security Scanning**
   - Triggers on: Push to main branch
   - Actions: Run security vulnerability scan
   - Coverage: Dependencies, code patterns

3. **Auto-labeling**
   - Triggers on: Pull request creation
   - Actions: Add labels based on branch patterns
   - Patterns: `feature/*`, `bugfix/*`, `hotfix/*`

#### GitHub Actions Workflow
Located at `.github/workflows/ci-cd.yml`:

```yaml
name: Sherlock Ω IDE CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run quantum tests
        run: npm run test:quantum
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit
      - name: SAST scan
        uses: github/super-linter@v4
```

### Supabase Integration Features

#### Database Schema
The database includes tables for:
- **Users & Authentication**: User profiles, sessions
- **Projects**: Project management, files, members
- **Quantum Computing**: Circuits, simulations, results
- **AI Integration**: Conversations, models, analytics
- **Collaboration**: Live sessions, comments, events
- **Automation**: Rules, builds, deployments

#### Real-time Features
- **Live Collaboration**: Cursor tracking, real-time editing
- **Notifications**: Build status, security alerts
- **Analytics**: Usage tracking, performance metrics

#### Security Features
- **Row Level Security (RLS)**: All tables protected
- **OAuth Integration**: GitHub authentication
- **Audit Logging**: All operations tracked
- **Data Encryption**: Sensitive data encrypted

### Security Configuration

#### Content Security Policy (CSP)
```javascript
{
  'default-src': ["'self'"],
  'script-src': ["'self'", "https://github.com"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'connect-src': ["'self'", "https://api.github.com", "https://*.supabase.co"],
  'img-src': ["'self'", "data:", "https:"],
  'frame-src': ["'none'"]
}
```

#### Rate Limiting
- **Authentication**: 10 requests per 15 minutes
- **API Endpoints**: 100 requests per 15 minutes
- **Webhooks**: 50 requests per 5 minutes

#### Threat Detection
- **SQL Injection**: Pattern-based detection
- **XSS Attacks**: Script tag filtering
- **Path Traversal**: Directory traversal prevention
- **Brute Force**: Failed login monitoring

## 🚦 Testing & Validation

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test categories
npm run test:github
npm run test:supabase
npm run test:security

# Run with verbose output
npm run test:integration -- --verbose
```

### Test Categories

1. **Environment Tests**
   - Configuration file validation
   - Environment variable checks
   - Dependencies verification

2. **Database Tests**
   - Connection validation
   - Schema verification
   - RLS policy testing

3. **GitHub Tests**
   - OAuth flow validation
   - Webhook processing
   - Automation rules

4. **Supabase Tests**
   - Authentication flows
   - Real-time subscriptions
   - Database operations

5. **Security Tests**
   - CSP configuration
   - Input sanitization
   - Threat detection

6. **Performance Tests**
   - Response time validation
   - Memory usage monitoring
   - Error recovery testing

### Health Checks

```bash
# Check system health
curl http://localhost:3002/api/health

# Check authentication health
curl http://localhost:3002/api/auth/health

# Check security status
curl http://localhost:3002/api/security/status
```

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to version control
- ✅ Use different secrets for each environment
- ✅ Rotate secrets regularly (quarterly recommended)
- ✅ Use strong, randomly generated secrets (32+ characters)

### OAuth Configuration
- ✅ Use HTTPS in production
- ✅ Validate redirect URIs strictly
- ✅ Implement CSRF protection
- ✅ Use state parameters for all flows

### Database Security
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use service role key only for server operations
- ✅ Implement proper user permissions
- ✅ Regular security audits

### API Security
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Use HTTPS everywhere
- ✅ Implement proper CORS policies

## 🚀 Deployment

### Development Deployment

```bash
# Start development server
npm run dev

# Start with specific port
PORT=3002 npm run dev

# Start with debug mode
DEBUG=* npm run dev
```

### Production Deployment

#### Environment Setup
```bash
# Copy production environment
cp .env.local.template .env.production
# Update with production values

# Set production environment
export NODE_ENV=production
```

#### Security Hardening
```bash
# Update security headers
npm run security:harden

# Generate CSP report
npm run security:csp-report

# Run security audit
npm run security:audit
```

#### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Or using PM2
pm2 start ecosystem.config.js
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

## 📊 Monitoring & Analytics

### Available Dashboards

1. **Security Dashboard**
   - Threat detection metrics
   - Authentication events
   - Vulnerability scans
   - Access: `/dashboard/security`

2. **Performance Dashboard**
   - Response times
   - Database performance
   - Memory usage
   - Access: `/dashboard/performance`

3. **Analytics Dashboard**
   - User activity
   - Feature usage
   - Project statistics
   - Access: `/dashboard/analytics`

### API Endpoints

```bash
# Security metrics
GET /api/security/metrics

# Performance metrics
GET /api/performance/metrics

# Usage analytics
GET /api/analytics/usage

# System health
GET /api/health/detailed
```

### Logging

Logs are structured and include:
- **Timestamp**: ISO 8601 format
- **Level**: error, warn, info, debug
- **Category**: github, supabase, security, performance
- **Message**: Human-readable description
- **Metadata**: Contextual information

## 🛟 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check OAuth configuration
npm run test:oauth

# Verify environment variables
npm run config:validate

# Check callback URLs
npm run auth:debug
```

#### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Check migration status
npm run db:status

# Reset database (development only)
npm run db:reset
```

#### Webhook Issues
```bash
# Test webhook processing
npm run webhook:test

# Check webhook signatures
npm run webhook:verify

# Debug webhook events
npm run webhook:debug
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=sherlock:* npm run dev

# Specific component debugging
DEBUG=sherlock:github npm run dev
DEBUG=sherlock:supabase npm run dev
DEBUG=sherlock:security npm run dev
```

### Log Analysis

```bash
# View recent errors
npm run logs:errors

# View security events
npm run logs:security

# View performance metrics
npm run logs:performance
```

## 🔄 Maintenance

### Regular Tasks

#### Daily
- Monitor security alerts
- Check system health
- Review error logs

#### Weekly
- Update dependencies
- Run security scans
- Review analytics

#### Monthly
- Rotate secrets
- Update documentation
- Performance review

### Backup & Recovery

```bash
# Backup database
npm run db:backup

# Backup configuration
npm run config:backup

# Restore from backup
npm run db:restore <backup-file>
```

### Updates

```bash
# Update dependencies
npm update

# Update security patches
npm audit fix

# Update integration services
npm run integration:update
```

## 📞 Support

### Documentation
- **API Reference**: `/docs/api`
- **Security Guide**: `/docs/security`
- **Integration Guide**: `/docs/integration`

### Getting Help
- **GitHub Issues**: Create issue with logs and configuration
- **Security Issues**: Email security@sherlock-omega.com
- **Feature Requests**: Use GitHub discussions

### Useful Commands

```bash
# Quick health check
npm run health:check

# Generate support bundle
npm run support:bundle

# Validate complete setup
npm run validate:setup

# Reset to clean state
npm run reset:clean
```

---

## 🎉 Congratulations!

Your Sherlock Ω IDE GitHub and Supabase integration is now configured! You have access to:

- ✅ **Enterprise Authentication**: Secure OAuth flows
- ✅ **Automated Workflows**: GitHub Actions integration
- ✅ **Real-time Collaboration**: Live editing and sharing
- ✅ **Advanced Security**: Threat detection and monitoring
- ✅ **Cross-platform Sync**: Unified automation
- ✅ **Analytics & Monitoring**: Comprehensive insights

Start building quantum algorithms and AI-powered applications with confidence! 🚀

---

*Last updated: August 2025*
*Version: 2.0.0*