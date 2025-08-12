/**
 * Telemetry Service for Sherlock Ω
 * Collects and transmits real-world friction elimination metrics
 */

import { EventEmitter } from 'events';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  timestamp: number;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  metadata: {
    version: string;
    platform: string;
    environment: string;
  };
}

export enum TelemetryEventType {
  // Friction Events
  FRICTION_DETECTED = 'friction_detected',
  FRICTION_ELIMINATED = 'friction_eliminated',
  FRICTION_PREVENTION = 'friction_prevention',
  
  // Performance Events
  RESPONSE_TIME = 'response_time',
  SYSTEM_HEALTH = 'system_health',
  MEMORY_USAGE = 'memory_usage',
  
  // Productivity Events
  FLOW_STATE_ENTERED = 'flow_state_entered',
  FLOW_STATE_BROKEN = 'flow_state_broken',
  PRODUCTIVITY_BOOST = 'productivity_boost',
  TIME_SAVED = 'time_saved',
  
  // User Experience Events
  USER_SATISFACTION = 'user_satisfaction',
  FEATURE_USAGE = 'feature_usage',
  ERROR_OCCURRED = 'error_occurred',
  
  // System Events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown'
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  anonymize: boolean;
  includeSystemMetrics: boolean;
  includeUserMetrics: boolean;
  environment: 'development' | 'staging' | 'production';
}

export class TelemetryService extends EventEmitter {
  private config: TelemetryConfig;
  private events: TelemetryEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private userId?: string;
  private isOnline: boolean = true;

  constructor(config: TelemetryConfig) {
    super();
    this.config = config;
    this.sessionId = this.generateId();
    
    if (this.config.enabled) {
      this.startPeriodicFlush();
      this.setupNetworkMonitoring();
    }
  }

  /**
   * Record a telemetry event
   */
  public recordEvent(type: TelemetryEventType, data: Record<string, any>): void {
    if (!this.config.enabled) return;

    const event: TelemetryEvent = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      data: this.config.anonymize ? this.anonymizeData(data) : data,
      metadata: {
        version: process.env.npm_package_version || '1.0.0',
        platform: process.platform,
        environment: this.config.environment
      }
    };

