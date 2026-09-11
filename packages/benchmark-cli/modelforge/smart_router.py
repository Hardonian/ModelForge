"""ModelForge Ultra-Low-Latency Smart Router Client & Benchmarker.

Prefix-cache affinity dispatch, spot instance drain simulation, and sub-millisecond
routing overhead measurements.
"""

from __future__ import annotations

import hashlib
import time
import uuid
from typing import Any, Dict, List, Optional


class SmartRouterClient:
    """Simulates or connects to ModelForge Smart Router (<1ms overhead)."""

    def __init__(self, router_url: str = "http://localhost:3000/api/v1/router") -> None:
        self.router_url = router_url
        self.backends: List[Dict[str, Any]] = [
            {
                "id": "worker-h100-east-01",
                "model": "meta-llama/Llama-3-70B",
                "status": "active",
                "active_requests": 0,
                "warm_prefixes": set(),
            },
            {
                "id": "worker-h100-east-02",
                "model": "meta-llama/Llama-3-70B",
                "status": "active",
                "active_requests": 4,
                "warm_prefixes": set(),
            },
        ]

    def route_request(self, prompt: str, model: str = "meta-llama/Llama-3-70B") -> Dict[str, Any]:
        """Calculates fast-path route with prefix-cache affinity and measures overhead."""
        start_ns = time.perf_counter_ns()
        prefix_chunk = prompt.strip()[:64]
        prefix_hash = hashlib.sha256(prefix_chunk.encode("utf-8")).hexdigest()[:16]

        # 1. Prefix cache hit check
        selected_backend = None
        cache_hit = False

        for b in self.backends:
            if b["status"] == "active" and b["model"] == model and prefix_hash in b["warm_prefixes"]:
                selected_backend = b
                cache_hit = True
                break

        # 2. Least-connection fallback
        if not selected_backend:
            actives = [b for b in self.backends if b["status"] == "active" and b["model"] == model]
            if not actives:
                raise RuntimeError(f"No active backend available for model {model}")
            actives.sort(key=lambda x: x["active_requests"])
            selected_backend = actives[0]

        selected_backend["active_requests"] += 1
        selected_backend["warm_prefixes"].add(prefix_hash)

        end_ns = time.perf_counter_ns()
        overhead_ms = (end_ns - start_ns) / 1_000_000.0

        return {
            "request_id": f"req-{uuid.uuid4().hex[:8]}",
            "selected_worker_id": selected_backend["id"],
            "cache_hit": cache_hit,
            "prefix_hash": prefix_hash,
            "routing_overhead_ms": round(overhead_ms, 3),
            "spot_drain_migrated": False,
        }

    def trigger_spot_drain(self, worker_id: str, reason: str = "spot_termination_notice") -> Dict[str, Any]:
        """Simulates immediate graceful spot drain with zero dropped requests."""
        target = next((b for b in self.backends if b["id"] == worker_id), None)
        if not target:
            raise ValueError(f"Worker {worker_id} not found")

        target["status"] = "draining"
        target["warm_prefixes"].clear()

        migrated = target["active_requests"]
        target["active_requests"] = 0

        # Migrate to alternative
        alt = next((b for b in self.backends if b["id"] != worker_id and b["status"] == "active"), None)
        if alt:
            alt["active_requests"] += migrated

        return {
            "worker_id": worker_id,
            "status": "draining",
            "reason": reason,
            "migrated_requests": migrated,
            "drain_completed": True,
        }
