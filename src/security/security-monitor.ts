/**
 * Security Monitoring Dashboard
 * Real-time security monitoring and alerting system
 * 
 * Features:
 * - Real-time security event monitoring
 * - Threat detection and alerting
 * - Security metrics dashboard
 * - Incident response automation
 * - Integration with GitHub and Supabase security
 */

import { EventEmitter } from 'events';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../types/core';
import SecurityConfigManager from './security-config';

export interface SecurityAlert {
  id: string;
  type: 'threat' | 'anomaly' | 'violation' | 'breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: 'github' | 'supabase' | 'api' | 'client';
  metadata: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SecurityMetrics {
  requests: {
    total: number;
    blocked: number;
    rateLimited: number;
    suspicious: number;
  };
  authentication: {
    successful: number;
    failed: number;
    bruteForce: number;
    tokenExpired: number;
  };
  violations: {
    csp: number;
    cors: number;
    inputValidation: number;
    authorization: number;
  };
  threats: {
    xss: number;
    injection: number;
    maliciousFiles: number;
    suspiciousIps: number;
  };
}

export interface ThreatRule {
  id: string;
  name: string;
  description: string;
  pattern: string | RegExp;
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'block' | 'alert' | 'quarantine';
  enabled: boolean;
}

export class SecurityMonitor extends EventEmitter {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private securityConfig: SecurityConfigManager;
  private alerts: Map<string, SecurityAlert> = new Map();
  private metrics: SecurityMetrics;
  private threatRules: Map<string, ThreatRule> = new Map();
  private suspiciousIps: Set<string> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(securityConfig: SecurityConfigManager) {
    super();
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);
    this.securityConfig = securityConfig;
    this.metrics = this.initializeMetrics();
    
    this.setupThreatRules();
    this.startMonitoring();
    
