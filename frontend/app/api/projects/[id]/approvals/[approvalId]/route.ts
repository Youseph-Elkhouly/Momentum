import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  const { approvalId } = await params;
  const body = await request.json();
  const { action } = body;

  const approval = mockStore.approvals.get(approvalId);
  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    // Update approval
    approval.status = "approved";
    approval.reviewed_by = "User";
    approval.reviewed_at = now;
    mockStore.approvals.set(approval.id, approval);

    // Update run and step
    const run = mockStore.runs.get(approval.run_id);
    if (run) {
      const step = run.steps.find((s) => s.id === approval.step_id);
      if (step) {
        step.status = "success";
        step.completed_at = now;
        step.duration_ms = 100;
      }

      // Check if all steps are complete
      const allComplete = run.steps.every((s) => s.status === "success" || s.status === "skipped");
      if (allComplete) {
        run.status = "success";
        run.completed_at = now;
        run.logs.push({
          id: mockStore.generateId("log"),
          run_id: run.id,
          timestamp: now,
          level: "info",
          message: "Run completed successfully after approval",
          metadata: null,
        });
      } else {
        run.status = "running";
        run.logs.push({
          id: mockStore.generateId("log"),
          run_id: run.id,
          timestamp: now,
          level: "info",
          message: "Approval granted, continuing run...",
          metadata: null,
        });
      }

      mockStore.runs.set(run.id, run);

      // Create tasks if this was a plan approval
      if (approval.type === "task_create" && step?.output) {
        const output = step.output as { tasks?: { title: string; priority: string }[] };
        if (output.tasks) {
          for (const taskData of output.tasks) {
            const taskId = mockStore.generateId("task");
            mockStore.tasks.set(taskId, {
              id: taskId,
              project_id: approval.project_id,
              title: taskData.title,
              description: null,
              priority: (taskData.priority as "P0" | "P1" | "P2" | "P3") || "P2",
              owner: "Agent",
              owner_type: "agent",
              due: null,
              status: "todo",
              stage: "approved",
              blocked: false,
              blocker_reason: null,
              acceptance_criteria: [],
              parent_task_id: null,
              created_by: "agent",
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      return NextResponse.json({ approval, run });
    }

    return NextResponse.json({ approval });
  }

  if (action === "reject") {
    approval.status = "rejected";
    approval.reviewed_by = "User";
    approval.reviewed_at = now;
    mockStore.approvals.set(approval.id, approval);

    // Update run
    const run = mockStore.runs.get(approval.run_id);
    if (run) {
      const step = run.steps.find((s) => s.id === approval.step_id);
      if (step) {
        step.status = "failed";
        step.error = "Rejected by user";
        step.completed_at = now;
      }

      run.status = "failed";
      run.completed_at = now;
      run.logs.push({
        id: mockStore.generateId("log"),
        run_id: run.id,
        timestamp: now,
        level: "warn",
        message: "Run cancelled - approval rejected",
        metadata: null,
      });

      mockStore.runs.set(run.id, run);
      return NextResponse.json({ approval, run });
    }

    return NextResponse.json({ approval });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
