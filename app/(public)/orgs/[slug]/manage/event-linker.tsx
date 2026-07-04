"use client";

import { useTransition } from "react";
import { Plus, Check } from "lucide-react";
import { setEventOrgAction } from "./actions";
import { Button } from "@/components/ui/button";

type LinkableEvent = { id: string; title: string; attached: boolean };

function ToggleButton({
  orgId,
  slug,
  eventId,
  attached,
}: {
  orgId: string;
  slug: string;
  eventId: string;
  attached: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant={attached ? "outline" : "primary"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => setEventOrgAction(orgId, slug, eventId, !attached))
      }
    >
      {attached ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {attached ? "Added" : "Add"}
    </Button>
  );
}

export function EventLinker({
  orgId,
  slug,
  events,
}: {
  orgId: string;
  slug: string;
  events: LinkableEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted">
        You don&apos;t host any events yet. Create one, then add it here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between py-2">
          <span className="text-sm">{e.title}</span>
          <ToggleButton orgId={orgId} slug={slug} eventId={e.id} attached={e.attached} />
        </li>
      ))}
    </ul>
  );
}