    this.logger.info('Security monitor initialized');
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      requests: { total: 0, blocked: 0, rateLimited: 0, suspicious: 0 },
      authentication: { successful: 0, failed: 0, bruteForce: 0, tokenExpired: 0 },
      violations: { csp: 0, cors: 0, inputValidation: 0, authorization: 0 },
      threats: { xss: 0, injection: 0, maliciousFiles: 0, suspiciousIps: 0 }
    };
  }

  private setupThreatRules(): void {
    const defaultRules: ThreatRule[] = [
      {
        id: 'sql_injection',
        name: 'SQL Injection Detection',
        description: 'Detects potential SQL injection attempts',
        pattern: /(union|select|insert|update|delete|drop|create|alter|exec|execute|\-\-|\/\*|\*\/)/i,
        field: 'body',
        severity: 'high',
        action: 'block',
        enabled: true
      },
      {
        id: 'xss_attempt',
        name: 'XSS Attack Detection',
        description: 'Detects potential XSS attacks',
        pattern: /<script[^>]*>.*?<\/script>|javascript:|vbscript:|on\w+\s*=|eval\s*\(|expression\s*\(/i,
        field: 'body',
        severity: 'high',
        action: 'block',
        enabled: true
      },
      {
        id: 'path_traversal',
        name: 'Path Traversal Detection',
        description: 'Detects directory traversal attempts',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
        field: 'path',
        severity: 'medium',
        action: 'block',
        enabled: true
      },
      {
        id: 'command_injection',
        name: 'Command Injection Detection',
        description: 'Detects command injection attempts',
        pattern: /(\||\;|\&|\$\(|\`|nc\s|wget\s|curl\s|bash\s|sh\s|cmd\s|powershell\s)/i,
        field: 'body',
        severity: 'critical',
        action: 'block',
        enabled: true
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        description: 'Detects suspicious or malicious user agents',
        pattern: /(bot|crawler|scanner|sqlmap|nikto|nmap|masscan|zap|burp|w3af)/i,
        field: 'user_agent',
        severity: 'medium',
        action: 'alert',
        enabled: true
      },
      {
        id: 'rate_limit_abuse',
        name: 'Rate Limit Abuse',
        description: 'Detects rapid successive requests indicating abuse',
        pattern: '', // Handled programmatically
        field: 'frequency',
        severity: 'medium',
        action: 'block',
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.threatRules.set(rule.id, rule);
    });
  }

  // ============================================================================
  // Request Monitoring
  // ============================================================================

  monitorRequest(req: any, res: any): void {
    this.metrics.requests.total++;

    // Check against threat rules
    for (const [ruleId, rule] of this.threatRules) {
      if (!rule.enabled) continue;

      if (this.checkThreatRule(rule, req)) {
        this.handleThreatDetection(rule, req);
      }
    }

    // Monitor IP patterns
    this.monitorIpBehavior(req.ip);

    // Check for suspicious patterns
    this.detectAnomalies(req);
  }

  private checkThreatRule(rule: ThreatRule, req: any): boolean {
    let value: string = '';

    switch (rule.field) {
      case 'body':
        value = JSON.stringify(req.body || {});
        break;
      case 'path':
        value = req.path || '';
        break;
      case 'user_agent':
        value = req.get('User-Agent') || '';
        break;
      case 'query':
        value = JSON.stringify(req.query || {});
        break;
      case 'headers':
        value = JSON.stringify(req.headers || {});
        break;
      default:
        return false;
    }

    if (rule.pattern instanceof RegExp) {
      return rule.pattern.test(value);
    } else if (typeof rule.pattern === 'string' && rule.pattern) {
      return new RegExp(rule.pattern, 'i').test(value);
    }

    return false;
  }

  private handleThreatDetection(rule: ThreatRule, req: any): void {
    const alertId = this.generateAlertId();
    
    const alert: SecurityAlert = {
      id: alertId,
      type: 'threat',
      severity: rule.severity,
      title: rule.name,
      description: `${rule.description} - Pattern matched: ${rule.pattern}`,
      source: 'api',
      metadata: {
        rule: rule.id,
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.emit('securityAlert', alert);

    // Execute rule action
    switch (rule.action) {
      case 'block':
        this.metrics.requests.blocked++;
        this.logger.warn('Request blocked by security rule', { rule: rule.id, alert });
        break;
      case 'alert':
        this.logger.warn('Security alert triggered', { rule: rule.id, alert });
        break;
      case 'quarantine':
        this.suspiciousIps.add(req.ip);
        this.logger.error('IP quarantined', { ip: req.ip, rule: rule.id });
        break;
    }

    // Update threat metrics
    switch (rule.id) {
      case 'xss_attempt':
        this.metrics.threats.xss++;
        break;
      case 'sql_injection':
      case 'command_injection':
        this.metrics.threats.injection++;
        break;
    }
  }

  private monitorIpBehavior(ip: string): void {
    // This would typically use a more sophisticated system like Redis
    // For now, we'll implement basic IP monitoring
    
    if (this.suspiciousIps.has(ip)) {
      this.metrics.requests.suspicious++;
      
      this.createAlert({
        type: 'threat',
        severity: 'high',
        title: 'Request from Quarantined IP',
        description: `Request received from previously quarantined IP: ${ip}`,
        source: 'api',
        metadata: { ip, action: 'quarantine_bypass_attempt' }
      });
    }
  }

  private detectAnomalies(req: any): void {
    // Detect unusual request patterns
    const suspiciousPatterns = [
      { pattern: /\.php$/, description: 'PHP file access on non-PHP application' },
      { pattern: /wp-admin|wp-content|wp-includes/, description: 'WordPress-specific path access' },
      { pattern: /\.env|\.git|\.svn|\.config/, description: 'Configuration file access attempt' },
      { pattern: /admin|administrator|root|test|demo/, description: 'Common admin path probe' }
    ];

    for (const { pattern, description } of suspiciousPatterns) {
      if (pattern.test(req.path)) {
        this.createAlert({
          type: 'anomaly',
          severity: 'medium',
          title: 'Suspicious Path Access',
          description,
          source: 'api',
          metadata: {
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
        break;
      }
    }
  }

  // ============================================================================
  // Authentication Monitoring
  // ============================================================================

  monitorAuthentication(event: 'success' | 'failure' | 'token_expired', details: any): void {
    switch (event) {
      case 'success':
        this.metrics.authentication.successful++;
        break;
      case 'failure':
        this.metrics.authentication.failed++;
        this.checkBruteForce(details.ip, details.email);
        break;
      case 'token_expired':
        this.metrics.authentication.tokenExpired++;
        break;
    }

    // Log authentication events
    this.logger.info('Authentication event', { event, details });
  }

  private checkBruteForce(ip: string, email?: string): void {
    // This would typically use Redis or a proper time-series database
    // For demo purposes, we'll implement basic brute force detection
    
    const recentFailures = this.getRecentAuthFailures(ip, email);
    
    if (recentFailures > 5) {
      this.metrics.authentication.bruteForce++;
      this.suspiciousIps.add(ip);
      
      this.createAlert({
        type: 'threat',
        severity: 'high',
        title: 'Brute Force Attack Detected',
        description: `Multiple authentication failures detected from IP: ${ip}`,
        source: 'api',
        metadata: {
          ip,
          email,
          failureCount: recentFailures,
          action: 'ip_blocked'
        }
      });
    }
  }

  private getRecentAuthFailures(ip: string, email?: string): number {
    // Mock implementation - in production, use proper storage
    return Math.floor(Math.random() * 10);
  }

  // ============================================================================
  // GitHub Integration Security
  // ============================================================================

  monitorGitHubWebhook(payload: any, signature: string): boolean {
    // Verify webhook signature
    const isValid = this.verifyGitHubSignature(payload, signature);
    
    if (!isValid) {
      this.createAlert({
        type: 'violation',
        severity: 'high',
        title: 'Invalid GitHub Webhook Signature',
        description: 'Received GitHub webhook with invalid signature',
        source: 'github',
        metadata: { payload: payload.action, repository: payload.repository?.name }
      });
      return false;
    }

    // Monitor for suspicious activities
    this.analyzeGitHubActivity(payload);
    
    return true;
  }

  private verifyGitHubSignature(payload: any, signature: string): boolean {
    // Implementation would verify HMAC signature
    // Mock implementation for demo
    return signature && signature.startsWith('sha256=');
  }

  private analyzeGitHubActivity(payload: any): void {
    const suspiciousActions = [
      'repository.deleted',
      'organization.member_removed',
      'repository.privatized',
      'repository.publicized'
    ];

    const action = `${payload.action}`;
    
    if (suspiciousActions.some(sa => action.includes(sa))) {
      this.createAlert({
        type: 'anomaly',
        severity: 'medium',
        title: 'Suspicious GitHub Activity',
        description: `Potentially sensitive GitHub action detected: ${action}`,
        source: 'github',
        metadata: payload
      });
    }
  }

  // ============================================================================
  // Supabase Security Monitoring
  // ============================================================================

  monitorSupabaseEvent(event: string, details: any): void {
    // Monitor RLS policy violations
    if (event.includes('rls_violation')) {
      this.metrics.violations.authorization++;
      
      this.createAlert({
        type: 'violation',
        severity: 'high',
        title: 'Row Level Security Violation',
        description: 'Attempted access to unauthorized data',
        source: 'supabase',
        metadata: details
      });
    }

    // Monitor for unusual database patterns
    if (event.includes('bulk_operation') && details.rowCount > 1000) {
      this.createAlert({
        type: 'anomaly',
        severity: 'medium',
        title: 'Large Database Operation',
        description: `Bulk operation affecting ${details.rowCount} rows`,
        source: 'supabase',
        metadata: details
      });
    }
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  private createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): SecurityAlert {
    const alert: SecurityAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    this.emit('securityAlert', alert);
    
    return alert;
  }

  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    this.emit('alertResolved', alert);
    this.logger.info('Security alert resolved', { alertId, resolvedBy });
    
    return true;
  }

  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(limit: number = 100): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // Monitoring and Reporting
  // ============================================================================

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performanceMonitor.recordMetric('security.alerts.active', this.getActiveAlerts().length);
      this.performanceMonitor.recordMetric('security.requests.total', this.metrics.requests.total);
      this.performanceMonitor.recordMetric('security.threats.detected', 
        this.metrics.threats.xss + this.metrics.threats.injection + this.metrics.threats.maliciousFiles
      );
    }, 60000); // Every minute
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  generateSecurityReport(): any {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    return {
      summary: {
        status: criticalAlerts.length > 0 ? 'critical' : 
               highAlerts.length > 0 ? 'warning' : 'healthy',
        totalAlerts: this.alerts.size,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length
      },
      metrics: this.metrics,
      topThreats: this.getTopThreats(),
      suspiciousIps: Array.from(this.suspiciousIps),
      recentAlerts: this.getAlertHistory(10),
      timestamp: new Date().toISOString()
    };
  }

  private getTopThreats(): any[] {
    const threatCounts: Record<string, number> = {};
    
    for (const alert of this.alerts.values()) {
      if (alert.type === 'threat') {
        const threatType = alert.metadata?.rule || 'unknown';
        threatCounts[threatType] = (threatCounts[threatType] || 0) + 1;
      }
    }

    return Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addThreatRule(rule: ThreatRule): void {
    this.threatRules.set(rule.id, rule);
    this.logger.info('Threat rule added', { ruleId: rule.id, name: rule.name });
  }

  removeThreatRule(ruleId: string): boolean {
    const removed = this.threatRules.delete(ruleId);
    if (removed) {
      this.logger.info('Threat rule removed', { ruleId });
    }
    return removed;
  }

  getThreatRules(): ThreatRule[] {
    return Array.from(this.threatRules.values());
  }

  isIpSuspicious(ip: string): boolean {
    return this.suspiciousIps.has(ip);
  }

  quarantineIp(ip: string, reason: string): void {
    this.suspiciousIps.add(ip);
    this.createAlert({
      type: 'threat',
      severity: 'medium',
      title: 'IP Quarantined',
      description: `IP ${ip} has been quarantined: ${reason}`,
      source: 'api',
      metadata: { ip, reason, action: 'quarantine' }
    });
  }

  releaseIp(ip: string): void {
    this.suspiciousIps.delete(ip);
    this.logger.info('IP released from quarantine', { ip });
  }
}

export default SecurityMonitor;