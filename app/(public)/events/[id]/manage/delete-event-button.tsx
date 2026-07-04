"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEventAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      "Delete this event? This permanently removes it and all its registrations.",
    );
    if (!confirmed) return;
    startTransition(() => deleteEventAction(eventId));
  }

  return (
    <Button variant="danger" onClick={onDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4" />
      {isPending ? "Deleting…" : "Delete event"}
    </Button>
  );
}
