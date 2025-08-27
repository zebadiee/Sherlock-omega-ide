/**
 * Sherlock Ω IDE - Enhanced Supabase Integration Examples
 * Ready-to-use TypeScript code for: Simplistic Privacy | Seamless Security | Full SQL Support
 * 
 * This file provides practical examples of how to use the enhanced Supabase service
 * with minimal environment variables, RLS security, and full SQL capabilities.
 */

import { enhancedSupabase, MinimalUserProfile, MinimalProject } from '../integration/enhanced-supabase-service';
import { UserRole } from '../auth/roles';

// ============================================================================
// 1. SIMPLISTIC PRIVACY - Minimal Data Examples
// ============================================================================

/**
 * Example: User registration with minimal data collection
 * Only collects essential information for functionality
 */
export async function registerUserMinimal(email: string, githubUsername?: string): Promise<MinimalUserProfile> {
  try {
    // Authenticate with GitHub OAuth (minimal permissions)
    const { url } = await enhancedSupabase.authenticateWithGitHub();
    
    // In a real app, you'd redirect to this URL and handle the callback
    console.log('Redirect to GitHub OAuth:', url);
    
    // After OAuth callback, create minimal user profile
    const currentUser = await enhancedSupabase.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication failed');
    }
    
    const profile = await enhancedSupabase.createMinimalUser(currentUser, 'developer');
    
    console.log('✅ User registered with minimal data:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      // No personal data logged
    });
    
    return profile;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    throw error;
  }
}

/**
 * Example: Get user information with privacy protection
 * Returns only essential data, no tracking or personal information
 */
export async function getUserMinimal(userId: string): Promise<MinimalUserProfile | null> {
  try {
    const profile = await enhancedSupabase.getMinimalUser(userId);
    
    if (!profile) {
      console.log('User not found or access denied');
      return null;
    }
    
    // Privacy: Only log non-sensitive information
    console.log('✅ User data retrieved (privacy-compliant):', {
      role: profile.role,
      github_username: profile.github_username,
      // Email and ID not logged for privacy
    });
    
    return profile;
  } catch (error) {
    console.error('❌ Failed to get user:', error);
    return null;
  }
}

/**
 * Example: Update user activity with minimal tracking
 * Only updates timestamp, no location or behavior tracking
 */
export async function trackUserActivity(userId: string): Promise<void> {
  try {
    await enhancedSupabase.updateLastActive(userId);
    console.log('✅ Activity updated (minimal tracking)');
  } catch (error) {
    console.error('❌ Failed to update activity:', error);
  }
}

// ============================================================================
// 2. SEAMLESS SECURITY - RLS and OAuth Examples
// ============================================================================

/**
 * Example: Secure authentication flow with GitHub OAuth
 * Demonstrates seamless integration with Supabase Auth
 */
