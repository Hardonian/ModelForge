# Contributing to ModelForge

Thank you for contributing to ModelForge! We welcome contributions to the open compute intelligence layer for AI inference.

## Code of Conduct

All contributors and participants agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Monorepo Architecture

ModelForge is organized as a Turborepo monorepo with Node.js/TypeScript packages and a Python CLI:

- `apps/web`: Next.js 15 App Router web application
- `apps/hf-space`: Standalone Hugging Face Space application
- `packages/benchmark-schema`: Canonical Zod schemas and confidence algorithm
- `packages/hardware-registry`: Normalized accelerator hardware profiles
- `packages/model-fit`: Multi-dimensional ModelFit scoring
- `packages/optimizer`: Pareto frontier multi-objective optimization solver
- `packages/slo-compiler`: Workload compiler and deployment topology synthesizer
- `packages/database`: Data layer, Supabase migrations, and in-memory test store
- `packages/api-client`: TypeScript API client SDK
- `packages/benchmark-cli`: Python Typer CLI (`modelforge`) and MCP stdio server

## Development Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.12
- [uv](https://docs.astral.sh/uv/)

### Installation
```bash
# Clone the repository
git clone https://github.com/Hardonian/ModelForge.git
cd ModelForge

# Install Node.js dependencies
pnpm install

# Approve build scripts for pnpm 11+
pnpm approve-builds --all

# Build TypeScript packages
pnpm build

# Setup Python CLI environment
cd packages/benchmark-cli
uv sync
cd ../..
```

## Running Tests & Quality Checks

Before submitting a PR, ensure all quality gates pass:

```bash
# 1. Typecheck all packages
pnpm typecheck

# 2. Run TypeScript unit and integration tests
pnpm test

# 3. Lint web application
pnpm lint

# 4. Run Python CLI tests and MCP contract suite
cd packages/benchmark-cli
uv run pytest
uv run ruff check .
```

## Pull Request Guidelines

1. **Deterministic Tests**: Every new feature, benchmark parser, or runtime adapter must include automated tests.
2. **Provenance Accountability**: Synthetic fixtures must never be marked as `MEASURED` or `REPRODUCED`.
3. **Commit Messages**: Follow Conventional Commits format (e.g. `feat(cli): add hardware inspect command`, `fix(schema): validate golden benchmark flag`).
4. **DCO Signoff**: Please sign off commits using `git commit -s` indicating compliance with the Developer Certificate of Origin.
