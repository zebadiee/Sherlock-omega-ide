-- Sherlock Ω IDE - Database Schema
-- Supabase Migration: Initial Schema Setup
-- Run this in your Supabase SQL editor or via CLI: supabase migration new initial_schema

-- ============================================================================
-- Enable necessary extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- Users and Authentication
-- ============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    github_username VARCHAR(255),
    organization VARCHAR(255),
    role VARCHAR(20) DEFAULT 'developer' CHECK (role IN ('admin', 'developer', 'researcher', 'student')),
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "editor_settings": {
            "font_size": 14,
            "tab_size": 2,
            "word_wrap": true,
            "line_numbers": true
        },
        "quantum_settings": {
            "default_backend": "simulator",
            "visualization_mode": "circuit"
        },
        "ai_settings": {
            "preferred_model": "gpt-4",
            "auto_suggestions": true,
            "context_awareness": true
        },
        "notifications": {
            "email": true,
            "push": false,
            "collaboration": true,
            "builds": true
        }
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for tracking active sessions
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Project Management
-- ============================================================================

-- Projects table
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    github_repo VARCHAR(255),
    project_type VARCHAR(20) DEFAULT 'fullstack' CHECK (project_type IN ('quantum', 'ai', 'fullstack', 'research')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'organization')),
    settings JSONB DEFAULT '{
        "language": "typescript",
        "frameworks": [],
        "quantum_backend": "simulator",
        "ai_models": ["gpt-4"],
        "auto_deploy": false,
        "testing_enabled": true,
        "collaboration_enabled": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members (many-to-many relationship)
CREATE TABLE public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Project files
CREATE TABLE public.project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    content TEXT,
    language VARCHAR(50),
    size INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, path)
);

-- ============================================================================
-- Quantum Computing
-- ============================================================================

-- Quantum circuits
CREATE TABLE public.quantum_circuits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    circuit_data JSONB NOT NULL, -- QASM or circuit definition
    algorithm_type VARCHAR(100),
    qubit_count INTEGER NOT NULL CHECK (qubit_count > 0),
    gate_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    fidelity DECIMAL(5,4) CHECK (fidelity >= 0 AND fidelity <= 1),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quantum simulation results
CREATE TABLE public.quantum_simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    circuit_id UUID REFERENCES public.quantum_circuits(id) ON DELETE CASCADE,
    backend VARCHAR(100) NOT NULL,
    shots INTEGER DEFAULT 1024 CHECK (shots > 0),
    parameters JSONB,
    results JSONB NOT NULL,
    execution_time INTEGER, -- milliseconds
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AI Integration
-- ============================================================================

-- AI conversation history
CREATE TABLE public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    context TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI models registry
CREATE TABLE public.ai_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    capabilities JSONB DEFAULT '[]'::jsonb,
    pricing JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Real-time Collaboration
-- ============================================================================

-- Live collaboration sessions
CREATE TABLE public.live_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    host_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    participants JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Collaboration events (cursor movements, edits, etc.)
CREATE TABLE public.collaboration_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('cursor', 'edit', 'selection', 'chat')),
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments and annotations
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    thread_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    line_number INTEGER,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Analytics and Monitoring
-- ============================================================================

-- Usage analytics
CREATE TABLE public.usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(50),
    tags JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logging
CREATE TABLE public.error_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Automation and CI/CD
-- ============================================================================

-- Automation rules
CREATE TABLE public.automation_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Build jobs
CREATE TABLE public.build_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    commit_sha VARCHAR(255),
    branch VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failure', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    logs TEXT
);

-- Deployment logs
CREATE TABLE public.deployment_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    environment VARCHAR(50) NOT NULL,
    version VARCHAR(100),
    status VARCHAR(20) DEFAULT 'deploying' CHECK (status IN ('deploying', 'success', 'failure', 'rolled_back')),
    deployed_by UUID REFERENCES public.users(id),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_github_username ON public.users(github_username);
CREATE INDEX idx_users_last_active ON public.users(last_active);

-- Project indexes
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_type ON public.projects(project_type);
CREATE INDEX idx_projects_visibility ON public.projects(visibility);
CREATE INDEX idx_projects_updated ON public.projects(updated_at);

-- Project member indexes
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);

-- File indexes
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_files_path ON public.project_files(project_id, path);

-- Quantum indexes
CREATE INDEX idx_quantum_circuits_project ON public.quantum_circuits(project_id);
CREATE INDEX idx_quantum_circuits_algorithm ON public.quantum_circuits(algorithm_type);
CREATE INDEX idx_quantum_simulations_circuit ON public.quantum_simulations(circuit_id);

-- AI indexes
CREATE INDEX idx_ai_conversations_project ON public.ai_conversations(project_id);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);

-- Collaboration indexes
CREATE INDEX idx_live_sessions_project ON public.live_sessions(project_id);
CREATE INDEX idx_collaboration_events_session ON public.collaboration_events(session_id);
CREATE INDEX idx_collaboration_events_timestamp ON public.collaboration_events(timestamp);

