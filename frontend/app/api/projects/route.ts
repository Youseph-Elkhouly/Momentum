import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET() {
  const list = db.listProjects();
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, goal, deadline } = body as { name?: string; goal?: string; deadline?: string };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const id = `proj-${Date.now()}`;
    db.createProject(id, name.trim(), goal?.trim(), deadline?.trim());
    const project = db.getProject(id);
    return NextResponse.json(project);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
