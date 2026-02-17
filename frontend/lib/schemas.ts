import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["P0", "P1", "P2"]).optional(),
  owner: z.string().optional(),
  due: z.string().optional(),
  column_id: z.enum(["todo", "doing", "done"]).optional(),
  blocked: z.boolean().optional(),
  blocker_reason: z.string().optional(),
});

export const PlanResponseSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  preferences: z.array(z.string()),
  tasks: z.array(TaskSchema.extend({ column_id: z.enum(["todo", "doing", "done"]) })),
  blockers: z.array(z.object({ task_id: z.string(), reason: z.string() })).optional(),
  open_questions: z.array(z.string()).optional(),
  next_meeting_agenda: z.array(z.string()).optional(),
});

export const UpdateResponseSchema = z.object({
  task_updates: z.array(z.object({
    task_id: z.string(),
    column_id: z.enum(["todo", "doing", "done"]).optional(),
    blocked: z.boolean().optional(),
    blocker_reason: z.string().optional(),
  })),
  new_tasks: z.array(TaskSchema.extend({ column_id: z.enum(["todo", "doing", "done"]) })).optional(),
  blockers: z.array(z.object({ task_id: z.string(), reason: z.string() })).optional(),
  summary: z.string().optional(),
});

export const AskResponseSchema = z.object({
  answer: z.string(),
  sources_used: z.array(z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    content: z.string(),
  })),
});

export const ApplyBodySchema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(["P0", "P1", "P2"]).optional(),
    column_id: z.enum(["todo", "doing", "done"]).optional(),
  })),
  decisions: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;
export type UpdateResponse = z.infer<typeof UpdateResponseSchema>;
export type AskResponse = z.infer<typeof AskResponseSchema>;
export type ApplyBody = z.infer<typeof ApplyBodySchema>;
