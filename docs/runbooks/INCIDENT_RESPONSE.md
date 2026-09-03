# MODELForge Operational Runbook: Incident Response & Emergency Rollback

## 1. Emergency Kill Switch Activation

If unexpected cluster mutation, degraded live inference, or security compromise occurs, immediately activate the global automation kill switch.

### CLI Procedure

```bash
# Activate global freeze
modelforge freeze activate --reason "P0 Incident: Latency degradation detected in production cluster" --org org_enterprise_alpha

# Verify status shows FROZEN
modelforge control status --org org_enterprise_alpha
```

### API Procedure

```bash
curl -X POST https://api.modelforge.dev/api/v1/control/freeze \
  -H "Authorization: Bearer $MODELFORGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org_enterprise_alpha",
    "scope": "global",
    "reason": "Security incident: Suspicious mutation request"
  }'
```

---

## 2. Emergency Canary Rollback

To immediately revert an in-flight canary deployment to the last known good configuration:

### CLI Procedure

```bash
modelforge action rollback act-1111-4111-8111-111111111111 --reason "Canary latency exceeded P95 threshold"
```

### Direct Cluster Restoration (Break-Glass)

If the ModelForge control plane is completely inaccessible:

1. Access the production Kubernetes cluster directly:

   ```bash
   kubectl -n inference get service qwen-serving-router -o yaml
   ```

2. Reset traffic split weights:

   ```bash
   kubectl -n inference patch service qwen-serving-router --type='json' -p='[{"op": "replace", "path": "/spec/trafficSplit/activePct", "value": 100}, {"op": "replace", "path": "/spec/trafficSplit/canaryPct", "value": 0}]'
   ```

3. Drain candidate pods:

   ```bash
   kubectl -n inference scale deployment qwen-candidate --replicas=0
   ```
