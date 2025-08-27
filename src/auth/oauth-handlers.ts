/**
 * OAuth Authentication Handlers
 * Secure OAuth callback handling for GitHub and Supabase
 * 
 * Features:
 * - Enterprise-grade security with CSRF protection
 * - Session management and token handling
 * - Automatic user provisioning and sync
 * - Robust error handling and logging
 */

import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { PlatformType } from '../types/core';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export interface OAuthConfig {
  github: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionTimeout: number; // hours
    csrfTokenExpiry: number; // minutes
  };
}

export interface AuthSession {
  userId: string;
  email: string;
  username: string;
  provider: 'github' | 'supabase';
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  permissions: string[];
  metadata: any;
}

export interface OAuthState {
  csrf: string;
  redirectUrl?: string;
  provider: 'github' | 'supabase';
  timestamp: number;
}

export class OAuthHandlers {
  private config: OAuthConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private supabase: any;
  private activeSessions: Map<string, AuthSession> = new Map();
  private csrfTokens: Map<string, number> = new Map();

  constructor(config: OAuthConfig) {
    this.config = config;
    this.logger = new Logger(PlatformType.NODE);
    this.performanceMonitor = new PerformanceMonitor(PlatformType.NODE);

    // Initialize Supabase client
    this.supabase = createClient(config.supabase.url, config.supabase.anonKey);

    // Clean up expired tokens periodically
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000); // Every 5 minutes

