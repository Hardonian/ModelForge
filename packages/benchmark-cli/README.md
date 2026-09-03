# modelforge CLI

The official OpenComputeBench benchmark agent, hardware intelligence inspector, and workload reproducibility tool.

## Installation

```bash
# Using uv (recommended)
uv tool install modelforge

# Or from source
cd packages/benchmark-cli
uv sync
uv run modelforge doctor
```

## Commands

```bash
modelforge inspect
modelforge hardware
modelforge model inspect Qwen/Qwen2.5-32B-Instruct
modelforge benchmark Qwen/Qwen2.5-32B-Instruct --runtime vllm --precision fp8
modelforge validate result.json
modelforge submit result.json
modelforge compare result1.json result2.json
modelforge doctor
```
