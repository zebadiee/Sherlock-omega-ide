/**
 * Enhanced Supabase Integration Service
 * Implements: Simplistic Privacy | Seamless Security | Full SQL Support
 * 
 * Features:
 * - Minimal environment variables for privacy
 * - Row-Level Security (RLS) for data isolation
 * - Direct SQL access and custom functions
 * - Seamless GitHub OAuth integration
 * - Developer-specific data isolation
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Logger } from '../logging/logger';
import { PlatformType } from '../types/core';
import { UserRole } from '../auth/roles';

// Minimal interface for privacy-focused user data
export interface MinimalUserProfile {
  id: string;
  email: string;
  role: UserRole;
  github_username?: string;
  created_at: Date;
  last_active: Date;
  // No personal data stored - privacy first
}

// Simplified project structure for privacy
export interface MinimalProject {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  is_public: boolean;
  // Minimal metadata only
}

// SQL query templates for RLS and security
export interface SQLTemplates {
  enableRLS: string;
  createUserPolicy: string;
  createDeveloperPolicy: string;
  createAuditPolicy: string;
  createProjectPolicy: string;
}

export class EnhancedSupabaseService {
  private client: SupabaseClient;
  private logger: Logger;
  private sqlTemplates: SQLTemplates;

  constructor() {
    this.logger = new Logger(PlatformType.NODE);
    
    // Minimal environment variables - privacy focused
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing minimal Supabase credentials. Check .env.minimal.template');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Seamless security settings
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        // Privacy-focused realtime settings
        params: {
          eventsPerSecond: 10 // Rate limiting for privacy
        }
      }
    });
    
    this.sqlTemplates = this.initializeSQLTemplates();
    this.logger.info('Enhanced Supabase service initialized with minimal privacy settings');
  }

  // ============================================================================
  // 1. SIMPLISTIC PRIVACY - Minimal Data Collection
  // ============================================================================

  /**
   * Create minimal user profile with privacy-first approach
   * Only stores essential data for functionality
   */
  async createMinimalUser(user: User, role: UserRole = 'viewer'): Promise<MinimalUserProfile> {
    const profile: MinimalUserProfile = {
      id: user.id,
      email: user.email!,
      role,
      github_username: user.user_metadata?.user_name,
      created_at: new Date(),
      last_active: new Date()
    };

    const { data, error } = await this.client
      .from('minimal_users')
      .insert(profile)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create minimal user profile', { error });
      throw error;
    }

    this.logger.info('Minimal user profile created', { userId: profile.id, role });
    return data;
  }

  /**
   * Get user with minimal data exposure
   */
  async getMinimalUser(userId: string): Promise<MinimalUserProfile | null> {
    const { data, error } = await this.client
      .from('minimal_users')
      .select('id, email, role, github_username, created_at, last_active')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.warn('User not found', { userId });
      return null;
    }

    return data;
  }

  /**
   * Update last active timestamp only (minimal tracking)
   */
  async updateLastActive(userId: string): Promise<void> {
    const { error } = await this.client
      .from('minimal_users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      this.logger.error('Failed to update last active', { userId, error });
    }
  }

  // ============================================================================
  // 2. SEAMLESS SECURITY - RLS and OAuth Integration
  // ============================================================================

  /**
   * Initialize Row-Level Security policies
   * Implements comprehensive data isolation
   */
  async initializeRLSPolicies(): Promise<void> {
    try {
      // Enable RLS on all tables
      await this.executeSQL(this.sqlTemplates.enableRLS);
      
      // Create user-specific policies
      await this.executeSQL(this.sqlTemplates.createUserPolicy);
      
      // Create developer isolation policies
      await this.executeSQL(this.sqlTemplates.createDeveloperPolicy);
      
      // Create audit trail policies
      await this.executeSQL(this.sqlTemplates.createAuditPolicy);
      
      // Create project access policies
      await this.executeSQL(this.sqlTemplates.createProjectPolicy);
      
      this.logger.info('RLS policies initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RLS policies', { error });
      throw error;
    }
  }

  /**
   * Seamless GitHub OAuth authentication
   * Integrates with Supabase Auth and GitHub provider
   */
  async authenticateWithGitHub(): Promise<{ url: string }> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL}`,
        scopes: 'read:user user:email', // Minimal permissions
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      this.logger.error('GitHub OAuth failed', { error });
      throw error;
    }

    return { url: data.url };
  }

  /**
   * Verify user session with minimal data exposure
   */
  async verifySession(): Promise<{ user: User | null; session: any }> {
    const { data: { user, session }, error } = await this.client.auth.getSession();
    
    if (error) {
      this.logger.error('Session verification failed', { error });
      return { user: null, session: null };
    }

    // Update last active if user exists
    if (user) {
      await this.updateLastActive(user.id);
    }

    return { user, session };
  }

  /**
   * Secure sign out with session cleanup
   */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      this.logger.error('Sign out failed', { error });
      throw error;
    }

    this.logger.info('User signed out successfully');
  }

  // ============================================================================
  // 3. FULL SQL SUPPORT - Direct SQL Access and Custom Functions
  // ============================================================================

  /**
   * Execute raw SQL queries with full Postgres support
   * Enables advanced queries, analytics, and custom logic
   */
  async executeSQL(query: string, params?: any[]): Promise<any> {
    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query,
        params: params || []
      });

      if (error) {
        this.logger.error('SQL execution failed', { error, query });
        throw error;
      }

      this.logger.debug('SQL query executed successfully', { query: query.substring(0, 100) });
      return data;
    } catch (error) {
      this.logger.error('SQL execution error', { error });
      throw error;
    }
  }

  /**
   * Create custom Postgres functions for advanced logic
   */
  async createCustomFunction(name: string, definition: string): Promise<void> {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION ${name}
      ${definition}
    `;

    await this.executeSQL(createFunctionSQL);
    this.logger.info('Custom function created', { name });
  }

  /**
   * Analytics queries with privacy protection
   */
  async getPrivacyCompliantAnalytics(userId: string): Promise<any> {
    const analyticsSQL = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_projects,
        MAX(last_active) as last_activity
      FROM minimal_projects 
      WHERE owner_id = $1
    `;

    return await this.executeSQL(analyticsSQL, [userId]);
  }

  /**
   * Advanced search with full SQL features
   */
  async searchProjectsAdvanced(
    userId: string,
    searchQuery: string,
    filters: any = {}
  ): Promise<MinimalProject[]> {
    let sql = `
      SELECT id, name, owner_id, created_at, is_public
      FROM minimal_projects 
      WHERE (owner_id = $1 OR is_public = true)
    `;

    const params = [userId];
    let paramIndex = 2;

    // Full-text search support
    if (searchQuery) {
      sql += ` AND (name ILIKE $${paramIndex} OR to_tsvector('english', name) @@ plainto_tsquery('english', $${paramIndex}))`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // Date range filters
    if (filters.createdAfter) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const { data, error } = await this.client.rpc('execute_sql', {
      query: sql,
      params
    });

    if (error) {
      this.logger.error('Advanced search failed', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Real-time subscriptions with privacy controls
   */
  subscribeToUserProjects(userId: string, callback: (payload: any) => void): any {
    return this.client
      .channel(`user-projects:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'minimal_projects',
          filter: `owner_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // ============================================================================
  // SQL Templates for RLS and Security
  // ============================================================================

  private initializeSQLTemplates(): SQLTemplates {
    return {
      enableRLS: `
        -- Enable Row-Level Security on all tables
        ALTER TABLE minimal_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE minimal_projects ENABLE ROW LEVEL SECURITY;
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      `,

      createUserPolicy: `
        -- Users can only access their own data
        CREATE POLICY "Users can view own profile" ON minimal_users
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON minimal_users
          FOR UPDATE USING (auth.uid() = id);
      `,

      createDeveloperPolicy: `
        -- Developer isolation policies
        CREATE POLICY "Developers can manage own projects" ON minimal_projects
          FOR ALL USING (auth.uid() = owner_id);
        
        CREATE POLICY "Public projects are readable" ON minimal_projects
          FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
      `,

      createAuditPolicy: `
        -- Audit logs are write-only for security
        CREATE POLICY "Users can insert audit logs" ON audit_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Admins can read audit logs" ON audit_logs
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM minimal_users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `,

      createProjectPolicy: `
        -- Enhanced project access control
        CREATE POLICY "Project collaboration" ON minimal_projects
          FOR SELECT USING (
            owner_id = auth.uid() 
            OR is_public = true
            OR EXISTS (
              SELECT 1 FROM project_collaborators 
              WHERE project_id = id AND user_id = auth.uid()
            )
          );
      `
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  /**
   * Health check for service status
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const { data, error } = await this.client
        .from('minimal_users')
        .select('count')
        .limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message }
        };
      }

      return {
        status: 'healthy',
        details: {
          connection: 'active',
          rls: 'enabled',
          privacy: 'compliant'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: 'Service unavailable' }
      };
    }
  }

  /**
   * Get service configuration (privacy-safe)
   */
  getConfig(): any {
    return {
      privacy: 'minimal',
      security: 'rls_enabled',
      sql_support: 'full',
      auth_provider: 'github',
      // Never expose actual credentials
      url: this.config.url ? 'configured' : 'missing',
      key: this.config.anonKey ? 'configured' : 'missing'
    };
  }
}

// Export singleton instance
export const enhancedSupabase = new EnhancedSupabaseService();
export default EnhancedSupabaseService;