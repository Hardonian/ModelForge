# Privacy Policy & Data Handling

ModelForge is designed with privacy-by-design principles for production AI engineering teams.

## Core Privacy Guarantees

1. **Zero Prompt & Output Logging**:
   ModelForge never captures, stores, or transmits the raw text of user prompts, inference outputs, or training datasets.
2. **Abstract Workload Fingerprinting**:
   Workload specifications are compiled using aggregate statistical distributions (e.g. mean token counts, arrival rates, concurrency) that preserve complete privacy of user data.
3. **Local-First CLI Execution**:
   The `modelforge` CLI runs entirely on your local machine or cluster. Telemetry is submitted to the public network only when explicitly invoked via `modelforge submit`.
4. **No Hidden Tracking**:
   We do not use invasive user tracking cookies or third-party fingerprinting scripts on our web properties or API endpoints.

## Telemetry & Benchmark Submissions

When you choose to submit a benchmark result to the OpenComputeBench network:
- Only hardware specifications, software/driver versions, and benchmark latency/throughput distributions are uploaded.
- Each submission is cryptographically hashed (`environment_hash` and `result_hash`) to guarantee authenticity.
- Submissions are publicly accessible under the CDLA-Permissive-2.0 license to advance open AI research.

## Questions & Contact

For inquiries regarding privacy practices or data handling, contact:
**privacy@modelforge.dev**
