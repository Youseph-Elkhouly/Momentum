import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const automations = Array.from(mockStore.automations.values())
    .filter((a) => a.project_id === projectId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ automations });
}
