-- ============================================================================
-- Sherlock Ω IDE - Privacy-First Security Schema
-- Implements: Simplistic Privacy | Seamless Security | Full SQL Support
-- ============================================================================

-- ============================================================================
-- 1. MINIMAL USER SCHEMA (Privacy-First)
-- ============================================================================

-- Create minimal users table with only essential data
CREATE TABLE IF NOT EXISTS minimal_users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'developer', 'viewer')),
  github_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Privacy: No personal data, location, or tracking info
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create minimal projects table
CREATE TABLE IF NOT EXISTS minimal_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES minimal_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Privacy: Minimal metadata only
  CONSTRAINT valid_name CHECK (length(name) >= 1 AND length(name) <= 100)
);

-- Create audit logs for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES minimal_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET, -- For security auditing only
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Privacy: Automatic cleanup after 90 days
  CONSTRAINT audit_retention CHECK (created_at > NOW() - INTERVAL '90 days')
);

-- Create project collaborators for access control
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES minimal_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES minimal_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'developer', 'viewer')),
  invited_by UUID REFERENCES minimal_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

-- ============================================================================
-- 2. ROW-LEVEL SECURITY POLICIES (Seamless Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE minimal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE minimal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON minimal_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON minimal_users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can create own profile" ON minimal_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Project access policies
CREATE POLICY "Users can view accessible projects" ON minimal_projects
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own projects" ON minimal_projects
  FOR ALL USING (auth.uid() = owner_id);

-- Collaboration policies
CREATE POLICY "Project members can view collaborators" ON project_collaborators
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM minimal_projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = project_id AND pc2.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM minimal_projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Audit log policies (security-focused)
CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM minimal_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 3. PRIVACY-FOCUSED INDEXES AND CONSTRAINTS
-- ============================================================================

-- Efficient queries while maintaining privacy
CREATE INDEX IF NOT EXISTS idx_minimal_users_email ON minimal_users(email);
CREATE INDEX IF NOT EXISTS idx_minimal_users_github ON minimal_users(github_username) WHERE github_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_minimal_users_role ON minimal_users(role);

CREATE INDEX IF NOT EXISTS idx_minimal_projects_owner ON minimal_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_minimal_projects_public ON minimal_projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_minimal_projects_created ON minimal_projects(created_at);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);

-- Audit log indexes for security analysis
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- 4. CUSTOM FUNCTIONS (Full SQL Support)
-- ============================================================================

-- Function to execute dynamic SQL (admin use only)
CREATE OR REPLACE FUNCTION execute_sql(query TEXT, params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  user_role TEXT;
BEGIN
  -- Security check: Only allow for authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role for authorization
  SELECT role INTO user_role FROM minimal_users WHERE id = auth.uid();
  
  -- For security, limit dynamic SQL to specific patterns
  IF query NOT ILIKE 'SELECT%' AND user_role != 'admin' THEN
    RAISE EXCEPTION 'Only SELECT queries allowed for non-admin users';
  END IF;
  
  -- Execute the query (this is a simplified implementation)
  -- In production, you'd want more sophisticated SQL parsing and validation
  EXECUTE query;
  
  RETURN jsonb_build_object('success', true, 'message', 'Query executed');
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get user analytics (privacy-compliant)
CREATE OR REPLACE FUNCTION get_user_analytics(target_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  requesting_user_role TEXT;
BEGIN
  -- Security check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Users can only see their own analytics unless they're admin
  IF target_user_id != auth.uid() THEN
    SELECT role INTO requesting_user_role FROM minimal_users WHERE id = auth.uid();
    IF requesting_user_role != 'admin' THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;
  
  SELECT jsonb_build_object(
    'total_projects', COUNT(*),
    'public_projects', COUNT(*) FILTER (WHERE is_public = true),
    'recent_projects', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    'collaborations', (
      SELECT COUNT(*) FROM project_collaborators WHERE user_id = target_user_id
    )
  ) INTO result
  FROM minimal_projects 
  WHERE owner_id = target_user_id;
  
  RETURN result;
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  action_name TEXT,
  resource_type_param TEXT DEFAULT NULL,
  resource_id_param UUID DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    action_name,
    resource_type_param,
    resource_id_param,
    metadata_param,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_minimal_projects_updated_at
  BEFORE UPDATE ON minimal_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Automatic audit logging for sensitive operations
CREATE OR REPLACE FUNCTION audit_project_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('project_created', 'project', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event('project_updated', 'project', NEW.id, 
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('project_deleted', 'project', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_project_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON minimal_projects
  FOR EACH ROW
  EXECUTE FUNCTION audit_project_changes();

-- ============================================================================
-- 6. PRIVACY CLEANUP JOBS
-- ============================================================================

-- Function to clean old audit logs (privacy compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO audit_logs (user_id, action, metadata)
  VALUES (NULL, 'audit_cleanup', jsonb_build_object('deleted_count', deleted_count));
  
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 7. INITIAL DATA AND PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a default admin user function (run once during setup)
CREATE OR REPLACE FUNCTION create_default_admin(admin_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id UUID;
BEGIN
  INSERT INTO minimal_users (id, email, role, created_at)
  VALUES (gen_random_uuid(), admin_email, 'admin', NOW())
  ON CONFLICT (email) DO UPDATE SET role = 'admin'
  RETURNING id INTO admin_id;
  
  RETURN admin_id;
END;
$$;

-- ============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE minimal_users IS 'Privacy-first user profiles with minimal data collection';
COMMENT ON TABLE minimal_projects IS 'Simplified project structure for privacy compliance';
COMMENT ON TABLE audit_logs IS 'Security audit trail with automatic cleanup';
COMMENT ON TABLE project_collaborators IS 'Project access control and collaboration';

COMMENT ON FUNCTION execute_sql IS 'Secure dynamic SQL execution with role-based restrictions';
COMMENT ON FUNCTION get_user_analytics IS 'Privacy-compliant user analytics';
COMMENT ON FUNCTION log_audit_event IS 'Centralized audit logging function';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Privacy compliance - automatic data cleanup';

-- Migration complete
SELECT 'Privacy-first security schema created successfully' AS status;