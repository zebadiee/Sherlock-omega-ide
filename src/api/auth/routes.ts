/**
 * Authentication API Routes
 * Express.js routes for OAuth callback handling
 * 
 * Routes:
 * - GET /api/auth/github - Initiate GitHub OAuth
 * - GET /api/auth/callback/github - Handle GitHub callback
 * - GET /api/auth/supabase - Initiate Supabase OAuth
 * - GET /api/auth/callback/supabase - Handle Supabase callback
 * - POST /api/auth/logout - Logout user
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/refresh - Refresh session
 */

import express, { Request, Response, NextFunction } from 'express';
import { Logger } from '../../logging/logger';
import { PerformanceMonitor } from '../../monitoring/performance-monitor';
import { PlatformType } from '../../types/core';
import OAuthHandlers, { OAuthConfig, AuthSession } from '../../auth/oauth-handlers';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

interface AuthenticatedRequest extends Request {
  session?: AuthSession;
  user?: any;
}

export class AuthRoutes {
  private router: express.Router;
  private oauthHandlers: OAuthHandlers;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;

  constructor(config: OAuthConfig) {
    this.router = express.Router();
    this.oauthHandlers = new OAuthHandlers(config);
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.router.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "https://github.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.github.com", "https://*.supabase.co"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Rate limiting
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.router.use('/auth', authLimiter);

    // JSON parsing
    this.router.use(express.json({ limit: '10mb' }));
    this.router.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info('Auth API request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // ========================================================================
    // GitHub OAuth Routes
    // ========================================================================

    // Initiate GitHub OAuth
    this.router.get('/auth/github', async (req: Request, res: Response) => {
      try {
        const redirectUrl = req.query.redirect as string;
        const { authUrl, state } = await this.oauthHandlers.initiateGitHubAuth(redirectUrl);

        // Store state in session for validation
        req.session = req.session || {};
        (req.session as any).oauthState = state;

        res.redirect(authUrl);
      } catch (error: any) {
        this.logger.error('GitHub OAuth initiation failed', { error: error.message });
        res.status(500).json({
          error: 'Authentication initiation failed',
          message: 'Please try again later'
        });
      }
    });

    // Handle GitHub OAuth callback
    this.router.get('/auth/callback/github', async (req: Request, res: Response) => {
      try {
        const { code, state, error: oauthError } = req.query;

        if (oauthError) {
          this.logger.warn('GitHub OAuth error', { error: oauthError });
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?error=${oauthError}`);
        }

        if (!code || !state) {
          return res.status(400).json({
            error: 'Missing authorization code or state'
          });
        }

        const session = await this.oauthHandlers.handleGitHubCallback(
          code as string,
          state as string
        );

        // Generate session token
        const sessionToken = this.oauthHandlers.generateSessionToken(session.userId);

        // Set secure cookie
        this.setSessionCookie(res, sessionToken);

        // Redirect to success page or original destination
        const redirectUrl = req.query.redirect as string || '/dashboard';
        res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${redirectUrl}?auth=success`);

      } catch (error: any) {
        this.logger.error('GitHub OAuth callback failed', { error: error.message });
        res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?error=callback_failed`);
      }
    });

    // ========================================================================
    // Supabase OAuth Routes
    // ========================================================================

    // Initiate Supabase OAuth
    this.router.get('/auth/supabase', async (req: Request, res: Response) => {
      try {
        const provider = (req.query.provider as string) || 'github';
        const redirectUrl = req.query.redirect as string;
        
        const { authUrl, state } = await this.oauthHandlers.initiateSupabaseAuth(
          provider as 'github' | 'google',
          redirectUrl
        );

        // Store state in session
        req.session = req.session || {};
        (req.session as any).oauthState = state;

        res.redirect(authUrl);
      } catch (error: any) {
        this.logger.error('Supabase OAuth initiation failed', { error: error.message });
        res.status(500).json({
          error: 'Authentication initiation failed',
          message: 'Please try again later'
        });
      }
    });

    // Handle Supabase OAuth callback
    this.router.get('/auth/callback/supabase', async (req: Request, res: Response) => {
      try {
        const { access_token, refresh_token, state, error: oauthError } = req.query;

        if (oauthError) {
          this.logger.warn('Supabase OAuth error', { error: oauthError });
          return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?error=${oauthError}`);
        }

        if (!access_token) {
          return res.status(400).json({
            error: 'Missing access token'
          });
        }

        const session = await this.oauthHandlers.handleSupabaseCallback(
          access_token as string,
          refresh_token as string,
          state as string
        );

        // Generate session token
        const sessionToken = this.oauthHandlers.generateSessionToken(session.userId);

        // Set secure cookie
        this.setSessionCookie(res, sessionToken);

        // Redirect to success page
        const redirectUrl = req.query.redirect as string || '/dashboard';
        res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}${redirectUrl}?auth=success`);

      } catch (error: any) {
        this.logger.error('Supabase OAuth callback failed', { error: error.message });
        res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?error=callback_failed`);
      }
    });

    // ========================================================================
    // Session Management Routes
    // ========================================================================

    // Get current session
    this.router.get('/auth/session', this.requireAuth, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const session = req.session!;
        
        res.json({
          success: true,
          user: {
            id: session.userId,
            email: session.email,
            username: session.username,
            provider: session.provider,
            permissions: session.permissions,
            metadata: session.metadata
          },
          expiresAt: session.expiresAt
        });
      } catch (error: any) {
        this.logger.error('Session retrieval failed', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve session'
        });
      }
    });

    // Refresh session
    this.router.post('/auth/refresh', async (req: Request, res: Response) => {
      try {
        const sessionToken = this.getSessionToken(req);
        
        if (!sessionToken) {
          return res.status(401).json({
            error: 'No session token provided'
          });
        }

        const refreshedSession = await this.oauthHandlers.refreshSession(sessionToken);
        
        if (!refreshedSession) {
          return res.status(401).json({
            error: 'Session refresh failed'
          });
        }

        // Generate new session token
        const newSessionToken = this.oauthHandlers.generateSessionToken(refreshedSession.userId);
        
        // Update cookie
        this.setSessionCookie(res, newSessionToken);

        res.json({
          success: true,
          expiresAt: refreshedSession.expiresAt
        });
      } catch (error: any) {
        this.logger.error('Session refresh failed', { error: error.message });
        res.status(500).json({
          error: 'Session refresh failed'
        });
      }
    });

    // Logout
    this.router.post('/auth/logout', async (req: Request, res: Response) => {
      try {
        const sessionToken = this.getSessionToken(req);
        
        if (sessionToken) {
          await this.oauthHandlers.revokeSession(sessionToken);
        }

        // Clear cookie
        res.clearCookie('session_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          domain: process.env.NODE_ENV === 'production' ? '.sherlock-omega.com' : undefined
        });

        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      } catch (error: any) {
        this.logger.error('Logout failed', { error: error.message });
        res.status(500).json({
          error: 'Logout failed'
        });
      }
    });

    // ========================================================================
    // Admin Routes
    // ========================================================================

    // Get session statistics (admin only)
    this.router.get('/auth/admin/stats', this.requireAuth, this.requireAdmin, async (req: Request, res: Response) => {
      try {
        const stats = this.oauthHandlers.getSessionStats();
        res.json({
          success: true,
          stats
        });
      } catch (error: any) {
        this.logger.error('Failed to get session stats', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve statistics'
        });
      }
    });

    // Revoke user sessions (admin only)
    this.router.post('/auth/admin/revoke/:userId', this.requireAuth, this.requireAdmin, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const revokedCount = await this.oauthHandlers.revokeAllUserSessions(userId);
        
        res.json({
          success: true,
          message: `Revoked ${revokedCount} sessions for user ${userId}`,
          revokedCount
        });
      } catch (error: any) {
        this.logger.error('Failed to revoke user sessions', { error: error.message, userId: req.params.userId });
        res.status(500).json({
          error: 'Failed to revoke sessions'
        });
      }
    });

    // ========================================================================
    // Health Check
    // ========================================================================

    this.router.get('/auth/health', (req: Request, res: Response) => {
      const stats = this.oauthHandlers.getSessionStats();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        sessions: stats
      });
    });
  }

  // ============================================================================
  // Middleware
  // ============================================================================

  private requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionToken = this.getSessionToken(req);
      
      if (!sessionToken) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
      }

      const session = await this.oauthHandlers.validateSession(sessionToken);
      
      if (!session) {
        return res.status(401).json({
          error: 'Invalid or expired session',
          code: 'INVALID_SESSION'
        });
      }

      req.session = session;
      next();
    } catch (error: any) {
      this.logger.error('Authentication middleware failed', { error: error.message });
      res.status(500).json({
        error: 'Authentication verification failed'
      });
    }
  };

  private requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session?.permissions.includes('admin:all')) {
      return res.status(403).json({
        error: 'Administrator access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getSessionToken(req: Request): string | null {
    // Try cookie first
    const cookieToken = req.cookies?.session_token;
    if (cookieToken) return cookieToken;

    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private setSessionCookie(res: Response, sessionToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: isProduction ? '.sherlock-omega.com' : undefined,
      path: '/'
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getRouter(): express.Router {
    return this.router;
  }

  getOAuthHandlers(): OAuthHandlers {
    return this.oauthHandlers;
  }
}

// Express middleware factory
export function createAuthMiddleware(config: OAuthConfig): {
  router: express.Router;
  authHandlers: OAuthHandlers;
} {
  const authRoutes = new AuthRoutes(config);
  return {
    router: authRoutes.getRouter(),
    authHandlers: authRoutes.getOAuthHandlers()
  };
}

export default AuthRoutes;