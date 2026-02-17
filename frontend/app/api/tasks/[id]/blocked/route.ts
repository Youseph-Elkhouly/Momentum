import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await _request.json().catch(() => ({}));
  const blocked = body.blocked === true;
  const blocker_reason = (body.blocker_reason as string) ?? undefined;
  db.setTaskBlocked(id, blocked, blocker_reason);
  return NextResponse.json({ ok: true });
}
