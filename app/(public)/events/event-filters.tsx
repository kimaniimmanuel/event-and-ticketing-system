import Link from "next/link";
import { Search } from "lucide-react";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type FilterValues = {
  q?: string;
  category?: string;
  location?: string;
  format?: string;
};

/**
 * Plain GET form — submitting navigates to /events?… which the server page
 * reads from searchParams. No client JS required.
 */
export function EventFilters({
  categories,
  current,
}: {
  categories: { id: string; name: string }[];
  current: FilterValues;
}) {
  const hasFilters = Boolean(
    current.q || current.category || current.location || current.format,
  );

  return (
    <form
      method="get"
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <Label htmlFor="q">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            id="q"
            name="q"
            defaultValue={current.q}
            placeholder="Search events…"
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" name="category" defaultValue={current.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={current.location}
          placeholder="e.g. Nairobi"
        />
      </div>

      <div>
        <Label htmlFor="format">Format</Label>
        <Select id="format" name="format" defaultValue={current.format ?? ""}>
          <option value="">Any format</option>
          <option value="IN_PERSON">In person</option>
          <option value="VIRTUAL">Virtual</option>
        </Select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit">Apply filters</Button>
        {hasFilters && (
          <Link
            href="/events"
            className="text-sm font-medium text-muted hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>
    </form>
  );
}
