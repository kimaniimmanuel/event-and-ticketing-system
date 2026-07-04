import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  "Music",
  "Technology",
  "Business",
  "Sports",
  "Arts & Culture",
  "Community",
  "Education",
  "Food & Drink",
  "Health & Wellness",
  "Religion",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding categories…");
  const categories = await Promise.all(
    CATEGORIES.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  console.log("Seeding demo users…");
  const passwordHash = await bcrypt.hash("password123", 10);
  const host = await prisma.user.upsert({
    where: { email: "host@tikiti.dev" },
    update: {},
    create: {
      email: "host@tikiti.dev",
      username: "demohost",
      name: "Demo Host",
      location: "Nairobi",
      passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { email: "attendee@tikiti.dev" },
    update: {},
    create: {
      email: "attendee@tikiti.dev",
      username: "demoattendee",
      name: "Demo Attendee",
      location: "Nairobi",
      passwordHash,
    },
  });

  console.log("Seeding demo events…");
  const tech = categories.find((c) => c.name === "Technology")!;
  const music = categories.find((c) => c.name === "Music")!;
  const community = categories.find((c) => c.name === "Community")!;

  const demoEvents = [
    {
      title: "Nairobi JS Meetup",
      description: "Monthly gathering of JavaScript and TypeScript developers in Nairobi.",
      categoryId: tech.id,
      format: "IN_PERSON",
      venue: "iHub, Nairobi",
      daysFromNow: 7,
      capacity: 80,
    },
    {
      title: "Sunset Acoustic Sessions",
      description: "An intimate evening of live acoustic music by local artists.",
      categoryId: music.id,
      format: "IN_PERSON",
      venue: "Arboretum Grounds",
      daysFromNow: 14,
      capacity: 150,
    },
    {
      title: "Community Cleanup Drive",
      description: "Join neighbours to clean up and green our shared spaces. Gloves provided.",
      categoryId: community.id,
      format: "IN_PERSON",
      venue: "Uhuru Park",
      daysFromNow: 3,
      capacity: null,
    },
  ];

  for (const e of demoEvents) {
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + e.daysFromNow);
    startAt.setHours(17, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        title: e.title,
        description: e.description,
        categoryId: e.categoryId,
        format: e.format,
        venue: e.venue,
        capacity: e.capacity,
        startAt,
        hostId: host.id,
        roles: { create: { userId: host.id, role: "HOST" } },
      },
    });
    console.log(`  • ${event.title}`);
  }

  console.log("Seeding demo organization with past + upcoming events…");
  const attendee = await prisma.user.findUnique({
    where: { email: "attendee@tikiti.dev" },
  });
  const org = await prisma.organization.upsert({
    where: { slug: "nairobi-tech-community" },
    update: {},
    create: {
      name: "Nairobi Tech Community",
      slug: "nairobi-tech-community",
      description:
        "A community hub for tech meetups, workshops, and hackathons across Nairobi.",
      ownerId: host.id,
      members: { create: { userId: host.id, role: "OWNER" } },
    },
  });

  // Only seed the org's events once (keeps re-running the seed idempotent).
  const orgEventCount = await prisma.event.count({ where: { organizationId: org.id } });
  if (orgEventCount === 0) {
    const orgEvents = [
      {
        title: "Community Launch Night",
        description: "Our very first meetup — lightning talks, demos, and networking.",
        daysFromNow: -45,
      },
      {
        title: "Intro to TypeScript Workshop",
        description: "A hands-on evening covering TypeScript fundamentals.",
        daysFromNow: -14,
      },
      {
        title: "Hack Night: Build with AI",
        description: "An evening of hacking on AI-powered apps. Bring a laptop.",
        daysFromNow: 21,
      },
    ];
    for (const e of orgEvents) {
      const startAt = new Date();
      startAt.setDate(startAt.getDate() + e.daysFromNow);
      startAt.setHours(18, 0, 0, 0);
      await prisma.event.create({
        data: {
          title: e.title,
          description: e.description,
          categoryId: tech.id,
          format: "IN_PERSON",
          venue: "iHub, Nairobi",
          capacity: 100,
          startAt,
          hostId: host.id,
          organizationId: org.id,
          roles: { create: { userId: host.id, role: "HOST" } },
        },
      });
    }
    if (attendee) {
      await prisma.organizationFollow.create({
        data: { userId: attendee.id, organizationId: org.id },
      });
    }
    console.log("  • Nairobi Tech Community (2 past, 1 upcoming event)");
  }

  console.log("Seed complete. Demo login: host@tikiti.dev / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
