-- ====================================================================================
-- ModelForge Phase 5: Autonomous Inference Control Plane & Closed-Loop Execution Migration
-- ====================================================================================

-- 1. Inference Deployments (Managed Desired & Actual States)
CREATE TABLE IF NOT EXISTS public.inference_deployments (
    deployment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    revision TEXT NOT NULL DEFAULT 'main',
    runtime TEXT NOT NULL,
    runtime_version TEXT NOT NULL,
    deployment_target TEXT NOT NULL DEFAULT 'kubernetes',
    accelerator TEXT NOT NULL,
    accelerator_count INT NOT NULL DEFAULT 1,
    replicas INT NOT NULL DEFAULT 1,
    tensor_parallelism INT NOT NULL DEFAULT 1,
    pipeline_parallelism INT NOT NULL DEFAULT 1,
    prefill_workers INT,
    decode_workers INT,
    health TEXT NOT NULL DEFAULT 'healthy',
    deployment_version INT NOT NULL DEFAULT 1,
    traffic_split JSONB NOT NULL DEFAULT '{"active_pct": 100, "candidate_pct": 0, "shadow_enabled": false}',
    desired_spec JSONB NOT NULL,
    last_known_good_spec JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Automation Policies (Org-level guardrails, blast radius, execution modes)
CREATE TABLE IF NOT EXISTS public.automation_policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'default-policy',
    mode TEXT NOT NULL DEFAULT 'advisory',
    requirements JSONB NOT NULL DEFAULT '{"minimum_confidence": 85, "minimum_reproductions": 1, "predictions_allowed": true, "prediction_max_uncertainty_percent": 20}',
    changes JSONB NOT NULL DEFAULT '{"allow": ["change_replica_count", "update_autoscaling"], "approval_required": ["change_runtime", "change_model_revision", "change_gpu_count", "change_precision", "change_dynamo_topology"], "deny": []}',
    blast_radius JSONB NOT NULL DEFAULT '{"max_canary_percent": 50, "max_gpu_change": 8, "max_spend_usd_hour": 100, "max_simultaneous_actions": 2}',
    economics JSONB NOT NULL DEFAULT '{"minimum_projected_savings_percent": 5}',
    slo JSONB NOT NULL DEFAULT '{"max_p95_regression_percent": 3}',
    maintenance_windows JSONB NOT NULL DEFAULT '[]',
    freeze_windows JSONB NOT NULL DEFAULT '[]',
    allowed_regions TEXT[] NOT NULL DEFAULT ARRAY['us-east-1', 'us-west-2', 'eu-west-1'],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optimization Actions (Immutable change action contracts with SHA-256 hash)
CREATE TABLE IF NOT EXISTS public.optimization_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT 'default',
    deployment_id UUID NOT NULL REFERENCES public.inference_deployments(deployment_id) ON DELETE CASCADE,
    recommendation_id UUID,
    action_type TEXT NOT NULL,
    execution_mode TEXT NOT NULL DEFAULT 'advisory',
    current_spec JSONB NOT NULL,
    target_spec JSONB NOT NULL,
    reason TEXT NOT NULL,
    evidence JSONB NOT NULL,
    policy_evaluation JSONB NOT NULL,
    estimated_cost_delta_usd_month NUMERIC NOT NULL,
    estimated_p95_latency_delta_pct NUMERIC NOT NULL,
    estimated_capacity_delta_pct NUMERIC NOT NULL,
    risk JSONB NOT NULL,
    blast_radius JSONB NOT NULL,
    rollback_plan JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    action_hash TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1
);

-- 4. Canary Runs (Progressive delivery execution and stage evaluations)
CREATE TABLE IF NOT EXISTS public.canary_runs (
    canary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.optimization_actions(action_id) ON DELETE CASCADE,
    deployment_id UUID NOT NULL,
    organization_id TEXT NOT NULL,
    current_stage_index INT NOT NULL DEFAULT 0,
    total_stages INT NOT NULL,
    active_traffic_percent NUMERIC NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'warming',
    stage_metrics JSONB NOT NULL DEFAULT '[]',
    failure_reason TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. Production Outcomes (Verified post-change outcomes feeding model learning)
CREATE TABLE IF NOT EXISTS public.production_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.optimization_actions(action_id) ON DELETE CASCADE,
    deployment_id UUID NOT NULL,
    organization_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    before_metrics JSONB NOT NULL,
    after_metrics JSONB NOT NULL,
    observation_window_hours NUMERIC NOT NULL DEFAULT 24,
    slo_delta_pct NUMERIC NOT NULL,
    cost_delta_usd_month NUMERIC NOT NULL,
    quality_delta_pct NUMERIC NOT NULL DEFAULT 0,
    capacity_delta_pct NUMERIC NOT NULL DEFAULT 0,
    rollback_occurred BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Automation Freezes (Emergency kill switch and maintenance freeze records)
CREATE TABLE IF NOT EXISTS public.automation_freezes (
    freeze_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'global',
    target_id TEXT,
    reason TEXT NOT NULL,
    frozen_by TEXT NOT NULL,
    frozen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active'
);

-- 7. Control Audit Logs (Immutable mutation history)
CREATE TABLE IF NOT EXISTS public.control_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    action_id UUID,
    actor JSONB NOT NULL,
    event_type TEXT NOT NULL,
    action_hash TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inference_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canary_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_freezes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "inference_deployments_tenant_isolation" ON public.inference_deployments
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "automation_policies_tenant_isolation" ON public.automation_policies
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "optimization_actions_tenant_isolation" ON public.optimization_actions
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "canary_runs_tenant_isolation" ON public.canary_runs
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "production_outcomes_tenant_isolation" ON public.production_outcomes
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "automation_freezes_tenant_isolation" ON public.automation_freezes
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "control_audit_logs_tenant_isolation" ON public.control_audit_logs
    FOR ALL USING (is_org_member(organization_id));
