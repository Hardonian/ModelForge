import { NextRequest, NextResponse } from "next/server";
import { smartRouterInstance } from "../../shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const model = body.model || "meta-llama/Llama-3-70B";
    const messages = body.messages || [];
    const promptText =
      messages.length > 0
        ? messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")
        : body.prompt || "Hello model";

    const { route, backend } = smartRouterInstance.route(promptText, model);

    // Simulated LLM response for router proxy
    const responsePayload = {
      id: `chatcmpl-${route.request_id}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `[ModelForge Smart Router Dispatch via ${backend.id}] Response generated with ${route.cache_hit ? "KV-cache hit" : "cold prefill"} in ${route.routing_overhead_ms}ms router overhead.`,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: Math.round(promptText.length / 4),
        completion_tokens: 32,
        total_tokens: Math.round(promptText.length / 4) + 32,
      },
      modelforge: {
        routed_worker_id: backend.id,
        cache_hit: route.cache_hit,
        prefix_hash: route.prefix_hash,
        routing_overhead_ms: route.routing_overhead_ms,
      },
    };

    smartRouterInstance.completeRequest(backend.id);

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "x-modelforge-worker-id": backend.id,
        "x-modelforge-cache-hit": route.cache_hit ? "true" : "false",
        "x-modelforge-router-latency-ms": String(route.routing_overhead_ms),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
