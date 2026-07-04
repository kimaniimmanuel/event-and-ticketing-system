"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { X, Copy, Check } from "lucide-react";
import { addInviteAction, removeInviteAction, type InviteFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add"}
    </Button>
  );
}

function RemoveInvite({ eventId, email }: { eventId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => removeInviteAction(eventId, email))}
      disabled={isPending}
      className="text-muted hover:text-danger disabled:opacity-50"
      aria-label="Remove invite"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy invite link"}
    </button>
  );
}

export function InviteManager({
  eventId,
  inviteUrl,
  accessCode,
  invites,
}: {
  eventId: string;
  inviteUrl: string;
  accessCode: string;
  invites: string[];
}) {
  const [state, action] = useActionState<InviteFormState, FormData>(
    addInviteAction.bind(null, eventId),
    {},
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted">
          Share this link (anyone with it can register), or restrict to specific emails below.
        </p>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <code className="truncate text-sm">{inviteUrl}</code>
          <CopyLink url={inviteUrl} />
        </div>
        <p className="text-xs text-muted">
          Access code: <span className="font-mono font-semibold">{accessCode}</span>
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium">Invite-only email allowlist</p>
        {invites.length > 0 ? (
          <ul className="mb-3 divide-y divide-border">
            {invites.map((email) => (
              <li key={email} className="flex items-center justify-between py-2 text-sm">
                <span>{email}</span>
                <RemoveInvite eventId={eventId} email={email} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-muted">
            No email restrictions — anyone with the link or code can register.
          </p>
        )}

        <form action={action} className="space-y-2">
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="invite-email">Add permitted email</Label>
              <Input id="invite-email" name="email" type="email" placeholder="guest@email.com" />
            </div>
            <AddButton />
          </div>
        </form>
      </div>
    </div>
  );
}
