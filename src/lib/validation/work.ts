import { z } from "zod";

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  parseTaskKey,
} from "@/lib/domain/work";

const uuidSchema = z.uuid("Enter a valid id");

const optionalUuidSchema = z
  .union([uuidSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

const optionalDateTimeSchema = z
  .union([z.iso.datetime({ offset: true }), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return new Date(value);
  });

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(5_000)
  .optional()
  .transform((value) => value || undefined);

export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const TaskPrioritySchema = z.enum(TASK_PRIORITIES);

export const TaskKeySchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => parseTaskKey(value) !== null, "Enter a task id like TAT-12")
  .transform((value) => parseTaskKey(value) as number);

export const CreateProjectInputSchema = z.strictObject({
  name: z.string().trim().min(1, "Project name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(40)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "Slug must use lowercase letters, numbers, and hyphens",
    ),
  description: optionalDescriptionSchema,
});

export const ArchiveProjectInputSchema = z.strictObject({
  projectId: uuidSchema,
});

export const CreateTaskInputSchema = z.strictObject({
  projectId: uuidSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalDescriptionSchema,
  status: TaskStatusSchema.default("todo"),
  priority: TaskPrioritySchema.default("none"),
  assigneeId: optionalUuidSchema,
  dueAt: optionalDateTimeSchema,
});

export const UpdateTaskInputSchema = z.strictObject({
  taskId: uuidSchema,
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  description: z
    .string()
    .trim()
    .max(5_000)
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  priority: TaskPrioritySchema.optional(),
  assigneeId: optionalUuidSchema,
  dueAt: optionalDateTimeSchema,
});

export const MoveTaskInputSchema = z.strictObject({
  taskId: uuidSchema,
  status: TaskStatusSchema,
  position: z.number().finite().min(0).max(1_000_000),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type ArchiveProjectInput = z.infer<typeof ArchiveProjectInputSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;
export type MoveTaskInput = z.infer<typeof MoveTaskInputSchema>;
