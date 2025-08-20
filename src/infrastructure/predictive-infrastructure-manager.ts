/**
 * Predictive Infrastructure Manager - Phase 2 Enhancement
 * Self-healing infrastructure with predictive monitoring and automatic recovery
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../logging/logger';
import { InfrastructureManager, InfrastructureStatus } from './infrastructure-manager';

const execAsync = promisify(exec);

export interface PredictiveMetrics {
  dockerNetworkHealth: number; // 0-1 score
  mongoConnectionStability: number; // 0-1 score
  redisPerformance: number; // 0-1 score
  systemResourceUsage: number; // 0-1 score
  predictedFailureRisk: number; // 0-1 score
  lastHealthCheck: Date;
  healthTrend: 'improving' | 'stable' | 'degrading';
}

export interface SelfHealingAction {
  type: 'restart_service' | 'clear_cache' | 'network_reset' | 'resource_cleanup';
  service: 'docker' | 'mongodb' | 'redis' | 'system';
  reason: string;
  confidence: number; // 0-1 score
  estimatedImpact: 'low' | 'medium' | 'high';
  executedAt?: Date;
  success?: boolean;
}

export class PredictiveInfrastructureManager extends InfrastructureManager {
  private healthHistory: PredictiveMetrics[] = [];
  private healingActions: SelfHealingAction[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly PREDICTION_WINDOW = 5; // Number of health checks to analyze

  constructor(logger: Logger, mongoUri?: string) {
    super(logger, mongoUri);
  }

  /**
   * Enhanced initialization with predictive monitoring
   */
  async initializeWithPredictiveMonitoring(): Promise<InfrastructureStatus> {
    console.log(chalk.blue('🔮 Initializing Predictive Infrastructure Manager...\n'));

    // Run base initialization
    const status = await this.initialize();

    // Start predictive monitoring
    await this.startPredictiveMonitoring();

    // Perform initial health prediction
    const metrics = await this.collectPredictiveMetrics();
    this.healthHistory.push(metrics);

    console.log(chalk.green('🧠 Predictive monitoring active - self-healing enabled\n'));

    return status;
  }

  /**
   * Start continuous predictive monitoring
   */
  private async startPredictiveMonitoring(): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectPredictiveMetrics();
        this.healthHistory.push(metrics);

        // Keep only recent history
        if (this.healthHistory.length > 20) {
          this.healthHistory = this.healthHistory.slice(-20);
        }

        // Predict and prevent failures
        await this.predictAndPreventFailures(metrics);

      } catch (error) {
        console.log(chalk.yellow('⚠️ Predictive monitoring error:'), error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Collect comprehensive predictive metrics
   */
  private async collectPredictiveMetrics(): Promise<PredictiveMetrics> {
    const metrics: PredictiveMetrics = {
      dockerNetworkHealth: await this.assessDockerNetworkHealth(),
      mongoConnectionStability: await this.assessMongoStability(),
      redisPerformance: await this.assessRedisPerformance(),
      systemResourceUsage: await this.assessSystemResources(),
      predictedFailureRisk: 0,
      lastHealthCheck: new Date(),
      healthTrend: 'stable'
    };

    // Calculate predicted failure risk
    metrics.predictedFailureRisk = this.calculateFailureRisk(metrics);

    // Determine health trend
    metrics.healthTrend = this.calculateHealthTrend();

    return metrics;
  }

  /**
   * Assess Docker network health
   */
  private async assessDockerNetworkHealth(): Promise<number> {
    try {
      // Check Docker daemon responsiveness
      const start = Date.now();
      await execAsync('docker info', { timeout: 5000 });
      const responseTime = Date.now() - start;

      // Check network connectivity
      await execAsync('docker network ls', { timeout: 3000 });

      // Score based on response time (lower is better)
      const timeScore = Math.max(0, 1 - (responseTime / 5000));
      
      return Math.min(1, timeScore + 0.2); // Bonus for successful execution

    } catch (error) {
      console.log(chalk.yellow('⚠️ Docker network health check failed'));
      return 0.1; // Very low but not zero (might recover)
    }
  }

  /**
   * Assess MongoDB connection stability
   */
  private async assessMongoStability(): Promise<number> {
    try {
      const start = Date.now();
      
      // Test connection with timeout
      const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
      await client.connect();
      
      // Test basic operation
      const db = client.db('sherlock_test');
      await db.admin().ping();
      
      const responseTime = Date.now() - start;
      await client.close();

      // Score based on response time and success
      return Math.max(0.1, 1 - (responseTime / 2000));

    } catch (error) {
      return 0.1; // Connection issues but might recover
    }
  }

  /**
   * Assess Redis performance
   */
  private async assessRedisPerformance(): Promise<number> {
    try {
      const start = Date.now();
      
      // Test Redis ping
      await execAsync('docker-compose exec -T redis redis-cli ping', { timeout: 3000 });
      
      const responseTime = Date.now() - start;

      // Score based on response time
      return Math.max(0.1, 1 - (responseTime / 1000));

    } catch (error) {
      return 0.1; // Redis issues but might recover
    }
  }

  /**
   * Assess system resource usage
   */
  private async assessSystemResources(): Promise<number> {
    try {
      // Check available memory and CPU
      const { stdout } = await execAsync('docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}"');
      
      // Parse CPU and memory usage (simplified)
      const lines = stdout.trim().split('\n').slice(1); // Skip header
      let totalCpu = 0;
      let containerCount = 0;

      for (const line of lines) {
        const [cpu] = line.split('\t');
        if (cpu && cpu !== 'CPUPerc') {
          totalCpu += parseFloat(cpu.replace('%', ''));
          containerCount++;
        }
      }

      const avgCpu = containerCount > 0 ? totalCpu / containerCount : 0;
      
      // Score based on CPU usage (lower usage = better score)
      return Math.max(0.1, 1 - (avgCpu / 100));

    } catch (error) {
      return 0.5; // Neutral score if can't assess
    }
  }

  /**
   * Calculate predicted failure risk based on metrics
   */
  private calculateFailureRisk(metrics: PredictiveMetrics): number {
    const weights = {
      dockerNetworkHealth: 0.3,
      mongoConnectionStability: 0.25,
      redisPerformance: 0.2,
      systemResourceUsage: 0.25
    };

    // Calculate weighted health score
    const healthScore = 
      (metrics.dockerNetworkHealth * weights.dockerNetworkHealth) +
      (metrics.mongoConnectionStability * weights.mongoConnectionStability) +
      (metrics.redisPerformance * weights.redisPerformance) +
      (metrics.systemResourceUsage * weights.systemResourceUsage);

    // Risk is inverse of health (1 - health)
    return Math.max(0, 1 - healthScore);
  }

  /**
   * Calculate health trend from recent history
   */
  private calculateHealthTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.healthHistory.length < 3) return 'stable';

    const recent = this.healthHistory.slice(-3);
    const scores = recent.map(m => 1 - m.predictedFailureRisk);

    const trend = scores[2] - scores[0];

    if (trend > 0.1) return 'improving';
    if (trend < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Predict and prevent failures with self-healing actions
   */
  private async predictAndPreventFailures(metrics: PredictiveMetrics): Promise<void> {
    const riskThreshold = 0.7; // Take action if risk > 70%

    if (metrics.predictedFailureRisk > riskThreshold) {
      console.log(chalk.yellow(`🔮 High failure risk detected: ${(metrics.predictedFailureRisk * 100).toFixed(1)}%`));

      // Determine appropriate healing actions
      const actions = this.recommendHealingActions(metrics);

      for (const action of actions) {
        if (action.confidence > 0.6) { // Only execute high-confidence actions
          await this.executeHealingAction(action);
        }
      }
    }

    // Log health status periodically
    if (this.healthHistory.length % 10 === 0) { // Every 10 checks (5 minutes)
      this.logHealthSummary(metrics);
    }
  }

  /**
   * Recommend healing actions based on metrics
   */
  private recommendHealingActions(metrics: PredictiveMetrics): SelfHealingAction[] {
    const actions: SelfHealingAction[] = [];

    // Docker network issues
    if (metrics.dockerNetworkHealth < 0.3) {
      actions.push({
        type: 'network_reset',
        service: 'docker',
        reason: 'Docker network health degraded',
        confidence: 0.8,
        estimatedImpact: 'medium'
      });
    }

    // MongoDB connection issues
    if (metrics.mongoConnectionStability < 0.3) {
      actions.push({
        type: 'restart_service',
        service: 'mongodb',
        reason: 'MongoDB connection unstable',
        confidence: 0.7,
        estimatedImpact: 'low'
      });
    }

    // Redis performance issues
    if (metrics.redisPerformance < 0.3) {
      actions.push({
        type: 'clear_cache',
        service: 'redis',
        reason: 'Redis performance degraded',
        confidence: 0.6,
        estimatedImpact: 'low'
      });
    }

    // System resource issues
    if (metrics.systemResourceUsage < 0.2) {
      actions.push({
        type: 'resource_cleanup',
        service: 'system',
        reason: 'High resource usage detected',
        confidence: 0.5,
        estimatedImpact: 'high'
      });
    }

    return actions;
  }

  /**
   * Execute a healing action
   */
  private async executeHealingAction(action: SelfHealingAction): Promise<void> {
    console.log(chalk.blue(`🔧 Executing healing action: ${action.type} for ${action.service}`));
    console.log(chalk.gray(`   Reason: ${action.reason}`));

    const startTime = Date.now();
    let success = false;

    try {
      switch (action.type) {
        case 'network_reset':
          await this.resetDockerNetwork();
          break;
        case 'restart_service':
          await this.restartService(action.service);
          break;
        case 'clear_cache':
          await this.clearRedisCache();
          break;
        case 'resource_cleanup':
          await this.cleanupResources();
          break;
      }

      success = true;
      console.log(chalk.green(`✅ Healing action completed successfully`));

    } catch (error) {
      console.log(chalk.red(`❌ Healing action failed: ${error}`));
    }

    // Record the action
    action.executedAt = new Date();
    action.success = success;
    this.healingActions.push(action);

    // Keep only recent actions
    if (this.healingActions.length > 50) {
      this.healingActions = this.healingActions.slice(-50);
    }
  }

  /**
   * Reset Docker network
   */
  private async resetDockerNetwork(): Promise<void> {
    await execAsync('docker network prune -f');
    await execAsync('docker-compose down');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    await execAsync('docker-compose up -d');
  }

  /**
   * Restart a specific service
   */
  private async restartService(service: string): Promise<void> {
    if (service === 'mongodb' || service === 'redis') {
      await execAsync(`docker-compose restart ${service}`);
    }
  }

  /**
   * Clear Redis cache
   */
  private async clearRedisCache(): Promise<void> {
    await execAsync('docker-compose exec -T redis redis-cli FLUSHALL');
  }

  /**
   * Cleanup system resources
   */
  private async cleanupResources(): Promise<void> {
    await execAsync('docker system prune -f');
    await execAsync('docker volume prune -f');
  }

  /**
   * Log health summary
   */
  private logHealthSummary(metrics: PredictiveMetrics): void {
    console.log(chalk.blue('\n🏥 Infrastructure Health Summary'));
    console.log(chalk.gray('================================'));
    console.log(`Docker Network: ${this.formatHealthScore(metrics.dockerNetworkHealth)}`);
    console.log(`MongoDB: ${this.formatHealthScore(metrics.mongoConnectionStability)}`);
    console.log(`Redis: ${this.formatHealthScore(metrics.redisPerformance)}`);
    console.log(`System Resources: ${this.formatHealthScore(metrics.systemResourceUsage)}`);
    console.log(`Failure Risk: ${this.formatRiskScore(metrics.predictedFailureRisk)}`);
    console.log(`Trend: ${this.formatTrend(metrics.healthTrend)}`);
    console.log(chalk.gray('================================\n'));
  }

  /**
   * Format health score for display
   */
  private formatHealthScore(score: number): string {
    const percentage = (score * 100).toFixed(1);
    if (score > 0.8) return chalk.green(`${percentage}% ✅`);
    if (score > 0.5) return chalk.yellow(`${percentage}% ⚠️`);
    return chalk.red(`${percentage}% ❌`);
  }

  /**
   * Format risk score for display
   */
  private formatRiskScore(risk: number): string {
    const percentage = (risk * 100).toFixed(1);
    if (risk < 0.3) return chalk.green(`${percentage}% ✅`);
    if (risk < 0.7) return chalk.yellow(`${percentage}% ⚠️`);
    return chalk.red(`${percentage}% ❌`);
  }

  /**
   * Format trend for display
   */
  private formatTrend(trend: 'improving' | 'stable' | 'degrading'): string {
    switch (trend) {
      case 'improving': return chalk.green('📈 Improving');
      case 'stable': return chalk.blue('📊 Stable');
      case 'degrading': return chalk.red('📉 Degrading');
    }
  }

  /**
   * Get predictive metrics for external monitoring
   */
  getHealthMetrics(): PredictiveMetrics | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Get healing action history
   */
  getHealingHistory(): SelfHealingAction[] {
    return [...this.healingActions];
  }

  /**
   * Stop predictive monitoring
   */
  stopPredictiveMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log(chalk.blue('🔮 Predictive monitoring stopped'));
    }
  }
}