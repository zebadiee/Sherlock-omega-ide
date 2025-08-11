/**
 * Example demonstrating the Intent-Driven UI System
 * Shows complete integration from friction detection to UI display and interaction
 */

import { 
  setupIntentDrivenUI, 
  createFullFeaturedUI,
  IntentDrivenUIManager 
} from '../index';
import { 
  SimpleSyntaxFrictionDetector 
} from '../../friction/SimpleSyntaxFrictionDetector';
import { 
  SimpleZeroFrictionProtocol 
} from '../../friction/SimpleZeroFrictionProtocol';
import { 
  FrictionDetector, 
  FrictionPoint 
} from '../../friction/BaseFrictionDetector';

/**
 * Mock Style Friction Detector for demonstration
 */
class StyleFrictionDetector extends FrictionDetector<FrictionPoint> {
  constructor() {
    super('StyleFrictionDetector');
  }

  detect(sourceCode: string): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];
    const lines = sourceCode.split('\n');
    
    lines.forEach((line, index) => {
      // Check for long lines
      if (line.length > 80) {
        frictionPoints.push({
          id: `style-long-line-${index}-${Date.now()}`,
          description: `Line too long (${line.length} characters)`,
          severity: 0.3,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.9,
            tags: ['style', 'line-length']
          }
        });
      }
      
      // Check for inconsistent indentation
      if (line.includes('\t') && line.includes('  ')) {
        frictionPoints.push({
          id: `style-mixed-indent-${index}-${Date.now()}`,
          description: 'Mixed tabs and spaces for indentation',
          severity: 0.4,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.95,
            tags: ['style', 'indentation']
          }
        });
      }
      
      // Check for missing spaces around operators
      if (/[a-zA-Z0-9][+\-*/=][a-zA-Z0-9]/.test(line)) {
        frictionPoints.push({
          id: `style-operator-spacing-${index}-${Date.now()}`,
          description: 'Missing spaces around operators',
          severity: 0.2,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.8,
            tags: ['style', 'spacing']
          }
        });
      }
    });
    
    return frictionPoints;
  }

  async eliminate(point: FrictionPoint): Promise<boolean> {
    point.attempted = true;
    
    // Simulate style fixes
    const tags = point.metadata?.tags || [];
    
    if (tags.includes('spacing') || tags.includes('indentation')) {
      // These can be auto-fixed
      point.eliminated = true;
      this.record(point, true);
      return true;
    } else {
      // Line length requires manual intervention
      point.eliminated = false;
      this.record(point, false);
      return false;
    }
  }
}

/**
 * Mock Performance Friction Detector for demonstration
 */
class PerformanceFrictionDetector extends FrictionDetector<FrictionPoint> {
  constructor() {
    super('PerformanceFrictionDetector');
  }

  detect(sourceCode: string): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];
    const lines = sourceCode.split('\n');
    
    lines.forEach((line, index) => {
      // Check for console.log statements
      if (line.includes('console.log') && !line.includes('//')) {
        frictionPoints.push({
          id: `perf-console-${index}-${Date.now()}`,
          description: 'Console.log statement may impact performance',
          severity: 0.5,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.9,
            tags: ['performance', 'console']
          }
        });
      }
      
      // Check for synchronous file operations
      if (line.includes('readFileSync') || line.includes('writeFileSync')) {
        frictionPoints.push({
          id: `perf-sync-${index}-${Date.now()}`,
          description: 'Synchronous file operation blocks event loop',
          severity: 0.8,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.95,
            tags: ['performance', 'async']
          }
        });
      }
      
      // Check for inefficient string concatenation in loops
      if (line.includes('for') && line.includes('+') && line.includes('string')) {
        frictionPoints.push({
          id: `perf-string-concat-${index}-${Date.now()}`,
          description: 'Inefficient string concatenation in loop',
          severity: 0.7,
          timestamp: Date.now(),
          metadata: {
            confidence: 0.8,
            tags: ['performance', 'optimization']
          }
        });
      }
    });
    
    return frictionPoints;
  }

  async eliminate(point: FrictionPoint): Promise<boolean> {
    point.attempted = true;
    
    const tags = point.metadata?.tags || [];
    
    if (tags.includes('console')) {
      // Console.log can be automatically removed
      point.eliminated = true;
      this.record(point, true);
      return true;
    } else {
      // Other performance issues require manual refactoring
      point.eliminated = false;
      this.record(point, false);
      return false;
    }
  }
}

/**
 * Demonstrate the complete Intent-Driven UI system
 */
