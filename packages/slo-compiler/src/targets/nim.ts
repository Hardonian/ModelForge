import { CandidateDeployment } from '../types';

export function generateNimManifest(candidate: CandidateDeployment): {
  nim_compose_yaml: string;
  env_example: string;
  deployment_notes_md: string;
} {
  const safeModelTag = candidate.model_id.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const nimImage = `nvcr.io/nim/${candidate.model_id.toLowerCase().replace('/', '-')}:latest`;

  const nimComposeYaml = `version: '3.8'

services:
  nim-service:
    image: ${nimImage}
    container_name: nim-${safeModelTag}
    restart: unless-stopped
    environment:
      - NGC_API_KEY=\${NGC_API_KEY}
      - HF_TOKEN=\${HF_TOKEN}
      - MODEL_NAME=${candidate.model_id}
      - TENSOR_PARALLEL_SIZE=${candidate.tensor_parallel_size}
      - PIPELINE_PARALLEL_SIZE=${candidate.pipeline_parallel_size}
      - PRECISION=${candidate.precision}
      - NIM_CACHE_DIR=/opt/nim/.cache
    volumes:
      - ~/.cache/nim:/opt/nim/.cache
    ports:
      - "8000:8000"
    ipc: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${candidate.accelerator_count}
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/v1/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
`;

  const envExample = `# NVIDIA NIM Container Configuration
NGC_API_KEY=nvapi-your-key-here
HF_TOKEN=hf_your-huggingface-token-here
NIM_HTTP_PORT=8000
`;

  const deploymentNotesMd = `### NVIDIA NIM Serving Deployment Notes
- **Model Revision:** \`${candidate.model_id}@${candidate.model_revision}\`
- **Target Container:** \`${nimImage}\`
- **GPU Requirement:** ${candidate.accelerator_count}x ${candidate.accelerator}
- **Health Probes:**
  - Liveness: \`GET http://localhost:8000/v1/health/live\`
  - Readiness: \`GET http://localhost:8000/v1/health/ready\`
- **OpenAI Compatible Endpoint:** \`POST http://localhost:8000/v1/chat/completions\`
`;

  return {
    nim_compose_yaml: nimComposeYaml,
    env_example: envExample,
    deployment_notes_md: deploymentNotesMd
  };
}
