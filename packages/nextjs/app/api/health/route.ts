import { NextResponse } from "next/server";

// Lightweight, dependency-free liveness probe used by Railway's healthcheck and
// external uptime monitoring. Must never touch the DB/chain so it reflects
// process health only and returns fast even when downstreams are degraded.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "lunargistics-web",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
