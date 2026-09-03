-- ModelForge Phase 4: Distributed Benchmark Network, Fleet Intelligence & FinOps Migration
-- Schema Version: 4.0.0

-- 1. Workers Table (Secure Distributed Worker Registration)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trust_tier TEXT NOT NULL CHECK (trust_tier IN ('untrusted', 'community', 'trusted', 'organization', 'managed', 'attested')),
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'busy', 'offline', 'draining')),
    capabilities JSONB NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_jobs_completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workers_trust_status ON public.workers(trust_tier, status);
CREATE INDEX IF NOT EXISTS idx_workers_org ON public.workers(organization_id);

-- 2. Benchmark Jobs Queue Table
CREATE TABLE IF NOT EXISTS public.benchmark_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_repository TEXT NOT NULL,
    model_revision TEXT NOT NULL DEFAULT 'main',
    runtime TEXT NOT NULL,
    runtime_version TEXT NOT NULL DEFAULT 'latest',
    precision TEXT NOT NULL,
    workload JSONB NOT NULL,
    required_trust_tier TEXT NOT NULL DEFAULT 'community' CHECK (required_trust_tier IN ('untrusted', 'community', 'trusted', 'organization', 'managed', 'attested')),
    target_device TEXT,
    resource_limits JSONB NOT NULL DEFAULT '{"timeout_s": 900, "max_gpus": 1}'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'running', 'uploading', 'validating', 'completed', 'failed', 'canceled', 'timed_out', 'retryable')),
    assigned_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    result_benchmark_id UUID REFERENCES public.benchmarks(id) ON DELETE SET NULL,
    error_message TEXT,
    priority_score INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_jobs_status_priority ON public.benchmark_jobs(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_jobs_org ON public.benchmark_jobs(organization_id);

-- 3. Enterprise Fleet Resources Table
CREATE TABLE IF NOT EXISTS public.fleet_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    device TEXT NOT NULL,
    device_count INTEGER NOT NULL CHECK (device_count > 0),
    vram_bytes_per_device BIGINT NOT NULL CHECK (vram_bytes_per_device > 0),
    interconnect TEXT NOT NULL DEFAULT 'pcie',
    region TEXT NOT NULL DEFAULT 'us-east-1',
    hourly_cost_usd NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    is_reserved BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'maintenance')),
    allocated_workload_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fleet_resources_org ON public.fleet_resources(organization_id);

-- 4. Production Deployments Table
CREATE TABLE IF NOT EXISTS public.production_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workload_name TEXT NOT NULL,
    model_repository TEXT NOT NULL,
    model_revision TEXT NOT NULL DEFAULT 'main',
    accelerator TEXT NOT NULL,
    device_count INTEGER NOT NULL DEFAULT 1,
    runtime TEXT NOT NULL,
    precision TEXT NOT NULL,
    replica_count INTEGER NOT NULL DEFAULT 1,
    expected_metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_deployments_org ON public.production_deployments(organization_id);

-- 5. Telemetry Windows Table (Aggregated performance - zero raw prompt storage)
CREATE TABLE IF NOT EXISTS public.telemetry_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES public.production_deployments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    p95_ttft_ms NUMERIC(10, 2) NOT NULL,
    mean_tpot_ms NUMERIC(10, 2) NOT NULL,
    actual_throughput_tok_s NUMERIC(10, 2) NOT NULL,
    mean_concurrency NUMERIC(6, 2) NOT NULL,
    error_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    gpu_utilization_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_cost_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_windows_dep_time ON public.telemetry_windows(deployment_id, window_start);
CREATE INDEX IF NOT EXISTS idx_telemetry_windows_org ON public.telemetry_windows(organization_id);

-- 6. Drift Events Table
CREATE TABLE IF NOT EXISTS public.drift_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES public.production_deployments(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('normal', 'watch', 'action_recommended', 'critical')),
    ttft_delta_pct NUMERIC(8, 2) NOT NULL,
    tpot_delta_pct NUMERIC(8, 2) NOT NULL,
    throughput_delta_pct NUMERIC(8, 2) NOT NULL,
    cost_delta_pct NUMERIC(8, 2) NOT NULL,
    slo_attainment_pct NUMERIC(5, 2) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    suggested_action TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drift_events_dep ON public.drift_events(deployment_id);

-- 7. Optimization Recommendations Table
CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES public.production_deployments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    current_config JSONB NOT NULL,
    recommended_config JSONB NOT NULL,
    projected_monthly_savings_usd NUMERIC(10, 2) NOT NULL,
    projected_p95_latency_improvement_pct NUMERIC(6, 2) NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    evidence_summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready_for_review' CHECK (status IN ('draft', 'ready_for_review', 'approved', 'rejected', 'superseded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by TEXT,
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_opt_recommendations_org ON public.optimization_recommendations(organization_id);

-- 8. Verified Savings Table
CREATE TABLE IF NOT EXISTS public.verified_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.optimization_recommendations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    baseline_monthly_cost_usd NUMERIC(10, 2) NOT NULL,
    observed_monthly_cost_usd NUMERIC(10, 2) NOT NULL,
    verified_monthly_savings_usd NUMERIC(10, 2) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    observation_days INTEGER NOT NULL DEFAULT 30
);

CREATE INDEX IF NOT EXISTS idx_verified_savings_org ON public.verified_savings(organization_id);

-- Enable Row Level Security (RLS) on all Phase 4 tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_savings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public workers readable by all, private by org members"
    ON public.workers FOR SELECT
    USING (organization_id IS NULL OR is_org_member(organization_id));

CREATE POLICY "Benchmark jobs readable by public community or tenant org"
    ON public.benchmark_jobs FOR SELECT
    USING (organization_id IS NULL OR is_org_member(organization_id));

CREATE POLICY "Fleet resources tenant isolated"
    ON public.fleet_resources FOR ALL
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Deployments tenant isolated"
    ON public.production_deployments FOR ALL
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Telemetry windows tenant isolated"
    ON public.telemetry_windows FOR ALL
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Recommendations tenant isolated"
    ON public.optimization_recommendations FOR ALL
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Verified savings tenant isolated"
    ON public.verified_savings FOR ALL
    USING (is_org_member(organization_id))
    WITH CHECK (is_org_member(organization_id));
