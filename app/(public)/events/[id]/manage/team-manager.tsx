"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { assignRoleAction, removeRoleAction, type RoleFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";

type Member = { userId: string; name: string; username: string; role: string };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Assign"}
    </Button>
  );
}

function RemoveButton({ eventId, userId }: { eventId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => removeRoleAction(eventId, userId))}
      disabled={isPending}
      className="text-muted hover:text-danger disabled:opacity-50"
      aria-label="Remove role"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function TeamManager({
  eventId,
  members,
  canManage,
}: {
  eventId: string;
  members: Member[];
  canManage: boolean;
}) {
  const [state, action] = useActionState<RoleFormState, FormData>(
    assignRoleAction.bind(null, eventId),
    {},
  );

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium">{m.name}</span>{" "}
              <span className="text-sm text-muted">@{m.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={m.role === "HOST" ? "bg-primary/10 text-primary" : ""}
              >
                {m.role.toLowerCase()}
              </Badge>
              {canManage && m.role !== "HOST" && (
                <RemoveButton eventId={eventId} userId={m.userId} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <form action={action} className="space-y-3 border-t border-border pt-4">
          {state.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              {state.success}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <Label htmlFor="role-email">Add a team member by email</Label>
              <Input id="role-email" name="email" type="email" placeholder="person@email.com" />
            </div>
            <div>
              <Label htmlFor="role-select">Role</Label>
              <Select id="role-select" name="role" defaultValue="VOLUNTEER">
                <option value="COHOST">Co-host</option>
                <option value="ADMIN">Admin</option>
                <option value="VOLUNTEER">Volunteer</option>
              </Select>
            </div>
            <AddButton />
          </div>
          <p className="text-xs text-muted">
            Co-hosts manage the event; admins can check in and edit; volunteers can check in only.
          </p>
        </form>
      )}
    </div>
  );
}
