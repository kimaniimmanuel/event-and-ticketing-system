"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type AuthFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthFormState, FormData>(signupAction, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FieldError>{state.errors?.name?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
        <FieldError>{state.errors?.username?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.errors?.email?.[0]}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError>{state.errors?.password?.[0]}</FieldError>
      </div>
      <SubmitButton />
    </form>
  );
}
