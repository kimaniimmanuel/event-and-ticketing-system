"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { addOrgAdminAction, removeOrgAdminAction, type OrgAdminState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";

type Member = { userId: string; name: string; username: string; role: string };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add admin"}
    </Button>
  );
}

function RemoveButton({
  orgId,
  slug,
  userId,
}: {
  orgId: string;
  slug: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => removeOrgAdminAction(orgId, slug, userId))}
      disabled={isPending}
      className="text-muted hover:text-danger disabled:opacity-50"
      aria-label="Remove admin"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function AdminManager({
  orgId,
  slug,
  members,
  canManage,
}: {
  orgId: string;
  slug: string;
  members: Member[];
  canManage: boolean;
}) {
  const [state, action] = useActionState<OrgAdminState, FormData>(
    addOrgAdminAction.bind(null, orgId, slug),
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
              <Badge className={m.role === "OWNER" ? "bg-primary/10 text-primary" : ""}>
                {m.role.toLowerCase()}
              </Badge>
              {canManage && m.role !== "OWNER" && (
                <RemoveButton orgId={orgId} slug={slug} userId={m.userId} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <form action={action} className="space-y-2 border-t border-border pt-4">
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="admin-email">Add an admin by email</Label>
              <Input id="admin-email" name="email" type="email" placeholder="person@email.com" />
            </div>
            <AddButton />
          </div>
        </form>
      )}
    </div>
  );
}
