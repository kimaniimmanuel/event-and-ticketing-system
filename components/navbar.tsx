import Link from "next/link";
import { Ticket } from "lucide-react";
import { auth, signOut } from "@/auth";
import { ButtonLink, Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Ticket className="h-5 w-5 text-primary" />
          Tikiti
        </Link>

        <nav className="flex items-center gap-2">
          <ButtonLink href="/events" variant="ghost" size="sm">
            Discover
          </ButtonLink>

          {user ? (
            <>
              <ButtonLink href="/events/new" variant="ghost" size="sm">
                Create event
              </ButtonLink>
              <ButtonLink href="/account/tickets" variant="ghost" size="sm">
                My tickets
              </ButtonLink>
              <ButtonLink href="/account" variant="outline" size="sm">
                {user.name ?? "Account"}
              </ButtonLink>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
