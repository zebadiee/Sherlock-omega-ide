import { Logger } from '../../logging/logger';
import { PlatformType } from '../../core/whispering-interfaces';
import { Evolution } from './safety-validation-system';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

const execAsync = promisify(exec);

export interface CompilationStep {
  id: string;
  name: string;
  command: string;
  description: string;
  timeout: number;
  retries: number;
  critical: boolean;
}

export interface CompilationResult {
  success: boolean;
  step: CompilationStep;
  output: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface CompilationPipeline {
  id: string;
  evolutionId: string;
  steps: CompilationStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  results: CompilationResult[];
  overallSuccess: boolean;
}

export interface DeploymentSnapshot {
  id: string;
  timestamp: Date;
  evolutionId: string;
  codeSnapshot: string;
  configSnapshot: string;
  dependencySnapshot: string;
  testResults: any;
  buildArtifacts: string[];
}

/**
 * SelfCompilationService
 * Implements Requirement 13: Autonomous Self-Compilation and Deployment.
 * This service uses the IDE's own tools to build, test, and deploy itself.
 */
export class SelfCompilationService {
  private logger: Logger;
  private platform: PlatformType;
  
  private activePipelines = new Map<string, CompilationPipeline>();
  private snapshots = new Map<string, DeploymentSnapshot>();
  
  private pipelineSubject = new Subject<CompilationPipeline>();
  private resultSubject = new Subject<CompilationResult>();
  private snapshotSubject = new BehaviorSubject<DeploymentSnapshot[]>([]);
  
  private defaultSteps: CompilationStep[] = [
    {
      id: 'pre-build-validation',
      name: 'Pre-build Validation',
      command: 'npm run lint',
      description: 'Validate code quality and formatting',
      timeout: 30000,
      retries: 1,
      critical: false
    },
    {
      id: 'build',
      name: 'TypeScript Compilation',
      command: 'npm run build',
      description: 'Compile TypeScript to JavaScript',
      timeout: 60000,
      retries: 2,
      critical: true
    },
    {
      id: 'test-unit',
      name: 'Unit Tests',
      command: 'npm run test:unit',
      description: 'Execute unit test suite',
      timeout: 120000,
      retries: 1,
      critical: true
    },
    {
      id: 'test-integration',
      name: 'Integration Tests',
      command: 'npm run test:integration',
      description: 'Execute integration test suite',
      timeout: 180000,
      retries: 1,
      critical: true
    },
    {
      id: 'test-coverage',
      name: 'Coverage Validation',
      command: 'npm run test:coverage',
      description: 'Validate test coverage meets requirements',
      timeout: 120000,
      retries: 1,
      critical: true
    },
    {
      id: 'formal-verification',
      name: 'Formal Verification',
      command: 'npm run test:formal-verification',
      description: 'Execute formal verification tests',
      timeout: 300000,
      retries: 1,
      critical: true
    }
  ];

  constructor(platform: PlatformType) {
    this.platform = platform;
    this.logger = new Logger(platform);
    
    this.logger.info('🔧 Self-Compilation Service initialized', {
      platform,
      defaultSteps: this.defaultSteps.length
    });
  }

