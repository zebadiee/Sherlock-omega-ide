# SHERLOCK Ω USER INTERFACE GUIDE

## 🌟 Overview

Sherlock Ω provides multiple user interfaces to interact with the autonomous development environment:

1. **Web Dashboard** - Visual real-time monitoring and control
2. **Command Line Interface (CLI)** - Terminal-based system management
3. **React Components** - Embeddable UI components for integration

## 🖥️ Web Dashboard

### Features
- **Real-time System Status** - Live monitoring of all components
- **Safety Metrics** - Coverage, validations, and blocked deployments
- **Evolution Management** - Request and track autonomous improvements
- **Performance Monitoring** - System health and resource usage
- **Safe Mode Control** - Emergency system protection

### Usage
```bash
# Open the dashboard in your browser
open src/ui/dashboard-demo.html
```

### Key Components

#### System Controls
- **Start System** - Initialize all Sherlock Ω components
- **Stop System** - Gracefully shutdown the system
- **Safe Mode** - Emergency protection mode
- **Settings** - System configuration

#### Monitoring Panels
- **System Components** - Status of Safety, Evolution, AI, and Monitoring
- **Safety Metrics** - Validation statistics and success rates
- **Performance** - Resource usage and response times

#### Evolution Interface
- **Request Evolution** - Predefined evolution scenarios
- **Recent Evolutions** - History of processed requests
- **Status Tracking** - Real-time evolution processing

## 💻 Command Line Interface

### Installation
```bash
# Make CLI executable
chmod +x src/ui/sherlock-cli.js

# Run the CLI
node src/ui/sherlock-cli.js
```

### Available Commands

#### System Management
```bash
start           # Start the Sherlock Ω system
stop            # Stop the system gracefully
status          # Show detailed system status
safe-mode       # Toggle safe mode on/off
```

#### Evolution Management
```bash
evolve <description>    # Request an evolution
list                   # List recent evolutions
validate              # Test safety validation
```

#### Monitoring
```bash
monitor         # Show real-time system metrics
status          # Comprehensive system status
```

#### Utility
```bash
help            # Show all available commands
clear           # Clear the screen
exit            # Exit the CLI
```

### Example Session
```bash
sherlock-ω [🔴 OFFLINE] > help
📚 Available Commands:
──────────────────────────────────────────────────
  start         Start the Sherlock Ω system
  status        Show system status and metrics
  evolve        Request an evolution
  ...

sherlock-ω [🔴 OFFLINE] > start
🚀 Starting Sherlock Ω system...
   Initializing Safety Validation System... ✅
   Starting Evolution Engine... ✅
   Activating AI Orchestrator... ✅
   Enabling Real-time Monitoring... ✅
✅ System started successfully

sherlock-ω [🟢 ONLINE] > evolve Add user authentication with tests
🧬 Processing evolution: evo-1703123456789
   Description: Add user authentication with tests
   🛡️  Safety validation... ✅ APPROVED
   🔄 Processing evolution... ✅ COMPLETED
✅ Evolution evo-1703123456789 deployed successfully

sherlock-ω [🟢 ONLINE] > evolve Add payment processing without tests
🧬 Processing evolution: evo-1703123456790
   Description: Add payment processing without tests
   🛡️  Safety validation... ❌ BLOCKED
❌ Evolution blocked: Safety validation failed - insufficient test coverage

sherlock-ω [🟢 ONLINE] > list
📋 Recent Evolutions
──────────────────────────────────────────────────
✅ evo-1703123456789
   Add user authentication with tests
   12/21/2023, 10:30:45 AM

❌ evo-1703123456790
   Add payment processing without tests
   12/21/2023, 10:31:02 AM
   Reason: Safety validation failed - insufficient test coverage
```

## ⚛️ React Components

### SherlockOmegaDashboard
Main dashboard component with full system monitoring and control.

```tsx
import { SherlockOmegaDashboard } from './src/ui/sherlock-omega-dashboard';

function App() {
  return <SherlockOmegaDashboard />;
}
```

### Component Features
- **Real-time Updates** - Live system status and metrics
- **Interactive Controls** - Start/stop system, toggle safe mode
- **Evolution Management** - Request and track evolutions
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Professional development environment styling

## 🎨 Styling and Theming

