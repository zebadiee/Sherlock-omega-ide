/**
 * GitHubAuthManager - Secure GitHub authentication and token management
 * Handles OAuth flow, token storage, and secure credential management
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface GitHubCredentials {
  username: string;
  token: string;
  scopes: string[];
  expiresAt?: Date;
}

export interface GitHubAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  useDeviceFlow: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: GitHubUser;
  rateLimit?: RateLimit;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  company?: string;
  location?: string;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export class GitHubAuthManager extends EventEmitter {
  private credentials: GitHubCredentials | null = null;
  private config: GitHubAuthConfig;
  private encryptionKey: Buffer;
  private authState: AuthState = { isAuthenticated: false };

  constructor(config: GitHubAuthConfig) {
    super();
    this.config = config;
    this.encryptionKey = this.generateEncryptionKey();
    this.loadStoredCredentials();
  }

  /**
   * Initiate GitHub OAuth authentication
   */
  async authenticate(): Promise<AuthState> {
    try {
      if (this.config.useDeviceFlow) {
        return await this.authenticateWithDeviceFlow();
      } else {
        return await this.authenticateWithOAuth();
      }
    } catch (error) {
      this.emit('auth:error', error);
      throw error;
    }
  }

  /**
   * GitHub Device Flow authentication (recommended for desktop apps)
   */
  private async authenticateWithDeviceFlow(): Promise<AuthState> {
    // Step 1: Request device and user codes
    const deviceCodeResponse = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' ')
      })
    });

    const deviceData = await deviceCodeResponse.json();
    
    if (!deviceCodeResponse.ok) {
      throw new Error(`Device flow initiation failed: ${deviceData.error_description}`);
    }

    // Step 2: Show user the verification URL and code
    this.emit('auth:device-flow', {
      verification_uri: deviceData.verification_uri,
      user_code: deviceData.user_code,
      expires_in: deviceData.expires_in
    });

    // Step 3: Poll for access token
    const accessToken = await this.pollForAccessToken(
      deviceData.device_code,
      deviceData.interval || 5
    );

    // Step 4: Get user information and complete authentication
    return await this.completeAuthentication(accessToken);
  }

  /**
   * Traditional OAuth flow authentication
   */
  private async authenticateWithOAuth(): Promise<AuthState> {
    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('state', state);

    this.emit('auth:oauth-url', authUrl.toString());

    // This would typically be handled by a callback server or electron main process
    throw new Error('OAuth flow requires callback handling - use device flow for CLI applications');
  }

  /**
   * Poll GitHub for access token during device flow
   */
  private async pollForAccessToken(deviceCode: string, interval: number): Promise<string> {
    const maxAttempts = 100; // Prevent infinite polling
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      attempts++;

      try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });

        const data = await response.json();

        if (data.access_token) {
          return data.access_token;
        }

        if (data.error === 'authorization_pending') {
          continue; // Keep polling
        }

        if (data.error === 'slow_down') {
          interval += 5; // Increase polling interval
          continue;
        }

        if (data.error === 'expired_token' || data.error === 'access_denied') {
          throw new Error(`Authentication failed: ${data.error_description}`);
        }

      } catch (error) {
        if (attempts >= maxAttempts) {
          throw new Error('Authentication timeout - please try again');
        }
        // Continue polling on network errors
      }
    }

    throw new Error('Authentication timeout - maximum attempts exceeded');
  }

  /**
   * Complete authentication process with access token
   */
  private async completeAuthentication(accessToken: string): Promise<AuthState> {
    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sherlock-Omega-IDE/1.0.0'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const user: GitHubUser = await userResponse.json();

    // Get rate limit information
    const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sherlock-Omega-IDE/1.0.0'
      }
    });

    const rateLimitData = await rateLimitResponse.json();
    const rateLimit: RateLimit = {
      limit: rateLimitData.rate.limit,
      remaining: rateLimitData.rate.remaining,
      reset: new Date(rateLimitData.rate.reset * 1000),
      used: rateLimitData.rate.used
    };

    // Store credentials securely
    this.credentials = {
      username: user.login,
      token: accessToken,
      scopes: this.config.scopes
    };

    this.authState = {
      isAuthenticated: true,
      user,
      rateLimit
    };

    await this.storeCredentials();
    this.emit('auth:success', this.authState);

    return this.authState;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get stored credentials (for API calls)
   */
  getCredentials(): GitHubCredentials | null {
    return this.credentials ? { ...this.credentials } : null;
  }

  /**
   * Logout and clear stored credentials
   */
  async logout(): Promise<void> {
    this.credentials = null;
    this.authState = { isAuthenticated: false };
    await this.clearStoredCredentials();
    this.emit('auth:logout');
  }

  /**
   * Refresh authentication state and rate limits
   */
  async refreshAuthState(): Promise<AuthState> {
    if (!this.credentials) {
      return this.authState;
    }

    try {
      // Check if token is still valid and get updated rate limits
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Sherlock-Omega-IDE/1.0.0'
        }
      });

      if (response.ok) {
        const rateLimitData = await response.json();
        this.authState.rateLimit = {
          limit: rateLimitData.rate.limit,
          remaining: rateLimitData.rate.remaining,
          reset: new Date(rateLimitData.rate.reset * 1000),
          used: rateLimitData.rate.used
        };
      } else if (response.status === 401) {
        // Token is invalid, logout
        await this.logout();
      }
    } catch (error) {
      console.warn('Failed to refresh auth state:', error);
    }

    return this.authState;
  }

  /**
   * Generate encryption key for credential storage
   */
  private generateEncryptionKey(): Buffer {
    // In a real implementation, this should be derived from system keychain
    // or user-specific entropy. For demo purposes, using a simple approach.
    const keyMaterial = process.env.SHERLOCK_ENCRYPTION_KEY || 'sherlock-omega-default-key';
    return crypto.scryptSync(keyMaterial, 'salt', 32);
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Store credentials securely
   */
  private async storeCredentials(): Promise<void> {
    if (!this.credentials) return;

    try {
      const credentialsJson = JSON.stringify(this.credentials);
      const encrypted = this.encrypt(credentialsJson);
      
      // Store in system keychain or secure storage
      // For demo purposes, using environment variable
      process.env.SHERLOCK_GITHUB_CREDENTIALS = encrypted;
      
      // In production, use system keychain:
      // await keytar.setPassword('sherlock-omega', 'github-credentials', encrypted);
    } catch (error) {
      console.error('Failed to store credentials:', error);
    }
  }

  /**
   * Load stored credentials
   */
  private async loadStoredCredentials(): Promise<void> {
    try {
      // Load from system keychain or secure storage
      const encrypted = process.env.SHERLOCK_GITHUB_CREDENTIALS;
      
      // In production, use system keychain:
      // const encrypted = await keytar.getPassword('sherlock-omega', 'github-credentials');
      
      if (encrypted) {
        const credentialsJson = this.decrypt(encrypted);
        this.credentials = JSON.parse(credentialsJson);
        
        if (this.credentials) {
          // Verify credentials are still valid
          await this.refreshAuthState();
        }
      }
    } catch (error) {
      console.warn('Failed to load stored credentials:', error);
      await this.clearStoredCredentials();
    }
  }

  /**
   * Clear stored credentials
   */
  private async clearStoredCredentials(): Promise<void> {
    try {
      delete process.env.SHERLOCK_GITHUB_CREDENTIALS;
      
      // In production, use system keychain:
      // await keytar.deletePassword('sherlock-omega', 'github-credentials');
    } catch (error) {
      console.error('Failed to clear stored credentials:', error);
    }
  }

  /**
   * Validate required scopes
   */
  validateScopes(requiredScopes: string[]): boolean {
    if (!this.credentials) return false;
    
    return requiredScopes.every(scope => 
      this.credentials!.scopes.includes(scope)
    );
  }

  /**
   * Check if rate limit allows for API calls
   */
  canMakeApiCall(callsNeeded: number = 1): boolean {
    if (!this.authState.rateLimit) return true;
    return this.authState.rateLimit.remaining >= callsNeeded;
  }

  /**
   * Get time until rate limit reset
   */
  getRateLimitResetTime(): number {
    if (!this.authState.rateLimit) return 0;
    return Math.max(0, this.authState.rateLimit.reset.getTime() - Date.now());
  }
}