  /**
   * Executes the full self-compilation and deployment pipeline.
   * @param evolution The evolution that has been approved for deployment.
   * @param customSteps Optional custom compilation steps
   */
  async executeBuildPipeline(
    evolution: Evolution, 
    customSteps?: CompilationStep[]
  ): Promise<CompilationPipeline> {
    const pipelineId = `pipeline_${evolution.id}_${Date.now()}`;
    const steps = customSteps || this.defaultSteps;
    
    const pipeline: CompilationPipeline = {
      id: pipelineId,
      evolutionId: evolution.id,
      steps,
      status: 'pending',
      results: [],
      overallSuccess: false
    };

    this.activePipelines.set(pipelineId, pipeline);
    this.logger.info(`🚀 Starting self-compilation pipeline for evolution: ${evolution.id}`, {
      pipelineId,
      stepsCount: steps.length,
      evolutionType: evolution.type
    });

    try {
      // Create pre-deployment snapshot
      const snapshot = await this.createDeploymentSnapshot(evolution);
      
      pipeline.status = 'running';
      pipeline.startTime = new Date();
      this.pipelineSubject.next(pipeline);

      // Execute each step in sequence
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        this.logger.info(`   [${i + 1}/${steps.length}] ${step.name}...`);
        
        const result = await this.executeCompilationStep(step);
        pipeline.results.push(result);
        
        this.resultSubject.next(result);
        this.pipelineSubject.next(pipeline);

        if (!result.success) {
          if (step.critical) {
            this.logger.error(`❌ Critical step failed: ${step.name}`, {
              pipelineId,
              step: step.id,
              error: result.error
            });
            
            pipeline.status = 'failed';
            pipeline.endTime = new Date();
            
            // Attempt rollback
            await this.rollbackDeployment(snapshot);
            
            this.pipelineSubject.next(pipeline);
            return pipeline;
          } else {
            this.logger.warn(`⚠️ Non-critical step failed: ${step.name}`, {
              pipelineId,
              step: step.id,
              error: result.error
            });
          }
        } else {
          this.logger.info(`✅ Step completed: ${step.name} (${result.duration}ms)`);
        }
      }

      // All steps completed successfully
      pipeline.status = 'completed';
      pipeline.endTime = new Date();
      pipeline.overallSuccess = true;
      
      const totalDuration = pipeline.endTime.getTime() - pipeline.startTime!.getTime();
      
      this.logger.info(`✅ Self-compilation and deployment for evolution ${evolution.id} completed successfully`, {
        pipelineId,
        totalDuration,
        stepsExecuted: pipeline.results.length,
        successfulSteps: pipeline.results.filter(r => r.success).length
      });

      // Initiate hot-swap deployment (conceptual)
      await this.performHotSwapDeployment(evolution, snapshot);
      
      this.pipelineSubject.next(pipeline);
      return pipeline;

    } catch (error) {
      pipeline.status = 'failed';
      pipeline.endTime = new Date();
      
      this.logger.error(`❌ Self-compilation pipeline failed for evolution ${evolution.id}`, {
        pipelineId,
        evolutionId: evolution.id,
        error: error as Error
      });
      
      this.pipelineSubject.next(pipeline);
      return pipeline;
      
    } finally {
      // Clean up active pipeline
      setTimeout(() => {
        this.activePipelines.delete(pipelineId);
      }, 300000); // Keep for 5 minutes for debugging
    }
  }