-- Analytics indexes
CREATE INDEX idx_usage_analytics_user ON public.usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_event ON public.usage_analytics(event);
CREATE INDEX idx_usage_analytics_timestamp ON public.usage_analytics(timestamp);
CREATE INDEX idx_performance_metrics_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp);

-- Build and deployment indexes
CREATE INDEX idx_build_jobs_project ON public.build_jobs(project_id);
CREATE INDEX idx_build_jobs_status ON public.build_jobs(status);
CREATE INDEX idx_deployment_logs_project ON public.deployment_logs(project_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_logs ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

-- Project policies
CREATE POLICY "Users can view projects they are members of" ON public.projects 
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
        OR visibility = 'public'
    );

CREATE POLICY "Project owners can update projects" ON public.projects 
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create projects" ON public.projects 
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Project member policies
CREATE POLICY "Users can view project members for their projects" ON public.project_members 
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- File policies
CREATE POLICY "Users can access files for their projects" ON public.project_files 
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Quantum circuit policies
CREATE POLICY "Users can access quantum circuits for their projects" ON public.quantum_circuits 
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- AI conversation policies
CREATE POLICY "Users can access their AI conversations" ON public.ai_conversations 
    FOR ALL USING (
        user_id = auth.uid()
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Analytics policies (users can only see their own data)
CREATE POLICY "Users can view their own analytics" ON public.usage_analytics 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON public.usage_analytics 
    FOR INSERT WITH CHECK (true);

-- Error log policies
CREATE POLICY "Users can view their own errors" ON public.error_logs 
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can insert error logs" ON public.error_logs 
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON public.project_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantum_circuits_updated_at BEFORE UPDATE ON public.quantum_circuits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, full_name, avatar_url, github_username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'user_name'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default AI models
INSERT INTO public.ai_models (name, provider, version, capabilities, pricing, enabled) VALUES
('GPT-4', 'OpenAI', '1.0', '["text-generation", "code-completion", "analysis"]', '{"input": 0.03, "output": 0.06}', true),
('GPT-3.5-Turbo', 'OpenAI', '1.0', '["text-generation", "code-completion"]', '{"input": 0.001, "output": 0.002}', true),
('Claude-3', 'Anthropic', '1.0', '["text-generation", "analysis", "reasoning"]', '{"input": 0.015, "output": 0.075}', true),
('CodeLlama', 'Meta', '1.0', '["code-completion", "code-generation"]', '{"input": 0.0, "output": 0.0}', true);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for project overview with member count
CREATE VIEW public.project_overview AS
SELECT 
    p.*,
    u.username as owner_username,
    COUNT(pm.user_id) as member_count
FROM public.projects p
JOIN public.users u ON p.owner_id = u.id
LEFT JOIN public.project_members pm ON p.id = pm.project_id
GROUP BY p.id, u.username;

-- View for user project access
CREATE VIEW public.user_project_access AS
SELECT 
    pm.user_id,
    p.*,
    pm.role,
    pm.joined_at
FROM public.project_members pm
JOIN public.projects p ON pm.project_id = p.id;

-- Grant permissions for views
GRANT SELECT ON public.project_overview TO authenticated;
GRANT SELECT ON public.user_project_access TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.projects IS 'IDE projects with quantum and AI capabilities';
COMMENT ON TABLE public.quantum_circuits IS 'Quantum circuits and algorithms';
COMMENT ON TABLE public.ai_conversations IS 'AI chat and assistance history';
COMMENT ON TABLE public.live_sessions IS 'Real-time collaboration sessions';
COMMENT ON TABLE public.usage_analytics IS 'User behavior and feature usage tracking';
COMMENT ON TABLE public.performance_metrics IS 'System performance monitoring';
COMMENT ON TABLE public.automation_rules IS 'CI/CD and workflow automation rules';

COMMENT ON COLUMN public.users.preferences IS 'JSON object containing user preferences for UI, quantum, and AI settings';
COMMENT ON COLUMN public.projects.settings IS 'JSON object containing project configuration and preferences';
COMMENT ON COLUMN public.quantum_circuits.circuit_data IS 'JSON representation of quantum circuit (QASM or gate definitions)';
COMMENT ON COLUMN public.ai_conversations.messages IS 'JSON array of conversation messages with role, content, and metadata';

-- ============================================================================
-- Completion
-- ============================================================================

-- Create a function to verify schema setup
CREATE OR REPLACE FUNCTION public.verify_schema_setup()
RETURNS TABLE (
    table_name text,
    row_count bigint,
    has_rls boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        (SELECT count(*) FROM pg_class WHERE relname = tablename) as row_count,
        rowsecurity as has_rls
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_schema_setup() TO authenticated;

SELECT 'Sherlock Ω IDE Database Schema Setup Complete!' as status;