import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const base = cn(
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary",
    className,
  );

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn(base, "object-cover")} />;
  }
  return <span className={base}>{initials(name)}</span>;
}
