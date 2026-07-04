"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/validators/event";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";

type Category = { id: string; name: string };

export type EventActionResult = { errors?: Record<string, string[] | undefined> };

export function EventForm({
  categories,
  defaultValues,
  action,
  submitLabel,
}: {
  categories: Category[];
  defaultValues: Partial<EventInput>;
  action: (input: EventInput) => Promise<EventActionResult>;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      format: "IN_PERSON",
      visibility: "PUBLIC",
      recurrence: "NONE",
      ...defaultValues,
    },
  });

  const format = watch("format");

  const onSubmit = handleSubmit((data) => {
    setFormError(null);
    startTransition(async () => {
      const result = await action(data);
      // On success the action redirects; only errors return here.
      if (result?.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages?.[0]) {
            setError(field as keyof EventInput, { message: messages[0] });
          }
        }
        setFormError("Please fix the highlighted fields.");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {formError && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
      )}

      <div>
        <Label htmlFor="title">Event title</Label>
        <Input id="title" {...register("title")} />
        <FieldError>{errors.title?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError>{errors.categoryId?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="format">Format</Label>
          <Select id="format" {...register("format")}>
            <option value="IN_PERSON">In person</option>
            <option value="VIRTUAL">Virtual</option>
          </Select>
          <FieldError>{errors.format?.message}</FieldError>
        </div>
      </div>

      {format === "VIRTUAL" ? (
        <div>
          <Label htmlFor="virtualLink">Meeting link</Label>
          <Input id="virtualLink" placeholder="https://…" {...register("virtualLink")} />
          <FieldError>{errors.virtualLink?.message}</FieldError>
        </div>
      ) : (
        <div>
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" placeholder="e.g. iHub, Nairobi" {...register("venue")} />
          <FieldError>{errors.venue?.message}</FieldError>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startAt">Starts</Label>
          <Input id="startAt" type="datetime-local" {...register("startAt")} />
          <FieldError>{errors.startAt?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="endAt">Ends (optional)</Label>
          <Input id="endAt" type="datetime-local" {...register("endAt")} />
          <FieldError>{errors.endAt?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="registrationDeadline">Registration closes (optional)</Label>
        <Input
          id="registrationDeadline"
          type="datetime-local"
          {...register("registrationDeadline")}
        />
        <p className="mt-1 text-xs text-muted">
          Leave blank to accept registrations until the event starts.
        </p>
        <FieldError>{errors.registrationDeadline?.message}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="capacity">Capacity (optional)</Label>
          <Input id="capacity" type="number" min={1} {...register("capacity")} />
          <FieldError>{errors.capacity?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select id="visibility" {...register("visibility")}>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private (invite only)</option>
          </Select>
          <FieldError>{errors.visibility?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="recurrence">Recurrence</Label>
          <Select id="recurrence" {...register("recurrence")}>
            <option value="NONE">One-time</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </Select>
          <FieldError>{errors.recurrence?.message}</FieldError>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bannerImage">Banner image URL (optional)</Label>
          <Input id="bannerImage" placeholder="https://…" {...register("bannerImage")} />
          <FieldError>{errors.bannerImage?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="logo">Logo URL (optional)</Label>
          <Input id="logo" placeholder="https://…" {...register("logo")} />
          <FieldError>{errors.logo?.message}</FieldError>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