export async function authenticateSecurely(): Promise<{ user: any; session: any }> {
  try {
    // Initialize RLS policies if not already done
    await enhancedSupabase.initializeRLSPolicies();
    console.log('✅ RLS policies initialized');
    
    // Verify current session
    const { user, session } = await enhancedSupabase.verifySession();
    
    if (user) {
      console.log('✅ User authenticated securely:', {
        id: user.id,
        email: user.email,
        // Session details not logged for security
      });
      
      // Update activity with minimal tracking
      await trackUserActivity(user.id);
    } else {
      console.log('No active session - authentication required');
    }
    
    return { user, session };
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

/**
 * Example: Secure project creation with RLS protection
 * Demonstrates data isolation and access control
 */
export async function createSecureProject(name: string, isPublic: boolean = false): Promise<MinimalProject> {
  try {
    const { user } = await enhancedSupabase.verifySession();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Create project with RLS protection
    const projectData = {
      name,
      owner_id: user.id,
      is_public: isPublic,
      created_at: new Date(),
    };
    
    // This would use the RLS-protected table
    const project = await enhancedSupabase.client
      .from('minimal_projects')
      .insert(projectData)
      .select()
      .single();
    
    if (project.error) {
      throw project.error;
    }
    
    console.log('✅ Secure project created:', {
      id: project.data.id,
      name: project.data.name,
      owner: user.id,
      public: isPublic
    });
    
    return project.data;
  } catch (error) {
    console.error('❌ Failed to create project:', error);
    throw error;
  }
}

/**
 * Example: Secure sign out with session cleanup
 */
export async function signOutSecurely(): Promise<void> {
  try {
    await enhancedSupabase.signOut();
    console.log('✅ Signed out securely');
  } catch (error) {
    console.error('❌ Sign out failed:', error);
    throw error;
  }
}

// ============================================================================
// 3. FULL SQL SUPPORT - Advanced Query Examples
// ============================================================================

/**
 * Example: Advanced SQL query with full Postgres features
 * Demonstrates direct SQL access while maintaining security
 */
export async function runAdvancedAnalytics(userId: string): Promise<any> {
  try {
    // Complex SQL query with joins, aggregations, and window functions
    const analyticsQuery = `
      WITH project_stats AS (
        SELECT 
          owner_id,
          COUNT(*) as total_projects,
          COUNT(CASE WHEN is_public THEN 1 END) as public_projects,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_projects,
          MAX(created_at) as latest_project,
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as project_rank
        FROM minimal_projects
        WHERE owner_id = $1
        GROUP BY owner_id
      ),
      collaboration_stats AS (
        SELECT 
          user_id,
          COUNT(*) as collaborations,
          COUNT(DISTINCT project_id) as unique_projects
        FROM project_collaborators
        WHERE user_id = $1
        GROUP BY user_id
      )
      SELECT 
        ps.total_projects,
        ps.public_projects,
        ps.recent_projects,
        ps.latest_project,
        ps.project_rank,
        COALESCE(cs.collaborations, 0) as collaborations,
        COALESCE(cs.unique_projects, 0) as collaboration_projects,
        -- Privacy-compliant calculated fields
        CASE 
          WHEN ps.total_projects > 10 THEN 'high'
          WHEN ps.total_projects > 5 THEN 'medium'
          ELSE 'low'
        END as activity_level
      FROM project_stats ps
      LEFT JOIN collaboration_stats cs ON ps.owner_id = cs.user_id
    `;
    
    const result = await enhancedSupabase.executeSQL(analyticsQuery, [userId]);
    
    console.log('✅ Advanced analytics completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Analytics query failed:', error);
    throw error;
  }
}

/**
 * Example: Custom Postgres function usage
 * Demonstrates server-side logic with full SQL capabilities
 */
export async function getPrivacyCompliantAnalytics(userId: string): Promise<any> {
  try {
    // Use the custom function defined in our migration
    const analytics = await enhancedSupabase.executeSQL(
      'SELECT * FROM get_user_analytics($1)',
      [userId]
    );
    
    console.log('✅ Privacy-compliant analytics:', analytics);
    return analytics;
  } catch (error) {
    console.error('❌ Analytics function failed:', error);
    throw error;
  }
}

/**
 * Example: Full-text search with SQL
 * Demonstrates advanced search capabilities
 */
export async function searchProjectsWithSQL(
  userId: string, 
  searchQuery: string,
  filters: { isPublic?: boolean; createdAfter?: Date } = {}
): Promise<MinimalProject[]> {
  try {
    const results = await enhancedSupabase.searchProjectsAdvanced(userId, searchQuery, filters);
    
    console.log(`✅ Found ${results.length} projects matching search:`, {
      query: searchQuery,
      filters,
      // Results not logged for privacy
    });
    
    return results;
  } catch (error) {
    console.error('❌ Search failed:', error);
    throw error;
  }
}

/**
 * Example: Real-time subscriptions with privacy controls
 * Demonstrates live updates with data isolation
 */
export async function setupRealtimeProjectUpdates(userId: string): Promise<any> {
  try {
    const subscription = enhancedSupabase.subscribeToUserProjects(userId, (payload) => {
      console.log('📡 Real-time project update:', {
        eventType: payload.eventType,
        table: payload.table,
        // Actual data not logged for privacy
      });
      
      // Handle the update in your UI
      handleProjectUpdate(payload);
    });
    
    console.log('✅ Real-time subscription created');
    return subscription;
  } catch (error) {
    console.error('❌ Real-time setup failed:', error);
    throw error;
  }
}

// ============================================================================
// 4. UTILITY EXAMPLES - Practical Implementation
// ============================================================================

/**
 * Example: Complete user authentication flow
 * Combines all features: privacy, security, and SQL
 */
export async function completeAuthFlow(): Promise<{ success: boolean; user?: MinimalUserProfile }> {
  try {
    console.log('🔄 Starting complete authentication flow...');
    
    // 1. Verify session (seamless security)
    const { user } = await authenticateSecurely();
    
    if (!user) {
      // 2. Redirect to GitHub OAuth (minimal permissions)
      const { url } = await enhancedSupabase.authenticateWithGitHub();
      console.log('🔗 Redirect to GitHub:', url);
      return { success: false };
    }
    
    // 3. Get or create minimal user profile (simplistic privacy)
    let profile = await enhancedSupabase.getMinimalUser(user.id);
    if (!profile) {
      profile = await enhancedSupabase.createMinimalUser(user, 'developer');
    }
    
    // 4. Get privacy-compliant analytics (full SQL support)
    const analytics = await getPrivacyCompliantAnalytics(user.id);
    
    console.log('✅ Authentication flow completed successfully');
    return { success: true, user: profile };
  } catch (error) {
    console.error('❌ Authentication flow failed:', error);
    return { success: false };
  }
}

/**
 * Example: Health check for the entire system
 * Validates privacy, security, and SQL features
 */
export async function performSystemHealthCheck(): Promise<{ status: string; details: any }> {
  try {
    console.log('🔍 Performing system health check...');
    
    // 1. Check service health
    const serviceHealth = await enhancedSupabase.healthCheck();
    
    // 2. Verify configuration
    const config = enhancedSupabase.getConfig();
    
    // 3. Test SQL capabilities
    const sqlTest = await enhancedSupabase.executeSQL('SELECT NOW() as current_time');
    
    const healthReport = {
      service: serviceHealth,
      config,
      sql: sqlTest ? 'operational' : 'failed',
      timestamp: new Date().toISOString()
    };
    
    const overallStatus = serviceHealth.status === 'healthy' && sqlTest ? 'healthy' : 'unhealthy';
    
    console.log(`✅ System health check completed: ${overallStatus}`);
    return { status: overallStatus, details: healthReport };
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { status: 'unhealthy', details: { error: error.message } };
  }
}

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Handle real-time project updates in your UI
 */
function handleProjectUpdate(payload: any): void {
  // Implement your UI update logic here
  console.log('🔄 Handling project update...', payload.eventType);
  
  // Example: Update project list in React component
  // setProjects(prev => updateProjectInList(prev, payload));
}

/**
 * Example usage in a React component or CLI
 */
export async function exampleUsage(): Promise<void> {
  console.log('🚀 Sherlock Ω IDE - Enhanced Supabase Examples');
  console.log('==============================================');
  
  try {
    // Complete authentication flow
    const authResult = await completeAuthFlow();
    
    if (authResult.success && authResult.user) {
      // Create a secure project
      await createSecureProject('My Quantum Algorithm', false);
      
      // Run privacy-compliant analytics
      await getPrivacyCompliantAnalytics(authResult.user.id);
      
      // Search projects with advanced SQL
      await searchProjectsWithSQL(authResult.user.id, 'quantum');
      
      // Setup real-time updates
      await setupRealtimeProjectUpdates(authResult.user.id);
    }
    
    // Perform health check
    await performSystemHealthCheck();
    
  } catch (error) {
    console.error('❌ Example usage failed:', error);
  }
}

// Export all examples for easy import
export default {
  // Privacy examples
  registerUserMinimal,
  getUserMinimal,
  trackUserActivity,
  
  // Security examples
  authenticateSecurely,
  createSecureProject,
  signOutSecurely,
  
  // SQL examples
  runAdvancedAnalytics,
  getPrivacyCompliantAnalytics,
  searchProjectsWithSQL,
  setupRealtimeProjectUpdates,
  
  // Utility examples
  completeAuthFlow,
  performSystemHealthCheck,
  exampleUsage
};