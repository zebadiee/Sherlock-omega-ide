# 🚀 Getting Started with Sherlock Ω

Welcome to the world's first zero-friction development environment! This guide will get you up and running in minutes.

## Quick Installation

### Option 1: VS Code Extension (Recommended)

1. **Install from VS Code Marketplace:**
   ```bash
   code --install-extension sherlock-omega.sherlock-omega-ide
   ```

2. **Or install the local package:**
   ```bash
   code --install-extension extension/sherlock-omega-ide-1.0.0.vsix
   ```

3. **Activate Sherlock Ω:**
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Sherlock Ω: Activate"
   - Press Enter

### Option 2: Node.js Library

```bash
npm install sherlock-omega-ide
```

```typescript
import { createSherlockOmega } from 'sherlock-omega-ide';

const sherlock = createSherlockOmega({
  features: {
    enableAI: true,
    enableAnalytics: true,
    enableRealTimeMonitoring: true,
    enablePredictiveActions: true
  }
});

await sherlock.start();
console.log('🧠 Zero-friction development activated!');
```

## First Steps

### 1. Create a Test Project

```bash
mkdir sherlock-test
cd sherlock-test
npm init -y
code .
```

### 2. Activate Sherlock Ω

In VS Code:
- You'll see the 🧠 Sherlock Ω icon in your activity bar
- Click it to open the Action Plan sidebar
- The status bar will show "✨ Zero friction detected" when active

### 3. Test Friction Detection

Create a file `test.ts` and type:

```typescript
// This will trigger automatic dependency installation
import express from 'express';
import { someFunction } from 'nonexistent-package';

const app = express();

// This will trigger syntax correction
app.listen(3000, () => {
  console.log('Server running on port 3000')
});
```

**Watch the magic happen:**
- Missing dependencies will be detected and installed automatically
- Syntax issues will be highlighted and fixed
- The Action Plan sidebar will show all actions taken

## Core Features

### 🔍 Real-Time Friction Detection

Sherlock Ω continuously monitors your code for:
- **Missing dependencies** - Automatically installs npm packages
- **Syntax errors** - Provides intelligent fixes
- **Type errors** - Suggests correct types and imports
- **Performance issues** - Identifies bottlenecks
- **Security vulnerabilities** - Flags potential risks

### ⚡ Auto-Execution

High-confidence actions are executed automatically:
- Dependency installation (confidence > 80%)
- Import fixes (confidence > 90%)
- Simple syntax corrections (confidence > 85%)

### 🎯 Intent Understanding

Sherlock Ω analyzes your code to understand what you're building:
- Completes complex code patterns
- Suggests architectural improvements
- Provides context-aware recommendations

### 📊 Analytics & Metrics

Track your productivity gains:
- Friction events detected and eliminated
- Time saved through automation
- Flow state preservation metrics
- Code quality improvements

## Configuration

### VS Code Settings

Open VS Code settings and search for "Sherlock Ω":

```json
{
  "sherlock-omega.enabled": true,
  "sherlock-omega.autoInstallDependencies": true,
  "sherlock-omega.packageManager": "auto",
  "sherlock-omega.detectionDelay": 500,
  "sherlock-omega.confidenceThreshold": 0.8,
  "sherlock-omega.showNotifications": true
}
```

### Programmatic Configuration

```typescript
const sherlock = createSherlockOmega({
  features: {
    enableAI: true,                    // Enable AI-powered completions
    enableAnalytics: true,             // Track productivity metrics
    enableEnhancedCompletion: true,    // Advanced thought completion
    enableRealTimeMonitoring: true,    // Continuous friction detection
    enablePredictiveActions: true      // Proactive problem prevention
  },
  ai: {
    provider: 'openai',                // 'openai' | 'anthropic' | 'auto'
    model: 'gpt-4',                    // AI model to use
    confidenceThreshold: 0.8           // Minimum confidence for auto-execution
  },
  monitoring: {
    detectionInterval: 500,            // Milliseconds between checks
    enableFormalVerification: true,    // Use theorem proving
    maxResponseTime: 100               // Maximum response time (ms)
  }
});
```

