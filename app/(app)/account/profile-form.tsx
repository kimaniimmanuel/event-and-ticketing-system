"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction, type ProfileFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

type Profile = {
  name: string;
  username: string;
  location: string | null;
  avatar: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      )}
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={profile.name} required />
        <FieldError>{state.errors?.name?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={profile.username} required />
        <FieldError>{state.errors?.username?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder="e.g. Nairobi"
        />
        <FieldError>{state.errors?.location?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="avatar">Avatar image URL</Label>
        <Input
          id="avatar"
          name="avatar"
          type="url"
          defaultValue={profile.avatar ?? ""}
          placeholder="https://…"
        />
        <FieldError>{state.errors?.avatar?.[0]}</FieldError>
      </div>
      <SaveButton />
    </form>
  );
}
