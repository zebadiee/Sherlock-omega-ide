/**
 * Integrated Friction Protocol for Sherlock Ω
 * Combines syntax and dependency friction detection with UI integration
 */

import { SimpleZeroFrictionProtocol, ProtocolResult } from './SimpleZeroFrictionProtocol';
import { SimpleSyntaxFrictionDetector } from './SimpleSyntaxFrictionDetector';
import { DependencyFrictionDetector, DependencyFrictionPoint } from './DependencyFrictionDetector';
import { FrictionPoint } from './BaseFrictionDetector';

/**
 * Enhanced protocol result with UI-specific data
 */
export interface IntegratedProtocolResult extends ProtocolResult {
  actionableItems: ActionableItem[];
  uiMetadata: UIMetadata;
}

/**
 * Actionable item for UI display
 */
export interface ActionableItem {
  id: string;
  type: 'install' | 'update' | 'fix' | 'refactor';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  command?: string;
  filePath?: string;
  line?: number;
  column?: number;
  metadata: {
    frictionType: string;
    confidence: number;
    estimatedTime: number; // seconds
    dependencies?: string[];
  };
}

/**
 * UI metadata for the action plan sidebar
 */
export interface UIMetadata {
  totalActions: number;
  autoExecutableActions: number;
  highPriorityActions: number;
  estimatedTotalTime: number;
  lastUpdated: number;
  categories: {
    syntax: number;
    dependencies: number;
    performance: number;
    architecture: number;
  };
}

/**
 * Integrated Friction Protocol with UI support
 */
export class IntegratedFrictionProtocol {
  private protocol: SimpleZeroFrictionProtocol;
  private syntaxDetector: SimpleSyntaxFrictionDetector;
  private dependencyDetector: DependencyFrictionDetector;

  constructor() {
    this.syntaxDetector = new SimpleSyntaxFrictionDetector();
    this.dependencyDetector = new DependencyFrictionDetector();
    
    this.protocol = new SimpleZeroFrictionProtocol([
      this.syntaxDetector,
      this.dependencyDetector
    ]);
  }

  /**
   * Run integrated friction detection and return UI-ready results
   */
  async runIntegratedDetection(context: IntegratedContext): Promise<IntegratedProtocolResult> {
    const startTime = Date.now();
    
    // Run the base protocol
    const baseResult = await this.protocol.run(context);
    
    // Convert friction points to actionable items
    const actionableItems = await this.convertToActionableItems(baseResult);
    
    // Generate UI metadata
    const uiMetadata = this.generateUIMetadata(actionableItems, startTime);
    
    return {
      ...baseResult,
      actionableItems,
      uiMetadata
    };
  }

  /**
   * Execute a specific actionable item
   */
  async executeAction(actionId: string): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Find the action in recent results
      const action = await this.findActionById(actionId);
      if (!action) {
        return {
          success: false,
          actionId,
          error: 'Action not found',
          duration: Date.now() - startTime
        };
      }

      // Execute based on action type
      let result: boolean = false;
      
