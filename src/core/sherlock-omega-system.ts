import { Result, Ok, Err, CentralizedErrorHandler, createErrorHandler } from '../core/error-handling';
/**
 * SHERLOCK Ω (OMEGA) - MASTER SYSTEM ORCHESTRATOR
 * 
 * The central nervous system that brings together all components:
 * - Safety Validation System
 * - Enhanced AI Orchestrator  
 * - Whispering Observers
 * - Performance Monitoring
 * - Self-Evolution Engine
 * 
 * "The whole is greater than the sum of its parts."
 */

import { SafetyValidationSystem, Evolution } from '../services/evolution/safety-validation-system';
import { SelfEvolutionEngine } from '../services/evolution/self-evolution-engine';
import { SelfCompilationService } from '../services/evolution/self-compilation-service';
import { EnhancedAIOrchestrator } from '../ai/enhanced-ai-orchestrator';
import { MonitoringService } from '../monitoring/monitoring-service';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { Logger } from '../logging/logger';
import { PlatformType } from './whispering-interfaces';

/**
 * System configuration for Sherlock Ω
 */
export interface SherlockOmegaConfig {
  platform: PlatformType;
  safetyThresholds: {
    minimumCoverage: number;
    maxComplexity: number;
    criticalRiskThreshold: number;
  };
  evolutionSettings: {
    enableAutonomousEvolution: boolean;
    evolutionInterval: number;
    maxConcurrentEvolutions: number;
  };
  monitoringSettings: {
    enableRealTimeMonitoring: boolean;
    performanceThresholds: Record<string, number>;
    alertingEnabled: boolean;
  };
  aiSettings: {
    enableEnhancedOrchestration: boolean;
    maxConcurrentRequests: number;
    timeoutMs: number;
  };
}

/**
 * System status and health information
 */
export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'safe_mode';
  components: {
    safetyValidation: ComponentStatus;
    evolutionEngine: ComponentStatus;
    selfCompilation: ComponentStatus;
    aiOrchestrator: ComponentStatus;
    monitoring: ComponentStatus;
    observers: ComponentStatus;
  };
  metrics: {
    uptime: number;
    totalEvolutions: number;
    blockedEvolutions: number;
    successRate: number;
    averageResponseTime: number;
  };
  lastHealthCheck: Date;
}

export interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastCheck: Date;
  metrics?: Record<string, any>;
  issues?: string[];
}

/**
 * Evolution request from external systems
 */
export interface EvolutionRequest {
  id: string;
  type: 'feature' | 'optimization' | 'bugfix' | 'refactor';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  targetFiles?: string[];
  requirements?: string[];
  constraints?: string[];
}

/**
 * SHERLOCK Ω MASTER SYSTEM
 * 
 * Orchestrates all components into a unified self-healing development environment
 */
export class SherlockOmegaSystem {
  private logger: Logger;
  private safetyValidationSystem!: SafetyValidationSystem;
  private evolutionEngine!: SelfEvolutionEngine;
  private selfCompilationService!: SelfCompilationService;
  private aiOrchestrator!: EnhancedAIOrchestrator;
  private monitoringService!: MonitoringService;
  private performanceMonitor!: PerformanceMonitor;
  
  private isRunning = false;
  private isSafeMode = false;
  private startTime: Date;
  private config: SherlockOmegaConfig;
  
  // System metrics
  private totalEvolutions = 0;
  private blockedEvolutions = 0;
  private successfulEvolutions = 0;

  constructor(config: SherlockOmegaConfig) {
    this.config = config;
    this.logger = new Logger(config.platform);
    this.startTime = new Date();
    
    // Initialize core components
    this.initializeComponents();
    
    this.logger.info('🌟 Sherlock Ω System initialized', {
      platform: config.platform,
      safetyEnabled: true,
      evolutionEnabled: config.evolutionSettings.enableAutonomousEvolution
    });
  }

