import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processDueJobs } from "@/lib/automations/engine";

function authorized(header: string | null, secret: string): boolean {
  const provided = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/** Called every minute by the Supabase scheduler to send delayed and retried emails. */
export async function POST(req: Request) {
  const secret = process.env.AUTOMATION_CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 404 });
  if (!authorized(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ processed: await processDueJobs(50) });
  } catch (e) {
    console.error("[automations] scheduled run failed", e);
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}
