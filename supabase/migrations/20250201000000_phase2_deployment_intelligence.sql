-- ModelForge Phase 2: Deployment Intelligence Layer Migration
-- Schema Version: 2.0.0

-- 1. Compute Passports Table
CREATE TABLE IF NOT EXISTS public.compute_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL,
    revision TEXT NOT NULL DEFAULT 'main',
    hf_url TEXT NOT NULL,
    architecture TEXT NOT NULL,
    parameters_billions NUMERIC(6, 2) NOT NULL,
    context_window INTEGER NOT NULL,
    license TEXT NOT NULL,
    gated BOOLEAN NOT NULL DEFAULT false,
    compatibility JSONB NOT NULL DEFAULT '{}'::jsonb,
    memory_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    coverage JSONB NOT NULL DEFAULT '{}'::jsonb,
    deployment_profiles JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    confidence_explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (model_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_compute_passports_model_rev ON public.compute_passports(model_id, revision);

-- 2. Workload Fingerprints Table (Privacy-Preserving)
CREATE TABLE IF NOT EXISTS public.workload_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    task_type TEXT NOT NULL,
    prompt_token_mean INTEGER NOT NULL,
    output_token_mean INTEGER NOT NULL,
    context_length_target INTEGER NOT NULL,
    target_concurrency INTEGER NOT NULL DEFAULT 1,
    requests_per_day INTEGER NOT NULL DEFAULT 50000,
    streaming_required BOOLEAN NOT NULL DEFAULT true,
    arrival_pattern TEXT NOT NULL DEFAULT 'bursty',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Deployment Plans Table (Immutable Finalized Topologies)
CREATE TABLE IF NOT EXISTS public.deployment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    schema_version TEXT NOT NULL DEFAULT '2.0.0',
    model_repository TEXT NOT NULL,
    model_revision TEXT NOT NULL,
    workload_fingerprint JSONB NOT NULL,
    slo_specification JSONB NOT NULL,
    recommended_candidate JSONB NOT NULL,
    alternative_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_manifests JSONB NOT NULL,
    is_immutable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deployment_plans_model ON public.deployment_plans(model_repository, model_revision);

-- 4. Software Lift Metrics Table
CREATE TABLE IF NOT EXISTS public.software_lift_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accelerator TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_revision TEXT NOT NULL DEFAULT 'main',
    precision TEXT NOT NULL,
    context_length INTEGER NOT NULL,
    baseline_runtime TEXT NOT NULL DEFAULT 'transformers',
    baseline_tps NUMERIC(8, 2) NOT NULL,
    comparisons JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Benchmark Reproductions Table
CREATE TABLE IF NOT EXISTS public.benchmark_reproductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_benchmark_id UUID NOT NULL REFERENCES public.benchmarks(id) ON DELETE CASCADE,
    reproduction_benchmark_id UUID NOT NULL REFERENCES public.benchmarks(id) ON DELETE CASCADE,
    throughput_delta_percent NUMERIC(6, 2) NOT NULL,
    ttft_delta_percent NUMERIC(6, 2) NOT NULL,
    vram_delta_bytes BIGINT NOT NULL,
    verified_match BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Failure Intelligence Table
CREATE TABLE IF NOT EXISTS public.failure_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_repository TEXT NOT NULL,
    model_revision TEXT NOT NULL,
    runtime TEXT NOT NULL,
    accelerator TEXT NOT NULL,
    failure_category TEXT NOT NULL CHECK (failure_category IN (
        'OUT_OF_MEMORY',
        'UNSUPPORTED_ARCHITECTURE',
        'RUNTIME_ERROR',
        'BUILD_FAILURE',
        'DRIVER_INCOMPATIBILITY',
        'MODEL_LOAD_FAILURE',
        'TIMEOUT',
        'INVALID_CONFIGURATION',
        'QUANTIZATION_FAILURE',
        'UNKNOWN'
    )),
    normalized_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.compute_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workload_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_lift_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_reproductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_records ENABLE ROW LEVEL SECURITY;

-- Public can read passports, software lift, reproductions, failure records
CREATE POLICY "Public read compute passports" ON public.compute_passports FOR SELECT USING (true);
CREATE POLICY "Public read software lift" ON public.software_lift_metrics FOR SELECT USING (true);
CREATE POLICY "Public read benchmark reproductions" ON public.benchmark_reproductions FOR SELECT USING (true);
CREATE POLICY "Public read failure records" ON public.failure_records FOR SELECT USING (true);

-- Workload fingerprints and deployment plans: organization isolation
CREATE POLICY "Org members read deployment plans" ON public.deployment_plans
    FOR SELECT USING (org_id IS NULL OR is_org_member(org_id));
CREATE POLICY "Org members write deployment plans" ON public.deployment_plans
    FOR INSERT WITH CHECK (org_id IS NULL OR is_org_member(org_id));
