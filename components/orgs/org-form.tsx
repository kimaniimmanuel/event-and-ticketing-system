"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgSchema, type OrgInput } from "@/lib/validators/org";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";

export type OrgActionResult = { errors?: Record<string, string[] | undefined> };

export function OrgForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues: Partial<OrgInput>;
  action: (input: OrgInput) => Promise<OrgActionResult>;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<OrgInput>({
    resolver: zodResolver(orgSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((data) => {
    setFormError(null);
    startTransition(async () => {
      const result = await action(data);
      if (result?.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages?.[0]) setError(field as keyof OrgInput, { message: messages[0] });
        }
        setFormError("Please fix the highlighted fields.");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
      )}
      <div>
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <ImageUpload
            id="logo"
            label="Logo (optional)"
            value={watch("logo") ?? ""}
            onChange={(url) => setValue("logo", url, { shouldValidate: true })}
          />
          <FieldError>{errors.logo?.message}</FieldError>
        </div>
        <div>
          <ImageUpload
            id="banner"
            label="Banner (optional)"
            value={watch("banner") ?? ""}
            onChange={(url) => setValue("banner", url, { shouldValidate: true })}
          />
          <FieldError>{errors.banner?.message}</FieldError>
        </div>
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
