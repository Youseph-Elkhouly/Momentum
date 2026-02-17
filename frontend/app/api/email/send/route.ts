import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  from?: string;
  provider?: "resend" | "himalaya" | "auto";
}

async function sendWithHimalaya(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Create raw email message for himalaya
  const emailMessage = `From: work.youseph@gmail.com
To: ${to}
Subject: ${subject}

${body}`;

  try {
    // Write message to temp file and send via himalaya
    const { writeFileSync, unlinkSync } = await import("fs");
    const tempFile = `/tmp/himalaya-email-${Date.now()}.eml`;
    writeFileSync(tempFile, emailMessage);

    try {
      const { stdout, stderr } = await execAsync(
        `cat "${tempFile}" | himalaya message send 2>&1`,
        { timeout: 30000 }
      );
      console.log("Himalaya send output:", stdout);
      if (stderr) console.log("Himalaya stderr:", stderr);
    } catch (sendError: unknown) {
      // Himalaya may return error if it can't save to Sent folder,
      // but the email is still sent via SMTP. Check for IMAP errors which are non-critical.
      const execError = sendError as { message?: string; stdout?: string; stderr?: string };
      const errStr = [execError.message, execError.stdout, execError.stderr].filter(Boolean).join(" ");
      if (errStr.includes("cannot add IMAP message") || errStr.includes("Folder doesn't exist")) {
        console.log("Himalaya: Email sent but failed to save to Sent folder (non-critical)");
        // Email was sent, just couldn't save to Sent - this is OK
      } else {
        throw sendError;
      }
    }

    // Clean up temp file
    try { unlinkSync(tempFile); } catch {}

    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Himalaya send error:", errMsg);
    return { success: false, error: errMsg };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, from, provider = "auto" } = (await req.json()) as EmailRequest;

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    // Try providers in order based on configuration
    const providers: Array<"resend" | "himalaya" | "demo"> =
      provider === "resend" ? ["resend", "demo"] :
      provider === "himalaya" ? ["himalaya", "demo"] :
      resend ? ["resend", "himalaya", "demo"] : ["himalaya", "demo"];

    for (const p of providers) {
      if (p === "resend" && resend) {
        const { data, error } = await resend.emails.send({
          from: from || "Momentum <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          text: body,
        });

        if (!error) {
          return NextResponse.json({
            success: true,
            messageId: data?.id,
            provider: "resend",
          });
        }
        console.error("Resend error, trying next provider:", error);
      }

      if (p === "himalaya") {
        const result = await sendWithHimalaya(to, subject, body);
        if (result.success) {
          return NextResponse.json({
            success: true,
            messageId: `himalaya_${Date.now()}`,
            provider: "himalaya",
          });
        }
        console.log("Himalaya not available, trying next provider:", result.error);
      }

      if (p === "demo") {
        // Demo mode: just log and return success
        console.log("=== DEMO EMAIL ===");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Body:", body);
        console.log("==================");

        return NextResponse.json({
          success: true,
          messageId: `demo_${Date.now()}`,
          provider: "demo",
          note: "Email logged to console. Set RESEND_API_KEY or configure himalaya to send real emails.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      messageId: `demo_${Date.now()}`,
      provider: "demo",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
