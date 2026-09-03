# Contributing to ModelForge & OpenComputeBench

We welcome contributions across model intelligence, hardware adapters, serving runtimes, and empirical benchmark observations.

## Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Hardonian/ModelForge.git
   cd ModelForge
   ```

2. **Install Node & Python dependencies**:

   ```bash
   pnpm install
   cd packages/benchmark-cli
   uv sync --extra dev
   ```

3. **Verify local system health**:

   ```bash
   uv run modelforge doctor
   ```

4. **Run test suites**:

   ```bash
   pnpm test
   uv run pytest packages/benchmark-cli/tests
   ```

5. **Start local development server**:
   ```bash
   pnpm dev
   ```

## Contributing Benchmark Observations

1. Run benchmark on your GPU/accelerator:
   ```bash
   modelforge benchmark Qwen/Qwen2.5-32B-Instruct --runtime vllm --precision fp8 --output result.json
   ```
2. Validate cryptographic hash integrity:
   ```bash
   modelforge validate result.json
   ```
3. Submit to the network:
   ```bash
   modelforge submit result.json
   ```
