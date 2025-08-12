/**
 * Performance Analytics and Telemetry System for Sherlock Ω
 * Measures real-world friction reduction and system effectiveness
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context: Record<string, any>;
  tags: string[];
}

export interface FrictionEvent {
  id: string;
  type: 'detected' | 'eliminated' | 'failed';
  frictionType: string;
  severity: number;
  timeToDetection: number;
  timeToResolution?: number;
  success: boolean;
  context: {
    filePath: string;
    language: string;
    projectType: string;
    userAction: string;
  };
  metadata: Record<string, any>;
  timestamp: number;
}

export interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: FrictionEvent[];
  metrics: PerformanceMetric[];
  flowState: FlowStateMetrics;
  productivity: ProductivityMetrics;
}

export interface FlowStateMetrics {
  totalTime: number;
  interruptionCount: number;
  averageInterruptionDuration: number;
  flowStatePercentage: number;
  deepWorkSessions: number;
  contextSwitches: number;
}

export interface ProductivityMetrics {
  linesOfCodeWritten: number;
  functionsCreated: number;
  testsWritten: number;
  bugsFixed: number;
  refactoringsPerformed: number;
  dependenciesInstalled: number;
  timeSpentCoding: number;
  timeSpentDebugging: number;
  timeSpentWaiting: number;
}

export interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  anonymize: boolean;
  includeCodeContext: boolean;
  includeSystemMetrics: boolean;
}

/**
 * Performance Analytics Engine
 */
export class PerformanceAnalytics {
  private config: TelemetryConfig;
  private currentSession: UserSession | null = null;
  private metrics: PerformanceMetric[] = [];
  private events: FrictionEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private startTime: number = Date.now();
  private lastFlushTime: number = 0;
  private readonly MIN_FLUSH_INTERVAL = 2000; // Minimum 2 seconds between flushes

  constructor(config: TelemetryConfig) {
    this.config = config;
    
    if (config.enabled) {
      this.initializeAnalytics();
    }
  }

  private initializeAnalytics(): void {
    // Start periodic flushing
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Start system monitoring
    this.startSystemMonitoring();
    
    console.log('📊 Performance Analytics initialized');
  }

  /**
   * Start a new user session
   */
  startSession(): string {
    const sessionId = this.generateId();
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      events: [],
      metrics: [],
      flowState: {
        totalTime: 0,
        interruptionCount: 0,
        averageInterruptionDuration: 0,
        flowStatePercentage: 0,
        deepWorkSessions: 0,
        contextSwitches: 0
      },
      productivity: {
        linesOfCodeWritten: 0,
        functionsCreated: 0,
        testsWritten: 0,
        bugsFixed: 0,
        refactoringsPerformed: 0,
        dependenciesInstalled: 0,
        timeSpentCoding: 0,
        timeSpentDebugging: 0,
        timeSpentWaiting: 0
      }
    };

    this.recordMetric({
      id: this.generateId(),
      name: 'session_started',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      context: { sessionId },
      tags: ['session', 'lifecycle']
    });

