import { cookies } from "next/headers";
import { COOKIE_CURRENT_PROJECT } from "./constants";
import * as db from "./db";

export async function getCurrentProjectId(): Promise<string | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE_CURRENT_PROJECT)?.value ?? null;
  if (id && db.getProject(id)) return id;
  const first = db.listProjects()[0];
  return first?.id ?? null;
}

export async function setCurrentProjectId(projectId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CURRENT_PROJECT, projectId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
