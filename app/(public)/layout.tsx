import { Navbar } from "@/components/navbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        Tikiti — a centralized platform for discovering and hosting free events.
      </footer>
    </>
  );
}
