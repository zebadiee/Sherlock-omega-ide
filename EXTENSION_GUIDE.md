# 🧠 Sherlock Ω VS Code Extension Guide

## 🎯 Overview

The Sherlock Ω VS Code extension brings revolutionary zero-friction development directly into your editor. This guide covers installation, development, and publishing.

## 🚀 Quick Installation (For Users)

### From VS Code Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Sherlock Omega"
4. Click "Install"
5. Reload VS Code
6. Start coding - zero friction is now active! ✨

### Manual Installation (Development)
```bash
# Build the extension
npm run extension:build

# Install locally
npm run extension:install
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 16+ 
- VS Code 1.74+
- TypeScript 4.9+

### Build Process
```bash
# Install dependencies
cd extension
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Testing the Extension
1. Open the extension folder in VS Code
2. Press F5 to launch Extension Development Host
3. Open a TypeScript/JavaScript project in the new window
4. Watch Sherlock Ω activate automatically!

## 🎯 Extension Features

### 📋 **Action Plan Sidebar**
- Real-time friction detection results
- One-click execution buttons
- Severity and confidence indicators
- Categorized by friction type

### 🔍 **Real-Time Detection**
- Monitors code changes as you type
- Detects missing dependencies instantly
- Identifies syntax and semantic issues
- Provides intelligent suggestions

### ⚡ **Zero-Friction Protocol**
- Auto-installs safe dependencies
- Maintains perfect flow state
- Sub-200ms detection performance
- Mathematical proof of correctness

### 🎨 **VS Code Integration**
- Native status bar integration
- Context menu actions
- Hover information
- Code action providers
- Diagnostic integration

## 📦 Publishing to Marketplace

### Prerequisites
1. **Publisher Account**: Create at [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. **Access Token**: Generate a Personal Access Token with Marketplace scope
3. **VSCE Tool**: Install with `npm install -g vsce`

### Publishing Steps
```bash
# Set your access token
export VSCE_PAT=your-access-token-here

# Build and publish
npm run extension:publish
```

### Marketplace Optimization
- **Icon**: 128x128 PNG with brain/AI theme
- **Gallery Banner**: Purple/blue gradient matching brand
- **Screenshots**: Show action plan sidebar and zero-friction workflow
- **Keywords**: ai, dependencies, zero-friction, auto-install, flow-state

## 🔧 Configuration Options

### User Settings
```json
{
  "sherlock-omega.enabled": true,
  "sherlock-omega.autoInstallDependencies": true,
  "sherlock-omega.packageManager": "auto",
  "sherlock-omega.detectionDelay": 500,
  "sherlock-omega.showNotifications": true,
  "sherlock-omega.confidenceThreshold": 0.8
}
```

### Workspace Settings
```json
{
  "sherlock-omega.packageManager": "yarn",
  "sherlock-omega.confidenceThreshold": 0.9
}
```

## 🎯 Commands Available

| Command | Description | Keybinding |
|---------|-------------|------------|
| `sherlock-omega.activate` | Activate zero-friction mode | - |
| `sherlock-omega.runFrictionDetection` | Analyze current file | `Ctrl+Shift+F` |
| `sherlock-omega.showActionPlan` | Open action plan | `Ctrl+Shift+A` |
| `sherlock-omega.installAllDependencies` | Install all missing deps | - |
| `sherlock-omega.toggleZeroFriction` | Toggle on/off | - |
| `sherlock-omega.showMetrics` | Show performance stats | - |

## 🧪 Testing Scenarios

### Test Case 1: Missing Dependencies
```typescript
// Create a new .ts file with:
import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';

// Expected: Sherlock Ω detects 3 missing dependencies
// Expected: Action plan shows 3 install actions
// Expected: One-click installation available
```

### Test Case 2: Package Manager Detection
```bash
# Test with different lock files:
touch package-lock.json  # Should detect npm
rm package-lock.json && touch yarn.lock  # Should detect yarn
rm yarn.lock && touch pnpm-lock.yaml  # Should detect pnpm
```

### Test Case 3: Auto-Installation Safety
```typescript
// Create a file with:
import eslintConfig from 'eslint-config-custom';
import '@types/node';

// Expected: eslint-config marked as non-auto-installable
// Expected: @types/node marked as non-auto-installable
// Expected: Manual installation suggested
```

## 📊 Performance Benchmarks

### Target Metrics
- **Detection Speed**: < 200ms for typical files
- **Memory Usage**: < 50MB additional footprint
- **CPU Usage**: < 5% during active detection
- **Startup Time**: < 2s extension activation

### Monitoring
```bash
# Run performance benchmarks
npm run benchmark

# Check bundle size
npm run analyze:bundle

# Monitor zero-friction metrics
npm run metrics:zero-friction
```

## 🔍 Debugging

### Extension Host Debugging
1. Open extension folder in VS Code
2. Set breakpoints in TypeScript files
3. Press F5 to launch debug session
4. Debug in the Extension Development Host window

### Language Server Debugging
1. Set `"debug"` in server options
2. Attach debugger to port 6009
3. Monitor LSP communication in Output panel

### Common Issues
- **Extension not activating**: Check activation events in package.json
- **Commands not working**: Verify command registration
- **Detection not running**: Check file language ID and scheme
- **Performance issues**: Monitor detection delay settings

## 🌟 Marketplace Submission Checklist

### Required Files
- ✅ `package.json` with all required fields
- ✅ `README.md` with comprehensive documentation
- ✅ `CHANGELOG.md` with version history
- ✅ `LICENSE` file
- ✅ Extension icon (128x128 PNG)
- ✅ Screenshots showing key features

### Quality Requirements
- ✅ No TypeScript compilation errors
- ✅ All tests passing
- ✅ ESLint clean
- ✅ Bundle size under limits
- ✅ Performance benchmarks met

### Marketplace Metadata
- ✅ Compelling description
- ✅ Relevant keywords/tags
- ✅ Gallery banner design
- ✅ Category selection
- ✅ Version following semantic versioning

## 🎉 Success Metrics

### Download Targets
- **Week 1**: 100+ installs
- **Month 1**: 1,000+ installs  
- **Month 3**: 10,000+ installs
- **Year 1**: 100,000+ installs

### Quality Metrics
- **Rating**: 4.5+ stars
- **Reviews**: Positive feedback on zero-friction experience
- **Performance**: Sub-200ms detection maintained
- **Reliability**: < 1% error rate

## 🚀 Launch Strategy

### Phase 1: Soft Launch
1. Publish to marketplace
2. Share with beta testers
3. Gather initial feedback
4. Iterate based on usage

### Phase 2: Community Launch
1. Announce on developer forums
2. Create demo videos
3. Write technical blog posts
4. Engage with VS Code community

### Phase 3: Scale
1. Add JetBrains plugin support
2. Expand language support
3. Enterprise features
4. Integration partnerships

---

**Ready to revolutionize development for millions of developers worldwide!** 🌍

*The future of development is here: Zero friction, infinite flow, perfect code.* 🚀