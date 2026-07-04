import { z } from "zod";

export const EVENT_FORMATS = ["IN_PERSON", "VIRTUAL"] as const;
export const EVENT_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
export const EVENT_RECURRENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;

export const eventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120),
    description: z.string().min(10, "Add a description (at least 10 characters)").max(5000),
    categoryId: z.string().min(1, "Select a category"),
    format: z.enum(EVENT_FORMATS),
    venue: z.string().max(200).optional().or(z.literal("")),
    virtualLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    startAt: z.string().min(1, "Start date and time is required"),
    endAt: z.string().optional().or(z.literal("")),
    registrationDeadline: z.string().optional().or(z.literal("")),
    capacity: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1_000_000),
        "Capacity must be a positive whole number",
      ),
    visibility: z.enum(EVENT_VISIBILITIES),
    recurrence: z.enum(EVENT_RECURRENCES),
    bannerImage: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
    logo: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.format === "IN_PERSON" && !data.venue) {
      ctx.addIssue({
        path: ["venue"],
        code: "custom",
        message: "Venue is required for in-person events",
      });
    }
    if (data.format === "VIRTUAL" && !data.virtualLink) {
      ctx.addIssue({
        path: ["virtualLink"],
        code: "custom",
        message: "A meeting link is required for virtual events",
      });
    }
    const start = new Date(data.startAt);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ path: ["startAt"], code: "custom", message: "Invalid date" });
    } else if (start.getTime() < Date.now()) {
      ctx.addIssue({
        path: ["startAt"],
        code: "custom",
        message: "Event date must be in the future",
      });
    }
    if (data.endAt) {
      const end = new Date(data.endAt);
      if (!Number.isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({
          path: ["endAt"],
          code: "custom",
          message: "End time must be after the start time",
        });
      }
    }
    if (data.registrationDeadline) {
      const deadline = new Date(data.registrationDeadline);
      if (!Number.isNaN(deadline.getTime()) && !Number.isNaN(start.getTime()) && deadline >= start) {
        ctx.addIssue({
          path: ["registrationDeadline"],
          code: "custom",
          message: "Registration must close before the event starts",
        });
      }
    }
  });

export type EventInput = z.infer<typeof eventSchema>;
