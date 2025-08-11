/**
 * Dependency Friction Detector for Sherlock Ω Zero-Friction Protocol
 * Detects and eliminates dependency-related friction points proactively
 */

import { FrictionDetector, FrictionPoint } from './BaseFrictionDetector';
import { DependencySensor, PackageInfo } from '../sensors/DependencySensor';
import { ComputationalIssue, ProblemType } from '../types/core';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Dependency-specific friction point interface
 */
export interface DependencyFrictionPoint extends FrictionPoint {
  dependencyName: string;
  dependencyType: 'missing' | 'version_conflict' | 'peer_dependency' | 'dev_dependency';
  currentVersion?: string;
  requiredVersion?: string;
  suggestions: string[];
  autoInstallable: boolean;
  installCommand?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  filePath: string;
  line: number;
  column: number;
}

/**
 * Installation options for packages
 */
export interface InstallOptions {
  dev?: boolean;
  peer?: boolean;
  exact?: boolean;
  version?: string;
  save?: boolean;
}

/**
 * Result of package installation
 */
export interface InstallResult {
  success: boolean;
  packageName: string;
  version?: string;
  error?: string;
  duration: number;
}

/**
 * Package manager interface for dependency operations
 */
export interface PackageManager {
  name: 'npm' | 'yarn' | 'pnpm';
  installCommand: string;
  addCommand: string;
  removeCommand: string;
  listCommand: string;
  detectLockFile(): Promise<boolean>;
  install(packageName: string, options?: InstallOptions): Promise<InstallResult>;
  checkInstalled(packageName: string): Promise<boolean>;
  getVersion(packageName: string): Promise<string | null>;
}/**
 *
 NPM package manager implementation
 */
export class NpmPackageManager implements PackageManager {
  public readonly name = 'npm' as const;
  public readonly installCommand = 'npm install';
  public readonly addCommand = 'npm install';
  public readonly removeCommand = 'npm uninstall';
  public readonly listCommand = 'npm list';

  async detectLockFile(): Promise<boolean> {
    try {
      await fs.access('package-lock.json');
      return true;
    } catch {
      return false;
    }
  }