## Commands

### VS Code Commands

- `Sherlock Ω: Activate` - Start zero-friction development
- `Sherlock Ω: Run Friction Detection` - Manual friction scan
- `Sherlock Ω: Show Action Plan` - Open action plan webview
- `Sherlock Ω: Install All Dependencies` - Install all missing packages
- `Sherlock Ω: Toggle Zero-Friction Mode` - Enable/disable system
- `Sherlock Ω: Show Metrics` - Display productivity statistics

### Keyboard Shortcuts

- `Ctrl+Shift+F` (or `Cmd+Shift+F`) - Run friction detection
- `Ctrl+Shift+A` (or `Cmd+Shift+A`) - Show action plan
- `Ctrl+Shift+M` (or `Cmd+Shift+M`) - Show metrics

## Understanding the Action Plan

The Action Plan sidebar shows:

### 📦 Dependencies
- Missing packages to install
- Outdated packages to update
- Unused dependencies to remove

### 🔧 Fixes
- Syntax errors to correct
- Type issues to resolve
- Import problems to fix

### ⚡ Optimizations
- Performance improvements
- Code quality enhancements
- Architecture suggestions

### 🛡️ Security
- Vulnerability patches
- Security best practices
- Dependency audits

## Troubleshooting

### Common Issues

**Q: Sherlock Ω isn't detecting issues**
- Check that it's activated (🧠 icon should be visible)
- Verify your file is a supported language (TypeScript/JavaScript)
- Check the detection delay setting (default: 500ms)

**Q: Auto-installation isn't working**
- Ensure `autoInstallDependencies` is enabled
- Check your package manager is correctly detected
- Verify you have write permissions to package.json

**Q: Too many notifications**
- Adjust `confidenceThreshold` to reduce false positives
- Disable `showNotifications` for silent operation
- Use manual mode instead of auto-execution

### Debug Mode

Enable debug logging:

```typescript
const sherlock = createSherlockOmega({
  debug: true,
  logLevel: 'verbose'
});
```

Or in VS Code settings:
```json
{
  "sherlock-omega.debug": true,
  "sherlock-omega.logLevel": "verbose"
}
```

## Advanced Usage

### Custom Friction Detectors

```typescript
import { BaseFrictionDetector } from 'sherlock-omega-ide';

class CustomDetector extends BaseFrictionDetector {
  async detectFriction(context) {
    // Your custom detection logic
    return {
      frictionPoints: [...],
      confidence: 0.9
    };
  }
}

sherlock.registerDetector(new CustomDetector());
```

### Formal Verification

Enable mathematical proof checking:

```typescript
const sherlock = createSherlockOmega({
  verification: {
    enabled: true,
    prover: 'coq',                    // 'coq' | 'lean' | 'auto'
    timeout: 10000,                   // Proof timeout (ms)
    confidenceThreshold: 0.95         // Minimum proof confidence
  }
});
```

### Team Analytics

Set up team-wide friction tracking:

```typescript
const sherlock = createSherlockOmega({
  analytics: {
    teamId: 'your-team-id',
    endpoint: 'https://analytics.sherlock-omega.dev',
    enableTeamMetrics: true
  }
});
```

## Next Steps

- 📖 Read the [API Documentation](API.md)
- 🎥 Watch the [Video Tutorials](https://sherlock-omega.dev/tutorials)
- 💬 Join our [Discord Community](https://discord.gg/sherlock-omega)
- 🐛 Report issues on [GitHub](https://github.com/zebadiee/Sherlock-omega-ide/issues)
- ⭐ Star us on [GitHub](https://github.com/zebadiee/Sherlock-omega-ide)

## Support

Need help? We're here for you:

- 📧 **Email:** support@sherlock-omega.dev
- 💬 **Discord:** https://discord.gg/sherlock-omega
- 🐛 **GitHub Issues:** https://github.com/zebadiee/Sherlock-omega-ide/issues
- 📖 **Documentation:** https://sherlock-omega.dev

---

**Welcome to zero-friction development! 🚀**