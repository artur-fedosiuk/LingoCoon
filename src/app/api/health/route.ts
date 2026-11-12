import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness only. Deliberately exposes no database, provider, environment or error details.
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
