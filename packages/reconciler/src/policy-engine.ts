import {
  AutomationPolicy,
  ExecutionMode,
  ActionType,
  OptimizationAction,
  ChangeRisk,
} from "@modelforge/benchmark-schema";

export interface PolicyCheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PolicyDecision {
  allowed: boolean;
  requires_human_approval: boolean;
  denial_reasons: string[];
  checks: PolicyCheckResult[];
  effective_mode: ExecutionMode;
}

export class PolicyEngine {
  static evaluateAction(
    action: {
      action_type: ActionType;
      confidence: number;
      is_predicted: boolean;
      uncertainty_pct?: number;
      gpu_delta: number;
      projected_savings_pct: number;
      p95_latency_delta_pct: number;
      canary_traffic_pct: number;
      hourly_cost_usd: number;
      region?: string;
    },
    policy: AutomationPolicy,
    activeFreezes: Array<{ scope: string; target_id?: string; status: string }> = [],
    activeActionCount: number = 0
  ): PolicyDecision {
    const checks: PolicyCheckResult[] = [];
    const denialReasons: string[] = [];
    let requiresApproval = policy.mode !== "full_policy_automation";

    // 1. Freeze Window & Emergency Kill Switch Check
    const activeFreeze = activeFreezes.find(
      (f) => f.status === "active" && (f.scope === "global" || f.scope === "deployment")
    );
    if (activeFreeze) {
      checks.push({
        name: "emergency_freeze",
        passed: false,
        detail: "Emergency automation freeze or kill switch is active",
      });
      denialReasons.push("Emergency automation freeze is currently active");
    } else {
      checks.push({
        name: "emergency_freeze",
        passed: true,
        detail: "No active freeze windows blocking execution",
      });
    }

    // 2. Mode Check
    if (policy.mode === "advisory") {
      requiresApproval = true;
      checks.push({
        name: "execution_mode",
        passed: true,
        detail: "Policy is in ADVISORY mode; changes require manual execution or sign-off",
      });
    } else {
      checks.push({
        name: "execution_mode",
        passed: true,
        detail: `Policy mode is ${policy.mode}`,
      });
    }

    // 3. Action Class Check (allow vs approval_required vs deny)
    if (policy.changes.deny.includes(action.action_type)) {
      checks.push({
        name: "action_class",
        passed: false,
        detail: `Action type '${action.action_type}' is explicitly DENIED by policy`,
      });
      denialReasons.push(`Action type '${action.action_type}' is denied by organizational policy`);
    } else if (policy.changes.approval_required.includes(action.action_type)) {
      requiresApproval = true;
      checks.push({
        name: "action_class",
        passed: true,
        detail: `Action type '${action.action_type}' requires explicit human sign-off`,
      });
    } else if (policy.changes.allow.includes(action.action_type)) {
      if (policy.mode === "guarded_automation" || policy.mode === "full_policy_automation") {
        // Can be auto-allowed if other gates pass
        requiresApproval = false;
      }
      checks.push({
        name: "action_class",
        passed: true,
        detail: `Action type '${action.action_type}' is pre-authorized for automation`,
      });
    } else {
      requiresApproval = true;
      checks.push({
        name: "action_class",
        passed: true,
        detail: `Action type '${action.action_type}' is unclassified; defaulting to approval required`,
      });
    }

    // 4. Evidence & Confidence Gate
    if (action.confidence < policy.requirements.minimum_confidence) {
      checks.push({
        name: "confidence_threshold",
        passed: false,
        detail: `Confidence ${action.confidence}% is below required ${policy.requirements.minimum_confidence}%`,
      });
      denialReasons.push(
        `Confidence ${action.confidence}% does not meet minimum threshold of ${policy.requirements.minimum_confidence}%`
      );
    } else {
      checks.push({
        name: "confidence_threshold",
        passed: true,
        detail: `Confidence ${action.confidence}% meets requirement (${policy.requirements.minimum_confidence}%)`,
      });
    }

    // 5. Prediction Uncertainty Gate
    if (action.is_predicted) {
      if (!policy.requirements.predictions_allowed) {
        checks.push({
          name: "prediction_allowed",
          passed: false,
          detail: "Predictions are disallowed by organizational policy; verified benchmarks required",
        });
        denialReasons.push("Predictions are disabled in policy");
      } else if (
        action.uncertainty_pct !== undefined &&
        action.uncertainty_pct > policy.requirements.prediction_max_uncertainty_percent
      ) {
        checks.push({
          name: "prediction_uncertainty",
          passed: false,
          detail: `Prediction uncertainty ${action.uncertainty_pct}% exceeds max ${policy.requirements.prediction_max_uncertainty_percent}%`,
        });
        denialReasons.push("Prediction uncertainty exceeds acceptable threshold");
      } else {
        checks.push({
          name: "prediction_uncertainty",
          passed: true,
          detail: "Prediction uncertainty is within allowable limits",
        });
      }
    }

    // 6. Blast Radius Gates
    if (action.canary_traffic_pct > policy.blast_radius.max_canary_percent) {
      checks.push({
        name: "max_canary_traffic",
        passed: false,
        detail: `Initial canary traffic ${action.canary_traffic_pct}% exceeds max ${policy.blast_radius.max_canary_percent}%`,
      });
      denialReasons.push("Initial canary traffic exceeds blast radius limit");
    } else {
      checks.push({
        name: "max_canary_traffic",
        passed: true,
        detail: `Canary traffic ${action.canary_traffic_pct}% is within limit (${policy.blast_radius.max_canary_percent}%)`,
      });
    }

    if (Math.abs(action.gpu_delta) > policy.blast_radius.max_gpu_change) {
      checks.push({
        name: "max_gpu_change",
        passed: false,
        detail: `GPU delta ${action.gpu_delta} exceeds max change ${policy.blast_radius.max_gpu_change}`,
      });
      denialReasons.push("GPU allocation delta exceeds blast radius limit");
    } else {
      checks.push({
        name: "max_gpu_change",
        passed: true,
        detail: `GPU delta ${action.gpu_delta} is within allowed limit`,
      });
    }

    if (action.hourly_cost_usd > policy.blast_radius.max_spend_usd_hour) {
      checks.push({
        name: "max_hourly_spend",
        passed: false,
        detail: `Hourly spend $${action.hourly_cost_usd}/hr exceeds max budget $${policy.blast_radius.max_spend_usd_hour}/hr`,
      });
      denialReasons.push("Candidate configuration exceeds maximum hourly spend threshold");
    } else {
      checks.push({
        name: "max_hourly_spend",
        passed: true,
        detail: `Hourly spend $${action.hourly_cost_usd}/hr is within budget`,
      });
    }

    if (activeActionCount >= policy.blast_radius.max_simultaneous_actions) {
      checks.push({
        name: "concurrency_limit",
        passed: false,
        detail: `Active actions (${activeActionCount}) reached concurrency cap (${policy.blast_radius.max_simultaneous_actions})`,
      });
      denialReasons.push("Maximum concurrent automated actions reached");
    } else {
      checks.push({
        name: "concurrency_limit",
        passed: true,
        detail: "Action concurrency limit not exceeded",
      });
    }

    // 7. SLO Gate
    if (action.p95_latency_delta_pct > policy.slo.max_p95_regression_percent) {
      checks.push({
        name: "slo_regression_limit",
        passed: false,
        detail: `Projected latency delta +${action.p95_latency_delta_pct}% exceeds max allowed regression +${policy.slo.max_p95_regression_percent}%`,
      });
      denialReasons.push("Projected latency regression violates SLO policy");
    } else {
      checks.push({
        name: "slo_regression_limit",
        passed: true,
        detail: "Projected latency satisfies SLO constraints",
      });
    }

    // 8. Regional Data Residency
    if (action.region && !policy.allowed_regions.includes(action.region)) {
      checks.push({
        name: "region_residency",
        passed: false,
        detail: `Target region '${action.region}' is not in allowed regions [${policy.allowed_regions.join(", ")}]`,
      });
      denialReasons.push(`Target region '${action.region}' violates regional policy`);
    }

    const allowed = denialReasons.length === 0;

    return {
      allowed,
      requires_human_approval: requiresApproval,
      denial_reasons: denialReasons,
      checks,
      effective_mode: policy.mode,
    };
  }
}