    this.events.push(event);
    this.emit('eventRecorded', event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Record friction detection event
   */
  public recordFrictionDetected(frictionType: string, severity: string, metadata: Record<string, any>): void {
    this.recordEvent(TelemetryEventType.FRICTION_DETECTED, {
      frictionType,
      severity,
      detectionTime: Date.now(),
      ...metadata
    });
  }

  /**
   * Record friction elimination event
   */
  public recordFrictionEliminated(frictionType: string, eliminationTime: number, confidence: number): void {
    this.recordEvent(TelemetryEventType.FRICTION_ELIMINATED, {
      frictionType,
      eliminationTime,
      confidence,
      success: true
    });
  }

  /**
   * Record performance metrics
   */
  public recordPerformanceMetric(metric: string, value: number, unit: string): void {
    this.recordEvent(TelemetryEventType.RESPONSE_TIME, {
      metric,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  /**
   * Record flow state changes
   */
  public recordFlowStateChange(entered: boolean, duration?: number): void {
    this.recordEvent(
      entered ? TelemetryEventType.FLOW_STATE_ENTERED : TelemetryEventType.FLOW_STATE_BROKEN,
      {
        flowState: entered,
        duration: duration || 0,
        timestamp: Date.now()
      }
    );
  }

  /**
   * Record productivity boost
   */
  public recordProductivityBoost(timeSaved: number, frictionType: string, action: string): void {
    this.recordEvent(TelemetryEventType.PRODUCTIVITY_BOOST, {
      timeSaved,
      frictionType,
      action,
      impact: this.calculateProductivityImpact(timeSaved)
    });
  }

  /**
   * Record user satisfaction
   */
  public recordUserSatisfaction(rating: number, feedback?: string): void {
    this.recordEvent(TelemetryEventType.USER_SATISFACTION, {
      rating,
      feedback: feedback || '',
      timestamp: Date.now()
    });
  }

  /**
   * Start a new session
   */
  public startSession(userId?: string): string {
    this.userId = userId;
    this.sessionId = this.generateId();
    
    this.recordEvent(TelemetryEventType.SESSION_STARTED, {
      userId: this.userId,
      sessionId: this.sessionId,
      startTime: Date.now()
    });

    return this.sessionId;
  }

  /**
   * End current session
   */
  public endSession(): void {
    this.recordEvent(TelemetryEventType.SESSION_ENDED, {
      sessionId: this.sessionId,
      endTime: Date.now(),
      eventsRecorded: this.events.length
    });

    // Final flush
    this.flush();
  }

  /**
   * Flush events to endpoint
   */
  public async flush(): Promise<void> {
    if (this.events.length === 0 || !this.config.enabled || !this.isOnline) {
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      if (this.config.endpoint) {
        await this.sendToEndpoint(eventsToSend);
      } else {
        // Store locally if no endpoint configured
        this.storeLocally(eventsToSend);
      }

      this.emit('eventsFlushed', eventsToSend.length);
    } catch (error) {
      console.error('Failed to flush telemetry events:', error);
      
      // Re-add events for retry
      this.events.unshift(...eventsToSend);
      this.emit('flushError', error);
    }
  }

  /**
   * Get current session metrics
   */
  public getSessionMetrics(): Record<string, any> {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      eventsRecorded: sessionEvents.length,
      frictionDetected: sessionEvents.filter(e => e.type === TelemetryEventType.FRICTION_DETECTED).length,
      frictionEliminated: sessionEvents.filter(e => e.type === TelemetryEventType.FRICTION_ELIMINATED).length,
      flowStateChanges: sessionEvents.filter(e => 
        e.type === TelemetryEventType.FLOW_STATE_ENTERED || 
        e.type === TelemetryEventType.FLOW_STATE_BROKEN
      ).length,
      productivityBoosts: sessionEvents.filter(e => e.type === TelemetryEventType.PRODUCTIVITY_BOOST).length
    };
  }

  /**
   * Destroy telemetry service
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Final flush
    this.flush();
    this.removeAllListeners();
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupNetworkMonitoring(): void {
    // Monitor network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flush(); // Flush queued events when back online
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private async sendToEndpoint(events: TelemetryEvent[]): Promise<void> {
    if (!this.config.endpoint) return;

    const payload = {
      events,
      metadata: {
        timestamp: Date.now(),
        version: process.env.npm_package_version || '1.0.0',
        environment: this.config.environment
      }
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
        'User-Agent': `Sherlock-Omega/${payload.metadata.version}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Telemetry endpoint error: ${response.status} ${response.statusText}`);
    }
  }

  private storeLocally(events: TelemetryEvent[]): void {
    // Store in local storage or file system
    const data = {
      events,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // In a real implementation, this would write to a local database or file
    console.log('📊 Telemetry data stored locally:', {
      events: events.length,
      sessionId: this.sessionId
    });
  }

  private anonymizeData(data: Record<string, any>): Record<string, any> {
    const anonymized = { ...data };
    
    // Remove or hash sensitive data
    const sensitiveFields = ['filePath', 'code', 'stackTrace', 'errorMessage'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashString(anonymized[field]);
      }
    }

    return anonymized;
  }

  private calculateProductivityImpact(timeSaved: number): string {
    if (timeSaved < 1000) return 'low';
    if (timeSaved < 5000) return 'medium';
    if (timeSaved < 15000) return 'high';
    return 'critical';
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Default configuration
export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: true,
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
  retryAttempts: 3,
  anonymize: true,
  includeSystemMetrics: true,
  includeUserMetrics: false,
  environment: 'production'
};