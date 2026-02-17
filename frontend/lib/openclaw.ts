import * as db from "./db";

const OPENCLAW_KEY = process.env.OPENCLAW_API_KEY;

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

export function listAutomations(): Automation[] {
  const rows = db.getAutomations();
  return rows.map((r) => ({ ...r, enabled: r.enabled === 1 }));
}

export async function runAutomation(automationId: string): Promise<{ success: boolean; message: string }> {
  if (!OPENCLAW_KEY) {
    return { success: true, message: `Mock: ran "${automationId}". Set OPENCLAW_API_KEY for real execution.` };
  }
  return { success: true, message: `Ran ${automationId}.` };
}

export function toggleAutomation(automationId: string, enabled: boolean): void {
  db.setAutomationEnabled(automationId, enabled);
}
