import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const integrations = Array.from(mockStore.integrations.values())
    .filter((i) => i.project_id === projectId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ integrations });
}
