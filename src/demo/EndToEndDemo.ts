/**
 * End-to-End Demo for Sherlock Ω Dependency Friction Detection
 * Demonstrates the complete workflow: detect, eliminate, verify
 */

import { IntegratedFrictionProtocol, IntegratedContext } from '../friction/IntegratedFrictionProtocol';
import { DependencyFrictionDetector } from '../friction/DependencyFrictionDetector';
import { SimpleSyntaxFrictionDetector } from '../friction/SimpleSyntaxFrictionDetector';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Demo project structure
 */
interface DemoProject {
  name: string;
  files: DemoFile[];
  packageJson: any;
  expectedIssues: string[];
}

/**
 * Demo file structure
 */
interface DemoFile {
  path: string;
  content: string;
  language: string;
}

/**
 * Demo execution result
 */
interface DemoResult {
  project: string;
  phase: string;
  success: boolean;
  details: any;
  timestamp: number;
}

/**
 * End-to-End Demo Runner
 */
export class EndToEndDemo {
  private protocol: IntegratedFrictionProtocol;
  private results: DemoResult[] = [];

  constructor() {
    this.protocol = new IntegratedFrictionProtocol();
  }

  /**
   * Run the complete end-to-end demo
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 Starting Sherlock Ω End-to-End Demo');
    console.log('=' .repeat(60));

    try {
      // Phase 1: Setup demo projects
      const projects = await this.setupDemoProjects();
      
      // Phase 2: Run detection and elimination for each project
      for (const project of projects) {
        await this.runProjectDemo(project);
      }

      // Phase 3: Show summary results
      this.showDemoSummary();

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Setup demo projects with various friction scenarios
   */
  private async setupDemoProjects(): Promise<DemoProject[]> {
    console.log('\n📁 Setting up demo projects...');

    const projects: DemoProject[] = [
      {
        name: 'React TypeScript Project',
        packageJson: {
          name: 'demo-react-project',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0'
          },
          devDependencies: {
            'typescript': '^4.9.0'
          }
        },
        files: [
          {
            path: 'src/App.tsx',
            language: 'typescript',
            content: `
import React from 'react';
import _ from 'lodash'; // Missing dependency
import moment from 'moment'; // Missing dependency
import { Button } from '@mui/material'; // Missing dependency

interface User {
  id: number;
  name: string;
  email: string;
}

const App: React.FC = () => {
  const users: User[] = _.map([1, 2, 3], (id) => ({
    id,
    name: \`User \${id}\`,
    email: \`user\${id}@example.com\`
  }));

  const formatDate = (date: Date) => {
    return moment(date).format('YYYY-MM-DD');
  };

  return (
    <div>
      <h1>User List</h1>
      <p>Generated on: {formatDate(new Date())}</p>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <Button variant="contained">Edit User</Button>
        </div>
      ))}
    </div>
  );
};

export default App;
            `
          },
          {
            path: 'src/utils/helpers.ts',
            language: 'typescript',
            content: `
import axios from 'axios'; // Missing dependency
import { v4 as uuidv4 } from 'uuid'; // Missing dependency

export const fetchUserData = async (userId: string) => {
  const response = await axios.get(\`/api/users/\${userId}\`);
  return response.data;
};

export const generateId = (): string => {
  return uuidv4();
};

// Syntax error: missing closing brace
export const processData = (data: any) => {
  return {
    id: generateId(),
    processed: true,
    data
  // Missing closing brace
`;
          }
        ],
        expectedIssues: ['lodash', 'moment', '@mui/material', 'axios', 'uuid', 'syntax-error']
      },
      {
        name: 'Node.js Express API',
        packageJson: {
          name: 'demo-express-api',
          version: '1.0.0',
          dependencies: {
            'express': '^4.18.0'
          },
          devDependencies: {
            '@types/node': '^18.0.0'
          }
        },
        files: [
          {
            path: 'src/server.ts',
            language: 'typescript',
            content: `
import express from 'express';
import cors from 'cors'; // Missing dependency
import helmet from 'helmet'; // Missing dependency
import morgan from 'morgan'; // Missing dependency
import { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users', async (req: Request, res: Response) => {
  // Simulate database query with missing dependency
  const db = require('pg'); // Missing dependency
  
  try {
    const users = await db.query('SELECT * FROM users');
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
            `
          }
        ],
        expectedIssues: ['cors', 'helmet', 'morgan', 'pg']
      }
    ];

