import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const approvals = Array.from(mockStore.approvals.values())
    .filter((a) => a.project_id === projectId && a.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ approvals });
}