    this.logger.info('OAuth handlers initialized');
  }

  // ============================================================================
  // GitHub OAuth Flow
  // ============================================================================

  async initiateGitHubAuth(redirectUrl?: string): Promise<{ authUrl: string; state: string }> {
    return this.performanceMonitor.timeAsync('github-auth-initiate', async () => {
      // Generate CSRF token
      const csrf = this.generateCSRFToken();
      const state: OAuthState = {
        csrf,
        redirectUrl,
        provider: 'github',
        timestamp: Date.now()
      };

      const stateToken = this.encryptState(state);

      // Build GitHub OAuth URL
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', this.config.github.clientId);
      authUrl.searchParams.set('redirect_uri', this.config.github.redirectUri);
      authUrl.searchParams.set('scope', 'read:user user:email repo');
      authUrl.searchParams.set('state', stateToken);
      authUrl.searchParams.set('allow_signup', 'true');

      this.logger.info('GitHub OAuth initiated', { csrf, redirectUrl });

      return {
        authUrl: authUrl.toString(),
        state: stateToken
      };
    });
  }

  async handleGitHubCallback(code: string, state: string): Promise<AuthSession> {
    return this.performanceMonitor.timeAsync('github-auth-callback', async () => {
      // Validate state and CSRF
      const decodedState = this.decryptState(state);
      this.validateCSRFToken(decodedState.csrf);

      if (decodedState.provider !== 'github') {
        throw new Error('Invalid OAuth provider in state');
      }

      // Exchange code for access token
      const tokenResponse = await this.exchangeGitHubCode(code);
      
      // Get user information
      const octokit = new Octokit({ auth: tokenResponse.access_token });
      const { data: githubUser } = await octokit.users.getAuthenticated();
      const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();

      const primaryEmail = emails.find(email => email.primary)?.email || githubUser.email;

      // Create or update user in Supabase
      const user = await this.provisionGitHubUser(githubUser, primaryEmail, tokenResponse);

      // Create session
      const session = await this.createSession(user, 'github', tokenResponse, {
        github_id: githubUser.id,
        github_username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        github_profile: githubUser
      });

      this.logger.info('GitHub authentication successful', { 
        userId: session.userId,
        username: session.username 
      });

      return session;
    });
  }

  private async exchangeGitHubCode(code: string): Promise<any> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.github.clientId,
        client_secret: this.config.github.clientSecret,
        code
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return data;
  }

  private async provisionGitHubUser(githubUser: any, email: string, tokens: any): Promise<any> {
    // Check if user already exists
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('*')
      .eq('github_username', githubUser.login)
      .single();

    if (existingUser) {
      // Update existing user
      await this.supabase
        .from('users')
        .update({
          email: email,
          full_name: githubUser.name || githubUser.login,
          avatar_url: githubUser.avatar_url,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      return existingUser;
    } else {
      // Create new user
      const newUser = {
        email: email,
        username: githubUser.login,
        full_name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
        github_username: githubUser.login,
        organization: githubUser.company,
        role: 'developer',
        subscription_tier: 'free'
      };

      const { data: createdUser, error } = await this.supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }

      return createdUser;
    }
  }

  // ============================================================================
  // Supabase OAuth Flow
  // ============================================================================

  async initiateSupabaseAuth(provider: 'github' | 'google' = 'github', redirectUrl?: string): Promise<{ authUrl: string; state: string }> {
    return this.performanceMonitor.timeAsync('supabase-auth-initiate', async () => {
      const csrf = this.generateCSRFToken();
      const state: OAuthState = {
        csrf,
        redirectUrl,
        provider: 'supabase',
        timestamp: Date.now()
      };

      const stateToken = this.encryptState(state);

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${this.config.github.redirectUri.replace('/github', '/supabase')}?state=${stateToken}`,
          scopes: provider === 'github' ? 'read:user user:email repo' : undefined
        }
      });

      if (error) {
        throw new Error(`Supabase OAuth initiation failed: ${error.message}`);
      }

      this.logger.info('Supabase OAuth initiated', { provider, csrf, redirectUrl });

      return {
        authUrl: data.url!,
        state: stateToken
      };
    });
  }

  async handleSupabaseCallback(accessToken: string, refreshToken: string, state?: string): Promise<AuthSession> {
    return this.performanceMonitor.timeAsync('supabase-auth-callback', async () => {
      // Validate state if provided
      if (state) {
        const decodedState = this.decryptState(state);
        this.validateCSRFToken(decodedState.csrf);
      }

      // Set the session
      const { data, error } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        throw new Error(`Supabase session error: ${error.message}`);
      }

      const user = data.user;
      if (!user) {
        throw new Error('No user data returned from Supabase');
      }

      // Get or create user profile
      const userProfile = await this.getOrCreateSupabaseUserProfile(user);

      // Create session
      const session = await this.createSession(userProfile, 'supabase', {
        access_token: accessToken,
        refresh_token: refreshToken
      }, {
        supabase_id: user.id,
        provider: user.app_metadata.provider,
        provider_id: user.user_metadata.sub
      });

      this.logger.info('Supabase authentication successful', { 
        userId: session.userId,
        username: session.username 
      });

      return session;
    });
  }

  private async getOrCreateSupabaseUserProfile(user: any): Promise<any> {
    const { data: existingProfile } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update last active
      await this.supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);

      return existingProfile;
    } else {
      // Profile should be auto-created by trigger, but let's ensure it exists
      const profile = {
        id: user.id,
        email: user.email,
        username: user.user_metadata.user_name || user.email.split('@')[0],
        full_name: user.user_metadata.full_name || user.user_metadata.name || '',
        avatar_url: user.user_metadata.avatar_url,
        github_username: user.user_metadata.user_name,
        role: 'developer',
        subscription_tier: 'free'
      };

      const { data: createdProfile, error } = await this.supabase
        .from('users')
        .upsert(profile)
        .select()
        .single();

      if (error) {
        this.logger.warn('Failed to upsert user profile', { error: error.message });
        // Return a minimal profile if database operation fails
        return profile;
      }

      return createdProfile;
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  private async createSession(user: any, provider: 'github' | 'supabase', tokens: any, metadata: any): Promise<AuthSession> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + (this.config.security.sessionTimeout * 60 * 60 * 1000));

    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      username: user.username,
      provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      permissions: this.getUserPermissions(user),
      metadata
    };

    // Store session
    this.activeSessions.set(sessionId, session);

    // Create session record in database
    await this.supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        device_info: metadata.device_info || {},
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent,
        expires_at: expiresAt.toISOString()
      });

    // Track analytics
    await this.trackAuthenticationEvent(session, 'login');

    return session;
  }

  async validateSession(sessionToken: string): Promise<AuthSession | null> {
    try {
      const decoded = jwt.verify(sessionToken, this.config.security.jwtSecret) as any;
      const session = this.activeSessions.get(decoded.sessionId);

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  async refreshSession(sessionToken: string): Promise<AuthSession | null> {
    const session = await this.validateSession(sessionToken);
    if (!session || !session.refreshToken) {
      return null;
    }

    try {
      if (session.provider === 'supabase') {
        const { data, error } = await this.supabase.auth.refreshSession({
          refresh_token: session.refreshToken
        });

        if (error) {
          this.logger.error('Session refresh failed', { error: error.message });
          return null;
        }

        // Update session with new tokens
        session.accessToken = data.session.access_token;
        session.refreshToken = data.session.refresh_token;
        session.expiresAt = new Date(Date.now() + (this.config.security.sessionTimeout * 60 * 60 * 1000));

        return session;
      }
      // GitHub tokens don't expire, so just extend session
      session.expiresAt = new Date(Date.now() + (this.config.security.sessionTimeout * 60 * 60 * 1000));
      return session;
    } catch (error: any) {
      this.logger.error('Session refresh error', { error: error.message });
      return null;
    }
  }

  async revokeSession(sessionToken: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(sessionToken, this.config.security.jwtSecret) as any;
      const session = this.activeSessions.get(decoded.sessionId);

      if (session) {
        // Track logout
        await this.trackAuthenticationEvent(session, 'logout');

        // Remove from active sessions
        this.activeSessions.delete(decoded.sessionId);

        // Update database
        await this.supabase
          .from('user_sessions')
          .delete()
          .eq('id', decoded.sessionId);

        // Revoke external tokens if needed
        if (session.provider === 'supabase') {
          await this.supabase.auth.signOut();
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Security Utilities
  // ============================================================================

  private generateCSRFToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.csrfTokens.set(token, Date.now());
    return token;
  }

  private validateCSRFToken(token: string): void {
    const timestamp = this.csrfTokens.get(token);
    if (!timestamp) {
      throw new Error('Invalid CSRF token');
    }

    const age = Date.now() - timestamp;
    const maxAge = this.config.security.csrfTokenExpiry * 60 * 1000;

    if (age > maxAge) {
      this.csrfTokens.delete(token);
      throw new Error('CSRF token expired');
    }

    // Token is valid, remove it (one-time use)
    this.csrfTokens.delete(token);
  }

  private encryptState(state: OAuthState): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.config.security.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(state), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptState(encryptedState: string): OAuthState {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.config.security.encryptionKey);
      let decrypted = decipher.update(encryptedState, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch {
      throw new Error('Invalid or corrupted state parameter');
    }
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getUserPermissions(user: any): string[] {
    const basePermissions = ['read:profile', 'write:profile'];
    
    switch (user.role) {
      case 'admin':
        return [...basePermissions, 'admin:all', 'read:all', 'write:all'];
      case 'developer':
        return [...basePermissions, 'read:projects', 'write:projects', 'execute:quantum'];
      case 'researcher':
        return [...basePermissions, 'read:projects', 'read:research', 'execute:quantum'];
      case 'student':
        return [...basePermissions, 'read:tutorials', 'execute:basic'];
      default:
        return basePermissions;
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    const maxAge = this.config.security.csrfTokenExpiry * 60 * 1000;

    for (const [token, timestamp] of this.csrfTokens.entries()) {
      if (now - timestamp > maxAge) {
        this.csrfTokens.delete(token);
      }
    }

    // Clean up expired sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < new Date()) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  private async trackAuthenticationEvent(session: AuthSession, event: 'login' | 'logout'): Promise<void> {
    try {
      await this.supabase
        .from('usage_analytics')
        .insert({
          user_id: session.userId,
          event: `auth_${event}`,
          properties: {
            provider: session.provider,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error: any) {
      this.logger.error('Failed to track auth event', { error: error.message });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  generateSessionToken(sessionId: string): string {
    return jwt.sign({ sessionId }, this.config.security.jwtSecret, {
      expiresIn: `${this.config.security.sessionTimeout}h`
    });
  }

  async getActiveSessionsForUser(userId: string): Promise<AuthSession[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    let revokedCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
        revokedCount++;
      }
    }

    // Clean up database
    await this.supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    return revokedCount;
  }

  getSessionStats(): any {
    const now = new Date();
    const sessions = Array.from(this.activeSessions.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.expiresAt > now).length,
      expiredSessions: sessions.filter(s => s.expiresAt <= now).length,
      providerBreakdown: {
        github: sessions.filter(s => s.provider === 'github').length,
        supabase: sessions.filter(s => s.provider === 'supabase').length
      }
    };
  }
}

export default OAuthHandlers;