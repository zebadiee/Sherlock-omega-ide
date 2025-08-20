/**
 * Infrastructure Manager
 * Automated setup and management of MongoDB, Redis, and other services
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../logging/logger';

const execAsync = promisify(exec);

export interface InfrastructureStatus {
  mongodb: {
    running: boolean;
    connected: boolean;
    version?: string;
    error?: string;
  };
  redis: {
    running: boolean;
    connected: boolean;
    version?: string;
    error?: string;
  };
  docker: {
    available: boolean;
    version?: string;
    error?: string;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export class InfrastructureManager {
  private logger: Logger;
  private mongoClient: MongoClient;

  constructor(logger: Logger, mongoUri?: string) {
    this.logger = logger;
    this.mongoClient = new MongoClient(mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017');
  }

  /**
   * Initialize all infrastructure services
   */
  async initialize(): Promise<InfrastructureStatus> {
    console.log(chalk.blue('🏗️  Initializing Sherlock Ω Infrastructure...\n'));

    const status: InfrastructureStatus = {
      mongodb: { running: false, connected: false },
      redis: { running: false, connected: false },
      docker: { available: false },
      overall: 'unhealthy'
    };

    // Check Docker availability
    status.docker = await this.checkDocker();
    
    if (!status.docker.available) {
      console.log(chalk.red('❌ Docker is required but not available'));
      console.log(chalk.yellow('💡 Please install Docker Desktop and ensure it\'s running'));
      return status;
    }

    // Start services with Docker Compose
    await this.startServices();

    // Check service status
    status.mongodb = await this.checkMongoDB();
    status.redis = await this.checkRedis();

    // Determine overall health
    status.overall = this.calculateOverallHealth(status);

    // Display status
    this.displayStatus(status);

    return status;
  }

  /**
   * Check if Docker is available
   */
  private async checkDocker(): Promise<{ available: boolean; version?: string; error?: string }> {
    const spinner = ora('Checking Docker availability...').start();
    
    try {
      const { stdout } = await execAsync('docker --version');
      const version = stdout.trim();
      
      // Test Docker daemon
      await execAsync('docker info');
      
      spinner.succeed(chalk.green('✅ Docker is available'));
      return { available: true, version };
    } catch (error) {
      spinner.fail(chalk.red('❌ Docker not available'));
      return { 
        available: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Start all services using Docker Compose
   */
  private async startServices(): Promise<void> {
    const spinner = ora('Starting infrastructure services...').start();
    
    try {
      // Check if services are already running
      const { stdout } = await execAsync('docker-compose ps --services --filter status=running');
      const runningServices = stdout.trim().split('\n').filter(s => s);
      
      if (runningServices.includes('mongodb') && runningServices.includes('redis')) {
        spinner.succeed(chalk.green('✅ Services already running'));
        return;
      }

      // Start services
      spinner.text = 'Starting MongoDB and Redis...';
      await execAsync('docker-compose up -d');
      
      // Wait for services to be ready
      spinner.text = 'Waiting for services to be ready...';
      await this.waitForServices();
      
      spinner.succeed(chalk.green('✅ Infrastructure services started'));
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to start services'));
      console.log(chalk.yellow('💡 Try running: docker-compose up -d manually'));
      throw error;
    }
  }

  /**
   * Wait for services to be ready
   */
  private async waitForServices(maxRetries: number = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Check MongoDB health
        const mongoHealth = await execAsync('docker-compose exec -T mongodb mongosh --eval "db.adminCommand(\'ping\')" --quiet');
        
        // Check Redis health
        const redisHealth = await execAsync('docker-compose exec -T redis redis-cli ping');
        
        if (mongoHealth.stdout.includes('ok') && redisHealth.stdout.includes('PONG')) {
          return;
        }
      } catch (error) {
        // Services not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Services failed to become ready within timeout');
  }

  /**
   * Check MongoDB status
   */
  private async checkMongoDB(): Promise<{ running: boolean; connected: boolean; version?: string; error?: string }> {
    try {
      // Check if container is running
      const { stdout } = await execAsync('docker-compose ps mongodb');
      const running = stdout.includes('Up');
      
      if (!running) {
        return { running: false, connected: false, error: 'Container not running' };
      }

      // Test connection
      await this.mongoClient.connect();
      const adminDb = this.mongoClient.db('admin');
      const result = await adminDb.command({ ping: 1 });
      
      if (result.ok === 1) {
        // Get version
        const buildInfo = await adminDb.command({ buildInfo: 1 });
        return { 
          running: true, 
          connected: true, 
          version: buildInfo.version 
        };
      }
      
      return { running: true, connected: false, error: 'Ping failed' };
      
    } catch (error) {
      return { 
        running: false, 
        connected: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Check Redis status
   */
  private async checkRedis(): Promise<{ running: boolean; connected: boolean; version?: string; error?: string }> {
    try {
      // Check if container is running
      const { stdout } = await execAsync('docker-compose ps redis');
      const running = stdout.includes('Up');
      
      if (!running) {
        return { running: false, connected: false, error: 'Container not running' };
      }

      // Test connection
      const { stdout: pong } = await execAsync('docker-compose exec -T redis redis-cli ping');
      const connected = pong.trim() === 'PONG';
      
      if (connected) {
        // Get version
        const { stdout: info } = await execAsync('docker-compose exec -T redis redis-cli info server');
        const versionMatch = info.match(/redis_version:([^\r\n]+)/);
        const version = versionMatch ? versionMatch[1] : undefined;
        
        return { running: true, connected: true, version };
      }
      
      return { running: true, connected: false, error: 'Connection failed' };
      
    } catch (error) {
      return { 
        running: false, 
        connected: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(status: InfrastructureStatus): 'healthy' | 'degraded' | 'unhealthy' {
    if (!status.docker.available) {
      return 'unhealthy';
    }
    
    const mongoHealthy = status.mongodb.running && status.mongodb.connected;
    const redisHealthy = status.redis.running && status.redis.connected;
    
    if (mongoHealthy && redisHealthy) {
      return 'healthy';
    } else if (mongoHealthy || redisHealthy) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Display infrastructure status
   */
  private displayStatus(status: InfrastructureStatus): void {
    console.log(chalk.blue('\n📊 Infrastructure Status Report'));
    console.log('═'.repeat(50));

    // Docker
    const dockerIcon = status.docker.available ? '✅' : '❌';
    console.log(`${dockerIcon} Docker: ${status.docker.available ? 'Available' : 'Not Available'}`);
    if (status.docker.version) {
      console.log(chalk.gray(`   Version: ${status.docker.version}`));
    }
    if (status.docker.error) {
      console.log(chalk.red(`   Error: ${status.docker.error}`));
    }

    // MongoDB
    const mongoIcon = status.mongodb.connected ? '✅' : status.mongodb.running ? '⚠️' : '❌';
    const mongoStatus = status.mongodb.connected ? 'Connected' : 
                       status.mongodb.running ? 'Running (not connected)' : 'Not Running';
    console.log(`${mongoIcon} MongoDB: ${mongoStatus}`);
    if (status.mongodb.version) {
      console.log(chalk.gray(`   Version: ${status.mongodb.version}`));
    }
    if (status.mongodb.error) {
      console.log(chalk.red(`   Error: ${status.mongodb.error}`));
    }

    // Redis
    const redisIcon = status.redis.connected ? '✅' : status.redis.running ? '⚠️' : '❌';
    const redisStatus = status.redis.connected ? 'Connected' : 
                       status.redis.running ? 'Running (not connected)' : 'Not Running';
    console.log(`${redisIcon} Redis: ${redisStatus}`);
    if (status.redis.version) {
      console.log(chalk.gray(`   Version: ${status.redis.version}`));
    }
    if (status.redis.error) {
      console.log(chalk.red(`   Error: ${status.redis.error}`));
    }

    // Overall Status
    const overallIcon = status.overall === 'healthy' ? '✅' : 
                       status.overall === 'degraded' ? '⚠️' : '❌';
    const overallColor = status.overall === 'healthy' ? chalk.green : 
                        status.overall === 'degraded' ? chalk.yellow : chalk.red;
    
    console.log(`\n${overallIcon} Overall Status: ${overallColor(status.overall.toUpperCase())}`);

    // Recommendations
    if (status.overall !== 'healthy') {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      
      if (!status.docker.available) {
        console.log(chalk.yellow('  • Install Docker Desktop and ensure it\'s running'));
        console.log(chalk.yellow('  • Visit: https://docs.docker.com/get-docker/'));
      }
      
      if (!status.mongodb.connected && status.docker.available) {
        console.log(chalk.yellow('  • Restart MongoDB: docker-compose restart mongodb'));
        console.log(chalk.yellow('  • Check logs: docker-compose logs mongodb'));
      }
      
      if (!status.redis.connected && status.docker.available) {
        console.log(chalk.yellow('  • Restart Redis: docker-compose restart redis'));
        console.log(chalk.yellow('  • Check logs: docker-compose logs redis'));
      }
    }

    console.log('');
  }

  /**
   * Stop all services
   */
  async stop(): Promise<void> {
    const spinner = ora('Stopping infrastructure services...').start();
    
    try {
      await execAsync('docker-compose down');
      spinner.succeed(chalk.green('✅ Infrastructure services stopped'));
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to stop services'));
      throw error;
    }
  }

  /**
   * Restart all services
   */
  async restart(): Promise<InfrastructureStatus> {
    console.log(chalk.blue('🔄 Restarting infrastructure services...'));
    
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit
    return await this.initialize();
  }

  /**
   * Get current status without initialization
   */
  async getStatus(): Promise<InfrastructureStatus> {
    const status: InfrastructureStatus = {
      mongodb: { running: false, connected: false },
      redis: { running: false, connected: false },
      docker: { available: false },
      overall: 'unhealthy'
    };

    status.docker = await this.checkDocker();
    
    if (status.docker.available) {
      status.mongodb = await this.checkMongoDB();
      status.redis = await this.checkRedis();
    }

    status.overall = this.calculateOverallHealth(status);
    
    return status;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.mongoClient.close();
    } catch (error) {
      this.logger.error('Error during infrastructure cleanup:', error);
    }
  }
}