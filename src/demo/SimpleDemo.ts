/**
 * Simple Demo for Sherlock Ω Integrated Friction Protocol
 * Shows the complete workflow in action
 */

import { IntegratedFrictionProtocol, IntegratedContext } from '../friction/IntegratedFrictionProtocol';

/**
 * Simple demo runner
 */
export class SimpleDemo {
  private protocol: IntegratedFrictionProtocol;

  constructor() {
    this.protocol = new IntegratedFrictionProtocol();
  }

  /**
   * Run a simple demonstration
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Sherlock Ω - Integrated Friction Detection Demo');
    console.log('=' .repeat(55));

    // Sample code with various friction points
    const sampleCode = `
import React from 'react';
import _ from 'lodash'; // Missing dependency
import moment from 'moment'; // Missing dependency
import axios from 'axios'; // Missing dependency

interface User {
  id: number;
  name: string;
  email: string;
}

const UserComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]); // Missing React import for useState

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        const processedUsers = _.map(response.data, (user: any) => ({
          ...user,
          createdAt: moment().toISOString()
        }));
        setUsers(processedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []); // Missing React import for useEffect

  return (
    <div>
      <h1>User List</h1>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
};

export default UserComponent;
    `;

    const context: IntegratedContext = {
      filePath: 'src/UserComponent.tsx',
      content: sampleCode,
      checkPackageJson: true,
      language: 'typescript'
    };

    try {
      console.log('\n🔍 Phase 1: Detection');
      console.log('-'.repeat(30));
      
      const result = await this.protocol.runIntegratedDetection(context);
      
      console.log(`✅ Detection complete!`);
      console.log(`   📊 Found ${result.actionableItems.length} actionable items`);
      console.log(`   ⚡ Auto-executable: ${result.uiMetadata.autoExecutableActions}`);
      console.log(`   🔥 High priority: ${result.uiMetadata.highPriorityActions}`);
      console.log(`   ⏱️  Estimated time: ${Math.ceil(result.uiMetadata.estimatedTotalTime / 60)}m`);

      console.log('\n📋 Detected Issues:');
      for (const action of result.actionableItems) {
        const icon = this.getActionIcon(action.type);
        const severity = action.severity.toUpperCase().padEnd(6);
        const autoFlag = action.autoExecutable ? '🤖' : '👤';
        
        console.log(`   ${icon} [${severity}] ${autoFlag} ${action.title}`);
        if (action.command) {
          console.log(`      💻 ${action.command}`);
        }
      }

      console.log('\n🔧 Phase 2: Auto-Execution');
      console.log('-'.repeat(30));

      const autoExecutableActions = result.actionableItems.filter(a => a.autoExecutable);
      console.log(`Executing ${autoExecutableActions.length} auto-executable actions...`);

      let successCount = 0;
      for (const action of autoExecutableActions.slice(0, 3)) { // Limit to first 3 for demo
        console.log(`   🔄 Executing: ${action.title}`);
        
        const executionResult = await this.protocol.executeAction(action.id);
        if (executionResult.success) {
          successCount++;
          console.log(`   ✅ Success (${executionResult.duration}ms)`);
        } else {
          console.log(`   ❌ Failed: ${executionResult.error}`);
        }
      }

      console.log('\n📈 Phase 3: Results');
      console.log('-'.repeat(30));

      const stats = this.protocol.getUIStats();
      console.log(`📊 Final Statistics:`);
      console.log(`   Overall elimination rate: ${(stats.overall.eliminationRate * 100).toFixed(1)}%`);
      console.log(`   Dependencies: ${stats.dependencies.detected} detected, ${stats.dependencies.eliminated} eliminated`);
      console.log(`   Package manager: ${stats.dependencies.packageManager}`);
      console.log(`   Auto-installable: ${stats.dependencies.autoInstallable}`);

      console.log('\n🎯 UI Integration Ready!');
      console.log('-'.repeat(30));
      console.log('The ActionPlan sidebar would show:');
      console.log(`   • ${result.actionableItems.length} total actions`);
      console.log(`   • ${result.uiMetadata.autoExecutableActions} one-click fixes`);
      console.log(`   • ${result.uiMetadata.categories.dependencies} dependency issues`);
      console.log(`   • ${result.uiMetadata.categories.syntax} syntax issues`);

      console.log('\n🎉 Demo Complete!');
      console.log('\nSherlock Ω successfully demonstrated:');
      console.log('  ✅ Real-time friction detection');
      console.log('  ✅ Intelligent dependency analysis');
      console.log('  ✅ Auto-installation capabilities');
      console.log('  ✅ UI-ready actionable items');
      console.log('  ✅ One-click execution workflow');
      console.log('  ✅ Zero-friction development protocol');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Get action icon for display
   */
  private getActionIcon(type: string): string {
    switch (type) {
      case 'install': return '📦';
      case 'update': return '🔄';
      case 'fix': return '🔧';
      case 'refactor': return '♻️';
      default: return '⚡';
    }
  }

  /**
   * Show UI component integration example
   */
  showUIIntegration(): void {
    console.log('\n🖥️  UI Integration Example');
    console.log('=' .repeat(55));
    console.log('');
    console.log('┌─ Action Plan Sidebar ─────────────────────────┐');
    console.log('│ 📦 Install lodash                    [HIGH] 🤖│');
    console.log('│ 📦 Install moment                    [MED]  🤖│');
    console.log('│ 📦 Install axios                     [MED]  🤖│');
    console.log('│ 🔧 Fix missing useState import       [HIGH] 🤖│');
    console.log('│ 🔧 Fix missing useEffect import      [HIGH] 🤖│');
    console.log('│                                              │');
    console.log('│ [Install All] [Fix Syntax] [Dismiss All]    │');
    console.log('│                                              │');
    console.log('│ 📊 5 issues • 5 auto-fixable • Est: 2m      │');
    console.log('└──────────────────────────────────────────────┘');
    console.log('');
    console.log('Each item would have:');
    console.log('  • One-click execution buttons');
    console.log('  • Severity indicators');
    console.log('  • Auto-executable flags');
    console.log('  • Command previews');
    console.log('  • Confidence scores');
    console.log('  • Estimated execution time');
  }
}

/**
 * Run the simple demo
 */
export async function runSimpleDemo(): Promise<void> {
  const demo = new SimpleDemo();
  await demo.runDemo();
  demo.showUIIntegration();
}

// Run demo if this file is executed directly
if (require.main === module) {
  runSimpleDemo().catch(console.error);
}