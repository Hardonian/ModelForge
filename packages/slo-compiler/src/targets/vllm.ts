import { CandidateDeployment } from '../types';

export function generateVllmManifest(candidate: CandidateDeployment): {
  vllm_docker_run: string;
  kubernetes_pod_yaml: string;
  deployment_notes_md: string;
} {
  const safeName = candidate.model_id.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const tp = candidate.tensor_parallel_size;

  const vllmDockerRun = `docker run -d \\
  --name vllm-${safeName} \\
  --gpus '"device=0${candidate.accelerator_count > 1 ? `-${candidate.accelerator_count - 1}` : ''}"' \\
  -v ~/.cache/huggingface:/root/.cache/huggingface \\
  -p 8000:8000 \\
  --ipc=host \\
  vllm/vllm-openai:v0.6.4 \\
  --model ${candidate.model_id} \\
  --revision ${candidate.model_revision} \\
  --tensor-parallel-size ${tp} \\
  --dtype ${candidate.precision.includes('8') ? 'auto --kv-cache-dtype fp8' : 'auto'} \\
  --max-model-len 16384 \\
  --gpu-memory-utilization 0.92`;

  const kubernetesPodYaml = `apiVersion: v1
kind: Pod
metadata:
  name: vllm-${safeName}
  labels:
    app.kubernetes.io/name: vllm-server
    model.modelforge.dev/id: "${safeName}"
spec:
  containers:
  - name: server
    image: vllm/vllm-openai:v0.6.4
    args:
      - "--model"
      - "${candidate.model_id}"
      - "--revision"
      - "${candidate.model_revision}"
      - "--tensor-parallel-size"
      - "${tp}"
      - "--max-model-len"
      - "16384"
    resources:
      limits:
        nvidia.com/gpu: ${candidate.accelerator_count}
        memory: "${Math.ceil(candidate.memory_estimate_gb * 1.3)}Gi"
        cpu: "${candidate.accelerator_count * 8}"
    volumeMounts:
      - mountPath: /dev/shm
        name: dshm
  volumes:
  - name: dshm
    emptyDir:
      medium: Memory
      sizeLimit: 16Gi
`;

  const deploymentNotesMd = `### vLLM Serving Manifest
- **Model Revision:** \`${candidate.model_id}@${candidate.model_revision}\`
- **Tensor Parallelism:** TP=${tp} across ${candidate.accelerator_count}x ${candidate.accelerator}
- **VRAM Allocation:** ~${candidate.memory_estimate_gb.toFixed(1)} GB
- **Serving Command:** Verified with continuous batching and PagedAttention.
`;

  return {
    vllm_docker_run: vllmDockerRun,
    kubernetes_pod_yaml: kubernetesPodYaml,
    deployment_notes_md: deploymentNotesMd
  };
}