### Color Scheme
- **Primary**: Blue (#3B82F6) - System status and primary actions
- **Success**: Green (#10B981) - Approved evolutions and healthy status
- **Warning**: Yellow (#F59E0B) - Degraded status and medium priority
- **Error**: Red (#EF4444) - Blocked evolutions and critical issues
- **Safe Mode**: Blue (#3B82F6) - Safe mode indicators
- **Background**: Dark Gray (#111827) - Professional dark theme

### Icons
Uses Lucide React icons for consistent, modern iconography:
- 🛡️ Shield - Safety and protection
- 🧬 Git Branch - Evolution and development
- 🤖 Brain - AI and intelligence
- 📊 Bar Chart - Monitoring and metrics
- ⚡ Zap - Performance and speed

## 🔧 Configuration

### Dashboard Configuration
```javascript
// Customize dashboard behavior
const dashboardConfig = {
  refreshInterval: 1000,     // Update frequency (ms)
  maxEvolutions: 50,         // Max evolutions to display
  autoStart: false,          // Auto-start system on load
  theme: 'dark'              // UI theme
};
```

### CLI Configuration
```javascript
// Customize CLI behavior
const cliConfig = {
  prompt: 'sherlock-ω',      // CLI prompt
  colors: true,              // Enable colors
  animations: true,          // Enable loading animations
  maxHistory: 100            // Command history size
};
```

## 🚀 Integration Examples

### Embedding in Existing Applications
```tsx
// Minimal integration
import { SherlockOmegaDashboard } from './sherlock-omega-dashboard';

function IDELayout() {
  return (
    <div className="ide-layout">
      <div className="sidebar">
        <SherlockOmegaDashboard />
      </div>
      <div className="editor">
        {/* Your editor component */}
      </div>
    </div>
  );
}
```

### Custom Evolution Requests
```tsx
// Custom evolution interface
function CustomEvolutionPanel() {
  const [description, setDescription] = useState('');
  
  const handleSubmit = async () => {
    const result = await sherlockSystem.requestEvolution({
      id: `custom-${Date.now()}`,
      description,
      priority: 'medium',
      requestedBy: 'user'
    });
    
    if (result.success) {
      console.log('Evolution approved:', result.evolutionId);
    } else {
      console.error('Evolution blocked:', result.reason);
    }
  };
  
  return (
    <div>
      <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your evolution..."
      />
      <button onClick={handleSubmit}>Request Evolution</button>
    </div>
  );
}
```

## 📱 Mobile Support

The dashboard is fully responsive and works on mobile devices:
- **Touch-friendly** - Large buttons and touch targets
- **Responsive Grid** - Adapts to different screen sizes
- **Mobile Navigation** - Optimized for small screens
- **Gesture Support** - Swipe and tap interactions

## 🔒 Security Considerations

### Safe Mode Protection
- **Automatic Activation** - Triggers on critical system failures
- **Manual Control** - Can be activated/deactivated by users
- **Evolution Blocking** - Prevents all autonomous changes in safe mode
- **Visual Indicators** - Clear safe mode status throughout UI

### Access Control
- **System Controls** - Require confirmation for critical actions
- **Evolution Approval** - All changes go through safety validation
- **Audit Trail** - Complete history of all system interactions
- **Error Boundaries** - Graceful handling of UI failures

## 🎯 Best Practices

### Dashboard Usage
1. **Monitor Regularly** - Keep an eye on system health
2. **Review Evolutions** - Check blocked evolutions for patterns
3. **Use Safe Mode** - Activate during critical development phases
4. **Track Metrics** - Monitor success rates and performance

### CLI Usage
1. **Start with Help** - Use `help` command to learn available options
2. **Check Status** - Use `status` command before making changes
3. **Test Safely** - Use `validate` command to test safety systems
4. **Monitor Performance** - Use `monitor` command for real-time metrics

### Integration
1. **Error Handling** - Always handle evolution request failures
2. **Status Monitoring** - Subscribe to system status changes
3. **Safe Mode Awareness** - Check safe mode status before operations
4. **Performance** - Avoid excessive polling of system status

## 🐛 Troubleshooting

### Common Issues

#### Dashboard Not Loading
```bash
# Check if HTML file exists
ls -la src/ui/dashboard-demo.html

# Open in browser with file:// protocol
open src/ui/dashboard-demo.html
```

#### CLI Not Starting
```bash
# Check file permissions
ls -la src/ui/sherlock-cli.js

# Make executable if needed
chmod +x src/ui/sherlock-cli.js

# Run with node directly
node src/ui/sherlock-cli.js
```

#### Evolution Requests Failing
1. **Check System Status** - Ensure system is running
2. **Verify Safe Mode** - Exit safe mode if active
3. **Review Description** - Avoid keywords that trigger safety blocks
4. **Check Logs** - Look for detailed error messages

### Debug Mode
```bash
# Enable debug logging in CLI
DEBUG=true node src/ui/sherlock-cli.js

# Enable verbose output in dashboard
localStorage.setItem('sherlock-debug', 'true');
```

## 📚 Additional Resources

- **API Documentation** - See `src/core/sherlock-omega-system.ts`
- **Safety Guide** - See `src/services/evolution/safety-validation-system.ts`
- **Integration Examples** - See `src/demo/` directory
- **Test Cases** - See `src/ui/__tests__/` directory

---

**Ready to experience autonomous development with complete safety guarantees!** 🚀