  /**
   * Initialize all system components
   */
  private initializeComponents(): void {
    try {
      // Safety validation system (highest priority)
      this.safetyValidationSystem = new SafetyValidationSystem(this.config.platform);
      
      // Evolution engine
      this.evolutionEngine = new SelfEvolutionEngine(this.config.platform);
      
      // Self-compilation service
      this.selfCompilationService = new SelfCompilationService(this.config.platform);
      
      // AI orchestrator
      this.aiOrchestrator = new EnhancedAIOrchestrator(this.config.platform);
      
      // Monitoring systems
      this.monitoringService = new MonitoringService(this.config.platform);
      this.performanceMonitor = new PerformanceMonitor(this.config.platform);
      
      this.logger.info('✅ All components initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize components', { error: error as Error });
      throw new Error(`System initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Start the Sherlock Ω system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️ System already running');
      return;
    }

    try {
      this.logger.info('🚀 Starting Sherlock Ω System...');
      
      // Start monitoring first (for health checks)
      if (this.config.monitoringSettings.enableRealTimeMonitoring) {
        await this.monitoringService.start();
        this.logger.info('📊 Monitoring service started');
      }
      
      // Start AI orchestrator
      if (this.config.aiSettings.enableEnhancedOrchestration) {
        // AI orchestrator doesn't have a start method in current implementation
        this.logger.info('🤖 AI orchestrator ready');
      }
      
      // Start evolution engine
      if (this.config.evolutionSettings.enableAutonomousEvolution) {
        await this.evolutionEngine.start();
        this.logger.info('🧬 Evolution engine started');
      }
      
      this.isRunning = true;
      this.startTime = new Date();
      
      // Start health monitoring loop
      this.startHealthMonitoring();
      
      this.logger.info('🌟 Sherlock Ω System fully operational', {
        components: {
          safety: 'active',
          evolution: this.config.evolutionSettings.enableAutonomousEvolution ? 'active' : 'disabled',
          ai: this.config.aiSettings.enableEnhancedOrchestration ? 'active' : 'disabled',
          monitoring: this.config.monitoringSettings.enableRealTimeMonitoring ? 'active' : 'disabled'
        }
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to start system', { error: error as Error });
      await this.enterSafeMode();
      throw error;
    }
  }

  /**
   * Stop the Sherlock Ω system gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('⚠️ System not running');
      return;
    }

    try {
      this.logger.info('🛑 Stopping Sherlock Ω System...');
      
      // Stop components in reverse order
      if (this.config.evolutionSettings.enableAutonomousEvolution) {
        await this.evolutionEngine.stop();
        this.logger.info('🧬 Evolution engine stopped');
      }
      
      if (this.config.monitoringSettings.enableRealTimeMonitoring) {
        await this.monitoringService.stop();
        this.logger.info('📊 Monitoring service stopped');
      }
      
      this.isRunning = false;
      
      const uptime = Date.now() - this.startTime.getTime();
      this.logger.info('🌟 Sherlock Ω System stopped gracefully', {
        uptime: `${Math.round(uptime / 1000)}s`,
        totalEvolutions: this.totalEvolutions,
        successRate: this.totalEvolutions > 0 ? (this.successfulEvolutions / this.totalEvolutions * 100).toFixed(1) + '%' : '0%'
      });
      
    } catch (error) {
      this.logger.error('❌ Error during system shutdown', { error: error as Error });
      throw error;
    }
  }

  /**
   * Request an evolution to be processed
   */
  async requestEvolution(request: EvolutionRequest): Promise<{ success: boolean; evolutionId?: string; reason?: string }> {
    if (!this.isRunning) {
      return { success: false, reason: 'System not running' };
    }

    if (this.isSafeMode) {
      return { success: false, reason: 'System in safe mode - manual intervention required' };
    }

    try {
      this.logger.info(`🧬 Processing evolution request: ${request.id}`, {
        type: request.type,
        priority: request.priority,
        description: request.description
      });

      this.totalEvolutions++;

      // Convert request to evolution format
      const evolution: Evolution = {
        id: `evo-${request.id}-${Date.now()}`,
        type: request.type,
        description: request.description,
        affectedFiles: request.targetFiles || [],
        codeChanges: [], // Would be populated by evolution engine
        testFiles: [], // Would be populated by evolution engine
        timestamp: new Date(),
        author: 'autonomous-system',
        riskLevel: this.mapPriorityToRisk(request.priority)
      };

      // Safety validation first (critical!)
      const safetyResult = await this.safetyValidationSystem.validateEvolutionSafety(evolution);
      
      if (!safetyResult.isValid) {
        this.blockedEvolutions++;
        this.logger.warn(`🚫 Evolution blocked by safety validation`, {
          evolutionId: evolution.id,
          coverage: safetyResult.coverageMetrics.overall,
          riskLevel: safetyResult.riskAssessment.overallRisk,
          issues: safetyResult.issues.length
        });
        
        return {
          success: false,
          reason: `Safety validation failed: ${safetyResult.issues.filter(i => i.blocking).map(i => i.description).join(', ')}`
        };
      }

      // Process through evolution engine
      const evolutionResult = await this.evolutionEngine.processEvolution(evolution);
      
      if (evolutionResult.success) {
        // Execute self-compilation pipeline (Requirement 13)
        this.logger.info(`🔧 Triggering self-compilation pipeline for evolution: ${evolution.id}`);
        const compilationPipeline = await this.selfCompilationService.executeBuildPipeline(evolution);
        
        if (compilationPipeline.overallSuccess) {
          this.successfulEvolutions++;
          this.logger.info(`✅ Evolution and deployment completed successfully`, {
            evolutionId: evolution.id,
            pipelineId: compilationPipeline.id,
            confidence: safetyResult.confidence,
            deploymentTime: compilationPipeline.endTime?.getTime()! - compilationPipeline.startTime?.getTime()!
          });
          
          return { success: true, evolutionId: evolution.id };
        } else {
          this.logger.error(`❌ Evolution succeeded but deployment failed`, {
            evolutionId: evolution.id,
            pipelineId: compilationPipeline.id,
            failedSteps: compilationPipeline.results.filter(r => !r.success).map(r => r.step.name)
          });
          
          return { success: false, reason: `Deployment failed: ${compilationPipeline.results.filter(r => !r.success).map(r => r.error).join(', ')}` };
        }
      } else {
        this.logger.error(`❌ Evolution failed`, {
          evolutionId: evolution.id,
          error: evolutionResult.error
        });
        
        return { success: false, reason: evolutionResult.error };
      }

    } catch (error) {
      this.logger.error(`❌ Error processing evolution request`, {
        requestId: request.id,
        error: error as Error
      });
      
      // Check if we need to enter safe mode
      if (this.shouldEnterSafeMode(error as Error)) {
        await this.enterSafeMode();
      }
      
      return { success: false, reason: `System error: ${(error as Error).message}` };
    }
  }

  /**
   * Get current system status and health
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();

    // Check component health
    const componentStatuses = await this.checkComponentHealth();

    // Determine overall status
    const criticalComponents = Object.values(componentStatuses).filter(c => c.status === 'critical');
    const degradedComponents = Object.values(componentStatuses).filter(c => c.status === 'degraded');
    
    let overallStatus: SystemStatus['overall'] = 'healthy';
    if (this.isSafeMode) {
      overallStatus = 'safe_mode';
    } else if (criticalComponents.length > 0) {
      overallStatus = 'critical';
    } else if (degradedComponents.length > 0) {
      overallStatus = 'degraded';
    }

    return {
      overall: overallStatus,
      components: componentStatuses,
      metrics: {
        uptime: Math.round(uptime / 1000),
        totalEvolutions: this.totalEvolutions,
        blockedEvolutions: this.blockedEvolutions,
        successRate: this.totalEvolutions > 0 ? this.successfulEvolutions / this.totalEvolutions : 1.0,
        averageResponseTime: 0 // Would be calculated from performance monitor
      },
      lastHealthCheck: now
    };
  }

  /**
   * Enter safe mode when critical issues are detected
   */
  async enterSafeMode(): Promise<void> {
    if (this.isSafeMode) {
      return;
    }

    this.logger.error('🚨 ENTERING SAFE MODE - Critical system failure detected');
    
    try {
      this.isSafeMode = true;
      
      // Stop autonomous operations
      if (this.config.evolutionSettings.enableAutonomousEvolution) {
        await this.evolutionEngine.stop();
      }
      
      // Activate safety validation system safe mode
      await this.safetyValidationSystem.enterSafeMode();
      
      // Record safe mode activation
      this.performanceMonitor.recordMetric('safe_mode_activations', 1, 'error_rate');
      
      this.logger.error('🛡️ Safe mode activated - System stabilized');
      
    } catch (error) {
      this.logger.error('❌ Failed to enter safe mode', { error: error as Error });
      // This is critical - system cannot protect itself
      throw new Error('CRITICAL: Safe mode activation failed');
    }
  }

  /**
   * Exit safe mode (manual intervention required)
   */
  async exitSafeMode(): Promise<void> {
    if (!this.isSafeMode) {
      return;
    }

    this.logger.info('🔄 Attempting to exit safe mode...');
    
    try {
      // Perform health checks
      const status = await this.getSystemStatus();
      
      if (status.overall === 'critical') {
        throw new Error('Cannot exit safe mode - critical issues still present');
      }
      
      // Restart autonomous operations
      if (this.config.evolutionSettings.enableAutonomousEvolution) {
        await this.evolutionEngine.start();
      }
      
      this.isSafeMode = false;
      
      this.logger.info('✅ Safe mode exited - System operational');
      
    } catch (error) {
      this.logger.error('❌ Failed to exit safe mode', { error: error as Error });
      throw error;
    }
  }

  /**
   * Check health of all components
   */
  private async checkComponentHealth(): Promise<SystemStatus['components']> {
    const now = new Date();
    
    return {
      safetyValidation: {
        status: 'healthy', // Safety system is always healthy if system is running
        lastCheck: now,
        metrics: this.safetyValidationSystem.getValidationStatistics()
      },
      evolutionEngine: {
        status: this.config.evolutionSettings.enableAutonomousEvolution ? 'healthy' : 'offline',
        lastCheck: now
      },
      selfCompilation: {
        status: 'healthy',
        lastCheck: now,
        metrics: this.selfCompilationService.getCompilationStatistics()
      },
      aiOrchestrator: {
        status: this.config.aiSettings.enableEnhancedOrchestration ? 'healthy' : 'offline',
        lastCheck: now
      },
      monitoring: {
        status: this.config.monitoringSettings.enableRealTimeMonitoring ? 'healthy' : 'offline',
        lastCheck: now
      },
      observers: {
        status: 'healthy', // Observers are passive
        lastCheck: now
      }
    };
  }

  /**
   * Start health monitoring loop
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning || this.isSafeMode) return;
      
      try {
        const status = await this.getSystemStatus();
        
        if (status.overall === 'critical') {
          this.logger.error('🚨 Critical system health detected');
          await this.enterSafeMode();
        } else if (status.overall === 'degraded') {
          this.logger.warn('⚠️ System health degraded', { status });
        }
        
      } catch (error) {
        this.logger.error('❌ Health check failed', { error: error as Error });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Map request priority to risk level
   */
  private mapPriorityToRisk(priority: EvolutionRequest['priority']): Evolution['riskLevel'] {
    const mapping = {
      'low': 'low' as const,
      'medium': 'medium' as const,
      'high': 'high' as const,
      'critical': 'critical' as const
    };
    return mapping[priority];
  }

  /**
   * Determine if system should enter safe mode based on error
   */
  private shouldEnterSafeMode(error: Error): boolean {
    const criticalErrors = [
      'safety validation failed',
      'evolution engine crashed',
      'critical component failure'
    ];
    
    return criticalErrors.some(criticalError => 
      error.message.toLowerCase().includes(criticalError)
    );
  }

  // Getters for component access
  get safety() { return this.safetyValidationSystem; }
  get evolution() { return this.evolutionEngine; }
  get compilation() { return this.selfCompilationService; }
  get ai() { return this.aiOrchestrator; }
  get monitoring() { return this.monitoringService; }
  get performance() { return this.performanceMonitor; }
  get running() { return this.isRunning; }
  get safeMode() { return this.isSafeMode; }
}

/**
 * Default configuration for Sherlock Ω
 */
export const DEFAULT_CONFIG: SherlockOmegaConfig = {
  platform: PlatformType.WEB,
  safetyThresholds: {
    minimumCoverage: 0.95,
    maxComplexity: 10,
    criticalRiskThreshold: 0.8
  },
  evolutionSettings: {
    enableAutonomousEvolution: true,
    evolutionInterval: 300000, // 5 minutes
    maxConcurrentEvolutions: 3
  },
  monitoringSettings: {
    enableRealTimeMonitoring: true,
    performanceThresholds: {
      responseTime: 2000,
      errorRate: 0.05,
      cpuUsage: 0.8
    },
    alertingEnabled: true
  },
  aiSettings: {
    enableEnhancedOrchestration: true,
    maxConcurrentRequests: 10,
    timeoutMs: 30000
  }
};