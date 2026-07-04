"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { saveOnboardingAction } from "./actions";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save & continue"}
    </Button>
  );
}

export function OnboardingForm({
  categories,
  selectedIds,
}: {
  categories: Category[];
  selectedIds: string[];
}) {
  const selected = new Set(selectedIds);

  return (
    <form action={saveOnboardingAction} className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <label key={c.id} className="cursor-pointer">
            <input
              type="checkbox"
              name="categoryIds"
              value={c.id}
              defaultChecked={selected.has(c.id)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              {c.name}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <SaveButton />
        <Link href="/events" className="text-sm font-medium text-muted hover:underline">
          Skip for now
        </Link>
      </div>
    </form>
  );
}