  async install(packageName: string, options: InstallOptions = {}): Promise<InstallResult> {
    const startTime = Date.now();
    
    try {
      let command = 'npm install';
      
      if (options.dev) {
        command += ' --save-dev';
      } else if (options.peer) {
        command += ' --save-peer';
      } else if (options.save !== false) {
        command += ' --save';
      }

      if (options.exact) {
        command += ' --save-exact';
      }

      const packageSpec = options.version ? `${packageName}@${options.version}` : packageName;
      command += ` ${packageSpec}`;

      // In a real implementation, would execute the command
      console.log(`🔧 Would execute: ${command}`);
      
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        packageName,
        version: options.version || 'latest',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        packageName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  async checkInstalled(packageName: string): Promise<boolean> {
    try {
      // Check if package exists in node_modules
      await fs.access(path.join('node_modules', packageName));
      return true;
    } catch {
      return false;
    }
  }

  async getVersion(packageName: string): Promise<string | null> {
    try {
      const packageJsonPath = path.join('node_modules', packageName, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      return packageJson.version || null;
    } catch {
      return null;
    }
  }
}/**

 * Yarn package manager implementation
 */
export class YarnPackageManager implements PackageManager {
  public readonly name = 'yarn' as const;
  public readonly installCommand = 'yarn install';
  public readonly addCommand = 'yarn add';
  public readonly removeCommand = 'yarn remove';
  public readonly listCommand = 'yarn list';

  async detectLockFile(): Promise<boolean> {
    try {
      await fs.access('yarn.lock');
      return true;
    } catch {
      return false;
    }
  }

  async install(packageName: string, options: InstallOptions = {}): Promise<InstallResult> {
    const startTime = Date.now();
    
    try {
      let command = 'yarn add';
      
      if (options.dev) {
        command += ' --dev';
      } else if (options.peer) {
        command += ' --peer';
      }

      if (options.exact) {
        command += ' --exact';
      }

      const packageSpec = options.version ? `${packageName}@${options.version}` : packageName;
      command += ` ${packageSpec}`;

      console.log(`🔧 Would execute: ${command}`);
      
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        packageName,
        version: options.version || 'latest',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        packageName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  async checkInstalled(packageName: string): Promise<boolean> {
    try {
      await fs.access(path.join('node_modules', packageName));
      return true;
    } catch {
      return false;
    }
  }

  async getVersion(packageName: string): Promise<string | null> {
    try {
      const packageJsonPath = path.join('node_modules', packageName, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      return packageJson.version || null;
    } catch {
      return null;
    }
  }
}/**
 * De
pendency Friction Detector for missing dependency detection and auto-installation
 */
export class DependencyFrictionDetector extends FrictionDetector<DependencyFrictionPoint> {
  private dependencySensor: DependencySensor;
  private packageManagers: PackageManager[];
  private activePackageManager: PackageManager | null = null;
  private packageInfo: PackageInfo | null = null;

  constructor(dependencySensor?: DependencySensor) {
    super('DependencyFrictionDetector');
    
    this.dependencySensor = dependencySensor || new DependencySensor();
    this.packageManagers = [
      new YarnPackageManager(),
      new NpmPackageManager()
    ];
    
    this.initializePackageManager();
  }

  /**
   * Detect dependency friction points in the current context
   */
  async detect(context: DependencyDetectionContext): Promise<DependencyFrictionPoint[]> {
    const frictionPoints: DependencyFrictionPoint[] = [];

    try {
      // Load package.json if available
      await this.loadPackageInfo();

      // Analyze dependencies in the provided context
      if (context.filePath && context.content) {
        await this.dependencySensor.addFile(context.filePath, context.content);
      }

      // Get dependency issues from the sensor
      const issues = await this.dependencySensor.getDependencyIssues();

      // Convert issues to friction points
      for (const issue of issues) {
        const frictionPoint = await this.createFrictionPointFromIssue(issue);
        if (frictionPoint) {
          frictionPoints.push(frictionPoint);
        }
      }

      // Check for missing dependencies in package.json
      if (this.packageInfo && context.checkPackageJson) {
        const packageFriction = await this.detectPackageJsonFriction();
        frictionPoints.push(...packageFriction);
      }

    } catch (error) {
      console.error('Error detecting dependency friction:', error);
    }

    return frictionPoints;
  }

  /**
   * Eliminate a dependency friction point through auto-installation
   */
  async eliminate(point: DependencyFrictionPoint): Promise<boolean> {
    point.attempted = true;

    try {
      console.log(`🔧 Attempting to eliminate dependency friction: ${point.dependencyName}`);

      if (!this.activePackageManager) {
        console.error('No active package manager found');
        point.eliminated = false;
        this.record(point, false);
        return false;
      }

      // Check if already installed
      const isInstalled = await this.activePackageManager.checkInstalled(point.dependencyName);
      if (isInstalled) {
        console.log(`✅ Dependency ${point.dependencyName} is already installed`);
        point.eliminated = true;
        this.record(point, true);
        return true;
      }

      // Attempt auto-installation if possible
      if (point.autoInstallable) {
        const installResult = await this.autoInstallDependency(point);
        point.eliminated = installResult.success;
        
        if (installResult.success) {
          console.log(`✅ Successfully installed ${point.dependencyName}@${installResult.version}`);
        } else {
          console.error(`❌ Failed to install ${point.dependencyName}: ${installResult.error}`);
        }
      } else {
        console.log(`⚠️ Manual installation required for ${point.dependencyName}`);
        point.eliminated = false;
      }

      this.record(point, point.eliminated || false);
      return point.eliminated || false;

    } catch (error) {
      console.error(`Failed to eliminate dependency friction for ${point.dependencyName}:`, error);
      point.eliminated = false;
      this.record(point, false);
      return false;
    }
  }  /**
 
  * Get dependency-specific statistics
   */
  getDependencyStats(): DependencyFrictionStats {
    const baseStats = this.getStats();
    const frictionByType = new Map<string, number>();
    const frictionByPackageManager = new Map<string, number>();
    
    for (const point of this.history) {
      // Count by dependency type
      const currentCount = frictionByType.get(point.dependencyType) || 0;
      frictionByType.set(point.dependencyType, currentCount + 1);
      
      // Count by package manager
      const pmCount = frictionByPackageManager.get(point.packageManager) || 0;
      frictionByPackageManager.set(point.packageManager, pmCount + 1);
    }
    
    return {
      ...baseStats,
      frictionByType: Object.fromEntries(frictionByType),
      frictionByPackageManager: Object.fromEntries(frictionByPackageManager),
      autoInstallableCount: this.history.filter(p => p.autoInstallable).length,
      activePackageManager: this.activePackageManager?.name || 'none'
    };
  }

  // Private helper methods

  /**
   * Initialize the active package manager based on lock files
   */
  private async initializePackageManager(): Promise<void> {
    for (const pm of this.packageManagers) {
      if (await pm.detectLockFile()) {
        this.activePackageManager = pm;
        console.log(`📦 Detected ${pm.name} as active package manager`);
        return;
      }
    }

    // Default to npm if no lock file found
    this.activePackageManager = this.packageManagers.find(pm => pm.name === 'npm') || null;
    console.log('📦 Using npm as default package manager');
  }

  /**
   * Load package.json information
   */
  private async loadPackageInfo(): Promise<void> {
    try {
      const packageJsonContent = await fs.readFile('package.json', 'utf-8');
      this.packageInfo = JSON.parse(packageJsonContent);
      
      if (this.packageInfo) {
        this.dependencySensor.setPackageInfo(this.packageInfo);
        console.log(`📋 Loaded package info: ${this.packageInfo.name}@${this.packageInfo.version}`);
      }
    } catch (error) {
      console.warn('Could not load package.json:', error);
      this.packageInfo = null;
    }
  }  /*
*
   * Create friction point from computational issue
   */
  private async createFrictionPointFromIssue(issue: ComputationalIssue): Promise<DependencyFrictionPoint | null> {
    if (issue.type !== ProblemType.DEPENDENCY_MISSING) {
      return null;
    }

    const dependencyName = this.extractDependencyName(issue);
    if (!dependencyName) {
      return null;
    }

    const suggestions = await this.generateSuggestions(dependencyName);
    const autoInstallable = this.isAutoInstallable(dependencyName);

    return {
      id: `dep-friction-${dependencyName}-${Date.now()}`,
      description: `Missing dependency: ${dependencyName}`,
      severity: this.calculateSeverity(dependencyName),
      location: {
        file: issue.context.file,
        line: issue.context.line,
        column: issue.context.column
      },
      dependencyName,
      dependencyType: 'missing',
      suggestions,
      autoInstallable,
      installCommand: this.generateInstallCommand(dependencyName),
      packageManager: this.activePackageManager?.name || 'npm',
      filePath: issue.context.file || '',
      line: issue.context.line || 0,
      column: issue.context.column || 0,
      timestamp: Date.now(),
      metadata: {
        issueId: issue.id,
        confidence: issue.metadata.confidence || 0.8
      }
    };
  }

  /**
   * Detect friction in package.json (unused dependencies, version conflicts)
   */
  private async detectPackageJsonFriction(): Promise<DependencyFrictionPoint[]> {
    const frictionPoints: DependencyFrictionPoint[] = [];

    if (!this.packageInfo) {
      return frictionPoints;
    }

    // Check for unused dependencies (simplified implementation)
    const allDependencies = {
      ...this.packageInfo.dependencies,
      ...this.packageInfo.devDependencies
    };

    for (const [depName, version] of Object.entries(allDependencies)) {
      const isInstalled = await this.activePackageManager?.checkInstalled(depName);
      
      if (!isInstalled) {
        frictionPoints.push({
          id: `pkg-friction-${depName}-${Date.now()}`,
          description: `Package ${depName} listed in package.json but not installed`,
          severity: 0.7,
          dependencyName: depName,
          dependencyType: 'missing',
          currentVersion: version,
          suggestions: [`Run ${this.activePackageManager?.installCommand || 'npm install'}`],
          autoInstallable: true,
          installCommand: this.generateInstallCommand(depName, version),
          packageManager: this.activePackageManager?.name || 'npm',
          filePath: 'package.json',
          line: 0,
          column: 0,
          timestamp: Date.now()
        });
      }
    }

    return frictionPoints;
  }  
/**
   * Auto-install a dependency
   */
  private async autoInstallDependency(point: DependencyFrictionPoint): Promise<InstallResult> {
    if (!this.activePackageManager) {
      return {
        success: false,
        packageName: point.dependencyName,
        error: 'No package manager available',
        duration: 0
      };
    }

    const options: InstallOptions = {
      save: true,
      version: point.requiredVersion
    };

    // Determine if it should be a dev dependency
    if (this.isDevDependency(point.dependencyName)) {
      options.dev = true;
    }

    return await this.activePackageManager.install(point.dependencyName, options);
  }

  /**
   * Extract dependency name from computational issue
   */
  private extractDependencyName(issue: ComputationalIssue): string | null {
    // Extract from tags or metadata
    const tags = issue.metadata.tags || [];
    for (const tag of tags) {
      if (tag !== 'missing-dependency' && !tag.includes('import') && !tag.includes('require')) {
        return tag;
      }
    }
    return null;
  }

  /**
   * Generate suggestions for resolving dependency issues
   */
  private async generateSuggestions(dependencyName: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Add install command
    if (this.activePackageManager) {
      suggestions.push(`${this.activePackageManager.addCommand} ${dependencyName}`);
    }

    // Common alternatives for popular packages
    const alternatives: Record<string, string[]> = {
      'lodash': ['lodash-es', 'ramda'],
      'moment': ['dayjs', 'date-fns'],
      'request': ['axios', 'node-fetch'],
      'jquery': ['vanilla JavaScript', 'modern DOM APIs']
    };

    if (alternatives[dependencyName]) {
      suggestions.push(...alternatives[dependencyName].map(alt => `Consider using ${alt} instead`));
    }

    // Check if it might be a typo
    if (this.packageInfo) {
      const allDeps = Object.keys({
        ...this.packageInfo.dependencies,
        ...this.packageInfo.devDependencies
      });
      
      const similarDeps = allDeps.filter(dep => 
        this.calculateSimilarity(dep, dependencyName) > 0.7
      );
      
      if (similarDeps.length > 0) {
        suggestions.push(...similarDeps.map(dep => `Did you mean ${dep}?`));
      }
    }

    return suggestions;
  }

  /**
   * Check if a dependency can be auto-installed
   */
  private isAutoInstallable(dependencyName: string): boolean {
    // Don't auto-install certain types of packages
    const nonAutoInstallable = [
      '@types/', // Type definitions might need specific versions
      'eslint-', // ESLint plugins often need configuration
      'babel-', // Babel plugins need configuration
      'webpack-' // Webpack plugins need configuration
    ];

    return !nonAutoInstallable.some(prefix => dependencyName.startsWith(prefix));
  }

  /**
   * Check if a dependency should be installed as dev dependency
   */
  private isDevDependency(dependencyName: string): boolean {
    const devPatterns = [
      '@types/',
      'eslint',
      'prettier',
      'jest',
      'mocha',
      'chai',
      'sinon',
      'webpack',
      'babel',
      'typescript',
      'ts-node',
      'nodemon'
    ];

    return devPatterns.some(pattern => dependencyName.includes(pattern));
  }

  /**
   * Generate install command for a dependency
   */
  private generateInstallCommand(dependencyName: string, version?: string): string {
    if (!this.activePackageManager) {
      return `npm install ${dependencyName}`;
    }

    const packageSpec = version ? `${dependencyName}@${version}` : dependencyName;
    const devFlag = this.isDevDependency(dependencyName) ? ' --save-dev' : '';
    
    return `${this.activePackageManager.addCommand}${devFlag} ${packageSpec}`;
  }

  /**
   * Calculate severity based on dependency importance
   */
  private calculateSeverity(dependencyName: string): number {
    // Core dependencies have higher severity
    const coreDependencies = ['react', 'vue', 'angular', 'express', 'typescript'];
    if (coreDependencies.includes(dependencyName)) {
      return 0.9;
    }

    // Dev dependencies have lower severity
    if (this.isDevDependency(dependencyName)) {
      return 0.5;
    }

    return 0.7; // Default severity
  }  /**

   * Calculate string similarity for typo detection
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Context for dependency detection
 */
export interface DependencyDetectionContext {
  filePath?: string;
  content?: string;
  checkPackageJson?: boolean;
  workspaceRoot?: string;
}

/**
 * Extended statistics for dependency friction detection
 */
export interface DependencyFrictionStats {
  totalDetected: number;
  totalAttempted: number;
  totalEliminated: number;
  eliminationRate: number;
  detectionRate: number;
  frictionByType: Record<string, number>;
  frictionByPackageManager: Record<string, number>;
  autoInstallableCount: number;
  activePackageManager: string;
}