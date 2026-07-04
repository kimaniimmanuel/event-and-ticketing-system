import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, orgs] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      select: { id: true, createdAt: true },
    }),
    prisma.organization.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ["", "/events", "/orgs", "/login", "/signup"].map(
    (path) => ({ url: `${appUrl}${path}`, changeFrequency: "daily", priority: 0.7 }),
  );

  const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${appUrl}/events/${e.id}`,
    lastModified: e.createdAt,
  }));

  const orgRoutes: MetadataRoute.Sitemap = orgs.map((o) => ({
    url: `${appUrl}/orgs/${o.slug}`,
  }));

  return [...staticRoutes, ...eventRoutes, ...orgRoutes];
}