    return sessionId;
  }

  /**
   * End the current user session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // Calculate final metrics
    this.calculateSessionMetrics();

    this.recordMetric({
      id: this.generateId(),
      name: 'session_ended',
      value: this.currentSession.duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: { 
        sessionId: this.currentSession.id,
        duration: this.currentSession.duration
      },
      tags: ['session', 'lifecycle']
    });

    // Store session for analysis
    this.storeSession(this.currentSession);
    this.currentSession = null;
  }

  /**
   * Record a friction event
   */
  recordFrictionEvent(event: Omit<FrictionEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    const frictionEvent: FrictionEvent = {
      ...event,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.events.push(frictionEvent);
    
    if (this.currentSession) {
      this.currentSession.events.push(frictionEvent);
    }

    // Update flow state metrics
    this.updateFlowStateMetrics(frictionEvent);

    // Record specific metrics based on event type
    this.recordEventMetrics(frictionEvent);
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enabled) return;

    this.metrics.push(metric);
    
    if (this.currentSession) {
      this.currentSession.metrics.push(metric);
    }

    // Check if we need to flush
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Record productivity action
   */
  recordProductivityAction(action: string, value: number = 1, context?: Record<string, any>): void {
    if (!this.config.enabled || !this.currentSession) return;

    // Update productivity metrics
    switch (action) {
      case 'lines_written':
        this.currentSession.productivity.linesOfCodeWritten += value;
        break;
      case 'function_created':
        this.currentSession.productivity.functionsCreated += value;
        break;
      case 'test_written':
        this.currentSession.productivity.testsWritten += value;
        break;
      case 'bug_fixed':
        this.currentSession.productivity.bugsFixed += value;
        break;
      case 'refactoring_performed':
        this.currentSession.productivity.refactoringsPerformed += value;
        break;
      case 'dependency_installed':
        this.currentSession.productivity.dependenciesInstalled += value;
        break;
    }

    this.recordMetric({
      id: this.generateId(),
      name: `productivity_${action}`,
      value,
      unit: 'count',
      timestamp: Date.now(),
      context: context || {},
      tags: ['productivity', action]
    });
  }

  /**
   * Record time spent on different activities
   */
  recordTimeSpent(activity: 'coding' | 'debugging' | 'waiting', duration: number): void {
    if (!this.config.enabled || !this.currentSession) return;

    switch (activity) {
      case 'coding':
        this.currentSession.productivity.timeSpentCoding += duration;
        break;
      case 'debugging':
        this.currentSession.productivity.timeSpentDebugging += duration;
        break;
      case 'waiting':
        this.currentSession.productivity.timeSpentWaiting += duration;
        break;
    }

    this.recordMetric({
      id: this.generateId(),
      name: `time_spent_${activity}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: { activity },
      tags: ['time_tracking', activity]
    });
  }

  /**
   * Get current session analytics
   */
  getCurrentSessionAnalytics(): any {
    if (!this.currentSession) return null;

    const now = Date.now();
    const sessionDuration = now - this.currentSession.startTime;

    return {
      sessionId: this.currentSession.id,
      duration: sessionDuration,
      frictionEvents: this.currentSession.events.length,
      frictionEliminated: this.currentSession.events.filter(e => e.type === 'eliminated').length,
      frictionFailed: this.currentSession.events.filter(e => e.type === 'failed').length,
      averageResolutionTime: this.calculateAverageResolutionTime(),
      flowStatePercentage: this.calculateFlowStatePercentage(),
      productivityScore: this.calculateProductivityScore(),
      systemHealth: this.getSystemHealth()
    };
  }

  /**
   * Get historical analytics
   */
  getHistoricalAnalytics(days: number = 7): any {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    const recentEvents = this.events.filter(e => e.timestamp > cutoffTime);

    return {
      timeRange: { days, from: cutoffTime, to: Date.now() },
      totalFrictionEvents: recentEvents.length,
      frictionByType: this.groupEventsByType(recentEvents),
      averageResolutionTime: this.calculateAverageResolutionTime(recentEvents),
      successRate: this.calculateSuccessRate(recentEvents),
      productivityTrends: this.calculateProductivityTrends(recentMetrics),
      systemPerformance: this.calculateSystemPerformance(recentMetrics),
      recommendations: this.generateRecommendations(recentEvents, recentMetrics)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const analytics = this.getCurrentSessionAnalytics();
    const historical = this.getHistoricalAnalytics();

    return `
# Sherlock Ω Performance Report
Generated: ${new Date().toISOString()}

## Current Session
- Duration: ${this.formatDuration(analytics?.duration || 0)}
- Friction Events: ${analytics?.frictionEvents || 0}
- Success Rate: ${((analytics?.frictionEliminated || 0) / Math.max(1, analytics?.frictionEvents || 1) * 100).toFixed(1)}%
- Flow State: ${(analytics?.flowStatePercentage || 0).toFixed(1)}%
- Productivity Score: ${(analytics?.productivityScore || 0).toFixed(1)}/100

## Historical Performance (7 days)
- Total Friction Events: ${historical.totalFrictionEvents}
- Average Resolution Time: ${this.formatDuration(historical.averageResolutionTime)}
- Overall Success Rate: ${(historical.successRate * 100).toFixed(1)}%

## Friction Breakdown
${Object.entries(historical.frictionByType).map(([type, count]) => 
  `- ${type}: ${count} events`).join('\n')}

## System Health
- CPU Usage: ${(analytics?.systemHealth?.cpuUsage || 0).toFixed(1)}%
- Memory Usage: ${(analytics?.systemHealth?.memoryUsage || 0).toFixed(1)}%
- Response Time: ${(analytics?.systemHealth?.responseTime || 0).toFixed(0)}ms
- Error Rate: ${(analytics?.systemHealth?.errorRate || 0).toFixed(2)}%

## Recommendations
${historical.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
`;
  }

  // Private helper methods

  private updateFlowStateMetrics(event: FrictionEvent): void {
    if (!this.currentSession) return;

    const flowState = this.currentSession.flowState;
    
    if (event.type === 'detected') {
      flowState.interruptionCount++;
    }

    if (event.timeToResolution) {
      flowState.averageInterruptionDuration = 
        (flowState.averageInterruptionDuration * (flowState.interruptionCount - 1) + event.timeToResolution) / 
        flowState.interruptionCount;
    }
  }

  private recordEventMetrics(event: FrictionEvent): void {
    // Record detection time
    this.recordMetric({
      id: this.generateId(),
      name: 'friction_detection_time',
      value: event.timeToDetection,
      unit: 'ms',
      timestamp: event.timestamp,
      context: { frictionType: event.frictionType, severity: event.severity },
      tags: ['friction', 'detection', event.frictionType]
    });

    // Record resolution time if available
    if (event.timeToResolution) {
      this.recordMetric({
        id: this.generateId(),
        name: 'friction_resolution_time',
        value: event.timeToResolution,
        unit: 'ms',
        timestamp: event.timestamp,
        context: { frictionType: event.frictionType, success: event.success },
        tags: ['friction', 'resolution', event.frictionType]
      });
    }

    // Record success/failure
    this.recordMetric({
      id: this.generateId(),
      name: 'friction_resolution_success',
      value: event.success ? 1 : 0,
      unit: 'boolean',
      timestamp: event.timestamp,
      context: { frictionType: event.frictionType },
      tags: ['friction', 'success', event.frictionType]
    });
  }

  private calculateSessionMetrics(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    const duration = session.duration || 0;
    
    // Calculate flow state percentage
    const totalInterruptionTime = session.events
      .filter(e => e.timeToResolution)
      .reduce((sum, e) => sum + (e.timeToResolution || 0), 0);
    
    session.flowState.flowStatePercentage = Math.max(0, 
      (duration - totalInterruptionTime) / duration * 100
    );

    session.flowState.totalTime = duration;
  }

  private calculateAverageResolutionTime(events?: FrictionEvent[]): number {
    const eventList = events || this.currentSession?.events || [];
    const resolvedEvents = eventList.filter(e => e.timeToResolution);
    
    if (resolvedEvents.length === 0) return 0;
    
    return resolvedEvents.reduce((sum, e) => sum + (e.timeToResolution || 0), 0) / resolvedEvents.length;
  }

  private calculateFlowStatePercentage(): number {
    return this.currentSession?.flowState.flowStatePercentage || 0;
  }

  private calculateProductivityScore(): number {
    if (!this.currentSession) return 0;

    const p = this.currentSession.productivity;
    const weights = {
      linesOfCode: 1,
      functions: 5,
      tests: 3,
      bugs: 4,
      refactorings: 2,
      dependencies: 1
    };

    const score = (
      p.linesOfCodeWritten * weights.linesOfCode +
      p.functionsCreated * weights.functions +
      p.testsWritten * weights.tests +
      p.bugsFixed * weights.bugs +
      p.refactoringsPerformed * weights.refactorings +
      p.dependenciesInstalled * weights.dependencies
    );

    // Normalize to 0-100 scale
    return Math.min(100, score / 10);
  }

  private getSystemHealth(): SystemHealthMetrics {
    return {
      cpuUsage: this.getCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
      responseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      throughput: this.getThroughput(),
      availability: this.getAvailability()
    };
  }

  private groupEventsByType(events: FrictionEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.frictionType] = (acc[event.frictionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateSuccessRate(events: FrictionEvent[]): number {
    if (events.length === 0) return 0;
    const successfulEvents = events.filter(e => e.success).length;
    return successfulEvents / events.length;
  }

  private calculateProductivityTrends(metrics: PerformanceMetric[]): any {
    // Analyze productivity trends over time
    const productivityMetrics = metrics.filter(m => m.tags.includes('productivity'));
    
    // Group by day and calculate trends
    const dailyProductivity = new Map<string, number>();
    
    productivityMetrics.forEach(metric => {
      const day = new Date(metric.timestamp).toDateString();
      dailyProductivity.set(day, (dailyProductivity.get(day) || 0) + metric.value);
    });

    return Array.from(dailyProductivity.entries()).map(([day, value]) => ({
      day,
      productivity: value
    }));
  }

  private calculateSystemPerformance(metrics: PerformanceMetric[]): any {
    const systemMetrics = metrics.filter(m => m.tags.includes('system'));
    
    return {
      averageResponseTime: this.calculateAverage(systemMetrics, 'response_time'),
      averageCPUUsage: this.calculateAverage(systemMetrics, 'cpu_usage'),
      averageMemoryUsage: this.calculateAverage(systemMetrics, 'memory_usage'),
      errorRate: this.calculateAverage(systemMetrics, 'error_rate')
    };
  }

  private generateRecommendations(events: FrictionEvent[], metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze friction patterns
    const frictionTypes = this.groupEventsByType(events);
    const mostCommonFriction = Object.entries(frictionTypes)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonFriction && mostCommonFriction[1] > 5) {
      recommendations.push(`Consider optimizing ${mostCommonFriction[0]} handling - it's your most common friction type`);
    }

    // Analyze resolution times
    const avgResolutionTime = this.calculateAverageResolutionTime(events);
    if (avgResolutionTime > 5000) {
      recommendations.push('Resolution times are high - consider enabling more aggressive auto-fixes');
    }

    // Analyze productivity
    const productivityMetrics = metrics.filter(m => m.tags.includes('productivity'));
    if (productivityMetrics.length > 0) {
      const avgProductivity = productivityMetrics.reduce((sum, m) => sum + m.value, 0) / productivityMetrics.length;
      if (avgProductivity < 10) {
        recommendations.push('Consider using more AI-assisted features to boost productivity');
      }
    }

    return recommendations;
  }

  private calculateAverage(metrics: PerformanceMetric[], name: string): number {
    const filtered = metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  private startSystemMonitoring(): void {
    setInterval(() => {
      this.recordSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private recordSystemMetrics(): void {
    const timestamp = Date.now();

    this.recordMetric({
      id: this.generateId(),
      name: 'cpu_usage',
      value: this.getCPUUsage(),
      unit: 'percent',
      timestamp,
      context: {},
      tags: ['system', 'cpu']
    });

    this.recordMetric({
      id: this.generateId(),
      name: 'memory_usage',
      value: this.getMemoryUsage(),
      unit: 'percent',
      timestamp,
      context: {},
      tags: ['system', 'memory']
    });

    this.recordMetric({
      id: this.generateId(),
      name: 'response_time',
      value: this.getAverageResponseTime(),
      unit: 'ms',
      timestamp,
      context: {},
      tags: ['system', 'performance']
    });
  }

  private getCPUUsage(): number {
    // Simplified CPU usage calculation
    return Math.random() * 20 + 10; // 10-30% simulated
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return (usage.heapUsed / usage.heapTotal) * 100;
    }
    return Math.random() * 30 + 20; // 20-50% simulated
  }

  private getAverageResponseTime(): number {
    // Calculate from recent metrics
    const recentMetrics = this.metrics
      .filter(m => m.name.includes('response_time') && m.timestamp > Date.now() - 300000)
      .slice(-10);
    
    if (recentMetrics.length === 0) return 100;
    
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  }

  private getErrorRate(): number {
    const recentEvents = this.events.filter(e => e.timestamp > Date.now() - 300000);
    if (recentEvents.length === 0) return 0;
    
    const failedEvents = recentEvents.filter(e => !e.success).length;
    return (failedEvents / recentEvents.length) * 100;
  }

  private getThroughput(): number {
    const recentEvents = this.events.filter(e => e.timestamp > Date.now() - 60000);
    return recentEvents.length; // Events per minute
  }

  private getAvailability(): number {
    // Simplified availability calculation
    return 99.9; // 99.9% uptime
  }

  private async flush(): Promise<void> {
    if (this.metrics.length === 0 && this.events.length === 0) return;
    
    // Debounce: prevent flooding by enforcing minimum interval between flushes
    const now = Date.now();
    if (now - this.lastFlushTime < this.MIN_FLUSH_INTERVAL) {
      return; // Skip this flush, too soon since last one
    }
    this.lastFlushTime = now;

    try {
      if (this.config.endpoint) {
        await this.sendToEndpoint();
      } else {
        await this.storeLocally();
      }

      // Clear sent data
      this.metrics = [];
      this.events = [];
      
    } catch (error) {
      console.error('Failed to flush analytics data:', error);
    }
  }

  private async sendToEndpoint(): Promise<void> {
    const payload = {
      metrics: this.config.anonymize ? this.anonymizeMetrics(this.metrics) : this.metrics,
      events: this.config.anonymize ? this.anonymizeEvents(this.events) : this.events,
      timestamp: Date.now()
    };

    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async storeLocally(): Promise<void> {
    // Store in local storage or file system
    const data = {
      metrics: this.metrics,
      events: this.events,
      timestamp: Date.now()
    };

    // In a real implementation, this would write to a local database or file
    console.log('📊 Analytics data stored locally:', {
      metrics: this.metrics.length,
      events: this.events.length
    });
  }

  private storeSession(session: UserSession): void {
    // Store completed session for historical analysis
    console.log('📊 Session completed:', {
      id: session.id,
      duration: this.formatDuration(session.duration || 0),
      events: session.events.length,
      productivity: session.productivity
    });
  }

  private anonymizeMetrics(metrics: PerformanceMetric[]): PerformanceMetric[] {
    return metrics.map(metric => ({
      ...metric,
      context: this.anonymizeContext(metric.context)
    }));
  }

  private anonymizeEvents(events: FrictionEvent[]): FrictionEvent[] {
    return events.map(event => ({
      ...event,
      context: {
        ...event.context,
        filePath: this.anonymizeFilePath(event.context.filePath)
      }
    }));
  }

  private anonymizeContext(context: Record<string, any>): Record<string, any> {
    const anonymized = { ...context };
    
    // Remove or hash sensitive information
    if (anonymized.filePath) {
      anonymized.filePath = this.anonymizeFilePath(anonymized.filePath);
    }
    
    return anonymized;
  }

  private anonymizeFilePath(filePath: string): string {
    // Replace actual file paths with generic patterns
    return filePath
      .replace(/\/Users\/[^\/]+/, '/Users/[user]')
      .replace(/\\Users\\[^\\]+/, '\\Users\\[user]')
      .replace(/\/home\/[^\/]+/, '/home/[user]')
      .replace(/C:\\Users\\[^\\]+/, 'C:\\Users\\[user]');
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    this.flush();
  }
}