    console.log(`✅ Setup ${projects.length} demo projects`);
    return projects;
  }

  /**
   * Run demo for a single project
   */
  private async runProjectDemo(project: DemoProject): Promise<void> {
    console.log(`\n🎯 Running demo for: ${project.name}`);
    console.log('-'.repeat(40));

    try {
      // Phase 1: Initial Detection
      await this.runDetectionPhase(project);

      // Phase 2: Elimination
      await this.runEliminationPhase(project);

      // Phase 3: Verification
      await this.runVerificationPhase(project);

    } catch (error) {
      console.error(`❌ Project demo failed for ${project.name}:`, error);
      this.recordResult(project.name, 'error', false, { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Phase 1: Detection
   */
  private async runDetectionPhase(project: DemoProject): Promise<void> {
    console.log('\n🔍 Phase 1: Friction Detection');
    
    const detectionResults = [];

    for (const file of project.files) {
      console.log(`   Analyzing ${file.path}...`);
      
      const context: IntegratedContext = {
        filePath: file.path,
        content: file.content,
        checkPackageJson: true,
        workspaceRoot: `/demo/${project.name}`,
        language: file.language
      };

      const result = await this.protocol.runIntegratedDetection(context);
      detectionResults.push({
        file: file.path,
        actions: result.actionableItems,
        metadata: result.uiMetadata
      });

      console.log(`     Found ${result.actionableItems.length} actionable items`);
      
      // Show detected issues
      for (const action of result.actionableItems) {
        const icon = this.getActionIcon(action.type);
        const severity = action.severity.toUpperCase().padEnd(6);
        console.log(`     ${icon} [${severity}] ${action.title}`);
        
        if (action.command) {
          console.log(`       Command: ${action.command}`);
        }
      }
    }

    const totalActions = detectionResults.reduce((sum, r) => sum + r.actions.length, 0);
    console.log(`\n   📊 Detection Summary: ${totalActions} total friction points detected`);

    this.recordResult(project.name, 'detection', true, {
      totalFiles: project.files.length,
      totalActions,
      detectionResults
    });
  }

  /**
   * Phase 2: Elimination
   */
  private async runEliminationPhase(project: DemoProject): Promise<void> {
    console.log('\n🔧 Phase 2: Friction Elimination');

    // Get current actions
    const context: IntegratedContext = {
      filePath: project.files[0].path,
      content: project.files[0].content,
      checkPackageJson: true
    };

    const result = await this.protocol.runIntegratedDetection(context);
    const autoExecutableActions = result.actionableItems.filter(action => action.autoExecutable);

    console.log(`   Found ${autoExecutableActions.length} auto-executable actions`);

    let successCount = 0;
    let failureCount = 0;

    // Execute auto-executable actions
    for (const action of autoExecutableActions) {
      console.log(`   Executing: ${action.title}`);
      
      try {
        const executionResult = await this.protocol.executeAction(action.id);
        
        if (executionResult.success) {
          successCount++;
          console.log(`     ✅ Success (${executionResult.duration}ms)`);
        } else {
          failureCount++;
          console.log(`     ❌ Failed: ${executionResult.error}`);
        }
      } catch (error) {
        failureCount++;
        console.log(`     ❌ Error: ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log(`\n   📊 Elimination Summary: ${successCount} successful, ${failureCount} failed`);

    this.recordResult(project.name, 'elimination', true, {
      totalActions: autoExecutableActions.length,
      successCount,
      failureCount,
      eliminationRate: autoExecutableActions.length > 0 ? successCount / autoExecutableActions.length : 0
    });
  }

  /**
   * Phase 3: Verification
   */
  private async runVerificationPhase(project: DemoProject): Promise<void> {
    console.log('\n✅ Phase 3: Verification');

    // Re-run detection to verify elimination
    const context: IntegratedContext = {
      filePath: project.files[0].path,
      content: project.files[0].content,
      checkPackageJson: true
    };

    const result = await this.protocol.runIntegratedDetection(context);
    const remainingActions = result.actionableItems;

    console.log(`   Remaining friction points: ${remainingActions.length}`);

    // Show what's left
    if (remainingActions.length > 0) {
      console.log('   Remaining issues:');
      for (const action of remainingActions) {
        const reason = action.autoExecutable ? 'execution failed' : 'manual fix required';
        console.log(`     • ${action.title} (${reason})`);
      }
    } else {
      console.log('   🎉 All friction eliminated! Perfect flow state achieved.');
    }

    // Get final stats
    const stats = this.protocol.getUIStats();
    console.log(`\n   📈 Final Statistics:`);
    console.log(`     Overall elimination rate: ${(stats.overall.eliminationRate * 100).toFixed(1)}%`);
    console.log(`     Syntax issues: ${stats.syntax.detected} detected, ${stats.syntax.eliminated} eliminated`);
    console.log(`     Dependency issues: ${stats.dependencies.detected} detected, ${stats.dependencies.eliminated} eliminated`);

    this.recordResult(project.name, 'verification', true, {
      remainingActions: remainingActions.length,
      finalStats: stats,
      flowStateAchieved: remainingActions.length === 0
    });
  }

  /**
   * Show demo summary
   */
  private showDemoSummary(): void {
    console.log('\n🏁 Demo Summary');
    console.log('=' .repeat(60));

    const projectResults = this.groupResultsByProject();
    
    for (const [projectName, results] of Object.entries(projectResults)) {
      console.log(`\n📁 ${projectName}:`);
      
      for (const result of results) {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.phase}: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    // Overall statistics
    const totalProjects = Object.keys(projectResults).length;
    const successfulProjects = Object.values(projectResults).filter(results => 
      results.every(r => r.success)
    ).length;

    console.log(`\n📊 Overall Results:`);
    console.log(`   Projects processed: ${totalProjects}`);
    console.log(`   Successful projects: ${successfulProjects}`);
    console.log(`   Success rate: ${(successfulProjects / totalProjects * 100).toFixed(1)}%`);

    console.log('\n🎉 End-to-End Demo Complete!');
    console.log('\nSherlock Ω has demonstrated:');
    console.log('  • Real-time friction detection across syntax and dependencies');
    console.log('  • Intelligent auto-installation with package manager detection');
    console.log('  • UI-ready actionable items with one-click execution');
    console.log('  • Complete workflow from detection to verification');
    console.log('  • Zero-friction development protocol in action');
  }

  /**
   * Record a demo result
   */
  private recordResult(project: string, phase: string, success: boolean, details: any): void {
    this.results.push({
      project,
      phase,
      success,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Group results by project
   */
  private groupResultsByProject(): Record<string, DemoResult[]> {
    const grouped: Record<string, DemoResult[]> = {};
    
    for (const result of this.results) {
      if (!grouped[result.project]) {
        grouped[result.project] = [];
      }
      grouped[result.project].push(result);
    }
    
    return grouped;
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
   * Create a sample project for testing
   */
  async createSampleProject(projectPath: string): Promise<void> {
    console.log(`\n📁 Creating sample project at: ${projectPath}`);

    try {
      // Create project directory
      await fs.mkdir(projectPath, { recursive: true });
      await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });

      // Create package.json
      const packageJson = {
        name: 'sherlock-omega-demo',
        version: '1.0.0',
        description: 'Demo project for Sherlock Ω friction detection',
        main: 'src/index.ts',
        scripts: {
          start: 'node dist/index.js',
          build: 'tsc',
          dev: 'ts-node src/index.ts'
        },
        dependencies: {
          express: '^4.18.0'
        },
        devDependencies: {
          typescript: '^4.9.0',
          '@types/node': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create sample TypeScript file with missing dependencies
      const sampleCode = `
import express from 'express';
import _ from 'lodash'; // Missing dependency
import moment from 'moment'; // Missing dependency
import cors from 'cors'; // Missing dependency

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/users', (req, res) => {
  const users = _.map([1, 2, 3], (id) => ({
    id,
    name: \`User \${id}\`,
    createdAt: moment().toISOString()
  }));
  
  res.json(users);
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
      `;

      await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), sampleCode);

      // Create TypeScript config
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      };

      await fs.writeFile(
        path.join(projectPath, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );

      console.log('✅ Sample project created successfully');
      console.log(`   📄 Files created:`);
      console.log(`     • package.json`);
      console.log(`     • src/index.ts (with missing dependencies)`);
      console.log(`     • tsconfig.json`);
      console.log(`\n   🎯 This project has intentional friction points:`);
      console.log(`     • Missing lodash dependency`);
      console.log(`     • Missing moment dependency`);
      console.log(`     • Missing cors dependency`);

    } catch (error) {
      console.error('❌ Failed to create sample project:', error);
      throw error;
    }
  }
}

/**
 * Run the demo if this file is executed directly
 */
export async function runEndToEndDemo(): Promise<void> {
  const demo = new EndToEndDemo();
  await demo.runCompleteDemo();
}

// Run demo if this file is executed directly
if (require.main === module) {
  runEndToEndDemo().catch(console.error);
}