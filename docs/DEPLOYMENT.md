# Deployment Guide

## Production Deployment Runbook

### 1. Web Application Deployment (Vercel)

The Next.js application in `apps/web` is production-ready for deployment on Vercel.

1. **Import Monorepo**: Connect your GitHub repository to Vercel.
2. **Root Directory**: Set Root Directory to `apps/web` or leave as `/` with framework preset Next.js.
3. **Build Command**:
   ```bash
   pnpm --filter @modelforge/web build
   ```
4. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://modelforge.dev`).
   - `STRIPE_SECRET_KEY`: Server-side secret key.
   - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret.
   - `DATABASE_URL`: PostgreSQL connection string (Supabase / Neon).
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for backend queries.

### 2. Database & Migrations (Supabase / PostgreSQL)

1. Apply the initial schema:
   ```bash
   psql $DATABASE_URL -f supabase/migrations/20250101000000_init_schema.sql
   ```
2. Populate deterministic seed catalog:
   ```bash
   psql $DATABASE_URL -f supabase/seed.sql
   ```
3. Row Level Security (RLS) is enabled by default.

### 3. Hugging Face Space Deployment

1. Create a new Space on [Hugging Face](https://huggingface.co/new-space) with the **Gradio** SDK.
2. Deploy the contents of `apps/hf-space`:
   ```bash
   cd apps/hf-space
   git remote add hf https://huggingface.co/spaces/YOUR_ORG/modelforge
   git push hf main
   ```

### 4. Docker Compose Local Development

For running PostgreSQL locally:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```
