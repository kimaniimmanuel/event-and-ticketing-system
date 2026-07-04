"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { cancelRegistrationAction } from "./actions";
import { Button } from "@/components/ui/button";

export function CancelRegistrationButton({
  registrationId,
}: {
  registrationId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function onCancel() {
    const ok = window.confirm(
      "Cancel your registration? Your ticket will be invalidated and your spot freed.",
    );
    if (!ok) return;
    startTransition(() => cancelRegistrationAction(registrationId));
  }

  return (
    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
      <X className="h-4 w-4" />
      {isPending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
