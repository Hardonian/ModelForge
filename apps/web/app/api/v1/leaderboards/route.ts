import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "tokens_per_dollar";

  // Return categorized rankings
  const rankings = [
    {
      rank: 1,
      model: "Qwen/Qwen2.5-32B-Instruct",
      gpu: "NVIDIA L40S 48GB",
      precision: "FP8",
      tps: 72.4,
      costPer1m: 0.32,
      score: 94,
    },
    {
      rank: 2,
      model: "mistralai/Mistral-Nemo-Instruct-2407",
      gpu: "RTX 3090 24GB",
      precision: "FP16",
      tps: 58.1,
      costPer1m: 0.38,
      score: 91,
    },
    {
      rank: 3,
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      gpu: "RTX 4090 24GB",
      precision: "INT4",
      tps: 44.2,
      costPer1m: 0.45,
      score: 88,
    },
  ];

  return NextResponse.json({ category, rankings });
}
