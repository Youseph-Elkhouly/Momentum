import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as db from "@/lib/db";
import { COOKIE_CURRENT_PROJECT } from "@/lib/constants";

/** Mock transcription: accepts an MP3 file and returns placeholder transcript. Replace with real speech-to-text (e.g. Whisper) later. */
export async function POST(request: Request) {
  await (await cookies()).get(COOKIE_CURRENT_PROJECT)?.value;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") ?? formData?.get("audio");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Upload an MP3 file (field: file or audio)" }, { status: 400 });
  }
  const f = file as File;
  if (!f.name.toLowerCase().endsWith(".mp3") && !f.type?.includes("audio")) {
    return NextResponse.json({ error: "File must be MP3 or audio" }, { status: 400 });
  }
  // Mock transcript; in production call Whisper or similar
  const transcript =
    "[Transcription placeholder — add a speech-to-text API (e.g. OpenAI Whisper) for real transcription.]\n\n" +
    "You can paste or type notes below and use Generate Plan.";
  return NextResponse.json({ transcript });
}
