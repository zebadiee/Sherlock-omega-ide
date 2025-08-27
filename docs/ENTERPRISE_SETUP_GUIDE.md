# 🚀 Enterprise IDE Setup Script - Usage Instructions

## Overview

This script brings any IDE codebase (Qoder, etc.) up to enterprise standards with robust environment setup, OAuth readiness, and cross-origin development workflow compatibility optimized for macOS.

## Quick Start

```bash
# Make the script executable
chmod +x scripts/setup-enterprise-ide.sh

# Run with default port (3002)
./scripts/setup-enterprise-ide.sh

# Run with custom port
./scripts/setup-enterprise-ide.sh 3001
```

## 🎯 What This Script Does

### 1. **Environment Cleanup** 🧹
- ✅ Removes conflicting `package-lock.json` files outside project root
- ✅ Identifies stray Git repositories in home directory  
- ✅ Cleans unintended `node_modules` directories
- ✅ Creates backup of existing configuration files

### 2. **OAuth Route Deduplication** 🔐
- ✅ Detects duplicate OAuth callback routes (App Router vs Pages Router)
- ✅ Backs up conflicting files safely
- ✅ Prevents authentication conflicts

### 3. **Enterprise Next.js Configuration** ⚙️
- ✅ Generates optimized `next.config.js` with Turbopack
- ✅ Absolute path configuration for proper resolution
- ✅ SVG, image, and font handling rules
- ✅ Cross-origin development support
- ✅ Enterprise security headers
- ✅ Path aliases for clean imports

### 4. **OAuth-Ready Environment** 🔑
- ✅ Creates `.env.local` with all necessary placeholders
- ✅ GitHub OAuth configuration templates
- ✅ Supabase integration setup
- ✅ Security token generation guidance

### 5. **Development Server Optimization** 🚀
- ✅ Kills processes on target port gracefully
- ✅ Clean reinstallation of dependencies
- ✅ Turbopack-enabled launch configuration
- ✅ Background server launch capability

## 📋 Order of Operations

The script follows this precise sequence for optimal results:

```
1. Create Backup Directory
   ├── Backup existing config files
   └── Store with timestamps

2. Clean Package Locks
   ├── Find conflicting package-lock.json files
   ├── Remove from home directory
   └── Report stray node_modules

3. Clean Git Repositories  
   ├── Identify unintended .git directories
   └── Provide cleanup guidance

4. Clean OAuth Routes
   ├── Detect App Router vs Pages Router conflicts
   ├── Backup conflicting files
   └── Resolve authentication issues

5. Generate Next.js Config
   ├── Create enterprise-grade next.config.js
   ├── Configure Turbopack with absolute paths
   ├── Set up security headers
   └── Enable cross-origin development

6. Generate Environment File
   ├── Create .env.local with OAuth placeholders
   ├── Set up GitHub and Supabase templates
   └── Include security configurations

7. Free Development Port
   ├── Find processes on target port
   ├── Graceful termination (SIGTERM)
   └── Force kill if necessary (SIGKILL)

8. Clean and Install Dependencies
   ├── Remove node_modules, .next, .turbo
   ├── Clear npm cache
   └── Fresh dependency installation

9. Create Launch Configuration
   ├── Generate launch script with Turbopack
   ├── Set environment variables
   └── Configure hostname and port

10. Generate Completion Guide
    ├── Create detailed next steps documentation
    ├── OAuth setup instructions
    └── Troubleshooting guide
```

## 🔧 Configuration Details

### Turbopack Configuration

The generated `next.config.js` includes:

```javascript
experimental: {
  turbo: {
    root: path.resolve(__dirname),  // Absolute path - CRITICAL
    rules: {
      '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
      '*.{png,jpg,jpeg,gif,webp,avif}': { loaders: ['file-loader'], as: '*.js' },
      // ... additional rules
    },
    memoryLimit: 8192,
    resolveSourceMaps: true,
  }
}
```

### Cross-Origin Development Support

```javascript
// IMPORTANT: Outside turbo configuration
allowedDevOrigins: [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://192.168.1.*:3002',  // LAN testing
  // ... more origins
]
```

## 🔐 OAuth Setup

### GitHub OAuth Configuration

After running the script, update your GitHub OAuth app:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Update settings:
   - **Homepage URL**: `http://localhost:3002`
   - **Authorization callback URL**: `http://localhost:3002/api/auth/callback/github`

### Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication → Settings
3. Update:
   - **Site URL**: `http://localhost:3002`
   - **Redirect URLs**: `http://localhost:3002/auth/callback`

## 🚨 Important Notes

### Port Configuration
- Default port: `3002`
- Customizable via script parameter
- Automatically frees port before use
- Updates all configuration files accordingly

### Security Considerations
- Script generates secure defaults
- Requires manual OAuth credential input
- Implements enterprise security headers
- Creates environment variable templates

### macOS Optimizations
- Uses `lsof` for port management
- Handles macOS-specific paths
- Optimized for Homebrew installations
- Compatible with Zsh shell

## 🛠️ Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Manual port cleanup
lsof -ti:3002 | xargs kill -9
```

#### Dependency Conflicts
```bash
# Clean reinstall
rm -rf node_modules package-lock.json .next
npm install --legacy-peer-deps
```

#### Turbopack Issues
```bash
# Verify Next.js version (requires 13+)
npm list next

# Update if needed
npm install next@latest
```

#### OAuth Callback Errors
1. Verify URLs match exactly in OAuth providers
2. Check `.env.local` for correct values
3. Ensure no trailing slashes in URLs
4. Confirm OAuth apps are not in development restrictions

### Debug Mode

Run with debug output:
```bash
DEBUG=true ./scripts/setup-enterprise-ide.sh 3002
```

### Log Analysis

Check the generated log file:
```bash
tail -f setup.log
```

## 📊 Performance Optimizations

### Enabled Features
- ✅ Turbopack for faster builds (up to 10x faster)
- ✅ SWC minification
- ✅ Image optimization with WebP/AVIF
- ✅ Bundle splitting and code splitting
- ✅ Memory optimization (8GB limit)
- ✅ Source map generation for debugging

### Bundle Analysis
```bash
# Enable bundle analyzer
ANALYZE=true npm run build
```

## 🔒 Security Features

### Headers Implemented
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (HTTPS enforcement)

### Environment Security
- Separate development/production configs
- Secure secret generation guidance
- No hardcoded credentials
- Input validation for environment variables

## 📈 Success Metrics

After running the script, verify:

- ✅ No TypeScript compilation errors
- ✅ Development server starts successfully
- ✅ OAuth authentication works
- ✅ Hot reload functionality
- ✅ Asset loading (images, SVGs, fonts)
- ✅ Security headers present (check browser dev tools)

## 🆘 Support and Maintenance

### Generated Files
- `next.config.js` - Enterprise Next.js configuration
- `.env.local` - Environment variables with OAuth placeholders
- `launch-dev.sh` - Development server launcher
- `SETUP_COMPLETION_GUIDE.md` - Detailed next steps
- `.setup-backup/` - Backup of original files

### Manual Updates Required
1. Replace OAuth placeholders in `.env.local`
2. Update OAuth provider callback URLs
3. Generate secure secrets using provided commands
4. Configure any custom domain requirements

### Script Updates
The script is idempotent and can be run multiple times safely. It will:
- Preserve existing OAuth credentials
- Update configuration with latest best practices
- Maintain backup of previous configurations

---

**Need help?** Check the generated `SETUP_COMPLETION_GUIDE.md` or review the setup logs for detailed information about each step.