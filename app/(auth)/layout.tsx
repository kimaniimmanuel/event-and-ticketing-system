import Link from "next/link";
import { Ticket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Tikiti</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
