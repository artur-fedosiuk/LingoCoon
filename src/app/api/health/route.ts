import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: "ok" | "degraded" | "down"; latencyMs?: number; detail?: string }> = {};

  // Database check
  try {
    const supabase = await createClient();
    const dbStart = Date.now();
    const { error } = await supabase.from("decks").select("id").limit(1);
    checks.database = {
      status: error ? "down" : "ok",
      latencyMs: Date.now() - dbStart,
      detail: error?.message,
    };
  } catch (e) {
    checks.database = {
      status: "down",
      detail: e instanceof Error ? e.message : "Unknown error",
    };
  }

  // TTS provider check (if configured)
  try {
    if (process.env.ELEVENLABS_API_KEY || process.env.AZURE_TTS_KEY) {
      checks.tts = { status: "ok", detail: "Provider key configured" };
    } else {
      checks.tts = { status: "degraded", detail: "No TTS provider configured" };
    }
  } catch {
    checks.tts = { status: "degraded", detail: "Check failed" };
  }

  // STT provider check (if configured)
  try {
    if (process.env.AZURE_STT_KEY || process.env.OPENAI_API_KEY) {
      checks.stt = { status: "ok", detail: "Provider key configured" };
    } else {
      checks.stt = { status: "degraded", detail: "No STT provider configured" };
    }
  } catch {
    checks.stt = { status: "degraded", detail: "Check failed" };
  }

  const hasDown = Object.values(checks).some((c) => c.status === "down");
  const hasDegraded = Object.values(checks).some((c) => c.status === "degraded");

  const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : "ok";
  const latencyMs = Date.now() - start;

  const response = NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latencyMs,
      checks,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      environment: process.env.NODE_ENV,
    },
    {
      status: overallStatus === "down" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Health-Check": "true",
      },
    }
  );

  return response;
}