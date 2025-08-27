/**
 * Enterprise Security Configuration
 * Advanced security hardening for GitHub and Supabase integration
 * 
 * Features:
 * - Content Security Policy (CSP) configuration
 * - Rate limiting and throttling
 * - Security headers and HSTS
 * - Audit logging and monitoring
 * - Input validation and sanitization
 * - Session security and token management
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Logger } from '../logging/logger';
import { PlatformType } from '../types/core';
import * as crypto from 'crypto';

export interface SecurityConfig {
  cors: {
    origin: string[];
    credentials: boolean;
    maxAge: number;
  };
  csp: {
    directives: Record<string, string[]>;
    reportOnly: boolean;
    reportUri?: string;
  };
  rateLimiting: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  session: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    regenerateOnAuth: boolean;
  };
  audit: {
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    sensitiveFields: string[];
    retentionDays: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
  };
}

export class SecurityConfigManager {
  private config: SecurityConfig;
  private logger: Logger;
  private auditEvents: Map<string, any[]> = new Map();

  constructor(environment: 'development' | 'staging' | 'production' = 'production') {
    this.logger = new Logger(PlatformType.NODE);
    this.config = this.createSecurityConfig(environment);
    
    // Setup audit event cleanup
    setInterval(() => this.cleanupAuditEvents(), 24 * 60 * 60 * 1000); // Daily cleanup
    
    this.logger.info('Security configuration initialized', { environment });
  }

  private createSecurityConfig(environment: string): SecurityConfig {
    const isProduction = environment === 'production';
    
    return {
      cors: {
        origin: isProduction 
          ? ['https://sherlock-omega.com', 'https://app.sherlock-omega.com']
          : ['http://localhost:3002', 'http://127.0.0.1:3002'],
        credentials: true,
        maxAge: 86400 // 24 hours
      },
      csp: {
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            "'unsafe-inline'", // Required for Monaco Editor
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://github.com'
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'", // Required for dynamic styling
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'https://avatars.githubusercontent.com',
            'https://github.com'
          ],
          'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net'
          ],
          'connect-src': [
            "'self'",
            'https://api.github.com',
            'https://*.supabase.co',
            'https://api.openai.com',
            'https://api.anthropic.com',
            'wss://*.supabase.co',
            isProduction ? 'https://api.sherlock-omega.com' : 'http://localhost:3002'
          ],
          'worker-src': [
            "'self'",
            'blob:'
          ],
          'child-src': [
            "'self'",
            'blob:'
          ],
          'frame-src': [
            "'none'"
          ],
          'object-src': [
            "'none'"
          ],
          'base-uri': [
            "'self'"
          ],
          'form-action': [
            "'self'",
            'https://github.com'
          ],
          'frame-ancestors': [
            "'none'"
          ],
          'upgrade-insecure-requests': []
        },
        reportOnly: !isProduction,
        reportUri: isProduction ? '/api/security/csp-report' : undefined
      },
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: isProduction ? 100 : 1000, // More lenient in development
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      session: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        regenerateOnAuth: true
      },
      audit: {
        enableLogging: true,
        logLevel: isProduction ? 'warn' : 'info',
        sensitiveFields: [
          'password', 'token', 'secret', 'key', 'authorization',
          'x-api-key', 'access_token', 'refresh_token'
        ],
        retentionDays: isProduction ? 90 : 30
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltLength: 32
      }
    };
  }

  // ============================================================================
  // Security Middleware
  // ============================================================================

  createSecurityMiddleware() {
    return [
      this.createHelmetMiddleware(),
      this.createCorsMiddleware(),
      this.createRateLimitMiddleware(),
      this.createAuditMiddleware(),
      this.createInputSanitizationMiddleware()
    ];
  }

  private createHelmetMiddleware() {
    return helmet({
      contentSecurityPolicy: {
        directives: this.config.csp.directives,
        reportOnly: this.config.csp.reportOnly
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
      hidePoweredBy: true,
      crossOriginEmbedderPolicy: false, // Disabled for development compatibility
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      expectCt: {
        maxAge: 86400,
        enforce: process.env.NODE_ENV === 'production'
      }
    });
  }

  private createCorsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin as string;
      
      if (this.config.cors.origin.includes(origin) || this.config.cors.origin.includes('*')) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      
      res.header('Access-Control-Allow-Credentials', this.config.cors.credentials.toString());
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 
        'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-CSRF-Token,X-Session-Token'
      );
      res.header('Access-Control-Max-Age', this.config.cors.maxAge.toString());
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();
      }
    };
  }

  private createRateLimitMiddleware() {
    return rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.max,
      skipSuccessfulRequests: this.config.rateLimiting.skipSuccessfulRequests,
      skipFailedRequests: this.config.rateLimiting.skipFailedRequests,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: Math.ceil(this.config.rateLimiting.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });
        
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(this.config.rateLimiting.windowMs / 1000)
        });
      }
    });
  }

  private createAuditMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.audit.enableLogging) {
        return next();
      }

      const startTime = Date.now();
      const originalSend = res.send;
      
      // Sanitize request data
      const sanitizedBody = this.sanitizeAuditData(req.body);
      const sanitizedHeaders = this.sanitizeAuditData(req.headers);

      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log the request/response
        this.logAuditEvent('http_request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: sanitizedBody,
          headers: sanitizedHeaders,
          timestamp: new Date().toISOString()
        });

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  private createInputSanitizationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeInput(req.query);
      }

      // Sanitize request body
      if (req.body) {
        req.body = this.sanitizeInput(req.body);
      }

      next();
    };
  }

  // ============================================================================
  // Security Utilities
  // ============================================================================

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/onload/gi, '')
        .replace(/onerror/gi, '')
        .trim();
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  private sanitizeAuditData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.config.audit.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeAuditData(value);
        }
      }
      return sanitized;
    }
    return data;
  }

  encryptSensitiveData(data: string, key?: string): { encrypted: string; iv: string; tag: string } {
    const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(this.config.encryption.keyLength);
    const iv = crypto.randomBytes(this.config.encryption.ivLength);
    
    const cipher = crypto.createCipherGCM(this.config.encryption.algorithm, encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decryptSensitiveData(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const encryptionKey = Buffer.from(key, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipherGCM(this.config.encryption.algorithm, encryptionKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // ============================================================================
  // Audit and Monitoring
  // ============================================================================

  logSecurityEvent(event: string, details: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      event,
      details: this.sanitizeAuditData(details),
      timestamp,
      severity: 'security'
    };

    this.logger.warn(`Security Event: ${event}`, logEntry);
    
    // Store for analysis
    if (!this.auditEvents.has(event)) {
      this.auditEvents.set(event, []);
    }
    this.auditEvents.get(event)!.push(logEntry);
  }

  private logAuditEvent(event: string, details: any): void {
    if (this.config.audit.logLevel === 'debug' || 
        (this.config.audit.logLevel === 'info' && ['error', 'warn', 'info'].includes('info'))) {
      
      const logEntry = {
        event,
        details,
        timestamp: new Date().toISOString()
      };

      this.logger.info(`Audit: ${event}`, logEntry);
    }
  }

  getSecurityMetrics(): any {
    const metrics: any = {
      totalEvents: 0,
      eventBreakdown: {},
      recentEvents: [],
      timestamp: new Date().toISOString()
    };

    for (const [event, entries] of this.auditEvents.entries()) {
      metrics.totalEvents += entries.length;
      metrics.eventBreakdown[event] = entries.length;
      
      // Get recent events (last hour)
      const hourAgo = Date.now() - (60 * 60 * 1000);
      const recentEntries = entries.filter(entry => 
        new Date(entry.timestamp).getTime() > hourAgo
      );
      
      if (recentEntries.length > 0) {
        metrics.recentEvents.push({
          event,
          count: recentEntries.length,
          samples: recentEntries.slice(-3) // Last 3 samples
        });
      }
    }

    return metrics;
  }

  private cleanupAuditEvents(): void {
    const cutoffDate = Date.now() - (this.config.audit.retentionDays * 24 * 60 * 60 * 1000);
    
    for (const [event, entries] of this.auditEvents.entries()) {
      const filteredEntries = entries.filter(entry => 
        new Date(entry.timestamp).getTime() > cutoffDate
      );
      
      this.auditEvents.set(event, filteredEntries);
    }

    this.logger.info('Audit events cleanup completed', {
      retentionDays: this.config.audit.retentionDays
    });
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  updateSecurityConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('Security configuration updated');
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  validateSecurityHeaders(req: Request): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for required security headers in requests
    const requiredHeaders = ['user-agent', 'accept'];
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    
    for (const header of requiredHeaders) {
      if (!req.headers[header]) {
        issues.push(`Missing required header: ${header}`);
      }
    }

    // Check for suspicious patterns
    if (req.headers['user-agent'] && 
        (req.headers['user-agent'] as string).toLowerCase().includes('bot')) {
      issues.push('Suspicious user agent detected');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // ============================================================================
  // CSP Reporting
  // ============================================================================

  handleCSPReport(report: any): void {
    this.logSecurityEvent('csp_violation', {
      document: report['document-uri'],
      referrer: report.referrer,
      directive: report['violated-directive'],
      originalPolicy: report['original-policy'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number']
    });
  }

  generateSecurityReport(): any {
    return {
      config: this.config,
      metrics: this.getSecurityMetrics(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

export default SecurityConfigManager;