      switch (action.type) {
        case 'install':
          result = await this.executeInstallAction(action);
          break;
        case 'update':
          result = await this.executeUpdateAction(action);
          break;
        case 'fix':
          result = await this.executeFixAction(action);
          break;
        case 'refactor':
          result = await this.executeRefactorAction(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        success: result,
        actionId,
        duration: Date.now() - startTime,
        message: result ? 'Action executed successfully' : 'Action execution failed'
      };

    } catch (error) {
      return {
        success: false,
        actionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get current friction statistics for UI display
   */
  getUIStats(): UIStats {
    const protocolStats = this.protocol.getProtocolStats();
    const syntaxStats = this.syntaxDetector.getStats();
    const dependencyStats = this.dependencyDetector.getDependencyStats();

    return {
      overall: {
        totalDetected: protocolStats.totalFrictionDetected,
        totalEliminated: protocolStats.totalFrictionEliminated,
        eliminationRate: protocolStats.overallEliminationRate,
        averageExecutionTime: protocolStats.averageExecutionTime
      },
      syntax: {
        detected: syntaxStats.totalDetected,
        eliminated: syntaxStats.totalEliminated,
        eliminationRate: syntaxStats.eliminationRate
      },
      dependencies: {
        detected: dependencyStats.totalDetected,
        eliminated: dependencyStats.totalEliminated,
        eliminationRate: dependencyStats.eliminationRate,
        autoInstallable: dependencyStats.autoInstallableCount,
        packageManager: dependencyStats.activePackageManager
      }
    };
  }

  // Private helper methods

  /**
   * Convert friction points to actionable UI items
   */
  private async convertToActionableItems(result: ProtocolResult): Promise<ActionableItem[]> {
    const actionableItems: ActionableItem[] = [];
    
    // Process each detector result
    for (const detectorResult of result.detectorResults) {
      const detector = this.protocol.getDetectors().find(d => d.getName() === detectorResult.detectorName);
      if (!detector) continue;

      const frictionPoints = detector.getHistory();
      
      for (const point of frictionPoints) {
        const actionableItem = await this.convertFrictionPointToAction(point, detectorResult.detectorName);
        if (actionableItem) {
          actionableItems.push(actionableItem);
        }
      }
    }

    return actionableItems;
  }

  /**
   * Convert a single friction point to an actionable item
   */
  private async convertFrictionPointToAction(
    point: FrictionPoint, 
    detectorName: string
  ): Promise<ActionableItem | null> {
    // Handle dependency friction points
    if (detectorName === 'DependencyFrictionDetector' && this.isDependencyFrictionPoint(point)) {
      const depPoint = point as DependencyFrictionPoint;
      
      return {
        id: point.id,
        type: 'install',
        title: `Install ${depPoint.dependencyName}`,
        description: `Missing dependency: ${depPoint.dependencyName}`,
        severity: this.mapSeverityToUI(point.severity),
        autoExecutable: depPoint.autoInstallable,
        command: depPoint.installCommand,
        filePath: depPoint.filePath,
        line: depPoint.line,
        column: depPoint.column,
        metadata: {
          frictionType: 'dependency',
          confidence: point.metadata?.confidence || 0.8,
          estimatedTime: depPoint.autoInstallable ? 30 : 120, // seconds
          dependencies: [depPoint.dependencyName]
        }
      };
    }

    // Handle syntax friction points
    if (detectorName === 'SimpleSyntaxFrictionDetector') {
      return {
        id: point.id,
        type: 'fix',
        title: 'Fix syntax error',
        description: point.description,
        severity: this.mapSeverityToUI(point.severity),
        autoExecutable: point.eliminated || false,
        filePath: point.location?.file,
        line: point.location?.line,
        column: point.location?.column,
        metadata: {
          frictionType: 'syntax',
          confidence: point.metadata?.confidence || 0.8,
          estimatedTime: 10 // seconds
        }
      };
    }

    return null;
  }

  /**
   * Generate UI metadata from actionable items
   */
  private generateUIMetadata(actionableItems: ActionableItem[], startTime: number): UIMetadata {
    const categories = {
      syntax: 0,
      dependencies: 0,
      performance: 0,
      architecture: 0
    };

    let autoExecutableActions = 0;
    let highPriorityActions = 0;
    let estimatedTotalTime = 0;

    for (const item of actionableItems) {
      if (item.autoExecutable) autoExecutableActions++;
      if (item.severity === 'high') highPriorityActions++;
      estimatedTotalTime += item.metadata.estimatedTime;

      // Categorize
      switch (item.metadata.frictionType) {
        case 'syntax':
          categories.syntax++;
          break;
        case 'dependency':
          categories.dependencies++;
          break;
        case 'performance':
          categories.performance++;
          break;
        case 'architecture':
          categories.architecture++;
          break;
      }
    }

    return {
      totalActions: actionableItems.length,
      autoExecutableActions,
      highPriorityActions,
      estimatedTotalTime,
      lastUpdated: Date.now(),
      categories
    };
  }

  /**
   * Map numeric severity to UI severity
   */
  private mapSeverityToUI(severity: number): 'low' | 'medium' | 'high' {
    if (severity >= 0.7) return 'high';
    if (severity >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Type guard for dependency friction points
   */
  private isDependencyFrictionPoint(point: FrictionPoint): point is DependencyFrictionPoint {
    return 'dependencyName' in point && 'autoInstallable' in point;
  }

  /**
   * Find action by ID in recent results
   */
  private async findActionById(actionId: string): Promise<ActionableItem | null> {
    // In a real implementation, would maintain a cache of recent actions
    // For now, we'll simulate finding the action
    const mockAction: ActionableItem = {
      id: actionId,
      type: 'install',
      title: 'Mock Action',
      description: 'Mock action for testing',
      severity: 'medium',
      autoExecutable: true,
      metadata: {
        frictionType: 'dependency',
        confidence: 0.8,
        estimatedTime: 30
      }
    };
    
    return mockAction;
  }

  /**
   * Execute install action
   */
  private async executeInstallAction(action: ActionableItem): Promise<boolean> {
    console.log(`🔧 Executing install action: ${action.title}`);
    
    if (action.command) {
      console.log(`   Command: ${action.command}`);
    }
    
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Install action completed: ${action.title}`);
    return true;
  }

  /**
   * Execute update action
   */
  private async executeUpdateAction(action: ActionableItem): Promise<boolean> {
    console.log(`🔄 Executing update action: ${action.title}`);
    
    // Simulate update
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`✅ Update action completed: ${action.title}`);
    return true;
  }

  /**
   * Execute fix action
   */
  private async executeFixAction(action: ActionableItem): Promise<boolean> {
    console.log(`🔧 Executing fix action: ${action.title}`);
    
    // Simulate fix
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`✅ Fix action completed: ${action.title}`);
    return true;
  }

  /**
   * Execute refactor action
   */
  private async executeRefactorAction(action: ActionableItem): Promise<boolean> {
    console.log(`♻️ Executing refactor action: ${action.title}`);
    
    // Simulate refactor
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Refactor action completed: ${action.title}`);
    return true;
  }
}

/**
 * Context for integrated friction detection
 */
export interface IntegratedContext {
  filePath?: string;
  content?: string;
  checkPackageJson?: boolean;
  workspaceRoot?: string;
  language?: string;
}

/**
 * Result of action execution
 */
export interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  duration: number;
  message?: string;
  error?: string;
}

/**
 * UI statistics interface
 */
export interface UIStats {
  overall: {
    totalDetected: number;
    totalEliminated: number;
    eliminationRate: number;
    averageExecutionTime: number;
  };
  syntax: {
    detected: number;
    eliminated: number;
    eliminationRate: number;
  };
  dependencies: {
    detected: number;
    eliminated: number;
    eliminationRate: number;
    autoInstallable: number;
    packageManager: string;
  };
}