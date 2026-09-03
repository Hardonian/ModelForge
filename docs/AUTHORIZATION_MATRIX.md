# MODELForge Role-Based Access Control (RBAC) & Authorization Matrix

## 1. Role Definitions

ModelForge enforces strict server-side authorization across six distinct organizational roles:

1. **Viewer**: Read-only observer. Access to benchmark results, compute passports, model fit cards, and high-level deployment status.
2. **Developer**: Inference engineer. Can profile models, run local benchmarks, inspect workloads, and generate What-If reconciliation plans.
3. **Operator**: Site Reliability Engineer (SRE). Authorized to monitor live canary telemetry, trigger emergency rollbacks, and manage automation freezes.
4. **Approver**: Infrastructure architect or release manager. Authorized to evaluate risk and sign off on planned optimization actions.
5. **Admin**: Organizational administrator. Manages automation policies, provider integrations, API keys, and team membership.
6. **Owner**: Account holder. Owns billing entitlements, organization lifecycle, and enterprise cluster delegations.

---

## 2. Privileged Operations Matrix

| Resource / Action | Endpoint / Method | Viewer | Developer | Operator | Approver | Admin | Owner |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Benchmarks & Passports** | `GET /api/v1/benchmarks` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Workload ModelFit & Plans** | `POST /api/v1/plans` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Submit Benchmark (Worker)** | `POST /api/v1/benchmark-submissions` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Inspect Deployment State** | `GET /api/v1/control/deployments` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Plan Reconciliation (Dry-Run)** | `POST /api/v1/control/deployments/[id]/reconcile` | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Approve Optimization Action** | `POST /api/v1/control/actions/[id]/approve` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Execute Approved Canary** | `POST /api/v1/control/actions/[id]/execute` | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Emergency Action Rollback** | `POST /api/v1/control/actions/[id]/rollback` | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Activate Emergency Freeze** | `POST /api/v1/control/freeze` | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Lift Emergency Freeze** | `DELETE /api/v1/control/freeze` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Update Automation Policy** | `PUT /api/v1/control/policies` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Manage Provider Credentials** | Kubernetes / NVIDIA API Secrets | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Billing & Subscriptions** | Stripe Webhooks & Portal | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 3. Server-Side Enforcement Invariants

1. **Client Role Agnostic**: The frontend interface hides or disables buttons for convenience, but all authorization checks are strictly validated on the server via session tokens or signed API keys.
2. **Dual-Approval for Critical Risk**: Any optimization action categorized as `HIGH` risk (e.g., model revision upgrade, GPU family migration, cross-region failover) requires an explicit signature from an account with the `Approver` or `Admin` role distinct from the creator.
3. **Tenant Context Immutability**: All requests validate that the authenticated user's `organization_id` strictly matches the target deployment's `organization_id`. Cross-tenant mutations are rejected with `AUTHORIZATION_ERROR`.