export async function demonstrateIntentDrivenUI(): Promise<void> {
  console.log('🎨 Sherlock Ω Intent-Driven UI Demonstration');
  console.log('='.repeat(55));

  // Sample code with various types of friction
  const sampleCode = `
function processUserData(userData) {
    console.log("Processing user data:", userData);  // Performance issue
    
    let result="";  // Style issue: missing spaces
    for (let i = 0; i < userData.length; i++) {
        result = result + userData[i].toString();  // Performance issue: inefficient concatenation
    }
    
    const config = readFileSync('./config.json', 'utf8');  // Performance issue: sync operation
    
	  const veryLongLineOfCodeThatExceedsTheRecommendedLengthAndShouldBeRefactoredForBetterReadability = true;  // Style issue: long line
    
    return result + config  // Syntax issue: missing semicolon
}

function validateInput(input) {
    if (!input) {
        throw new Error("Input is required")  // Syntax issue: missing semicolon
    }
    return true;
}
`;

  console.log('\n📋 Sample Code Analysis:');
  console.log('- Syntax errors (missing semicolons)');
  console.log('- Style issues (long lines, spacing, indentation)');
  console.log('- Performance issues (console.log, sync operations, inefficient loops)');

  // Create friction detectors
  console.log('\n🔍 Creating Friction Detectors...');
  const syntaxDetector = new SimpleSyntaxFrictionDetector();
  const styleDetector = new StyleFrictionDetector();
  const performanceDetector = new PerformanceFrictionDetector();

  console.log('✅ Created 3 detectors: Syntax, Style, Performance');

  // Create friction detection protocol
  console.log('\n🎯 Setting up Zero-Friction Protocol...');
  const protocol = new SimpleZeroFrictionProtocol([
    syntaxDetector,
    styleDetector,
    performanceDetector
  ], {
    autoEliminate: true,
    parallelExecution: true,
    maxConcurrentDetectors: 3,
    timeoutMs: 10000
  });

  console.log('✅ Protocol configured with parallel execution');

  // Create mock DOM environment for demonstration
  const mockParentElement = {
    appendChild: () => {},
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {}
  } as any;

  // Setup Intent-Driven UI
  console.log('\n🎨 Setting up Intent-Driven UI...');
  const uiManager = setupIntentDrivenUI({
    parentElement: mockParentElement,
    protocol,
    config: {
      sidebar: {
        enabled: true,
        position: 'right',
        width: 400,
        collapsible: true,
        autoHide: false,
        groupBy: 'severity',
        sortBy: 'severity',
        maxItems: 50
      },
      theme: {
        mode: 'dark',
        colors: {
          primary: '#007acc',
          secondary: '#6c757d',
          success: '#28a745',
          warning: '#ffc107',
          error: '#dc3545',
          background: '#1e1e1e',
          surface: '#252526',
          text: '#cccccc',
          textSecondary: '#969696'
        },
        fonts: {
          primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
          size: {
            small: '12px',
            medium: '14px',
            large: '16px'
          }
        }
      },
      interactions: {
        keyboardShortcuts: {
          toggleSidebar: 'Ctrl+Shift+S',
          executeAction: 'Enter',
          dismissAction: 'Delete',
          snoozeAction: 'Ctrl+D'
        },
        autoExecute: {
          enabled: false,
          confidenceThreshold: 0.9,
          severityThreshold: 'low' as any
        },
        confirmations: {
          autoFix: false,
          refactor: true,
          install: true
        }
      },
      notifications: {
        enabled: true,
        position: 'top-right',
        duration: 3000,
        showFor: {
          completed: true,
          failed: true,
          dismissed: false
        }
      }
    },
    autoConnect: true
  });

  console.log('✅ UI Manager initialized with full configuration');

  // Run friction detection
  console.log('\n🔍 Running Friction Detection...');
  const detectionResult = await protocol.run(sampleCode);

  console.log(`📊 Detection Results:`);
  console.log(`   Total friction points: ${detectionResult.totalFriction}`);
  console.log(`   Auto-eliminated: ${detectionResult.eliminatedFriction}`);
  console.log(`   Failed eliminations: ${detectionResult.failedElimination}`);
  console.log(`   Execution time: ${detectionResult.executionTime}ms`);

  // Process results in UI
  console.log('\n🎨 Processing Results in UI...');
  await uiManager.processFrictionResults(detectionResult);

  // Display UI statistics
  const uiStats = uiManager.getUIStats();
  console.log(`📈 UI Statistics:`);
  console.log(`   Total items in sidebar: ${uiStats.totalItems}`);
  console.log(`   Items by status:`);
  console.log(`     - Pending: ${uiStats.itemsByStatus.pending}`);
  console.log(`     - Completed: ${uiStats.itemsByStatus.completed}`);
  console.log(`     - Failed: ${uiStats.itemsByStatus.failed}`);
  console.log(`   Items by severity:`);
  console.log(`     - Critical: ${uiStats.itemsBySeverity.critical}`);
  console.log(`     - High: ${uiStats.itemsBySeverity.high}`);
  console.log(`     - Medium: ${uiStats.itemsBySeverity.medium}`);
  console.log(`     - Low: ${uiStats.itemsBySeverity.low}`);
  console.log(`   Sidebar visible: ${uiStats.sidebarVisible}`);
  console.log(`   Active notifications: ${uiStats.activeNotifications}`);

  // Demonstrate individual detector statistics
  console.log('\n📊 Individual Detector Statistics:');
  
  console.log('\n🔧 Syntax Detector:');
  const syntaxStats = syntaxDetector.getSyntaxStats();
  console.log(`   Total detected: ${syntaxStats.totalDetected}`);
  console.log(`   Auto-fixable: ${syntaxStats.autoFixableCount}`);
  console.log(`   Elimination rate: ${(syntaxStats.eliminationRate * 100).toFixed(1)}%`);
  
  console.log('\n🎨 Style Detector:');
  const styleStats = styleDetector.getStats();
  console.log(`   Total detected: ${styleStats.totalDetected}`);
  console.log(`   Elimination rate: ${(styleStats.eliminationRate * 100).toFixed(1)}%`);
  
  console.log('\n⚡ Performance Detector:');
  const perfStats = performanceDetector.getStats();
  console.log(`   Total detected: ${perfStats.totalDetected}`);
  console.log(`   Elimination rate: ${(perfStats.eliminationRate * 100).toFixed(1)}%`);

  // Demonstrate real-time updates
  console.log('\n🔄 Demonstrating Real-time Updates...');
  
  // Add a new friction point manually
  uiManager.addFrictionPoint({
    id: 'demo-manual-1',
    description: 'Manually added friction point for demonstration',
    severity: 0.6,
    timestamp: Date.now(),
    metadata: {
      confidence: 0.8,
      tags: ['demo', 'manual']
    }
  }, 'DemoDetector');

  console.log('✅ Added manual friction point');

  // Update the friction point
  uiManager.updateFrictionPoint({
    id: 'demo-manual-1',
    description: 'Updated friction point with new description',
    severity: 0.8,
    timestamp: Date.now(),
    eliminated: true,
    metadata: {
      confidence: 0.9,
      tags: ['demo', 'manual', 'updated']
    }
  }, 'DemoDetector');

  console.log('✅ Updated friction point');

  // Show notification
  uiManager.showNotification({
    title: 'Demo Complete',
    message: 'Intent-Driven UI demonstration completed successfully!',
    type: 'success',
    duration: 5000
  });

  console.log('✅ Showed completion notification');

  // Final statistics
  const finalStats = uiManager.getUIStats();
  console.log(`\n📈 Final UI Statistics:`);
  console.log(`   Total items: ${finalStats.totalItems}`);
  console.log(`   Active notifications: ${finalStats.activeNotifications}`);

  // Demonstrate configuration updates
  console.log('\n⚙️ Demonstrating Configuration Updates...');
  
  uiManager.updateConfig({
    sidebar: {
      enabled: true,
      position: 'left',
      width: 350,
      collapsible: true,
      autoHide: false,
      groupBy: 'source',
      sortBy: 'confidence',
      maxItems: 25
    },
    theme: {
      mode: 'light',
      colors: {
        primary: '#0066cc',
        secondary: '#666666',
        success: '#00aa00',
        warning: '#ff9900',
        error: '#cc0000',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333',
        textSecondary: '#666666'
      },
      fonts: {
        primary: 'Arial, sans-serif',
        monospace: 'Courier New, monospace',
        size: {
          small: '11px',
          medium: '13px',
          large: '15px'
        }
      }
    }
  });

  console.log('✅ Updated UI configuration (sidebar position, theme, grouping)');

  // Demonstrate sidebar controls
  console.log('\n👁️ Demonstrating Sidebar Controls...');
  
  uiManager.hideSidebar();
  console.log('✅ Sidebar hidden');
  
  uiManager.showSidebar();
  console.log('✅ Sidebar shown');
  
  uiManager.toggleSidebar();
  console.log('✅ Sidebar toggled');

  // Protocol statistics
  console.log('\n🎯 Protocol Statistics:');
  const protocolStats = protocol.getProtocolStats();
  console.log(`   Total executions: ${protocolStats.totalExecutions}`);
  console.log(`   Average execution time: ${protocolStats.averageExecutionTime.toFixed(2)}ms`);
  console.log(`   Overall elimination rate: ${(protocolStats.overallEliminationRate * 100).toFixed(1)}%`);

  console.log('\n✨ Intent-Driven UI Demonstration Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('• Multi-detector friction detection (Syntax, Style, Performance)');
  console.log('• Real-time UI updates and notifications');
  console.log('• Configurable sidebar with grouping and sorting');
  console.log('• Action plan items with severity and confidence indicators');
  console.log('• Automatic and manual friction point management');
  console.log('• Theme and configuration updates');
  console.log('• Comprehensive statistics and monitoring');
  console.log('• Keyboard shortcuts and user interactions');
  console.log('• Error handling and graceful degradation');

  // Cleanup
  console.log('\n🧹 Cleaning up resources...');
  uiManager.destroy();
  console.log('✅ UI Manager destroyed and resources cleaned up');
}

/**
 * Run the demonstration if this file is executed directly
 */
if (require.main === module) {
  demonstrateIntentDrivenUI().catch(console.error);
}