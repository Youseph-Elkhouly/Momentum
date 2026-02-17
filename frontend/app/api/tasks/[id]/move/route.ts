import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await _request.json().catch(() => ({}));
  const column_id = body.column_id as string | undefined;
  if (!column_id || !["todo", "doing", "done"].includes(column_id)) {
    return NextResponse.json({ error: "column_id must be todo, doing, or done" }, { status: 400 });
  }
  db.updateTaskColumn(id, column_id);
  return NextResponse.json({ ok: true });
}
