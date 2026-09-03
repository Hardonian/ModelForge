-- ModelForge Multi-Tenant Database Schema with Row Level Security (RLS)
-- Version: 1.0.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
CREATE TYPE verification_status AS ENUM ('unverified', 'community', 'reproduced', 'verified');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE benchmark_runtime AS ENUM ('vllm', 'tensorrt-llm', 'llama.cpp', 'sglang', 'tgi', 'transformers', 'simulation');
CREATE TYPE accelerator_vendor AS ENUM ('nvidia', 'amd', 'apple', 'intel', 'cpu', 'other');

-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier subscription_tier NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Organization Memberships
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 4. API Keys (Hashed at rest)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of the raw token
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Hardware Registry (Public Catalog)
CREATE TABLE hardware (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    vendor accelerator_vendor NOT NULL,
    category VARCHAR(50) NOT NULL,
    architecture VARCHAR(100) NOT NULL,
    vram_bytes BIGINT NOT NULL CHECK (vram_bytes > 0),
    memory_bandwidth_gb_s NUMERIC(8, 2) NOT NULL,
    tdp_watts INTEGER NOT NULL,
    fp16_tflops NUMERIC(8, 2),
    bf16_tflops NUMERIC(8, 2),
    fp8_tflops NUMERIC(8, 2),
    int8_tops NUMERIC(8, 2),
    interconnect VARCHAR(50) NOT NULL,
    supported_precisions TEXT[] NOT NULL,
    supported_runtimes TEXT[] NOT NULL,
    release_year INTEGER NOT NULL,
    typical_cloud_cost_per_hour_usd NUMERIC(8, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Model Intelligence (Public Catalog)
CREATE TABLE models (
    id VARCHAR(128) PRIMARY KEY, -- e.g. "Qwen/Qwen2.5-32B-Instruct"
    provider VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    family VARCHAR(100) NOT NULL,
    parameters_billions NUMERIC(6, 2) NOT NULL,
    architecture VARCHAR(100) NOT NULL,
    context_window INTEGER NOT NULL,
    layers INTEGER NOT NULL,
    kv_heads INTEGER NOT NULL,
    head_dim INTEGER NOT NULL,
    vocab_size INTEGER NOT NULL,
    default_dtype VARCHAR(20) NOT NULL,
    task VARCHAR(50) NOT NULL,
    license VARCHAR(100) NOT NULL,
    gated BOOLEAN NOT NULL DEFAULT FALSE,
    downloads_monthly BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Benchmark Runs & OpenComputeBench Observations
CREATE TABLE benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- NULL = Public community submission
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    synthetic_fixture BOOLEAN NOT NULL DEFAULT FALSE,
    schema_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    model_id VARCHAR(128) NOT NULL REFERENCES models(id),
    model_revision VARCHAR(64) NOT NULL DEFAULT 'main',
    hardware_id VARCHAR(64) NOT NULL REFERENCES hardware(id),
    hardware_count INTEGER NOT NULL DEFAULT 1 CHECK (hardware_count > 0),
    runtime benchmark_runtime NOT NULL,
    runtime_version VARCHAR(50) NOT NULL,
    precision_type VARCHAR(20) NOT NULL,
    quantization_method VARCHAR(50),
    
    -- Workload
    prompt_tokens INTEGER NOT NULL,
    generated_tokens INTEGER NOT NULL,
    context_length INTEGER NOT NULL,
    batch_size INTEGER NOT NULL DEFAULT 1,
    concurrency INTEGER NOT NULL DEFAULT 1,
    
    -- Performance Metrics
    ttft_p50_ms NUMERIC(8, 2) NOT NULL,
    ttft_p95_ms NUMERIC(8, 2) NOT NULL,
    tpot_p50_ms NUMERIC(8, 2) NOT NULL,
    tpot_p95_ms NUMERIC(8, 2) NOT NULL,
    tokens_per_second NUMERIC(8, 2) NOT NULL,
    requests_per_second NUMERIC(8, 2) NOT NULL,
    peak_vram_bytes BIGINT NOT NULL,
    power_watts_avg NUMERIC(6, 2),
    sample_count INTEGER NOT NULL DEFAULT 1,
    
    -- Quality retention
    quality_benchmark VARCHAR(100),
    quality_score NUMERIC(6, 2),
    quality_retention NUMERIC(5, 4),
    
    -- Provenance & Security Hashing
    environment_hash VARCHAR(64) NOT NULL,
    result_hash VARCHAR(64) NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    runner_version VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    
    -- Verification
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    reproduction_count INTEGER NOT NULL DEFAULT 0,
    verified_by VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Customer Workloads (Tenant Private)
CREATE TABLE workloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model_id VARCHAR(128) NOT NULL REFERENCES models(id),
    target_ttft_ms NUMERIC(8, 2),
    target_tpot_ms NUMERIC(8, 2),
    target_concurrency INTEGER NOT NULL DEFAULT 1,
    context_length INTEGER NOT NULL DEFAULT 2048,
    monthly_budget_usd NUMERIC(10, 2),
    recommended_hardware_id VARCHAR(64) REFERENCES hardware(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Commercial Billing & Subscriptions
CREATE TABLE billing_customers (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    current_period_end TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Webhook Idempotency Log
CREATE TABLE stripe_events (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_benchmarks_model ON benchmarks(model_id);
CREATE INDEX idx_benchmarks_hardware ON benchmarks(hardware_id);
CREATE INDEX idx_benchmarks_public ON benchmarks(is_private, verification_status);
CREATE INDEX idx_benchmarks_env_hash ON benchmarks(environment_hash);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_memberships_org_user ON memberships(organization_id, user_id);

-- Check Constraint: synthetic fixtures can NEVER be verified
ALTER TABLE benchmarks ADD CONSTRAINT chk_synthetic_never_verified 
    CHECK (NOT (synthetic_fixture = TRUE AND verification_status = 'verified'));

-- Check Constraint: private benchmarks must belong to an organization
ALTER TABLE benchmarks ADD CONSTRAINT chk_private_requires_org 
    CHECK (NOT (is_private = TRUE AND organization_id IS NULL));

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE workloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public benchmarks are readable by ANYONE (even anonymous)
CREATE POLICY "Public benchmarks are publicly readable" 
    ON benchmarks FOR SELECT 
    USING (is_private = FALSE);

-- Private benchmarks are ONLY readable by members of that organization
CREATE POLICY "Private benchmarks accessible only by tenant members"
    ON benchmarks FOR SELECT
    TO authenticated
    USING (
        is_private = FALSE OR
        organization_id IN (
            SELECT organization_id FROM memberships WHERE user_id = auth.uid()
        )
    );

-- Workloads are strictly isolated by organization
CREATE POLICY "Tenant workload isolation" 
    ON workloads FOR ALL 
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM memberships WHERE user_id = auth.uid()
        )
    );

-- API keys are strictly accessible only by organization admins/owners
CREATE POLICY "API key tenant access"
    ON api_keys FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