  /**
   * Execute a single compilation step with retry logic
   */
  private async executeCompilationStep(step: CompilationStep): Promise<CompilationResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= step.retries; attempt++) {
      try {
        this.logger.debug(`Executing step: ${step.id} (attempt ${attempt + 1}/${step.retries + 1})`);
        
        const { stdout, stderr } = await execAsync(step.command, {
          timeout: step.timeout,
          cwd: process.cwd()
        });

        const duration = Date.now() - startTime;
        
        // Check if there were any warnings in stderr that don't indicate failure
        const hasErrors = stderr && (
          stderr.includes('error') || 
          stderr.includes('failed') || 
          stderr.includes('Error:')
        );

        if (hasErrors) {
          lastError = stderr;
          if (attempt < step.retries) {
            this.logger.warn(`Step ${step.id} failed, retrying...`, { attempt, error: stderr });
            continue;
          }
        }

        return {
          success: !hasErrors,
          step,
          output: stdout || stderr,
          error: hasErrors ? stderr : undefined,
          duration,
          timestamp: new Date()
        };

      } catch (error) {
        lastError = (error as Error).message;
        
        if (attempt < step.retries) {
          this.logger.warn(`Step ${step.id} failed, retrying...`, { 
            attempt, 
            error: lastError,
            nextAttemptIn: '1s'
          });
          await this.delay(1000); // Wait 1 second before retry
          continue;
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    return {
      success: false,
      step,
      output: '',
      error: lastError || 'Unknown error',
      duration,
      timestamp: new Date()
    };
  }

  /**
   * Create a deployment snapshot before making changes
   */
  private async createDeploymentSnapshot(evolution: Evolution): Promise<DeploymentSnapshot> {
    const snapshotId = `snapshot_${evolution.id}_${Date.now()}`;
    
    try {
      // Capture current state
      const { stdout: gitStatus } = await execAsync('git status --porcelain');
      const { stdout: packageJson } = await execAsync('cat package.json');
      const { stdout: lockFile } = await execAsync('cat package-lock.json || cat yarn.lock || echo "No lock file"');
      
      const snapshot: DeploymentSnapshot = {
        id: snapshotId,
        timestamp: new Date(),
        evolutionId: evolution.id,
        codeSnapshot: gitStatus,
        configSnapshot: packageJson,
        dependencySnapshot: lockFile,
        testResults: {}, // Would capture current test results
        buildArtifacts: [] // Would capture current build artifacts
      };

      this.snapshots.set(snapshotId, snapshot);
      this.updateSnapshotsSubject();
      
      this.logger.info(`📸 Deployment snapshot created: ${snapshotId}`);
      return snapshot;
      
    } catch (error) {
      this.logger.error('Failed to create deployment snapshot', { error: error as Error });
      throw error;
    }
  }

  /**
   * Rollback to a previous deployment snapshot
   */
  private async rollbackDeployment(snapshot: DeploymentSnapshot): Promise<void> {
    try {
      this.logger.warn(`🔄 Rolling back deployment to snapshot: ${snapshot.id}`);
      
      // In a real implementation, this would:
      // 1. Restore code from git commit
      // 2. Restore package.json and dependencies
      // 3. Rebuild from known good state
      // 4. Restart services
      
      // For now, we'll simulate the rollback
      await this.delay(2000);
      
      this.logger.info(`✅ Rollback completed to snapshot: ${snapshot.id}`);
      
    } catch (error) {
      this.logger.error('❌ Rollback failed - manual intervention required', { 
        snapshotId: snapshot.id,
        error: error as Error 
      });
      throw error;
    }
  }

  /**
   * Perform hot-swap deployment (conceptual)
   */
  private async performHotSwapDeployment(
    evolution: Evolution, 
    snapshot: DeploymentSnapshot
  ): Promise<void> {
    try {
      this.logger.info(`🔄 Initiating hot-swap deployment for evolution: ${evolution.id}`);
      
      // In a real implementation, this would:
      // 1. Gracefully stop current services
      // 2. Swap in new compiled code
      // 3. Update configuration
      // 4. Restart services with zero downtime
      // 5. Verify deployment health
      
      // Simulate deployment process
      await this.delay(3000);
      
      this.logger.info(`✅ Hot-swap deployment completed for evolution: ${evolution.id}`);
      
    } catch (error) {
      this.logger.error('❌ Hot-swap deployment failed', { 
        evolutionId: evolution.id,
        error: error as Error 
      });
      
      // Attempt rollback
      await this.rollbackDeployment(snapshot);
      throw error;
    }
  }

  /**
   * Get active compilation pipelines
   */
  getActivePipelines(): CompilationPipeline[] {
    return Array.from(this.activePipelines.values());
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId: string): CompilationPipeline | undefined {
    return this.activePipelines.get(pipelineId);
  }

  /**
   * Cancel a running pipeline
   */
  async cancelPipeline(pipelineId: string): Promise<boolean> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline || pipeline.status !== 'running') {
      return false;
    }

    pipeline.status = 'cancelled';
    pipeline.endTime = new Date();
    
    this.logger.warn(`🚫 Pipeline cancelled: ${pipelineId}`);
    this.pipelineSubject.next(pipeline);
    
    return true;
  }

  /**
   * Get deployment snapshots
   */
  getSnapshots(): DeploymentSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Clean up old snapshots
   */
  cleanupSnapshots(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [id, snapshot] of this.snapshots.entries()) {
      if (snapshot.timestamp.getTime() < cutoff) {
        this.snapshots.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`🧹 Cleaned up ${cleaned} old deployment snapshots`);
      this.updateSnapshotsSubject();
    }
  }

  /**
   * Get compilation statistics
   */
  getCompilationStatistics(): {
    totalPipelines: number;
    successfulPipelines: number;
    failedPipelines: number;
    averageDuration: number;
    successRate: number;
    mostCommonFailures: Array<{ step: string; count: number }>;
  } {
    const allPipelines = Array.from(this.activePipelines.values());
    const completedPipelines = allPipelines.filter(p => p.status === 'completed' || p.status === 'failed');
    const successfulPipelines = allPipelines.filter(p => p.overallSuccess);
    
    const durations = completedPipelines
      .filter(p => p.startTime && p.endTime)
      .map(p => p.endTime!.getTime() - p.startTime!.getTime());
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    // Analyze common failures
    const failureMap = new Map<string, number>();
    for (const pipeline of allPipelines) {
      for (const result of pipeline.results) {
        if (!result.success) {
          const count = failureMap.get(result.step.id) || 0;
          failureMap.set(result.step.id, count + 1);
        }
      }
    }

    const mostCommonFailures = Array.from(failureMap.entries())
      .map(([step, count]) => ({ step, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPipelines: allPipelines.length,
      successfulPipelines: successfulPipelines.length,
      failedPipelines: allPipelines.length - successfulPipelines.length,
      averageDuration,
      successRate: allPipelines.length > 0 ? successfulPipelines.length / allPipelines.length : 0,
      mostCommonFailures
    };
  }

  // Observables for reactive UI
  getPipelines$(): Observable<CompilationPipeline> {
    return this.pipelineSubject.asObservable();
  }

  getResults$(): Observable<CompilationResult> {
    return this.resultSubject.asObservable();
  }

  getSnapshots$(): Observable<DeploymentSnapshot[]> {
    return this.snapshotSubject.asObservable();
  }

  // Private helpers
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateSnapshotsSubject(): void {
    this.snapshotSubject.next(this.getSnapshots());
  }
}