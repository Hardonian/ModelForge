import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ModelForge — The Open Compute Intelligence Layer for AI",
  description:
    "Find the optimal model + accelerator + runtime + precision + serving configuration for any AI workload. Powered by OpenComputeBench reproducible inference benchmarks.",
  keywords: [
    "LLM inference benchmarks",
    "GPU optimizer",
    "vLLM performance",
    "ModelFit",
    "NVIDIA H100 benchmarks",
    "L40S benchmarks",
    "RTX 4090 inference",
    "OpenComputeBench",
    "AI FinOps",
  ],
  authors: [{ name: "ModelForge Team" }],
  openGraph: {
    title: "ModelForge — The Open Compute Intelligence Layer for AI",
    description:
      "Given an AI model, workload, latency target, and budget, determine the optimal hardware + runtime configuration with reproducible empirical proof.",
    url: "https://modelforge.dev",
    siteName: "ModelForge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased glow-mesh selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
