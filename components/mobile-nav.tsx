"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-border/50">
      {children}
    </Link>
  );
}

export function MobileNav({
  user,
  signOutAction,
}: {
  user: { name: string | null } | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-border bg-surface p-2 shadow-lg"
            onClick={() => setOpen(false)}
          >
            <MobileLink href="/events">Discover</MobileLink>
            <MobileLink href="/orgs">Organizations</MobileLink>
            {user ? (
              <>
                <MobileLink href="/events/new">Create event</MobileLink>
                <MobileLink href="/account/tickets">My tickets</MobileLink>
                <MobileLink href="/account">{user.name ?? "Account"}</MobileLink>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-border/50"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <MobileLink href="/login">Log in</MobileLink>
                <MobileLink href="/signup">Sign up</MobileLink>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
